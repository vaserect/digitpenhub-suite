import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 'var(--space-6)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 20px', display: 'block' }}>
          <rect width="48" height="48" rx="10" fill="url(#nf-logo)" />
          <path d="M16 17h9.5c3 0 6 2.5 6 7s-3 7-6 7H16V17z" fill="white" />
          <defs>
            <linearGradient id="nf-logo" x1="0" y1="0" x2="48" y2="48"><stop stopColor="var(--primary)" /><stop offset="1" stopColor="var(--accent)" /></linearGradient>
          </defs>
        </svg>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          404 — Page not found
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 var(--space-5)' }}>
          The page you are looking for doesn&apos;t exist or hasn&apos;t been built yet. Everything in the Suite is under active development.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'white', background: 'var(--primary)', textDecoration: 'none' }}>
            ← Back home
          </Link>
          <Link href="/features" style={{ padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)' }}>
            See features
          </Link>
        </div>
      </div>
    </div>
  );
}
