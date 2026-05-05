'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import BookingCard from '@/components/BookingCard';
import { Suspense } from 'react';

function BookingsContent() {
  const { user, init } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupCode = searchParams.get('group');

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (!user && typeof window !== 'undefined') router.push('/login');
  }, [user]);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => api.get('/bookings/my').then(r => r.data.data),
    enabled: !!user,
  });

  const bookings = data || [];

  // Group bookings by bookingCode prefix or show all
  const grouped = groupCode
    ? bookings.filter((b: any) => b.bookingCode?.startsWith('EVES-') || b.bookingCode === groupCode)
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <div className="section-label mb-3">My Account</div>
          <h1 className="text-3xl font-black text-white mb-1">My Bookings</h1>
          <p className="text-white/40 text-sm">All your confirmed and past bookings</p>
        </div>

        {/* Group banner */}
        {groupCode && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-5 border-emerald-500/20 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h2 className="font-bold text-emerald-400 text-sm">Payment Confirmed!</h2>
                <p className="text-white/40 text-xs">Group Code: <span className="font-mono text-white/60">{groupCode}</span></p>
              </div>
            </div>
            <p className="text-white/50 text-sm">Your seats have been atomically confirmed using PostgreSQL SELECT FOR UPDATE — zero double-booking guaranteed.</p>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-4 bg-white/[0.06] rounded w-2/3 mb-3" />
                <div className="h-4 bg-white/[0.06] rounded w-1/2 mb-2" />
                <div className="h-3 bg-white/[0.06] rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            </div>
            <p className="text-white/50 font-medium mb-1">No bookings yet</p>
            <p className="text-white/30 text-sm mb-5">Browse events and lock some seats to get started</p>
            <button onClick={() => router.push('/events')} className="btn-primary">Browse Events</button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking: any, i: number) => (
              <motion.div key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <BookingCard booking={booking} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-white/40">Loading…</div></div>}>
      <BookingsContent />
    </Suspense>
  );
}
