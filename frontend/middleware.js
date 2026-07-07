import { NextResponse } from 'next/server';

// This is a UX redirect only, not the real security boundary — the Express API
// independently re-verifies the session on every request regardless of this check.
export function middleware(request) {
  const { pathname } = request.nextUrl;
  // Auth pages: only meant for signed-out visitors; bounce signed-in users to the app.
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')
    || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');
  // Public marketing front door — '/' renders a marketing homepage for signed-out
  // visitors and the app for signed-in ones (decided server-side in app/page.jsx).
  const isPublicMarketing = pathname === '/' || pathname === '/pricing' || pathname === '/features';
  const isPublicInvoicePage = pathname.startsWith('/invoices/shared');
  const isPublicLeadForm = pathname.startsWith('/leads/');
  const isPublicForm = pathname.startsWith('/forms/');
  const isPublicPage = pathname.startsWith('/p/');
  const isPublicBooking = pathname.startsWith('/book/');
  const isPublicInvite = pathname.startsWith('/invite/');
  const isPublicPortal = pathname.startsWith('/portal/');
  const isPublicStore = pathname.startsWith('/store/');
  const isPublicSeoFile = pathname === '/robots.txt' || pathname === '/sitemap.xml';
  const hasSessionCookie = request.cookies.has('dph_session');

  if (!hasSessionCookie && !isAuthPage && !isPublicMarketing && !isPublicInvoicePage && !isPublicLeadForm && !isPublicForm && !isPublicPage && !isPublicBooking && !isPublicInvite && !isPublicPortal && !isPublicStore && !isPublicSeoFile) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (hasSessionCookie && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|api).*)'],
};
