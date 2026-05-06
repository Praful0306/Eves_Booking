'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, Plus, MapPin, Calendar, Grid3x3, ArrowRight, Ticket } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, formatDateTime } from '@/lib/utils';

const TYPES = ['ALL', 'TRAIN', 'BUS', 'CINEMA', 'EVENT', 'STADIUM'];

const TYPE_IMAGES: Record<string, string> = {
  TRAIN: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&q=80',
  BUS: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
  CINEMA: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80',
  EVENT: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80',
  STADIUM: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80',
};

const TYPE_COLORS: Record<string, string> = {
  TRAIN: 'bg-blue-100 text-blue-700 border-blue-200',
  BUS: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CINEMA: 'bg-violet-100 text-violet-700 border-violet-200',
  EVENT: 'bg-orange-100 text-orange-700 border-orange-200',
  STADIUM: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data.data),
  });

  const events = (data || []).filter((e: any) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.source?.toLowerCase().includes(search.toLowerCase()) ||
      e.destination?.toLowerCase().includes(search.toLowerCase()) ||
      e.venue?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="mb-10">
            <div className="label-eyebrow mb-3">Live Inventory</div>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-display font-black text-slate-900 text-4xl mb-2">
                  Pick an <span className="gradient-text">event</span>
                </h1>
                <p className="text-slate-400">Select an event to view the real-time seat map and start booking</p>
              </div>
              {user?.role === 'ADMIN' && (
                <Link href="/admin" className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Event
                </Link>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events, routes, venues…"
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                    typeFilter === t
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                  style={typeFilter === t ? { background: 'linear-gradient(135deg, #2563EB, #7C3AED)' } : {}}
                >
                  {t === 'ALL' ? 'All Types' : (EVENT_TYPE_LABELS[t] || t)}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card animate-pulse overflow-hidden">
                  <div className="h-48 bg-slate-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-20" />
                    <div className="h-5 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-7 h-7 text-slate-300" />
              </div>
              <p className="font-display font-bold text-slate-700 text-lg mb-1">No events found</p>
              <p className="text-slate-400 text-sm">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((event: any, i: number) => {
                const available = event._count
                  ? event._count.seats - event._count.bookings
                  : event.totalSeats;
                const pct = event.totalSeats > 0 ? (available / event.totalSeats) * 100 : 0;
                const fillColor = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500';
                const typeColor = TYPE_COLORS[event.type] || 'bg-slate-100 text-slate-600 border-slate-200';
                const imgUrl = TYPE_IMAGES[event.type] || TYPE_IMAGES['EVENT'];

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -4 }}
                  >
                    <Link
                      href={`/events/${event.id}`}
                      className="card block overflow-hidden group transition-all duration-300 hover:shadow-lg hover:border-slate-300"
                    >
                      {/* Image area */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={imgUrl}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                        {/* Type badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${typeColor}`}>
                            {EVENT_TYPE_ICONS[event.type] || '🎫'} {EVENT_TYPE_LABELS[event.type] || event.type}
                          </span>
                        </div>

                        {/* Bottom overlay */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <span className="font-mono text-white text-xs font-bold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                            {available} seats left
                          </span>
                          <span className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                          </span>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-5">
                        <h3 className="font-display font-bold text-slate-900 text-lg mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {event.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {event.source && event.destination
                              ? `${event.source} → ${event.destination}`
                              : event.venue || '—'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>{formatDateTime(event.eventDate)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-4">
                          <Grid3x3 className="w-3 h-3 shrink-0" />
                          <span>{event.rows} rows × {event.columns} cols = {event.totalSeats} seats</span>
                        </div>

                        {/* Availability bar */}
                        <div className="h-1 rounded-full bg-slate-100 overflow-hidden mb-3">
                          <div className={`h-full rounded-full transition-all ${fillColor}`} style={{ width: `${pct}%` }} />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">{pct.toFixed(0)}% available</span>
                          <span className="text-xs font-semibold text-blue-600 group-hover:gap-2 flex items-center gap-1 transition-all">
                            Select seats <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
