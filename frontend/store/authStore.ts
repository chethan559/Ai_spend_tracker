'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: () => boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const storage =
  typeof window !== 'undefined'
    ? createJSONStorage(() => localStorage)
    : undefined;

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: () => Boolean(get().token),
      setUser: (user) => set({ user }),
      setToken: (token) => {
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('auth-token', token);
          } else {
            localStorage.removeItem('auth-token');
          }
        }
        set({ token });
      },
      login: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', token);
        }
        set({ user, token });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-user');
          localStorage.removeItem('auth-storage');
        }
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
      storage,
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);

export default useAuthStore;
