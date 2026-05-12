'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import useAuthStore from '@/store/authStore';

export default function TopBar() {
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header
      style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: '#0a0a0b',
        borderBottom: '1px solid #1c1c1f',
        flexShrink: 0,
      }}
    >
      <Link
        href="/dashboard"
        style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            background: '#f97316',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          $
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
          AI Spend Tracker
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user?.email && (
          <span style={{ fontSize: 12, color: '#52525b' }}>{user.email}</span>
        )}
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#f97316',
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.2)',
            padding: '2px 8px',
            borderRadius: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {user?.plan ?? 'free'}
        </span>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            color: '#52525b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#a1a1aa')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </header>
  );
}
