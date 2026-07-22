const API = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://suite.digitpenhub.com';

export async function generateMetadata() {
  let title = 'Pricing';
  let totalModules = 302;
  
  try {
    const statsRes = await fetch(`${API}/api/v1/modules/stats`, { cache: 'no-store' });
    if (statsRes.ok) {
      const stats = await statsRes.json();
      totalModules = stats.totalModules || 302;
    }
  } catch {}

  let description =
    `Start on free CRM and invoicing. Upgrade for all ${totalModules} modules, more seats, and higher send limits. No card required to start.`;

  try {
    const res = await fetch(`${API}/api/v1/content/public`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const c = data.content || {};
      if (c['pricing.hero.title']) {
        title = c['pricing.hero.title'].replace(/<[^>]*>/g, '');
      }
      if (c['pricing.hero.subtitle']) {
        description = c['pricing.hero.subtitle'].replace(/<[^>]*>/g, '');
      }
    }
  } catch {
    // Use defaults
  }

  return {
    title,
    description,
    alternates: { canonical: '/pricing' },
  };
}

export default function PricingLayout({ children }) {
  return children;
}
