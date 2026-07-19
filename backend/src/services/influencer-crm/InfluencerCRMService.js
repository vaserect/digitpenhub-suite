const db = require('../../db');

class InfluencerCRMService {
  // Influencer CRUD
  async createInfluencer(orgId, data) {
    const {
      name, email, phone, bio, profileImageUrl, tier, niche, location,
      status = 'prospect', rating, notes, tags = []
    } = data;

    const { rows } = await db.query(
      `INSERT INTO influencers (
        org_id, name, email, phone, bio, profile_image_url, tier, niche,
        location, status, rating, notes, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [orgId, name, email, phone, bio, profileImageUrl, tier, niche, location, status, rating, notes, tags]
    );

    return rows[0];
  }

  async getInfluencers(orgId, filters = {}) {
    const { status, tier, niche, isFavorite, page = 1, limit = 20 } = filters;
    let query = `SELECT i.*, 
                 COUNT(DISTINCT ica.id) as campaign_count,
                 COUNT(DISTINCT isa.id) as social_account_count
                 FROM influencers i
                 LEFT JOIN influencer_campaign_assignments ica ON i.id = ica.influencer_id
                 LEFT JOIN influencer_social_accounts isa ON i.id = isa.influencer_id
                 WHERE i.org_id = $1`;
    const params = [orgId];
    let paramIndex = 2;

    if (status) {
      query += ` AND i.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (tier) {
      query += ` AND i.tier = $${paramIndex}`;
      params.push(tier);
      paramIndex++;
    }

    if (niche) {
      query += ` AND i.niche = $${paramIndex}`;
      params.push(niche);
      paramIndex++;
    }

    if (isFavorite) {
      query += ` AND i.is_favorite = true`;
    }

    query += ` GROUP BY i.id ORDER BY i.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const { rows } = await db.query(query, params);
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as total FROM influencers WHERE org_id = $1`,
      [orgId]
    );

    return {
      influencers: rows,
      total: parseInt(countRows[0].total),
      page: parseInt(page),
      limit: parseInt(limit)
    };
  }

  async updateInfluencer(orgId, influencerId, data) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fields = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      bio: data.bio,
      profile_image_url: data.profileImageUrl,
      tier: data.tier,
      niche: data.niche,
      location: data.location,
      status: data.status,
      rating: data.rating,
      notes: data.notes,
      tags: data.tags,
      is_favorite: data.isFavorite
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) throw new Error('No fields to update');

    updates.push(`updated_at = NOW()`);
    values.push(influencerId, orgId);

    const { rows } = await db.query(
      `UPDATE influencers SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (rows.length === 0) throw new Error('Influencer not found');
    return rows[0];
  }

  // Social Accounts
  async addSocialAccount(influencerId, data) {
    const { platform, handle, profileUrl, followers, engagementRate } = data;

    const { rows } = await db.query(
      `INSERT INTO influencer_social_accounts (
        influencer_id, platform, handle, profile_url, followers, engagement_rate
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (influencer_id, platform, handle)
      DO UPDATE SET followers = $5, engagement_rate = $6, last_updated = NOW()
      RETURNING *`,
      [influencerId, platform, handle, profileUrl, followers, engagementRate]
    );

    return rows[0];
  }

  async getSocialAccounts(influencerId) {
    const { rows } = await db.query(
      `SELECT * FROM influencer_social_accounts WHERE influencer_id = $1 ORDER BY platform`,
      [influencerId]
    );
    return rows;
  }

  // Campaigns
  async createCampaign(orgId, data) {
    const { name, description, startDate, endDate, budget, goals } = data;

    const { rows } = await db.query(
      `INSERT INTO influencer_campaigns (org_id, name, description, start_date, end_date, budget, goals)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [orgId, name, description, startDate, endDate, budget, goals]
    );

    return rows[0];
  }

  async getCampaigns(orgId, status) {
    let query = `SELECT c.*, COUNT(DISTINCT ica.influencer_id) as influencer_count
                 FROM influencer_campaigns c
                 LEFT JOIN influencer_campaign_assignments ica ON c.id = ica.campaign_id
                 WHERE c.org_id = $1`;
    const params = [orgId];

    if (status) {
      query += ` AND c.status = $2`;
      params.push(status);
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  // Campaign Assignments
  async assignInfluencer(campaignId, influencerId, data) {
    const { compensationAmount, compensationType, notes } = data;

    const { rows } = await db.query(
      `INSERT INTO influencer_campaign_assignments (
        campaign_id, influencer_id, compensation_amount, compensation_type, notes
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (campaign_id, influencer_id)
      DO UPDATE SET compensation_amount = $3, compensation_type = $4, notes = $5, updated_at = NOW()
      RETURNING *`,
      [campaignId, influencerId, compensationAmount, compensationType, notes]
    );

    return rows[0];
  }

  async getCampaignInfluencers(campaignId) {
    const { rows } = await db.query(
      `SELECT ica.*, i.name, i.email, i.tier, i.profile_image_url
       FROM influencer_campaign_assignments ica
       JOIN influencers i ON ica.influencer_id = i.id
       WHERE ica.campaign_id = $1
       ORDER BY ica.created_at DESC`,
      [campaignId]
    );
    return rows;
  }

  // Deliverables
  async createDeliverable(assignmentId, data) {
    const { deliverableType, platform, dueDate, notes } = data;

    const { rows } = await db.query(
      `INSERT INTO campaign_deliverables (assignment_id, deliverable_type, platform, due_date, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [assignmentId, deliverableType, platform, dueDate, notes]
    );

    return rows[0];
  }

  async updateDeliverableStatus(deliverableId, status, contentUrl) {
    const { rows } = await db.query(
      `UPDATE campaign_deliverables
       SET status = $1, content_url = $2, 
           submitted_at = CASE WHEN $1 = 'submitted' THEN NOW() ELSE submitted_at END,
           approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END
       WHERE id = $3
       RETURNING *`,
      [status, contentUrl, deliverableId]
    );

    return rows[0];
  }

  // Content
  async addContent(orgId, data) {
    const {
      influencerId, campaignId, deliverableId, contentType, platform,
      contentUrl, thumbnailUrl, caption, postedAt, likes, comments, shares, views
    } = data;

    const { rows } = await db.query(
      `INSERT INTO influencer_content (
        org_id, influencer_id, campaign_id, deliverable_id, content_type, platform,
        content_url, thumbnail_url, caption, posted_at, likes, comments, shares, views
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [orgId, influencerId, campaignId, deliverableId, contentType, platform,
       contentUrl, thumbnailUrl, caption, postedAt, likes, comments, shares, views]
    );

    return rows[0];
  }

  async getContent(orgId, filters = {}) {
    const { influencerId, campaignId, page = 1, limit = 20 } = filters;
    let query = `SELECT ic.*, i.name as influencer_name
                 FROM influencer_content ic
                 LEFT JOIN influencers i ON ic.influencer_id = i.id
                 WHERE ic.org_id = $1`;
    const params = [orgId];
    let paramIndex = 2;

    if (influencerId) {
      query += ` AND ic.influencer_id = $${paramIndex}`;
      params.push(influencerId);
      paramIndex++;
    }

    if (campaignId) {
      query += ` AND ic.campaign_id = $${paramIndex}`;
      params.push(campaignId);
      paramIndex++;
    }

    query += ` ORDER BY ic.posted_at DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const { rows } = await db.query(query, params);
    return rows;
  }

  // Payments
  async createPayment(orgId, data) {
    const { influencerId, campaignId, assignmentId, amount, dueDate, notes } = data;

    const { rows } = await db.query(
      `INSERT INTO influencer_payments (org_id, influencer_id, campaign_id, assignment_id, amount, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [orgId, influencerId, campaignId, assignmentId, amount, dueDate, notes]
    );

    return rows[0];
  }

  async getPayments(orgId, filters = {}) {
    const { status, influencerId, page = 1, limit = 20 } = filters;
    let query = `SELECT ip.*, i.name as influencer_name, ic.name as campaign_name
                 FROM influencer_payments ip
                 JOIN influencers i ON ip.influencer_id = i.id
                 LEFT JOIN influencer_campaigns ic ON ip.campaign_id = ic.id
                 WHERE ip.org_id = $1`;
    const params = [orgId];
    let paramIndex = 2;

    if (status) {
      query += ` AND ip.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (influencerId) {
      query += ` AND ip.influencer_id = $${paramIndex}`;
      params.push(influencerId);
      paramIndex++;
    }

    query += ` ORDER BY ip.due_date DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const { rows } = await db.query(query, params);
    return rows;
  }

  async updatePaymentStatus(paymentId, status) {
    const { rows } = await db.query(
      `UPDATE influencer_payments
       SET status = $1, paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, paymentId]
    );

    return rows[0];
  }

  // Communications
  async logCommunication(orgId, influencerId, userId, data) {
    const { communicationType, subject, message, direction } = data;

    const { rows } = await db.query(
      `INSERT INTO influencer_communications (org_id, influencer_id, user_id, communication_type, subject, message, direction)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [orgId, influencerId, userId, communicationType, subject, message, direction]
    );

    return rows[0];
  }

  async getCommunications(influencerId) {
    const { rows } = await db.query(
      `SELECT ic.*, u.name as user_name
       FROM influencer_communications ic
       LEFT JOIN users u ON ic.user_id = u.id
       WHERE ic.influencer_id = $1
       ORDER BY ic.created_at DESC`,
      [influencerId]
    );
    return rows;
  }

  // Analytics
  async getCampaignAnalytics(campaignId) {
    const { rows } = await db.query(
      `SELECT 
        COUNT(DISTINCT ica.influencer_id) as total_influencers,
        SUM(ica.compensation_amount) as total_compensation,
        COUNT(DISTINCT cd.id) as total_deliverables,
        COUNT(DISTINCT CASE WHEN cd.status = 'published' THEN cd.id END) as published_deliverables,
        SUM(ic.likes) as total_likes,
        SUM(ic.comments) as total_comments,
        SUM(ic.shares) as total_shares,
        SUM(ic.views) as total_views
       FROM influencer_campaign_assignments ica
       LEFT JOIN campaign_deliverables cd ON ica.id = cd.assignment_id
       LEFT JOIN influencer_content ic ON cd.id = ic.deliverable_id
       WHERE ica.campaign_id = $1`,
      [campaignId]
    );

    return rows[0];
  }
}

module.exports = new InfluencerCRMService();
