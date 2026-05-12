import type { Metadata } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
  title: 'Dashboard | AI Spend Tracker',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', background: '#0a0a0b', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
