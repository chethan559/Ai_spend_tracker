'use client';

import { useState } from 'react';
import { ChevronDown, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateProject, useDeleteProject, useProjects } from '@/hooks/useProjects';
import type { Project } from '@/types';

interface ProjectSelectorProps {
  activeProjectId: string | null;
  onSelect: (id: string | null) => void;
  projectLimit: number;
}

const fmt$ = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);

export default function ProjectSelector({
  activeProjectId,
  onSelect,
  projectLimit,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { projects, isLoading } = useProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();

  const active = projects.find((p) => p.id === activeProjectId);
  const atLimit = projectLimit > 0 && projects.length >= projectLimit;

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await createMutation.mutateAsync({ name });
      setNewName('');
      toast.success(`Project "${name}" created`);
    } catch {
      // toast handled by api interceptor
    }
  };

  const handleDelete = async (project: Project) => {
    if (confirmDelete !== project.id) {
      setConfirmDelete(project.id);
      return;
    }
    try {
      await deleteMutation.mutateAsync(project.id);
      if (activeProjectId === project.id) onSelect(null);
      setConfirmDelete(null);
      toast.success(`Project "${project.name}" deleted`);
    } catch {
      // toast handled by api interceptor
    }
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); setConfirmDelete(null); }}>
      <PopoverTrigger asChild>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            color: activeProjectId ? '#f97316' : '#a1a1aa',
            background: activeProjectId ? 'rgba(249,115,22,0.08)' : '#18181b',
            border: `1px solid ${activeProjectId ? 'rgba(249,115,22,0.25)' : '#27272a'}`,
            borderRadius: 6,
            padding: '5px 10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.12s',
            whiteSpace: 'nowrap',
          }}
        >
          <FolderOpen size={12} />
          {isLoading ? '…' : active?.name ?? 'All Projects'}
          <ChevronDown size={11} style={{ opacity: 0.6 }} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        style={{
          width: 260,
          padding: 0,
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* All projects option */}
        <button
          onClick={() => { onSelect(null); setOpen(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '9px 12px',
            fontSize: 12,
            color: activeProjectId === null ? '#f97316' : '#a1a1aa',
            background: activeProjectId === null ? 'rgba(249,115,22,0.08)' : 'transparent',
            border: 'none',
            borderBottom: '1px solid #27272a',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <span style={{ fontWeight: 500 }}>All Projects</span>
          {activeProjectId === null && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
          )}
        </button>

        {/* Project list */}
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {projects.length === 0 && !isLoading && (
            <p style={{ fontSize: 11, color: '#52525b', padding: '12px', textAlign: 'center' }}>
              No projects yet
            </p>
          )}
          {projects.map((project) => {
            const isActive = activeProjectId === project.id;
            const isConfirming = confirmDelete === project.id;
            return (
              <div
                key={project.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderBottom: '1px solid #27272a',
                  background: isActive ? 'rgba(249,115,22,0.06)' : 'transparent',
                }}
              >
                <button
                  onClick={() => { onSelect(project.id); setOpen(false); setConfirmDelete(null); }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 2,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: isActive ? '#f97316' : '#e4e4e7' }}>
                    {project.name}
                  </span>
                  <span style={{ fontSize: 10, color: '#52525b' }}>
                    {fmt$(project.totalSpend)} · {project.totalRequests.toLocaleString()} reqs
                  </span>
                </button>
                <button
                  onClick={() => handleDelete(project)}
                  title={isConfirming ? 'Click again to confirm' : 'Delete project'}
                  style={{
                    flexShrink: 0,
                    background: isConfirming ? 'rgba(239,68,68,0.15)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 4,
                    color: isConfirming ? '#ef4444' : '#52525b',
                    transition: 'all 0.12s',
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Create new project */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid #27272a' }}>
          {atLimit ? (
            <p style={{ fontSize: 11, color: '#52525b', textAlign: 'center' }}>
              Project limit reached ({projectLimit}). Upgrade to add more.
            </p>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="New project name"
                style={{ fontSize: 12, height: 30, background: '#111113', border: '1px solid #27272a' }}
              />
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newName.trim() || createMutation.isPending}
                style={{ height: 30, padding: '0 10px', flexShrink: 0 }}
              >
                <Plus size={13} />
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
