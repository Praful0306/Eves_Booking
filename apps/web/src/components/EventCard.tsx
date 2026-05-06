'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
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

const TYPE_COLORS: Record<string, string> = {
  TRAIN: 'bg-blue-50 text-blue-700 border-blue-100',
  BUS: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  CINEMA: 'bg-violet-50 text-violet-700 border-violet-100',
  EVENT: 'bg-orange-50 text-orange-700 border-orange-100',
  STADIUM: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export default function EventCard({ event }: { event: Event }) {
  const available = event._count
    ? event._count.seats - event._count.bookings
    : event.totalSeats;

  const pct = event.totalSeats > 0 ? (available / event.totalSeats) * 100 : 0;
  const fillColor = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500';
  const typeColor = TYPE_COLORS[event.type] || 'bg-slate-50 text-slate-600 border-slate-100';

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
      <Link href={`/events/${event.id}`}
        className="block card group transition-all duration-300 hover:shadow-md hover:border-slate-300 p-5">

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-lg">{EVENT_TYPE_ICONS[event.type] || '🎫'}</span>
              <span className={`badge border text-xs font-bold px-2 py-0.5 ${typeColor}`}>
                {EVENT_TYPE_LABELS[event.type] || event.type}
              </span>
            </div>
            <h3 className="font-display font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {event.title}
            </h3>
            <p className="text-sm text-slate-400 mt-1 truncate flex items-center gap-1.5">
              <MapPin className="w-3 h-3 shrink-0" />
              {event.source && event.destination
                ? `${event.source} → ${event.destination}`
                : event.venue || '—'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-xl font-black ${available > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {available}
            </div>
            <div className="text-xs text-slate-400">seats left</div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${fillColor}`} style={{ width: `${pct}%` }} />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDateTime(event.eventDate)}
            </p>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors flex items-center gap-1">
              Select seats <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
