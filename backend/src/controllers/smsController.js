const db = require('../db');
const { smsProviderConfigured, sendBulkSms } = require('../utils/messagingProviders');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const bulkDeleteSmsContacts = bulkDeleteHandler('sms_contacts');

async function getStats(req, res) {
  const [campRes, contactRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE status='sent')::int AS sent, COALESCE(SUM(sent_count),0)::int AS messages FROM sms_campaigns WHERE org_id=$1`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c FROM sms_contacts WHERE org_id=$1 AND status='active'`, [req.user.orgId]),
  ]);
  res.json({ totalCampaigns: campRes.rows[0].total, sentCampaigns: campRes.rows[0].sent, totalMessages: campRes.rows[0].messages, activeContacts: contactRes.rows[0].c });
}

async function listContacts(req, res) {
  const { status, search } = req.query;
  const conditions = ['org_id=$1']; const vals = [req.user.orgId]; let i = 2;
  if (status) { conditions.push(`status=$${i++}`); vals.push(status); }
  if (search) { conditions.push(`(name ILIKE $${i} OR phone ILIKE $${i})`); vals.push(`%${search}%`); i++; }
  const { rows } = await db.query(`SELECT * FROM sms_contacts WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, vals);
  res.json({ contacts: rows });
}

async function createContact(req, res) {
  const { name, phone, tags } = req.body || {};
  if (!name?.trim())  return res.status(400).json({ error: 'name required' });
  if (!phone?.trim()) return res.status(400).json({ error: 'phone required' });
  const { rows } = await db.query(
    `INSERT INTO sms_contacts (org_id,name,phone,tags) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, name.trim(), phone.trim(), tags||[]]
  );
  res.status(201).json({ contact: rows[0] });
}

async function updateContact(req, res) {
  const { id } = req.params;
  const { name, phone, tags, status } = req.body || {};
  const updates = []; const vals = []; let i = 1;
  if (name   !== undefined) { updates.push(`name=$${i++}`);   vals.push(name.trim()); }
  if (phone  !== undefined) { updates.push(`phone=$${i++}`);  vals.push(phone.trim()); }
  if (tags   !== undefined) { updates.push(`tags=$${i++}`);   vals.push(tags||[]); }
  if (status !== undefined) { updates.push(`status=$${i++}`); vals.push(status); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  // Use actual parameter count instead of template literal evaluation
  const idParam = i;
  const orgParam = i + 1;
  const { rows } = await db.query(`UPDATE sms_contacts SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ contact: rows[0] });
}

async function deleteContact(req, res) {
  await db.query(`DELETE FROM sms_contacts WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// Bulk CSV import — accepts up to 2000 rows per request (matches the
// contact-list realistically pasted/uploaded at once; larger lists should be
// split client-side). Dedupes against existing contacts by phone number
// within the org, and against duplicate phone numbers within the same
// upload, so re-importing the same file twice doesn't double contacts.
async function bulkCreateContacts(req, res) {
  const { contacts } = req.body || {};
  if (!Array.isArray(contacts) || !contacts.length) return res.status(400).json({ error: 'contacts array required' });
  if (contacts.length > 2000) return res.status(400).json({ error: 'Max 2000 contacts per import.' });

  const { rows: existingRows } = await db.query(`SELECT phone FROM sms_contacts WHERE org_id=$1`, [req.user.orgId]);
  const existingPhones = new Set(existingRows.map((r) => r.phone));

  const seen = new Set();
  const valid = [];
  let invalid = 0, duplicate = 0;
  for (const raw of contacts) {
    const name = String(raw?.name || '').trim();
    const phone = String(raw?.phone || '').trim();
    const tags = Array.isArray(raw?.tags) ? raw.tags : String(raw?.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
    if (!name || !phone) { invalid++; continue; }
    if (existingPhones.has(phone) || seen.has(phone)) { duplicate++; continue; }
    seen.add(phone);
    valid.push({ name, phone, tags });
  }

  if (!valid.length) return res.json({ imported: 0, duplicate, invalid });

  const values = [];
  const placeholders = valid.map((c, i) => {
    const base = i * 4;
    values.push(req.user.orgId, c.name, c.phone, c.tags);
    return `($${base+1},$${base+2},$${base+3},$${base+4})`;
  });
  await db.query(`INSERT INTO sms_contacts (org_id,name,phone,tags) VALUES ${placeholders.join(',')}`, values);

  res.status(201).json({ imported: valid.length, duplicate, invalid });
}

async function listCampaigns(req, res) {
  const { rows } = await db.query(`SELECT * FROM sms_campaigns WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  res.json({ campaigns: rows });
}

async function createCampaign(req, res) {
  const { name, message, scheduledAt } = req.body || {};
  if (!name?.trim())    return res.status(400).json({ error: 'name required' });
  if (!message?.trim()) return res.status(400).json({ error: 'message required' });
  const { rows } = await db.query(
    `INSERT INTO sms_campaigns (org_id,name,message,scheduled_at) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, name.trim(), message.trim(), scheduledAt||null]
  );
  res.status(201).json({ campaign: rows[0] });
}

async function sendCampaign(req, res) {
  const { id } = req.params;
  const { contactIds, segmentId } = req.body || {};
  const camp = await db.query(`SELECT * FROM sms_campaigns WHERE id=$1 AND org_id=$2`, [id, req.user.orgId]);
  if (!camp.rows.length)           return res.status(404).json({ error: 'Not found.' });
  if (camp.rows[0].status === 'sent') return res.status(400).json({ error: 'Already sent.' });

  const configured = smsProviderConfigured();
  let sentCount = 0;
  let errorCount = 0;
  let recipients = [];

  // Get recipients from segment or contact IDs
  if (segmentId) {
    const { rows: segmentContacts } = await db.query(
      `SELECT c.id, c.phone FROM sms_contacts c
       INNER JOIN sms_segment_members sm ON c.id = sm.contact_id
       WHERE sm.segment_id = $1 AND c.org_id = $2 AND c.status = 'active'`,
      [segmentId, req.user.orgId]
    );
    recipients = segmentContacts;
  } else if (contactIds?.length) {
    const { rows: contacts } = await db.query(
      `SELECT id, phone FROM sms_contacts WHERE id = ANY($1) AND org_id = $2 AND status = 'active'`,
      [contactIds, req.user.orgId]
    );
    recipients = contacts;
  }

  if (configured && recipients.length) {
    // Handle A/B testing if enabled
    if (camp.rows[0].ab_test_enabled && camp.rows[0].ab_test_config) {
      const { variants } = camp.rows[0].ab_test_config;
      
      // Get variant configurations
      const { rows: variantRows } = await db.query(
        `SELECT * FROM sms_campaign_variants WHERE campaign_id = $1 ORDER BY id`,
        [id]
      );

      // Distribute recipients across variants
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const variantIndex = i % variantRows.length;
        const variant = variantRows[variantIndex];

        const result = await sendBulkSms({ 
          recipients: [recipient.phone], 
          message: variant.message 
        });

        if (result.results[0].ok) {
          sentCount++;
          // Track send
          await db.query(
            `INSERT INTO sms_sends (org_id, campaign_id, contact_id, variant_id, phone, message, status, provider_id, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7, NOW())`,
            [req.user.orgId, id, recipient.id, variant.id, recipient.phone, variant.message, result.results[0].messageId]
          );
          // Update variant stats
          await db.query(
            `UPDATE sms_campaign_variants SET sent_count = sent_count + 1 WHERE id = $1`,
            [variant.id]
          );
        } else {
          errorCount++;
        }
      }
    } else {
      // Standard send without A/B testing
      const phoneNumbers = recipients.map((c) => c.phone).filter(Boolean);
      const result = await sendBulkSms({ recipients: phoneNumbers, message: camp.rows[0].message });
      sentCount = result.results.filter((r) => r.ok).length;
      errorCount = result.results.filter((r) => !r.ok).length;

      // Track individual sends
      for (let i = 0; i < result.results.length; i++) {
        const sendResult = result.results[i];
        const recipient = recipients[i];
        await db.query(
          `INSERT INTO sms_sends (org_id, campaign_id, contact_id, phone, message, status, provider_id, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [req.user.orgId, id, recipient.id, sendResult.to, camp.rows[0].message, 
           sendResult.ok ? 'sent' : 'failed', sendResult.messageId]
        );
      }
    }
  }

  const { rows } = await db.query(
    `UPDATE sms_campaigns SET status='sent',sent_at=NOW(),recipients_count=$1,sent_count=$2,failed_count=$3,simulated=$4 WHERE id=$5 AND org_id=$6 RETURNING *`,
    [recipients.length, sentCount, errorCount, !configured || !recipients.length, id, req.user.orgId]
  );
  res.json({ campaign: rows[0], simulated: !configured || !recipients.length, sentCount, errorCount });
}

async function deleteCampaign(req, res) {
  await db.query(`DELETE FROM sms_campaigns WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function exportContacts(req, res) {
  const { rows } = await db.query(`SELECT * FROM sms_contacts WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  sendCsv(res, 'sms-contacts.csv', rows, autoColumns(rows));
}

async function getCampaignAnalytics(req, res) {
  const { id } = req.params;
  const { rows: campaign } = await db.query(
    `SELECT * FROM sms_campaigns WHERE id=$1 AND org_id=$2`,
    [id, req.user.orgId]
  );
  
  if (!campaign.length) return res.status(404).json({ error: 'Campaign not found' });

  // Get send statistics
  const { rows: sendStats } = await db.query(
    `SELECT 
       COUNT(*) as total_sends,
       COUNT(*) FILTER (WHERE status = 'sent') as sent,
       COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
       COUNT(*) FILTER (WHERE status = 'failed') as failed,
       COUNT(*) FILTER (WHERE status = 'clicked') as clicked
     FROM sms_sends
     WHERE campaign_id = $1`,
    [id]
  );

  // Get daily analytics
  const { rows: dailyStats } = await db.query(
    `SELECT * FROM sms_campaign_analytics
     WHERE campaign_id = $1
     ORDER BY date DESC
     LIMIT 30`,
    [id]
  );

  // Get A/B test results if enabled
  let abTestResults = null;
  if (campaign[0].ab_test_enabled) {
    const { rows: variants } = await db.query(
      `SELECT * FROM sms_campaign_variants WHERE campaign_id = $1`,
      [id]
    );
    abTestResults = variants;
  }

  res.json({
    campaign: campaign[0],
    stats: sendStats[0],
    dailyStats,
    abTestResults
  });
}

async function trackLinkClick(req, res) {
  const { shortCode } = req.params;
  
  // Get link
  const { rows: links } = await db.query(
    `SELECT * FROM sms_links WHERE short_code = $1`,
    [shortCode]
  );

  if (!links.length) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const link = links[0];

  // Track click
  await db.query(
    `INSERT INTO sms_link_clicks (link_id, ip_address, user_agent, clicked_at)
     VALUES ($1, $2, $3, NOW())`,
    [link.id, req.ip, req.get('user-agent')]
  );

  // Update click count
  await db.query(
    `UPDATE sms_links SET click_count = click_count + 1 WHERE id = $1`,
    [link.id]
  );

  // Update contact click stats if we can identify them
  // (This would require additional tracking logic)

  // Redirect to original URL
  res.redirect(link.original_url);
}

async function listTemplates(req, res) {
  const { category } = req.query;
  let query = `SELECT * FROM sms_templates WHERE org_id = $1`;
  const values = [req.user.orgId];
  
  if (category) {
    query += ` AND category = $2`;
    values.push(category);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  const { rows } = await db.query(query, values);
  res.json({ templates: rows });
}

async function createTemplate(req, res) {
  const { name, category, message, media_urls, merge_fields } = req.body || {};
  
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  if (!message?.trim()) return res.status(400).json({ error: 'message required' });
  
  const { rows } = await db.query(
    `INSERT INTO sms_templates (org_id, name, category, message, media_urls, merge_fields)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.user.orgId, name.trim(), category || null, message.trim(), media_urls || [], merge_fields || []]
  );
  
  res.status(201).json({ template: rows[0] });
}

async function updateTemplate(req, res) {
  const { id } = req.params;
  const { name, category, message, media_urls, merge_fields, is_active } = req.body || {};
  
  const updates = [];
  const vals = [];
  let i = 1;
  
  if (name !== undefined) { updates.push(`name=$${i++}`); vals.push(name.trim()); }
  if (category !== undefined) { updates.push(`category=$${i++}`); vals.push(category); }
  if (message !== undefined) { updates.push(`message=$${i++}`); vals.push(message.trim()); }
  if (media_urls !== undefined) { updates.push(`media_urls=$${i++}`); vals.push(media_urls); }
  if (merge_fields !== undefined) { updates.push(`merge_fields=$${i++}`); vals.push(merge_fields); }
  if (is_active !== undefined) { updates.push(`is_active=$${i++}`); vals.push(is_active); }
  
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  
  updates.push(`updated_at=NOW()`);
  vals.push(id, req.user.orgId);
  
  const { rows } = await db.query(
    `UPDATE sms_templates SET ${updates.join(',')} WHERE id=$${i++} AND org_id=$${i++} RETURNING *`,
    vals
  );
  
  if (!rows.length) return res.status(404).json({ error: 'Template not found' });
  res.json({ template: rows[0] });
}

async function deleteTemplate(req, res) {
  await db.query(
    `DELETE FROM sms_templates WHERE id=$1 AND org_id=$2`,
    [req.params.id, req.user.orgId]
  );
  res.json({ ok: true });
}

module.exports = { 
  getStats, 
  listContacts, 
  exportContacts, 
  createContact, 
  updateContact, 
  deleteContact, 
  bulkCreateContacts, 
  bulkDeleteSmsContacts, 
  listCampaigns, 
  createCampaign, 
  sendCampaign, 
  deleteCampaign,
  getCampaignAnalytics,
  trackLinkClick,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
