const db = require('../db');
const BaseService = require('./base/BaseService');

/**
 * Community Platform Service
 * Handles community spaces, posts, comments, members, events, and engagement
 * Benchmark: Circle / Mighty Networks
 */
class CommunityService extends BaseService {
  constructor() {
    super('community_spaces');
  }

  // ==================== SPACES ====================

  async createSpace(orgId, userId, spaceData) {
    const { name, slug, description, icon_url, cover_image_url, space_type, settings } = spaceData;

    const { rows } = await db.query(
      `INSERT INTO community_spaces (
        org_id, name, slug, description, icon_url, cover_image_url, 
        space_type, settings, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [orgId, name, slug, description, icon_url, cover_image_url, space_type || 'public', 
       JSON.stringify(settings || {}), userId]
    );

    // Auto-join creator as admin
    await this.joinSpace(rows[0].id, userId, 'admin');

    return rows[0];
  }

  async getSpaces(orgId, filters = {}) {
    const { space_type, is_active, limit = 50, offset = 0 } = filters;
    
    let query = 'SELECT * FROM community_spaces WHERE org_id = $1';
    const params = [orgId];
    let paramCount = 1;

    if (space_type) {
      paramCount++;
      query += ` AND space_type = $${paramCount}`;
      params.push(space_type);
    }

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
  }

  async joinSpace(spaceId, userId, role = 'member') {
    const { rows } = await db.query(
      `INSERT INTO community_space_members (space_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (space_id, user_id) DO UPDATE SET role = $3
       RETURNING *`,
      [spaceId, userId, role]
    );

    // Update member count
    await db.query(
      'UPDATE community_spaces SET member_count = member_count + 1 WHERE id = $1',
      [spaceId]
    );

    return rows[0];
  }

  // ==================== POSTS ====================

  async createPost(spaceId, userId, postData) {
    const { title, content, post_type, tags, attachments } = postData;

    const { rows } = await db.query(
      `INSERT INTO community_posts (
        space_id, author_id, title, content, post_type, tags, attachments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [spaceId, userId, title, content, post_type || 'discussion', 
       tags || [], JSON.stringify(attachments || [])]
    );

    // Update space post count
    await db.query(
      'UPDATE community_spaces SET post_count = post_count + 1 WHERE id = $1',
      [spaceId]
    );

    // Update member profile post count
    await db.query(
      `INSERT INTO community_member_profiles (org_id, user_id, post_count)
       VALUES ((SELECT org_id FROM community_spaces WHERE id = $1), $2, 1)
       ON CONFLICT (org_id, user_id) DO UPDATE SET post_count = community_member_profiles.post_count + 1`,
      [spaceId, userId]
    );

    return rows[0];
  }

  async getPosts(spaceId, filters = {}) {
    const { post_type, limit = 50, offset = 0 } = filters;
    
    let query = `
      SELECT p.*, u.name as author_name, u.email as author_email
      FROM community_posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.space_id = $1
    `;
    const params = [spaceId];
    let paramCount = 1;

    if (post_type) {
      paramCount++;
      query += ` AND p.post_type = $${paramCount}`;
      params.push(post_type);
    }

    query += ` ORDER BY p.is_pinned DESC, p.last_activity_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
  }

  // ==================== COMMENTS ====================

  async createComment(postId, userId, content, parentId = null) {
    const { rows } = await db.query(
      `INSERT INTO community_comments (post_id, author_id, content, parent_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [postId, userId, content, parentId]
    );

    // Update post comment count
    await db.query(
      'UPDATE community_posts SET comment_count = comment_count + 1, last_activity_at = NOW() WHERE id = $1',
      [postId]
    );

    return rows[0];
  }

  async getComments(postId) {
    const { rows } = await db.query(
      `SELECT c.*, u.name as author_name, u.email as author_email
       FROM community_comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );
    return rows;
  }

  // ==================== EVENTS ====================

  async createEvent(orgId, userId, eventData) {
    const {
      space_id, title, description, event_type, start_time, end_time,
      timezone, location, meeting_url, cover_image_url, max_attendees
    } = eventData;

    const { rows } = await db.query(
      `INSERT INTO community_events (
        org_id, space_id, title, description, event_type, start_time, end_time,
        timezone, location, meeting_url, cover_image_url, max_attendees, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [orgId, space_id, title, description, event_type || 'online', start_time, end_time,
       timezone || 'UTC', location, meeting_url, cover_image_url, max_attendees, userId]
    );

    return rows[0];
  }

  async getEvents(orgId, filters = {}) {
    const { space_id, upcoming, limit = 50 } = filters;
    
    let query = 'SELECT * FROM community_events WHERE org_id = $1';
    const params = [orgId];
    let paramCount = 1;

    if (space_id) {
      paramCount++;
      query += ` AND space_id = $${paramCount}`;
      params.push(space_id);
    }

    if (upcoming) {
      query += ' AND start_time > NOW()';
    }

    query += ` ORDER BY start_time ASC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const { rows } = await db.query(query, params);
    return rows;
  }

  async rsvpEvent(eventId, userId, status = 'going') {
    const { rows } = await db.query(
      `INSERT INTO community_event_attendees (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3
       RETURNING *`,
      [eventId, userId, status]
    );

    // Update attendee count
    await db.query(
      `UPDATE community_events SET attendee_count = (
        SELECT COUNT(*) FROM community_event_attendees WHERE event_id = $1 AND status = 'going'
      ) WHERE id = $1`,
      [eventId]
    );

    return rows[0];
  }

  // ==================== REACTIONS ====================

  async addReaction(userId, targetType, targetId, reactionType = 'like') {
    const { rows } = await db.query(
      `INSERT INTO community_reactions (user_id, target_type, target_id, reaction_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, target_type, target_id) DO UPDATE SET reaction_type = $4
       RETURNING *`,
      [userId, targetType, targetId, reactionType]
    );

    // Update like count
    const table = targetType === 'post' ? 'community_posts' : 'community_comments';
    await db.query(
      `UPDATE ${table} SET like_count = (
        SELECT COUNT(*) FROM community_reactions WHERE target_type = $1 AND target_id = $2
      ) WHERE id = $2`,
      [targetType, targetId]
    );

    return rows[0];
  }

  // ==================== MEMBER PROFILES ====================

  async getMemberProfile(orgId, userId) {
    const { rows } = await db.query(
      `SELECT * FROM community_member_profiles WHERE org_id = $1 AND user_id = $2`,
      [orgId, userId]
    );
    return rows[0];
  }

  async updateMemberProfile(orgId, userId, profileData) {
    const { display_name, bio, avatar_url, location, website, social_links } = profileData;

    const { rows } = await db.query(
      `INSERT INTO community_member_profiles (
        org_id, user_id, display_name, bio, avatar_url, location, website, social_links
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (org_id, user_id) DO UPDATE SET
        display_name = $3, bio = $4, avatar_url = $5, location = $6, 
        website = $7, social_links = $8, updated_at = NOW()
       RETURNING *`,
      [orgId, userId, display_name, bio, avatar_url, location, website, 
       JSON.stringify(social_links || {})]
    );

    return rows[0];
  }

  // ==================== ACTIVITY FEED ====================

  async getActivityFeed(orgId, filters = {}) {
    const { space_id, limit = 50 } = filters;
    
    let query = `
      SELECT a.*, u.name as actor_name
      FROM community_activity_feed a
      JOIN users u ON a.actor_id = u.id
      WHERE a.org_id = $1
    `;
    const params = [orgId];
    let paramCount = 1;

    if (space_id) {
      paramCount++;
      query += ` AND a.space_id = $${paramCount}`;
      params.push(space_id);
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const { rows } = await db.query(query, params);
    return rows;
  }

  async logActivity(orgId, actorId, activityType, targetType, targetId, spaceId = null, metadata = {}) {
    await db.query(
      `INSERT INTO community_activity_feed (
        org_id, space_id, actor_id, activity_type, target_type, target_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orgId, spaceId, actorId, activityType, targetType, targetId, JSON.stringify(metadata)]
    );
  }

  // ==================== ADDITIONAL SPACE METHODS ====================

  async leaveSpace(spaceId, userId) {
    await db.query(
      'DELETE FROM community_space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    );

    // Update member count
    await db.query(
      'UPDATE community_spaces SET member_count = member_count - 1 WHERE id = $1',
      [spaceId]
    );
  }

  async getSpaceMembers(spaceId) {
    const { rows } = await db.query(
      `SELECT m.*, u.name as user_name, u.email as user_email
       FROM community_space_members m
       JOIN users u ON m.user_id = u.id
       WHERE m.space_id = $1
       ORDER BY m.joined_at DESC`,
      [spaceId]
    );
    return rows;
  }

  async updateMemberRole(spaceId, userId, role) {
    const { rows } = await db.query(
      `UPDATE community_space_members SET role = $1
       WHERE space_id = $2 AND user_id = $3
       RETURNING *`,
      [role, spaceId, userId]
    );
    return rows[0];
  }

  async removeMember(spaceId, userId) {
    await db.query(
      'DELETE FROM community_space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    );

    // Update member count
    await db.query(
      'UPDATE community_spaces SET member_count = member_count - 1 WHERE id = $1',
      [spaceId]
    );
  }

  // ==================== ADDITIONAL POST METHODS ====================

  async getPostById(postId) {
    const { rows } = await db.query(
      `SELECT p.*, u.name as author_name, u.email as author_email
       FROM community_posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.id = $1`,
      [postId]
    );
    return rows[0];
  }

  async updatePost(postId, updates) {
    const { title, content, tags, attachments } = updates;
    const { rows } = await db.query(
      `UPDATE community_posts SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        tags = COALESCE($3, tags),
        attachments = COALESCE($4, attachments),
        updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, content, tags, attachments ? JSON.stringify(attachments) : null, postId]
    );
    return rows[0];
  }

  async deletePost(postId) {
    await db.query('DELETE FROM community_posts WHERE id = $1', [postId]);
  }

  async togglePinPost(postId) {
    const { rows } = await db.query(
      `UPDATE community_posts SET is_pinned = NOT is_pinned
       WHERE id = $1
       RETURNING *`,
      [postId]
    );
    return rows[0];
  }

  async toggleLockPost(postId) {
    const { rows } = await db.query(
      `UPDATE community_posts SET is_locked = NOT is_locked
       WHERE id = $1
       RETURNING *`,
      [postId]
    );
    return rows[0];
  }

  // ==================== ADDITIONAL COMMENT METHODS ====================

  async getCommentById(commentId) {
    const { rows } = await db.query(
      `SELECT c.*, u.name as author_name, u.email as author_email
       FROM community_comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.id = $1`,
      [commentId]
    );
    return rows[0];
  }

  async updateComment(commentId, content) {
    const { rows } = await db.query(
      `UPDATE community_comments SET content = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [content, commentId]
    );
    return rows[0];
  }

  async deleteComment(commentId) {
    await db.query('DELETE FROM community_comments WHERE id = $1', [commentId]);
  }

  async markCommentAsSolution(commentId) {
    const { rows } = await db.query(
      `UPDATE community_comments SET is_solution = true
       WHERE id = $1
       RETURNING *`,
      [commentId]
    );
    return rows[0];
  }

  // ==================== ADDITIONAL EVENT METHODS ====================

  async getEventById(eventId) {
    const { rows } = await db.query(
      'SELECT * FROM community_events WHERE id = $1',
      [eventId]
    );
    return rows[0];
  }

  async updateEvent(eventId, updates) {
    const {
      title, description, event_type, start_time, end_time,
      timezone, location, meeting_url, cover_image_url, max_attendees, is_published
    } = updates;

    const { rows } = await db.query(
      `UPDATE community_events SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        event_type = COALESCE($3, event_type),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        timezone = COALESCE($6, timezone),
        location = COALESCE($7, location),
        meeting_url = COALESCE($8, meeting_url),
        cover_image_url = COALESCE($9, cover_image_url),
        max_attendees = COALESCE($10, max_attendees),
        is_published = COALESCE($11, is_published),
        updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [title, description, event_type, start_time, end_time, timezone,
       location, meeting_url, cover_image_url, max_attendees, is_published, eventId]
    );
    return rows[0];
  }

  async deleteEvent(eventId) {
    await db.query('DELETE FROM community_events WHERE id = $1', [eventId]);
  }

  async getEventAttendees(eventId) {
    const { rows } = await db.query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM community_event_attendees a
       JOIN users u ON a.user_id = u.id
       WHERE a.event_id = $1
       ORDER BY a.registered_at DESC`,
      [eventId]
    );
    return rows;
  }

  // ==================== ADDITIONAL REACTION METHODS ====================

  async removeReaction(userId, targetType, targetId) {
    await db.query(
      'DELETE FROM community_reactions WHERE user_id = $1 AND target_type = $2 AND target_id = $3',
      [userId, targetType, targetId]
    );

    // Update like count
    const table = targetType === 'post' ? 'community_posts' : 'community_comments';
    await db.query(
      `UPDATE ${table} SET like_count = (
        SELECT COUNT(*) FROM community_reactions WHERE target_type = $1 AND target_id = $2
      ) WHERE id = $2`,
      [targetType, targetId]
    );
  }

  // ==================== MEMBER DIRECTORY ====================

  async getMembers(orgId, filters = {}) {
    const { search, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT p.*, u.name, u.email
      FROM community_member_profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.org_id = $1
    `;
    const params = [orgId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      query += ` AND (p.display_name ILIKE $${paramCount} OR u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
  }

  // ==================== MEMBER TIERS ====================

  async getTiers(orgId) {
    const { rows } = await db.query(
      'SELECT * FROM community_member_tiers WHERE org_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    return rows;
  }

  async createTier(orgId, tierData) {
    const { name, description, permissions, badge_icon, badge_color, price_monthly, price_yearly } = tierData;

    const { rows } = await db.query(
      `INSERT INTO community_member_tiers (
        org_id, name, description, permissions, badge_icon, badge_color,
        price_monthly, price_yearly
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [orgId, name, description, JSON.stringify(permissions || {}),
       badge_icon, badge_color, price_monthly, price_yearly]
    );
    return rows[0];
  }

  async updateTier(tierId, updates) {
    const { name, description, permissions, badge_icon, badge_color, price_monthly, price_yearly, is_active } = updates;

    const { rows } = await db.query(
      `UPDATE community_member_tiers SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        permissions = COALESCE($3, permissions),
        badge_icon = COALESCE($4, badge_icon),
        badge_color = COALESCE($5, badge_color),
        price_monthly = COALESCE($6, price_monthly),
        price_yearly = COALESCE($7, price_yearly),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, description, permissions ? JSON.stringify(permissions) : null,
       badge_icon, badge_color, price_monthly, price_yearly, is_active, tierId]
    );
    return rows[0];
  }

  async deleteTier(tierId) {
    await db.query('DELETE FROM community_member_tiers WHERE id = $1', [tierId]);
  }

  async assignTier(userId, tierId, expiresAt = null) {
    const { rows } = await db.query(
      `INSERT INTO community_member_tier_assignments (user_id, tier_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, tier_id) DO UPDATE SET expires_at = $3
       RETURNING *`,
      [userId, tierId, expiresAt]
    );
    return rows[0];
  }

  // ==================== NOTIFICATIONS ====================

  async getNotifications(userId, filters = {}) {
    const { is_read, limit = 50 } = filters;

    let query = 'SELECT * FROM community_notifications WHERE user_id = $1';
    const params = [userId];
    let paramCount = 1;

    if (is_read !== undefined) {
      paramCount++;
      query += ` AND is_read = $${paramCount}`;
      params.push(is_read);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const { rows } = await db.query(query, params);
    return rows;
  }

  async markNotificationRead(notificationId) {
    await db.query(
      'UPDATE community_notifications SET is_read = true WHERE id = $1',
      [notificationId]
    );
  }

  async markAllNotificationsRead(userId) {
    await db.query(
      'UPDATE community_notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );
  }

  // ==================== ANALYTICS ====================

  async getAnalytics(orgId) {
    // Get overall community stats
    const { rows: spaceStats } = await db.query(
      `SELECT 
        COUNT(*) as total_spaces,
        SUM(member_count) as total_members,
        SUM(post_count) as total_posts
       FROM community_spaces WHERE org_id = $1`,
      [orgId]
    );

    const { rows: eventStats } = await db.query(
      `SELECT COUNT(*) as total_events
       FROM community_events WHERE org_id = $1`,
      [orgId]
    );

    const { rows: activeMembers } = await db.query(
      `SELECT COUNT(DISTINCT user_id) as active_members
       FROM community_member_profiles
       WHERE org_id = $1 AND updated_at > NOW() - INTERVAL '30 days'`,
      [orgId]
    );

    return {
      ...spaceStats[0],
      ...eventStats[0],
      ...activeMembers[0]
    };
  }

  async getSpaceAnalytics(spaceId) {
    const { rows: stats } = await db.query(
      `SELECT 
        member_count,
        post_count,
        (SELECT COUNT(*) FROM community_posts WHERE space_id = $1 AND created_at > NOW() - INTERVAL '7 days') as posts_last_7_days,
        (SELECT COUNT(*) FROM community_posts WHERE space_id = $1 AND created_at > NOW() - INTERVAL '30 days') as posts_last_30_days
       FROM community_spaces WHERE id = $1`,
      [spaceId]
    );

    const { rows: topContributors } = await db.query(
      `SELECT u.name, u.email, COUNT(*) as post_count
       FROM community_posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.space_id = $1
       GROUP BY u.id, u.name, u.email
       ORDER BY post_count DESC
       LIMIT 10`,
      [spaceId]
    );

    return {
      ...stats[0],
      top_contributors: topContributors
    };
  }
}

module.exports = new CommunityService();
