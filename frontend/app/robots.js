const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://suite.digitpenhub.com';

export default function robots() {
  return {
    rules: [
      { userAgent: '*', disallow: '/' },
      { userAgent: '*', allow: '/p/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
