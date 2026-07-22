const BaseService = require('./base/BaseService');
const EventRepository = require('../repositories/EventRepository');

/**
 * EventService - Business logic for event/webinar management
 * Extends BaseService for common operations
 */
class EventService extends BaseService {
  constructor(db) {
    const repository = new EventRepository(db);
    super(repository);
    this.db = db;
  }

  /**
   * Get all events with filters
   */
  async getEvents(orgId, filters = {}) {
    try {
      return await this.repository.findAll(orgId, filters);
    } catch (error) {
      this.logger.error('EventService: Error getting events', { orgId, filters, error: error.message });
      throw error;
    }
  }

  /**
   * Get event by ID with full details
   */
  async getEventById(id, orgId) {
    try {
      const event = await this.repository.findByIdWithDetails(id, orgId);
      if (!event) {
        throw new Error('Event not found');
      }
      return event;
    } catch (error) {
      this.logger.error('EventService: Error getting event by ID', { id, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Create new event
   */
  async createEvent(eventData, orgId, userId) {
    try {
      // Validate required fields
      if (!eventData.title) {
        throw new Error('Event title is required');
      }
      if (!eventData.start_time) {
        throw new Error('Event start time is required');
      }
      if (!eventData.end_time) {
        throw new Error('Event end time is required');
      }

      // Calculate duration if not provided
      if (!eventData.duration_minutes && eventData.start_time && eventData.end_time) {
        const start = new Date(eventData.start_time);
        const end = new Date(eventData.end_time);
        eventData.duration_minutes = Math.round((end - start) / 60000);
      }

      const event = await this.repository.create(eventData, orgId, userId);

      // Create default landing page
      await this.createLandingPage(event.id, {
        slug: this.generateSlug(event.title, event.id),
        template: 'default',
        published: false
      });

      return event;
    } catch (error) {
      this.logger.error('EventService: Error creating event', { eventData, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Update event
   */
  async updateEvent(id, eventData, orgId) {
    try {
      const event = await this.repository.update(id, eventData, orgId);
      if (!event) {
        throw new Error('Event not found');
      }
      return event;
    } catch (error) {
      this.logger.error('EventService: Error updating event', { id, eventData, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(id, orgId) {
    try {
      const event = await this.repository.delete(id, orgId);
      if (!event) {
        throw new Error('Event not found');
      }
      return { success: true, message: 'Event deleted successfully' };
    } catch (error) {
      this.logger.error('EventService: Error deleting event', { id, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Duplicate event
   */
  async duplicateEvent(id, orgId, userId) {
    try {
      const original = await this.repository.findByIdWithDetails(id, orgId);
      if (!original) {
        throw new Error('Event not found');
      }

      const duplicate = {
        ...original,
        title: `${original.title} (Copy)`,
        status: 'draft',
        video_room_url: null,
        video_room_token: null
      };

      delete duplicate.id;
      delete duplicate.registration_count;
      delete duplicate.attendee_count;
      delete duplicate.session_count;
      delete duplicate.creator_name;
      delete duplicate.created_at;
      delete duplicate.updated_at;

      return await this.createEvent(duplicate, orgId, userId);
    } catch (error) {
      this.logger.error('EventService: Error duplicating event', { id, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Cancel event
   */
  async cancelEvent(id, orgId) {
    try {
      return await this.updateEvent(id, { status: 'cancelled' }, orgId);
    } catch (error) {
      this.logger.error('EventService: Error cancelling event', { id, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Start event (go live)
   */
  async startEvent(id, orgId) {
    try {
      const event = await this.getEventById(id, orgId);
      
      if (event.status !== 'scheduled') {
        throw new Error('Only scheduled events can be started');
      }

      // Create video room if needed
      if (!event.video_room_url) {
        const videoRoom = await this.createVideoRoom(event);
        await this.updateEvent(id, {
          status: 'live',
          video_room_url: videoRoom.url,
          video_room_token: videoRoom.token
        }, orgId);
      } else {
        await this.updateEvent(id, { status: 'live' }, orgId);
      }

      return await this.getEventById(id, orgId);
    } catch (error) {
      this.logger.error('EventService: Error starting event', { id, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * End event
   */
  async endEvent(id, orgId) {
    try {
      return await this.updateEvent(id, { status: 'ended' }, orgId);
    } catch (error) {
      this.logger.error('EventService: Error ending event', { id, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  async getStatistics(orgId, filters = {}) {
    try {
      return await this.repository.getStatistics(orgId, filters);
    } catch (error) {
      this.logger.error('EventService: Error getting statistics', { orgId, filters, error: error.message });
      throw error;
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(orgId, limit = 10) {
    try {
      return await this.repository.findUpcoming(orgId, limit);
    } catch (error) {
      this.logger.error('EventService: Error getting upcoming events', { orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Get event by slug (public)
   */
  async getEventBySlug(slug) {
    try {
      const event = await this.repository.findBySlug(slug);
      if (!event) {
        throw new Error('Event not found');
      }
      return event;
    } catch (error) {
      this.logger.error('EventService: Error getting event by slug', { slug, error: error.message });
      throw error;
    }
  }

  // ==================== REGISTRATIONS ====================

  /**
   * Register for event
   */
  async registerForEvent(eventId, registrationData) {
    try {
      const query = `
        INSERT INTO event_registrations (
          event_id, contact_id, email, first_name, last_name,
          registration_data, status, ticket_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const params = [
        eventId,
        registrationData.contact_id || null,
        registrationData.email,
        registrationData.first_name || null,
        registrationData.last_name || null,
        JSON.stringify(registrationData.custom_fields || {}),
        registrationData.status || 'pending',
        registrationData.ticket_type || null
      ];

      const { rows } = await this.db.query(query, params);
      
      // Sync to CRM if contact_id not provided
      if (!registrationData.contact_id && registrationData.email) {
        await this.syncRegistrationToCRM(rows[0]);
      }

      return rows[0];
    } catch (error) {
      this.logger.error('EventService: Error registering for event', { eventId, registrationData, error: error.message });
      throw error;
    }
  }

  /**
   * Get registrations for event
   */
  async getRegistrations(eventId, orgId, filters = {}) {
    try {
      const { status, limit = 100, offset = 0 } = filters;
      
      let query = `
        SELECT er.*, c.full_name as contact_name
        FROM event_registrations er
        LEFT JOIN contacts c ON er.contact_id = c.id
        INNER JOIN events e ON er.event_id = e.id
        WHERE er.event_id = $1 AND e.org_id = $2
      `;
      
      const params = [eventId, orgId];
      let paramIndex = 3;
      
      if (status) {
        query += ` AND er.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      query += ` ORDER BY er.registered_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
      
      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('EventService: Error getting registrations', { eventId, orgId, filters, error: error.message });
      throw error;
    }
  }

  /**
   * Approve registration
   */
  async approveRegistration(registrationId, eventId, orgId) {
    try {
      const query = `
        UPDATE event_registrations er
        SET status = 'approved', approved_at = CURRENT_TIMESTAMP
        FROM events e
        WHERE er.id = $1 AND er.event_id = $2 AND e.id = $2 AND e.org_id = $3
        RETURNING er.*
      `;
      
      const { rows } = await this.db.query(query, [registrationId, eventId, orgId]);
      if (rows.length === 0) {
        throw new Error('Registration not found');
      }
      
      return rows[0];
    } catch (error) {
      this.logger.error('EventService: Error approving registration', { registrationId, eventId, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Reject registration
   */
  async rejectRegistration(registrationId, eventId, orgId) {
    try {
      const query = `
        UPDATE event_registrations er
        SET status = 'rejected'
        FROM events e
        WHERE er.id = $1 AND er.event_id = $2 AND e.id = $2 AND e.org_id = $3
        RETURNING er.*
      `;
      
      const { rows } = await this.db.query(query, [registrationId, eventId, orgId]);
      if (rows.length === 0) {
        throw new Error('Registration not found');
      }
      
      return rows[0];
    } catch (error) {
      this.logger.error('EventService: Error rejecting registration', { registrationId, eventId, orgId, error: error.message });
      throw error;
    }
  }

  // ==================== LANDING PAGES ====================

  /**
   * Create landing page
   */
  async createLandingPage(eventId, pageData) {
    try {
      const query = `
        INSERT INTO event_landing_pages (
          event_id, slug, template, custom_html, custom_css,
          seo_title, seo_description, og_image, published
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const params = [
        eventId,
        pageData.slug,
        pageData.template || 'default',
        pageData.custom_html || null,
        pageData.custom_css || null,
        pageData.seo_title || null,
        pageData.seo_description || null,
        pageData.og_image || null,
        pageData.published || false
      ];
      
      const { rows } = await this.db.query(query, params);
      return rows[0];
    } catch (error) {
      this.logger.error('EventService: Error creating landing page', { eventId, pageData, error: error.message });
      throw error;
    }
  }

  /**
   * Update landing page
   */
  async updateLandingPage(eventId, orgId, pageData) {
    try {
      const query = `
        UPDATE event_landing_pages elp
        SET 
          template = COALESCE($3, template),
          custom_html = COALESCE($4, custom_html),
          custom_css = COALESCE($5, custom_css),
          seo_title = COALESCE($6, seo_title),
          seo_description = COALESCE($7, seo_description),
          og_image = COALESCE($8, og_image),
          published = COALESCE($9, published),
          updated_at = CURRENT_TIMESTAMP
        FROM events e
        WHERE elp.event_id = $1 AND e.id = $1 AND e.org_id = $2
        RETURNING elp.*
      `;
      
      const params = [
        eventId,
        orgId,
        pageData.template,
        pageData.custom_html,
        pageData.custom_css,
        pageData.seo_title,
        pageData.seo_description,
        pageData.og_image,
        pageData.published
      ];
      
      const { rows } = await this.db.query(query, params);
      return rows[0] || null;
    } catch (error) {
      this.logger.error('EventService: Error updating landing page', { eventId, orgId, pageData, error: error.message });
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Generate slug from title
   */
  generateSlug(title, id) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${slug}-${id}`;
  }

  /**
   * Create video room for event
   * Returns null if DAILY_CO_API_KEY is not configured.
   */
  async createVideoRoom(event) {
    if (!process.env.DAILY_CO_API_KEY) {
      this.logger?.warn?.('Video rooms disabled: DAILY_CO_API_KEY not configured');
      return null;
    }
    // Real Daily.co API call would go here
    return {
      url: `https://daily.co/event-${event.id}`,
      token: `tok-${event.id}`
    };
  }

  /**
   * Sync registration to CRM
   */
  async syncRegistrationToCRM(registration) {
    try {
      // TODO: Integrate with CRM service
      // For now, just log
      this.logger.info('EventService: Registration synced to CRM', { registration });
    } catch (error) {
      this.logger.error('EventService: Error syncing to CRM', { registration, error: error.message });
    }
  }
}

module.exports = EventService;
