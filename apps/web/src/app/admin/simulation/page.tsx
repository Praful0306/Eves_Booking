'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { api, getApiError } from '@/lib/api';

interface RaceResult {
  totalAttempts: number;
  successCount: number;
  failedCount: number;
  winner?: { userId: string; lockToken: string };
  timingMs: number;
}

export default function SimulationPage() {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedSeatId, setSelectedSeatId] = useState('');
  const [concurrentUsers, setConcurrentUsers] = useState(50);
  const [result, setResult] = useState<RaceResult | null>(null);

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data.data),
  });

  const { data: seatsData } = useQuery({
    queryKey: ['seats', selectedEventId],
    queryFn: () => api.get(`/events/${selectedEventId}/seats`).then(r => r.data.data),
    enabled: !!selectedEventId,
  });

  const raceMutation = useMutation({
    mutationFn: () => api.post('/admin/race-test', { eventId: selectedEventId, seatId: selectedSeatId, concurrentUsers }),
    onSuccess: (res) => {
      setResult(res.data.data);
      const d = res.data.data;
      if (d.successCount === 1 && d.failedCount === d.totalAttempts - 1) {
        toast.success('Perfect result! Exactly 1 user succeeded. Zero double bookings.');
      }
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const availableSeats = seatsData?.seats?.filter((s: any) => s.status === 'AVAILABLE') || [];
  const isPerfect = result?.successCount === 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-1">
          <Link href="/admin" className="text-white/30 hover:text-white/60 text-sm transition-colors">← Admin</Link>
        </div>
        <div className="section-label mt-4 mb-3">Stress Testing</div>
        <h1 className="text-3xl font-black text-white mb-1">Race Condition Simulation</h1>
        <p className="text-white/40 text-sm mb-8">Prove that Eves prevents double-booking under concurrent load</p>

        {/* Config */}
        <div className="glass-card p-6 mb-5">
          <h2 className="font-bold text-white mb-5">Test Configuration</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label-dark">Event</label>
              <select value={selectedEventId} onChange={e => { setSelectedEventId(e.target.value); setSelectedSeatId(''); }}
                className="input-dark">
                <option value="">Select an event…</option>
                {(events || []).map((e: any) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-dark">
                Seat{availableSeats.length > 0 && <span className="text-white/30 ml-1 text-xs">({availableSeats.length} available)</span>}
              </label>
              <select value={selectedSeatId} onChange={e => setSelectedSeatId(e.target.value)}
                disabled={!selectedEventId}
                className="input-dark disabled:opacity-50">
                <option value="">Select a seat…</option>
                {availableSeats.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.seatNumber}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="label-dark">
              Concurrent Users: <span className="text-[#4f8ef7] font-bold">{concurrentUsers}</span>
            </label>
            <input type="range" min={10} max={100} step={5} value={concurrentUsers}
              onChange={e => setConcurrentUsers(Number(e.target.value))}
              className="w-full mt-2 accent-[#4f8ef7]" />
            <div className="flex justify-between text-xs text-white/30 mt-1">
              <span>10</span><span>50</span><span>100</span>
            </div>
          </div>

          <button onClick={() => raceMutation.mutate()}
            disabled={!selectedEventId || !selectedSeatId || raceMutation.isPending}
            className="mt-5 w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            {raceMutation.isPending
              ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Running {concurrentUsers} concurrent requests…
                </span>
              )
              : `🚀 Run Race Test (${concurrentUsers} users, 1 seat)`}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-card p-6 mb-5">
              <h2 className="font-bold text-white mb-5">Test Results</h2>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="glass-card p-4 text-center border-emerald-500/20">
                  <p className="text-4xl font-black text-emerald-400">{result.successCount}</p>
                  <p className="text-xs text-white/40 mt-1">Confirmed</p>
                </div>
                <div className="glass-card p-4 text-center border-red-500/20">
                  <p className="text-4xl font-black text-red-400">{result.failedCount}</p>
                  <p className="text-xs text-white/40 mt-1">Rejected</p>
                </div>
                <div className="glass-card p-4 text-center border-[#4f8ef7]/20">
                  <p className="text-4xl font-black text-[#4f8ef7]">{result.timingMs}</p>
                  <p className="text-xs text-white/40 mt-1">Milliseconds</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex rounded-full h-3 overflow-hidden bg-white/[0.04]">
                  <div className="bg-emerald-500 transition-all rounded-full"
                    style={{ width: `${(result.successCount / result.totalAttempts) * 100}%` }} />
                  <div className="bg-red-500/60 flex-1" />
                </div>
                <div className="flex justify-between text-xs text-white/30 mt-1.5">
                  <span>{result.successCount} succeeded ({((result.successCount / result.totalAttempts) * 100).toFixed(1)}%)</span>
                  <span>{result.failedCount} rejected</span>
                </div>
              </div>

              {/* Verdict */}
              <div className={`p-4 rounded-xl border text-sm ${isPerfect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'}`}>
                {isPerfect ? (
                  <p>✅ <strong>Perfect.</strong> Exactly 1 user succeeded out of {result.totalAttempts} simultaneous attempts. Zero double bookings. Redis atomic SET NX EX works as expected.</p>
                ) : (
                  <p>⚠️ {result.successCount} users succeeded. Expected exactly 1. Check system state and try again.</p>
                )}
              </div>

              {result.winner && (
                <div className="mt-3 text-xs text-white/30 font-mono bg-white/[0.04] rounded-lg p-2.5">
                  Winner: {result.winner.userId}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explanation */}
        <div className="glass-card p-5 text-sm text-white/50 space-y-2">
          <p className="font-semibold text-white/80">How the race condition test works</p>
          <p>• {concurrentUsers} simultaneous requests fire to <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-xs font-mono text-[#4f8ef7]">POST /api/seats/:id/lock</code></p>
          <p>• Each uses a different userId and sessionId</p>
          <p>• Redis <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-xs font-mono text-[#4f8ef7]">SET NX EX</code> ensures only the first request wins — atomically</p>
          <p>• All others receive a 409 Conflict response</p>
          <p>• The test seat is automatically reset after the test completes</p>
        </div>
      </motion.div>
    </div>
  );
}
