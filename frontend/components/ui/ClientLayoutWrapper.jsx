'use client';

import { usePathname } from 'next/navigation';
import WorkspaceLayout from './WorkspaceLayout';

export default function ClientLayoutWrapper({ children, hasSession }) {
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  const isPublicPage = pathname === '/' ||
    pathname.startsWith('/templates') ||
    pathname === '/pricing' ||
    pathname === '/features' ||
    pathname.startsWith('/invoices/shared') ||
    pathname.startsWith('/leads/') ||
    pathname.startsWith('/forms/') ||
    pathname.startsWith('/p/') ||
    pathname.startsWith('/book/') ||
    pathname.startsWith('/invite/') ||
    pathname.startsWith('/portal/') ||
    pathname.startsWith('/store/') ||
    pathname.startsWith('/qr/') ||
    pathname.startsWith('/card/') ||
    pathname.startsWith('/quiz/') ||
    pathname.startsWith('/barcode/') ||
    pathname.startsWith('/verify-email/');

  // If not logged in, or on auth page, or on public page (except root homepage when logged in)
  if (!hasSession || isAuthPage || (isPublicPage && pathname !== '/')) {
    return <>{children}</>;
  }

  // Otherwise, wrap in Workspace Layout (Sidebar + Topbar)
  return <WorkspaceLayout>{children}</WorkspaceLayout>;
}
