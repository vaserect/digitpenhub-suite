/**
 * Route Configuration Index
 * Exports all route configurations for the RouteLoader
 */

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const crmRoutes = require('./crm.routes');
const pmRoutes = require('./pm.routes');
const invoicingRoutes = require('./invoicing.routes');
const hrRoutes = require('./hr.routes');
const marketingRoutes = require('./marketing.routes');
const websiteRoutes = require('./website.routes');
const ecommerceRoutes = require('./ecommerce.routes');
const aiRoutes = require('./ai.routes');
const utilitiesRoutes = require('./utilities.routes');
const teamRoutes = require('./team.routes');
const adminRoutes = require('./admin.routes');
const analyticsRoutes = require('./analytics.routes');
const educationRoutes = require('./education.routes');
const supportRoutes = require('./support.routes');
const marketplaceRoutes = require('./marketplace.routes');
const accountingRoutes = require('./accounting.routes');
const dataRoutes = require('./data.routes');
const portalRoutes = require('./portal.routes');
const assetsRoutes = require('./assets.routes');
const integrationsRoutes = require('./integrations.routes');

/**
 * All route configurations
 * Order matters - routes are registered in this order
 */
module.exports = [
  healthRoutes,      // Must be first - health checks
  authRoutes,        // Must be early - authentication
  teamRoutes,        // Team and collaboration
  adminRoutes,       // Admin and system management
  crmRoutes,         // CRM and contacts
  pmRoutes,          // Project management
  invoicingRoutes,   // Invoicing and billing
  hrRoutes,          // HR and payroll
  accountingRoutes,  // Accounting and finance
  marketingRoutes,   // Marketing and automation
  websiteRoutes,     // Website builder and content
  ecommerceRoutes,   // E-commerce and store
  educationRoutes,   // LMS and education
  aiRoutes,          // AI and automation
  supportRoutes,     // Support and help desk
  marketplaceRoutes, // Marketplace and affiliates
  analyticsRoutes,   // Analytics and reporting
  utilitiesRoutes,   // Utilities and tools
  dataRoutes,        // Data management
  portalRoutes,      // Client portal
  assetsRoutes,      // Assets and storage
  integrationsRoutes,// Integrations and platform
];
