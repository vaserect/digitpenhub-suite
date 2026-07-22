const db = require('../db');
const { whatsappProviderConfigured, sendWhatsAppBroadcast } = require('../utils/messagingProviders');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const bulkDeleteWhatsappContacts = bulkDeleteHandler('whatsapp_contacts');

async function getStats(req, res) {
  const [cRes, tRes, bRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS c, COUNT(*) FILTER(WHERE status='active')::int AS active FROM whatsapp_contacts WHERE org_id=$1`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c FROM whatsapp_templates WHERE org_id=$1`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c, COUNT(*) FILTER(WHERE status='sent')::int AS sent FROM whatsapp_broadcasts WHERE org_id=$1`, [req.user.orgId]),
  ]);
  res.json({
    totalContacts: cRes.rows[0].c,
    activeContacts: cRes.rows[0].active,
    templates: tRes.rows[0].c,
    broadcasts: bRes.rows[0].c,
    broadcastsSent: bRes.rows[0].sent,
  });
}

// ── Contacts ──────────────────────────────────────────────────────────────────

async function listContacts(req, res) {
  const { status } = req.query;
  const { rows } = await db.query(
    `SELECT * FROM whatsapp_contacts WHERE org_id=$1 AND ($2='' OR status=$2) ORDER BY name`,
    [req.user.orgId, status || '']
  );
  res.json({ contacts: rows });
}

async function createContact(req, res) {
  const { name, phone, notes, tags } = req.body || {};
  if (!name?.trim())  return res.status(400).json({ error: 'name is required.' });
  if (!phone?.trim()) return res.status(400).json({ error: 'phone is required.' });
  const { rows } = await db.query(
    `INSERT INTO whatsapp_contacts (org_id, name, phone, notes, tags) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, name.trim(), phone.trim(), notes||null, tags||[]]
  );
  res.status(201).json({ contact: rows[0] });
}

async function updateContact(req, res) {
  const { id } = req.params;
  const { name, phone, notes, tags, status } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (name   !==undefined){updates.push(`name=$${i++}`);  vals.push(name.trim());}
  if (phone  !==undefined){updates.push(`phone=$${i++}`); vals.push(phone.trim());}
  if (notes  !==undefined){updates.push(`notes=$${i++}`); vals.push(notes||null);}
  if (tags   !==undefined){updates.push(`tags=$${i++}`);  vals.push(tags||[]);}
  if (status !==undefined){updates.push(`status=$${i++}`);vals.push(status);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const idParam = i;
  const orgParam = i + 1;
  const { rows } = await db.query(`UPDATE whatsapp_contacts SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Contact not found.' });
  res.json({ contact: rows[0] });
}

async function deleteContact(req, res) {
  await db.query(`DELETE FROM whatsapp_contacts WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// ── Templates ─────────────────────────────────────────────────────────────────

async function listTemplates(req, res) {
  const { rows } = await db.query(`SELECT * FROM whatsapp_templates WHERE org_id=$1 ORDER BY name`, [req.user.orgId]);
  res.json({ templates: rows });
}

async function createTemplate(req, res) {
  const { name, category, body, status } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  if (!body?.trim()) return res.status(400).json({ error: 'body is required.' });
  const { rows } = await db.query(
    `INSERT INTO whatsapp_templates (org_id, name, category, body, status) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, name.trim(), category||'marketing', body.trim(), status||'draft']
  );
  res.status(201).json({ template: rows[0] });
}

async function updateTemplate(req, res) {
  const { id } = req.params;
  const { name, category, body, status } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (name    !==undefined){updates.push(`name=$${i++}`);    vals.push(name.trim());}
  if (category!==undefined){updates.push(`category=$${i++}`);vals.push(category);}
  if (body    !==undefined){updates.push(`body=$${i++}`);    vals.push(body.trim());}
  if (status  !==undefined){updates.push(`status=$${i++}`);  vals.push(status);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const idParam = i;
  const orgParam = i + 1;
  const { rows } = await db.query(`UPDATE whatsapp_templates SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Template not found.' });
  res.json({ template: rows[0] });
}

async function deleteTemplate(req, res) {
  await db.query(`DELETE FROM whatsapp_templates WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// ── Broadcasts ────────────────────────────────────────────────────────────────

async function listBroadcasts(req, res) {
  const { rows } = await db.query(
    `SELECT wb.*, wt.name AS template_name FROM whatsapp_broadcasts wb
     LEFT JOIN whatsapp_templates wt ON wt.id=wb.template_id
     WHERE wb.org_id=$1 ORDER BY wb.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ broadcasts: rows });
}

async function createBroadcast(req, res) {
  const { name, templateId, recipientCount, notes, scheduledAt, status } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO whatsapp_broadcasts (org_id, name, template_id, recipient_count, notes, scheduled_at, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.orgId, name.trim(), templateId||null, Number(recipientCount)||0, notes||null, scheduledAt||null, status||'draft']
  );
  res.status(201).json({ broadcast: rows[0] });
}

async function updateBroadcast(req, res) {
  const { id } = req.params;
  const { name, templateId, recipientCount, notes, scheduledAt, status } = req.body || {};
  // 'sent' may only be set via sendBroadcast, which records whether it was
  // actually dispatched or simulated — letting a plain field update claim
  // 'sent' would let the client fake a delivered broadcast with no send ever
  // happening.
  if (status === 'sent') return res.status(400).json({ error: 'Use the send action to mark a broadcast as sent.' });
  const updates=[]; const vals=[]; let i=1;
  if (name          !==undefined){updates.push(`name=$${i++}`);           vals.push(name.trim());}
  if (templateId    !==undefined){updates.push(`template_id=$${i++}`);    vals.push(templateId||null);}
  if (recipientCount!==undefined){updates.push(`recipient_count=$${i++}`);vals.push(Number(recipientCount));}
  if (notes         !==undefined){updates.push(`notes=$${i++}`);          vals.push(notes||null);}
  if (scheduledAt   !==undefined){updates.push(`scheduled_at=$${i++}`);   vals.push(scheduledAt||null);}
  if (status        !==undefined){updates.push(`status=$${i++}`);         vals.push(status);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const idParam = i;
  const orgParam = i + 1;
  const { rows } = await db.query(`UPDATE whatsapp_broadcasts SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Broadcast not found.' });
  res.json({ broadcast: rows[0] });
}

async function deleteBroadcast(req, res) {
  await db.query(`DELETE FROM whatsapp_broadcasts WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function sendBroadcast(req, res) {
  const { id } = req.params;
  const existing = await db.query(`SELECT * FROM whatsapp_broadcasts WHERE id=$1 AND org_id=$2`, [id, req.user.orgId]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Broadcast not found.' });
  if (existing.rows[0].status === 'sent') return res.status(400).json({ error: 'Already sent.' });

  const configured = whatsappProviderConfigured();
  let sentCount = 0;
  let errorCount = 0;

  if (configured) {
    // Fetch active contacts
    const { rows: contacts } = await db.query(
      `SELECT phone FROM whatsapp_contacts WHERE org_id=$1 AND status='active'`,
      [req.user.orgId]
    );
    const recipients = contacts.map((c) => c.phone).filter(Boolean);

    if (recipients.length) {
      const result = await sendWhatsAppBroadcast({ recipients, message: existing.rows[0].notes || ' ' });
      sentCount = result.results.filter((r) => r.ok).length;
      errorCount = result.results.filter((r) => !r.ok).length;
    }
  }

  const { rows } = await db.query(
    `UPDATE whatsapp_broadcasts SET status='sent', sent_at=NOW(), simulated=$1 WHERE id=$2 AND org_id=$3 RETURNING *`,
    [!configured, id, req.user.orgId]
  );
  res.json({ broadcast: rows[0], simulated: !configured, sentCount, errorCount });
}

async function exportContacts(req, res) {
  const { rows } = await db.query(`SELECT * FROM whatsapp_contacts WHERE org_id=$1 ORDER BY name`, [req.user.orgId]);
  sendCsv(res, 'whatsapp-contacts.csv', rows, autoColumns(rows));
}

// ── Analytics ─────────────────────────────────────────────────────────────────

async function getBroadcastAnalytics(req, res) {
  try {
    const { id } = req.params;
    
    // Get broadcast details
    const { rows: broadcastRows } = await db.query(
      `SELECT * FROM whatsapp_broadcasts WHERE id=$1 AND org_id=$2`,
      [id, req.user.orgId]
    );
    
    if (!broadcastRows.length) {
      return res.status(404).json({ error: 'Broadcast not found.' });
    }
    
    const broadcast = broadcastRows[0];
    
    // Get message stats
    const { rows: statsRows } = await db.query(
      `SELECT 
         COUNT(*)::int as total_messages,
         COUNT(*) FILTER (WHERE status='sent')::int as sent,
         COUNT(*) FILTER (WHERE status='delivered')::int as delivered,
         COUNT(*) FILTER (WHERE status='read')::int as read,
         COUNT(*) FILTER (WHERE status='failed')::int as failed
       FROM whatsapp_messages
       WHERE broadcast_id=$1 AND org_id=$2`,
      [id, req.user.orgId]
    );
    
    // Get click stats
    const { rows: clickRows } = await db.query(
      `SELECT COUNT(DISTINCT contact_id)::int as unique_clicks,
              COUNT(*)::int as total_clicks
       FROM whatsapp_link_clicks wlc
       JOIN whatsapp_messages wm ON wm.id = wlc.message_id
       WHERE wm.broadcast_id=$1 AND wm.org_id=$2`,
      [id, req.user.orgId]
    );
    
    res.json({
      broadcast: {
        id: broadcast.id,
        name: broadcast.name,
        status: broadcast.status,
        sent_at: broadcast.sent_at,
        recipient_count: broadcast.recipient_count
      },
      stats: {
        ...statsRows[0],
        unique_clicks: clickRows[0].unique_clicks,
        total_clicks: clickRows[0].total_clicks,
        delivery_rate: statsRows[0].total_messages > 0 
          ? ((statsRows[0].delivered / statsRows[0].total_messages) * 100).toFixed(2)
          : 0,
        read_rate: statsRows[0].delivered > 0
          ? ((statsRows[0].read / statsRows[0].delivered) * 100).toFixed(2)
          : 0,
        click_rate: statsRows[0].delivered > 0
          ? ((clickRows[0].unique_clicks / statsRows[0].delivered) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('Error getting broadcast analytics:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getAnalyticsSummary(req, res) {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [req.user.orgId];
    
    if (startDate && endDate) {
      dateFilter = `AND date >= $2 AND date <= $3`;
      params.push(startDate, endDate);
    }
    
    const { rows } = await db.query(
      `SELECT 
         metric_type,
         SUM(metric_value)::int as total
       FROM whatsapp_analytics
       WHERE org_id=$1 ${dateFilter}
       GROUP BY metric_type`,
      params
    );
    
    const summary = {};
    rows.forEach(row => {
      summary[row.metric_type] = row.total;
    });
    
    res.json({ summary });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ error: error.message });
  }
}

// ── Link Tracking ─────────────────────────────────────────────────────────────

async function trackLinkClick(req, res) {
  try {
    const { shortUrl } = req.params;
    const { messageId, contactId } = req.query;

    if (!messageId || !contactId) {
      return res.status(400).json({ error: 'Message ID and Contact ID are required.' });
    }

    // Look up original URL from whatsapp_tracked_links table.
    // This is the correct source — previously the code used message body
    // content as the URL, which broke redirects (message body text != URL).
    const { rows: linkRows } = await db.query(
      `SELECT original_url FROM whatsapp_tracked_links WHERE short_code = $1 AND message_id = $2`,
      [shortUrl, messageId]
    );

    if (!linkRows.length) {
      return res.status(404).json({ error: 'Tracked link not found.' });
    }

    const originalUrl = linkRows[0].original_url;

    // Record click
    await db.query(
      `INSERT INTO whatsapp_link_clicks
       (org_id, message_id, contact_id, original_url, short_url, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user.orgId,
        messageId,
        contactId,
        originalUrl,
        shortUrl,
        req.ip,
        req.get('user-agent')
      ]
    );

    // Increment click count on the tracked link
    await db.query(
      `UPDATE whatsapp_tracked_links SET click_count = click_count + 1 WHERE short_code = $1`,
      [shortUrl]
    );

    // Update broadcast clicked count if applicable
    await db.query(
      `UPDATE whatsapp_broadcasts
       SET clicked_count = clicked_count + 1
       WHERE id = (SELECT broadcast_id FROM whatsapp_messages WHERE id=$1)`,
      [messageId]
    );

    // Return the actual URL so the frontend can redirect the user
    res.json({ success: true, original_url: originalUrl });
  } catch (error) {
    console.error('Error tracking link click:', error);
    res.status(500).json({ error: error.message });
  }
}

// ── Quick Replies ─────────────────────────────────────────────────────────────

async function listQuickReplies(req, res) {
  try {
    const { category } = req.query;
    
    let query = `SELECT * FROM whatsapp_quick_replies WHERE org_id=$1`;
    const params = [req.user.orgId];
    
    if (category) {
      query += ` AND category=$2`;
      params.push(category);
    }
    
    query += ` ORDER BY shortcut`;
    
    const { rows } = await db.query(query, params);
    res.json({ quickReplies: rows });
  } catch (error) {
    console.error('Error listing quick replies:', error);
    res.status(500).json({ error: error.message });
  }
}

async function createQuickReply(req, res) {
  try {
    const { shortcut, message, category } = req.body;
    
    if (!shortcut?.trim()) {
      return res.status(400).json({ error: 'Shortcut is required.' });
    }
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    
    const { rows } = await db.query(
      `INSERT INTO whatsapp_quick_replies (org_id, shortcut, message, category, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.orgId, shortcut.trim(), message.trim(), category || null, req.user.id]
    );
    
    res.status(201).json({ quickReply: rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Shortcut already exists.' });
    }
    console.error('Error creating quick reply:', error);
    res.status(500).json({ error: error.message });
  }
}

async function updateQuickReply(req, res) {
  try {
    const { id } = req.params;
    const { shortcut, message, category } = req.body;
    
    const updates = [];
    const vals = [];
    let i = 1;
    
    if (shortcut !== undefined) {
      updates.push(`shortcut=$${i++}`);
      vals.push(shortcut.trim());
    }
    
    if (message !== undefined) {
      updates.push(`message=$${i++}`);
      vals.push(message.trim());
    }
    
    if (category !== undefined) {
      updates.push(`category=$${i++}`);
      vals.push(category || null);
    }
    
    if (!updates.length) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }
    
    updates.push(`updated_at=NOW()`);
    vals.push(id, req.user.orgId);
    
    const { rows } = await db.query(
      `UPDATE whatsapp_quick_replies SET ${updates.join(',')} 
       WHERE id=$${i} AND org_id=$${i + 1} RETURNING *`,
      vals
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Quick reply not found.' });
    }
    
    res.json({ quickReply: rows[0] });
  } catch (error) {
    console.error('Error updating quick reply:', error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteQuickReply(req, res) {
  try {
    await db.query(
      `DELETE FROM whatsapp_quick_replies WHERE id=$1 AND org_id=$2`,
      [req.params.id, req.user.orgId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting quick reply:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getStats,
  listContacts, exportContacts, createContact, updateContact, deleteContact, bulkDeleteWhatsappContacts,
  listTemplates, createTemplate, updateTemplate, deleteTemplate,
  listBroadcasts, createBroadcast, updateBroadcast, deleteBroadcast, sendBroadcast,
  getBroadcastAnalytics, getAnalyticsSummary, trackLinkClick,
  listQuickReplies, createQuickReply, updateQuickReply, deleteQuickReply,
};
