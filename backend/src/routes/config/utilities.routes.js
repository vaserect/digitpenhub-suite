/**
 * Utilities & Tools Routes Configuration
 * Various utility tools and services
 */

module.exports = {
  group: 'Utilities & Tools',
  routes: [
    {
      path: '/api/v1/images',
      router: require('../images'),
      middleware: [],
      description: 'Image upload and management',
      public: false,
    },
    {
      path: '/api/v1/pexels',
      router: require('../pexels.routes'),
      middleware: [],
      description: 'Pexels stock photo integration',
      public: false,
    },
    {
      path: '/api/v1/url-shortener',
      router: require('../urlShortener'),
      middleware: [],
      description: 'URL shortener service',
      public: false,
      moduleSlug: 'url-shortener',
    },
    {
      path: '/api/v1/qr-codes',
      router: require('../qrCodes'),
      middleware: [],
      description: 'QR code generator (includes public scan routes)',
      public: false,
      moduleSlug: 'qr-codes',
    },
    {
      path: '/api/v1/barcodes',
      router: require('../barcodes'),
      middleware: [],
      description: 'Barcode generator (includes public scan routes)',
      public: false,
      moduleSlug: 'barcodes',
    },
    {
      path: '/api/v1/pdf',
      router: require('../pdfTools'),
      middleware: [],
      description: 'PDF tools and utilities',
      public: false,
      moduleSlug: 'pdf-tools',
    },
    {
      path: '/api/v1/color-palettes',
      router: require('../colorPalettes'),
      middleware: [],
      description: 'Color palette generator',
      public: false,
      moduleSlug: 'color-palette-generator',
    },
    {
      path: '/api/v1/biz-cards',
      router: require('../digitalBusinessCards'),
      middleware: [],
      description: 'Digital business cards (includes public view routes)',
      public: false,
      moduleSlug: 'digital-business-cards',
    },
    {
      path: '/api/v1/link-in-bio',
      router: require('../linkInBio'),
      middleware: [],
      description: 'Link-in-bio page builder',
      public: false,
      moduleSlug: 'link-in-bio',
    },
    {
      path: '/api/v1/certificates',
      router: require('../certificates'),
      middleware: [],
      description: 'Certificate generator',
      public: false,
      moduleSlug: 'certificate-generator',
    },
  ],
};
