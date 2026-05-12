'use client';

import { useState } from 'react';
import { Check, Copy, Zap } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { cn } from '@/lib/utils';

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1 text-xs transition-colors',
        copied
          ? 'text-emerald-400'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {copied ? (
        <Check className="h-3 w-3" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ─── Single step card ────────────────────────────────────────────────────────
function Step({
  number,
  title,
  code,
}: {
  number: string;
  title: string;
  code: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-[10px] font-bold text-orange-400">
          {number}
        </span>
        <span className="text-sm font-medium">Step {number} — {title}</span>
      </div>
      <div className="relative rounded-lg border border-border bg-black/40 px-4 pb-4 pt-3">
        <pre className="overflow-x-auto pr-14 font-mono text-xs leading-relaxed text-slate-300">
          {code}
        </pre>
        <div className="absolute right-3 top-3">
          <CopyBtn text={code} />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
interface ActivationGuideProps {
  /** Tighter padding for use inside table empty states */
  compact?: boolean;
  className?: string;
}

export default function ActivationGuide({
  compact = false,
  className,
}: ActivationGuideProps) {
  const user = useAuthStore((s) => s.user);
  const apiKey = user?.apiKey ?? 'ast_xxxx';

  const steps = [
    {
      number: '1',
      title: 'Install',
      code: 'npm install @ai-spend/tracker',
    },
    {
      number: '2',
      title: 'Initialize',
      code: `import { AISpendTracker } from '@ai-spend/tracker'

const tracker = new AISpendTracker({ apiKey: '${apiKey}' })
tracker.initOpenAI(process.env.OPENAI_API_KEY)`,
    },
    {
      number: '3',
      title: 'Wrap your first call',
      code: `await tracker.openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  metadata: { feature: 'my-feature' }
})`,
    },
  ];

  return (
    <div
      className={cn(
        'rounded-xl border border-indigo-500/20 bg-card shadow-[0_0_32px_rgba(249,115,22,0.07)]',
        compact ? 'p-6' : 'p-10',
        className,
      )}
    >
      <div className="mx-auto max-w-xl space-y-6">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/15">
            <Zap className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-snug">
              You&apos;re 2 minutes away from seeing your data
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Send your first event in 3 steps
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => (
            <Step key={step.number} {...step} />
          ))}
        </div>

        {/* API key row */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Your API key</p>
            <code className="mt-0.5 block truncate font-mono text-sm">
              {apiKey}
            </code>
          </div>
          <CopyBtn text={apiKey} className="ml-4 flex-shrink-0" />
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm text-muted-foreground">
            Waiting for first event…
          </span>
        </div>

      </div>
    </div>
  );
}
