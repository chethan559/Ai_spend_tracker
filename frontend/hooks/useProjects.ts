'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProject, deleteProject, getProjects, rotateProjectKey } from '@/lib/api';
import type { Project } from '@/types';

const QUERY_KEY = ['projects'];

export function useProjects() {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getProjects,
    staleTime: 60_000,
  });

  return {
    projects: query.data ?? [] as Project[],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createProject(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useRotateProjectKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rotateProjectKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
