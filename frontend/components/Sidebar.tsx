'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart2, Globe, LogOut, Radio, Zap } from 'lucide-react';
import useAuthStore from '@/store/authStore';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: BarChart2, exact: true },
  { href: '/providers', label: 'Providers', icon: Globe, exact: false },
  { href: '/integration', label: 'Integration', icon: Radio, exact: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside
      className="flex h-screen w-60 shrink-0 flex-col"
      style={{ background: '#0a0a0b', borderRight: '1px solid #1c1c1f' }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center gap-2.5 px-4"
        style={{ borderBottom: '1px solid #1c1c1f' }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: '#f97316' }}
        >
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">
          AI Spend Tracker
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              style={
                isActive
                  ? { background: '#f97316', color: '#ffffff' }
                  : { color: '#71717a' }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = '#ffffff';
                  (e.currentTarget as HTMLElement).style.background = '#1c1c1f';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = '#71717a';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User / Sign out */}
      <div style={{ borderTop: '1px solid #1c1c1f' }} className="p-2">
        <div className="px-3 py-2">
          <p className="truncate text-xs font-medium text-white">{user?.email ?? '—'}</p>
          <p className="text-xs capitalize" style={{ color: '#71717a' }}>
            {user?.plan ?? 'free'} Plan
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
          style={{ color: '#71717a' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#ffffff';
            (e.currentTarget as HTMLElement).style.background = '#1c1c1f';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#71717a';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
