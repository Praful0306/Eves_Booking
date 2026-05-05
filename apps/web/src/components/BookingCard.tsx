'use client';
import Link from 'next/link';
import { formatDateTime, formatCurrency, EVENT_TYPE_ICONS } from '@/lib/utils';

interface Booking {
  id: string;
  bookingCode: string;
  paymentStatus: string;
  bookingStatus: string;
  amount: number;
  createdAt: string;
  event: { id: string; title: string; type: string; eventDate: string };
  seat: { seatNumber: string; rowLabel: string; columnNumber: number };
}

const statusStyles: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  PENDING: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  CANCELLED: 'bg-red-500/10 border-red-500/20 text-red-400',
};

export default function BookingCard({ booking }: { booking: Booking }) {
  const statusStyle = statusStyles[booking.bookingStatus] || 'bg-white/[0.06] border-white/10 text-white/50';

  return (
    <Link href={`/bookings/${booking.id}`}
      className="block glass-card-hover p-5 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{EVENT_TYPE_ICONS[booking.event.type] || '🎫'}</span>
            <span className="font-bold text-white text-sm truncate group-hover:text-[#4f8ef7] transition-colors">
              {booking.event.title}
            </span>
          </div>
          <p className="text-xs text-white/40">{formatDateTime(booking.event.eventDate)}</p>
          <p className="text-sm font-medium text-white/60 mt-1">
            Seat <span className="text-white font-bold">{booking.seat.seatNumber}</span>
          </p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
          <span className={`badge border ${statusStyle}`}>
            {booking.bookingStatus}
          </span>
          <p className="text-sm font-bold text-white">{formatCurrency(booking.amount)}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-white/40 bg-white/[0.04] px-2 py-1 rounded-lg">
          {booking.bookingCode}
        </span>
        <span className="text-xs text-white/30">{formatDateTime(booking.createdAt)}</span>
      </div>
    </Link>
  );
}
