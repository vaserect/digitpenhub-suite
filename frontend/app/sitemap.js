const API = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://suite.digitpenhub.com';

async function fetchSitemapEntries(path, key) {
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[key]) ? data[key] : [];
  } catch {
    // If the API is unreachable, still return a valid (smaller) sitemap rather than failing the route.
    return [];
  }
}

export default async function sitemap() {
  const [pages, stores, forms] = await Promise.all([
    fetchSitemapEntries('/api/v1/pages/public-sitemap', 'pages').then((rows) =>
      rows.map((r) => ({ url: `${SITE_URL}/p/${r.slug}`, updated_at: r.updated_at }))
    ),
    fetchSitemapEntries('/api/v1/store-builder/public-sitemap', 'stores').then((rows) =>
      rows.map((r) => ({ url: `${SITE_URL}/store/${r.org_id}`, updated_at: r.updated_at }))
    ),
    fetchSitemapEntries('/api/v1/forms/public-sitemap', 'forms').then((rows) =>
      rows.map((r) => ({ url: `${SITE_URL}/forms/${r.id}`, updated_at: r.updated_at }))
    ),
  ]);

  const entries = [...pages, ...stores, ...forms];

  return [
    { url: SITE_URL, lastModified: new Date() },
    ...entries.map((e) => ({
      url: e.url,
      lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
    })),
  ];
}
