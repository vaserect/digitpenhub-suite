const HeatmapService = require('../services/heatmaps/HeatmapService');
const asyncHandler = require('../utils/asyncHandler');

// Public: Track session events
exports.trackSession = asyncHandler(async (req, res) => {
  const { orgId, visitorHash, pageUrl, pageTitle, events } = req.body;
  
  if (!orgId || !visitorHash || !pageUrl) {
    return res.status(400).json({ 
      error: 'orgId, visitorHash, and pageUrl are required' 
    });
  }

  // Extract device/browser info from user agent
  const userAgent = req.headers['user-agent'] || '';
  const deviceType = /mobile/i.test(userAgent) ? 'mobile' : 
                     /tablet/i.test(userAgent) ? 'tablet' : 'desktop';
  
  const result = await HeatmapService.trackSession({
    orgId,
    visitorHash,
    pageUrl,
    pageTitle,
    events: events || [],
    deviceType,
    browser: req.headers['user-agent'],
    ipAddress: req.ip,
    referrer: req.headers['referer'],
    ...req.body
  });

  res.json(result);
});

// Get session recordings
exports.getRecordings = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const filters = {
    pageUrl: req.query.pageUrl,
    deviceType: req.query.deviceType,
    country: req.query.country,
    hasRageClicks: req.query.hasRageClicks === 'true',
    hasErrors: req.query.hasErrors === 'true',
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    page: req.query.page || 1,
    limit: req.query.limit || 20
  };

  const result = await HeatmapService.getSessionRecordings(orgId, filters);
  res.json(result);
});

// Get single recording
exports.getRecording = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { id } = req.params;

  const { rows } = await require('../db').query(
    `SELECT * FROM session_recordings WHERE id = $1 AND org_id = $2`,
    [id, orgId]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  res.json({ recording: rows[0] });
});

// Get heatmap data
exports.getHeatmap = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { pageUrl, type = 'click', viewportWidth, viewportHeight } = req.query;

  if (!pageUrl || !viewportWidth || !viewportHeight) {
    return res.status(400).json({ 
      error: 'pageUrl, viewportWidth, and viewportHeight are required' 
    });
  }

  const heatmap = await HeatmapService.getHeatmapData(
    orgId, 
    pageUrl, 
    type, 
    parseInt(viewportWidth), 
    parseInt(viewportHeight)
  );

  res.json({ heatmap });
});

// Get page analytics
exports.getAnalytics = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { pageUrl, dateFrom, dateTo } = req.query;

  if (!pageUrl || !dateFrom || !dateTo) {
    return res.status(400).json({ 
      error: 'pageUrl, dateFrom, and dateTo are required' 
    });
  }

  const analytics = await HeatmapService.getPageAnalytics(
    orgId, 
    pageUrl, 
    dateFrom, 
    dateTo
  );

  res.json({ analytics });
});

// Get tracking settings
exports.getSettings = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { pageUrl } = req.query;

  if (!pageUrl) {
    return res.status(400).json({ error: 'pageUrl is required' });
  }

  const settings = await HeatmapService.getTrackingSettings(orgId, pageUrl);
  res.json({ settings });
});

// Update tracking settings
exports.updateSettings = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { pageUrlPattern, ...settings } = req.body;

  if (!pageUrlPattern) {
    return res.status(400).json({ error: 'pageUrlPattern is required' });
  }

  const { rows } = await require('../db').query(
    `INSERT INTO tracking_settings (
      org_id, page_url_pattern, is_enabled, track_clicks, track_scrolls,
      track_mouse, track_forms, track_errors, sampling_rate, privacy_mode
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (org_id, page_url_pattern) 
    DO UPDATE SET 
      is_enabled = $3, track_clicks = $4, track_scrolls = $5,
      track_mouse = $6, track_forms = $7, track_errors = $8,
      sampling_rate = $9, privacy_mode = $10, updated_at = NOW()
    RETURNING *`,
    [
      orgId, pageUrlPattern,
      settings.isEnabled !== undefined ? settings.isEnabled : true,
      settings.trackClicks !== undefined ? settings.trackClicks : true,
      settings.trackScrolls !== undefined ? settings.trackScrolls : true,
      settings.trackMouse !== undefined ? settings.trackMouse : true,
      settings.trackForms !== undefined ? settings.trackForms : true,
      settings.trackErrors !== undefined ? settings.trackErrors : true,
      settings.samplingRate || 100,
      settings.privacyMode || 'balanced'
    ]
  );

  res.json({ settings: rows[0] });
});

// Get pages list
exports.getPages = asyncHandler(async (req, res) => {
  const { orgId } = req.user;

  const { rows } = await require('../db').query(
    `SELECT DISTINCT page_url, page_title, COUNT(*) as session_count
     FROM session_recordings
     WHERE org_id = $1
     GROUP BY page_url, page_title
     ORDER BY session_count DESC
     LIMIT 100`,
    [orgId]
  );

  res.json({ pages: rows });
});
