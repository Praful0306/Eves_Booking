'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
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
    { k: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe', icon: <User className="w-4 h-4 text-slate-400" />, required: true },
    { k: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', icon: <Mail className="w-4 h-4 text-slate-400" />, required: true },
    { k: 'password', label: 'Password', type: 'password', placeholder: '••••••••', icon: <Lock className="w-4 h-4 text-slate-400" />, required: true },
    { k: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: '+91 99999 99999', icon: <Phone className="w-4 h-4 text-slate-400" />, required: false },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)', transform: 'translate(-20%, 20%)' }} />

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
          <div className="label-eyebrow mb-2">Create Account</div>
          <h1 className="font-display font-black text-slate-900 text-3xl">Join Eves</h1>
          <p className="text-slate-400 text-sm mt-2">Book seats in real-time with zero double-bookings</p>
        </div>

        <div className="card p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.k}>
                <label className="label-dark">{field.label}</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {field.icon}
                  </div>
                  <input
                    type={field.type}
                    value={(form as any)[field.k]}
                    onChange={set(field.k)}
                    required={field.required}
                    className="input-field pl-10"
                    placeholder={field.placeholder}
                  />
                </div>
              </div>
            ))}

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
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
