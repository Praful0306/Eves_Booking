'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user, logout, init } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { init(); }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => { logout(); router.push('/'); };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-[#050508]/90 backdrop-blur-xl border-b border-white/[0.06]'
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4f8ef7] to-[#7c3aed] flex items-center justify-center text-white font-black text-sm">
              E
            </div>
            <span className="font-bold text-white tracking-tight">Eves</span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/events" className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
              isActive('/events') ? 'bg-white/[0.08] text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.04]')}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Events
            </Link>
            {user && (
              <Link href="/bookings" className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive('/bookings') ? 'bg-white/[0.08] text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.04]')}>
                My Bookings
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive('/admin') ? 'bg-white/[0.08] text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.04]')}>
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 mr-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4f8ef7] to-[#7c3aed] flex items-center justify-center text-white text-xs font-bold">
                    {user.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-white/60">{user.name}</span>
                  {user.role === 'ADMIN' && (
                    <span className="badge bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 text-[#4f8ef7]">Admin</span>
                  )}
                </div>
                <button onClick={handleLogout} className="btn-ghost text-white/50 hover:text-red-400">
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Log In</Link>
                <Link href="/register" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
