'use client';
import { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSeatStore } from '@/store/seatStore';
import { useEventSocket } from '@/hooks/useSocket';
import { useLock } from '@/hooks/useLock';
import SeatGrid from '@/components/SeatGrid';
import CountdownTimer from '@/components/CountdownTimer';
import { formatDateTime, EVENT_TYPE_ICONS } from '@/lib/utils';

const SEAT_PRICE = 500; // ₹ per seat

export default function SeatSelectionPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { setSeats, myLocks, myLocksArray, earliestExpiry, removeMyLock, updateSeat, clearMyLocks } = useSeatStore();
  const [socketConnected, setSocketConnected] = useState(false);

  // Stable session ID per tab
  const sessionId = useMemo(() => {
    const key = `eves_session_${eventId}`;
    let id = sessionStorage.getItem(key);
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(key, id); }
    return id;
  }, [eventId]);

  useEventSocket(eventId);

  const { data: eventData } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => api.get(`/events/${eventId}`).then(r => r.data.data),
  });

  const { data: seatsData, isLoading: seatsLoading } = useQuery({
    queryKey: ['seats', eventId],
    queryFn: () => api.get(`/events/${eventId}/seats`).then(r => r.data.data),
  });

  const { data: availability } = useQuery({
    queryKey: ['availability', eventId],
    queryFn: () => api.get(`/events/${eventId}/availability`).then(r => r.data.data),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (seatsData?.seats) setSeats(seatsData.seats);
  }, [seatsData]);

  // Persist draft to sessionStorage
  const locksArr = myLocksArray();
  useEffect(() => {
    sessionStorage.setItem(`eves_draft_${eventId}`, JSON.stringify(locksArr));
  }, [locksArr, eventId]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem(`eves_session_${eventId}`);
      sessionStorage.removeItem(`eves_draft_${eventId}`);
    };
  }, []);

  const { lock, release, releaseAll, locking, releasing } = useLock(sessionId);

  const handleSeatClick = async (seatId: string) => {
    if (!user) { toast.error('Please login to book a seat'); router.push('/login'); return; }

    // Already locked by me — toggle off (release)
    if (myLocks[seatId]) {
      await release(seatId);
      return;
    }
    await lock(seatId);
  };

  const handleReleaseAll = async () => {
    const items = locksArr.map(l => ({ seatId: l.seatId, sessionId: l.sessionId }));
    await releaseAll(items);
  };

  const handleProceedToPayment = () => {
    if (!locksArr.length) return;
    // Save draft in sessionStorage, navigate to payment
    sessionStorage.setItem(`eves_draft_${eventId}`, JSON.stringify(locksArr));
    router.push(`/events/${eventId}/payment`);
  };

  const handleLockExpired = (seatId: string) => {
    removeMyLock(seatId);
    updateSeat(seatId, { status: 'AVAILABLE', lockedBy: null, lockedUntil: null });
    toast.warning('A seat lock expired. Please re-select if needed.');
  };

  const event = eventData;
  const totalAmount = locksArr.length * SEAT_PRICE;
  const earliestExp = earliestExpiry();

  const availStats = [
    { label: 'Available', value: availability?.available ?? '—', color: 'text-emerald-400', dot: 'bg-emerald-500' },
    { label: 'Locked', value: availability?.locked ?? '—', color: 'text-yellow-400', dot: 'bg-yellow-500' },
    { label: 'Booked', value: availability?.booked ?? '—', color: 'text-red-400', dot: 'bg-red-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Event header */}
      {event && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-2xl">{EVENT_TYPE_ICONS[event.type] || '🎫'}</span>
                <h1 className="text-2xl font-black text-white">{event.title}</h1>
                {/* Live indicator */}
                <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-white/40 text-sm">
                {event.source && event.destination ? `${event.source} → ${event.destination}` : event.venue}
                {' · '}{formatDateTime(event.eventDate)}
              </p>
            </div>
            {availability && (
              <div className="flex gap-2 flex-wrap">
                {availStats.map(s => (
                  <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-xl">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                    <span className="text-xs text-white/40">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Sticky booking cart */}
      <AnimatePresence>
        {locksArr.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="sticky top-16 z-30 mb-5 glass-card border-violet-500/30 p-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                  <span className="font-bold text-white text-sm">{locksArr.length} seat{locksArr.length > 1 ? 's' : ''} selected</span>
                  {earliestExp && (
                    <span className="text-white/40 text-xs">·</span>
                  )}
                  {earliestExp && (
                    <span className="text-xs text-white/40">earliest expires in <CountdownTimer expiresAt={earliestExp} compact onExpired={() => handleLockExpired(locksArr.find(l => l.expiresAt === earliestExp)?.seatId ?? '')} /></span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {locksArr.map(l => (
                    <span key={l.seatId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold font-mono">
                      {l.seatNumber}
                      <button onClick={() => release(l.seatId)} disabled={releasing}
                        className="text-violet-400/60 hover:text-red-400 transition-colors ml-0.5">✕</button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-white/40">Total</div>
                  <div className="font-black text-white">₹{totalAmount.toLocaleString()}</div>
                </div>
                <button onClick={handleReleaseAll} disabled={releasing}
                  className="btn-ghost text-red-400/70 hover:text-red-400 text-xs px-3 py-2">
                  Release All
                </button>
                <button onClick={handleProceedToPayment}
                  className="btn-primary px-4 py-2 text-sm">
                  Proceed to Payment →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-[1fr_260px] gap-6">
        {/* Seat Grid */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-white">Seat Map</h2>
            <span className="text-xs text-white/30">Click seats to select · click again to deselect</span>
          </div>

          {/* Stage */}
          <div className="mb-5 text-center">
            <div className="inline-block px-8 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white/30 font-medium tracking-widest uppercase">
              {event?.type === 'CINEMA' ? '🎬 Screen' : event?.type === 'TRAIN' ? '🚂 Front' : '🏟️ Stage'}
            </div>
          </div>

          <SeatGrid
            rows={event?.rows || 10}
            columns={event?.columns || 8}
            onSeatClick={handleSeatClick}
            loading={seatsLoading || locking}
          />

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4">
            {[
              { cls: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400', label: 'Available' },
              { cls: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400', label: 'Locked by other' },
              { cls: 'bg-red-500/20 border-red-500/40 text-red-400', label: 'Booked' },
              { cls: 'bg-violet-500/30 border-violet-400/70 text-violet-300', label: 'Your selection' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`w-4 h-4 rounded-md border ${item.cls}`} />
                <span className="text-xs text-white/40">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {locksArr.length === 0 ? (
            <div className="glass-card p-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>
              </div>
              <p className="text-sm text-white/50 mb-1">Click available seats</p>
              <p className="text-xs text-white/30">You can select multiple seats</p>
              {!user && (
                <p className="text-xs text-[#4f8ef7] mt-3 font-medium">Login required to book</p>
              )}
            </div>
          ) : (
            <div className="glass-card p-5 border-violet-500/20">
              <h3 className="font-bold text-white text-sm mb-3">Selected Seats</h3>
              <div className="space-y-2 mb-4">
                {locksArr.map(l => (
                  <div key={l.seatId} className="flex items-center justify-between text-sm">
                    <span className="font-mono font-bold text-violet-300">{l.seatNumber}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">₹{SEAT_PRICE}</span>
                      <CountdownTimer expiresAt={l.expiresAt} compact onExpired={() => handleLockExpired(l.seatId)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-white/[0.06] mb-4">
                <span className="text-white/40">{locksArr.length} seat{locksArr.length > 1 ? 's' : ''} × ₹{SEAT_PRICE}</span>
                <span className="font-black text-white">₹{totalAmount.toLocaleString()}</span>
              </div>
              <button onClick={handleProceedToPayment} className="btn-primary w-full justify-center py-3 text-sm">
                Proceed to Payment →
              </button>
            </div>
          )}

          <div className="glass-card p-4 space-y-2">
            <p className="text-xs font-semibold text-white/60">How it works</p>
            {[
              'Select 1 or more available seats',
              'Each lock holds your seat for 5 min',
              'Proceed to payment before timer hits zero',
              'Expired locks auto-released every 10s',
              'All changes broadcast in real-time',
            ].map(tip => (
              <p key={tip} className="text-xs text-white/30 flex items-start gap-1.5">
                <span className="text-[#4f8ef7] mt-0.5 shrink-0">•</span>{tip}
              </p>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-white/30 px-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live updates via Socket.IO
          </div>
        </div>
      </div>
    </div>
  );
}
