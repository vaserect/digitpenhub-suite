import './globals.css'
import './animations.css'
import { Toaster } from 'sonner';
import { cookies } from 'next/headers';
import ClientLayoutWrapper from '../components/ui/ClientLayoutWrapper';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://suite.digitpenhub.com';

export const metadata = {
  title: {
    default: 'Digitpen Hub Suite — Everything your business runs on, one login.',
    template: '%s | Digitpen Hub Suite',
  },
  description:
    '302 business tools — CRM, websites, email/SMS marketing, invoicing, HR, AI, SEO, online store, LMS and more — under one roof. Free CRM & invoicing included.',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Digitpen Hub Suite — Everything your business runs on, one login.',
    description:
      '302 business tools — CRM, websites, email/SMS marketing, invoicing, HR, AI, SEO, online store, LMS and more — under one roof. Free CRM & invoicing included.',
    url: '/',
    type: 'website',
    siteName: 'Digitpen Hub Suite',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digitpen Hub Suite — Everything your business runs on, one login.',
    description:
      '302 business tools — CRM, websites, email/SMS marketing, invoicing, HR, AI, SEO, online store, LMS and more — under one roof. Free CRM & invoicing included.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  const hasSession = cookies().has('dph_session');
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('dph-theme');if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
        }} />
        <ClientLayoutWrapper hasSession={hasSession}>
          {children}
        </ClientLayoutWrapper>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
