// Single source of truth for the module catalog. Mirrors the master prompt's
// PRODUCT CATEGORIES section exactly. Edit here, then re-run `npm run seed`.
// `status` for everything defaults to coming_soon except the two below.
const ACTIVE = new Set(['CRM', 'Project Management', 'Invoices']);
const ROUTES = { CRM: '/modules/crm', 'Project Management': '/modules/pm', Invoices: '/modules/invoices' };

const CATEGORIES = [
  { key: 'marketing', name: 'Marketing', badge: 'MK', modules: ['CRM','Lead Generation','Landing Page Builder','Website Builder','Funnel Builder','Email Marketing','SMS Marketing','WhatsApp Marketing','Marketing Automation','Affiliate System','Referral Program','Appointment Booking','Forms','Popup Builder','Survey Builder','Quiz Builder','URL Shortener','QR Code Generator','Link-in-Bio','Digital Business Cards'] },
  { key: 'ai', name: 'AI', badge: 'AI', modules: ['AI Writer','AI Chatbot Builder','AI Email Assistant','AI Proposal Generator','AI Blog Generator','AI Translator','AI Meeting Notes','AI Knowledge Base','AI Customer Support'] },
  { key: 'seo', name: 'SEO', badge: 'SE', modules: ['Keyword Research','Rank Tracking','SEO Audit','Backlink Monitoring','Schema Generator','Meta Generator','Sitemap Generator','Robots Generator'] },
  { key: 'creative', name: 'Creative', badge: 'CR', modules: ['Graphic Design Editor','Brand Kit','Logo Maker','Flyer Builder','Certificate Generator','Resume Builder','Image Compression','Background Removal','Basic Video Editor'] },
  { key: 'business', name: 'Business', badge: 'BI', modules: ['Accounting','Invoices','Quotations','Expenses','Payroll','Inventory','POS','Asset Management','HR','Recruitment','Project Management','Task Management','Help Desk','Knowledge Base','Client Portal'] },
  { key: 'education', name: 'Education', badge: 'ED', modules: ['Learning Management System','School Management','CBT Platform','Assignments','Student Portal','Teacher Portal','Parent Portal','Certificates'] },
  { key: 'commerce', name: 'Commerce', badge: 'CO', modules: ['Online Store Builder','Marketplace','Order Management','Coupons','Subscriptions','Digital Products','Delivery Tracking'] },
  { key: 'productivity', name: 'Productivity', badge: 'PR', modules: ['Calendar','Notes','File Manager','Cloud Storage','Workflow Automation','Document Management','Time Tracking'] },
  { key: 'analytics', name: 'Analytics', badge: 'AN', modules: ['Business Dashboard','Marketing Dashboard','Sales Dashboard','Website Analytics','Performance Reports','Custom Reports'] },
  { key: 'utilities', name: 'Utilities', badge: 'UT', modules: ['PDF Tools','Image Converter','File Converter','Barcode Generator','Password Manager','Password Generator','JSON Formatter','Color Palette Generator'] },
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

module.exports = { CATEGORIES, ACTIVE, ROUTES, slugify };
