const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://suite.digitpenhub.com';

// Public, search-worthy content lives under /p/ (website-builder pages),
// /store/ (published storefronts) and /forms/ (public lead/intake forms) —
// these are meant to be found via search. Everything else is the
// authenticated dashboard (or transactional flows like /book/ appointment
// booking, which are shared as direct links rather than discovered via
// search) and stays disallowed.
export default function robots() {
  return {
    rules: [
      { userAgent: '*', disallow: '/' },
      { userAgent: '*', allow: '/p/' },
      { userAgent: '*', allow: '/store/' },
      { userAgent: '*', allow: '/forms/' },
      { userAgent: '*', allow: '/features' },
      { userAgent: '*', allow: '/features/' },
      { userAgent: '*', allow: '/pricing' },
      { userAgent: '*', allow: '/pricing/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
