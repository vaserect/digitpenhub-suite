import Link from 'next/link';

export default function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-inner">
        <div className="mkt-brand">
          <img src="/logo.png" alt="" />
          <span>Digitpen Hub</span>
        </div>
        <nav className="mkt-footer-links">
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/signup">Start free</Link>
        </nav>
        <p className="mkt-footer-copy">© {new Date().getFullYear()} Digitpen Hub. All rights reserved.</p>
      </div>
    </footer>
  );
}
