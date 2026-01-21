'use client';

import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const authed = isAuthenticated();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 text-center dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="flex w-full max-w-3xl flex-col items-center gap-6">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          AI Spend Tracker
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Track and optimize your AI API costs
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {authed ? (
            <Button asChild size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
