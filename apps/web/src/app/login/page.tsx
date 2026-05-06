'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getApiError } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/events');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/events');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'user') => {
    setEmail(role === 'admin' ? 'admin@eves.io' : 'user@eves.io');
    setPassword(role === 'admin' ? 'admin123' : 'user123');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)', transform: 'translate(-20%, 20%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white font-black text-2xl mb-5 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            E
          </Link>
          <div className="label-eyebrow mb-2">Welcome Back</div>
          <h1 className="font-display font-black text-slate-900 text-3xl">Sign in to Eves</h1>
          <p className="text-slate-400 text-sm mt-2">Enter your credentials to continue</p>
        </div>

        <div className="card p-8 shadow-lg">

          {/* Demo credentials box */}
          <div className="bg-blue-50 border border-dashed border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span className="label-eyebrow text-blue-600">Quick Fill</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => fillDemo('admin')}
                className="flex-1 text-xs py-2.5 px-3 rounded-lg border border-blue-300 bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors">
                Admin Demo
              </button>
              <button type="button" onClick={() => fillDemo('user')}
                className="flex-1 text-xs py-2.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                User Demo
              </button>
            </div>
            <div className="mt-3 font-mono text-xs text-slate-400 space-y-0.5">
              <p>admin@eves.io / admin123</p>
              <p>user@eves.io / user123</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-dark">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="label-dark">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            No account?{' '}
            <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
