const db = require('../../db');
const crypto = require('crypto');

class HeatmapService {
  async trackSession(data) {
    const {
      orgId, visitorHash, pageUrl, pageTitle, events = [],
      deviceType, browser, browserVersion, os, osVersion,
      screenWidth, screenHeight, viewportWidth, viewportHeight,
      country, city, ipAddress, referrer,
      utmSource, utmMedium, utmCampaign
    } = data;

    const duration = events.length > 1
      ? Math.round((new Date(events[events.length - 1].t) - new Date(events[0].t)) / 1000)
      : 0;

    const { rows } = await db.query(
      `INSERT INTO session_recordings (
        org_id, visitor_hash, page_url, page_title, events, duration_secs,
        device_type, browser, browser_version, os, os_version,
        screen_width, screen_height, viewport_width, viewport_height,
        country, city, ip_address, referrer,
        utm_source, utm_medium, utm_campaign
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING id`,
      [
        orgId, visitorHash, pageUrl, pageTitle, JSON.stringify(events), duration,
        deviceType, browser, browserVersion, os, osVersion,
        screenWidth, screenHeight, viewportWidth, viewportHeight,
        country, city, ipAddress, referrer,
        utmSource, utmMedium, utmCampaign
      ]
    );

    const sessionId = rows[0].id;
    this.processSessionEvents(sessionId, orgId, pageUrl, events, viewportWidth, viewportHeight).catch(err => {
      console.error('Error processing session events:', err);
    });

    return { sessionId, ok: true };
  }

  async processSessionEvents(sessionId, orgId, pageUrl, events, viewportWidth, viewportHeight) {
    const clicks = [];
    const scrolls = [];
    let maxScrollDepth = 0;
    let maxScrollPercent = 0;
    let pageHeight = 0;
    let clickCount = 0;
    let hasRageClicks = false;
    const clickHistory = [];

    for (const event of events) {
      const timestamp = new Date(event.t);

      if (event.type === 'click') {
        clicks.push({
          sessionId, orgId, pageUrl,
          x: event.x, y: event.y,
          viewportWidth, viewportHeight,
          elementSelector: event.selector,
          elementText: event.text,
          timestamp
        });
        clickCount++;

        clickHistory.push({ x: event.x, y: event.y, t: timestamp });
        const recentClicks = clickHistory.filter(c => 
          timestamp - c.t < 1000 && 
          Math.abs(c.x - event.x) < 50 && 
          Math.abs(c.y - event.y) < 50
        );
        if (recentClicks.length >= 3) {
          clicks[clicks.length - 1].isRageClick = true;
          hasRageClicks = true;
        }
      } else if (event.type === 'scroll') {
        if (event.depth > maxScrollDepth) maxScrollDepth = event.depth;
        if (event.percent > maxScrollPercent) maxScrollPercent = event.percent;
        if (event.pageHeight > pageHeight) pageHeight = event.pageHeight;
        scrolls.push({ depth: event.depth, percent: event.percent, timestamp });
      }
    }

    if (clicks.length > 0) {
      for (const c of clicks) {
        await db.query(
          `INSERT INTO click_events (session_id, org_id, page_url, x, y, viewport_width, viewport_height, element_selector, element_text, is_rage_click, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [c.sessionId, c.orgId, c.pageUrl, c.x, c.y, c.viewportWidth, c.viewportHeight, c.elementSelector, c.elementText, c.isRageClick || false, c.timestamp]
        );
      }
    }

    if (scrolls.length > 0) {
      await db.query(
        `INSERT INTO scroll_events (session_id, org_id, page_url, max_scroll_depth, max_scroll_percent, viewport_height, page_height, scroll_points)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [sessionId, orgId, pageUrl, maxScrollDepth, maxScrollPercent, viewportHeight, pageHeight, JSON.stringify(scrolls)]
      );
    }

    await db.query(
      `UPDATE session_recordings 
       SET has_rage_clicks = $1, max_scroll_percent = $2, click_count = $3
       WHERE id = $4`,
      [hasRageClicks, maxScrollPercent, clickCount, sessionId]
    );
  }

  async getSessionRecordings(orgId, filters = {}) {
    const { pageUrl, deviceType, page = 1, limit = 20 } = filters;
    let query = `SELECT * FROM session_recordings WHERE org_id = $1`;
    const params = [orgId];
    let paramIndex = 2;

    if (pageUrl) {
      query += ` AND page_url = $${paramIndex}`;
      params.push(pageUrl);
      paramIndex++;
    }

    if (deviceType) {
      query += ` AND device_type = $${paramIndex}`;
      params.push(deviceType);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const { rows } = await db.query(query, params);
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as total FROM session_recordings WHERE org_id = $1`,
      [orgId]
    );

    return {
      recordings: rows,
      total: parseInt(countRows[0].total),
      page: parseInt(page),
      limit: parseInt(limit)
    };
  }

  async getHeatmapData(orgId, pageUrl, heatmapType = 'click', viewportWidth, viewportHeight) {
    const { rows } = await db.query(
      `SELECT * FROM heatmap_data
       WHERE org_id = $1 AND page_url = $2 AND heatmap_type = $3
       AND viewport_width = $4 AND viewport_height = $5
       ORDER BY updated_at DESC LIMIT 1`,
      [orgId, pageUrl, heatmapType, viewportWidth, viewportHeight]
    );
    return rows[0] || null;
  }

  async getPageAnalytics(orgId, pageUrl, dateFrom, dateTo) {
    const { rows } = await db.query(
      `SELECT 
        SUM(total_sessions) as total_sessions,
        SUM(total_pageviews) as total_pageviews,
        SUM(unique_visitors) as unique_visitors,
        AVG(avg_session_duration) as avg_session_duration,
        AVG(avg_scroll_depth) as avg_scroll_depth,
        SUM(total_clicks) as total_clicks,
        SUM(rage_clicks) as rage_clicks
       FROM analytics_daily
       WHERE org_id = $1 AND page_url = $2 AND date >= $3 AND date <= $4`,
      [orgId, pageUrl, dateFrom, dateTo]
    );
    return rows[0];
  }

  async getTrackingSettings(orgId, pageUrl) {
    const { rows } = await db.query(
      `SELECT * FROM tracking_settings
       WHERE org_id = $1 AND $2 LIKE page_url_pattern
       ORDER BY created_at DESC LIMIT 1`,
      [orgId, pageUrl]
    );
    return rows[0] || {
      isEnabled: true,
      trackClicks: true,
      trackScrolls: true,
      trackMouse: true,
      samplingRate: 100,
      privacyMode: 'balanced'
    };
  }
}

module.exports = new HeatmapService();
