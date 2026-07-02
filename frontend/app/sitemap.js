const API = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://suite.digitpenhub.com';

export default async function sitemap() {
  let pages = [];
  try {
    const res = await fetch(`${API}/api/v1/pages/public-sitemap`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      pages = Array.isArray(data.pages) ? data.pages : [];
    }
  } catch {
    // If the API is unreachable, still return a valid (smaller) sitemap rather than failing the route.
  }

  return [
    { url: SITE_URL, lastModified: new Date() },
    ...pages.map((p) => ({
      url: `${SITE_URL}/p/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    })),
  ];
}
