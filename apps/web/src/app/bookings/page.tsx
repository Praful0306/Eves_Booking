'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Ticket, ArrowRight } from 'lucide-react';
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

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="mb-8">
            <div className="label-eyebrow mb-3">My Account</div>
            <h1 className="font-display font-black text-slate-900 text-4xl mb-2">
              My <span className="gradient-text">Bookings</span>
            </h1>
            <p className="text-slate-400">All your confirmed and past bookings</p>
          </div>

          {/* Group success banner */}
          {groupCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card border-emerald-200 bg-emerald-50/50 p-5 mb-6"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-bold text-emerald-700 text-sm mb-0.5">Payment Confirmed!</h2>
                  <p className="text-slate-500 text-xs mb-1">
                    Group Code: <span className="font-mono font-bold text-slate-700">{groupCode}</span>
                  </p>
                  <p className="text-slate-500 text-sm">
                    Your seats have been atomically confirmed using PostgreSQL SELECT FOR UPDATE — zero double-booking guaranteed.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                    </div>
                    <div className="h-6 bg-slate-100 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-7 h-7 text-slate-300" />
              </div>
              <p className="font-display font-bold text-slate-700 text-lg mb-1">No bookings yet</p>
              <p className="text-slate-400 text-sm mb-6">Browse events and lock some seats to get started</p>
              <button
                onClick={() => router.push('/events')}
                className="btn-primary inline-flex items-center gap-2"
              >
                Browse Events
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking: any, i: number) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <BookingCard booking={booking} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-400 font-mono text-sm">Loading…</div>
      </div>
    }>
      <BookingsContent />
    </Suspense>
  );
}
