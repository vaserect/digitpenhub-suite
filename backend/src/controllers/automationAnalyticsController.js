/**
 * Automation Analytics Controller
 * 
 * Provides comprehensive analytics and reporting for marketing automation:
 * - Workflow performance metrics
 * - Funnel analysis and drop-off tracking
 * - Cross-channel performance comparison
 * - Goal conversion tracking
 * - Split test results
 * - Lead scoring analytics
 * - Time-based trends
 * - Contact journey visualization
 */

const db = require('../db');
const MarketingAutomationService = require('../services/MarketingAutomationService');

/**
 * Get comprehensive workflow analytics
 */
async function getWorkflowAnalytics(req, res) {
  const { workflowId } = req.params;
  const { startDate, endDate, granularity = 'day' } = req.query;
  
  // Verify workflow ownership
  const { rows: workflows } = await db.query(
    `SELECT id, name FROM automation_workflows WHERE id = $1 AND org_id = $2`,
    [workflowId, req.user.orgId]
  );
  
  if (!workflows.length) {
    return res.status(404).json({ error: 'Workflow not found.' });
  }
  
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];
  
  // Get daily analytics
  const analytics = await MarketingAutomationService.getAnalytics(
    workflowId,
    req.user.orgId,
    start,
    end
  );
  
  // Get overall summary
  const summary = await MarketingAutomationService.getWorkflowSummary(
    workflowId,
    req.user.orgId
  );
  
  // Get funnel data
  const funnel = await getWorkflowFunnel(workflowId, req.user.orgId);
  
  // Get channel breakdown
  const channelBreakdown = await getChannelBreakdown(workflowId, req.user.orgId);
  
  res.json({
    workflow: workflows[0],
    dateRange: { start, end },
    analytics,
    summary,
    funnel,
    channelBreakdown
  });
}

/**
 * Get workflow funnel analysis
 */
async function getWorkflowFunnel(workflowId, orgId) {
  const { rows: steps } = await db.query(
    `SELECT id, step_order, step_type, channel FROM automation_steps
     WHERE workflow_id = $1
     ORDER BY step_order`,
    [workflowId]
  );
  
  const funnelData = [];
  
  for (const step of steps) {
    const { rows: executions } = await db.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'success') as success,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         COUNT(*) FILTER (WHERE status = 'skipped') as skipped
       FROM automation_step_executions
       WHERE step_id = $1`,
      [step.id]
    );
    
    const data = executions[0];
    funnelData.push({
      stepOrder: step.step_order,
      stepType: step.step_type,
      channel: step.channel,
      total: parseInt(data.total),
      success: parseInt(data.success),
      failed: parseInt(data.failed),
      skipped: parseInt(data.skipped),
      successRate: data.total > 0 ? ((data.success / data.total) * 100).toFixed(2) : 0
    });
  }
  
  // Calculate drop-off rates
  for (let i = 1; i < funnelData.length; i++) {
    const previous = funnelData[i - 1];
    const current = funnelData[i];
    
    if (previous.total > 0) {
      current.dropOffRate = (((previous.total - current.total) / previous.total) * 100).toFixed(2);
    } else {
      current.dropOffRate = 0;
    }
  }
  
  return funnelData;
}

/**
 * Get channel performance breakdown
 */
async function getChannelBreakdown(workflowId, orgId) {
  const { rows } = await db.query(
    `SELECT 
       channel,
       COUNT(*) as total_executions,
       COUNT(*) FILTER (WHERE status = 'success') as successful,
       COUNT(*) FILTER (WHERE status = 'failed') as failed,
       AVG(execution_time_ms) as avg_execution_time
     FROM automation_step_executions ase
     JOIN automation_steps ast ON ast.id = ase.step_id
     WHERE ast.workflow_id = $1
     GROUP BY channel`,
    [workflowId]
  );
  
  return rows.map(row => ({
    channel: row.channel,
    totalExecutions: parseInt(row.total_executions),
    successful: parseInt(row.successful),
    failed: parseInt(row.failed),
    successRate: row.total_executions > 0 
      ? ((row.successful / row.total_executions) * 100).toFixed(2)
      : 0,
    avgExecutionTime: parseFloat(row.avg_execution_time || 0).toFixed(2)
  }));
}

/**
 * Get organization-wide automation analytics
 */
async function getOrgAnalytics(req, res) {
  const { startDate, endDate } = req.query;
  
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];
  
  // Overall stats
  const { rows: overallStats } = await db.query(
    `SELECT 
       COUNT(DISTINCT ae.workflow_id) as active_workflows,
       COUNT(*) as total_enrollments,
       COUNT(*) FILTER (WHERE ae.status = 'active') as active_enrollments,
       COUNT(*) FILTER (WHERE ae.status = 'completed') as completed_enrollments,
       COUNT(*) FILTER (WHERE ae.goal_achieved = true) as goals_achieved,
       AVG(ae.lead_score_current - ae.lead_score_start) as avg_score_change,
       SUM(ae.total_emails_sent) as total_emails,
       SUM(ae.total_sms_sent) as total_sms,
       SUM(ae.total_whatsapp_sent) as total_whatsapp
     FROM automation_enrollments ae
     WHERE ae.org_id = $1 AND ae.enrolled_at >= $2 AND ae.enrolled_at <= $3`,
    [req.user.orgId, start, end]
  );
  
  const stats = overallStats[0];
  stats.conversion_rate = stats.total_enrollments > 0
    ? ((stats.goals_achieved / stats.total_enrollments) * 100).toFixed(2)
    : 0;
  
  // Top performing workflows
  const { rows: topWorkflows } = await db.query(
    `SELECT 
       aw.id, aw.name, aw.category,
       COUNT(ae.id) as enrollments,
       COUNT(*) FILTER (WHERE ae.goal_achieved = true) as goals_achieved,
       (COUNT(*) FILTER (WHERE ae.goal_achieved = true)::DECIMAL / NULLIF(COUNT(ae.id), 0) * 100) as conversion_rate
     FROM automation_workflows aw
     LEFT JOIN automation_enrollments ae ON ae.workflow_id = aw.id
     WHERE aw.org_id = $1 AND aw.status = 'active'
     GROUP BY aw.id, aw.name, aw.category
     ORDER BY conversion_rate DESC NULLS LAST
     LIMIT 10`,
    [req.user.orgId]
  );
  
  // Channel performance
  const { rows: channelPerf } = await db.query(
    `SELECT 
       channel,
       COUNT(*) as executions,
       COUNT(*) FILTER (WHERE status = 'success') as successful,
       AVG(execution_time_ms) as avg_time
     FROM automation_step_executions ase
     JOIN automation_steps ast ON ast.id = ase.step_id
     JOIN automation_workflows aw ON aw.id = ast.workflow_id
     WHERE aw.org_id = $1 AND ase.executed_at >= $2 AND ase.executed_at <= $3
     GROUP BY channel`,
    [req.user.orgId, start, end]
  );
  
  res.json({
    dateRange: { start, end },
    overall: stats,
    topWorkflows: topWorkflows.map(w => ({
      ...w,
      conversion_rate: parseFloat(w.conversion_rate || 0).toFixed(2)
    })),
    channelPerformance: channelPerf.map(c => ({
      channel: c.channel,
      executions: parseInt(c.executions),
      successful: parseInt(c.successful),
      successRate: c.executions > 0 ? ((c.successful / c.executions) * 100).toFixed(2) : 0,
      avgTime: parseFloat(c.avg_time || 0).toFixed(2)
    }))
  });
}

/**
 * Get contact journey through automation
 */
async function getContactJourney(req, res) {
  const { contactEmail } = req.params;
  
  // Get all enrollments for contact
  const { rows: enrollments } = await db.query(
    `SELECT ae.*, aw.name as workflow_name, aw.category
     FROM automation_enrollments ae
     JOIN automation_workflows aw ON aw.id = ae.workflow_id
     WHERE ae.org_id = $1 AND ae.contact_email = $2
     ORDER BY ae.enrolled_at DESC`,
    [req.user.orgId, contactEmail]
  );
  
  // Get step executions for each enrollment
  const journeys = [];
  for (const enrollment of enrollments) {
    const { rows: executions } = await db.query(
      `SELECT ase.*, ast.step_type, ast.channel, ast.step_order
       FROM automation_step_executions ase
       JOIN automation_steps ast ON ast.id = ase.step_id
       WHERE ase.enrollment_id = $1
       ORDER BY ase.executed_at ASC`,
      [enrollment.id]
    );
    
    journeys.push({
      enrollment,
      steps: executions
    });
  }
  
  // Get lead score history
  const { rows: scoreHistory } = await db.query(
    `SELECT * FROM automation_lead_scores
     WHERE org_id = $1 AND contact_email = $2
     ORDER BY created_at DESC
     LIMIT 50`,
    [req.user.orgId, contactEmail]
  );
  
  // Get tags
  const { rows: tags } = await db.query(
    `SELECT * FROM automation_contact_tags
     WHERE org_id = $1 AND contact_email = $2
     ORDER BY created_at DESC`,
    [req.user.orgId, contactEmail]
  );
  
  res.json({
    contactEmail,
    journeys,
    scoreHistory,
    tags
  });
}

/**
 * Get goal conversion analytics
 */
async function getGoalAnalytics(req, res) {
  const { workflowId } = req.params;
  
  // Verify workflow ownership
  const { rows: workflows } = await db.query(
    `SELECT id, name, goal_type, goal_config FROM automation_workflows 
     WHERE id = $1 AND org_id = $2`,
    [workflowId, req.user.orgId]
  );
  
  if (!workflows.length) {
    return res.status(404).json({ error: 'Workflow not found.' });
  }
  
  const workflow = workflows[0];
  
  // Get goal stats
  const { rows: goalStats } = await db.query(
    `SELECT * FROM automation_goals WHERE workflow_id = $1`,
    [workflowId]
  );
  
  // Get conversion timeline
  const { rows: timeline } = await db.query(
    `SELECT 
       DATE(goal_achieved_at) as date,
       COUNT(*) as conversions
     FROM automation_enrollments
     WHERE workflow_id = $1 AND goal_achieved = true
     GROUP BY DATE(goal_achieved_at)
     ORDER BY date DESC
     LIMIT 30`,
    [workflowId]
  );
  
  // Get time to conversion stats
  const { rows: timeStats } = await db.query(
    `SELECT 
       AVG(EXTRACT(EPOCH FROM (goal_achieved_at - enrolled_at)) / 3600) as avg_hours,
       MIN(EXTRACT(EPOCH FROM (goal_achieved_at - enrolled_at)) / 3600) as min_hours,
       MAX(EXTRACT(EPOCH FROM (goal_achieved_at - enrolled_at)) / 3600) as max_hours,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (goal_achieved_at - enrolled_at)) / 3600) as median_hours
     FROM automation_enrollments
     WHERE workflow_id = $1 AND goal_achieved = true`,
    [workflowId]
  );
  
  res.json({
    workflow: {
      id: workflow.id,
      name: workflow.name,
      goalType: workflow.goal_type,
      goalConfig: workflow.goal_config
    },
    stats: goalStats[0] || {},
    timeline,
    timeToConversion: timeStats[0] ? {
      avgHours: parseFloat(timeStats[0].avg_hours || 0).toFixed(2),
      minHours: parseFloat(timeStats[0].min_hours || 0).toFixed(2),
      maxHours: parseFloat(timeStats[0].max_hours || 0).toFixed(2),
      medianHours: parseFloat(timeStats[0].median_hours || 0).toFixed(2)
    } : null
  });
}

/**
 * Get split test analytics
 */
async function getSplitTestAnalytics(req, res) {
  const { workflowId } = req.params;
  
  // Get all split tests for workflow
  const { rows: tests } = await db.query(
    `SELECT st.*, ast.step_order, ast.step_type
     FROM automation_split_tests st
     JOIN automation_steps ast ON ast.id = st.step_id
     WHERE st.workflow_id = $1
     ORDER BY ast.step_order`,
    [workflowId]
  );
  
  const results = tests.map(test => {
    const variantARate = test.variant_a_count > 0
      ? ((test.variant_a_goal_achieved / test.variant_a_count) * 100).toFixed(2)
      : 0;
    
    const variantBRate = test.variant_b_count > 0
      ? ((test.variant_b_goal_achieved / test.variant_b_count) * 100).toFixed(2)
      : 0;
    
    // Calculate statistical significance (simplified chi-square test)
    const totalA = test.variant_a_count;
    const totalB = test.variant_b_count;
    const successA = test.variant_a_goal_achieved;
    const successB = test.variant_b_goal_achieved;
    
    let pValue = null;
    let isSignificant = false;
    
    if (totalA > 0 && totalB > 0) {
      const pooledRate = (successA + successB) / (totalA + totalB);
      const expectedA = totalA * pooledRate;
      const expectedB = totalB * pooledRate;
      
      if (expectedA > 5 && expectedB > 5) {
        const chiSquare = 
          Math.pow(successA - expectedA, 2) / expectedA +
          Math.pow(successB - expectedB, 2) / expectedB;
        
        // Simplified: chi-square > 3.841 means p < 0.05 (95% confidence)
        isSignificant = chiSquare > 3.841;
        pValue = chiSquare > 3.841 ? '< 0.05' : '>= 0.05';
      }
    }
    
    return {
      ...test,
      variantAConversionRate: variantARate,
      variantBConversionRate: variantBRate,
      lift: variantARate > 0 ? (((variantBRate - variantARate) / variantARate) * 100).toFixed(2) : 0,
      isSignificant,
      pValue
    };
  });
  
  res.json({ splitTests: results });
}

/**
 * Get lead scoring analytics
 */
async function getLeadScoringAnalytics(req, res) {
  const { startDate, endDate } = req.query;
  
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];
  
  // Score distribution
  const { rows: distribution } = await db.query(
    `WITH latest_scores AS (
       SELECT DISTINCT ON (contact_email)
         contact_email,
         new_score
       FROM automation_lead_scores
       WHERE org_id = $1
       ORDER BY contact_email, created_at DESC
     )
     SELECT 
       CASE 
         WHEN new_score < 25 THEN '0-24'
         WHEN new_score < 50 THEN '25-49'
         WHEN new_score < 75 THEN '50-74'
         WHEN new_score < 100 THEN '75-99'
         ELSE '100+'
       END as score_range,
       COUNT(*) as count
     FROM latest_scores
     GROUP BY score_range
     ORDER BY score_range`,
    [req.user.orgId]
  );
  
  // Top scoring contacts
  const { rows: topContacts } = await db.query(
    `SELECT DISTINCT ON (contact_email)
       contact_email,
       new_score as current_score,
       created_at as last_updated
     FROM automation_lead_scores
     WHERE org_id = $1
     ORDER BY contact_email, created_at DESC
     LIMIT 20`,
    [req.user.orgId]
  );
  
  // Score changes over time
  const { rows: timeline } = await db.query(
    `SELECT 
       DATE(created_at) as date,
       AVG(score_change) as avg_change,
       COUNT(*) as total_changes
     FROM automation_lead_scores
     WHERE org_id = $1 AND created_at >= $2 AND created_at <= $3
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [req.user.orgId, start, end]
  );
  
  res.json({
    dateRange: { start, end },
    distribution,
    topContacts: topContacts.sort((a, b) => b.current_score - a.current_score),
    timeline
  });
}

/**
 * Get workflow summary metrics
 */
async function getWorkflowSummary(req, res) {
  const { workflowId } = req.params;
  const summary = await MarketingAutomationService.getWorkflowSummary(
    workflowId,
    req.user.orgId
  );
  res.json({ summary });
}

/**
 * Get automation performance comparison
 */
async function compareWorkflows(req, res) {
  const { workflowIds } = req.query; // Comma-separated list
  
  if (!workflowIds) {
    return res.status(400).json({ error: 'workflowIds query parameter is required.' });
  }
  
  const ids = workflowIds.split(',').map(id => id.trim());
  
  const comparisons = [];
  for (const workflowId of ids) {
    const summary = await MarketingAutomationService.getWorkflowSummary(
      workflowId,
      req.user.orgId
    );
    
    const { rows: workflows } = await db.query(
      `SELECT id, name, category, created_at FROM automation_workflows 
       WHERE id = $1 AND org_id = $2`,
      [workflowId, req.user.orgId]
    );
    
    if (workflows.length > 0) {
      comparisons.push({
        workflow: workflows[0],
        metrics: summary
      });
    }
  }
  
  res.json({ comparisons });
}

/**
 * Export analytics data
 */
async function exportAnalytics(req, res) {
  const { workflowId } = req.params;
  const { format = 'json', startDate, endDate } = req.query;
  
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];
  
  const analytics = await MarketingAutomationService.getAnalytics(
    workflowId,
    req.user.orgId,
    start,
    end
  );
  
  const summary = await MarketingAutomationService.getWorkflowSummary(
    workflowId,
    req.user.orgId
  );
  
  const data = {
    workflowId,
    dateRange: { start, end },
    summary,
    dailyAnalytics: analytics
  };
  
  if (format === 'csv') {
    // Convert to CSV format
    const csv = convertToCSV(analytics);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="automation-analytics-${workflowId}.csv"`);
    res.send(csv);
  } else {
    res.json(data);
  }
}

/**
 * Helper: Convert analytics to CSV
 */
function convertToCSV(analytics) {
  if (!analytics || analytics.length === 0) {
    return 'No data available';
  }
  
  const headers = Object.keys(analytics[0]).join(',');
  const rows = analytics.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

module.exports = {
  getWorkflowAnalytics,
  getWorkflowSummary,
  getOrgAnalytics,
  getContactJourney,
  getGoalAnalytics,
  getSplitTestAnalytics,
  getLeadScoringAnalytics,
  compareWorkflows,
  exportAnalytics
};
