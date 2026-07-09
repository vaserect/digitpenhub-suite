const API = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://suite.digitpenhub.com';

export async function generateMetadata() {
  let title = 'All Features';
  let description =
    '97 modules across marketing, AI, SEO, creative, business, commerce, education, productivity, analytics and utilities — under one roof.';

  try {
    const res = await fetch(`${API}/api/v1/content/public`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const c = data.content || {};
      if (c['features.hero.title']) {
        title = c['features.hero.title'].replace(/<[^>]*>/g, '');
      }
      if (c['features.hero.subtitle']) {
        description = c['features.hero.subtitle'].replace(/<[^>]*>/g, '');
      }
    }
  } catch {
    // Use defaults
  }

  return {
    title,
    description,
    alternates: { canonical: '/features' },
  };
}

export default function FeaturesLayout({ children }) {
  return children;
}
