'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { LayoutGrid, Ticket, ShieldCheck, LogOut, LogIn, UserPlus } from 'lucide-react';

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
        ? 'bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm'
        : 'bg-white border-b border-slate-100'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              E
            </div>
            <span className="font-bold text-slate-900 tracking-tight font-display text-lg">Eves</span>
            <span className="font-mono text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">V1.0</span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/events" className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
              isActive('/events')
                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            )}>
              <LayoutGrid className="w-3.5 h-3.5" />
              Events
              {isActive('/events') && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5" />}
            </Link>

            {user && (
              <Link href="/bookings" className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
                isActive('/bookings')
                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}>
                <Ticket className="w-3.5 h-3.5" />
                My Bookings
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link href="/admin" className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
                isActive('/admin')
                  ? 'bg-violet-50 text-violet-600 border border-violet-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}>
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2.5 mr-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                    {user.name[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 leading-none">{user.name}</span>
                    {user.role === 'ADMIN' && (
                      <span className="text-[10px] font-mono font-semibold text-violet-500 uppercase tracking-wider">Admin</span>
                    )}
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="btn-ghost text-slate-500 hover:text-red-500 flex items-center gap-1.5 text-xs">
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5" />
                  Log In
                </Link>
                <Link href="/register" className="btn-primary flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  Get Started
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
