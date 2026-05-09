import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in | AI Spend Tracker',
  description: 'Sign in to AI Spend Tracker to monitor your AI costs.',
};

const FEATURES = [
  'Every AI call logged automatically',
  'Spend by provider, model, feature, and user',
  'Real-time cost vs. last month',
];

export default function LoginPage() {
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
              Welcome back
            </p>
            <h2
              className="text-4xl font-bold leading-tight"
              style={{ letterSpacing: '-0.03em' }}
            >
              Your AI costs,<br />under control.
            </h2>
            <ul className="space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: '#71717a' }}>
                  <span style={{ color: '#f97316', marginTop: 1 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom quote */}
          <div style={{ borderTop: '1px solid #1c1c1f', paddingTop: '1.5rem' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>
              "We went from a $3,200 surprise invoice to knowing our exact AI cost before the month ends."
            </p>
            <p className="mt-2 text-xs font-medium" style={{ color: '#f97316' }}>
              — Engineering lead, B2B SaaS
            </p>
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
                Welcome back
              </h1>
              <p className="text-sm" style={{ color: '#71717a' }}>
                Sign in to continue tracking your AI spend.
              </p>
            </div>

            <div
              className="mt-8 rounded-xl p-6"
              style={{ background: '#111113', border: '1px solid #1c1c1f' }}
            >
              <LoginForm />
            </div>

            <p className="mt-6 text-center text-xs" style={{ color: '#71717a' }}>
              No account?{' '}
              <Link href="/signup" style={{ color: '#f97316' }}>
                Create one free →
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
