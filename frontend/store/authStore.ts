'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: Boolean(user),
        }),
      setToken: (token) => {
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('auth-token', token);
          } else {
            localStorage.removeItem('auth-token');
          }
        }
        set({
          token,
          isAuthenticated: Boolean(token),
        });
      },
      login: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', token);
        }
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-store',
    },
  ),
);

export default useAuthStore;
