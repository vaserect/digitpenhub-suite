const db = require('../../db');

class ContentCalendarService {
  // Content Items CRUD
  async createContent(orgId, data) {
    const {
      campaignId, title, contentType, channel, status = 'draft',
      contentBody, excerpt, mediaUrls = [], seoTitle, seoDescription,
      keywords = [], hashtags = [], targetUrl, assignedTo, scheduledAt,
      notes, priority = 'medium'
    } = data;

    const { rows } = await db.query(
      `INSERT INTO content_items (
        org_id, campaign_id, title, content_type, channel, status,
        content_body, excerpt, media_urls, seo_title, seo_description,
        keywords, hashtags, target_url, assigned_to, scheduled_at, notes, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        orgId, campaignId, title, contentType, channel, status,
        contentBody, excerpt, JSON.stringify(mediaUrls), seoTitle, seoDescription,
        keywords, hashtags, targetUrl, assignedTo, scheduledAt, notes, priority
      ]
    );

    return rows[0];
  }

  async getContent(orgId, filters = {}) {
    const {
      status, contentType, campaignId, assignedTo, dateFrom, dateTo,
      page = 1, limit = 20
    } = filters;

    let query = `SELECT ci.*, cc.name as campaign_name, u.name as assigned_to_name
                 FROM content_items ci
                 LEFT JOIN content_campaigns cc ON ci.campaign_id = cc.id
                 LEFT JOIN users u ON ci.assigned_to = u.id
                 WHERE ci.org_id = $1`;
    const params = [orgId];
    let paramIndex = 2;

    if (status) {
      query += ` AND ci.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (contentType) {
      query += ` AND ci.content_type = $${paramIndex}`;
      params.push(contentType);
      paramIndex++;
    }

    if (campaignId) {
      query += ` AND ci.campaign_id = $${paramIndex}`;
      params.push(campaignId);
      paramIndex++;
    }

    if (assignedTo) {
      query += ` AND ci.assigned_to = $${paramIndex}`;
      params.push(assignedTo);
      paramIndex++;
    }

    if (dateFrom) {
      query += ` AND ci.scheduled_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND ci.scheduled_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    query += ` ORDER BY ci.scheduled_at DESC NULLS LAST, ci.created_at DESC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const { rows } = await db.query(query, params);
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as total FROM content_items WHERE org_id = $1`,
      [orgId]
    );

    return {
      items: rows,
      total: parseInt(countRows[0].total),
      page: parseInt(page),
      limit: parseInt(limit)
    };
  }

  async updateContent(orgId, contentId, data) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fields = {
      campaign_id: data.campaignId,
      title: data.title,
      content_type: data.contentType,
      channel: data.channel,
      status: data.status,
      content_body: data.contentBody,
      excerpt: data.excerpt,
      media_urls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : undefined,
      seo_title: data.seoTitle,
      seo_description: data.seoDescription,
      keywords: data.keywords,
      hashtags: data.hashtags,
      target_url: data.targetUrl,
      assigned_to: data.assignedTo,
      reviewed_by: data.reviewedBy,
      published_by: data.publishedBy,
      scheduled_at: data.scheduledAt,
      published_at: data.publishedAt,
      notes: data.notes,
      priority: data.priority
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(contentId, orgId);

    const { rows } = await db.query(
      `UPDATE content_items SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (rows.length === 0) {
      throw new Error('Content not found');
    }

    return rows[0];
  }

  async deleteContent(orgId, contentId) {
    await db.query(
      `DELETE FROM content_items WHERE id = $1 AND org_id = $2`,
      [contentId, orgId]
    );
  }

  // Campaigns
  async createCampaign(orgId, data) {
    const { name, description, color = '#3b82f6', startDate, endDate, goals, budget } = data;

    const { rows } = await db.query(
      `INSERT INTO content_campaigns (org_id, name, description, color, start_date, end_date, goals, budget)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [orgId, name, description, color, startDate, endDate, goals, budget]
    );

    return rows[0];
  }

  async getCampaigns(orgId, status) {
    let query = `SELECT * FROM content_campaigns WHERE org_id = $1`;
    const params = [orgId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  async updateCampaign(orgId, campaignId, data) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fields = {
      name: data.name,
      description: data.description,
      color: data.color,
      start_date: data.startDate,
      end_date: data.endDate,
      goals: data.goals,
      budget: data.budget,
      status: data.status
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(campaignId, orgId);

    const { rows } = await db.query(
      `UPDATE content_campaigns SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (rows.length === 0) {
      throw new Error('Campaign not found');
    }

    return rows[0];
  }

  // Templates
  async createTemplate(orgId, userId, data) {
    const { name, contentType, templateBody, defaultHashtags = [], defaultSettings = {} } = data;

    const { rows } = await db.query(
      `INSERT INTO content_templates (org_id, name, content_type, template_body, default_hashtags, default_settings, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [orgId, name, contentType, templateBody, defaultHashtags, JSON.stringify(defaultSettings), userId]
    );

    return rows[0];
  }

  async getTemplates(orgId, contentType) {
    let query = `SELECT * FROM content_templates WHERE org_id = $1`;
    const params = [orgId];

    if (contentType) {
      query += ` AND content_type = $2`;
      params.push(contentType);
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  // Approvals
  async requestApproval(contentId, approverId) {
    const { rows } = await db.query(
      `INSERT INTO content_approvals (content_id, approver_id, status)
       VALUES ($1, $2, 'pending') RETURNING *`,
      [contentId, approverId]
    );

    return rows[0];
  }

  async updateApproval(approvalId, approverId, status, comments) {
    const { rows } = await db.query(
      `UPDATE content_approvals
       SET status = $1, comments = $2, approved_at = NOW()
       WHERE id = $3 AND approver_id = $4
       RETURNING *`,
      [status, comments, approvalId, approverId]
    );

    if (rows.length === 0) {
      throw new Error('Approval not found');
    }

    // Update content status if approved
    if (status === 'approved') {
      await db.query(
        `UPDATE content_items SET status = 'approved', reviewed_by = $1
         WHERE id = (SELECT content_id FROM content_approvals WHERE id = $2)`,
        [approverId, approvalId]
      );
    }

    return rows[0];
  }

  async getPendingApprovals(approverId) {
    const { rows } = await db.query(
      `SELECT ca.*, ci.title, ci.content_type, ci.scheduled_at
       FROM content_approvals ca
       JOIN content_items ci ON ca.content_id = ci.id
       WHERE ca.approver_id = $1 AND ca.status = 'pending'
       ORDER BY ca.created_at DESC`,
      [approverId]
    );

    return rows;
  }

  // Comments
  async addComment(contentId, userId, commentText, mentions = []) {
    const { rows } = await db.query(
      `INSERT INTO content_comments (content_id, user_id, comment_text, mentions)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [contentId, userId, commentText, mentions]
    );

    return rows[0];
  }

  async getComments(contentId) {
    const { rows } = await db.query(
      `SELECT cc.*, u.name as user_name
       FROM content_comments cc
       JOIN users u ON cc.user_id = u.id
       WHERE cc.content_id = $1
       ORDER BY cc.created_at ASC`,
      [contentId]
    );

    return rows;
  }

  // Publishing Connections
  async saveConnection(orgId, platform, accountName, credentials) {
    const { rows } = await db.query(
      `INSERT INTO publishing_connections (org_id, platform, account_name, credentials_encrypted, status)
       VALUES ($1, $2, $3, $4, 'connected')
       ON CONFLICT (org_id, platform, account_name)
       DO UPDATE SET credentials_encrypted = $4, status = 'connected', updated_at = NOW()
       RETURNING *`,
      [orgId, platform, accountName, credentials]
    );

    return rows[0];
  }

  async getConnections(orgId) {
    const { rows } = await db.query(
      `SELECT id, org_id, platform, account_name, status, last_sync_at, created_at
       FROM publishing_connections
       WHERE org_id = $1
       ORDER BY platform, account_name`,
      [orgId]
    );

    return rows;
  }

  // Calendar view data
  async getCalendarData(orgId, startDate, endDate) {
    const { rows } = await db.query(
      `SELECT ci.*, cc.name as campaign_name, cc.color as campaign_color
       FROM content_items ci
       LEFT JOIN content_campaigns cc ON ci.campaign_id = cc.id
       WHERE ci.org_id = $1
       AND ci.scheduled_at >= $2
       AND ci.scheduled_at <= $3
       ORDER BY ci.scheduled_at`,
      [orgId, startDate, endDate]
    );

    return rows;
  }
}

module.exports = new ContentCalendarService();
