const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const c = require('../controllers/digitalBusinessCardsController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const r = Router();

// =====================================================
// PUBLIC ROUTES (No Authentication Required)
// =====================================================

// Public card by ID
r.get('/public/:id', c.getPublicCard);

// Public card by slug
r.get('/slug/:slug', c.getCardBySlug);

// Public interactions
r.post('/contacts', c.addContact);
r.post('/links/:linkId/click', c.trackLinkClick);
r.post('/:id/track-view', c.trackView);

// =====================================================
// PROTECTED ROUTES (Authentication Required)
// =====================================================

r.use(requireAuth);
r.use(requireModuleAccess('digital-business-cards'));

// ── Core Card Management ─────────────────────────────
r.get('/stats', c.getStats);
r.get('/', c.listCards);
r.get('/:id', c.getCard);
r.post('/', c.createCard);
r.put('/:id', c.updateCard);
r.delete('/:id', c.deleteCard);

// ── Sections & Links ─────────────────────────────────
r.post('/:id/sections', c.addSection);
r.post('/:id/links', c.addLink);
r.put('/links/:linkId', c.updateLink);
r.delete('/links/:linkId', c.deleteLink);

// ── Templates ────────────────────────────────────────
r.get('/templates/list', c.listTemplates);

// ── Analytics & Tracking ─────────────────────────────
r.get('/:id/analytics', c.getAnalytics);
r.post('/:id/view', c.incrementView); // Legacy support

// ── Contacts & Leads ─────────────────────────────────
r.get('/contacts/list', c.listContacts);

// ── Folders ──────────────────────────────────────────
r.get('/folders/list', c.listFolders);
r.post('/folders', c.createFolder);

// ── Bulk Operations ──────────────────────────────────
r.post('/bulk-delete', bulkDeleteHandler('digital_business_cards'));

// ── Export ───────────────────────────────────────────
r.get('/export', async (req, res) => {
  const { rows } = await db.query(
    `SELECT 
      id, name, title, company, email, phone, website,
      total_views, unique_views, vcf_downloads,
      status, created_at, last_viewed_at
    FROM digital_business_cards 
    WHERE org_id = $1 
    ORDER BY created_at DESC`,
    [req.user.orgId]
  );
  sendCsv(res, 'business_cards.csv', rows, autoColumns(rows));
});

module.exports = r;