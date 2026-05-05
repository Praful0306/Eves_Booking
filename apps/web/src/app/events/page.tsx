'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import EventCard from '@/components/EventCard';
import { EVENT_TYPE_LABELS } from '@/lib/utils';

const TYPES = ['ALL', 'TRAIN', 'BUS', 'CINEMA', 'EVENT', 'STADIUM'];

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

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
    <div className="max-w-6xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <div className="section-label mb-3">Live Events</div>
          <h1 className="text-3xl font-black text-white mb-1">Events & Bookings</h1>
          <p className="text-white/40 text-sm">Select an event to view the real-time seat map</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, routes, venues…"
              className="input-dark pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  typeFilter === t
                    ? 'bg-[#4f8ef7] text-white'
                    : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.08]'
                }`}>
                {t === 'ALL' ? 'All Types' : EVENT_TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-white/[0.06] rounded" />
                  <div className="h-4 bg-white/[0.06] rounded w-20" />
                </div>
                <div className="h-5 bg-white/[0.06] rounded w-3/4 mb-2" />
                <div className="h-4 bg-white/[0.06] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            </div>
            <p className="text-white/50 font-medium">No events found</p>
            <p className="text-white/30 text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event: any, i: number) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
