const ContentCalendarService = require('../services/content-calendar/ContentCalendarService');
const asyncHandler = require('../utils/asyncHandler');

// Content Items
exports.createContent = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const content = await ContentCalendarService.createContent(orgId, req.body);
  res.status(201).json({ content });
});

exports.getContent = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const result = await ContentCalendarService.getContent(orgId, req.query);
  res.json(result);
});

exports.getContentById = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { id } = req.params;
  
  const { rows } = await require('../db').query(
    `SELECT ci.*, cc.name as campaign_name
     FROM content_items ci
     LEFT JOIN content_campaigns cc ON ci.campaign_id = cc.id
     WHERE ci.id = $1 AND ci.org_id = $2`,
    [id, orgId]
  );
  
  if (!rows.length) {
    return res.status(404).json({ error: 'Content not found' });
  }
  
  res.json({ content: rows[0] });
});

exports.updateContent = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { id } = req.params;
  const content = await ContentCalendarService.updateContent(orgId, id, req.body);
  res.json({ content });
});

exports.deleteContent = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { id } = req.params;
  await ContentCalendarService.deleteContent(orgId, id);
  res.json({ ok: true });
});

// Campaigns
exports.createCampaign = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const campaign = await ContentCalendarService.createCampaign(orgId, req.body);
  res.status(201).json({ campaign });
});

exports.getCampaigns = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { status } = req.query;
  const campaigns = await ContentCalendarService.getCampaigns(orgId, status);
  res.json({ campaigns });
});

exports.updateCampaign = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { id } = req.params;
  const campaign = await ContentCalendarService.updateCampaign(orgId, id, req.body);
  res.json({ campaign });
});

// Templates
exports.createTemplate = asyncHandler(async (req, res) => {
  const { orgId, id: userId } = req.user;
  const template = await ContentCalendarService.createTemplate(orgId, userId, req.body);
  res.status(201).json({ template });
});

exports.getTemplates = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { contentType } = req.query;
  const templates = await ContentCalendarService.getTemplates(orgId, contentType);
  res.json({ templates });
});

// Approvals
exports.requestApproval = asyncHandler(async (req, res) => {
  const { contentId, approverId } = req.body;
  const approval = await ContentCalendarService.requestApproval(contentId, approverId);
  res.status(201).json({ approval });
});

exports.updateApproval = asyncHandler(async (req, res) => {
  const { id: approverId } = req.user;
  const { id } = req.params;
  const { status, comments } = req.body;
  const approval = await ContentCalendarService.updateApproval(id, approverId, status, comments);
  res.json({ approval });
});

exports.getPendingApprovals = asyncHandler(async (req, res) => {
  const { id: approverId } = req.user;
  const approvals = await ContentCalendarService.getPendingApprovals(approverId);
  res.json({ approvals });
});

// Comments
exports.addComment = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { contentId } = req.params;
  const { commentText, mentions } = req.body;
  const comment = await ContentCalendarService.addComment(contentId, userId, commentText, mentions);
  res.status(201).json({ comment });
});

exports.getComments = asyncHandler(async (req, res) => {
  const { contentId } = req.params;
  const comments = await ContentCalendarService.getComments(contentId);
  res.json({ comments });
});

// Publishing Connections
exports.saveConnection = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { platform, accountName, credentials } = req.body;
  const connection = await ContentCalendarService.saveConnection(orgId, platform, accountName, credentials);
  res.json({ connection });
});

exports.getConnections = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const connections = await ContentCalendarService.getConnections(orgId);
  res.json({ connections });
});

// Calendar View
exports.getCalendarData = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }
  
  const items = await ContentCalendarService.getCalendarData(orgId, startDate, endDate);
  res.json({ items });
});
