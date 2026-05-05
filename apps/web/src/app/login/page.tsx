'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { getApiError } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

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
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4f8ef7] to-[#7c3aed] flex items-center justify-center text-white font-black text-xl mx-auto mb-4">
            E
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Welcome back</h1>
          <p className="text-sm text-white/40">Sign in to your Eves account</p>
        </div>

        <div className="glass-card p-7">
          {/* Demo shortcuts */}
          <div className="flex gap-2 mb-6">
            <button type="button" onClick={() => fillDemo('admin')}
              className="flex-1 text-xs py-2 px-3 rounded-lg border border-[#4f8ef7]/20 text-[#4f8ef7] hover:bg-[#4f8ef7]/10 transition-colors">
              Fill Admin Demo
            </button>
            <button type="button" onClick={() => fillDemo('user')}
              className="flex-1 text-xs py-2 px-3 rounded-lg border border-white/[0.08] text-white/50 hover:bg-white/[0.04] transition-colors">
              Fill User Demo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-dark">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="input-dark" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label-dark">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="input-dark" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-5">
            No account?{' '}
            <Link href="/register" className="text-[#4f8ef7] font-medium hover:text-white transition-colors">Get started free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
