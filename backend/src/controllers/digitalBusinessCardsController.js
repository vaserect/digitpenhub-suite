const db = require('../db');
const logger = require('../utils/logger');
const crypto = require('crypto');

// =====================================================
// CORE CARD MANAGEMENT
// =====================================================

/**
 * Get card statistics and overview
 */
async function getStats(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_cards,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_cards,
        COALESCE(SUM(total_views), 0) as total_views,
        COALESCE(SUM(unique_views), 0) as unique_views,
        COALESCE(SUM(total_shares), 0) as total_shares,
        COALESCE(SUM(vcf_downloads), 0) as total_downloads,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as created_last_7d,
        COUNT(CASE WHEN last_viewed_at > NOW() - INTERVAL '7 days' THEN 1 END) as viewed_last_7d
      FROM digital_business_cards 
      WHERE org_id = $1`,
      [req.user.orgId]
    );

    const { rows: topCards } = await db.query(
      `SELECT id, name, title, company, total_views, unique_views, vcf_downloads
      FROM digital_business_cards
      WHERE org_id = $1 AND status = 'active'
      ORDER BY total_views DESC
      LIMIT 5`,
      [req.user.orgId]
    );

    const { rows: recentContacts } = await db.query(
      `SELECT COUNT(*) as count
      FROM card_contacts
      WHERE org_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
      [req.user.orgId]
    );

    res.json({
      stats: rows[0],
      topCards,
      recentContacts: parseInt(recentContacts[0].count)
    });
  } catch (error) {
    logger.error('Error getting card stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
}

/**
 * List all cards with filtering and pagination
 */
async function listCards(req, res) {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      folder_id,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = ['org_id = $1'];
    const params = [req.user.orgId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      conditions.push(`(name ILIKE $${paramCount} OR company ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (folder_id) {
      paramCount++;
      conditions.push(`id IN (SELECT card_id FROM card_folder_items WHERE folder_id = $${paramCount})`);
      params.push(folder_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const validSortColumns = ['created_at', 'updated_at', 'name', 'total_views', 'unique_views'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { rows } = await db.query(
      `SELECT 
        c.*,
        t.name as template_name,
        u.email as creator_email
      FROM digital_business_cards c
      LEFT JOIN card_templates t ON c.template_id = t.id
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as total FROM digital_business_cards ${whereClause}`,
      params
    );

    res.json({
      cards: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countRows[0].total),
        pages: Math.ceil(countRows[0].total / limit)
      }
    });
  } catch (error) {
    logger.error('Error listing cards:', error);
    res.status(500).json({ error: 'Failed to list cards' });
  }
}

/**
 * Get single card details
 */
async function getCard(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT 
        c.*,
        t.name as template_name,
        u.email as creator_email
      FROM digital_business_cards c
      LEFT JOIN card_templates t ON c.template_id = t.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1 AND c.org_id = $2`,
      [id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get card sections and links
    const { rows: sections } = await db.query(
      `SELECT * FROM card_sections WHERE card_id = $1 ORDER BY sort_order`,
      [id]
    );

    const { rows: links } = await db.query(
      `SELECT * FROM card_links WHERE card_id = $1 ORDER BY sort_order`,
      [id]
    );

    res.json({
      card: rows[0],
      sections,
      links
    });
  } catch (error) {
    logger.error('Error getting card:', error);
    res.status(500).json({ error: 'Failed to get card' });
  }
}

/**
 * Create new card
 */
async function createCard(req, res) {
  try {
    const {
      name,
      title,
      company,
      department,
      email,
      phone,
      mobile,
      website,
      linkedin,
      twitter,
      facebook,
      instagram,
      address,
      city,
      state,
      country,
      bio,
      tagline,
      skills = [],
      avatar_url,
      cover_image_url,
      template_id,
      theme = 'modern',
      primary_color = '#2563eb',
      layout_style = 'standard',
      is_public = true,
      status = 'active',
      slug
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate unique share token and slug
    const share_token = crypto.randomBytes(16).toString('hex');
    let cardSlug = slug;
    if (!cardSlug?.trim()) {
      cardSlug = name.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-') + '-' + crypto.randomBytes(3).toString('hex');
    } else {
      cardSlug = cardSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-');
    }

    const { rows } = await db.query(
      `INSERT INTO digital_business_cards (
        org_id, user_id, name, title, company, department,
        email, phone, mobile, website,
        linkedin, twitter, facebook, instagram,
        address, city, state, country,
        bio, tagline, skills,
        avatar_url, cover_image_url,
        template_id, theme, primary_color, layout_style,
        is_public, share_token, status, slug
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26,
        $27, $28, $29, $30, $31
      ) RETURNING *`,
      [
        req.user.orgId, req.user.id, name.trim(), title, company, department,
        email, phone, mobile, website,
        linkedin, twitter, facebook, instagram,
        address, city, state, country,
        bio, tagline, skills,
        avatar_url, cover_image_url,
        template_id, theme, primary_color, layout_style,
        is_public, share_token, status, cardSlug
      ]
    );

    logger.info(`Card created: ${rows[0].id} by user ${req.user.id}`);
    res.status(201).json({ card: rows[0] });
  } catch (error) {
    logger.error('Error creating card:', error);
    res.status(500).json({ error: 'Failed to create card' });
  }
}

/**
 * Update card
 */
async function updateCard(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'name', 'title', 'company', 'department', 'email', 'phone', 'mobile',
      'website', 'linkedin', 'twitter', 'facebook', 'instagram',
      'address', 'city', 'state', 'country', 'bio', 'tagline', 'skills',
      'avatar_url', 'cover_image_url', 'template_id', 'theme',
      'primary_color', 'secondary_color', 'background_color', 'text_color',
      'layout_style', 'is_public', 'status', 'slug'
    ];

    const setClause = [];
    const params = [id, req.user.orgId];
    let paramCount = 2;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        paramCount++;
        setClause.push(`${key} = $${paramCount}`);
        params.push(updates[key]);
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { rows } = await db.query(
      `UPDATE digital_business_cards 
      SET ${setClause.join(', ')}
      WHERE id = $1 AND org_id = $2
      RETURNING *`,
      params
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Card not found' });
    }

    logger.info(`Card updated: ${id} by user ${req.user.id}`);
    res.json({ card: rows[0] });
  } catch (error) {
    logger.error('Error updating card:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
}

/**
 * Delete card
 */
async function deleteCard(req, res) {
  try {
    const { id } = req.params;

    const { rowCount } = await db.query(
      `DELETE FROM digital_business_cards WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    logger.info(`Card deleted: ${id} by user ${req.user.id}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting card:', error);
    res.status(500).json({ error: 'Failed to delete card' });
  }
}

// =====================================================
// SECTIONS & LINKS
// =====================================================

/**
 * Add section to card
 */
async function addSection(req, res) {
  try {
    const { id } = req.params;
    const { title, section_type, icon, sort_order = 0, config = {} } = req.body;

    if (!title || !section_type) {
      return res.status(400).json({ error: 'Title and section type are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO card_sections (card_id, title, section_type, icon, sort_order, config)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [id, title, section_type, icon, sort_order, config]
    );

    res.status(201).json({ section: rows[0] });
  } catch (error) {
    logger.error('Error adding section:', error);
    res.status(500).json({ error: 'Failed to add section' });
  }
}

/**
 * Add link to card
 */
async function addLink(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      url,
      description,
      icon,
      link_type = 'url',
      section_id,
      sort_order = 0
    } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO card_links (
        card_id, section_id, title, url, description, icon, link_type, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [id, section_id, title, url, description, icon, link_type, sort_order]
    );

    res.status(201).json({ link: rows[0] });
  } catch (error) {
    logger.error('Error adding link:', error);
    res.status(500).json({ error: 'Failed to add link' });
  }
}

/**
 * Update link
 */
async function updateLink(req, res) {
  try {
    const { linkId } = req.params;
    const { title, url, description, icon, is_active, sort_order } = req.body;

    const { rows } = await db.query(
      `UPDATE card_links
      SET title = COALESCE($2, title),
          url = COALESCE($3, url),
          description = COALESCE($4, description),
          icon = COALESCE($5, icon),
          is_active = COALESCE($6, is_active),
          sort_order = COALESCE($7, sort_order)
      WHERE id = $1
      RETURNING *`,
      [linkId, title, url, description, icon, is_active, sort_order]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ link: rows[0] });
  } catch (error) {
    logger.error('Error updating link:', error);
    res.status(500).json({ error: 'Failed to update link' });
  }
}

/**
 * Delete link
 */
async function deleteLink(req, res) {
  try {
    const { linkId } = req.params;

    await db.query(`DELETE FROM card_links WHERE id = $1`, [linkId]);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting link:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
}

/**
 * Track link click
 */
async function trackLinkClick(req, res) {
  try {
    const { linkId } = req.params;

    await db.query(
      `UPDATE card_links 
      SET clicks = clicks + 1, last_clicked_at = NOW()
      WHERE id = $1`,
      [linkId]
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Error tracking link click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
}

// =====================================================
// TEMPLATES
// =====================================================

/**
 * List templates
 */
async function listTemplates(req, res) {
  try {
    const { category, is_global } = req.query;

    const conditions = ['(org_id = $1 OR is_global = true)'];
    const params = [req.user.orgId];
    let paramCount = 1;

    if (category) {
      paramCount++;
      conditions.push(`category = $${paramCount}`);
      params.push(category);
    }

    if (is_global !== undefined) {
      paramCount++;
      conditions.push(`is_global = $${paramCount}`);
      params.push(is_global === 'true');
    }

    const { rows } = await db.query(
      `SELECT * FROM card_templates
      WHERE ${conditions.join(' AND ')}
      ORDER BY is_global DESC, usage_count DESC, name`,
      params
    );

    res.json({ templates: rows });
  } catch (error) {
    logger.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
}

// =====================================================
// ANALYTICS
// =====================================================

/**
 * Get card analytics
 */
async function getAnalytics(req, res) {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    const intervals = {
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days'
    };

    const interval = intervals[period] || '7 days';

    // Get view statistics
    const { rows: viewStats } = await db.query(
      `SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT DATE(viewed_at)) as active_days
      FROM card_view_events
      WHERE card_id = $1 AND viewed_at > NOW() - INTERVAL '${interval}'`,
      [id]
    );

    // Get geographic breakdown
    const { rows: geoData } = await db.query(
      `SELECT country, COUNT(*) as views
      FROM card_view_events
      WHERE card_id = $1 AND viewed_at > NOW() - INTERVAL '${interval}'
      GROUP BY country
      ORDER BY views DESC
      LIMIT 10`,
      [id]
    );

    // Get device breakdown
    const { rows: deviceData } = await db.query(
      `SELECT device_type, COUNT(*) as views
      FROM card_view_events
      WHERE card_id = $1 AND viewed_at > NOW() - INTERVAL '${interval}'
      GROUP BY device_type
      ORDER BY views DESC`,
      [id]
    );

    // Get daily trend
    const { rows: dailyTrend } = await db.query(
      `SELECT 
        DATE(viewed_at) as date,
        COUNT(*) as views,
        COUNT(DISTINCT visitor_id) as unique_visitors
      FROM card_view_events
      WHERE card_id = $1 AND viewed_at > NOW() - INTERVAL '${interval}'
      GROUP BY DATE(viewed_at)
      ORDER BY date`,
      [id]
    );

    // Get link performance
    const { rows: linkPerformance } = await db.query(
      `SELECT title, clicks, last_clicked_at
      FROM card_links
      WHERE card_id = $1 AND is_active = true
      ORDER BY clicks DESC
      LIMIT 10`,
      [id]
    );

    res.json({
      summary: viewStats[0],
      geographic: geoData,
      devices: deviceData,
      trend: dailyTrend,
      linkPerformance
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
}

/**
 * Track card view
 */
async function trackView(req, res) {
  try {
    const { id } = req.params;
    const { visitor_id, session_id, view_source } = req.body;

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];
    const referer = req.headers['referer'];

    await db.query(
      `INSERT INTO card_view_events (
        card_id, org_id, visitor_id, session_id,
        ip_address, user_agent, referer, view_source
      )
      SELECT $1, org_id, $2, $3, $4, $5, $6, $7
      FROM digital_business_cards
      WHERE id = $1`,
      [id, visitor_id, session_id, ip_address, user_agent, referer, view_source]
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Error tracking view:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
}

/**
 * Increment view counter (legacy support)
 */
async function incrementView(req, res) {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE digital_business_cards SET total_views = total_views + 1 WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Error incrementing view:', error);
    res.status(500).json({ error: 'Failed to increment view' });
  }
}

// =====================================================
// CONTACTS & LEADS
// =====================================================

/**
 * List contacts
 */
async function listContacts(req, res) {
  try {
    const { card_id, status } = req.query;

    const conditions = ['org_id = $1'];
    const params = [req.user.orgId];
    let paramCount = 1;

    if (card_id) {
      paramCount++;
      conditions.push(`card_id = $${paramCount}`);
      params.push(card_id);
    }

    if (status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      params.push(status);
    }

    const { rows } = await db.query(
      `SELECT 
        cc.*,
        c.name as card_name
      FROM card_contacts cc
      LEFT JOIN digital_business_cards c ON cc.card_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY cc.created_at DESC`,
      params
    );

    res.json({ contacts: rows });
  } catch (error) {
    logger.error('Error listing contacts:', error);
    res.status(500).json({ error: 'Failed to list contacts' });
  }
}

/**
 * Add contact
 */
async function addContact(req, res) {
  try {
    const { card_id, name, email, phone, company, source, notes, tags = [] } = req.body;

    if (!card_id) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    const { rows } = await db.query(
      `INSERT INTO card_contacts (
        card_id, org_id, name, email, phone, company, source, notes, tags
      )
      SELECT $1, org_id, $2, $3, $4, $5, $6, $7, $8
      FROM digital_business_cards
      WHERE id = $1
      RETURNING *`,
      [card_id, name, email, phone, company, source, notes, tags]
    );

    if (rows.length) {
      const contact = rows[0];
      const orgId = contact.org_id;
      // Sync with the core platform contacts/CRM system
      if (email && email.trim()) {
        const trimmedEmail = email.trim();
        const contactCheck = await db.query(
          `SELECT id FROM contacts WHERE org_id = $1 AND email = $2`,
          [orgId, trimmedEmail]
        );
        if (!contactCheck.rows.length) {
          await db.query(
            `INSERT INTO contacts (org_id, full_name, email, phone, company, stage, tags)
             VALUES ($1, $2, $3, $4, $5, 'lead', $6)`,
            [orgId, name || 'Contact from Biz Card', trimmedEmail, phone || null, company || null, ['biz-card']]
          );
        }
      }
    }

    res.status(201).json({ contact: rows[0] });
  } catch (error) {
    logger.error('Error adding contact:', error);
    res.status(500).json({ error: 'Failed to add contact' });
  }
}

// =====================================================
// FOLDERS
// =====================================================

/**
 * List folders
 */
async function listFolders(req, res) {
  try {
    const { parent_id } = req.query;

    const { rows } = await db.query(
      `SELECT 
        f.*,
        COUNT(fi.card_id) as card_count
      FROM card_folders f
      LEFT JOIN card_folder_items fi ON f.id = fi.folder_id
      WHERE f.org_id = $1 AND ($2::BIGINT IS NULL OR f.parent_id = $2)
      GROUP BY f.id
      ORDER BY f.name`,
      [req.user.orgId, parent_id || null]
    );

    res.json({ folders: rows });
  } catch (error) {
    logger.error('Error listing folders:', error);
    res.status(500).json({ error: 'Failed to list folders' });
  }
}

/**
 * Create folder
 */
async function createFolder(req, res) {
  try {
    const { name, description, parent_id, color, icon } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const { rows } = await db.query(
      `INSERT INTO card_folders (org_id, parent_id, name, description, color, icon)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [req.user.orgId, parent_id || null, name.trim(), description, color, icon]
    );

    res.status(201).json({ folder: rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Folder with this name already exists' });
    }
    logger.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
}

// =====================================================
// PUBLIC ENDPOINTS (No Auth Required)
// =====================================================

/**
 * Get public card (no authentication required)
 */
async function getPublicCard(req, res) {
  try {
    const { id } = req.params;

    // Check if ID is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const { rows } = await db.query(
      `SELECT * FROM digital_business_cards 
      WHERE id = $1 AND status = 'active' AND is_public = true`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const card = rows[0];

    // Get sections and links
    const { rows: sections } = await db.query(
      `SELECT * FROM card_sections WHERE card_id = $1 AND is_visible = true ORDER BY sort_order`,
      [id]
    );

    const { rows: links } = await db.query(
      `SELECT * FROM card_links WHERE card_id = $1 AND is_active = true ORDER BY sort_order`,
      [id]
    );

    // Track view (fire and forget)
    const visitor_id = req.cookies?.visitor_id || `visitor_${Date.now()}`;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];

    db.query(
      `INSERT INTO card_view_events (
        card_id, org_id, visitor_id, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5)`,
      [id, card.org_id, visitor_id, ip_address, user_agent]
    ).catch(err => logger.error('Failed to track card view:', err));

    res.json({
      card,
      sections,
      links
    });
  } catch (error) {
    logger.error('Error getting public card:', error);
    res.status(500).json({ error: 'Failed to get card' });
  }
}

/**
 * Get card by slug (public)
 */
async function getCardBySlug(req, res) {
  try {
    const { slug } = req.params;

    const { rows } = await db.query(
      `SELECT * FROM digital_business_cards 
      WHERE slug = $1 AND status = 'active' AND is_public = true`,
      [slug]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const card = rows[0];

    // Get sections and links
    const { rows: sections } = await db.query(
      `SELECT * FROM card_sections WHERE card_id = $1 AND is_visible = true ORDER BY sort_order`,
      [card.id]
    );

    const { rows: links } = await db.query(
      `SELECT * FROM card_links WHERE card_id = $1 AND is_active = true ORDER BY sort_order`,
      [card.id]
    );

    // Track view
    const visitor_id = req.cookies?.visitor_id || `visitor_${Date.now()}`;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];

    db.query(
      `INSERT INTO card_view_events (
        card_id, org_id, visitor_id, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5)`,
      [card.id, card.org_id, visitor_id, ip_address, user_agent]
    ).catch(err => logger.error('Failed to track card view:', err));

    res.json({
      card,
      sections,
      links
    });
  } catch (error) {
    logger.error('Error getting card by slug:', error);
    res.status(500).json({ error: 'Failed to get card' });
  }
}

module.exports = {
  // Core
  getStats,
  listCards,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  
  // Sections & Links
  addSection,
  addLink,
  updateLink,
  deleteLink,
  trackLinkClick,
  
  // Templates
  listTemplates,
  
  // Analytics
  getAnalytics,
  trackView,
  incrementView,
  
  // Contacts
  listContacts,
  addContact,
  
  // Folders
  listFolders,
  createFolder,
  
  // Public
  getPublicCard,
  getCardBySlug
};