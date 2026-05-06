'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap, Radio, RefreshCw, BarChart3, Shield, Clock, Database, ChevronRight } from 'lucide-react';

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1600;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + increment, target);
          setCount(Math.floor(current));
          if (current >= target) clearInterval(timer);
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const features = [
  {
    title: 'Atomic Redis Locks',
    desc: 'SET NX EX ensures only one user locks a seat at a time — even under 1000 concurrent requests. Zero race conditions, zero overlaps.',
    colSpan: 'md:col-span-2',
    icon: <Zap className="w-5 h-5 text-blue-600" />,
    iconBg: 'bg-blue-50 border-blue-100',
  },
  {
    title: 'Real-Time Sync',
    desc: 'Socket.IO broadcasts every seat state change instantly to all connected clients.',
    colSpan: 'md:col-span-1',
    icon: <Radio className="w-5 h-5 text-violet-600" />,
    iconBg: 'bg-violet-50 border-violet-100',
  },
  {
    title: 'Phantom Recovery',
    desc: 'BullMQ worker runs every 10s. Detects abandoned locks and restores seats securely.',
    colSpan: 'md:col-span-1',
    icon: <RefreshCw className="w-5 h-5 text-emerald-600" />,
    iconBg: 'bg-emerald-50 border-emerald-100',
  },
  {
    title: 'Race Condition Proof',
    desc: 'Fire 100 concurrent requests. Exactly 1 succeeds. SELECT FOR UPDATE guarantees it.',
    colSpan: 'md:col-span-2',
    icon: <BarChart3 className="w-5 h-5 text-orange-500" />,
    iconBg: 'bg-orange-50 border-orange-100',
  },
];

const stats = [
  { label: 'Concurrent users', value: 50, suffix: '+', icon: <Radio className="w-4 h-4" /> },
  { label: 'Double bookings', value: 0, suffix: '', icon: <Shield className="w-4 h-4" /> },
  { label: 'Recovery time', value: 10, suffix: 's', icon: <Clock className="w-4 h-4" /> },
  { label: 'Lock TTL', value: 300, suffix: 's', icon: <Database className="w-4 h-4" /> },
];

const steps = [
  { step: '01', title: 'Connect', desc: 'Join Socket.IO room for live seat state', icon: <Radio className="w-5 h-5 text-blue-600" /> },
  { step: '02', title: 'Lock', desc: 'Acquire atomic Redis TTL lock (SET NX EX)', icon: <Shield className="w-5 h-5 text-violet-600" /> },
  { step: '03', title: 'Verify', desc: 'Simulate payment scenario with real API', icon: <Zap className="w-5 h-5 text-emerald-600" /> },
  { step: '04', title: 'Commit', desc: 'Write confirmed booking to PostgreSQL', icon: <Database className="w-5 h-5 text-orange-500" /> },
];

const techPills = [
  { label: 'Redis', sub: 'Atomic Locks', border: 'border-red-200 bg-red-50', text: 'text-red-600' },
  { label: 'Express', sub: 'Node API', border: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-700' },
  { label: 'PostgreSQL', sub: 'Persistence', border: 'border-blue-200 bg-blue-50', text: 'text-blue-600' },
  { label: 'BullMQ', sub: 'Recovery', border: 'border-violet-200 bg-violet-50', text: 'text-violet-600' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">

      {/* HERO */}
      <section className="relative min-h-screen flex items-center bg-white">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />

        {/* Gradient orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)', transform: 'translate(-20%, 20%)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Text */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <div className="label-eyebrow mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Enterprise Booking Engine
              </div>

              <h1 className="font-display font-black text-slate-900 leading-[1.05] mb-6" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
                Zero double bookings.{' '}
                <span className="gradient-text">Real-time recovery.</span>
              </h1>

              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg font-light">
                Atomic Redis locks, SELECT FOR UPDATE transactions, and a BullMQ phantom-lock recovery worker.
                The definitive solution for real-time seat inventory.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Link href="/events" className="btn-primary text-base px-6 py-3 flex items-center gap-2">
                  Try Live Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="btn-secondary text-base px-6 py-3 flex items-center gap-2">
                  Sign in
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="inline-block bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="label-eyebrow mb-1.5">Demo credentials</p>
                <div className="font-mono text-xs text-slate-600 space-y-0.5">
                  <p><span className="text-blue-600 font-semibold">admin@eves.io</span> / admin123</p>
                  <p><span className="text-slate-700 font-semibold">user@eves.io</span> / user123</p>
                </div>
              </div>
            </motion.div>

            {/* Right: Architecture card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="animate-float hidden lg:block"
            >
              <div className="card p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>E</div>
                  <div>
                    <p className="font-display font-bold text-slate-900">Eves Tech Stack</p>
                    <p className="text-xs text-slate-400">High-performance booking pipeline</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {techPills.map((pill) => (
                    <div key={pill.label} className={`rounded-xl border p-4 ${pill.border}`}>
                      <p className={`font-bold text-sm font-display ${pill.text}`}>{pill.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pill.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="label-eyebrow mb-2">Live system status</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-emerald-700">All systems operational</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm text-slate-500">Socket.IO connected</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="text-blue-400">{stat.icon}</div>
                </div>
                <div className="font-display font-black text-white text-4xl mb-1">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="label-eyebrow mb-4">Architecture</div>
            <h2 className="font-display font-black text-slate-900 text-4xl mb-4">
              Built for <span className="gradient-text">concurrency</span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Every layer of the stack is designed to prevent race conditions and ensure data integrity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`card-hover p-7 ${f.colSpan}`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-5 ${f.iconBg}`}>
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="label-eyebrow mb-4">The Flow</div>
            <h2 className="font-display font-black text-slate-900 text-4xl">
              How it <span className="gradient-text">works</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card-hover p-7 relative overflow-hidden"
              >
                <div className="absolute top-4 right-5 font-display font-black text-6xl text-slate-100 select-none leading-none">
                  {s.step}
                </div>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
                    {s.icon}
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
                  <p className="text-slate-500 text-sm">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-12 text-center text-white"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563EB 40%, #7C3AED 100%)' }}
          >
            <div className="label-eyebrow mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Live Demo</div>
            <h2 className="font-display font-black text-4xl mb-4 text-white">
              Try the live booking flow now
            </h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">
              Select seats, watch Redis locks prevent double-bookings, and trigger payment scenarios in real-time.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/events" className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-all">
                Browse Events
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register" className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-all">
                Create Account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>E</div>
            <span className="font-display font-bold text-slate-900">Eves</span>
            <span className="text-slate-400 text-sm">— Real-Time Seat Booking Engine</span>
          </div>
          <p className="font-mono text-xs text-slate-400">
            admin@eves.io / admin123 · user@eves.io / user123
          </p>
        </div>
      </footer>

    </div>
  );
}
