'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { useProjects } from '@/hooks/useProjects';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { projects, isLoading } = useProjects();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    if (!isLoading && projects.length === 0) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, isLoading, projects.length, router]);

  if (!isAuthenticated() || isLoading || projects.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <CardSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}
