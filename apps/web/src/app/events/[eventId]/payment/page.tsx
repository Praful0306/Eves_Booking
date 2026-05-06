'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, Timer, Zap, ArrowLeft, Receipt,
  Calendar, ChevronRight, AlertTriangle
} from 'lucide-react';
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
  type: SimType; label: string; icon: React.ReactNode; desc: string;
  border: string; bg: string; textColor: string; iconColor: string;
}[] = [
  {
    type: 'success', label: 'Confirm Payment',
    icon: <CheckCircle2 className="w-5 h-5" />,
    desc: 'All seats atomically booked. Each uses SELECT FOR UPDATE.',
    border: 'border-emerald-200', bg: 'bg-emerald-50 hover:bg-emerald-100/70',
    textColor: 'text-emerald-700', iconColor: 'text-emerald-600',
  },
  {
    type: 'failure', label: 'Simulate Failure',
    icon: <XCircle className="w-5 h-5" />,
    desc: 'Payment gateway declines. All seats released back to pool.',
    border: 'border-red-200', bg: 'bg-red-50 hover:bg-red-100/70',
    textColor: 'text-red-700', iconColor: 'text-red-600',
  },
  {
    type: 'timeout', label: 'Simulate Timeout',
    icon: <Timer className="w-5 h-5" />,
    desc: 'Connection drops mid-payment. Locks released after grace period.',
    border: 'border-amber-200', bg: 'bg-amber-50 hover:bg-amber-100/70',
    textColor: 'text-amber-700', iconColor: 'text-amber-600',
  },
  {
    type: 'crash', label: 'Simulate Crash',
    icon: <Zap className="w-5 h-5" />,
    desc: 'Server dies mid-payment. Phantom locks — recovery worker cleans up in ~10s.',
    border: 'border-slate-200', bg: 'bg-slate-50 hover:bg-slate-100/70',
    textColor: 'text-slate-700', iconColor: 'text-slate-600',
  },
];

export default function PaymentPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { myLocksArray, clearMyLocks } = useSeatStore();

  const [draft, setDraft] = useState<DraftLock[]>([]);
  const [loading, setLoading] = useState<SimType | null>(null);
  const [crashShown, setCrashShown] = useState(false);

  useEffect(() => {
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
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="card p-12 shadow-sm">
          <div className="text-5xl mb-5">🎟️</div>
          <h2 className="font-display font-bold text-slate-900 text-2xl mb-2">No seats selected</h2>
          <p className="text-slate-400 text-sm mb-7">Go back to the event and select seats first.</p>
          <Link href={`/events/${eventId}`} className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Select Seats
          </Link>
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
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Back link */}
          <Link href={`/events/${eventId}`}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to seat map
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="label-eyebrow mb-2">Checkout</div>
            <h1 className="font-display font-black text-slate-900 text-4xl mb-2">Payment Simulation</h1>
            <p className="text-slate-400 text-sm">
              Demonstrate real-world payment scenarios. Each button calls a real backend endpoint.
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr_360px] gap-6">

            {/* Scenario buttons */}
            <div className="space-y-5">
              <div>
                <p className="label-eyebrow mb-4">Choose a scenario</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {simulations.map(sim => (
                    <motion.button
                      key={sim.type}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSimulate(sim.type)}
                      disabled={!!loading || (!draft.length && !crashShown)}
                      className={`card flex flex-col items-start gap-3 p-5 text-left transition-all duration-200 ${sim.bg} ${sim.border} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <div className={`flex items-center gap-2.5 ${sim.iconColor}`}>
                        {sim.icon}
                        <span className={`font-bold text-sm ${sim.textColor}`}>
                          {loading === sim.type ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Processing…
                            </span>
                          ) : sim.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{sim.desc}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Crash banner */}
              <AnimatePresence>
                {crashShown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="card border-orange-200 bg-orange-50/50 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1">Server crash simulated</h3>
                        <p className="text-slate-500 text-sm mb-3">
                          Booking stuck in PENDING. Phantom locks remain in Redis. The BullMQ recovery worker
                          detects expired locks every 10 seconds and releases them — never touching BOOKED seats.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Link href="/bookings" className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                            View My Bookings <ChevronRight className="w-3 h-3" />
                          </Link>
                          <Link href="/admin" className="btn-primary text-xs py-1.5 px-3">
                            Open Admin Dashboard
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Judge explainer */}
              <div className="card p-5">
                <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">For judges — what happens behind the scenes</p>
                <div className="space-y-2 text-xs text-slate-500">
                  <p><span className="text-emerald-600 font-semibold">Success:</span> Redis lock verified → PostgreSQL SELECT FOR UPDATE → BOOKED, never double-booked</p>
                  <p><span className="text-red-500 font-semibold">Failure/Timeout:</span> Lua script atomically releases lock → seat back to AVAILABLE → Socket.IO broadcasts</p>
                  <p><span className="text-orange-500 font-semibold">Crash:</span> Lock lingers as phantom → BullMQ worker detects expiry → releases only if NOT BOOKED</p>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Order Summary</h2>
                </div>

                {event && (
                  <div className="mb-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{EVENT_TYPE_ICONS[event.type] || '🎫'}</span>
                      <span className="font-display font-bold text-slate-900 text-sm">{event.title}</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(event.eventDate)}
                    </span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {draft.map(l => (
                    <div key={l.seatId} className="flex items-center justify-between text-sm py-1">
                      <span className="font-mono font-bold text-blue-600">{l.seatNumber}</span>
                      <span className="text-slate-500 font-medium">₹{SEAT_PRICE}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mb-4">
                  <span className="text-sm text-slate-400">{draft.length} seat{draft.length > 1 ? 's' : ''}</span>
                  <span className="font-display font-black text-slate-900 text-2xl">₹{totalAmount.toLocaleString()}</span>
                </div>

                {earliestExpiry && !crashShown && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-600 font-semibold mb-1.5">Earliest lock expiry</p>
                    <CountdownTimer expiresAt={earliestExpiry} onExpired={() => {
                      toast.error('Lock expired. Please re-select your seats.');
                      clearMyLocks();
                      router.push(`/events/${eventId}`);
                    }} />
                  </div>
                )}
              </div>

              <div className="card p-4">
                <p className="label-eyebrow mb-2">Session tokens</p>
                <p className="text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-slate-700">Session: </span>
                  <span className="font-mono">{draft[0]?.sessionId?.slice(0, 8) ?? '—'}…</span>
                </p>
                {draft.map(l => (
                  <p key={l.seatId} className="text-xs text-slate-400 font-mono">
                    {l.seatNumber}: {l.lockToken.slice(0, 8)}…
                  </p>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
