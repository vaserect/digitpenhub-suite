require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { CATEGORIES, ACTIVE, ROUTES, slugify } = require('./categories.data');
const { seedEmailTemplates } = require('./seedEmailTemplates');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    // --- Categories + modules (idempotent: safe to re-run after editing categories.data.js) ---
    for (let ci = 0; ci < CATEGORIES.length; ci++) {
      const cat = CATEGORIES[ci];
      const { rows } = await dbClient.query(
        `INSERT INTO categories (key, name, badge, sort_order, tier)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (key) DO UPDATE SET name=$2, badge=$3, sort_order=$4, tier=$5
         RETURNING id`,
        [cat.key, cat.name, cat.badge, ci, cat.tier || 1]
      );
      const categoryId = rows[0].id;

      for (let mi = 0; mi < cat.modules.length; mi++) {
        const name = cat.modules[mi];
        const slug = slugify(name);
        const status = ACTIVE.has(name) ? 'active' : 'coming_soon';
        const route = ROUTES[name] || null;
        await dbClient.query(
          `INSERT INTO modules (category_id, name, slug, status, route, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (slug) DO UPDATE SET status=$4, route=$5, sort_order=$6`,
          [categoryId, name, slug, status, route, mi]
        );
      }
    }

    // --- First owner account + organization (only if it doesn't exist yet) ---
    const email = process.env.ADMIN_EMAIL;
    let orgId;
    const existing = await dbClient.query('SELECT id, org_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length === 0) {
      const org = await dbClient.query(`INSERT INTO organizations (name) VALUES ($1) RETURNING id`, [
        'Digitpen Hub',
      ]);
      orgId = org.rows[0].id;
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await dbClient.query(
        `INSERT INTO users (org_id, full_name, email, password_hash, role)
         VALUES ($1,$2,$3,$4,'owner')`,
        [orgId, process.env.ADMIN_NAME, email, hash]
      );
      console.log(`Created owner account for ${email}`);
    } else {
      orgId = existing.rows[0].org_id;
      console.log(`Owner account ${email} already exists — skipped.`);
    }

    // --- Milestone 1: sample CRM contacts (only if this org has none yet) ---
    const contactCount = await dbClient.query('SELECT count(*) FROM contacts WHERE org_id = $1', [orgId]);
    if (Number(contactCount.rows[0].count) === 0) {
      const sampleContacts = [
        ['Adaeze Nwosu', 'Coral Retail Ltd', 'new', 850000],
        ['Tunde Bakare', 'Bakare & Sons', 'contacted', 1200000],
        ['Chiamaka Eze', 'Eze Logistics', 'proposal_sent', 2400000],
        ['Femi Alabi', 'Alabi Foods', 'won', 600000],
        ['Grace Effiong', 'Effiong Consulting', 'contacted', 950000],
      ];
      for (const [fullName, company, stage, value] of sampleContacts) {
        await dbClient.query(
          `INSERT INTO contacts (org_id, full_name, company, stage, value_ngn)
           VALUES ($1,$2,$3,$4,$5)`,
          [orgId, fullName, company, stage, value]
        );
      }
      console.log(`Seeded ${sampleContacts.length} sample contacts.`);
    } else {
      console.log('Contacts already exist for this org — skipped sample CRM data.');
    }

    // --- Milestone 1: sample PM project + tasks (only if this org has no projects yet) ---
    const projectCount = await dbClient.query('SELECT count(*) FROM projects WHERE org_id = $1', [orgId]);
    if (Number(projectCount.rows[0].count) === 0) {
      const project = await dbClient.query(
        `INSERT INTO projects (org_id, name) VALUES ($1,$2) RETURNING id`,
        [orgId, 'Suite Platform Launch']
      );
      const projectId = project.rows[0].id;

      const sampleTasks = [
        ['Draft onboarding flow copy', 'todo', 0],
        ['Source brand photography', 'todo', 1],
        ['Set up DKIM for new sender', 'todo', 2],
        ['Build CRM contact table', 'in_progress', 0],
        ['Write CAC-aligned services copy', 'in_progress', 1],
        ['Point suite.digitpenhub.com at VPS', 'done', 0],
        ['Issue SSL certificate', 'done', 1],
        ['Finalise brand mark', 'done', 2],
      ];
      for (const [title, status, sortOrder] of sampleTasks) {
        await dbClient.query(
          `INSERT INTO tasks (org_id, project_id, title, status, sort_order)
           VALUES ($1,$2,$3,$4,$5)`,
          [orgId, projectId, title, status, sortOrder]
        );
      }
      console.log(`Seeded project "Suite Platform Launch" with ${sampleTasks.length} tasks.`);
    } else {
      console.log('Projects already exist for this org — skipped sample PM data.');
    }

    // --- Milestone 5: sample invoices + clients (only if this org has none yet) ---
    const clientCount = await dbClient.query('SELECT count(*) FROM invoice_clients WHERE org_id = $1', [orgId]);
    if (Number(clientCount.rows[0].count) === 0) {
      const invoiceClient = await dbClient.query(
        `INSERT INTO invoice_clients (org_id, name, email, company, address)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [orgId, 'Amina Yusuf', 'amina@northstar.io', 'Northstar Labs', 'Lagos, Nigeria']
      );
      const invoice = await dbClient.query(
        `INSERT INTO invoices (org_id, client_id, invoice_number, status, due_date, subtotal, tax_rate, total, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [orgId, invoiceClient.rows[0].id, 'INV-1001', 'sent', '2026-07-15', 450000, 7.5, 483750, 'Retainer for Q3 product support']
      );
      await dbClient.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
         VALUES ($1,$2,$3,$4,$5)`,
        [invoice.rows[0].id, 'Product support retainer', 1, 450000, 450000]
      );
      console.log('Seeded a sample client and invoice.');
    } else {
      console.log('Invoice clients already exist for this org — skipped sample invoices.');
    }

    await dbClient.query('COMMIT');
    console.log('Core seed complete.');
    await seedEmailTemplates();
    console.log('Seed complete.');
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
    await pool.end();
  }
})().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
