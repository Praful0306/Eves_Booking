'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { getApiError } from '@/lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone || undefined);
      toast.success('Account created!');
      router.push('/events');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { k: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { k: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { k: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { k: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: '+91 99999 99999' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4f8ef7] to-[#7c3aed] flex items-center justify-center text-white font-black text-xl mx-auto mb-4">
            E
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Create account</h1>
          <p className="text-sm text-white/40">Join Eves and book seats in real-time</p>
        </div>

        <div className="glass-card p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(field => (
              <div key={field.k}>
                <label className="label-dark">{field.label}</label>
                <input
                  type={field.type}
                  value={(form as any)[field.k]}
                  onChange={set(field.k)}
                  required={field.k !== 'phone'}
                  className="input-dark"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed py-3 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-[#4f8ef7] font-medium hover:text-white transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
