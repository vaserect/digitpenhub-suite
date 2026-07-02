'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="mkt-nav">
      <div className="mkt-nav-inner">
        <Link href="/" className="mkt-brand">
          <img src="/logo.png" alt="" />
          <span>Digitpen Hub</span>
        </Link>
        <nav className="mkt-nav-links">
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <div className="mkt-nav-actions">
          <Link href="/login" className="mkt-nav-signin">Sign in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">Start free</Link>
        </div>
        <button
          className="mkt-nav-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {open && (
        <div className="mkt-nav-mobile">
          <Link href="/features" onClick={() => setOpen(false)}>Features</Link>
          <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
          <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>Start free</Link>
        </div>
      )}
    </header>
  );
}
