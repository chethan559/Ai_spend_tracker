import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';
import SignupForm from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Sign up | AI Spend Tracker',
  description: 'Create your AI Spend Tracker account to monitor AI usage.',
};

const STATS = [
  { value: '$0.00042', label: 'avg per request' },
  { value: '3', label: 'providers unified' },
  { value: '< 2 min', label: 'to integrate' },
];

export default function SignupPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: '#0a0a0b', color: '#ffffff', fontFamily: 'system-ui, sans-serif' }}
    >
      <div className="grid min-h-screen md:grid-cols-2">

        {/* ── Left panel ─────────────────────────────────────────── */}
        <div
          className="hidden flex-col justify-between p-12 md:flex"
          style={{ borderRight: '1px solid #1c1c1f' }}
        >
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ background: '#f97316' }}
            >
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight">AI Spend Tracker</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#f97316' }}>
              Free to start
            </p>
            <h2
              className="text-4xl font-bold leading-tight"
              style={{ letterSpacing: '-0.03em' }}
            >
              Stop guessing<br />what AI costs.
            </h2>
            <p className="text-base leading-relaxed" style={{ color: '#71717a' }}>
              One SDK call. Every provider. Every model. Real‑time spend, automatically.
            </p>
          </div>

          {/* Stats */}
          <div>
            <div style={{ borderTop: '1px solid #1c1c1f', marginBottom: '1.5rem' }} />
            <div className="grid grid-cols-3 gap-6">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-bold tabular-nums" style={{ letterSpacing: '-0.02em' }}>
                    {value}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: '#71717a' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────── */}
        <div
          className="flex flex-col justify-center px-6 py-12 sm:px-12"
          style={{ background: '#0a0a0b' }}
        >
          <div className="mx-auto w-full max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm transition-colors text-[#71717a] hover:text-[#f97316]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>

            <div className="mt-8 space-y-1.5">
              <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.02em' }}>
                Create your account
              </h1>
              <p className="text-sm" style={{ color: '#71717a' }}>
                Start tracking your AI spend in minutes.
              </p>
            </div>

            <div
              className="mt-8 rounded-xl p-6"
              style={{ background: '#111113', border: '1px solid #1c1c1f' }}
            >
              <SignupForm />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
