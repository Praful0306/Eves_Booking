'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { api, getApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSeatStore } from '@/store/seatStore';
import CountdownTimer from '@/components/CountdownTimer';
import { formatDateTime, EVENT_TYPE_ICONS } from '@/lib/utils';

type SimType = 'success' | 'failure' | 'timeout' | 'crash';

interface DraftLock {
  seatId: string;
  seatNumber: string;
  lockToken: string;
  expiresAt: string;
  sessionId: string;
  ttlSeconds: number;
}

const SEAT_PRICE = 500;

const simulations: {
  type: SimType; label: string; icon: string; desc: string;
  bg: string; border: string; textColor: string;
}[] = [
  {
    type: 'success', label: 'Confirm Payment',
    icon: '✅', desc: 'All seats atomically booked. Each uses SELECT FOR UPDATE.',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', border: 'border-emerald-500/30', textColor: 'text-emerald-400',
  },
  {
    type: 'failure', label: 'Simulate Failure',
    icon: '❌', desc: 'Payment gateway declines. All seats released back to pool.',
    bg: 'bg-red-500/10 hover:bg-red-500/20', border: 'border-red-500/30', textColor: 'text-red-400',
  },
  {
    type: 'timeout', label: 'Simulate Timeout',
    icon: '⏱️', desc: 'Connection drops mid-payment. Locks released after grace period.',
    bg: 'bg-orange-500/10 hover:bg-orange-500/20', border: 'border-orange-500/30', textColor: 'text-orange-400',
  },
  {
    type: 'crash', label: 'Simulate Server Crash',
    icon: '💥', desc: 'Server dies mid-payment. Phantom locks remain — recovery worker cleans up in ~10s.',
    bg: 'bg-white/[0.04] hover:bg-white/[0.08]', border: 'border-white/10', textColor: 'text-white/60',
  },
];

export default function PaymentPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { myLocksArray, clearMyLocks } = useSeatStore();

  // Load draft from store OR sessionStorage
  const [draft, setDraft] = useState<DraftLock[]>([]);
  const [loading, setLoading] = useState<SimType | null>(null);
  const [crashShown, setCrashShown] = useState(false);

  useEffect(() => {
    // Try store first, then sessionStorage fallback
    const fromStore = myLocksArray();
    if (fromStore.length > 0) {
      setDraft(fromStore as DraftLock[]);
    } else {
      try {
        const raw = sessionStorage.getItem(`eves_draft_${eventId}`);
        if (raw) setDraft(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const { data: eventData } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => api.get(`/events/${eventId}`).then(r => r.data.data),
  });

  if (!draft.length && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="glass-card p-10">
          <div className="text-4xl mb-4">🎟️</div>
          <h2 className="text-xl font-bold text-white mb-2">No seats selected</h2>
          <p className="text-white/40 text-sm mb-6">Go back to the event and select seats first.</p>
          <Link href={`/events/${eventId}`} className="btn-primary">← Select Seats</Link>
        </div>
      </div>
    );
  }

  const totalAmount = draft.length * SEAT_PRICE;
  const earliestExpiry = draft.reduce((earliest, l) =>
    !earliest || new Date(l.expiresAt) < new Date(earliest) ? l.expiresAt : earliest, '');

  const handleSimulate = async (type: SimType) => {
    if (!user || !draft.length) return;
    setLoading(type);
    setCrashShown(false);

    const items = draft.map(l => ({ seatId: l.seatId, sessionId: l.sessionId, lockToken: l.lockToken }));

    try {
      const endpoint = `/payments/simulate-${type}-bulk`;
      const res = await api.post(endpoint, { items, amount: totalAmount });
      const data = res.data.data;

      if (type === 'success') {
        clearMyLocks();
        sessionStorage.removeItem(`eves_draft_${eventId}`);
        toast.success(`${data.bookings.length} seat${data.bookings.length > 1 ? 's' : ''} booked! Code: ${data.bookingGroupCode}`);
        // Navigate to first booking for detail view
        router.push(`/bookings?group=${data.bookingGroupCode}`);
      } else if (type === 'crash') {
        setCrashShown(true);
        toast.warning('Crash simulated. Recovery worker will detect phantom locks within ~10s.');
      } else {
        clearMyLocks();
        sessionStorage.removeItem(`eves_draft_${eventId}`);
        toast.error(`Payment ${type}. All seats have been released.`);
        router.push(`/events/${eventId}`);
      }
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'LOCK_EXPIRED') {
        toast.error('One or more locks expired. Please re-select seats.');
        clearMyLocks();
        router.push(`/events/${eventId}`);
      } else {
        toast.error(getApiError(err));
      }
    } finally {
      setLoading(null);
    }
  };

  const event = eventData;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href={`/events/${eventId}`} className="text-white/30 hover:text-white/60 text-sm transition-colors">
          ← Back to seat map
        </Link>

        <div className="section-label mt-5 mb-4">Checkout</div>
        <h1 className="text-3xl font-black text-white mb-1">Payment Simulation</h1>
        <p className="text-white/40 text-sm mb-8">
          Demonstrate real-world payment scenarios for judges. Each button calls a real backend endpoint.
        </p>

        <div className="grid md:grid-cols-[1fr_340px] gap-6">
          {/* Scenario buttons */}
          <div className="space-y-4">
            <h2 className="font-bold text-white/60 text-xs uppercase tracking-widest">Choose a Scenario</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {simulations.map(sim => (
                <motion.button key={sim.type} whileTap={{ scale: 0.98 }}
                  onClick={() => handleSimulate(sim.type)}
                  disabled={!!loading || (!draft.length && !crashShown)}
                  className={`flex flex-col items-start gap-2 p-5 rounded-xl border transition-all duration-200 text-left ${sim.bg} ${sim.border} disabled:opacity-40 disabled:cursor-not-allowed`}>
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-lg">{sim.icon}</span>
                    <span className={`font-semibold text-sm ${sim.textColor}`}>
                      {loading === sim.type ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          Processing…
                        </span>
                      ) : sim.label}
                    </span>
                  </div>
                  <p className="text-xs text-white/30 leading-relaxed">{sim.desc}</p>
                </motion.button>
              ))}
            </div>

            {/* Crash banner */}
            <AnimatePresence>
              {crashShown && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="glass-card p-5 border-orange-500/20">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💥</span>
                    <div>
                      <h3 className="font-bold text-white mb-1">Server crash simulated</h3>
                      <p className="text-white/50 text-sm mb-3">
                        Booking stuck in PENDING. Phantom locks remain in Redis. The BullMQ recovery worker
                        detects expired locks every 10 seconds and releases them — never touching BOOKED seats.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link href="/bookings" className="btn-ghost text-xs py-1.5 px-3">View My Bookings</Link>
                        <Link href="/admin" className="btn-primary text-xs py-1.5 px-3">Open Admin Dashboard</Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Judge explainer */}
            <div className="glass-card p-4 text-xs text-white/40 space-y-1.5">
              <p className="font-semibold text-white/60">For judges — what happens behind the scenes</p>
              <p>• <span className="text-emerald-400 font-medium">Success</span>: Redis lock verified → PostgreSQL SELECT FOR UPDATE → BOOKED, never double-booked</p>
              <p>• <span className="text-red-400 font-medium">Failure/Timeout</span>: Lua script atomically releases lock → seat back to AVAILABLE → Socket.IO broadcasts</p>
              <p>• <span className="text-orange-400 font-medium">Crash</span>: Lock lingers as phantom → BullMQ worker detects expiry → releases only if NOT BOOKED</p>
            </div>
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white/60 text-xs uppercase tracking-widest mb-4">Order Summary</h2>

              {event && (
                <div className="mb-4 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{EVENT_TYPE_ICONS[event.type] || '🎫'}</span>
                    <span className="font-bold text-white text-sm">{event.title}</span>
                  </div>
                  <p className="text-xs text-white/40">{formatDateTime(event.eventDate)}</p>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {draft.map(l => (
                  <div key={l.seatId} className="flex items-center justify-between text-sm">
                    <span className="font-mono font-bold text-violet-300">{l.seatNumber}</span>
                    <span className="text-white/40">₹{SEAT_PRICE}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/[0.06] mb-4">
                <span className="text-sm text-white/40">{draft.length} seat{draft.length > 1 ? 's' : ''}</span>
                <span className="text-xl font-black text-white">₹{totalAmount.toLocaleString()}</span>
              </div>

              {/* Lock timer */}
              {earliestExpiry && !crashShown && (
                <div className="mt-2">
                  <p className="text-xs text-white/40 mb-1.5">Earliest lock expiry</p>
                  <CountdownTimer expiresAt={earliestExpiry} onExpired={() => {
                    toast.error('Lock expired. Please re-select your seats.');
                    clearMyLocks();
                    router.push(`/events/${eventId}`);
                  }} />
                </div>
              )}
            </div>

            <div className="glass-card p-4 space-y-2">
              <p className="text-xs text-white/40">
                <span className="text-white/60 font-semibold">Session: </span>
                <span className="font-mono">{draft[0]?.sessionId?.slice(0, 8) ?? '—'}…</span>
              </p>
              {draft.map(l => (
                <p key={l.seatId} className="text-xs text-white/40 font-mono">
                  {l.seatNumber}: {l.lockToken.slice(0, 8)}…
                </p>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
