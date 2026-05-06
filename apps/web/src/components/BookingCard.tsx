'use client';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
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

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  CONFIRMED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  PENDING: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  CANCELLED: { bg: 'bg-red-50 border-red-200', text: 'text-red-600', dot: 'bg-red-500' },
};

export default function BookingCard({ booking }: { booking: Booking }) {
  const style = statusStyles[booking.bookingStatus] || {
    bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400'
  };

  return (
    <Link href={`/bookings/${booking.id}`}
      className="card block group transition-all duration-300 hover:shadow-md hover:border-slate-300 p-5">

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{EVENT_TYPE_ICONS[booking.event.type] || '🎫'}</span>
            <span className="font-display font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
              {booking.event.title}
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
            <Calendar className="w-3 h-3" />
            {formatDateTime(booking.event.eventDate)}
          </p>
          <p className="text-sm text-slate-500">
            Seat <span className="font-mono font-black text-slate-900">{booking.seat.seatNumber}</span>
          </p>
        </div>

        <div className="text-right shrink-0 flex flex-col items-end gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${style.bg} ${style.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {booking.bookingStatus}
          </span>
          <p className="font-black text-slate-900 text-sm">{formatCurrency(booking.amount)}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
          {booking.bookingCode}
        </span>
        <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-blue-500 transition-colors">
          {formatDateTime(booking.createdAt)}
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
