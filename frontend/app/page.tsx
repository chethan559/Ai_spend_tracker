'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ─── Constants ──────────────────────────────────────────────────────────────
const ORANGE = '#f97316';
const ORANGE_DIM = 'rgba(249,115,22,0.1)';
const ORANGE_BORDER = 'rgba(249,115,22,0.25)';
const BG = '#0a0a0b';
const CARD = '#111113';
const BORDER = '#1c1c1f';
const TEXT = '#ffffff';
const MUTED = '#71717a';
const FAINT = '#27272a';

// ─── Fade in on scroll ──────────────────────────────────────────────────────
function Fade({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    };

    // Already in viewport on load — show immediately (CSS transition handles delay)
    if (el.getBoundingClientRect().top < window.innerHeight) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          observer.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: 'translateY(14px)',
        transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

// ─── Sparkline SVG ──────────────────────────────────────────────────────────
function Spark({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const r = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 64},${18 - ((v - min) / r) * 14 - 2}`)
    .join(' ');
  return (
    <svg width={64} height={18} style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={ORANGE}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Mock FeatureBreakdownTable ─────────────────────────────────────────────
const ROWS = [
  { name: 'chat-assistant',   cost: 12.44, req: 384, pct: 48, spark: [4,7,6,10,8,12,15] },
  { name: 'resume-parser',    cost:  4.21, req: 142, pct: 16, spark: [2,3,4, 3,5, 4, 6] },
  { name: 'content-generator',cost:  3.76, req: 128, pct: 14, spark: [3,5,3, 6,4, 6, 5] },
  { name: 'email-summarizer', cost:  1.09, req:  37, pct:  4, spark: [1,2,1, 2,1, 2, 1] },
] as const;

function barColor(pct: number) {
  if (pct > 40) return '#ef4444';
  if (pct > 20) return '#f59e0b';
  return '#22c55e';
}

function MockTable() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* header */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Feature Breakdown</span>
        <span style={{ fontSize: 12, background: ORANGE_DIM, border: `1px solid ${ORANGE_BORDER}`, color: ORANGE, borderRadius: 20, padding: '2px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORANGE, display: 'inline-block' }} />
          Live
        </span>
      </div>
      {/* table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
            {['Feature', 'Cost', 'Requests', '% of Total', '7d'].map((h, i) => (
              <th key={h} style={{ padding: '10px 20px', textAlign: i > 0 && i < 3 ? 'right' : i === 3 ? 'left' : 'center', color: MUTED, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr
              key={r.name}
              onMouseEnter={() => setActive(r.name)}
              onMouseLeave={() => setActive(null)}
              style={{ borderBottom: `1px solid ${BORDER}`, background: active === r.name ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.12s', cursor: 'default' }}
            >
              <td style={{ padding: '12px 20px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
                  <span style={{ color: TEXT, fontWeight: 500 }}>{r.name}</span>
                </span>
              </td>
              <td style={{ padding: '12px 20px', textAlign: 'right', color: TEXT, fontFamily: 'monospace', fontWeight: 600 }}>${r.cost.toFixed(2)}</td>
              <td style={{ padding: '12px 20px', textAlign: 'right', color: MUTED }}>{r.req}</td>
              <td style={{ padding: '12px 20px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1, height: 4, borderRadius: 4, background: FAINT, overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${r.pct}%`, background: barColor(r.pct), borderRadius: 4 }} />
                  </span>
                  <span style={{ color: MUTED, fontSize: 11, width: 30, textAlign: 'right' }}>{r.pct}%</span>
                </span>
              </td>
              <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                <span style={{ display: 'inline-block' }}><Spark values={[...r.spark]} /></span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* footer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: `1px solid ${BORDER}` }}>
        {[['Total', '$21.50'], ['Requests', '691'], ['Avg/req', '$0.031']].map(([k, v]) => (
          <div key={k} style={{ padding: '12px 20px', borderRight: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Code block ─────────────────────────────────────────────────────────────
const TOKENS = [
  [{ t: '$ npm install ', c: MUTED }, { t: '@ai-spend/tracker', c: TEXT }],
  [],
  [{ t: 'import ', c: '#c084fc' }, { t: '{ AISpendTracker } ', c: TEXT }, { t: 'from ', c: '#c084fc' }, { t: "'@ai-spend/tracker'", c: '#86efac' }],
  [{ t: 'const ', c: '#c084fc' }, { t: 'tracker', c: '#7dd3fc' }, { t: ' = new ', c: TEXT }, { t: 'AISpendTracker', c: '#7dd3fc' }, { t: "({ apiKey: '", c: TEXT }, { t: 'ast_xxxx', c: '#86efac' }, { t: "' })", c: TEXT }],
  [],
  [{ t: '// drop-in replacement — nothing else changes', c: '#52525b' }],
  [{ t: 'const ', c: '#c084fc' }, { t: 'res', c: '#7dd3fc' }, { t: ' = await ', c: TEXT }, { t: 'tracker.openai.chat.completions.', c: TEXT }, { t: 'create', c: '#7dd3fc' }, { t: '({', c: TEXT }],
  [{ t: '  model', c: '#7dd3fc' }, { t: ': ', c: TEXT }, { t: "'gpt-4o'", c: '#86efac' }, { t: ', messages: [...]', c: TEXT }],
  [{ t: '  metadata: { ', c: TEXT }, { t: 'feature', c: '#7dd3fc' }, { t: ': ', c: TEXT }, { t: "'resume-parser'", c: '#86efac' }, { t: ', ', c: TEXT }, { t: 'userId', c: '#7dd3fc' }, { t: ': ', c: TEXT }, { t: "'u_123'", c: '#86efac' }, { t: ' }', c: TEXT }],
  [{ t: '})', c: TEXT }],
];

const RAW = `npm install @ai-spend/tracker

import { AISpendTracker } from '@ai-spend/tracker'
const tracker = new AISpendTracker({ apiKey: 'ast_xxxx' })

// drop-in replacement — nothing else changes
const res = await tracker.openai.chat.completions.create({
  model: 'gpt-4o', messages: [...]
  metadata: { feature: 'resume-parser', userId: 'u_123' }
})`;

function CodeBlock() {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ background: '#0d0d0f', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.6 }} />)}
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(RAW); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          style={{ fontSize: 11, color: copied ? '#22c55e' : MUTED, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '18px 20px', fontSize: 12.5, lineHeight: 1.8, overflowX: 'auto' }}>
        <code>
          {TOKENS.map((line, li) => (
            <div key={li}>
              {line.length === 0
                ? <span>&nbsp;</span>
                : line.map((tok, ti) => <span key={ti} style={{ color: tok.c }}>{tok.t}</span>)
              }
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

// ─── Demo modal ─────────────────────────────────────────────────────────────
function DemoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 640, background: BG, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Live Dashboard Preview</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 20, lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          <MockTable />
          <p style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: FAINT }}>
            Real data from your app. Refresh every 30 seconds.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function Page() {
  const [demo, setDemo] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {demo && <DemoModal onClose={() => setDemo(false)} />}

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, borderBottom: `1px solid ${BORDER}`, background: 'rgba(10,10,11,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, color: TEXT, textDecoration: 'none' }}>
            <span style={{ width: 26, height: 26, background: ORANGE, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>$</span>
            AI Spend Tracker
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div style={{ display: 'flex', gap: 24, fontSize: 14, color: MUTED }} className="hidden-mobile">
              {[['Features','#features'],['Pricing','#pricing'],['Docs','#'],['GitHub','#']].map(([l,h]) => (
                <a key={l} href={h} style={{ color: MUTED, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                  onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
                >{l}</a>
              ))}
            </div>
            <Link href="/signup" style={{ background: ORANGE, color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '96px 24px 80px', textAlign: 'center' }}>
        <Fade>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: ORANGE_DIM, border: `1px solid ${ORANGE_BORDER}`, borderRadius: 20, padding: '5px 14px', marginBottom: 32, fontSize: 13, color: ORANGE, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORANGE, display: 'inline-block' }} />
            Public beta · free to start
          </div>
        </Fade>

        <Fade delay={0.06}>
          <h1 style={{ fontSize: 'clamp(38px,6vw,62px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24, color: TEXT }}>
            Stop guessing which AI feature<br />
            <span style={{ color: ORANGE }}>is burning your budget</span>
          </h1>
        </Fade>

        <Fade delay={0.12}>
          <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.65, maxWidth: 520, margin: '0 auto 36px', fontWeight: 400 }}>
            See cost by feature, user, and model — in real time.
            One line of code. No infrastructure changes.
          </p>
        </Fade>

        <Fade delay={0.17}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <Link href="/signup" style={{ background: ORANGE, color: '#fff', padding: '12px 28px', borderRadius: 9, fontSize: 15, fontWeight: 700, textDecoration: 'none', transition: 'opacity 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Start free — no card required
            </Link>
            <button onClick={() => setDemo(true)} style={{ background: 'none', border: `1px solid ${BORDER}`, color: MUTED, padding: '12px 24px', borderRadius: 9, fontSize: 15, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = MUTED; e.currentTarget.style.color = TEXT; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
            >
              View demo →
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#3f3f46' }}>
            Tracking AI spend for <span style={{ color: MUTED }}>340+ developers</span>
          </p>
        </Fade>

        <Fade delay={0.24}>
          <div style={{ marginTop: 52 }}>
            <MockTable />
          </div>
        </Fade>
      </section>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}` }} />

      {/* ── Problem ────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 24px' }}>
        <Fade>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,36px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            You ship AI features. Then the bill arrives.
          </h2>
          <p style={{ color: MUTED, fontSize: 16, marginBottom: 48, maxWidth: 480 }}>
            Most teams have no idea where their AI spend is going until it's too late.
          </p>
        </Fade>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
          {[
            ['Your OpenAI bill is $800.', 'You have no idea which feature caused it. You start guessing.'],
            ['One user is making 500 requests a day.', 'You find out a month later when accounting asks questions.'],
            ['You switched to Claude Haiku to save money.', "Did it actually work? You have no way to measure it."],
          ].map(([title, body], i) => (
            <Fade key={i} delay={i * 0.07}>
              <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 10, padding: '22px 22px' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 8, lineHeight: 1.4 }}>{title}</p>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{body}</p>
              </div>
            </Fade>
          ))}
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${BORDER}` }} />

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 24px' }}>
        <Fade>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: ORANGE, marginBottom: 14 }}>How it works</p>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,36px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 56 }}>
            Up and running in 2 minutes
          </h2>
        </Fade>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 0 }}>
          {[
            {
              n: '01',
              title: 'Install the SDK',
              body: 'npm install @ai-spend/tracker. Wrap your existing AI calls — no other changes needed.',
              extra: <div style={{ marginTop: 20 }}><CodeBlock /></div>,
            },
            {
              n: '02',
              title: 'Tag your calls',
              body: "Pass a feature name, user ID, or environment in the metadata field. That's it.",
              extra: null,
            },
            {
              n: '03',
              title: 'See it in real time',
              body: 'Your dashboard shows cost by feature, user, and model. Drill in, set budgets, get alerts.',
              extra: null,
            },
          ].map(({ n, title, body, extra }, i) => (
            <Fade key={n} delay={i * 0.07}>
              <div style={{ padding: '0 32px 0 0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: '0.08em', marginBottom: 14 }}>{n}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.01em' }}>{title}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>{body}</p>
                {extra}
              </div>
            </Fade>
          ))}
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${BORDER}` }} />

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 24px' }}>
        <Fade>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: ORANGE, marginBottom: 14 }}>Features</p>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,36px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 56 }}>
            Everything you need to control AI costs
          </h2>
        </Fade>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2 }}>
          {[
            { icon: '⬡', title: 'Cost by feature', body: 'Tag each call with a feature name. Know exactly which parts of your product are expensive.' },
            { icon: '◎', title: 'Cost by user', body: 'Spot your most expensive users instantly. Set limits before they become a problem.' },
            { icon: '▦', title: 'Model comparison', body: 'Switch from GPT-4 to Haiku? See the cost delta immediately, per feature.' },
            { icon: '◈', title: 'Budget alerts', body: 'Daily and monthly limits per feature or project. Slack and email before you overspend.' },
            { icon: '≡', title: 'Drill-down charts', body: 'Click any feature to see its daily cost trend over any date range.' },
            { icon: '⤓', title: 'CSV export', body: 'Export everything for your accountant, your investors, or your own analysis.' },
          ].map(({ icon, title, body }, i) => (
            <Fade key={title} delay={i * 0.05}>
              <div
                style={{ padding: '24px 24px', borderRadius: 10, border: `1px solid transparent`, transition: 'all 0.15s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.background = CARD; e.currentTarget.style.borderColor = BORDER; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div style={{ fontSize: 20, marginBottom: 12, color: ORANGE }}>{icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{body}</div>
              </div>
            </Fade>
          ))}
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${BORDER}` }} />

      {/* ── Pricing ────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 24px' }}>
        <Fade>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: ORANGE, marginBottom: 14 }}>Pricing</p>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,36px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Simple, honest pricing
          </h2>
          <p style={{ fontSize: 15, color: MUTED, marginBottom: 52 }}>Start free. Upgrade when you need it. No surprises.</p>
        </Fade>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
          {[
            {
              name: 'Free',
              price: '$0',
              per: '',
              tag: null,
              items: ['50,000 events / month', '3 projects', '7-day retention', 'Community support'],
              cta: 'Get started',
              href: '/signup',
            },
            {
              name: 'Starter',
              price: '$29',
              per: '/mo',
              tag: 'Most popular',
              items: ['500,000 events / month', 'Unlimited projects', '90-day retention', 'Slack + email alerts', 'CSV export'],
              cta: 'Start 14-day trial',
              href: '/signup?plan=starter',
            },
            {
              name: 'Growth',
              price: '$99',
              per: '/mo',
              tag: null,
              items: ['Unlimited events', 'Unlimited projects', '1-year retention', 'Team seats (5)', 'API access', 'Priority support'],
              cta: 'Start 14-day trial',
              href: '/signup?plan=growth',
            },
          ].map(({ name, price, per, tag, items, cta, href }, i) => {
            const featured = !!tag;
            return (
              <Fade key={name} delay={i * 0.07}>
                <div style={{ background: featured ? CARD : 'transparent', border: `1px solid ${featured ? ORANGE_BORDER : BORDER}`, borderRadius: 12, padding: '28px 24px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                  {tag && (
                    <span style={{ position: 'absolute', top: -11, left: 20, background: ORANGE, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
                      {tag}
                    </span>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 10 }}>{name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                    <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em' }}>{price}</span>
                    {per && <span style={{ fontSize: 14, color: MUTED }}>{per}</span>}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {items.map(it => (
                      <li key={it} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: MUTED }}>
                        <span style={{ color: ORANGE, flexShrink: 0, marginTop: 1 }}>✓</span>
                        {it}
                      </li>
                    ))}
                  </ul>
                  <Link href={href} style={{ display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.15s', ...(featured ? { background: ORANGE, color: '#fff' } : { border: `1px solid ${BORDER}`, color: TEXT, background: 'transparent' }) }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {cta}
                  </Link>
                  {featured && <p style={{ textAlign: 'center', fontSize: 11, color: MUTED, marginTop: 10 }}>$0.00 due today · cancel anytime</p>}
                </div>
              </Fade>
            );
          })}
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${BORDER}` }} />

      {/* ── Bottom CTA ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
        <Fade>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 16 }}>
            Know your AI costs by tomorrow
          </h2>
          <p style={{ fontSize: 16, color: MUTED, marginBottom: 36, lineHeight: 1.6 }}>
            Install the SDK, tag your calls, and see exactly where every dollar goes.
          </p>
          <Link href="/signup" style={{ display: 'inline-block', background: ORANGE, color: '#fff', padding: '13px 32px', borderRadius: 9, fontSize: 16, fontWeight: 700, textDecoration: 'none', transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Start free
          </Link>
          <p style={{ fontSize: 12, color: '#3f3f46', marginTop: 14 }}>Free forever · no credit card · 2-minute setup</p>
        </Fade>
      </section>

      <div style={{ borderTop: `1px solid ${BORDER}` }} />

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 14, marginBottom: 5 }}>
            <span style={{ width: 22, height: 22, background: ORANGE, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>$</span>
            AI Spend Tracker
          </div>
          <p style={{ fontSize: 12, color: '#3f3f46' }}>Built by indie developers, for indie developers.</p>
        </div>
        <nav style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {['Privacy','Terms','Docs','GitHub','Twitter'].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: '#3f3f46', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = MUTED)}
              onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}
            >{l}</a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
