'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import type { User } from '@/types';

interface UseAuthResult {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const router = useRouter();
  const { user, token, isAuthenticated, login, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout: handleLogout,
  };
}

export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return useAuthStore();
}
