import type { Metadata } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Dashboard | AI Spend Tracker',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
