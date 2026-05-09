'use client';

import { useState } from 'react';
import { Check, CheckCircle2, Circle, Copy, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import useAuthStore from '@/store/authStore';

const STEPS = [
  { id: 1, label: 'Install SDK' },
  { id: 2, label: 'Add to your code' },
  { id: 3, label: 'Make an API call' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <div className="relative rounded-lg bg-[#1e1e2e] font-mono text-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs text-white/40">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto px-4 py-4 leading-relaxed">{code}</pre>
    </div>
  );
}

function SyntaxCode({ apiKey }: { apiKey: string }) {
  const k = (s: string) => <span style={{ color: '#c792ea' }}>{s}</span>;
  const s = (v: string) => <span style={{ color: '#c3e88d' }}>{v}</span>;
  const fn = (v: string) => <span style={{ color: '#82aaff' }}>{v}</span>;
  const cm = (v: string) => <span style={{ color: '#546e7a' }}>{v}</span>;
  const plain = (v: string) => <span style={{ color: '#d4d4d4' }}>{v}</span>;

  const fullCode = `import { AISpendTracker } from '@ai-spend/tracker'
const tracker = new AISpendTracker('${apiKey}', {
  endpoint: 'http://localhost:3001',
})
tracker.initOpenAI(process.env.OPENAI_API_KEY)

const result = await tracker.openai.chat({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
  metadata: {
    feature: 'my-feature',
    userId: 'user_123',
  },
})`;

  return (
    <div className="relative rounded-lg bg-[#1e1e2e] font-mono text-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs text-white/40">typescript</span>
        <CopyButton text={fullCode} />
      </div>
      <pre className="overflow-x-auto px-4 py-4 leading-relaxed text-[#d4d4d4]">
        {k('import')} {plain('{ AISpendTracker } ')}
        {k('from')} {s("'@ai-spend/tracker'")}{'\n'}
        {k('const')} {fn('tracker')} {plain('= ')}
        {k('new')} {fn('AISpendTracker')}
        {plain("('")}
        <span style={{ color: '#f97316' }}>{apiKey}</span>
        {plain("', {")}
        {'\n'}
        {'  '}
        {plain('endpoint: ')}{s("'http://localhost:3001'")}{'\n'}
        {plain('})')}{'\n'}
        {fn('tracker')}{plain('.initOpenAI(process.env.')}{fn('OPENAI_API_KEY')}{plain(')')}{'\n\n'}
        {k('const')} {fn('result')} {plain('= ')}
        {k('await')} {fn('tracker')}{plain('.openai.')}{fn('chat')}{plain('({')}
        {'\n'}
        {'  '}{plain('model: ')}{s("'gpt-4o'")}{plain(',')}
        {'\n'}
        {'  '}{plain('messages: [{ role: ')}{s("'user'")}{plain(', content: ')}{s("'Hello!'")}
        {plain(' }],')}
        {'\n'}
        {'  '}{plain('metadata: {')}
        {'\n'}
        {'    '}{plain('feature: ')}{s("'my-feature'")}{plain(',')}
        {'\n'}
        {'    '}{plain('userId: ')}{s("'user_123'")}{plain(',')}
        {'\n'}
        {'  '}{plain('},')}
        {'\n'}
        {plain('})')}
      </pre>
    </div>
  );
}

interface SetupWizardProps {
  isWaiting: boolean;
}

export default function SetupWizard({ isWaiting }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const { user } = useAuthStore();
  const apiKey = user?.apiKey ?? 'YOUR_API_KEY';

  return (
    <div className="container-custom space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-semibold">Integration</h1>
        <p className="text-sm text-muted-foreground">
          Connect your app and start tracking automatically in under 2 minutes
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => setStep(s.id)}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-muted"
            >
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  step === s.id
                    ? 'bg-primary text-primary-foreground'
                    : step > s.id
                      ? 'bg-green-500 text-white'
                      : 'border border-border bg-muted text-muted-foreground',
                )}
              >
                {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  step === s.id ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn('h-px w-8 bg-border', step > s.id && 'bg-green-500/50')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-8 space-y-6">
          {step === 1 && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Terminal className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Install the SDK</p>
                  <p className="text-sm text-muted-foreground">
                    Add the tracker to your Node.js project
                  </p>
                </div>
              </div>

              <CodeBlock code="npm install @ai-spend/tracker" language="bash" />

              <p className="text-sm text-muted-foreground">
                Works with OpenAI, Anthropic, and Google Gemini. No config changes needed —
                it wraps your existing client.
              </p>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>Next: Add to your code →</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <p className="font-semibold">Add to your code</p>
                <p className="text-sm text-muted-foreground">
                  Replace your AI client with the tracker. Your API key is pre-filled.
                </p>
              </div>

              <SyntaxCode apiKey={apiKey} />

              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium">What the metadata fields do</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><code className="rounded bg-muted px-1 font-mono text-xs">feature</code> — groups spend by product feature (visible in Metadata Analytics)</p>
                  <p><code className="rounded bg-muted px-1 font-mono text-xs">userId</code> — tracks cost per user (visible in By User tab)</p>
                  <p><code className="rounded bg-muted px-1 font-mono text-xs">environment</code> — separates dev vs prod spend</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
                <Button onClick={() => setStep(3)}>Next: Make a call →</Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <p className="font-semibold">Make your first API call</p>
                <p className="text-sm text-muted-foreground">
                  Run your code and watch the event appear below in real time.
                </p>
              </div>

              {isWaiting ? (
                <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-16">
                  <div className="relative flex h-14 w-14 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20" />
                    <Circle className="relative h-8 w-8 text-primary/40" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Waiting for first event...</p>
                    <p className="text-sm text-muted-foreground">
                      Make an API call through the tracker and it will appear here automatically
                    </p>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    Checking every 10 seconds
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 rounded-lg border border-green-500/30 bg-green-500/5 py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <div className="text-center">
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      First event received!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Loading your live feed...
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-start">
                <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
