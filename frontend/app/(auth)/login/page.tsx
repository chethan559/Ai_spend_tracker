import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in | AI Spend Tracker',
  description: 'Sign in to AI Spend Tracker to monitor your AI costs.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-10 text-white md:flex">
          <div>
            <div className="text-2xl font-semibold">AI Spend Tracker</div>
            <p className="mt-3 text-sm text-slate-200">
              Track and optimize your AI API costs
            </p>
          </div>
          <div className="space-y-4 text-sm text-slate-200">
            <p>• Centralized spend analytics across providers</p>
            <p>• Real-time cost visibility per model and project</p>
            <p>• Budget alerts to keep usage under control</p>
          </div>
        </div>

        <div className="flex flex-col justify-center px-6 py-12 sm:px-10">
          <div className="mx-auto w-full max-w-md">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 space-y-2">
                <h1 className="text-2xl font-semibold">Welcome back</h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to continue tracking your AI spend.
                </p>
              </div>

              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
