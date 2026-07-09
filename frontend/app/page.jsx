import { cookies } from 'next/headers';
import AppShell from '../components/AppShell';
import MarketingHome from '../components/marketing/MarketingHome';

const API = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://suite.digitpenhub.com';

export async function generateMetadata() {
  let title = "Everything your business runs on, one login.";
  let description =
    '97 business tools — CRM, websites, email/SMS marketing, invoicing, HR, AI, SEO, online store, LMS and more — under one roof. Free CRM & invoicing included.';

  try {
    const res = await fetch(`${API}/api/v1/content/public`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const c = data.content || {};
      if (c['homepage.hero.title']) {
        title = c['homepage.hero.title'].replace(/<[^>]*>/g, '');
      }
      if (c['homepage.hero.subtitle']) {
        description = c['homepage.hero.subtitle'].replace(/<[^>]*>/g, '');
      }
    }
  } catch {
    // Use defaults
  }

  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: {
      title,
      description,
      url: '/',
      type: 'website',
      siteName: 'Digitpen Hub Suite',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function Home() {
  const hasSession = cookies().has('dph_session');
  return hasSession ? <AppShell /> : <MarketingHome />;
}
