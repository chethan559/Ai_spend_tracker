'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, ArrowRight, Key, Folder } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateProject } from '@/hooks/useProjects';
import useAuthStore from '@/store/authStore';
import type { Project } from '@/types';

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const createMutation = useCreateProject();

  const [step, setStep] = useState<'name' | 'key'>('name');
  const [projectName, setProjectName] = useState('');
  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isAuthenticated()) {
    router.replace('/login');
    return null;
  }

  const handleCreate = async () => {
    const name = projectName.trim();
    if (!name) return;
    try {
      const project = await createMutation.mutateAsync({ name });
      setCreatedProject(project);
      setStep('key');
    } catch {
      // toast handled by api interceptor
    }
  };

  const handleCopy = () => {
    if (!createdProject?.apiKey) return;
    navigator.clipboard.writeText(createdProject.apiKey);
    setCopied(true);
    toast.success('API key copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo / brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, background: '#f97316', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={16} color="#fff" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>AI Spend Tracker</span>
          </div>
          <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>
            {step === 'name' ? 'Create your first project to get started' : 'Your project API key is ready'}
          </p>
        </div>

        <div
          style={{
            background: '#111113',
            border: '1px solid #27272a',
            borderRadius: 12,
            padding: 32,
          }}
        >
          {step === 'name' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(249,115,22,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Folder size={16} color="#f97316" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Name your project</p>
                  <p style={{ fontSize: 12, color: '#52525b', margin: 0 }}>e.g. "chatbot", "resume-parser"</p>
                </div>
              </div>

              <input
                autoFocus
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Project name"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 16,
                }}
              />

              <button
                onClick={handleCreate}
                disabled={!projectName.trim() || createMutation.isPending}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  background: projectName.trim() ? '#f97316' : '#27272a',
                  color: projectName.trim() ? '#fff' : '#52525b',
                  border: 'none',
                  borderRadius: 8,
                  cursor: projectName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.12s',
                }}
              >
                {createMutation.isPending ? 'Creating…' : (
                  <>Create Project <ArrowRight size={14} /></>
                )}
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(34,197,94,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={16} color="#22c55e" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>
                    {createdProject?.name} created
                  </p>
                  <p style={{ fontSize: 12, color: '#52525b', margin: 0 }}>Copy your API key below</p>
                </div>
              </div>

              <div
                style={{
                  background: '#0a0a0b',
                  border: '1px solid #27272a',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <code style={{ fontSize: 12, color: '#f97316', wordBreak: 'break-all', flex: 1 }}>
                  {createdProject?.apiKey}
                </code>
                <button
                  onClick={handleCopy}
                  style={{
                    flexShrink: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copied ? '#22c55e' : '#52525b',
                    padding: 4,
                    transition: 'color 0.12s',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              <div
                style={{
                  background: 'rgba(234,179,8,0.06)',
                  border: '1px solid rgba(234,179,8,0.2)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 20,
                  fontSize: 12,
                  color: '#a16207',
                }}
              >
                Store this key somewhere safe. You can always rotate it from the dashboard, but you won't be shown it again in full.
              </div>

              <div style={{ marginBottom: 20, fontSize: 12, color: '#52525b', lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#a1a1aa' }}>SDK usage:</p>
                <code style={{ display: 'block', background: '#0a0a0b', border: '1px solid #27272a', borderRadius: 6, padding: '8px 12px', color: '#e4e4e7', fontSize: 11 }}>
                  {`const tracker = new AISpendTracker('${createdProject?.apiKey ?? 'psk_...'}');`}
                </code>
              </div>

              <button
                onClick={() => router.replace('/dashboard')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  background: '#f97316',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                Go to Dashboard <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#3f3f46', marginTop: 20 }}>
          You can create additional projects and manage API keys from the dashboard.
        </p>
      </div>
    </div>
  );
}
