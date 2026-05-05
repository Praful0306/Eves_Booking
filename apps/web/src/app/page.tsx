'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

const features = [
  {
    title: 'Atomic Redis Locks',
    desc: 'SET NX EX ensures only one user locks a seat at a time — even under 1000 concurrent requests. Absolutely no overlaps.',
    colSpan: 'md:col-span-2',
    icon: (
      <svg className="w-6 h-6 text-[#0070f3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    ),
  },
  {
    title: 'Real-Time Sync',
    desc: 'Socket.IO broadcasts every state change instantly.',
    colSpan: 'md:col-span-1',
    icon: (
      <svg className="w-6 h-6 text-[#00DFD8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
    ),
  },
  {
    title: 'Phantom Recovery',
    desc: 'BullMQ runs every 10s. Detects abandoned locks and restores seats securely.',
    colSpan: 'md:col-span-1',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
    ),
  },
  {
    title: 'Race Condition Proof',
    desc: 'Fires 100 concurrent requests. Exactly 1 succeeds.',
    colSpan: 'md:col-span-2',
    icon: (
      <svg className="w-6 h-6 text-[#0059c5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    ),
  },
];

const arch = [
  { label: 'Next.js', sub: 'Frontend', color: 'text-white' },
  { label: 'Express', sub: 'Node API', color: 'text-[#0070f3]' },
  { label: 'Redis', sub: 'Atomic Locks', color: 'text-[#00DFD8]' },
  { label: 'Postgres', sub: 'Audit', color: 'text-emerald-400' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505]">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0070f3]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00DFD8]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center z-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase bg-[#0070f3]/10 border border-[#0070f3]/20 text-[#0070f3] mb-8 shadow-[0_0_20px_rgba(0,112,243,0.1)]">
            <span className="w-2 h-2 bg-[#00DFD8] rounded-full animate-pulse shadow-[0_0_10px_#00DFD8]" />
            Enterprise Booking Engine
          </div>

          <h1 className="text-6xl sm:text-8xl font-black tracking-tight mb-8 leading-[1.05]">
            <span className="text-white">Zero Double</span>
            <br />
            <span className="gradient-text-blue">Bookings.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Atomic Redis locks, SELECT FOR UPDATE transactions, and a BullMQ phantom-lock recovery worker. The definitive solution for real-time seat inventory.
          </p>

          <div className="flex items-center justify-center gap-5 flex-wrap">
            <Link href="/events" className="btn-primary flex items-center gap-2 text-base px-8 py-4">
              Try Live Demo
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link href="/admin" className="btn-outline text-base px-8 py-4 flex items-center gap-2">
              Admin Terminal
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Architecture & Features Bento Grid */}
      <section className="py-12 px-6 max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Architecture Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="md:col-span-3 glass-card p-8 sm:p-12 border-[#0070f3]/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#0070f3]/5 rounded-full blur-3xl group-hover:bg-[#0070f3]/10 transition-colors duration-700" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-[#0070f3]/10 border border-[#0070f3]/20 flex items-center justify-center mb-6 text-[#0070f3]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Tech Stack</h3>
                <p className="text-white/50 leading-relaxed text-lg">
                  A high-performance pipeline designed strictly for concurrency control and race-condition immunity.
                </p>
              </div>

              <div className="flex-1 w-full grid grid-cols-2 gap-4">
                {arch.map((a, i) => (
                  <div key={i} className="bg-[#050505]/50 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center backdrop-blur-md">
                    <div className={`font-bold text-lg mb-1 ${a.color}`}>{a.label}</div>
                    <div className="text-white/30 text-xs tracking-wider uppercase font-medium">{a.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + (i * 0.1) }}
              className={`glass-card-hover p-8 flex flex-col justify-between ${f.colSpan}`}>
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{f.title}</h3>
                <p className="text-white/50 leading-relaxed font-light">{f.desc}</p>
              </div>
            </motion.div>
          ))}
          
        </div>
      </section>

      {/* Booking Flow */}
      <section className="py-24 px-6 max-w-6xl mx-auto relative z-10">
        <div className="glass-card p-12 text-center">
          <h2 className="text-3xl font-black text-white mb-12">The Immutable Flow</h2>
          <div className="grid sm:grid-cols-4 gap-6 relative">
            
            {/* Connecting Line */}
            <div className="hidden sm:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />

            {[
              { step: '01', title: 'Connect', desc: 'Join Socket.IO room' },
              { step: '02', title: 'Lock', desc: 'Acquire Redis TTL Lock' },
              { step: '03', title: 'Verify', desc: 'Simulate Payment' },
              { step: '04', title: 'Commit', desc: 'Write to Postgres DB' }
            ].map((s, i) => (
              <div key={i} className="relative z-10 bg-[#121414] border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="w-8 h-8 rounded-full bg-[#0070f3]/20 border border-[#0070f3]/30 text-[#0070f3] text-xs font-bold flex items-center justify-center mx-auto mb-4 font-mono">
                  {s.step}
                </div>
                <div className="font-bold text-white mb-2">{s.title}</div>
                <div className="text-sm text-white/40">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-12 text-center border-t border-white/[0.05] relative z-10 bg-[#050505]">
        <p className="text-white/30 text-sm font-mono mb-4">
          admin@eves.io / admin123 · user@eves.io / user123
        </p>
        <p className="text-white/20 text-xs">
          Built for the ultimate engineering experience.
        </p>
      </footer>
    </div>
  );
}
