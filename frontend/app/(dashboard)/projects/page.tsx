'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, TrendingUp, Activity, Key, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateProject, useProjects } from '@/hooks/useProjects';
import useProjectStore from '@/store/projectStore';

const fmt$ = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading } = useProjects();
  const createMutation = useCreateProject();
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const project = await createMutation.mutateAsync({ name });
      setNewName('');
      setShowCreate(false);
      setCreatedKey(project.apiKey);
      toast.success(`Project "${name}" created`);
    } catch {
      // handled by interceptor
    }
  };

  const handleCopy = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    toast.success('API key copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelect = (id: string) => {
    setActiveProject(id);
    router.push('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 52px)',
        background: '#0a0a0b',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#fff',
      }}
    >
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '28px 40px 20px',
          borderBottom: '1px solid #1c1c1f',
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Projects
          </h1>
          <p style={{ fontSize: 12, color: '#52525b', margin: '4px 0 0' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={() => { setShowCreate(true); setCreatedKey(null); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            background: '#f97316',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Plus size={14} />
          New Project
        </button>
      </div>

      <div style={{ display: 'flex', padding: '28px 40px', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Project cards grid ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 120,
                    background: '#111113',
                    border: '1px solid #1c1c1f',
                    borderRadius: 10,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          ) : projects.length === 0 && !showCreate ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#3f3f46',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#52525b', margin: '0 0 4px' }}>No projects yet</p>
              <p style={{ fontSize: 12, color: '#3f3f46', margin: 0 }}>Click "New Project" to create your first one</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    padding: '18px 20px',
                    background: '#111113',
                    border: '1px solid #1c1c1f',
                    borderRadius: 10,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.12s, background 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#f97316';
                    e.currentTarget.style.background = 'rgba(249,115,22,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1c1c1f';
                    e.currentTarget.style.background = '#111113';
                  }}
                >
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: '#1c1c1f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Activity size={14} color="#f97316" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {project.name}
                    </span>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#52525b', margin: '0 0 2px' }}>Total Spend</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{fmt$(project.totalSpend)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#52525b', margin: '0 0 2px' }}>Requests</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{project.totalRequests.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Status bar */}
                  <div style={{ height: 2, background: '#1c1c1f', borderRadius: 1 }}>
                    <div
                      style={{
                        height: '100%',
                        width: project.totalRequests > 0 ? '60%' : '0%',
                        background: '#f97316',
                        borderRadius: 1,
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel: create project or API key reveal ── */}
        {(showCreate || createdKey) && (
          <div
            style={{
              width: 320,
              flexShrink: 0,
              background: '#111113',
              border: '1px solid #27272a',
              borderRadius: 10,
              padding: 20,
            }}
          >
            {createdKey ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Key size={14} color="#22c55e" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Your API key</span>
                </div>

                <div
                  style={{
                    background: '#0a0a0b',
                    border: '1px solid #27272a',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <code style={{ fontSize: 11, color: '#f97316', flex: 1, wordBreak: 'break-all' }}>
                    {createdKey}
                  </code>
                  <button
                    onClick={handleCopy}
                    style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#22c55e' : '#52525b', padding: 2 }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>

                <p style={{ fontSize: 11, color: '#a16207', background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: 6, padding: '8px 10px', margin: '0 0 14px' }}>
                  Store this key — it won't be shown again in full.
                </p>

                <code style={{ display: 'block', background: '#0a0a0b', border: '1px solid #1c1c1f', borderRadius: 6, padding: '8px 10px', fontSize: 10, color: '#a1a1aa', wordBreak: 'break-all', whiteSpace: 'pre-wrap', marginBottom: 14 }}>
                  {`new AISpendTracker('${createdKey}')`}
                </code>

                <button
                  onClick={() => setCreatedKey(null)}
                  style={{ width: '100%', padding: '8px', fontSize: 12, fontWeight: 600, background: '#1c1c1f', color: '#a1a1aa', border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <TrendingUp size={14} color="#f97316" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>New Project</span>
                </div>

                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Project name"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: 13,
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: 7,
                    color: '#fff',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: 10,
                  }}
                />

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setShowCreate(false); setNewName(''); }}
                    style={{ flex: 1, padding: '8px', fontSize: 12, background: '#1c1c1f', color: '#52525b', border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim() || createMutation.isPending}
                    style={{
                      flex: 2,
                      padding: '8px',
                      fontSize: 12,
                      fontWeight: 600,
                      background: newName.trim() ? '#f97316' : '#27272a',
                      color: newName.trim() ? '#fff' : '#52525b',
                      border: 'none',
                      borderRadius: 7,
                      cursor: newName.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                    }}
                  >
                    {createMutation.isPending ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
