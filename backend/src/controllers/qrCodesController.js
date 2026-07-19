const db = require('../db');
const crypto = require('crypto');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function generateVisitorId(req) {
  const fingerprint = `${req.ip}-${req.headers['user-agent']}-${req.headers['accept-language']}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

function parseUserAgent(userAgent) {
  const ua = userAgent || '';
  const result = {
    device_type: 'desktop',
    device_brand: null,
    device_model: null,
    os_name: 'Unknown',
    os_version: null,
    browser_name: 'Unknown',
    browser_version: null
  };

  // Device type
  if (/mobile|android|iphone|ipod/i.test(ua)) {
    result.device_type = 'mobile';
  } else if (/ipad|tablet/i.test(ua)) {
    result.device_type = 'tablet';
  }

  // OS detection
  if (/windows/i.test(ua)) result.os_name = 'Windows';
  else if (/mac os x/i.test(ua)) result.os_name = 'macOS';
  else if (/linux/i.test(ua)) result.os_name = 'Linux';
  else if (/android/i.test(ua)) result.os_name = 'Android';
  else if (/ios|iphone|ipad/i.test(ua)) result.os_name = 'iOS';

  // Browser detection
  if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) result.browser_name = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) result.browser_name = 'Safari';
  else if (/firefox/i.test(ua)) result.browser_name = 'Firefox';
  else if (/edge|edg/i.test(ua)) result.browser_name = 'Edge';

  return result;
}

// =====================================================
// DASHBOARD & STATS
// =====================================================

async function getDashboardStats(req, res) {
  try {
    const { rows: [stats] } = await db.query(`
      SELECT 
        COUNT(*)::int AS total_codes,
        COUNT(*) FILTER(WHERE status='active')::int AS active_codes,
        COALESCE(SUM(total_scans), 0)::bigint AS total_scans,
        COALESCE(SUM(unique_scans), 0)::bigint AS unique_scans,
        COUNT(*) FILTER(WHERE created_at > NOW() - INTERVAL '7 days')::int AS codes_created_7d,
        COALESCE(SUM(CASE WHEN last_scanned_at > NOW() - INTERVAL '7 days' THEN total_scans ELSE 0 END), 0)::bigint AS scans_7d
      FROM qr_codes 
      WHERE org_id = $1
    `, [req.user.orgId]);

    const { rows: topCodes } = await db.query(`
      SELECT id, title, qr_type, total_scans, unique_scans
      FROM qr_codes
      WHERE org_id = $1 AND status = 'active'
      ORDER BY total_scans DESC
      LIMIT 5
    `, [req.user.orgId]);

    const { rows: typeBreakdown } = await db.query(`
      SELECT qr_type, COUNT(*)::int as count
      FROM qr_codes
      WHERE org_id = $1
      GROUP BY qr_type
      ORDER BY count DESC
    `, [req.user.orgId]);

    res.json({
      ...stats,
      top_codes: topCodes,
      type_breakdown: typeBreakdown
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

// =====================================================
// QR CODES CRUD
// =====================================================

async function listQrCodes(req, res) {
  try {
    const { 
      folder_id, 
      qr_type,
      status, 
      search, 
      tag,
      sort = 'created_at',
      order = 'DESC',
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        qc.*,
        f.name as folder_name,
        t.name as template_name,
        (SELECT COUNT(*) FROM qr_scan_events WHERE qr_code_id = qc.id AND scanned_at > NOW() - INTERVAL '7 days') as scans_7d
      FROM qr_codes qc
      LEFT JOIN qr_folders f ON qc.folder_id = f.id
      LEFT JOIN qr_templates t ON qc.design_template_id = t.id
      WHERE qc.org_id = $1
    `;
    
    const params = [req.user.orgId];
    let paramCount = 1;

    if (folder_id) {
      params.push(folder_id);
      query += ` AND qc.folder_id = $${++paramCount}`;
    }

    if (qr_type) {
      params.push(qr_type);
      query += ` AND qc.qr_type = $${++paramCount}`;
    }

    if (status) {
      params.push(status);
      query += ` AND qc.status = $${++paramCount}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (qc.title ILIKE $${++paramCount} OR qc.description ILIKE $${paramCount})`;
    }

    if (tag) {
      params.push(tag);
      query += ` AND $${++paramCount} = ANY(qc.tags)`;
    }

    const validSorts = ['created_at', 'total_scans', 'unique_scans', 'title', 'last_scanned_at'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY qc.${sortField} ${sortOrder}`;
    
    params.push(limit, offset);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;

    const { rows } = await db.query(query, params);

    const { rows: [{ count }] } = await db.query(
      `SELECT COUNT(*)::int as count FROM qr_codes WHERE org_id = $1`,
      [req.user.orgId]
    );

    res.json({ 
      qr_codes: rows,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('listQrCodes error:', error);
    res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
}

async function getQrCode(req, res) {
  try {
    const { id } = req.params;
    
    const { rows } = await db.query(`
      SELECT 
        qc.*,
        f.name as folder_name,
        t.name as template_name,
        (SELECT COUNT(*) FROM qr_scan_events WHERE qr_code_id = qc.id) as total_scan_events,
        (SELECT COUNT(DISTINCT visitor_id) FROM qr_scan_events WHERE qr_code_id = qc.id) as unique_visitors
      FROM qr_codes qc
      LEFT JOIN qr_folders f ON qc.folder_id = f.id
      LEFT JOIN qr_templates t ON qc.design_template_id = t.id
      WHERE qc.id = $1 AND qc.org_id = $2
    `, [id, req.user.orgId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.json({ qr_code: rows[0] });
  } catch (error) {
    console.error('getQrCode error:', error);
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
}

async function createQrCode(req, res) {
  try {
    const {
      title,
      description,
      qr_type = 'url',
      content,
      is_dynamic = false,
      redirect_url,
      folder_id,
      tags = [],
      design_template_id,
      foreground_color = '#000000',
      background_color = '#FFFFFF',
      gradient_type,
      gradient_color_1,
      gradient_color_2,
      logo_url,
      logo_size = 20,
      logo_style = 'square',
      frame_style,
      frame_color,
      frame_text,
      frame_text_color,
      pattern_style = 'square',
      eye_style = 'square',
      eye_color,
      size = 300,
      error_correction = 'M',
      margin = 4,
      file_format = 'png',
      expires_at,
      notes,
      metadata = {}
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    // Validate content structure based on qr_type
    const contentJson = typeof content === 'string' ? JSON.parse(content) : content;

    const { rows } = await db.query(`
      INSERT INTO qr_codes (
        org_id, user_id, title, description, qr_type, content,
        is_dynamic, redirect_url, folder_id, tags, design_template_id,
        foreground_color, background_color, gradient_type, gradient_color_1, gradient_color_2,
        logo_url, logo_size, logo_style,
        frame_style, frame_color, frame_text, frame_text_color,
        pattern_style, eye_style, eye_color,
        size, error_correction, margin, file_format,
        expires_at, notes, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33
      ) RETURNING *
    `, [
      req.user.orgId, req.user.id, title.trim(), description || null, qr_type,
      JSON.stringify(contentJson), is_dynamic, redirect_url || null, folder_id || null,
      tags, design_template_id || null, foreground_color, background_color,
      gradient_type || null, gradient_color_1 || null, gradient_color_2 || null,
      logo_url || null, logo_size, logo_style, frame_style || null,
      frame_color || null, frame_text || null, frame_text_color || null,
      pattern_style, eye_style, eye_color || null, size, error_correction,
      margin, file_format, expires_at || null, notes || null, JSON.stringify(metadata)
    ]);

    // Create related data tables based on qr_type
    const qrCode = rows[0];
    
    if (qr_type === 'vcard_plus' && contentJson.vcard) {
      await createVCardData(qrCode.id, contentJson.vcard);
    } else if (qr_type === 'wifi' && contentJson.wifi) {
      await createWifiData(qrCode.id, contentJson.wifi);
    } else if (qr_type === 'event' && contentJson.event) {
      await createEventData(qrCode.id, contentJson.event);
    } else if (qr_type === 'payment' && contentJson.payment) {
      await createPaymentData(qrCode.id, contentJson.payment);
    } else if (qr_type === 'social' && contentJson.social) {
      await createSocialData(qrCode.id, contentJson.social);
    }

    res.status(201).json({ qr_code: qrCode });
  } catch (error) {
    console.error('createQrCode error:', error);
    res.status(500).json({ error: 'Failed to create QR code' });
  }
}

async function updateQrCode(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      content,
      redirect_url,
      folder_id,
      tags,
      status,
      expires_at,
      foreground_color,
      background_color,
      logo_url,
      frame_text,
      notes,
      metadata
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (title !== undefined) {
      updates.push(`title = $${++paramCount}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${++paramCount}`);
      values.push(description || null);
    }
    if (content !== undefined) {
      updates.push(`content = $${++paramCount}`);
      const contentJson = typeof content === 'string' ? JSON.parse(content) : content;
      values.push(JSON.stringify(contentJson));
    }
    if (redirect_url !== undefined) {
      updates.push(`redirect_url = $${++paramCount}`);
      values.push(redirect_url || null);
    }
    if (folder_id !== undefined) {
      updates.push(`folder_id = $${++paramCount}`);
      values.push(folder_id || null);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${++paramCount}`);
      values.push(tags);
    }
    if (status !== undefined) {
      updates.push(`status = $${++paramCount}`);
      values.push(status);
    }
    if (expires_at !== undefined) {
      updates.push(`expires_at = $${++paramCount}`);
      values.push(expires_at || null);
    }
    if (foreground_color !== undefined) {
      updates.push(`foreground_color = $${++paramCount}`);
      values.push(foreground_color);
    }
    if (background_color !== undefined) {
      updates.push(`background_color = $${++paramCount}`);
      values.push(background_color);
    }
    if (logo_url !== undefined) {
      updates.push(`logo_url = $${++paramCount}`);
      values.push(logo_url || null);
    }
    if (frame_text !== undefined) {
      updates.push(`frame_text = $${++paramCount}`);
      values.push(frame_text || null);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${++paramCount}`);
      values.push(notes || null);
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${++paramCount}`);
      values.push(JSON.stringify(metadata));
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    values.push(id, req.user.orgId);
    const { rows } = await db.query(`
      UPDATE qr_codes 
      SET ${updates.join(', ')}
      WHERE id = $${++paramCount} AND org_id = $${++paramCount}
      RETURNING *
    `, values);

    if (!rows.length) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.json({ qr_code: rows[0] });
  } catch (error) {
    console.error('updateQrCode error:', error);
    res.status(500).json({ error: 'Failed to update QR code' });
  }
}

async function deleteQrCode(req, res) {
  try {
    const { id } = req.params;
    
    await db.query(
      `DELETE FROM qr_codes WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('deleteQrCode error:', error);
    res.status(500).json({ error: 'Failed to delete QR code' });
  }
}

const bulkDeleteQrCodes = bulkDeleteHandler('qr_codes');

// =====================================================
// HELPER FUNCTIONS FOR RELATED DATA
// =====================================================

async function createVCardData(qrCodeId, vcard) {
  await db.query(`
    INSERT INTO qr_vcard_data (
      qr_code_id, first_name, last_name, organization, title,
      phone_mobile, phone_work, phone_home, email_work, email_personal, website,
      street, city, state, postal_code, country,
      linkedin_url, twitter_url, facebook_url, instagram_url,
      photo_url, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
  `, [
    qrCodeId, vcard.first_name || null, vcard.last_name || null,
    vcard.organization || null, vcard.title || null,
    vcard.phone_mobile || null, vcard.phone_work || null, vcard.phone_home || null,
    vcard.email_work || null, vcard.email_personal || null, vcard.website || null,
    vcard.street || null, vcard.city || null, vcard.state || null,
    vcard.postal_code || null, vcard.country || null,
    vcard.linkedin_url || null, vcard.twitter_url || null,
    vcard.facebook_url || null, vcard.instagram_url || null,
    vcard.photo_url || null, vcard.notes || null
  ]);
}

async function createWifiData(qrCodeId, wifi) {
  await db.query(`
    INSERT INTO qr_wifi_data (qr_code_id, ssid, password, security_type, hidden)
    VALUES ($1, $2, $3, $4, $5)
  `, [qrCodeId, wifi.ssid, wifi.password || null, wifi.security_type, wifi.hidden || false]);
}

async function createEventData(qrCodeId, event) {
  await db.query(`
    INSERT INTO qr_event_data (
      qr_code_id, event_title, event_description, location,
      start_date, end_date, all_day, organizer_name, organizer_email
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    qrCodeId, event.event_title, event.event_description || null,
    event.location || null, event.start_date, event.end_date || null,
    event.all_day || false, event.organizer_name || null, event.organizer_email || null
  ]);
}

async function createPaymentData(qrCodeId, payment) {
  await db.query(`
    INSERT INTO qr_payment_data (
      qr_code_id, payment_type, paypal_email, wallet_address, upi_id,
      account_number, routing_number, bank_name, amount, currency, payment_note
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    qrCodeId, payment.payment_type, payment.paypal_email || null,
    payment.wallet_address || null, payment.upi_id || null,
    payment.account_number || null, payment.routing_number || null,
    payment.bank_name || null, payment.amount || null,
    payment.currency || 'USD', payment.payment_note || null
  ]);
}

async function createSocialData(qrCodeId, social) {
  await db.query(`
    INSERT INTO qr_social_data (qr_code_id, platform, username, profile_url)
    VALUES ($1, $2, $3, $4)
  `, [qrCodeId, social.platform, social.username || null, social.profile_url]);
}

// =====================================================
// PUBLIC SCAN ENDPOINT
// =====================================================

async function scanQrCode(req, res) {
  try {
    const { id } = req.params;

    // Find the QR code
    const { rows } = await db.query(`
      SELECT * FROM qr_codes 
      WHERE id = $1 AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ error: 'QR code not found or expired' });
    }

    const qrCode = rows[0];

    // Track the scan
    const visitorId = generateVisitorId(req);
    const userAgentData = parseUserAgent(req.headers['user-agent']);

    await db.query(`
      INSERT INTO qr_scan_events (
        qr_code_id, org_id, visitor_id, ip_address, user_agent, referer,
        device_type, device_brand, device_model, os_name, os_version,
        browser_name, browser_version, scanned_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
    `, [
      qrCode.id, qrCode.org_id, visitorId, req.ip, req.headers['user-agent'],
      req.headers.referer || null, userAgentData.device_type,
      userAgentData.device_brand, userAgentData.device_model,
      userAgentData.os_name, userAgentData.os_version,
      userAgentData.browser_name, userAgentData.browser_version
    ]);

    // Handle different QR types
    if (qrCode.is_dynamic && qrCode.redirect_url) {
      return res.redirect(302, qrCode.redirect_url);
    }

    const content = qrCode.content;

    // Return appropriate response based on type
    if (qrCode.qr_type === 'url') {
      return res.redirect(302, content.url || content);
    }

    // For other types, return the data
    res.json({
      qr_code: {
        id: qrCode.id,
        title: qrCode.title,
        qr_type: qrCode.qr_type,
        content: content
      }
    });
  } catch (error) {
    console.error('scanQrCode error:', error);
    res.status(500).json({ error: 'Failed to process scan' });
  }
}

// =====================================================
// ANALYTICS
// =====================================================

async function getQrAnalytics(req, res) {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    let dateFilter = "scanned_at > NOW() - INTERVAL '7 days'";
    if (period === '24h') dateFilter = "scanned_at > NOW() - INTERVAL '24 hours'";
    else if (period === '30d') dateFilter = "scanned_at > NOW() - INTERVAL '30 days'";
    else if (period === '90d') dateFilter = "scanned_at > NOW() - INTERVAL '90 days'";
    else if (period === 'all') dateFilter = "1=1";

    const { rows: [overview] } = await db.query(`
      SELECT 
        COUNT(*)::int as total_scans,
        COUNT(DISTINCT visitor_id)::int as unique_visitors
      FROM qr_scan_events
      WHERE qr_code_id = $1 AND org_id = $2 AND ${dateFilter}
    `, [id, req.user.orgId]);

    const { rows: timeline } = await db.query(`
      SELECT 
        DATE(scanned_at) as date,
        COUNT(*)::int as scans,
        COUNT(DISTINCT visitor_id)::int as unique_visitors
      FROM qr_scan_events
      WHERE qr_code_id = $1 AND org_id = $2 AND ${dateFilter}
      GROUP BY DATE(scanned_at)
      ORDER BY date
    `, [id, req.user.orgId]);

    const { rows: countries } = await db.query(`
      SELECT 
        country,
        COUNT(*)::int as scans,
        COUNT(DISTINCT visitor_id)::int as unique_visitors
      FROM qr_scan_events
      WHERE qr_code_id = $1 AND org_id = $2 AND ${dateFilter} AND country IS NOT NULL
      GROUP BY country
      ORDER BY scans DESC
      LIMIT 10
    `, [id, req.user.orgId]);

    const { rows: devices } = await db.query(`
      SELECT 
        device_type,
        COUNT(*)::int as scans,
        COUNT(DISTINCT visitor_id)::int as unique_visitors
      FROM qr_scan_events
      WHERE qr_code_id = $1 AND org_id = $2 AND ${dateFilter}
      GROUP BY device_type
      ORDER BY scans DESC
    `, [id, req.user.orgId]);

    const { rows: browsers } = await db.query(`
      SELECT 
        browser_name,
        COUNT(*)::int as scans
      FROM qr_scan_events
      WHERE qr_code_id = $1 AND org_id = $2 AND ${dateFilter} AND browser_name IS NOT NULL
      GROUP BY browser_name
      ORDER BY scans DESC
      LIMIT 10
    `, [id, req.user.orgId]);

    const { rows: os } = await db.query(`
      SELECT 
        os_name,
        COUNT(*)::int as scans
      FROM qr_scan_events
      WHERE qr_code_id = $1 AND org_id = $2 AND ${dateFilter} AND os_name IS NOT NULL
      GROUP BY os_name
      ORDER BY scans DESC
      LIMIT 10
    `, [id, req.user.orgId]);

    res.json({
      overview,
      timeline,
      countries,
      devices,
      browsers,
      os
    });
  } catch (error) {
    console.error('getQrAnalytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

// =====================================================
// FOLDERS
// =====================================================

async function listFolders(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT 
        f.*,
        COUNT(qc.id)::int as qr_count
      FROM qr_folders f
      LEFT JOIN qr_codes qc ON f.id = qc.folder_id
      WHERE f.org_id = $1
      GROUP BY f.id
      ORDER BY f.name
    `, [req.user.orgId]);

    res.json({ folders: rows });
  } catch (error) {
    console.error('listFolders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
}

async function createFolder(req, res) {
  try {
    const { name, description, parent_id, color, icon } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const { rows } = await db.query(`
      INSERT INTO qr_folders (org_id, parent_id, name, description, color, icon)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [req.user.orgId, parent_id || null, name.trim(), description || null, color || null, icon || null]);

    res.status(201).json({ folder: rows[0] });
  } catch (error) {
    console.error('createFolder error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Folder name already exists' });
    }
    res.status(500).json({ error: 'Failed to create folder' });
  }
}

async function updateFolder(req, res) {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      updates.push(`name = $${++paramCount}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${++paramCount}`);
      values.push(description || null);
    }
    if (color !== undefined) {
      updates.push(`color = $${++paramCount}`);
      values.push(color || null);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${++paramCount}`);
      values.push(icon || null);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    values.push(id, req.user.orgId);
    const { rows } = await db.query(`
      UPDATE qr_folders 
      SET ${updates.join(', ')}
      WHERE id = $${++paramCount} AND org_id = $${++paramCount}
      RETURNING *
    `, values);

    if (!rows.length) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json({ folder: rows[0] });
  } catch (error) {
    console.error('updateFolder error:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
}

async function deleteFolder(req, res) {
  try {
    const { id } = req.params;
    
    await db.query(
      `UPDATE qr_codes SET folder_id = NULL WHERE folder_id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );
    
    await db.query(
      `DELETE FROM qr_folders WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('deleteFolder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
}

// =====================================================
// TEMPLATES
// =====================================================

async function listTemplates(req, res) {
  try {
    const { category, is_global } = req.query;
    
    let query = `
      SELECT * FROM qr_templates 
      WHERE (org_id = $1 OR is_global = true)
    `;
    const params = [req.user.orgId];
    let paramCount = 1;

    if (category) {
      params.push(category);
      query += ` AND category = $${++paramCount}`;
    }

    if (is_global !== undefined) {
      params.push(is_global === 'true');
      query += ` AND is_global = $${++paramCount}`;
    }

    query += ` ORDER BY is_global DESC, usage_count DESC, name`;

    const { rows } = await db.query(query, params);

    res.json({ templates: rows });
  } catch (error) {
    console.error('listTemplates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
}

async function createTemplate(req, res) {
  try {
    const {
      name,
      description,
      category,
      foreground_color,
      background_color,
      gradient_type,
      gradient_color_1,
      gradient_color_2,
      logo_url,
      logo_size,
      logo_style,
      frame_style,
      frame_color,
      frame_text,
      frame_text_color,
      pattern_style,
      eye_style,
      eye_color,
      error_correction
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const { rows } = await db.query(`
      INSERT INTO qr_templates (
        org_id, name, description, category,
        foreground_color, background_color, gradient_type, gradient_color_1, gradient_color_2,
        logo_url, logo_size, logo_style,
        frame_style, frame_color, frame_text, frame_text_color,
        pattern_style, eye_style, eye_color, error_correction
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `, [
      req.user.orgId, name.trim(), description || null, category || null,
      foreground_color || '#000000', background_color || '#FFFFFF',
      gradient_type || null, gradient_color_1 || null, gradient_color_2 || null,
      logo_url || null, logo_size || 20, logo_style || 'square',
      frame_style || null, frame_color || null, frame_text || null, frame_text_color || null,
      pattern_style || 'square', eye_style || 'square', eye_color || null,
      error_correction || 'M'
    ]);

    res.status(201).json({ template: rows[0] });
  } catch (error) {
    console.error('createTemplate error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
}

async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    
    await db.query(
      `DELETE FROM qr_templates WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('deleteTemplate error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
}

// =====================================================
// BATCH GENERATION
// =====================================================

async function createBatch(req, res) {
  try {
    const { name, description, qr_type, template_id, items } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const { rows: [batch] } = await db.query(`
      INSERT INTO qr_batches (org_id, user_id, name, description, qr_type, template_id, total_codes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [req.user.orgId, req.user.id, name.trim(), description || null, qr_type, template_id || null, items.length]);

    // Insert batch items
    for (const item of items) {
      await db.query(`
        INSERT INTO qr_batch_items (batch_id, item_data)
        VALUES ($1, $2)
      `, [batch.id, JSON.stringify(item)]);
    }

    res.status(201).json({ batch });
  } catch (error) {
    console.error('createBatch error:', error);
    res.status(500).json({ error: 'Failed to create batch' });
  }
}

async function getBatchStatus(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(`
      SELECT 
        b.*,
        COUNT(bi.id)::int as total_items,
        COUNT(bi.id) FILTER(WHERE bi.status='generated')::int as generated_items,
        COUNT(bi.id) FILTER(WHERE bi.status='failed')::int as failed_items
      FROM qr_batches b
      LEFT JOIN qr_batch_items bi ON b.id = bi.batch_id
      WHERE b.id = $1 AND b.org_id = $2
      GROUP BY b.id
    `, [id, req.user.orgId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json({ batch: rows[0] });
  } catch (error) {
    console.error('getBatchStatus error:', error);
    res.status(500).json({ error: 'Failed to fetch batch status' });
  }
}

// =====================================================
// BULK OPERATIONS
// =====================================================

async function bulkUpdateQrCodes(req, res) {
  try {
    const { qr_code_ids, updates } = req.body;

    if (!qr_code_ids?.length) {
      return res.status(400).json({ error: 'qr_code_ids is required' });
    }

    const allowedUpdates = ['status', 'folder_id', 'tags'];
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        updateFields.push(`${key} = $${++paramCount}`);
        values.push(value);
      }
    }

    if (!updateFields.length) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    values.push(qr_code_ids, req.user.orgId);
    await db.query(`
      UPDATE qr_codes
      SET ${updateFields.join(', ')}
      WHERE id = ANY($${++paramCount}) AND org_id = $${++paramCount}
    `, values);

    res.json({ success: true, updated: qr_code_ids.length });
  } catch (error) {
    console.error('bulkUpdateQrCodes error:', error);
    res.status(500).json({ error: 'Failed to bulk update QR codes' });
  }
}

// =====================================================
// EXPORT
// =====================================================

async function exportQrCodes(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT 
        qc.title,
        qc.qr_type,
        qc.status,
        qc.total_scans,
        qc.unique_scans,
        qc.created_at,
        f.name as folder_name
      FROM qr_codes qc
      LEFT JOIN qr_folders f ON qc.folder_id = f.id
      WHERE qc.org_id = $1
      ORDER BY qc.created_at DESC
    `, [req.user.orgId]);

    sendCsv(res, 'qr-codes.csv', rows, autoColumns(rows));
  } catch (error) {
    console.error('exportQrCodes error:', error);
    res.status(500).json({ error: 'Failed to export QR codes' });
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // Dashboard
  getDashboardStats,
  
  // QR Codes CRUD
  listQrCodes,
  getQrCode,
  createQrCode,
  updateQrCode,
  deleteQrCode,
  bulkDeleteQrCodes,
  bulkUpdateQrCodes,
  
  // Public scan
  scanQrCode,
  
  // Analytics
  getQrAnalytics,
  
  // Folders
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  
  // Templates
  listTemplates,
  createTemplate,
  deleteTemplate,
  
  // Batch generation
  createBatch,
  getBatchStatus,
  
  // Export
  exportQrCodes
};