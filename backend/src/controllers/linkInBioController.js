const db = require('../db');
const crypto = require('crypto');

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
    os_name: 'Unknown',
    browser_name: 'Unknown'
  };

  if (/mobile|android|iphone|ipod/i.test(ua)) {
    result.device_type = 'mobile';
  } else if (/ipad|tablet/i.test(ua)) {
    result.device_type = 'tablet';
  }

  if (/windows/i.test(ua)) result.os_name = 'Windows';
  else if (/mac os x/i.test(ua)) result.os_name = 'macOS';
  else if (/linux/i.test(ua)) result.os_name = 'Linux';
  else if (/android/i.test(ua)) result.os_name = 'Android';
  else if (/ios|iphone|ipad/i.test(ua)) result.os_name = 'iOS';

  if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) result.browser_name = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) result.browser_name = 'Safari';
  else if (/firefox/i.test(ua)) result.browser_name = 'Firefox';
  else if (/edge|edg/i.test(ua)) result.browser_name = 'Edge';

  return result;
}

// =====================================================
// STATS & DASHBOARD
// =====================================================

async function getStats(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(DISTINCT p.id) AS pages, 
              COALESCE(SUM(p.views),0) AS total_views,
              COALESCE(SUM(bl.clicks),0) AS total_clicks, 
              COUNT(DISTINCT bl.id) AS total_links
       FROM link_in_bio_pages p
       LEFT JOIN bio_links bl ON bl.page_id = p.id
       WHERE p.org_id=$1`, 
      [req.user.orgId]
    );
    res.json({ stats: rows[0] });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

// =====================================================
// PAGES CRUD
// =====================================================

async function listPages(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT p.*, COUNT(bl.id) AS link_count,
              t.name as theme_name
       FROM link_in_bio_pages p
       LEFT JOIN bio_links bl ON bl.page_id = p.id
       LEFT JOIN bio_themes t ON p.theme_id = t.id
       WHERE p.org_id=$1
       GROUP BY p.id, t.name 
       ORDER BY p.created_at DESC`, 
      [req.user.orgId]
    );
    res.json({ pages: rows });
  } catch (error) {
    console.error('listPages error:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
}

async function getPage(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT p.*, COUNT(bl.id) AS link_count,
              t.name as theme_name
       FROM link_in_bio_pages p
       LEFT JOIN bio_links bl ON bl.page_id = p.id
       LEFT JOIN bio_themes t ON p.theme_id = t.id
       WHERE p.id=$1 AND p.org_id=$2
       GROUP BY p.id, t.name`,
      [id, req.user.orgId]
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json({ page: rows[0] });
  } catch (error) {
    console.error('getPage error:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
}

async function createPage(req, res) {
  try {
    const { 
      title, bio, avatarUrl, slug, bgColor, accentColor, 
      themeId, metaTitle, metaDescription, ogImage, faviconUrl,
      fontFamily, layoutStyle, showBranding, analyticsEnabled
    } = req.body || {};
    
    if (!title?.trim() || !slug?.trim()) {
      return res.status(400).json({ error: 'title and slug required.' });
    }
    
    const { rows } = await db.query(
      `INSERT INTO link_in_bio_pages (
        org_id, title, bio, avatar_url, slug, bg_color, accent_color,
        theme_id, meta_title, meta_description, og_image, favicon_url,
        font_family, layout_style, show_branding, analytics_enabled
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) 
      RETURNING *`,
      [
        req.user.orgId, title.trim(), bio||null, avatarUrl||null, 
        slug.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-'), 
        bgColor||'#ffffff', accentColor||'#2563eb',
        themeId||null, metaTitle||null, metaDescription||null, 
        ogImage||null, faviconUrl||null, fontFamily||'Inter',
        layoutStyle||'centered', showBranding??true, analyticsEnabled??true
      ]
    );
    
    res.status(201).json({ page: rows[0] });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Slug already taken.' });
    }
    console.error('createPage error:', e);
    res.status(500).json({ error: 'Failed to create page' });
  }
}

async function updatePage(req, res) {
  try {
    const { id } = req.params;
    const { 
      title, bio, avatarUrl, slug, bgColor, accentColor, status,
      themeId, metaTitle, metaDescription, ogImage, faviconUrl,
      customCss, fontFamily, layoutStyle, showBranding, analyticsEnabled
    } = req.body || {};
    
    const { rows } = await db.query(
      `UPDATE link_in_bio_pages SET 
        title=COALESCE($3,title), bio=$4, avatar_url=$5,
        slug=COALESCE($6,slug), bg_color=COALESCE($7,bg_color), 
        accent_color=COALESCE($8,accent_color), status=COALESCE($9,status),
        theme_id=$10, meta_title=$11, meta_description=$12, og_image=$13,
        favicon_url=$14, custom_css=$15, font_family=COALESCE($16,font_family),
        layout_style=COALESCE($17,layout_style), show_branding=COALESCE($18,show_branding),
        analytics_enabled=COALESCE($19,analytics_enabled)
       WHERE id=$1 AND org_id=$2 RETURNING *`,
      [
        id, req.user.orgId, title||null, bio||null, avatarUrl||null, 
        slug||null, bgColor||null, accentColor||null, status||null,
        themeId??null, metaTitle||null, metaDescription||null, ogImage||null,
        faviconUrl||null, customCss||null, fontFamily||null, layoutStyle||null,
        showBranding??null, analyticsEnabled??null
      ]
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Not found.' });
    }
    
    res.json({ page: rows[0] });
  } catch (error) {
    console.error('updatePage error:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
}

async function deletePage(req, res) {
  try {
    await db.query(
      `DELETE FROM link_in_bio_pages WHERE id=$1 AND org_id=$2`, 
      [req.params.id, req.user.orgId]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('deletePage error:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
}

// =====================================================
// LINKS CRUD
// =====================================================

async function listLinks(req, res) {
  try {
    const { pageId } = req.params;
    const { rows } = await db.query(
      `SELECT bl.*, s.title as section_title 
       FROM bio_links bl 
       JOIN link_in_bio_pages p ON p.id=bl.page_id
       LEFT JOIN bio_link_sections s ON bl.section_id = s.id
       WHERE bl.page_id=$1 AND p.org_id=$2 
       ORDER BY bl.sort_order ASC`, 
      [pageId, req.user.orgId]
    );
    res.json({ links: rows });
  } catch (error) {
    console.error('listLinks error:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
}

async function createLink(req, res) {
  try {
    const { pageId } = req.params;
    const { 
      title, url, icon, sortOrder, thumbnailUrl, description,
      isPriority, scheduleStart, scheduleEnd, category, animation, sectionId
    } = req.body || {};
    
    if (!title?.trim() || !url?.trim()) {
      return res.status(400).json({ error: 'title and url required.' });
    }
    
    const page = await db.query(
      `SELECT id FROM link_in_bio_pages WHERE id=$1 AND org_id=$2`, 
      [pageId, req.user.orgId]
    );
    
    if (!page.rows.length) {
      return res.status(404).json({ error: 'Page not found.' });
    }
    
    const { rows } = await db.query(
      `INSERT INTO bio_links (
        page_id, org_id, title, url, icon, sort_order, thumbnail_url,
        description, is_priority, schedule_start, schedule_end, category,
        animation, section_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) 
      RETURNING *`,
      [
        pageId, req.user.orgId, title.trim(), url.trim(), icon||'🔗', 
        sortOrder||0, thumbnailUrl||null, description||null, isPriority||false,
        scheduleStart||null, scheduleEnd||null, category||null, 
        animation||'none', sectionId||null
      ]
    );
    
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
      title, url, icon, sortOrder, isActive, thumbnailUrl, description,
      isPriority, scheduleStart, scheduleEnd, category, animation, sectionId
    } = req.body || {};
    
    const { rows } = await db.query(
      `UPDATE bio_links SET 
        title=COALESCE($3,title), url=COALESCE($4,url), icon=COALESCE($5,icon),
        sort_order=COALESCE($6,sort_order), is_active=COALESCE($7,is_active),
        thumbnail_url=$8, description=$9, is_priority=COALESCE($10,is_priority),
        schedule_start=$11, schedule_end=$12, category=$13, 
        animation=COALESCE($14,animation), section_id=$15
       WHERE id=$1 AND org_id=$2 RETURNING *`,
      [
        id, req.user.orgId, title||null, url||null, icon||null, 
        sortOrder??null, isActive??null, thumbnailUrl||null, description||null,
        isPriority??null, scheduleStart||null, scheduleEnd||null, category||null,
        animation||null, sectionId||null
      ]
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Not found.' });
    }
    
    res.json({ link: rows[0] });
  } catch (error) {
    console.error('updateLink error:', error);
    res.status(500).json({ error: 'Failed to update link' });
  }
}

async function deleteLink(req, res) {
  try {
    await db.query(
      `DELETE FROM bio_links WHERE id=$1 AND org_id=$2`, 
      [req.params.id, req.user.orgId]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('deleteLink error:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
}

// =====================================================
// THEMES
// =====================================================

async function listThemes(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT * FROM bio_themes 
       WHERE org_id=$1 OR is_system=true 
       ORDER BY is_system DESC, usage_count DESC, name`,
      [req.user.orgId]
    );
    res.json({ themes: rows });
  } catch (error) {
    console.error('listThemes error:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
}

async function createTheme(req, res) {
  try {
    const { 
      name, description, category, bgColor, bgGradient, bgImage,
      textColor, accentColor, linkBgColor, linkTextColor, fontFamily,
      fontSize, borderRadius, linkStyle, layoutStyle, spacing
    } = req.body || {};
    
    if (!name?.trim()) {
      return res.status(400).json({ error: 'name required' });
    }
    
    const { rows } = await db.query(
      `INSERT INTO bio_themes (
        org_id, name, description, category, bg_color, bg_gradient, bg_image,
        text_color, accent_color, link_bg_color, link_text_color, font_family,
        font_size, border_radius, link_style, layout_style, spacing
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [
        req.user.orgId, name.trim(), description||null, category||null,
        bgColor||'#ffffff', bgGradient||null, bgImage||null, textColor||'#000000',
        accentColor||'#2563eb', linkBgColor||'#f3f4f6', linkTextColor||'#000000',
        fontFamily||'Inter', fontSize||'medium', borderRadius||'medium',
        linkStyle||'solid', layoutStyle||'centered', spacing||'medium'
      ]
    );
    
    res.status(201).json({ theme: rows[0] });
  } catch (error) {
    console.error('createTheme error:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
}

// =====================================================
// ANALYTICS
// =====================================================

async function getPageAnalytics(req, res) {
  try {
    const { pageId } = req.params;
    const { period = '30d' } = req.query;
    
    let dateFilter = "viewed_at > NOW() - INTERVAL '30 days'";
    if (period === '7d') dateFilter = "viewed_at > NOW() - INTERVAL '7 days'";
    else if (period === '90d') dateFilter = "viewed_at > NOW() - INTERVAL '90 days'";
    else if (period === 'all') dateFilter = "1=1";
    
    const { rows: [overview] } = await db.query(
      `SELECT 
        COUNT(*)::int as total_views,
        COUNT(DISTINCT visitor_id)::int as unique_visitors
       FROM bio_page_views
       WHERE page_id=$1 AND org_id=$2 AND ${dateFilter}`,
      [pageId, req.user.orgId]
    );
    
    const { rows: timeline } = await db.query(
      `SELECT DATE(viewed_at) as date, COUNT(*)::int as views
       FROM bio_page_views
       WHERE page_id=$1 AND org_id=$2 AND ${dateFilter}
       GROUP BY DATE(viewed_at) ORDER BY date`,
      [pageId, req.user.orgId]
    );
    
    const { rows: devices } = await db.query(
      `SELECT device_type, COUNT(*)::int as count
       FROM bio_page_views
       WHERE page_id=$1 AND org_id=$2 AND ${dateFilter}
       GROUP BY device_type ORDER BY count DESC`,
      [pageId, req.user.orgId]
    );
    
    const { rows: countries } = await db.query(
      `SELECT country, COUNT(*)::int as count
       FROM bio_page_views
       WHERE page_id=$1 AND org_id=$2 AND ${dateFilter} AND country IS NOT NULL
       GROUP BY country ORDER BY count DESC LIMIT 10`,
      [pageId, req.user.orgId]
    );
    
    res.json({ overview, timeline, devices, countries });
  } catch (error) {
    console.error('getPageAnalytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

async function getLinkAnalytics(req, res) {
  try {
    const { linkId } = req.params;
    const { period = '30d' } = req.query;
    
    let dateFilter = "clicked_at > NOW() - INTERVAL '30 days'";
    if (period === '7d') dateFilter = "clicked_at > NOW() - INTERVAL '7 days'";
    else if (period === '90d') dateFilter = "clicked_at > NOW() - INTERVAL '90 days'";
    
    const { rows: [overview] } = await db.query(
      `SELECT 
        COUNT(*)::int as total_clicks,
        COUNT(DISTINCT visitor_id)::int as unique_visitors
       FROM bio_link_clicks
       WHERE link_id=$1 AND org_id=$2 AND ${dateFilter}`,
      [linkId, req.user.orgId]
    );
    
    const { rows: timeline } = await db.query(
      `SELECT DATE(clicked_at) as date, COUNT(*)::int as clicks
       FROM bio_link_clicks
       WHERE link_id=$1 AND org_id=$2 AND ${dateFilter}
       GROUP BY DATE(clicked_at) ORDER BY date`,
      [linkId, req.user.orgId]
    );
    
    res.json({ overview, timeline });
  } catch (error) {
    console.error('getLinkAnalytics error:', error);
    res.status(500).json({ error: 'Failed to fetch link analytics' });
  }
}

// =====================================================
// PUBLIC TRACKING ENDPOINTS
// =====================================================

async function trackPageView(req, res) {
  try {
    const { pageId } = req.params;
    
    const visitorId = generateVisitorId(req);
    const userAgentData = parseUserAgent(req.headers['user-agent']);
    
    await db.query(
      `INSERT INTO bio_page_views (
        page_id, org_id, visitor_id, ip_address, user_agent, referer,
        device_type, os_name, browser_name
      ) SELECT $1, org_id, $2, $3, $4, $5, $6, $7, $8
        FROM link_in_bio_pages WHERE id=$1`,
      [
        pageId, visitorId, req.ip, req.headers['user-agent'],
        req.headers.referer||null, userAgentData.device_type,
        userAgentData.os_name, userAgentData.browser_name
      ]
    );
    
    await db.query(
      `UPDATE link_in_bio_pages SET views = views + 1 WHERE id=$1`,
      [pageId]
    );
    
    res.json({ ok: true });
  } catch (error) {
    console.error('trackPageView error:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
}

async function trackLinkClick(req, res) {
  try {
    const { linkId } = req.params;
    
    const visitorId = generateVisitorId(req);
    const userAgentData = parseUserAgent(req.headers['user-agent']);
    
    await db.query(
      `INSERT INTO bio_link_clicks (
        link_id, page_id, org_id, visitor_id, ip_address, user_agent, referer,
        device_type, os_name, browser_name
      ) SELECT $1, page_id, org_id, $2, $3, $4, $5, $6, $7, $8
        FROM bio_links WHERE id=$1`,
      [
        linkId, visitorId, req.ip, req.headers['user-agent'],
        req.headers.referer||null, userAgentData.device_type,
        userAgentData.os_name, userAgentData.browser_name
      ]
    );
    
    await db.query(
      `UPDATE bio_links SET clicks = clicks + 1 WHERE id=$1`,
      [linkId]
    );
    
    res.json({ ok: true });
  } catch (error) {
    console.error('trackLinkClick error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getStats,
  listPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  listLinks,
  createLink,
  updateLink,
  deleteLink,
  listThemes,
  createTheme,
  getPageAnalytics,
  getLinkAnalytics,
  trackPageView,
  trackLinkClick
};

// ================================================================================================
// PUBLIC ENDPOINTS (no auth required)
// ================================================================================================

async function getPublicPage(req, res) {
  try {
    const { slug } = req.params;
    
    // Get page by slug
    const { rows: pageRows } = await db.query(
      `SELECT p.*, t.name as theme_name
       FROM link_in_bio_pages p
       LEFT JOIN bio_themes t ON p.theme_id = t.id
       WHERE p.slug = $1 AND p.status = 'active'`,
      [slug]
    );

    if (!pageRows.length) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const page = pageRows[0];

    // Get active links for this page
    const { rows: linkRows } = await db.query(
      `SELECT bl.*, s.title as section_title
       FROM bio_links bl
       LEFT JOIN bio_link_sections s ON bl.section_id = s.id
       WHERE bl.page_id = $1 AND bl.is_active = true
       ORDER BY bl.is_priority DESC, bl.sort_order ASC, bl.created_at ASC`,
      [page.id]
    );

    res.json({ page, links: linkRows });
  } catch (error) {
    console.error('getPublicPage error:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
}

module.exports = {
  getStats,
  listPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  listLinks,
  createLink,
  updateLink,
  deleteLink,
  listThemes,
  createTheme,
  getPageAnalytics,
  getLinkAnalytics,
  trackPageView,
  trackLinkClick,
  getPublicPage
};
