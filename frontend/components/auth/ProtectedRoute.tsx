'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    setIsLoading(false);
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <CardSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}
