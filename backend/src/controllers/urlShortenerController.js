const db = require('../db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function generateSlug(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateVisitorId(req) {
  const fingerprint = `${req.ip}-${req.headers['user-agent']}-${req.headers['accept-language']}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

function parseUserAgent(userAgent) {
  // Simple UA parsing - in production, use a library like ua-parser-js
  const ua = userAgent || '';
  const result = {
    device_type: 'desktop',
    device_brand: null,
    device_model: null,
    os_name: 'Unknown',
    os_version: null,
    browser_name: 'Unknown',
    browser_version: null,
    is_bot: false,
    bot_name: null
  };

  // Bot detection
  const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget'];
  for (const pattern of botPatterns) {
    if (ua.toLowerCase().includes(pattern)) {
      result.is_bot = true;
      result.bot_name = pattern;
      break;
    }
  }

  // Device type
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    result.device_type = /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
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

function parseReferrer(referer) {
  if (!referer) return { domain: null, type: 'direct' };
  
  try {
    const url = new URL(referer);
    const domain = url.hostname.replace('www.', '');
    
    // Determine referrer type
    let type = 'other';
    if (/facebook|twitter|linkedin|instagram|tiktok|pinterest/i.test(domain)) {
      type = 'social';
    } else if (/google|bing|yahoo|duckduckgo/i.test(domain)) {
      type = 'search';
    } else if (/gmail|outlook|mail/i.test(domain)) {
      type = 'email';
    }
    
    return { domain, type };
  } catch {
    return { domain: null, type: 'direct' };
  }
}

// =====================================================
// DASHBOARD & STATS
// =====================================================

async function getDashboardStats(req, res) {
  try {
    const { rows: [stats] } = await db.query(`
      SELECT 
        COUNT(*)::int AS total_links,
        COUNT(*) FILTER(WHERE status='active')::int AS active_links,
        COALESCE(SUM(total_clicks), 0)::bigint AS total_clicks,
        COALESCE(SUM(unique_clicks), 0)::bigint AS unique_clicks,
        COUNT(*) FILTER(WHERE created_at > NOW() - INTERVAL '7 days')::int AS links_created_7d,
        COALESCE(SUM(CASE WHEN last_clicked_at > NOW() - INTERVAL '7 days' THEN total_clicks ELSE 0 END), 0)::bigint AS clicks_7d
      FROM short_links 
      WHERE org_id = $1
    `, [req.user.orgId]);

    const { rows: [domainStats] } = await db.query(`
      SELECT 
        COUNT(*)::int AS total_domains,
        COUNT(*) FILTER(WHERE is_verified=true)::int AS verified_domains
      FROM url_custom_domains 
      WHERE org_id = $1
    `, [req.user.orgId]);

    const { rows: topLinks } = await db.query(`
      SELECT id, slug, title, target_url, total_clicks, unique_clicks
      FROM short_links
      WHERE org_id = $1 AND status = 'active'
      ORDER BY total_clicks DESC
      LIMIT 5
    `, [req.user.orgId]);

    res.json({
      ...stats,
      ...domainStats,
      top_links: topLinks
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

// =====================================================
// LINKS CRUD
// =====================================================

async function listLinks(req, res) {
  try {
    const { 
      folder_id, 
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
        sl.*,
        f.name as folder_name,
        cd.domain as custom_domain,
        u.email as creator_email,
        (SELECT COUNT(*) FROM url_click_events WHERE link_id = sl.id AND clicked_at > NOW() - INTERVAL '7 days') as clicks_7d
      FROM short_links sl
      LEFT JOIN url_folders f ON sl.folder_id = f.id
      LEFT JOIN url_custom_domains cd ON sl.custom_domain_id = cd.id
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE sl.org_id = $1
    `;
    
    const params = [req.user.orgId];
    let paramCount = 1;

    if (folder_id) {
      params.push(folder_id);
      query += ` AND sl.folder_id = $${++paramCount}`;
    }

    if (status) {
      params.push(status);
      query += ` AND sl.status = $${++paramCount}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (sl.title ILIKE $${++paramCount} OR sl.slug ILIKE $${paramCount} OR sl.target_url ILIKE $${paramCount})`;
    }

    if (tag) {
      params.push(tag);
      query += ` AND $${++paramCount} = ANY(sl.tags)`;
    }

    const validSorts = ['created_at', 'total_clicks', 'unique_clicks', 'title', 'last_clicked_at'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY sl.${sortField} ${sortOrder}`;
    
    params.push(limit, offset);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;

    const { rows } = await db.query(query, params);

    // Get total count
    const { rows: [{ count }] } = await db.query(
      `SELECT COUNT(*)::int as count FROM short_links WHERE org_id = $1`,
      [req.user.orgId]
    );

    res.json({ 
      links: rows,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('listLinks error:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
}

async function getLink(req, res) {
  try {
    const { id } = req.params;
    
    const { rows } = await db.query(`
      SELECT 
        sl.*,
        f.name as folder_name,
        cd.domain as custom_domain,
        u.email as creator_email,
        qr.file_url as qr_code_url,
        (SELECT COUNT(*) FROM url_click_events WHERE link_id = sl.id) as total_click_events,
        (SELECT COUNT(DISTINCT visitor_id) FROM url_click_events WHERE link_id = sl.id) as unique_visitors
      FROM short_links sl
      LEFT JOIN url_folders f ON sl.folder_id = f.id
      LEFT JOIN url_custom_domains cd ON sl.custom_domain_id = cd.id
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN url_qr_codes qr ON sl.id = qr.link_id
      WHERE sl.id = $1 AND sl.org_id = $2
    `, [id, req.user.orgId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ link: rows[0] });
  } catch (error) {
    console.error('getLink error:', error);
    res.status(500).json({ error: 'Failed to fetch link' });
  }
}

async function createLink(req, res) {
  try {
    const {
      target_url,
      title,
      description,
      custom_slug,
      custom_domain_id,
      folder_id,
      tags = [],
      link_type = 'standard',
      scheduled_at,
      expires_at,
      password,
      og_title,
      og_description,
      og_image_url,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      facebook_pixel_id,
      google_analytics_id,
      custom_pixels = [],
      ab_test_config,
      rotation_urls,
      ios_url,
      android_url,
      desktop_fallback,
      notes,
      metadata = {}
    } = req.body;

    if (!target_url?.trim()) {
      return res.status(400).json({ error: 'target_url is required' });
    }

    // Generate or validate slug
    let slug = custom_slug?.trim();
    let back_half = slug;
    
    if (slug) {
      // Check if slug is available
      const { rows: existing } = await db.query(
        `SELECT 1 FROM short_links WHERE slug = $1 OR (custom_domain_id = $2 AND back_half = $3)`,
        [slug, custom_domain_id || null, slug]
      );
      if (existing.length) {
        return res.status(400).json({ error: 'Slug already taken' });
      }
    } else {
      // Generate unique slug
      let attempts = 0;
      do {
        slug = generateSlug(6);
        back_half = slug;
        attempts++;
        const { rows } = await db.query(`SELECT 1 FROM short_links WHERE slug = $1`, [slug]);
        if (!rows.length) break;
      } while (attempts < 10);
      
      if (attempts >= 10) {
        return res.status(500).json({ error: 'Failed to generate unique slug' });
      }
    }

    // Hash password if provided
    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    // Determine initial status
    let status = 'active';
    if (scheduled_at && new Date(scheduled_at) > new Date()) {
      status = 'scheduled';
    }

    const { rows } = await db.query(`
      INSERT INTO short_links (
        org_id, user_id, slug, custom_domain_id, back_half, target_url,
        title, description, folder_id, tags, status, link_type,
        scheduled_at, expires_at, password_hash, password_enabled,
        og_title, og_description, og_image_url,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        facebook_pixel_id, google_analytics_id, custom_pixels,
        ab_test_config, rotation_urls,
        ios_url, android_url, desktop_fallback,
        notes, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $34
      ) RETURNING *
    `, [
      req.user.orgId, req.user.id, slug, custom_domain_id || null, back_half,
      target_url.trim(), title || null, description || null, folder_id || null,
      tags, status, link_type, scheduled_at || null, expires_at || null,
      password_hash, !!password, og_title || null, og_description || null,
      og_image_url || null, utm_source || null, utm_medium || null,
      utm_campaign || null, utm_term || null, utm_content || null,
      facebook_pixel_id || null, google_analytics_id || null,
      JSON.stringify(custom_pixels), ab_test_config ? JSON.stringify(ab_test_config) : null,
      rotation_urls ? JSON.stringify(rotation_urls) : null,
      ios_url || null, android_url || null, desktop_fallback || null,
      notes || null, JSON.stringify(metadata)
    ]);

    res.status(201).json({ link: rows[0] });
  } catch (error) {
    console.error('createLink error:', error);
    res.status(500).json({ error: 'Failed to create link' });
  }
}

async function updateLink(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      target_url,
      folder_id,
      tags,
      status,
      expires_at,
      password,
      og_title,
      og_description,
      og_image_url,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      notes,
      metadata
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (title !== undefined) {
      updates.push(`title = $${++paramCount}`);
      values.push(title || null);
    }
    if (description !== undefined) {
      updates.push(`description = $${++paramCount}`);
      values.push(description || null);
    }
    if (target_url !== undefined) {
      updates.push(`target_url = $${++paramCount}`);
      values.push(target_url);
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
    if (password !== undefined) {
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        updates.push(`password_hash = $${++paramCount}, password_enabled = true`);
        values.push(hash);
      } else {
        updates.push(`password_hash = NULL, password_enabled = false`);
      }
    }
    if (og_title !== undefined) {
      updates.push(`og_title = $${++paramCount}`);
      values.push(og_title || null);
    }
    if (og_description !== undefined) {
      updates.push(`og_description = $${++paramCount}`);
      values.push(og_description || null);
    }
    if (og_image_url !== undefined) {
      updates.push(`og_image_url = $${++paramCount}`);
      values.push(og_image_url || null);
    }
    if (utm_source !== undefined) {
      updates.push(`utm_source = $${++paramCount}`);
      values.push(utm_source || null);
    }
    if (utm_medium !== undefined) {
      updates.push(`utm_medium = $${++paramCount}`);
      values.push(utm_medium || null);
    }
    if (utm_campaign !== undefined) {
      updates.push(`utm_campaign = $${++paramCount}`);
      values.push(utm_campaign || null);
    }
    if (utm_term !== undefined) {
      updates.push(`utm_term = $${++paramCount}`);
      values.push(utm_term || null);
    }
    if (utm_content !== undefined) {
      updates.push(`utm_content = $${++paramCount}`);
      values.push(utm_content || null);
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
      UPDATE short_links 
      SET ${updates.join(', ')}
      WHERE id = $${++paramCount} AND org_id = $${++paramCount}
      RETURNING *
    `, values);

    if (!rows.length) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ link: rows[0] });
  } catch (error) {
    console.error('updateLink error:', error);
    res.status(500).json({ error: 'Failed to update link' });
  }
}

async function deleteLink(req, res) {
  try {
    const { id } = req.params;
    
    await db.query(
      `DELETE FROM short_links WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('deleteLink error:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
}

const bulkDeleteLinks = bulkDeleteHandler('short_links');

// =====================================================
// LINK REDIRECTION (Public endpoint)
// =====================================================

async function redirectLink(req, res) {
  try {
    const { slug } = req.params;
    const { password } = req.query;

    // Find the link
    const { rows } = await db.query(`
      SELECT * FROM short_links 
      WHERE slug = $1 AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
    `, [slug]);

    if (!rows.length) {
      return res.status(404).send('Link not found or expired');
    }

    const link = rows[0];

    // Check password protection
    if (link.password_enabled) {
      if (!password) {
        return res.status(401).send('Password required');
      }
      const valid = await bcrypt.compare(password, link.password_hash);
      if (!valid) {
        return res.status(401).send('Invalid password');
      }
    }

    // Track the click
    const visitorId = generateVisitorId(req);
    const userAgentData = parseUserAgent(req.headers['user-agent']);
    const referrerData = parseReferrer(req.headers.referer);

    await db.query(`
      INSERT INTO url_click_events (
        link_id, org_id, visitor_id, ip_address, user_agent, referer,
        device_type, device_brand, device_model, os_name, os_version,
        browser_name, browser_version, referrer_domain, referrer_type,
        is_bot, bot_name, clicked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
    `, [
      link.id, link.org_id, visitorId, req.ip, req.headers['user-agent'],
      req.headers.referer || null, userAgentData.device_type,
      userAgentData.device_brand, userAgentData.device_model,
      userAgentData.os_name, userAgentData.os_version,
      userAgentData.browser_name, userAgentData.browser_version,
      referrerData.domain, referrerData.type,
      userAgentData.is_bot, userAgentData.bot_name
    ]);

    // Handle different link types
    let targetUrl = link.target_url;

    if (link.link_type === 'rotator' && link.rotation_urls) {
      // Simple rotation - pick random URL based on weights
      const urls = link.rotation_urls;
      const totalWeight = urls.reduce((sum, u) => sum + (u.weight || 1), 0);
      let random = Math.random() * totalWeight;
      for (const urlConfig of urls) {
        random -= (urlConfig.weight || 1);
        if (random <= 0) {
          targetUrl = urlConfig.url;
          break;
        }
      }
    } else if (link.link_type === 'ab_test' && link.ab_test_config) {
      // A/B test - similar to rotation
      const variants = link.ab_test_config.variants || [];
      const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);
      let random = Math.random() * totalWeight;
      for (const variant of variants) {
        random -= (variant.weight || 1);
        if (random <= 0) {
          targetUrl = variant.url;
          break;
        }
      }
    } else if (link.link_type === 'deep_link') {
      // Device-specific redirect
      const ua = req.headers['user-agent'] || '';
      if (/android/i.test(ua) && link.android_url) {
        targetUrl = link.android_url;
      } else if (/iphone|ipad|ipod/i.test(ua) && link.ios_url) {
        targetUrl = link.ios_url;
      } else if (link.desktop_fallback) {
        targetUrl = link.desktop_fallback;
      }
    }

    // Add UTM parameters if configured
    if (link.utm_source || link.utm_medium || link.utm_campaign) {
      const url = new URL(targetUrl);
      if (link.utm_source) url.searchParams.set('utm_source', link.utm_source);
      if (link.utm_medium) url.searchParams.set('utm_medium', link.utm_medium);
      if (link.utm_campaign) url.searchParams.set('utm_campaign', link.utm_campaign);
      if (link.utm_term) url.searchParams.set('utm_term', link.utm_term);
      if (link.utm_content) url.searchParams.set('utm_content', link.utm_content);
      targetUrl = url.toString();
    }

    // Redirect
    res.redirect(302, targetUrl);
  } catch (error) {
    console.error('redirectLink error:', error);
    res.status(500).send('Internal server error');
  }
}

// =====================================================
// ANALYTICS
// =====================================================

async function getLinkAnalytics(req, res) {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    // Determine date range
    let dateFilter = "clicked_at > NOW() - INTERVAL '7 days'";
    if (period === '24h') dateFilter = "clicked_at > NOW() - INTERVAL '24 hours'";
    else if (period === '30d') dateFilter = "clicked_at > NOW() - INTERVAL '30 days'";
    else if (period === '90d') dateFilter = "clicked_at > NOW() - INTERVAL '90 days'";
    else if (period === 'all') dateFilter = "1=1";

    // Overview stats
    const { rows: [overview] } = await db.query(`
      SELECT 
        COUNT(*)::int as total_clicks,
        COUNT(DISTINCT visitor_id)::int as unique_visitors,
        COUNT(*) FILTER(WHERE is_bot=false)::int as human_clicks,
        COUNT(*) FILTER(WHERE is_bot=true)::int as bot_clicks
      FROM url_click_events
      WHERE link_id = $1 AND org_id = $2 AND ${dateFilter}
    `, [id, req.user.orgId]);

    // Clicks over time
    const { rows: timeline } = await db.query(`
      SELECT 
        DATE(clicked_at) as date,
        COUNT(*)::int as clicks,
        COUNT(DISTINCT visitor_id)::int as unique_visitors
      FROM url_click_events
      WHERE link_id = $1 AND org_id = $2 AND ${dateFilter}
      GROUP BY DATE(clicked_at)
      ORDER BY date
    `, [id, req.user.orgId]);

    // Top countries
    const { rows: countries } = await db.query(`
      SELECT 
        country,
        COUNT(*)::int as clicks,
        COUNT(DISTINCT visitor_id)::int as unique_visitors
      FROM url_click_events
      WHERE link_id = $1 AND org_id = $2 AND ${dateFilter} AND country IS NOT NULL
      GROUP BY country
      ORDER BY clicks DESC
      LIMIT 10
    `, [id, req.user.orgId]);

    // Top referrers
    const { rows: referrers } = await db.query(`
      SELECT 
        referrer_domain,
        referrer_type,
        COUNT(*)::int as clicks
      FROM url_click_events
      WHERE link_id = $1 AND org_id = $2 AND ${dateFilter} AND referrer_domain IS NOT NULL
      GROUP BY referrer_domain, referrer_type
      ORDER BY clicks DESC
      LIMIT 10
    `, [id, req.user.orgId]);

    // Devices
    const { rows: devices } = await db.query(`
      SELECT 
        device_type,
        COUNT(*)::int as clicks,
        COUNT(DISTINCT visitor_id)::int as unique_visitors
      FROM url_click_events
      WHERE link_id = $1 AND org_id = $2 AND ${dateFilter}
      GROUP BY device_type
      ORDER BY clicks DESC
    `, [id, req.user.orgId]);

    // Browsers
    const { rows: browsers } = await db.query(`
      SELECT 
        browser_name,
        COUNT(*)::int as clicks
      FROM url_click_events
      WHERE link_id = $1 AND org_id = $2 AND ${dateFilter} AND browser_name IS NOT NULL
      GROUP BY browser_name
      ORDER BY clicks DESC
      LIMIT 10
    `, [id, req.user.orgId]);

    // Operating systems
    const { rows: os } = await db.query(`
      SELECT 
        os_name,
        COUNT(*)::int as clicks
      FROM url_click_events
      WHERE link_id = $1 AND org_id = $2 AND ${dateFilter} AND os_name IS NOT NULL
      GROUP BY os_name
      ORDER BY clicks DESC
      LIMIT 10
    `, [id, req.user.orgId]);

    res.json({
      overview,
      timeline,
      countries,
      referrers,
      devices,
      browsers,
      os
    });
  } catch (error) {
    console.error('getLinkAnalytics error:', error);
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
        COUNT(sl.id)::int as link_count
      FROM url_folders f
      LEFT JOIN short_links sl ON f.id = sl.folder_id
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
      INSERT INTO url_folders (org_id, parent_id, name, description, color, icon)
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
      UPDATE url_folders 
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
    
    // Move links to root (no folder)
    await db.query(
      `UPDATE short_links SET folder_id = NULL WHERE folder_id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );
    
    await db.query(
      `DELETE FROM url_folders WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('deleteFolder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
}

// =====================================================
// CUSTOM DOMAINS
// =====================================================

async function listCustomDomains(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT 
        cd.*,
        COUNT(sl.id)::int as link_count
      FROM url_custom_domains cd
      LEFT JOIN short_links sl ON cd.id = sl.custom_domain_id
      WHERE cd.org_id = $1
      GROUP BY cd.id
      ORDER BY cd.created_at DESC
    `, [req.user.orgId]);

    res.json({ domains: rows });
  } catch (error) {
    console.error('listCustomDomains error:', error);
    res.status(500).json({ error: 'Failed to fetch custom domains' });
  }
}

async function createCustomDomain(req, res) {
  try {
    const { domain } = req.body;

    if (!domain?.trim()) {
      return res.status(400).json({ error: 'domain is required' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const { rows } = await db.query(`
      INSERT INTO url_custom_domains (org_id, domain, verification_token)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [req.user.orgId, domain.trim().toLowerCase(), verificationToken]);

    res.status(201).json({ 
      domain: rows[0],
      dns_instructions: {
        type: 'CNAME',
        name: domain.trim().toLowerCase(),
        value: 'links.yourdomain.com', // Replace with actual value
        txt_record: {
          name: `_verification.${domain.trim().toLowerCase()}`,
          value: verificationToken
        }
      }
    });
  } catch (error) {
    console.error('createCustomDomain error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Domain already exists' });
    }
    res.status(500).json({ error: 'Failed to create custom domain' });
  }
}

async function verifyCustomDomain(req, res) {
  try {
    const { id } = req.params;

    // In production, this would check DNS records
    // For now, we'll just mark as verified
    const { rows } = await db.query(`
      UPDATE url_custom_domains
      SET is_verified = true, dns_configured = true, status = 'active', verified_at = NOW()
      WHERE id = $1 AND org_id = $2
      RETURNING *
    `, [id, req.user.orgId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json({ domain: rows[0] });
  } catch (error) {
    console.error('verifyCustomDomain error:', error);
    res.status(500).json({ error: 'Failed to verify domain' });
  }
}

async function deleteCustomDomain(req, res) {
  try {
    const { id } = req.params;
    
    await db.query(
      `DELETE FROM url_custom_domains WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('deleteCustomDomain error:', error);
    res.status(500).json({ error: 'Failed to delete domain' });
  }
}

// =====================================================
// QR CODES
// =====================================================

async function generateQRCode(req, res) {
  try {
    const { id } = req.params;
    const {
      size = 300,
      format = 'png',
      foreground_color = '#000000',
      background_color = '#FFFFFF',
      logo_url,
      error_correction = 'M'
    } = req.body;

    // Check if link exists
    const { rows: linkRows } = await db.query(
      `SELECT * FROM short_links WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!linkRows.length) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // In production, generate actual QR code using a library like qrcode
    // For now, return a placeholder
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(linkRows[0].slug)}`;

    // Save QR code record
    const { rows } = await db.query(`
      INSERT INTO url_qr_codes (
        link_id, size, format, error_correction,
        foreground_color, background_color, logo_url, file_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (link_id) DO UPDATE SET
        size = EXCLUDED.size,
        format = EXCLUDED.format,
        foreground_color = EXCLUDED.foreground_color,
        background_color = EXCLUDED.background_color,
        logo_url = EXCLUDED.logo_url,
        file_url = EXCLUDED.file_url,
        updated_at = NOW()
      RETURNING *
    `, [id, size, format, error_correction, foreground_color, background_color, logo_url || null, qrCodeUrl]);

    res.json({ qr_code: rows[0] });
  } catch (error) {
    console.error('generateQRCode error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}

// =====================================================
// BULK OPERATIONS
// =====================================================

async function bulkUpdateLinks(req, res) {
  try {
    const { link_ids, updates } = req.body;

    if (!link_ids?.length) {
      return res.status(400).json({ error: 'link_ids is required' });
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

    values.push(link_ids, req.user.orgId);
    await db.query(`
      UPDATE short_links
      SET ${updateFields.join(', ')}
      WHERE id = ANY($${++paramCount}) AND org_id = $${++paramCount}
    `, values);

    res.json({ success: true, updated: link_ids.length });
  } catch (error) {
    console.error('bulkUpdateLinks error:', error);
    res.status(500).json({ error: 'Failed to bulk update links' });
  }
}

// =====================================================
// EXPORT
// =====================================================

async function exportLinks(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT 
        sl.slug,
        sl.target_url,
        sl.title,
        sl.status,
        sl.total_clicks,
        sl.unique_clicks,
        sl.created_at,
        f.name as folder_name
      FROM short_links sl
      LEFT JOIN url_folders f ON sl.folder_id = f.id
      WHERE sl.org_id = $1
      ORDER BY sl.created_at DESC
    `, [req.user.orgId]);

    sendCsv(res, 'short-links.csv', rows, autoColumns(rows));
  } catch (error) {
    console.error('exportLinks error:', error);
    res.status(500).json({ error: 'Failed to export links' });
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // Dashboard
  getDashboardStats,
  
  // Links CRUD
  listLinks,
  getLink,
  createLink,
  updateLink,
  deleteLink,
  bulkDeleteLinks,
  bulkUpdateLinks,
  
  // Public redirect
  redirectLink,
  
  // Analytics
  getLinkAnalytics,
  
  // Folders
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  
  // Custom domains
  listCustomDomains,
  createCustomDomain,
  verifyCustomDomain,
  deleteCustomDomain,
  
  // QR Codes
  generateQRCode,
  
  // Export
  exportLinks
};