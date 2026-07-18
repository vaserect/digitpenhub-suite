const API_INTERNAL = process.env.API_INTERNAL_URL || 'http://127.0.0.1:5000';

/** @type {import('next').NextConfig} */
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      // Browser calls /api/v1/... on suite.digitpenhub.com — Next.js proxies it
      // server-side to the Express API. Browser only ever sees one origin, so
      // the session cookie never has to cross domains.
      { source: '/api/:path*', destination: `${API_INTERNAL}/api/:path*` },
    ];
  },
};
