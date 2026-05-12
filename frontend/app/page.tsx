'use client';

import { useState, useEffect } from 'react';
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

// ─── Fade — renders immediately, no opacity:0 flash ─────────────────────────
function Fade({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
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

// ─── Bar color helper ────────────────────────────────────────────────────────
function barColor(pct: number) {
  if (pct > 40) return '#ef4444';
  if (pct > 20) return '#f59e0b';
  return '#22c55e';
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

// ─── Metadata code block (Step 02) ──────────────────────────────────────────
const META_TOKENS = [
  [{ t: 'metadata', c: '#7dd3fc' }, { t: ': {', c: TEXT }],
  [{ t: "  feature", c: '#7dd3fc' }, { t: ': ', c: TEXT }, { t: "'resume-parser'", c: '#86efac' }, { t: ',', c: TEXT }],
  [{ t: "  userId", c: '#7dd3fc' }, { t: ': ', c: TEXT }, { t: "'u_123'", c: '#86efac' }, { t: ',', c: TEXT }],
  [{ t: "  environment", c: '#7dd3fc' }, { t: ': ', c: TEXT }, { t: "'production'", c: '#86efac' }],
  [{ t: '}', c: TEXT }],
];

function MetaCodeBlock() {
  return (
    <div style={{ marginTop: 20, background: '#0d0d0f', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
      <pre style={{ margin: 0, padding: '16px 20px', fontSize: 12.5, lineHeight: 1.8, overflowX: 'auto' }}>
        <code>
          {META_TOKENS.map((line, li) => (
            <div key={li}>
              {line.map((tok, ti) => <span key={ti} style={{ color: tok.c }}>{tok.t}</span>)}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

// ─── Mini dashboard preview (Step 03) ───────────────────────────────────────
const PREVIEW_ROWS = [
  { name: 'resume-parser',    cost:  4.21, pct: 33 },
  { name: 'chat-assistant',   cost: 12.44, pct: 48 },
  { name: 'email-summarizer', cost:  1.09, pct:  8 },
];

function MiniDashboard() {
  return (
    <div style={{ background: '#0d0d0f', border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', fontSize: 12 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ fontWeight: 600, color: TEXT }}>Feature Breakdown</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: ORANGE, fontSize: 11 }}>
          <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
            <span className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ORANGE, opacity: 0.7 }} />
            <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: ORANGE }} />
          </span>
          Live
        </span>
      </div>
      {/* rows */}
      {PREVIEW_ROWS.map(r => (
        <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
          <span style={{ flex: 1, color: TEXT, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.name}
          </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: TEXT, flexShrink: 0 }}>
            ${r.cost.toFixed(2)}
          </span>
          <div style={{ width: 56, height: 4, borderRadius: 4, background: FAINT, flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ width: `${r.pct}%`, height: '100%', background: barColor(r.pct), borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Hero dashboard mockup ───────────────────────────────────────────────────
const HD_ROWS_DATA = [
  { id: 'chat-assistant',    cost: 12.44, req: 384, pct: 48, spark: [4,7,6,10,8,12,15] },
  { id: 'resume-parser',     cost:  4.21, req: 142, pct: 16, spark: [2,3,4,3,5,4,6]   },
  { id: 'content-generator', cost:  3.76, req: 128, pct: 14, spark: [3,5,3,6,4,6,5]   },
  { id: 'email-summarizer',  cost:  1.09, req:  37, pct:  4, spark: [1,2,1,2,1,2,1]   },
];

const LIVE_EVENTS = [
  { provider: 'openai',    model: 'gpt-4o',            feature: 'chat-assistant',    cost: 0.0041 },
  { provider: 'anthropic', model: 'claude-3-5-sonnet', feature: 'resume-parser',     cost: 0.0023 },
  { provider: 'openai',    model: 'gpt-4o-mini',       feature: 'email-summarizer',  cost: 0.0008 },
  { provider: 'google',    model: 'gemini-1.5-flash',  feature: 'content-generator', cost: 0.0012 },
  { provider: 'anthropic', model: 'claude-3-haiku',    feature: 'chat-assistant',    cost: 0.0019 },
];

const DASH_DAILY   = [14.2, 18.1, 15.8, 22.3, 19.7, 25.4, 21.9, 28.2, 23.8, 26.5, 24.1, 32.7, 29.4, 33.9];
const DASH_NAV     = ['Overview', 'By Feature', 'By User', 'By Model', 'Budgets', 'Projects', 'Integration'];
const DASH_PERIODS = ['24h', '7d', '30d', '3m'];
const PROVIDER_DOT: Record<string, string> = { openai: '#10A37F', anthropic: '#D97706', google: '#4285F4' };
let _hdId = 10;

interface TickerEvent { id: number; provider: string; model: string; feature: string; cost: number; label: string }

function DashBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 58 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, height: `${(v / max) * 100}%`, borderRadius: '2px 2px 0 0', background: i === data.length - 1 ? ORANGE : 'rgba(249,115,22,0.28)' }} />
      ))}
    </div>
  );
}

function HeroDashboard() {
  const [activeNav, setActiveNav] = useState('Overview');
  const [period, setPeriod]       = useState('7d');
  const [spend, setSpend]         = useState(284.73);
  const [reqs, setReqs]           = useState(9241);
  const [flash, setFlash]         = useState<string | null>(null);
  const [ticker, setTicker]       = useState<TickerEvent[]>(() =>
    LIVE_EVENTS.slice(0, 4).map((e, i) => ({ ...e, id: i, label: i === 0 ? 'just now' : `${(i + 1) * 9}s ago` }))
  );

  useEffect(() => {
    const iv = setInterval(() => {
      const inc = 0.001 + Math.random() * 0.007;
      setSpend(s => Math.round((s + inc) * 10000) / 10000);
      setReqs(r => r + Math.floor(Math.random() * 3) + 1);

      const row = HD_ROWS_DATA[Math.floor(Math.random() * HD_ROWS_DATA.length)];
      setFlash(row.id);
      setTimeout(() => setFlash(null), 800);

      const tmpl = LIVE_EVENTS[Math.floor(Math.random() * LIVE_EVENTS.length)];
      const newEv: TickerEvent = {
        ...tmpl,
        cost: Math.round((tmpl.cost + (Math.random() * 0.002 - 0.001)) * 10000) / 10000,
        id: ++_hdId,
        label: 'just now',
      };
      setTicker(prev => [newEv, ...prev.slice(0, 4).map((e, i) => ({ ...e, label: `${(i + 1) * 8}s ago` }))]);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const avg = (spend / reqs).toFixed(4);
  const COL = '1fr 68px 44px 88px 52px';

  return (
    <div style={{ background: '#0d0d18', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', textAlign: 'left', userSelect: 'none' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 22, height: 22, background: ORANGE, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>$</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>AI Spend Tracker</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: ORANGE }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7 }}>
              <span className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ORANGE, opacity: 0.65 }} />
              <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: ORANGE }} />
            </span>
            Live
          </span>
          <div style={{ display: 'flex', gap: 3 }}>
            {DASH_PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', border: 'none', background: period === p ? ORANGE : FAINT, color: period === p ? '#fff' : MUTED, transition: 'all 0.15s', fontFamily: 'inherit' }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Body: sidebar + main */}
      <div style={{ display: 'flex' }}>

        {/* Sidebar */}
        <div style={{ width: 148, borderRight: `1px solid ${BORDER}`, flexShrink: 0, padding: '10px 0' }}>
          {DASH_NAV.map(item => (
            <button key={item} onClick={() => setActiveNav(item)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 12, cursor: 'pointer', border: 'none', borderLeft: `2px solid ${activeNav === item ? ORANGE : 'transparent'}`, background: activeNav === item ? 'rgba(249,115,22,0.08)' : 'transparent', color: activeNav === item ? ORANGE : MUTED, transition: 'all 0.12s', fontFamily: 'inherit' }}>
              {item}
            </button>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: 14, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { label: 'Total Spend',    value: `$${spend.toFixed(2)}` },
              { label: 'Total Requests', value: reqs.toLocaleString() },
              { label: 'Avg Cost / Req', value: `$${avg}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, letterSpacing: '-0.03em', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Daily bar chart */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Daily Spend — Last 14 Days</div>
            <DashBarChart data={DASH_DAILY} />
          </div>

          {/* Feature breakdown table */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: COL, borderBottom: `1px solid ${BORDER}`, padding: '6px 12px', gap: 8 }}>
              {['Feature', 'Cost', 'Req', '% of Total', '7d'].map((h, i) => (
                <div key={h} style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 0 ? 'left' : 'right' }}>{h}</div>
              ))}
            </div>
            {HD_ROWS_DATA.map(r => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: COL, alignItems: 'center', padding: '7px 12px', gap: 8, borderBottom: `1px solid ${BORDER}`, background: flash === r.id ? 'rgba(249,115,22,0.1)' : 'transparent', transition: 'background 0.5s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: TEXT, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.id}</span>
                </div>
                <div style={{ fontSize: 12, color: TEXT, fontWeight: 600, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>${r.cost.toFixed(2)}</div>
                <div style={{ fontSize: 12, color: MUTED, textAlign: 'right' }}>{r.req}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                  <div style={{ width: 44, height: 3, borderRadius: 2, background: FAINT, overflow: 'hidden' }}>
                    <div style={{ width: `${r.pct}%`, height: '100%', background: barColor(r.pct), borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, color: MUTED, width: 26, textAlign: 'right' }}>{r.pct}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Spark values={[...r.spark]} />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Live ticker */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.35)', padding: '6px 18px', display: 'flex', alignItems: 'center', gap: 16, overflow: 'hidden' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: ORANGE, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live</span>
        <div style={{ display: 'flex', gap: 20, overflow: 'hidden' }}>
          {ticker.slice(0, 4).map(ev => (
            <span key={ev.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: MUTED, whiteSpace: 'nowrap' }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: PROVIDER_DOT[ev.provider] ?? MUTED, flexShrink: 0 }} />
              <span style={{ color: PROVIDER_DOT[ev.provider] ?? MUTED }}>{ev.provider}</span>
              <span>{ev.model}</span>
              <span style={{ color: TEXT, fontFamily: "'JetBrains Mono', monospace" }}>${ev.cost.toFixed(4)}</span>
              <span style={{ color: ORANGE }}>{ev.feature}</span>
              <span style={{ color: '#3f3f46' }}>{ev.label}</span>
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Friction reducer line ───────────────────────────────────────────────────
function FrictionNote() {
  return (
    <p style={{ fontSize: 12, color: '#3f3f46', marginTop: 8, textAlign: 'center' }}>
      No credit card · 50K events free · cancel anytime
    </p>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, borderBottom: `1px solid ${BORDER}`, background: 'rgba(10,10,11,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, color: TEXT, textDecoration: 'none' }}>
            <span style={{ width: 26, height: 26, background: ORANGE, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>$</span>
            AI Spend Tracker
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div style={{ display: 'flex', gap: 24, fontSize: 14, color: MUTED }} className="hidden-mobile">
              {[
                ['Features', '#features'],
                ['Pricing', '#pricing'],
                ['Docs', '/docs'],
                ['GitHub', 'https://github.com/chethan559/Ai_spend_tracker'],
              ].map(([l, h]) => (
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
      <section style={{ padding: '96px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
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
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            <div>
              <Link href="/signup" style={{ display: 'inline-block', background: ORANGE, color: '#fff', padding: '12px 28px', borderRadius: 9, fontSize: 15, fontWeight: 700, textDecoration: 'none', transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Start free — no card required
              </Link>
            </div>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: `1px solid ${BORDER}`, color: MUTED, padding: '12px 24px', borderRadius: 9, fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = MUTED; e.currentTarget.style.color = TEXT; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
            >
              View demo →
            </Link>
          </div>
          <p style={{ fontSize: 13, color: '#3f3f46', marginTop: 12 }}>
            Free forever · 50K events/month · no credit card
          </p>
        </Fade>
        </div>

        <Fade delay={0.24}>
          <div style={{ maxWidth: 1100, margin: '52px auto 0' }}>
            <HeroDashboard />
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, alignItems: 'stretch' }}>
          {/* ── Step 01 ── */}
          <Fade delay={0}>
            <div style={{ display: 'flex', flexDirection: 'column', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28, height: '100%' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: '0.08em', marginBottom: 14 }}>01</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.01em' }}>Install the SDK</h3>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>One command. Works with OpenAI, Anthropic, and Gemini.</p>
              <div style={{ marginTop: 'auto', paddingTop: 20 }}><CodeBlock /></div>
            </div>
          </Fade>

          {/* ── Step 02 ── */}
          <Fade delay={0.07}>
            <div style={{ display: 'flex', flexDirection: 'column', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28, height: '100%' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: '0.08em', marginBottom: 14 }}>02</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.01em' }}>Tag your calls</h3>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>Add a feature name and userId. That single line unlocks the entire breakdown.</p>
              <div style={{ marginTop: 'auto', paddingTop: 20 }}><MetaCodeBlock /></div>
            </div>
          </Fade>

          {/* ── Step 03 ── */}
          <Fade delay={0.14}>
            <div style={{ display: 'flex', flexDirection: 'column', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28, height: '100%' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: '0.08em', marginBottom: 14 }}>03</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.01em' }}>See it in real time</h3>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>Your dashboard updates instantly. Know your most expensive feature in seconds.</p>
              <div style={{ marginTop: 'auto', paddingTop: 20 }}><MiniDashboard /></div>
            </div>
          </Fade>
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
            { icon: '⬡', title: 'Cost by feature', body: 'Know which AI features are profitable before your next sprint review.' },
            { icon: '◎', title: 'Cost by user', body: 'Stop your 3 most expensive users from eating 40% of your budget undetected.' },
            { icon: '▦', title: 'Model comparison', body: 'Switch from GPT-4 to Haiku? See the cost delta immediately, per feature.' },
            { icon: '◈', title: 'Budget alerts', body: 'Get Slack or email before you overspend — not after the invoice arrives.' },
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
              items: ['50,000 events / month', '1 project', '30-day retention', 'Free forever — no expiry', 'Community support'],
              cta: 'Get started',
              href: '/signup',
            },
            {
              name: 'Starter',
              price: '$29',
              per: '/mo',
              tag: 'Most popular',
              items: ['500,000 events / month', '3 projects', '90-day retention', 'Budget alerts + Slack/email', 'CSV export'],
              cta: 'Get early access →',
              href: '/signup?plan=starter',
            },
            {
              name: 'Growth',
              price: '$99',
              per: '/mo',
              tag: null,
              items: ['Unlimited events', 'Unlimited projects', '1-year retention', 'Team seats (5)', 'API access', 'Priority support'],
              cta: 'Get early access →',
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
                  <FrictionNote />
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
          <FrictionNote />
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
          <p style={{ fontSize: 12, color: '#3f3f46' }}>
            Built by{' '}
            <a
              href="https://www.linkedin.com/in/chethan-kumar"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: MUTED, textDecoration: 'none' }}
            >
              Chethan Kumar
            </a>
            {' '}— tired of OpenAI bill shock.
          </p>
        </div>
        <nav style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            ['Privacy', '/privacy'],
            ['Terms', '/terms'],
            ['Docs', '/docs'],
            ['GitHub', 'https://github.com/chethan559/Ai_spend_tracker'],
          ].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 13, color: '#3f3f46', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = MUTED)}
              onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}
            >{l}</a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
