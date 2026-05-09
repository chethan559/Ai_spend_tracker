import type { Metadata } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

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
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
