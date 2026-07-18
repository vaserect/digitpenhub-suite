const db = require('../../db');

class AnalyticsService {
  async trackEvent(formId, variantId, orgId, eventType, metadata = {}) {
    const sessionId = metadata.sessionId || null;
    const ipAddress = metadata.ipAddress || null;
    const userAgent = metadata.userAgent || null;
    const referrer = metadata.referrer || null;

    await db.query(
      `INSERT INTO lead_form_events (form_id, variant_id, org_id, event_type, session_id, ip_address, user_agent, referrer, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [formId, variantId, orgId, eventType, sessionId, ipAddress, userAgent, referrer, JSON.stringify(metadata)]
    );
  }

  async getFormAnalytics(formId, orgId, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    let dateFilter = '';
    const params = [formId, orgId];

    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateFilter = ` AND created_at BETWEEN $3 AND $4`;
    }

    const { rows } = await db.query(
      `SELECT 
         event_type,
         COUNT(*) as count,
         COUNT(DISTINCT session_id) as unique_sessions
       FROM lead_form_events
       WHERE form_id = $1 AND org_id = $2${dateFilter}
       GROUP BY event_type`,
      params
    );

    const analytics = {
      views: 0,
      starts: 0,
      submits: 0,
      abandons: 0,
      errors: 0,
      uniqueSessions: 0,
      conversionRate: 0,
      abandonRate: 0
    };

    rows.forEach(row => {
      analytics[row.event_type + 's'] = parseInt(row.count);
      if (row.event_type === 'view') {
        analytics.uniqueSessions = parseInt(row.unique_sessions);
      }
    });

    if (analytics.views > 0) {
      analytics.conversionRate = ((analytics.submits / analytics.views) * 100).toFixed(2);
      analytics.abandonRate = ((analytics.abandons / analytics.views) * 100).toFixed(2);
    }

    return analytics;
  }

  async getVariantPerformance(formId, orgId) {
    const { rows } = await db.query(
      `SELECT 
         v.id,
         v.variant_name,
         v.traffic_split,
         COUNT(CASE WHEN e.event_type = 'view' THEN 1 END) as views,
         COUNT(CASE WHEN e.event_type = 'submit' THEN 1 END) as submits,
         COUNT(DISTINCT e.session_id) as unique_visitors
       FROM lead_form_variants v
       LEFT JOIN lead_form_events e ON e.variant_id = v.id
       WHERE v.form_id = $1 AND v.org_id = $2
       GROUP BY v.id, v.variant_name, v.traffic_split`,
      [formId, orgId]
    );

    return rows.map(row => ({
      ...row,
      views: parseInt(row.views),
      submits: parseInt(row.submits),
      uniqueVisitors: parseInt(row.unique_visitors),
      conversionRate: row.views > 0 ? ((row.submits / row.views) * 100).toFixed(2) : 0
    }));
  }

  async getTopPerformingForms(orgId, limit = 10) {
    const { rows } = await db.query(
      `SELECT 
         f.id,
         f.name,
         COUNT(CASE WHEN e.event_type = 'view' THEN 1 END) as views,
         COUNT(CASE WHEN e.event_type = 'submit' THEN 1 END) as submits,
         COUNT(s.id) as total_submissions
       FROM lead_forms f
       LEFT JOIN lead_form_events e ON e.form_id = f.id
       LEFT JOIN lead_submissions s ON s.form_id = f.id
       WHERE f.org_id = $1
       GROUP BY f.id, f.name
       ORDER BY submits DESC
       LIMIT $2`,
      [orgId, limit]
    );

    return rows.map(row => ({
      ...row,
      views: parseInt(row.views),
      submits: parseInt(row.submits),
      totalSubmissions: parseInt(row.total_submissions),
      conversionRate: row.views > 0 ? ((row.submits / row.views) * 100).toFixed(2) : 0
    }));
  }

  async getConversionFunnel(formId, orgId) {
    const { rows } = await db.query(
      `SELECT 
         COUNT(DISTINCT CASE WHEN event_type = 'view' THEN session_id END) as viewed,
         COUNT(DISTINCT CASE WHEN event_type = 'start' THEN session_id END) as started,
         COUNT(DISTINCT CASE WHEN event_type = 'submit' THEN session_id END) as submitted,
         COUNT(DISTINCT CASE WHEN event_type = 'abandon' THEN session_id END) as abandoned
       FROM lead_form_events
       WHERE form_id = $1 AND org_id = $2`,
      [formId, orgId]
    );

    const funnel = rows[0];
    return {
      viewed: parseInt(funnel.viewed),
      started: parseInt(funnel.started),
      submitted: parseInt(funnel.submitted),
      abandoned: parseInt(funnel.abandoned),
      viewToStartRate: funnel.viewed > 0 ? ((funnel.started / funnel.viewed) * 100).toFixed(2) : 0,
      startToSubmitRate: funnel.started > 0 ? ((funnel.submitted / funnel.started) * 100).toFixed(2) : 0
    };
  }
}

module.exports = AnalyticsService;
