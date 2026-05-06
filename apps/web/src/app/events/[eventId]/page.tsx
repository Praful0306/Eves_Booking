'use client';
import { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, Calendar, X, ArrowRight, MousePointerClick, Radio } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSeatStore } from '@/store/seatStore';
import { useEventSocket } from '@/hooks/useSocket';
import { useLock } from '@/hooks/useLock';
import SeatGrid from '@/components/SeatGrid';
import CountdownTimer from '@/components/CountdownTimer';
import { formatDateTime, EVENT_TYPE_ICONS } from '@/lib/utils';

const SEAT_PRICE = 500;

export default function SeatSelectionPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { setSeats, myLocks, myLocksArray, earliestExpiry, removeMyLock, updateSeat, clearMyLocks } = useSeatStore();
  const [socketConnected, setSocketConnected] = useState(false);

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
    if (myLocks[seatId]) { await release(seatId); return; }
    await lock(seatId);
  };

  const handleReleaseAll = async () => {
    const items = locksArr.map(l => ({ seatId: l.seatId, sessionId: l.sessionId }));
    await releaseAll(items);
  };

  const handleProceedToPayment = () => {
    if (!locksArr.length) return;
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
    { label: 'Available', value: availability?.available ?? '—', color: 'text-emerald-600', dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Locked', value: availability?.locked ?? '—', color: 'text-yellow-600', dot: 'bg-yellow-400', bg: 'bg-yellow-50 border-yellow-100' },
    { label: 'Booked', value: availability?.booked ?? '—', color: 'text-red-500', dot: 'bg-red-500', bg: 'bg-red-50 border-red-100' },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Event header */}
        {event && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-2xl">{EVENT_TYPE_ICONS[event.type] || '🎫'}</span>
                  <h1 className="font-display font-black text-slate-900 text-2xl">{event.title}</h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.source && event.destination ? `${event.source} → ${event.destination}` : event.venue}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateTime(event.eventDate)}
                  </span>
                </div>
              </div>
              {availability && (
                <div className="flex gap-2 flex-wrap">
                  {availStats.map(s => (
                    <div key={s.label} className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${s.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                      <span className="text-xs text-slate-500">{s.label}</span>
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
              className="sticky top-16 z-30 mb-5 glass-card shadow-md p-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="font-bold text-slate-900 text-sm">
                      {locksArr.length} seat{locksArr.length > 1 ? 's' : ''} selected
                    </span>
                    {earliestExp && (
                      <span className="text-xs text-slate-400">
                        · earliest expires in{' '}
                        <CountdownTimer
                          expiresAt={earliestExp}
                          compact
                          onExpired={() => handleLockExpired(locksArr.find(l => l.expiresAt === earliestExp)?.seatId ?? '')}
                        />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {locksArr.map(l => (
                      <span key={l.seatId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold font-mono">
                        {l.seatNumber}
                        <button onClick={() => release(l.seatId)} disabled={releasing}
                          className="text-blue-300 hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-400">Total</div>
                    <div className="font-black text-slate-900 text-lg">₹{totalAmount.toLocaleString()}</div>
                  </div>
                  <button onClick={handleReleaseAll} disabled={releasing}
                    className="btn-ghost text-red-500 hover:text-red-600 text-xs px-3 py-2">
                    Release All
                  </button>
                  <button onClick={handleProceedToPayment} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
                    Payment <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* Seat Grid card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-slate-900 text-lg">Seat Map</h2>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <MousePointerClick className="w-3 h-3" />
                Click seats to select · click again to deselect
              </span>
            </div>

            {/* Stage indicator */}
            <div className="mb-6 text-center">
              <div className="inline-block px-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-400 font-mono font-semibold tracking-widest uppercase">
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
            <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-slate-100">
              {[
                { cls: 'seat-available', label: 'Available' },
                { cls: 'seat-locked', label: 'Locked by other' },
                { cls: 'seat-booked', label: 'Booked' },
                { cls: 'seat-mine', label: 'Your selection' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`seat-cell w-5 h-5 text-[0px] ${item.cls}`} style={{ minWidth: '1.25rem', minHeight: '1.25rem' }} />
                  <span className="text-xs text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {locksArr.length === 0 ? (
              <div className="card p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                  <MousePointerClick className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Click available seats</p>
                <p className="text-xs text-slate-400">You can select multiple seats</p>
                {!user && (
                  <p className="text-xs text-blue-600 mt-3 font-medium">Login required to book</p>
                )}
              </div>
            ) : (
              <div className="card border-blue-200 p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Selected Seats
                </h3>
                <div className="space-y-2.5 mb-4">
                  {locksArr.map(l => (
                    <div key={l.seatId} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                      <span className="font-mono font-bold text-blue-600">{l.seatNumber}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">₹{SEAT_PRICE}</span>
                        <CountdownTimer expiresAt={l.expiresAt} compact onExpired={() => handleLockExpired(l.seatId)} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-slate-100 mb-4">
                  <span className="text-slate-500">{locksArr.length} seat{locksArr.length > 1 ? 's' : ''} × ₹{SEAT_PRICE}</span>
                  <span className="font-black text-slate-900">₹{totalAmount.toLocaleString()}</span>
                </div>
                <button onClick={handleProceedToPayment} className="btn-primary w-full justify-center py-2.5 text-sm flex items-center gap-2">
                  Proceed to Payment
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* How it works */}
            <div className="card p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">How it works</p>
              {[
                'Select 1 or more available seats',
                'Each lock holds your seat for 5 min',
                'Proceed to payment before timer hits zero',
                'Expired locks auto-released every 10s',
                'All changes broadcast in real-time',
              ].map(tip => (
                <p key={tip} className="text-xs text-slate-400 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 shrink-0">•</span>{tip}
                </p>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              Live updates via Socket.IO
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
