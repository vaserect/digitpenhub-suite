/**
 * Review Management Controller
 * 
 * Implements business reviews inbox, gating settings, analytics,
 * email/SMS requests distribution, and public feedback routing.
 */

const db = require('../db');
const { sendMail } = require('../utils/mailer');
const { sendSms } = require('../utils/messagingProviders');

// List reviews with pagination, sorting, search, rating filters, source filters
async function listReviews(req, res) {
  try {
    const orgId = req.user.orgId;
    const { page = 1, limit = 10, rating, platform, source, search, status = 'active', hasReply } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['r.org_id = $1'];
    const values = [orgId];
    let idx = 2;

    if (status) {
      conditions.push(`r.status = $${idx}`);
      values.push(status);
      idx++;
    }

    if (rating) {
      conditions.push(`r.rating = $${idx}`);
      values.push(parseInt(rating));
      idx++;
    }

    if (platform) {
      conditions.push(`r.source_platform = $${idx}`);
      values.push(platform);
      idx++;
    }

    if (hasReply !== undefined) {
      if (hasReply === 'true') {
        conditions.push(`r.reply_content IS NOT NULL`);
      } else if (hasReply === 'false') {
        conditions.push(`r.reply_content IS NULL`);
      }
    }

    if (search) {
      conditions.push(`(r.reviewer_name ILIKE $${idx} OR r.content ILIKE $${idx} OR r.title ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    // Get items
    const query = `
      SELECT r.*, c.first_name AS contact_first_name, c.last_name AS contact_last_name
      FROM business_reviews r
      LEFT JOIN contacts c ON c.id = r.contact_id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const countQuery = `
      SELECT count(*)::int AS total
      FROM business_reviews r
      WHERE ${whereClause}
    `;

    const [itemsRes, countRes] = await Promise.all([
      db.query(query, [...values, parseInt(limit), offset]),
      db.query(countQuery, values)
    ]);

    res.json({
      reviews: itemsRes.rows,
      total: countRes.rows[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('[reviewsController.listReviews] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
}

// Get reviews analytics metrics
async function getStats(req, res) {
  try {
    const orgId = req.user.orgId;

    const totalRes = await db.query(
      `SELECT count(*)::int AS total,
              round(coalesce(avg(rating), 0), 1)::float AS average_rating,
              count(CASE WHEN reply_content IS NOT NULL THEN 1 END)::int AS replied_count
       FROM business_reviews
       WHERE org_id = $1 AND status = 'active'`,
      [orgId]
    );

    const breakdownRes = await db.query(
      `SELECT rating, count(*)::int AS count
       FROM business_reviews
       WHERE org_id = $1 AND status = 'active'
       GROUP BY rating`,
      [orgId]
    );

    const sourceRes = await db.query(
      `SELECT source_platform, count(*)::int AS count
       FROM business_reviews
       WHERE org_id = $1 AND status = 'active'
       GROUP BY source_platform`,
      [orgId]
    );

    const stats = totalRes.rows[0];
    const total = stats.total || 0;
    const responseRate = total > 0 ? Math.round((stats.replied_count / total) * 1000) / 10 : 0;

    // Fill rating counts
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdownRes.rows.forEach(r => {
      ratingBreakdown[r.rating] = r.count;
    });

    // Source stats mapping
    const platformBreakdown = {};
    sourceRes.rows.forEach(s => {
      platformBreakdown[s.source_platform] = s.count;
    });

    res.json({
      stats: {
        totalReviews: total,
        averageRating: stats.average_rating || 0,
        repliedCount: stats.replied_count || 0,
        responseRate
      },
      ratingBreakdown,
      platformBreakdown
    });
  } catch (err) {
    console.error('[reviewsController.getStats] Error:', err);
    res.status(500).json({ error: 'Failed to calculate reviews statistics.' });
  }
}

// Get gating and integrations settings
async function getSettings(req, res) {
  try {
    const orgId = req.user.orgId;
    let settingsRes = await db.query('SELECT * FROM review_settings WHERE org_id = $1', [orgId]);
    
    if (!settingsRes.rows.length) {
      settingsRes = await db.query(
        `INSERT INTO review_settings (org_id) VALUES ($1) RETURNING *`,
        [orgId]
      );
    }
    
    res.json({ settings: settingsRes.rows[0] });
  } catch (err) {
    console.error('[reviewsController.getSettings] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
}

// Update review management settings
async function updateSettings(req, res) {
  try {
    const orgId = req.user.orgId;
    const {
      gatingEnabled,
      gatingThresholdStars,
      googleReviewUrl,
      facebookReviewUrl,
      yelpReviewUrl,
      trustpilotReviewUrl,
      requestEmailSubject,
      requestEmailTemplate,
      requestSmsTemplate
    } = req.body;

    const { rows } = await db.query(
      `INSERT INTO review_settings 
        (org_id, gating_enabled, gating_threshold_stars, google_review_url, facebook_review_url, 
         yelp_review_url, trustpilot_review_url, request_email_subject, request_email_template, request_sms_template, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
       ON CONFLICT (org_id) DO UPDATE SET
         gating_enabled = EXCLUDED.gating_enabled,
         gating_threshold_stars = EXCLUDED.gating_threshold_stars,
         google_review_url = EXCLUDED.google_review_url,
         facebook_review_url = EXCLUDED.facebook_review_url,
         yelp_review_url = EXCLUDED.yelp_review_url,
         trustpilot_review_url = EXCLUDED.trustpilot_review_url,
         request_email_subject = EXCLUDED.request_email_subject,
         request_email_template = EXCLUDED.request_email_template,
         request_sms_template = EXCLUDED.request_sms_template,
         updated_at = now()
       RETURNING *`,
      [
        orgId,
        gatingEnabled !== undefined ? gatingEnabled : true,
        gatingThresholdStars || 4,
        googleReviewUrl || null,
        facebookReviewUrl || null,
        yelpReviewUrl || null,
        trustpilotReviewUrl || null,
        requestEmailSubject || 'How was your experience?',
        requestEmailTemplate || '',
        requestSmsTemplate || ''
      ]
    );

    res.json({ settings: rows[0] });
  } catch (err) {
    console.error('[reviewsController.updateSettings] Error:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
}

// Reply to a review
async function addReply(req, res) {
  try {
    const orgId = req.user.orgId;
    const { id } = req.params;
    const { replyContent } = req.body;

    if (!replyContent || !replyContent.trim()) {
      return res.status(400).json({ error: 'Reply content is required.' });
    }

    const { rows } = await db.query(
      `UPDATE business_reviews 
       SET reply_content = $1, replied_at = now(), replied_by = $2, updated_at = now()
       WHERE id = $3 AND org_id = $4
       RETURNING *`,
      [replyContent.trim(), req.user.id, id, orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    res.json({ review: rows[0] });
  } catch (err) {
    console.error('[reviewsController.addReply] Error:', err);
    res.status(500).json({ error: 'Failed to add reply.' });
  }
}

// Delete reply
async function deleteReply(req, res) {
  try {
    const orgId = req.user.orgId;
    const { id } = req.params;

    const { rows } = await db.query(
      `UPDATE business_reviews 
       SET reply_content = NULL, replied_at = NULL, replied_by = NULL, updated_at = now()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [id, orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    res.json({ review: rows[0], message: 'Reply deleted.' });
  } catch (err) {
    console.error('[reviewsController.deleteReply] Error:', err);
    res.status(500).json({ error: 'Failed to delete reply.' });
  }
}

// Send a review request to a contact
async function sendRequest(req, res) {
  try {
    const orgId = req.user.orgId;
    const { contactId, channel, recipientValue } = req.body;

    if (!channel || !recipientValue) {
      return res.status(400).json({ error: 'channel and recipientValue are required.' });
    }

    // Get contact info if supplied
    let contactName = 'Valued Customer';
    if (contactId) {
      const contactRes = await db.query(
        'SELECT first_name, last_name FROM contacts WHERE id = $1 AND org_id = $2',
        [contactId, orgId]
      );
      if (contactRes.rows.length) {
        const c = contactRes.rows[0];
        contactName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Customer';
      }
    }

    // Get settings for templates
    let settingsRes = await db.query('SELECT * FROM review_settings WHERE org_id = $1', [orgId]);
    if (!settingsRes.rows.length) {
      settingsRes = await db.query(
        `INSERT INTO review_settings (org_id) VALUES ($1) RETURNING *`,
        [orgId]
      );
    }
    const settings = settingsRes.rows[0];

    // Build unique absolute feedback link pointing to our client app landing page
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://suite.digitpenhub.com' : 'http://localhost:4000';
    const feedbackLink = `${baseUrl}/reviews/feedback/${orgId}`;

    let status = 'sent';

    if (channel === 'email') {
      const subject = settings.request_email_subject.replace(/\{\{name\}\}/gi, contactName);
      const text = settings.request_email_template
        .replace(/\{\{name\}\}/gi, contactName)
        .replace(/\{\{link\}\}/gi, feedbackLink);
      
      const html = `<div style="font-family: sans-serif; line-height: 1.5; color: #333; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <p>${text.replace(/\n/g, '<br>')}</p>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${feedbackLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Leave a Review</a>
        </div>
      </div>`;

      await sendMail({
        to: recipientValue,
        subject,
        html
      });
    } else if (channel === 'sms') {
      const messageText = settings.request_sms_template
        .replace(/\{\{name\}\}/gi, contactName)
        .replace(/\{\{link\}\}/gi, feedbackLink);
      
      await sendSms({
        to: recipientValue,
        message: messageText
      });
    }

    // Create log record
    const logRes = await db.query(
      `INSERT INTO review_request_logs (org_id, contact_id, recipient_value, channel, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orgId, contactId || null, recipientValue, channel, status]
    );

    res.json({ ok: true, log: logRes.rows[0], message: 'Review request sent successfully.' });
  } catch (err) {
    console.error('[reviewsController.sendRequest] Error:', err);
    res.status(500).json({ error: 'Failed to send review request.' });
  }
}

// List review request logs history
async function listRequests(req, res) {
  try {
    const orgId = req.user.orgId;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const itemsRes = await db.query(
      `SELECT l.*, c.first_name, c.last_name
       FROM review_request_logs l
       LEFT JOIN contacts c ON c.id = l.contact_id
       WHERE l.org_id = $1
       ORDER BY l.sent_at DESC
       LIMIT $2 OFFSET $3`,
      [orgId, parseInt(limit), offset]
    );

    const countRes = await db.query(
      `SELECT count(*)::int AS total FROM review_request_logs WHERE org_id = $1`,
      [orgId]
    );

    res.json({
      logs: itemsRes.rows,
      total: countRes.rows[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('[reviewsController.listRequests] Error:', err);
    res.status(500).json({ error: 'Failed to load requests history.' });
  }
}

// PUBLIC: Get embedded positive reviews for a website widget (e.g. 4 and 5 stars)
async function getEmbedReviews(req, res) {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required.' });
    }

    const { rows } = await db.query(
      `SELECT id, reviewer_name, reviewer_avatar, rating, title, content, source_platform, created_at
       FROM business_reviews
       WHERE org_id = $1 AND rating >= 4 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 10`,
      [orgId]
    );

    res.json({ reviews: rows });
  } catch (err) {
    console.error('[reviewsController.getEmbedReviews] Error:', err);
    res.status(500).json({ error: 'Failed to fetch embedded reviews.' });
  }
}

// PUBLIC: Get feedback settings for public page
async function getPublicFeedbackSettings(req, res) {
  try {
    const { orgId } = req.params;

    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required.' });
    }

    // Get settings and public organization name
    const [settingsRes, orgRes] = await Promise.all([
      db.query(
        `SELECT gating_enabled, google_review_url, facebook_review_url, yelp_review_url, trustpilot_review_url 
         FROM review_settings WHERE org_id = $1`,
        [orgId]
      ),
      db.query(
        `SELECT name FROM organizations WHERE id = $1`,
        [orgId]
      )
    ]);

    if (!orgRes.rows.length) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const settings = settingsRes.rows[0] || {
      gating_enabled: true,
      google_review_url: null,
      facebook_review_url: null,
      yelp_review_url: null,
      trustpilot_review_url: null
    };

    res.json({
      organizationName: orgRes.rows[0].name,
      settings
    });
  } catch (err) {
    console.error('[reviewsController.getPublicFeedbackSettings] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve feedback settings.' });
  }
}

// PUBLIC: Submit a public feedback rating
async function submitPublicFeedback(req, res) {
  try {
    const { orgId, reviewerName, reviewerEmail, rating, title, content } = req.body;

    if (!orgId || !reviewerName || !rating || !content) {
      return res.status(400).json({ error: 'orgId, reviewerName, rating, and content are required.' });
    }

    // Insert public review as direct feedback
    const reviewRes = await db.query(
      `INSERT INTO business_reviews (org_id, reviewer_name, reviewer_email, rating, title, content, source_platform)
       VALUES ($1, $2, $3, $4, $5, $6, 'direct')
       RETURNING *`,
      [orgId, reviewerName, reviewerEmail || null, rating, title || null, content]
    );

    const review = reviewRes.rows[0];

    // Fetch gating settings
    const settingsRes = await db.query(
      `SELECT gating_enabled, gating_threshold_stars, google_review_url, facebook_review_url, yelp_review_url, trustpilot_review_url 
       FROM review_settings WHERE org_id = $1`,
      [orgId]
    );

    let redirectUrl = null;
    let gated = false;

    if (settingsRes.rows.length) {
      const settings = settingsRes.rows[0];
      if (settings.gating_enabled && rating < settings.gating_threshold_stars) {
        gated = true;
      } else {
        // Find first configured URL
        redirectUrl = settings.google_review_url || settings.facebook_review_url || settings.yelp_review_url || settings.trustpilot_review_url || null;
      }
    }

    res.json({ ok: true, review, gated, redirectUrl });
  } catch (err) {
    console.error('[reviewsController.submitPublicFeedback] Error:', err);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
}

// Seed mock reviews for testing/demonstration when requested
async function seedMockData(req, res) {
  try {
    const orgId = req.user.orgId;

    const countRes = await db.query(
      "SELECT count(*)::int FROM business_reviews WHERE org_id = $1",
      [orgId]
    );

    if (countRes.rows[0].count > 0) {
      return res.json({ message: 'Mock reviews already exist.' });
    }

    const mocks = [
      { name: 'Sarah Jenkins', rating: 5, platform: 'google', title: 'Amazing customer service!', content: 'I had an issue with my order and the support team resolved it within 10 minutes. Will definitely purchase again.' },
      { name: 'David Miller', rating: 4, platform: 'facebook', title: 'Great quality products', content: 'Very pleased with the quality. The delivery took a bit longer than expected, but the product is fantastic.' },
      { name: 'Elena Rostova', rating: 5, platform: 'google', title: 'Absolutely perfect experience', content: 'Hands down the best company in the industry. Professional, high quality, and extremely fast.' },
      { name: 'Mark Thompson', rating: 3, platform: 'yelp', title: 'Decent experience', content: 'The service is okay, but I feel the pricing is a bit high compared to local competitors.' },
      { name: 'James Kim', rating: 2, platform: 'direct', title: 'Product defect', content: 'My item arrived with a minor scratch. I reached out to customer service and am waiting for an exchange.' }
    ];

    for (const m of mocks) {
      await db.query(
        `INSERT INTO business_reviews (org_id, reviewer_name, rating, title, content, source_platform, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, now() - (random() * interval '30 days'))`,
        [orgId, m.name, m.rating, m.title, m.content, m.platform]
      );
    }

    res.json({ ok: true, message: 'Sample reviews seeded successfully.' });
  } catch (err) {
    console.error('[reviewsController.seedMockData] Error:', err);
    res.status(500).json({ error: 'Failed to seed sample reviews.' });
  }
}

module.exports = {
  listReviews,
  getStats,
  getSettings,
  updateSettings,
  addReply,
  deleteReply,
  sendRequest,
  listRequests,
  getEmbedReviews,
  getPublicFeedbackSettings,
  submitPublicFeedback,
  seedMockData
};
