'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDateTime, formatCurrency, EVENT_TYPE_ICONS } from '@/lib/utils';

const statusStyles: Record<string, { badge: string; header: string }> = {
  CONFIRMED: { badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', header: 'from-[#4f8ef7] to-[#7c3aed]' },
  PENDING: { badge: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', header: 'from-yellow-600 to-yellow-700' },
  CANCELLED: { badge: 'bg-red-500/10 border-red-500/20 text-red-400', header: 'from-red-700 to-red-800' },
};

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.get(`/bookings/${bookingId}`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="glass-card p-8 animate-pulse space-y-4">
          <div className="h-8 bg-white/[0.06] rounded w-1/3" />
          <div className="h-4 bg-white/[0.06] rounded w-1/2" />
          <div className="h-32 bg-white/[0.06] rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-red-400">Booking not found</p>
        <Link href="/bookings" className="text-[#4f8ef7] text-sm mt-2 block">← Back to bookings</Link>
      </div>
    );
  }

  const booking = data;
  const style = statusStyles[booking.bookingStatus] || { badge: 'bg-white/[0.06] border-white/10 text-white/50', header: 'from-white/10 to-white/5' };
  const isConfirmed = booking.bookingStatus === 'CONFIRMED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Ticket Card */}
        <div className="glass-card overflow-hidden">
          {/* Header gradient */}
          <div className={`px-6 py-6 bg-gradient-to-r ${style.header}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs font-medium mb-1 uppercase tracking-widest">Booking Code</p>
                <p className="text-white text-3xl font-black font-mono tracking-widest">{booking.bookingCode}</p>
              </div>
              <div className="text-4xl opacity-70">{EVENT_TYPE_ICONS[booking.event.type] || '🎫'}</div>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="relative flex items-center px-0">
            <div className="w-5 h-10 bg-[#050508] rounded-r-full" />
            <div className="flex-1 border-t-2 border-dashed border-white/[0.06]" />
            <div className="w-5 h-10 bg-[#050508] rounded-l-full" />
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Status</span>
              <span className={`badge border ${style.badge}`}>{booking.bookingStatus}</span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-sm text-white/40">Event</span>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{booking.event.title}</p>
                <p className="text-xs text-white/40 mt-0.5">{formatDateTime(booking.event.eventDate)}</p>
                {booking.event.source && (
                  <p className="text-xs text-white/30">{booking.event.source} → {booking.event.destination}</p>
                )}
                {booking.event.venue && <p className="text-xs text-white/30">{booking.event.venue}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Seat</span>
              <span className="text-sm font-bold text-white bg-white/[0.06] px-3 py-1 rounded-lg font-mono">
                {booking.seat.seatNumber}
                <span className="text-white/40 font-normal"> · Row {booking.seat.rowLabel}, Col {booking.seat.columnNumber}</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <span className="text-sm text-white/40">Amount Paid</span>
              <span className="text-xl font-black text-white">{formatCurrency(booking.amount)}</span>
            </div>

            {isConfirmed && (
              <div className="flex flex-col items-center py-5 border-t border-dashed border-white/[0.06]">
                <div className="w-24 h-24 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.06]">
                  <div className="grid grid-cols-3 gap-0.5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className={`w-5 h-5 rounded-sm ${i % 3 === 0 || i === 4 ? 'bg-white/80' : 'bg-transparent'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-white/30 mt-2">Show this at entry</p>
              </div>
            )}
          </div>

          {/* Payment history */}
          {booking.payments?.length > 0 && (
            <div className="px-6 pb-5 border-t border-white/[0.06]">
              <p className="text-xs font-semibold text-white/40 mb-2 pt-4 uppercase tracking-widest">Payment History</p>
              <div className="space-y-1.5">
                {booking.payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between text-xs">
                    <span className="text-white/40 font-mono">{p.simulationType}</span>
                    <span className={p.status === 'SUCCESS' ? 'text-emerald-400 font-semibold' : 'text-red-400'}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <Link href="/bookings" className="btn-outline flex-1 text-center">← All Bookings</Link>
          <Link href="/events" className="btn-primary flex-1 text-center">Book Another</Link>
        </div>
      </motion.div>
    </div>
  );
}
