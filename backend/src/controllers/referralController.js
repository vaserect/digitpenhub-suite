const ReferralService = require('../services/ReferralService');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');

/**
 * ReferralController - Enterprise-grade referral program management
 * Handles all HTTP requests for referral operations
 */

// ============================================================================
// DASHBOARD & STATS
// ============================================================================

async function getStats(req, res) {
  try {
    const analytics = await ReferralService.getAnalytics(req.user.orgId);
    const topReferrers = await ReferralService.getTopReferrers(req.user.orgId, 5);
    const fraudAlerts = await ReferralService.getFraudAlerts(req.user.orgId, { isResolved: false });

    res.json({
      ...analytics,
      topReferrers,
      unresolvedFraudAlerts: fraudAlerts.length
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}

async function getAnalytics(req, res) {
  try {
    const { programId, startDate, endDate } = req.query;
    
    const analytics = await ReferralService.getAnalytics(req.user.orgId, {
      programId,
      startDate,
      endDate
    });

    const trends = await ReferralService.getPerformanceTrends(
      req.user.orgId,
      programId,
      30
    );

    res.json({
      analytics,
      trends
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

// ============================================================================
// REFERRAL PROGRAMS
// ============================================================================

async function listPrograms(req, res) {
  try {
    const { status, isActive } = req.query;
    
    const programs = await ReferralService.listPrograms(req.user.orgId, {
      status,
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    });

    res.json({ programs });
  } catch (error) {
    console.error('Error listing programs:', error);
    res.status(500).json({ error: 'Failed to list programs' });
  }
}

async function getProgram(req, res) {
  try {
    const program = await ReferralService.getProgram(req.user.orgId, req.params.id);
    
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json({ program });
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({ error: 'Failed to fetch program' });
  }
}

async function createProgram(req, res) {
  try {
    const program = await ReferralService.createProgram(req.user.orgId, req.body);
    res.status(201).json({ program });
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ error: error.message || 'Failed to create program' });
  }
}

async function updateProgram(req, res) {
  try {
    const program = await ReferralService.updateProgram(
      req.user.orgId,
      req.params.id,
      req.body
    );

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json({ program });
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(500).json({ error: error.message || 'Failed to update program' });
  }
}

async function deleteProgram(req, res) {
  try {
    await ReferralService.deleteProgram(req.user.orgId, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
}

// ============================================================================
// TRACKING LINKS
// ============================================================================

async function generateTrackingLink(req, res) {
  try {
    const { programId, referrerEmail, referrerName, destinationUrl } = req.body;

    if (!programId || !referrerEmail || !destinationUrl) {
      return res.status(400).json({ 
        error: 'programId, referrerEmail, and destinationUrl are required' 
      });
    }

    const link = await ReferralService.generateTrackingLink(
      req.user.orgId,
      programId,
      referrerEmail,
      referrerName,
      destinationUrl
    );

    res.status(201).json({ link });
  } catch (error) {
    console.error('Error generating tracking link:', error);
    res.status(500).json({ error: 'Failed to generate tracking link' });
  }
}

async function listTrackingLinks(req, res) {
  try {
    const { referrerEmail, programId } = req.query;

    if (!referrerEmail) {
      return res.status(400).json({ error: 'referrerEmail is required' });
    }

    const links = await ReferralService.listTrackingLinks(
      req.user.orgId,
      referrerEmail,
      programId
    );

    res.json({ links });
  } catch (error) {
    console.error('Error listing tracking links:', error);
    res.status(500).json({ error: 'Failed to list tracking links' });
  }
}

async function updateTrackingLink(req, res) {
  try {
    const link = await ReferralService.updateTrackingLink(
      req.user.orgId,
      req.params.linkId,
      req.body
    );

    if (!link) {
      return res.status(404).json({ error: 'Tracking link not found' });
    }

    res.json({ link });
  } catch (error) {
    console.error('Error updating tracking link:', error);
    res.status(500).json({ error: 'Failed to update tracking link' });
  }
}

// ============================================================================
// CLICK TRACKING (Public endpoint)
// ============================================================================

async function trackClick(req, res) {
  try {
    const { linkCode } = req.params;

    // Safely derive device type — useragent middleware may not be loaded
    const ua = req.useragent || {};
    const deviceType = ua.isMobile ? 'mobile' : ua.isTablet ? 'tablet' : ua.isDesktop ? 'desktop' : 'unknown';

    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      referrerUrl: req.get('referer'),
      deviceType,
      browser: ua.browser,
      os: ua.os
    };

    const result = await ReferralService.trackClick(linkCode, metadata);

    if (!result || !result.destinationUrl) {
      return res.status(404).send('Invalid or expired tracking link');
    }

    // Redirect to destination URL
    res.redirect(result.destinationUrl);
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(404).send('Invalid tracking link');
  }
}

async function getClickAnalytics(req, res) {
  try {
    const { programId, linkId, startDate, endDate } = req.query;
    
    const analytics = await ReferralService.getClickAnalytics(req.user.orgId, {
      programId,
      linkId,
      startDate,
      endDate
    });

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching click analytics:', error);
    res.status(500).json({ error: 'Failed to fetch click analytics' });
  }
}

// ============================================================================
// REFERRALS
// ============================================================================

async function listReferrals(req, res) {
  try {
    const { programId, status, referrerEmail, startDate, endDate, limit, offset } = req.query;
    
    const referrals = await ReferralService.listReferrals(req.user.orgId, {
      programId,
      status,
      referrerEmail,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({ referrals });
  } catch (error) {
    console.error('Error listing referrals:', error);
    res.status(500).json({ error: 'Failed to list referrals' });
  }
}

async function createReferral(req, res) {
  try {
    const referral = await ReferralService.createReferral(req.user.orgId, req.body);
    res.status(201).json({ referral });
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ error: error.message || 'Failed to create referral' });
  }
}

async function trackConversion(req, res) {
  try {
    const { referralId } = req.params;
    const { conversionAmountNgn, orderId, customerId, autoApprove } = req.body;

    if (!conversionAmountNgn) {
      return res.status(400).json({ error: 'conversionAmountNgn is required' });
    }

    const referral = await ReferralService.trackConversion(
      req.user.orgId,
      referralId,
      {
        conversionAmountNgn: Math.round(conversionAmountNgn * 100), // Convert to kobo
        orderId,
        customerId,
        autoApprove
      }
    );

    res.json({ referral });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    res.status(500).json({ error: error.message || 'Failed to track conversion' });
  }
}

async function approveConversion(req, res) {
  try {
    const referral = await ReferralService.approveConversion(
      req.user.orgId,
      req.params.referralId,
      req.user.id
    );

    res.json({ referral });
  } catch (error) {
    console.error('Error approving conversion:', error);
    res.status(500).json({ error: error.message || 'Failed to approve conversion' });
  }
}

async function rejectReferral(req, res) {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const referral = await ReferralService.rejectReferral(
      req.user.orgId,
      req.params.referralId,
      req.user.id,
      reason
    );

    res.json({ referral });
  } catch (error) {
    console.error('Error rejecting referral:', error);
    res.status(500).json({ error: 'Failed to reject referral' });
  }
}

async function updateReferral(req, res) {
  try {
    const { status, notes } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (status !== undefined) {
      updates.push(`status = $${++paramCount}`);
      values.push(status);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${++paramCount}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    values.push(req.params.id, req.user.orgId);
    const db = require('../db');
    const { rows } = await db.query(
      `UPDATE referrals SET ${updates.join(', ')} 
       WHERE id = $${++paramCount} AND org_id = $${++paramCount}
       RETURNING *`,
      values
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    res.json({ referral: rows[0] });
  } catch (error) {
    console.error('Error updating referral:', error);
    res.status(500).json({ error: 'Failed to update referral' });
  }
}

async function deleteReferral(req, res) {
  try {
    const db = require('../db');
    await db.query(
      `DELETE FROM referrals WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting referral:', error);
    res.status(500).json({ error: 'Failed to delete referral' });
  }
}

const bulkDeleteReferrals = bulkDeleteHandler('referrals');

// ============================================================================
// REWARDS
// ============================================================================

async function listRewards(req, res) {
  try {
    const { programId, recipientEmail, status, recipientType } = req.query;
    
    const rewards = await ReferralService.listRewards(req.user.orgId, {
      programId,
      recipientEmail,
      status,
      recipientType
    });

    res.json({ rewards });
  } catch (error) {
    console.error('Error listing rewards:', error);
    res.status(500).json({ error: 'Failed to list rewards' });
  }
}

async function approveReward(req, res) {
  try {
    const reward = await ReferralService.approveReward(
      req.user.orgId,
      req.params.rewardId,
      req.user.id
    );

    if (!reward) {
      return res.status(404).json({ error: 'Reward not found or already approved' });
    }

    res.json({ reward });
  } catch (error) {
    console.error('Error approving reward:', error);
    res.status(500).json({ error: 'Failed to approve reward' });
  }
}

async function markRewardPaid(req, res) {
  try {
    const { paymentMethod, paymentReference } = req.body;

    if (!paymentMethod || !paymentReference) {
      return res.status(400).json({ 
        error: 'paymentMethod and paymentReference are required' 
      });
    }

    const reward = await ReferralService.markRewardPaid(
      req.user.orgId,
      req.params.rewardId,
      paymentMethod,
      paymentReference
    );

    if (!reward) {
      return res.status(404).json({ error: 'Reward not found or not approved' });
    }

    res.json({ reward });
  } catch (error) {
    console.error('Error marking reward as paid:', error);
    res.status(500).json({ error: 'Failed to mark reward as paid' });
  }
}

async function processBatchRewards(req, res) {
  try {
    const { rewardIds, paymentMethod, paymentReference } = req.body;

    if (!rewardIds || !Array.isArray(rewardIds) || rewardIds.length === 0) {
      return res.status(400).json({ error: 'rewardIds array is required' });
    }

    if (!paymentMethod || !paymentReference) {
      return res.status(400).json({ 
        error: 'paymentMethod and paymentReference are required' 
      });
    }

    const rewards = await ReferralService.processBatchRewards(
      req.user.orgId,
      rewardIds,
      paymentMethod,
      paymentReference
    );

    res.json({ 
      rewards,
      processedCount: rewards.length
    });
  } catch (error) {
    console.error('Error processing batch rewards:', error);
    res.status(500).json({ error: 'Failed to process batch rewards' });
  }
}

// ============================================================================
// REFERRER PROFILES
// ============================================================================

async function getReferrerProfile(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const profile = await ReferralService.getReferrerProfile(req.user.orgId, email);

    if (!profile) {
      return res.status(404).json({ error: 'Referrer profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Error fetching referrer profile:', error);
    res.status(500).json({ error: 'Failed to fetch referrer profile' });
  }
}

async function getOrCreateReferrerProfile(req, res) {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const profile = await ReferralService.getOrCreateReferrerProfile(
      req.user.orgId,
      email,
      name
    );

    res.json({ profile });
  } catch (error) {
    console.error('Error getting/creating referrer profile:', error);
    res.status(500).json({ error: 'Failed to get/create referrer profile' });
  }
}

async function getTopReferrers(req, res) {
  try {
    const { limit = 10, metric = 'conversions' } = req.query;
    
    const referrers = await ReferralService.getTopReferrers(
      req.user.orgId,
      parseInt(limit),
      metric
    );

    res.json({ referrers });
  } catch (error) {
    console.error('Error fetching top referrers:', error);
    res.status(500).json({ error: 'Failed to fetch top referrers' });
  }
}

async function updateReferrerProfile(req, res) {
  try {
    const { email } = req.params;
    
    const profile = await ReferralService.updateReferrerProfile(
      req.user.orgId,
      email,
      req.body
    );

    if (!profile) {
      return res.status(404).json({ error: 'Referrer profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Error updating referrer profile:', error);
    res.status(500).json({ error: error.message || 'Failed to update referrer profile' });
  }
}

// ============================================================================
// FRAUD DETECTION
// ============================================================================

async function runFraudDetection(req, res) {
  try {
    const { referralId } = req.params;
    
    const alerts = await ReferralService.detectFraud(req.user.orgId, referralId);

    res.json({ 
      alerts,
      alertCount: alerts.length
    });
  } catch (error) {
    console.error('Error running fraud detection:', error);
    res.status(500).json({ error: 'Failed to run fraud detection' });
  }
}

async function getFraudAlerts(req, res) {
  try {
    const { isResolved, severity, referrerEmail } = req.query;
    
    const alerts = await ReferralService.getFraudAlerts(req.user.orgId, {
      isResolved: isResolved !== undefined ? isResolved === 'true' : undefined,
      severity,
      referrerEmail
    });

    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching fraud alerts:', error);
    res.status(500).json({ error: 'Failed to fetch fraud alerts' });
  }
}

async function resolveAlert(req, res) {
  try {
    const { resolutionNotes } = req.body;

    const alert = await ReferralService.resolveAlert(
      req.user.orgId,
      req.params.alertId,
      req.user.id,
      resolutionNotes
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ alert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
}

// ============================================================================
// EXPORT
// ============================================================================

async function exportReferrals(req, res) {
  try {
    const { programId, status, startDate, endDate } = req.query;
    
    const referrals = await ReferralService.listReferrals(req.user.orgId, {
      programId,
      status,
      startDate,
      endDate,
      limit: 10000 // Max export limit
    });

    sendCsv(res, 'referrals.csv', referrals, autoColumns(referrals));
  } catch (error) {
    console.error('Error exporting referrals:', error);
    res.status(500).json({ error: 'Failed to export referrals' });
  }
}

module.exports = {
  // Dashboard & Stats
  getStats,
  getAnalytics,
  
  // Programs
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  
  // Tracking Links
  generateTrackingLink,
  listTrackingLinks,
  updateTrackingLink,
  
  // Click Tracking
  trackClick,
  getClickAnalytics,
  
  // Referrals
  listReferrals,
  createReferral,
  trackConversion,
  approveConversion,
  rejectReferral,
  updateReferral,
  deleteReferral,
  bulkDeleteReferrals,
  
  // Rewards
  listRewards,
  approveReward,
  markRewardPaid,
  processBatchRewards,
  
  // Referrer Profiles
  getReferrerProfile,
  getOrCreateReferrerProfile,
  getTopReferrers,
  updateReferrerProfile,
  
  // Fraud Detection
  runFraudDetection,
  getFraudAlerts,
  resolveAlert,
  
  // Export
  exportReferrals
};
