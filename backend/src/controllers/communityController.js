const communityService = require('../services/communityService');
const asyncHandler = require('../utils/asyncHandler');
const { validate } = require('../utils/validator');

/**
 * Community Platform Controller
 * Handles all community/membership platform operations
 * Benchmark: Circle / Mighty Networks
 */

// ==================== SPACES ====================

/**
 * Get all spaces for organization
 * GET /api/v1/community/spaces
 */
exports.getSpaces = asyncHandler(async (req, res) => {
  const { space_type, is_active, limit, offset } = req.query;
  
  const spaces = await communityService.getSpaces(req.user.orgId, {
    space_type,
    is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0
  });

  res.json({ spaces });
});

/**
 * Get single space by ID
 * GET /api/v1/community/spaces/:id
 */
exports.getSpace = asyncHandler(async (req, res) => {
  const space = await communityService.findById(req.params.id);
  
  if (!space || space.org_id !== req.user.orgId) {
    return res.status(404).json({ error: 'Space not found' });
  }

  res.json({ space });
});

/**
 * Create new space
 * POST /api/v1/community/spaces
 */
exports.createSpace = asyncHandler(async (req, res) => {
  const validation = validate(req.body, {
    name: { required: true, minLength: 1, maxLength: 100 },
    slug: { required: true, pattern: /^[a-z0-9-]+$/ },
    description: { maxLength: 1000 },
    space_type: { enum: ['public', 'private', 'secret'] },
    icon_url: { url: true },
    cover_image_url: { url: true }
  });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors[0] });
  }

  const space = await communityService.createSpace(
    req.user.orgId,
    req.user.id,
    req.body
  );

  res.status(201).json({ space });
});

/**
 * Update space
 * PUT /api/v1/community/spaces/:id
 */
exports.updateSpace = asyncHandler(async (req, res) => {
  const space = await communityService.findById(req.params.id);
  
  if (!space || space.org_id !== req.user.orgId) {
    return res.status(404).json({ error: 'Space not found' });
  }

  const validation = validate(req.body, {
    name: { minLength: 1, maxLength: 100 },
    description: { maxLength: 1000 },
    space_type: { enum: ['public', 'private', 'secret'] },
    icon_url: { url: true },
    cover_image_url: { url: true }
  });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors[0] });
  }

  const updated = await communityService.update(req.params.id, req.body);
  res.json({ space: updated });
});

/**
 * Delete space
 * DELETE /api/v1/community/spaces/:id
 */
exports.deleteSpace = asyncHandler(async (req, res) => {
  const space = await communityService.findById(req.params.id);
  
  if (!space || space.org_id !== req.user.orgId) {
    return res.status(404).json({ error: 'Space not found' });
  }

  await communityService.delete(req.params.id);
  res.json({ message: 'Space deleted successfully' });
});

/**
 * Join a space
 * POST /api/v1/community/spaces/:id/join
 */
exports.joinSpace = asyncHandler(async (req, res) => {
  const space = await communityService.findById(req.params.id);
  
  if (!space || space.org_id !== req.user.orgId) {
    return res.status(404).json({ error: 'Space not found' });
  }

  const membership = await communityService.joinSpace(
    req.params.id,
    req.user.id,
    req.body.role || 'member'
  );

  res.json({ membership });
});

/**
 * Leave a space
 * POST /api/v1/community/spaces/:id/leave
 */
exports.leaveSpace = asyncHandler(async (req, res) => {
  await communityService.leaveSpace(req.params.id, req.user.id);
  res.json({ message: 'Left space successfully' });
});

/**
 * Get space members
 * GET /api/v1/community/spaces/:id/members
 */
exports.getSpaceMembers = asyncHandler(async (req, res) => {
  const members = await communityService.getSpaceMembers(req.params.id);
  res.json({ members });
});

/**
 * Update member role
 * PUT /api/v1/community/spaces/:id/members/:userId
 */
exports.updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  
  if (!['admin', 'moderator', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const updated = await communityService.updateMemberRole(
    req.params.id,
    req.params.userId,
    role
  );

  res.json({ membership: updated });
});

/**
 * Remove member from space
 * DELETE /api/v1/community/spaces/:id/members/:userId
 */
exports.removeMember = asyncHandler(async (req, res) => {
  await communityService.removeMember(req.params.id, req.params.userId);
  res.json({ message: 'Member removed successfully' });
});

// ==================== POSTS ====================

/**
 * Get posts in a space
 * GET /api/v1/community/spaces/:spaceId/posts
 */
exports.getPosts = asyncHandler(async (req, res) => {
  const { post_type, limit, offset } = req.query;
  
  const posts = await communityService.getPosts(req.params.spaceId, {
    post_type,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0
  });

  res.json({ posts });
});

/**
 * Get single post
 * GET /api/v1/community/posts/:id
 */
exports.getPost = asyncHandler(async (req, res) => {
  const post = await communityService.getPostById(req.params.id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  res.json({ post });
});

/**
 * Create post
 * POST /api/v1/community/spaces/:spaceId/posts
 */
exports.createPost = asyncHandler(async (req, res) => {
  const validation = validate(req.body, {
    content: { required: true, minLength: 1 },
    title: { maxLength: 200 },
    post_type: { enum: ['discussion', 'question', 'announcement', 'poll'] }
  });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors[0] });
  }

  const post = await communityService.createPost(
    req.params.spaceId,
    req.user.id,
    req.body
  );

  res.status(201).json({ post });
});

/**
 * Update post
 * PUT /api/v1/community/posts/:id
 */
exports.updatePost = asyncHandler(async (req, res) => {
  const post = await communityService.getPostById(req.params.id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (post.author_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to edit this post' });
  }

  const updated = await communityService.updatePost(req.params.id, req.body);
  res.json({ post: updated });
});

/**
 * Delete post
 * DELETE /api/v1/community/posts/:id
 */
exports.deletePost = asyncHandler(async (req, res) => {
  const post = await communityService.getPostById(req.params.id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (post.author_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this post' });
  }

  await communityService.deletePost(req.params.id);
  res.json({ message: 'Post deleted successfully' });
});

/**
 * Pin/unpin post
 * POST /api/v1/community/posts/:id/pin
 */
exports.togglePinPost = asyncHandler(async (req, res) => {
  const updated = await communityService.togglePinPost(req.params.id);
  res.json({ post: updated });
});

/**
 * Lock/unlock post
 * POST /api/v1/community/posts/:id/lock
 */
exports.toggleLockPost = asyncHandler(async (req, res) => {
  const updated = await communityService.toggleLockPost(req.params.id);
  res.json({ post: updated });
});

// ==================== COMMENTS ====================

/**
 * Get comments for a post
 * GET /api/v1/community/posts/:postId/comments
 */
exports.getComments = asyncHandler(async (req, res) => {
  const comments = await communityService.getComments(req.params.postId);
  res.json({ comments });
});

/**
 * Create comment
 * POST /api/v1/community/posts/:postId/comments
 */
exports.createComment = asyncHandler(async (req, res) => {
  const validation = validate(req.body, {
    content: { required: true, minLength: 1 }
  });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors[0] });
  }

  const comment = await communityService.createComment(
    req.params.postId,
    req.user.id,
    req.body.content,
    req.body.parent_id || null
  );

  res.status(201).json({ comment });
});

/**
 * Update comment
 * PUT /api/v1/community/comments/:id
 */
exports.updateComment = asyncHandler(async (req, res) => {
  const comment = await communityService.getCommentById(req.params.id);
  
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (comment.author_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to edit this comment' });
  }

  const updated = await communityService.updateComment(req.params.id, req.body.content);
  res.json({ comment: updated });
});

/**
 * Delete comment
 * DELETE /api/v1/community/comments/:id
 */
exports.deleteComment = asyncHandler(async (req, res) => {
  const comment = await communityService.getCommentById(req.params.id);
  
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (comment.author_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this comment' });
  }

  await communityService.deleteComment(req.params.id);
  res.json({ message: 'Comment deleted successfully' });
});

/**
 * Mark comment as solution
 * POST /api/v1/community/comments/:id/solution
 */
exports.markAsSolution = asyncHandler(async (req, res) => {
  const updated = await communityService.markCommentAsSolution(req.params.id);
  res.json({ comment: updated });
});

// ==================== EVENTS ====================

/**
 * Get events
 * GET /api/v1/community/events
 */
exports.getEvents = asyncHandler(async (req, res) => {
  const { space_id, upcoming, limit } = req.query;
  
  const events = await communityService.getEvents(req.user.orgId, {
    space_id,
    upcoming: upcoming === 'true',
    limit: limit ? parseInt(limit) : 50
  });

  res.json({ events });
});

/**
 * Get single event
 * GET /api/v1/community/events/:id
 */
exports.getEvent = asyncHandler(async (req, res) => {
  const event = await communityService.getEventById(req.params.id);
  
  if (!event || event.org_id !== req.user.orgId) {
    return res.status(404).json({ error: 'Event not found' });
  }

  res.json({ event });
});

/**
 * Create event
 * POST /api/v1/community/events
 */
exports.createEvent = asyncHandler(async (req, res) => {
  const validation = validate(req.body, {
    title: { required: true, minLength: 1, maxLength: 200 },
    start_time: { required: true },
    event_type: { enum: ['online', 'in_person', 'hybrid'] }
  });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors[0] });
  }

  const event = await communityService.createEvent(
    req.user.orgId,
    req.user.id,
    req.body
  );

  res.status(201).json({ event });
});

/**
 * Update event
 * PUT /api/v1/community/events/:id
 */
exports.updateEvent = asyncHandler(async (req, res) => {
  const event = await communityService.getEventById(req.params.id);
  
  if (!event || event.org_id !== req.user.orgId) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const updated = await communityService.updateEvent(req.params.id, req.body);
  res.json({ event: updated });
});

/**
 * Delete event
 * DELETE /api/v1/community/events/:id
 */
exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await communityService.getEventById(req.params.id);
  
  if (!event || event.org_id !== req.user.orgId) {
    return res.status(404).json({ error: 'Event not found' });
  }

  await communityService.deleteEvent(req.params.id);
  res.json({ message: 'Event deleted successfully' });
});

/**
 * RSVP to event
 * POST /api/v1/community/events/:id/rsvp
 */
exports.rsvpEvent = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['going', 'maybe', 'not_going'].includes(status)) {
    return res.status(400).json({ error: 'Invalid RSVP status' });
  }

  const rsvp = await communityService.rsvpEvent(
    req.params.id,
    req.user.id,
    status
  );

  res.json({ rsvp });
});

/**
 * Get event attendees
 * GET /api/v1/community/events/:id/attendees
 */
exports.getEventAttendees = asyncHandler(async (req, res) => {
  const attendees = await communityService.getEventAttendees(req.params.id);
  res.json({ attendees });
});

// ==================== REACTIONS ====================

/**
 * Add reaction
 * POST /api/v1/community/reactions
 */
exports.addReaction = asyncHandler(async (req, res) => {
  const { target_type, target_id, reaction_type } = req.body;
  
  const validation = validate(req.body, {
    target_type: { required: true, enum: ['post', 'comment'] },
    target_id: { required: true },
    reaction_type: { enum: ['like', 'love', 'celebrate', 'insightful'] }
  });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors[0] });
  }

  const reaction = await communityService.addReaction(
    req.user.id,
    target_type,
    target_id,
    reaction_type || 'like'
  );

  res.json({ reaction });
});

/**
 * Remove reaction
 * DELETE /api/v1/community/reactions/:targetType/:targetId
 */
exports.removeReaction = asyncHandler(async (req, res) => {
  await communityService.removeReaction(
    req.user.id,
    req.params.targetType,
    req.params.targetId
  );

  res.json({ message: 'Reaction removed successfully' });
});

// ==================== MEMBER PROFILES ====================

/**
 * Get member profile
 * GET /api/v1/community/members/:userId/profile
 */
exports.getMemberProfile = asyncHandler(async (req, res) => {
  const profile = await communityService.getMemberProfile(
    req.user.orgId,
    req.params.userId
  );

  res.json({ profile });
});

/**
 * Update member profile
 * PUT /api/v1/community/members/profile
 */
exports.updateMemberProfile = asyncHandler(async (req, res) => {
  const profile = await communityService.updateMemberProfile(
    req.user.orgId,
    req.user.id,
    req.body
  );

  res.json({ profile });
});

/**
 * Get all members
 * GET /api/v1/community/members
 */
exports.getMembers = asyncHandler(async (req, res) => {
  const members = await communityService.getMembers(req.user.orgId, req.query);
  res.json({ members });
});

// ==================== MEMBER TIERS ====================

/**
 * Get all tiers
 * GET /api/v1/community/tiers
 */
exports.getTiers = asyncHandler(async (req, res) => {
  const tiers = await communityService.getTiers(req.user.orgId);
  res.json({ tiers });
});

/**
 * Create tier
 * POST /api/v1/community/tiers
 */
exports.createTier = asyncHandler(async (req, res) => {
  const validation = validate(req.body, {
    name: { required: true, minLength: 1, maxLength: 100 }
  });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors[0] });
  }

  const tier = await communityService.createTier(req.user.orgId, req.body);
  res.status(201).json({ tier });
});

/**
 * Update tier
 * PUT /api/v1/community/tiers/:id
 */
exports.updateTier = asyncHandler(async (req, res) => {
  const tier = await communityService.updateTier(req.params.id, req.body);
  res.json({ tier });
});

/**
 * Delete tier
 * DELETE /api/v1/community/tiers/:id
 */
exports.deleteTier = asyncHandler(async (req, res) => {
  await communityService.deleteTier(req.params.id);
  res.json({ message: 'Tier deleted successfully' });
});

/**
 * Assign tier to member
 * POST /api/v1/community/members/:userId/tiers/:tierId
 */
exports.assignTier = asyncHandler(async (req, res) => {
  const assignment = await communityService.assignTier(
    req.params.userId,
    req.params.tierId,
    req.body.expires_at
  );

  res.json({ assignment });
});

// ==================== NOTIFICATIONS ====================

/**
 * Get notifications
 * GET /api/v1/community/notifications
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const { is_read, limit } = req.query;
  
  const notifications = await communityService.getNotifications(req.user.id, {
    is_read: is_read === 'true' ? true : is_read === 'false' ? false : undefined,
    limit: limit ? parseInt(limit) : 50
  });

  res.json({ notifications });
});

/**
 * Mark notification as read
 * PUT /api/v1/community/notifications/:id/read
 */
exports.markNotificationRead = asyncHandler(async (req, res) => {
  await communityService.markNotificationRead(req.params.id);
  res.json({ message: 'Notification marked as read' });
});

/**
 * Mark all notifications as read
 * PUT /api/v1/community/notifications/read-all
 */
exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  await communityService.markAllNotificationsRead(req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

// ==================== ACTIVITY FEED ====================

/**
 * Get activity feed
 * GET /api/v1/community/activity
 */
exports.getActivityFeed = asyncHandler(async (req, res) => {
  const { space_id, limit } = req.query;
  
  const activities = await communityService.getActivityFeed(req.user.orgId, {
    space_id,
    limit: limit ? parseInt(limit) : 50
  });

  res.json({ activities });
});

// ==================== ANALYTICS ====================

/**
 * Get community analytics
 * GET /api/v1/community/analytics
 */
exports.getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await communityService.getAnalytics(req.user.orgId);
  res.json({ analytics });
});

/**
 * Get space analytics
 * GET /api/v1/community/spaces/:id/analytics
 */
exports.getSpaceAnalytics = asyncHandler(async (req, res) => {
  const analytics = await communityService.getSpaceAnalytics(req.params.id);
  res.json({ analytics });
});
