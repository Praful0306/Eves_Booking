'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { api, getApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import AdminStats from '@/components/AdminStats';
import { formatDateTime, formatCountdown } from '@/lib/utils';

export default function AdminDashboard() {
  const { user, init } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.push('/');
    if (!user) router.push('/login');
  }, [user]);

  const { data: dashboard } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
    enabled: user?.role === 'ADMIN',
    refetchInterval: 10000,
  });

  const { data: locks } = useQuery({
    queryKey: ['admin', 'active-locks'],
    queryFn: () => api.get('/admin/active-locks').then(r => r.data.data),
    enabled: user?.role === 'ADMIN',
    refetchInterval: 5000,
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: () => api.get('/admin/bookings?limit=10').then(r => r.data.data),
    enabled: user?.role === 'ADMIN',
  });

  const { data: recoveryStats } = useQuery({
    queryKey: ['recovery', 'stats'],
    queryFn: () => api.get('/recovery/stats').then(r => r.data.data),
    enabled: user?.role === 'ADMIN',
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post('/admin/reset-demo'),
    onSuccess: () => { toast.success('Demo data reset!'); qc.invalidateQueries(); },
    onError: (e) => toast.error(getApiError(e)),
  });

  const recoveryMutation = useMutation({
    mutationFn: () => api.post('/recovery/run'),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(`Recovery: ${d.recovered} locks recovered, ${d.scanned} scanned`);
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  if (!user || user.role !== 'ADMIN') return null;

  const stats = dashboard ? [
    { label: 'Active Events', value: dashboard.totalEvents, color: 'text-blue-600', icon: '🎪' },
    { label: 'Total Seats', value: dashboard.totalSeats, color: 'text-slate-900', icon: '💺' },
    { label: 'Available', value: dashboard.availableSeats, color: 'text-emerald-600', icon: '✅' },
    { label: 'Locked', value: dashboard.lockedSeats, color: 'text-yellow-600', icon: '🔒' },
    { label: 'Booked', value: dashboard.bookedSeats, color: 'text-red-500', icon: '🎫' },
    { label: 'Bookings', value: dashboard.totalBookings, color: 'text-blue-600', icon: '✔️' },
    { label: 'Recoveries', value: dashboard.totalRecoveries, color: 'text-violet-600', icon: '♻️' },
    { label: 'Active Locks', value: dashboard.activeLocksCount, color: 'text-orange-500', icon: '🔑' },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="section-label mb-2">Admin</div>
            <h1 className="text-3xl font-black text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">Real-time system overview</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/simulation"
              className="px-4 py-2 bg-orange-50 border border-orange-200 text-orange-600 text-sm font-semibold rounded-xl hover:bg-orange-100 transition-colors">
              🧪 Race Test
            </Link>
            <button onClick={() => recoveryMutation.mutate()} disabled={recoveryMutation.isPending}
              className="px-4 py-2 bg-violet-50 border border-violet-200 text-violet-600 text-sm font-semibold rounded-xl hover:bg-violet-100 transition-colors disabled:opacity-50">
              ♻️ Run Recovery
            </button>
            <button onClick={() => {
              if (confirm('Reset all demo data? This clears bookings, locks, and payments.')) resetMutation.mutate();
            }} disabled={resetMutation.isPending}
              className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50">
              🔄 Reset Demo
            </button>
          </div>
        </div>

        {/* Stats */}
        <AdminStats stats={stats} />

        <div className="grid lg:grid-cols-2 gap-5 mt-6">
          {/* Active Locks */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              🔒 Active Locks
              <span className="text-xs font-normal text-slate-400 ml-1">auto-refreshes 5s</span>
            </h2>
            {!locks || locks.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No active locks</p>
            ) : (
              <div className="space-y-0 max-h-72 overflow-y-auto mt-4">
                {locks.map((lock: any) => (
                  <div key={lock.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{lock.seat?.seatNumber} — {lock.event?.title}</p>
                      <p className="text-xs text-slate-500">{lock.user?.name} ({lock.user?.email})</p>
                    </div>
                    <div className={`font-mono font-bold text-sm ${lock.remainingTtl < 60 ? 'text-red-500' : 'text-violet-600'}`}>
                      {formatCountdown(lock.remainingTtl)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-slate-900 mb-4">🎫 Recent Bookings</h2>
            {!bookingsData?.bookings || bookingsData.bookings.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No bookings yet</p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="table-dark w-full">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>User</th>
                      <th>Seat</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsData.bookings.map((b: any) => (
                      <tr key={b.id}>
                        <td><span className="font-mono text-xs text-blue-600">{b.bookingCode}</span></td>
                        <td><span className="text-slate-600">{b.user?.name}</span></td>
                        <td><span className="text-slate-700">{b.seat?.seatNumber}</span></td>
                        <td>
                          <span className={`badge border text-xs ${
                            b.bookingStatus === 'CONFIRMED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : b.bookingStatus === 'PENDING' ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                          }`}>
                            {b.bookingStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recovery Stats */}
        {recoveryStats && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mt-5">
            <h2 className="font-bold text-slate-900 mb-5">♻️ Recovery Statistics</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-4xl font-black text-violet-600">{recoveryStats.totalRecoveries}</p>
                <p className="text-xs text-slate-500 mt-1">Total Recoveries</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-blue-600">{recoveryStats.last24h}</p>
                <p className="text-xs text-slate-500 mt-1">Last 24 Hours</p>
              </div>
              <div>
                {recoveryStats.byReason?.map((r: any) => (
                  <div key={r.reason} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500">{r.reason}</span>
                    <span className="font-bold text-slate-900">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
