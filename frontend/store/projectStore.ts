'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ProjectState {
  activeProjectId: string | null;
  setActiveProject: (id: string | null) => void;
}

const storage =
  typeof window !== 'undefined'
    ? createJSONStorage(() => localStorage)
    : undefined;

const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProject: (id) => set({ activeProjectId: id }),
    }),
    { name: 'active-project', storage },
  ),
);

export default useProjectStore;
