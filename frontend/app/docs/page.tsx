export default function DocsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f97316', marginBottom: 14 }}>Coming soon</p>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Documentation</h1>
        <p style={{ color: '#71717a', fontSize: 16, marginBottom: 28 }}>Full SDK docs and API reference are on the way.</p>
        <a href="/" style={{ color: '#f97316', textDecoration: 'none', fontSize: 14 }}>← Back to home</a>
      </div>
    </main>
  );
}
