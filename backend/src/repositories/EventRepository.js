const BaseRepository = require('./base/BaseRepository');

/**
 * EventRepository - Handles all database operations for events/webinars
 * Extends BaseRepository for common CRUD operations
 */
class EventRepository extends BaseRepository {
  constructor(db) {
    super(db, 'events', {
      primaryKey: 'id',
      timestamps: true
    });
  }

  /**
   * Find all events for an organization with filters
   */
  async findAll(orgId, filters = {}) {
    try {
      const { status, type, startDate, endDate, limit = 50, offset = 0 } = filters;
      
      let query = `
        SELECT e.*, 
               COUNT(DISTINCT er.id) as registration_count,
               COUNT(DISTINCT CASE WHEN er.attended = true THEN er.id END) as attendee_count,
               u.full_name as creator_name
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.org_id = $1
      `;
      
      const params = [orgId];
      let paramIndex = 2;
      
      if (status) {
        query += ` AND e.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (type) {
        query += ` AND e.type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }
      
      if (startDate) {
        query += ` AND e.start_time >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        query += ` AND e.start_time <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      query += `
        GROUP BY e.id, u.full_name
        ORDER BY e.start_time DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);
      
      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('EventRepository: Error finding all events', { orgId, filters, error: error.message });
      throw error;
    }
  }

  /**
   * Find event by ID with full details
   */
  async findByIdWithDetails(id, orgId) {
    try {
      const query = `
        SELECT e.*,
               COUNT(DISTINCT er.id) as registration_count,
               COUNT(DISTINCT CASE WHEN er.attended = true THEN er.id END) as attendee_count,
               COUNT(DISTINCT es.id) as session_count,
               u.full_name as creator_name
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id
        LEFT JOIN event_sessions es ON e.id = es.event_id
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.id = $1 AND e.org_id = $2
        GROUP BY e.id, u.full_name
      `;
      
      const { rows } = await this.db.query(query, [id, orgId]);
      return rows[0] || null;
    } catch (error) {
      this.logger.error('EventRepository: Error finding event by ID with details', { id, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Create new event
   */
  async create(eventData, orgId, userId) {
    try {
      const query = `
        INSERT INTO events (
          org_id, title, description, type, start_time, end_time, timezone,
          duration_minutes, capacity, registration_type, status, branding_settings,
          landing_page_settings, recording_enabled, chat_enabled, qa_enabled,
          polls_enabled, video_provider, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `;
      
      const params = [
        orgId,
        eventData.title,
        eventData.description || null,
        eventData.type || 'live',
        eventData.start_time,
        eventData.end_time,
        eventData.timezone || 'UTC',
        eventData.duration_minutes || null,
        eventData.capacity || 100,
        eventData.registration_type || 'open',
        eventData.status || 'draft',
        JSON.stringify(eventData.branding_settings || {}),
        JSON.stringify(eventData.landing_page_settings || {}),
        eventData.recording_enabled !== false,
        eventData.chat_enabled !== false,
        eventData.qa_enabled !== false,
        eventData.polls_enabled !== false,
        eventData.video_provider || 'daily',
        userId
      ];
      
      const { rows } = await this.db.query(query, params);
      return rows[0];
    } catch (error) {
      this.logger.error('EventRepository: Error creating event', { eventData, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Update event
   */
  async update(id, eventData, orgId) {
    try {
      const fields = [];
      const params = [];
      let paramIndex = 1;
      
      const allowedFields = [
        'title', 'description', 'type', 'start_time', 'end_time', 'timezone',
        'duration_minutes', 'capacity', 'registration_type', 'status',
        'branding_settings', 'landing_page_settings', 'recording_enabled',
        'chat_enabled', 'qa_enabled', 'polls_enabled', 'video_room_url', 'video_room_token'
      ];
      
      for (const field of allowedFields) {
        if (eventData[field] !== undefined) {
          fields.push(`${field} = $${paramIndex}`);
          params.push(
            (field.includes('settings') && typeof eventData[field] === 'object')
              ? JSON.stringify(eventData[field])
              : eventData[field]
          );
          paramIndex++;
        }
      }
      
      if (fields.length === 0) {
        return this.findById(id, orgId);
      }
      
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id, orgId);
      
      const query = `
        UPDATE events
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
        RETURNING *
      `;
      
      const { rows } = await this.db.query(query, params);
      return rows[0] || null;
    } catch (error) {
      this.logger.error('EventRepository: Error updating event', { id, eventData, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete event
   */
  async delete(id, orgId) {
    try {
      const query = 'DELETE FROM events WHERE id = $1 AND org_id = $2 RETURNING *';
      const { rows } = await this.db.query(query, [id, orgId]);
      return rows[0] || null;
    } catch (error) {
      this.logger.error('EventRepository: Error deleting event', { id, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  async getStatistics(orgId, filters = {}) {
    try {
      const { startDate, endDate } = filters;
      
      let query = `
        SELECT 
          COUNT(DISTINCT e.id) as total_events,
          COUNT(DISTINCT CASE WHEN e.status = 'scheduled' THEN e.id END) as scheduled_events,
          COUNT(DISTINCT CASE WHEN e.status = 'live' THEN e.id END) as live_events,
          COUNT(DISTINCT CASE WHEN e.status = 'ended' THEN e.id END) as ended_events,
          COUNT(DISTINCT er.id) as total_registrations,
          COUNT(DISTINCT CASE WHEN er.attended = true THEN er.id END) as total_attendees,
          COALESCE(AVG(CASE WHEN er.attended = true THEN 1.0 ELSE 0 END), 0) as avg_attendance_rate
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id
        WHERE e.org_id = $1
      `;
      
      const params = [orgId];
      let paramIndex = 2;
      
      if (startDate) {
        query += ` AND e.start_time >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        query += ` AND e.start_time <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      const { rows } = await this.db.query(query, params);
      return rows[0];
    } catch (error) {
      this.logger.error('EventRepository: Error getting statistics', { orgId, filters, error: error.message });
      throw error;
    }
  }

  /**
   * Find upcoming events
   */
  async findUpcoming(orgId, limit = 10) {
    try {
      const query = `
        SELECT e.*, 
               COUNT(DISTINCT er.id) as registration_count
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id
        WHERE e.org_id = $1 
          AND e.status IN ('draft', 'scheduled')
          AND e.start_time > CURRENT_TIMESTAMP
        GROUP BY e.id
        ORDER BY e.start_time ASC
        LIMIT $2
      `;
      
      const { rows } = await this.db.query(query, [orgId, limit]);
      return rows;
    } catch (error) {
      this.logger.error('EventRepository: Error finding upcoming events', { orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Find event by slug (for public pages)
   */
  async findBySlug(slug) {
    try {
      const query = `
        SELECT e.*, elp.slug, elp.custom_html, elp.custom_css,
               COUNT(DISTINCT er.id) as registration_count
        FROM events e
        INNER JOIN event_landing_pages elp ON e.id = elp.event_id
        LEFT JOIN event_registrations er ON e.id = er.event_id
        WHERE elp.slug = $1 AND elp.published = true
        GROUP BY e.id, elp.slug, elp.custom_html, elp.custom_css
      `;
      
      const { rows } = await this.db.query(query, [slug]);
      return rows[0] || null;
    } catch (error) {
      this.logger.error('EventRepository: Error finding event by slug', { slug, error: error.message });
      throw error;
    }
  }
}

module.exports = EventRepository;
