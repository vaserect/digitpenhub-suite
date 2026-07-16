const db = require('../db');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function listSiteTemplates(req, res) {
  const { category } = req.query;
  const { rows } = await db.query(
    `SELECT st.id, st.category, st.name, st.description, st.thumbnail_url, st.sort_order,
            COUNT(stp.id) AS page_count
     FROM site_templates st
     LEFT JOIN site_template_pages stp ON stp.site_template_id = st.id
     ${category ? 'WHERE st.category = $1' : ''}
     GROUP BY st.id
     ORDER BY st.category, st.sort_order, st.name`,
    category ? [category] : []
  );
  res.json({ templates: rows });
}

async function listCategories(req, res) {
  const { rows } = await db.query(
    `SELECT category, COUNT(*) AS count FROM site_templates GROUP BY category ORDER BY category`
  );
  res.json({ categories: rows });
}

async function getSiteTemplate(req, res) {
  const { rows: tRows } = await db.query(`SELECT * FROM site_templates WHERE id = $1`, [req.params.id]);
  if (!tRows.length) return res.status(404).json({ error: 'Site template not found.' });

  const { rows: pageRows } = await db.query(
    `SELECT id, page_role, slug_suffix, title, nav_label, sort_order
     FROM site_template_pages WHERE site_template_id = $1 ORDER BY sort_order`,
    [req.params.id]
  );
  res.json({ template: tRows[0], pages: pageRows });
}

// Creates a full set of real, linked pages in the caller's org: one per
// site_template_pages row, sharing a common base slug, wired together with a
// real `nav` block (pointing at every created page's actual slug) and a
// `footer` block, injected around each page's own content blocks.
async function useSiteTemplate(req, res) {
  const { rows: tRows } = await db.query(`SELECT * FROM site_templates WHERE id = $1`, [req.params.id]);
  if (!tRows.length) return res.status(404).json({ error: 'Site template not found.' });
  const template = tRows[0];

  const { rows: templatePages } = await db.query(
    `SELECT * FROM site_template_pages WHERE site_template_id = $1 ORDER BY sort_order`,
    [req.params.id]
  );
  if (!templatePages.length) return res.status(400).json({ error: 'This site template has no pages.' });

  const siteName = (req.body && req.body.siteName) || template.name;
  const baseSlug = slugify(siteName) || 'site';

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Reserve a unique base slug for this site within the org first, so every
    // page's final slug (home = base, others = base-suffix) is collision-free.
    let finalBase = baseSlug;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { rows: exists } = await client.query(
        `SELECT 1 FROM pages WHERE org_id = $1 AND (slug = $2 OR slug LIKE $2 || '-%')`,
        [req.user.orgId, finalBase]
      );
      if (!exists.length) break;
      suffix += 1;
      finalBase = `${baseSlug}-${suffix}`;
    }

    const withSlugs = templatePages.map((p) => ({
      ...p,
      finalSlug: p.page_role === 'home' ? finalBase : `${finalBase}-${p.slug_suffix}`,
    }));

    const navLinks = withSlugs
      .filter((p) => p.page_role !== 'home')
      .map((p) => ({ label: p.nav_label, href: `/p/${p.finalSlug}` }));
    const homeHref = `/p/${withSlugs.find((p) => p.page_role === 'home').finalSlug}`;
    const contactPage = withSlugs.find((p) => p.page_role === 'contact');
    const hrefByRole = Object.fromEntries(withSlugs.map((p) => [p.page_role, `/p/${p.finalSlug}`]));

    const createdPages = [];
    for (const p of withSlugs) {
      const navBlock = {
        id: `blk_${Math.random().toString(36).slice(2, 10)}`,
        type: 'nav',
        logoText: siteName,
        homeHref,
        links: navLinks,
        ctaText: contactPage ? 'Contact us' : '',
        ctaHref: contactPage ? `/p/${contactPage.finalSlug}` : '',
      };
      const footerBlock = {
        id: `blk_${Math.random().toString(36).slice(2, 10)}`,
        type: 'footer',
        logoText: siteName,
        links: navLinks,
        copyright: `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
      };
      // Resolve {{page:role}} placeholders left in seeded content (cross-page
      // CTAs) to the real href now that every page's final slug is known.
      const resolvedContentBlocks = JSON.parse(
        JSON.stringify(Array.isArray(p.blocks) ? p.blocks : []).replace(
          /\{\{page:([a-z]+)\}\}/g,
          (_, role) => hrefByRole[role] || '#'
        )
      );

      // The contact page gets a real, working lead-capture form — not just a
      // mailto link — wired to this org's own Lead Generation module so
      // submissions actually land somewhere and trigger the existing
      // new-lead email notification.
      let formBlock = null;
      if (p.page_role === 'contact') {
        const { rows: formRows } = await client.query(
          `INSERT INTO lead_forms (org_id, name, fields_json, thank_you_message)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [
            req.user.orgId,
            `${siteName} — Contact form`,
            JSON.stringify([
              { id: 'name', label: 'Name', type: 'text', required: true },
              { id: 'email', label: 'Email', type: 'email', required: true },
              { id: 'message', label: 'Message', type: 'textarea', required: true },
            ]),
            `Thanks for reaching out to ${siteName} — we'll be in touch soon.`,
          ]
        );
        formBlock = {
          id: `blk_${Math.random().toString(36).slice(2, 10)}`,
          type: 'form',
          formId: formRows[0].id,
          heading: 'Send us a message',
          subheading: '',
        };
      }

      const blocks = [navBlock, ...resolvedContentBlocks, ...(formBlock ? [formBlock] : []), footerBlock];

      const { rows } = await client.query(
        `INSERT INTO pages (org_id, slug, title, meta_description, blocks, status, page_type)
         VALUES ($1,$2,$3,$4,$5,'draft','page') RETURNING *`,
        [req.user.orgId, p.finalSlug, p.title, p.meta_description || null, JSON.stringify(blocks)]
      );
      createdPages.push(rows[0]);
    }

    await client.query('COMMIT');
    const homePage = createdPages.find((p) => p.slug === homeHref.replace('/p/', ''));
    res.status(201).json({
      pages: createdPages.map((p) => ({ id: p.id, slug: p.slug, title: p.title, page_type: p.page_type, status: p.status })),
      homePage,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { listSiteTemplates, listCategories, getSiteTemplate, useSiteTemplate };
