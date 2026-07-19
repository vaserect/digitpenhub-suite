const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Global search schema ──────────────────────────────────────────────────────
// Each entry defines a query that searches one module's data for the org.
// The results are combined client-side with a unified format.
const SEARCH_TARGETS = [
  {
    type: 'contact',
    label: 'Contacts',
    icon: '👤',
    sql: `SELECT id, full_name AS title, company AS subtitle, 'contact' AS type, email AS ref
          FROM contacts WHERE org_id = $1 AND (full_name ILIKE $2 OR company ILIKE $2 OR email ILIKE $2) LIMIT 10`,
  },
  {
    type: 'invoice',
    label: 'Invoices',
    icon: '📄',
    sql: `SELECT id, invoice_number AS title, status AS subtitle, 'invoice' AS type, total::text AS ref
          FROM invoices WHERE org_id = $1 AND (invoice_number ILIKE $2 OR COALESCE(notes,'') ILIKE $2) LIMIT 10`,
  },
  {
    type: 'project',
    label: 'Projects',
    icon: '📋',
    sql: `SELECT id, name AS title, status AS subtitle, 'project' AS type FROM projects
          WHERE org_id = $1 AND name ILIKE $2 LIMIT 10`,
  },
  {
    type: 'task',
    label: 'Tasks',
    icon: '✅',
    sql: `SELECT id, title, status AS subtitle, 'task' AS type FROM tasks
          WHERE org_id = $1 AND (title ILIKE $2 OR COALESCE(description,'') ILIKE $2) LIMIT 10`,
  },
  {
    type: 'page',
    label: 'Pages',
    icon: '🌐',
    sql: `SELECT id, title, slug AS subtitle, 'page' AS type FROM pages
          WHERE org_id = $1 AND (title ILIKE $2 OR COALESCE(meta_description,'') ILIKE $2) LIMIT 10`,
  },
  {
    type: 'document',
    label: 'Documents',
    icon: '📁',
    sql: `SELECT id, name AS title, COALESCE(description,'') AS subtitle, 'document' AS type FROM documents
          WHERE org_id = $1 AND (name ILIKE $2 OR COALESCE(description,'') ILIKE $2) LIMIT 10`,
  },
  {
    type: 'note',
    label: 'Notes',
    icon: '📝',
    sql: `SELECT id, COALESCE(title,'Untitled') AS title, substring(COALESCE(content,''),1,100) AS subtitle, 'note' AS type FROM notes
          WHERE org_id = $1 AND (COALESCE(title,'') ILIKE $2 OR COALESCE(content,'') ILIKE $2) LIMIT 10`,
  },
  {
    type: 'ticket',
    label: 'Help Desk',
    icon: '🎫',
    sql: `SELECT id, subject AS title, status AS subtitle, 'ticket' AS type FROM helpdesk_tickets
          WHERE org_id = $1 AND (subject ILIKE $2 OR COALESCE(description,'') ILIKE $2) LIMIT 10`,
  },
  {
    type: 'article',
    label: 'Knowledge Base',
    icon: '📚',
    sql: `SELECT id, title, status AS subtitle, 'article' AS type FROM knowledge_base_articles
          WHERE org_id = $1 AND (title ILIKE $2 OR COALESCE(body,'') ILIKE $2) LIMIT 10`,
  },
  {
    type: 'lead_form',
    label: 'Lead Forms',
    icon: '🧲',
    sql: `SELECT id, name AS title, 'lead_form' AS type FROM lead_forms
          WHERE org_id = $1 AND name ILIKE $2 LIMIT 10`,
  },
  {
    type: 'employee',
    label: 'Employees',
    icon: '👥',
    sql: `SELECT id, full_name AS title, department AS subtitle, 'employee' AS type FROM hr_employees
          WHERE org_id = $1 AND full_name ILIKE $2 LIMIT 10`,
  },
  {
    type: 'contact_lead',
    label: 'Leads',
    icon: '📨',
    sql: `SELECT ls.id, (ls.data_json->>0) AS title, ls.status AS subtitle, 'lead' AS type
          FROM lead_submissions ls WHERE ls.org_id = $1 AND EXISTS (
            SELECT 1 FROM jsonb_each_text(ls.data_json) WHERE value ILIKE $2
          ) LIMIT 10`,
  },
];

async function doSearch(req, res) {
  const { q, types, dateFrom, dateTo, status, owner, sortBy = 'relevance' } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ results: [] });
  }

  const query = `%${q.trim()}%`;
  let targets = SEARCH_TARGETS;
  if (types) {
    const allowed = types.split(',');
    targets = targets.filter((t) => allowed.includes(t.type));
  }

  // Build filter conditions
  const filters = {
    dateFrom: dateFrom ? new Date(dateFrom) : null,
    dateTo: dateTo ? new Date(dateTo) : null,
    status: status ? status.split(',') : null,
    owner: owner ? parseInt(owner) : null,
    sortBy,
  };

  const results = await Promise.all(
    targets.map(async (target) => {
      try {
        // Build dynamic SQL with filters
        let sql = target.sql;
        const params = [req.user.orgId, query];
        let paramIndex = 3;

        // Add date range filter (if table has created_at or updated_at)
        if (filters.dateFrom && ['contact', 'invoice', 'project', 'task', 'document', 'note', 'ticket', 'article'].includes(target.type)) {
          sql = sql.replace('LIMIT 10', `AND created_at >= $${paramIndex} LIMIT 10`);
          params.push(filters.dateFrom);
          paramIndex++;
        }
        if (filters.dateTo && ['contact', 'invoice', 'project', 'task', 'document', 'note', 'ticket', 'article'].includes(target.type)) {
          sql = sql.replace('LIMIT 10', `AND created_at <= $${paramIndex} LIMIT 10`);
          params.push(filters.dateTo);
          paramIndex++;
        }

        // Add status filter
        if (filters.status && ['invoice', 'project', 'task', 'ticket', 'article'].includes(target.type)) {
          sql = sql.replace('LIMIT 10', `AND status = ANY($${paramIndex}) LIMIT 10`);
          params.push(filters.status);
          paramIndex++;
        }

        // Add owner filter (if table has owner_id or user_id)
        if (filters.owner && ['project', 'task', 'document', 'note', 'ticket'].includes(target.type)) {
          const ownerCol = target.type === 'ticket' ? 'assigned_to' : 'owner_id';
          sql = sql.replace('LIMIT 10', `AND ${ownerCol} = $${paramIndex} LIMIT 10`);
          params.push(filters.owner);
          paramIndex++;
        }

        const { rows } = await db.query(sql, params);
        if (!rows.length) return null;

        let items = rows.map((r) => ({
          id: r.id,
          title: r.title || r.full_name || r.name || r.subject || r.invoice_number,
          subtitle: r.subtitle || r.slug || r.status || r.company || r.ref || '',
          type: r.type || target.type,
          ref: r.ref || null,
          created_at: r.created_at || null,
          status: r.status || null,
        }));

        // Apply sorting
        if (filters.sortBy === 'date' && items[0]?.created_at) {
          items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (filters.sortBy === 'name') {
          items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        }
        // 'relevance' is default (database order)

        return {
          type: target.type,
          label: target.label,
          icon: target.icon,
          items,
        };
      } catch (err) {
        console.error(`Search error for ${target.type}:`, err.message);
        return null; // Table may not exist for this org
      }
    })
  );

  const filtered = results.filter(Boolean);
  const total = filtered.reduce((s, g) => s + g.items.length, 0);
  res.json({ results: filtered, total, query: q.trim(), filters });
}

router.get('/', asyncHandler(doSearch));

module.exports = router;
