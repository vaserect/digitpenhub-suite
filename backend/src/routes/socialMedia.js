/**
 * Social Media Scheduler Routes
 * 
 * Integrates the standalone Social Media Scheduler service with the Suite
 * Proxies requests to the scheduler API running on port 3001
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../utils/logger');

// Scheduler API base URL
const SCHEDULER_API_URL = process.env.SOCIAL_MEDIA_SCHEDULER_URL || 'http://localhost:3001';

/**
 * Proxy middleware - forwards requests to the scheduler API
 * Injects Suite authentication context into scheduler requests
 */
async function proxyToScheduler(req, res) {
  try {
    const { method, path, body, query } = req;
    
    // Build target URL
    const targetPath = path.replace('/api/v1/social-media', '');
    const targetUrl = `${SCHEDULER_API_URL}/api${targetPath}`;
    
    // Prepare headers - inject Suite user context
    const headers = {
      'Content-Type': 'application/json',
      'X-Suite-User-Id': req.user?.id,
      'X-Suite-Org-Id': req.user?.orgId,
      'X-Suite-Workspace-Id': req.user?.workspaceId || req.body?.workspace_id,
    };
    
    // Forward request to scheduler
    const response = await axios({
      method: method.toLowerCase(),
      url: targetUrl,
      data: body,
      params: query,
      headers,
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status
    });
    
    // Forward response back to client
    res.status(response.status).json(response.data);
    
  } catch (error) {
    logger.error('Social Media Scheduler proxy error', {
      error: error.message,
      path: req.path,
      method: req.method,
    });
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Social Media Scheduler service is unavailable',
        message: 'The scheduler service is not running. Please contact support.',
      });
    }
    
    res.status(500).json({
      error: 'Failed to communicate with Social Media Scheduler',
      message: error.message,
    });
  }
}

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${SCHEDULER_API_URL}/health`, { timeout: 5000 });
    res.json({
      status: 'healthy',
      scheduler: response.data,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Scheduler service unavailable',
    });
  }
});

/**
 * Get all social media accounts for current workspace
 */
router.get('/accounts', proxyToScheduler);

/**
 * Connect a new social media account
 */
router.post('/accounts', proxyToScheduler);

/**
 * Update social media account
 */
router.put('/accounts/:id', proxyToScheduler);

/**
 * Delete social media account
 */
router.delete('/accounts/:id', proxyToScheduler);

/**
 * Get all scheduled posts
 */
router.get('/posts', proxyToScheduler);

/**
 * Create a new scheduled post
 */
router.post('/posts', proxyToScheduler);

/**
 * Get a specific post
 */
router.get('/posts/:id', proxyToScheduler);

/**
 * Update a scheduled post
 */
router.put('/posts/:id', proxyToScheduler);

/**
 * Delete a scheduled post
 */
router.delete('/posts/:id', proxyToScheduler);

/**
 * Publish a post immediately
 */
router.post('/posts/:id/publish', proxyToScheduler);

/**
 * Get post analytics
 */
router.get('/posts/:id/analytics', proxyToScheduler);

/**
 * Get calendar view of scheduled posts
 */
router.get('/calendar', proxyToScheduler);

/**
 * Get analytics dashboard
 */
router.get('/analytics', proxyToScheduler);

/**
 * Get platform-specific analytics
 */
router.get('/analytics/:platform', proxyToScheduler);

/**
 * Get content templates
 */
router.get('/templates', proxyToScheduler);

/**
 * Create content template
 */
router.post('/templates', proxyToScheduler);

/**
 * Get media library
 */
router.get('/media', proxyToScheduler);

/**
 * Upload media
 */
router.post('/media', proxyToScheduler);

/**
 * Delete media
 */
router.delete('/media/:id', proxyToScheduler);

/**
 * Get posting schedule/queue
 */
router.get('/queue', proxyToScheduler);

/**
 * Bulk schedule posts
 */
router.post('/bulk-schedule', proxyToScheduler);

/**
 * Get hashtag suggestions
 */
router.get('/hashtags/suggestions', proxyToScheduler);

/**
 * Get best posting times
 */
router.get('/insights/best-times', proxyToScheduler);

/**
 * Get content performance insights
 */
router.get('/insights/performance', proxyToScheduler);

/**
 * OAuth callback handler for social media platforms
 */
router.get('/oauth/callback/:platform', proxyToScheduler);

/**
 * Initiate OAuth flow
 */
router.get('/oauth/connect/:platform', proxyToScheduler);

/**
 * Catch-all proxy for any other scheduler endpoints
 */
router.all('*', proxyToScheduler);

module.exports = router;