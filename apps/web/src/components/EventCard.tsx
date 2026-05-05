'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDateTime, EVENT_TYPE_ICONS, EVENT_TYPE_LABELS } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  type: string;
  source?: string;
  destination?: string;
  venue?: string;
  eventDate: string;
  totalSeats: number;
  status: string;
  _count?: { seats: number; bookings: number };
}

export default function EventCard({ event }: { event: Event }) {
  const available = event._count
    ? event._count.seats - event._count.bookings
    : event.totalSeats;

  const pct = event.totalSeats > 0 ? (available / event.totalSeats) * 100 : 0;
  const fillColor = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
      <Link href={`/events/${event.id}`}
        className="block glass-card-hover p-5 group">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-lg">{EVENT_TYPE_ICONS[event.type] || '🎫'}</span>
              <span className="badge bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 text-[#4f8ef7]">
                {EVENT_TYPE_LABELS[event.type] || event.type}
              </span>
            </div>
            <h3 className="font-bold text-white truncate group-hover:text-[#4f8ef7] transition-colors">{event.title}</h3>
            <p className="text-sm text-white/40 mt-1 truncate">
              {event.source && event.destination
                ? `${event.source} → ${event.destination}`
                : event.venue || '—'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-xl font-black ${available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {available}
            </div>
            <div className="text-xs text-white/30">seats left</div>
          </div>
        </div>

        <div className="space-y-2">
          {/* Availability bar */}
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className={`h-full rounded-full transition-all ${fillColor}`} style={{ width: `${pct}%` }} />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30">{formatDateTime(event.eventDate)}</p>
            <span className="text-xs font-medium text-white/40 group-hover:text-[#4f8ef7] transition-colors">
              Select Seat →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
