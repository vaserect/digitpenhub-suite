const BaseService = require('../base/BaseService');
const ContactRepository = require('../../repositories/ContactRepository');
const logger = require('../../utils/logger');

/**
 * Service for contact business logic
 * Handles CRM contact operations with validation and enrichment
 */
class ContactService extends BaseService {
  constructor() {
    const repository = new ContactRepository();
    super(repository, {
      serviceName: 'ContactService',
      logger,
    });
  }

  /**
   * Search contacts with enhanced filtering
   * @param {number} orgId - Organization ID
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Matching contacts
   */
  async search(orgId, query, filters = {}) {
    this.logger.debug('ContactService: Searching contacts', { orgId, query, filters });

    try {
      const contacts = await this.repository.search(orgId, query, filters);
      return contacts.map(contact => this.enrichEntity(contact));
    } catch (error) {
      this.logger.error('ContactService: Error searching contacts', {
        orgId,
        query,
        filters,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get contacts by stage
   * @param {number} orgId - Organization ID
   * @param {string} stage - Contact stage
   * @returns {Promise<Array>} Contacts in stage
   */
  async getByStage(orgId, stage) {
    this.logger.debug('ContactService: Getting contacts by stage', { orgId, stage });

    try {
      const contacts = await this.repository.findByStage(orgId, stage);
      return contacts.map(contact => this.enrichEntity(contact));
    } catch (error) {
      this.logger.error('ContactService: Error getting contacts by stage', {
        orgId,
        stage,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get contact statistics
   * @param {number} orgId - Organization ID
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics(orgId) {
    this.logger.debug('ContactService: Getting statistics', { orgId });

    try {
      return await this.repository.getStatsByStage(orgId);
    } catch (error) {
      this.logger.error('ContactService: Error getting statistics', {
        orgId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Bulk create contacts with validation
   * @param {Array<Object>} contacts - Array of contact data
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Result with created contacts and errors
   */
  async bulkCreate(contacts, orgId, userId) {
    this.logger.info('ContactService: Bulk creating contacts', {
      count: contacts.length,
      orgId,
      userId,
    });

    const results = {
      created: [],
      errors: [],
    };

    try {
      // Validate all contacts first
      const validContacts = [];
      
      for (let i = 0; i < contacts.length; i++) {
        try {
          this.validateCreate(contacts[i]);
          validContacts.push(this.transformForCreate(contacts[i]));
        } catch (error) {
          results.errors.push({
            index: i,
            data: contacts[i],
            error: error.message,
          });
        }
      }

      // Bulk create valid contacts
      if (validContacts.length > 0) {
        const created = await this.repository.bulkCreate(validContacts, orgId, userId);
        results.created = created.map(contact => this.enrichEntity(contact));
      }

      this.logger.info('ContactService: Bulk create completed', {
        created: results.created.length,
        errors: results.errors.length,
        orgId,
      });

      return results;
    } catch (error) {
      this.logger.error('ContactService: Error bulk creating contacts', {
        orgId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Add note to contact
   * @param {number} contactId - Contact ID
   * @param {Object} noteData - Note data
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Created note
   */
  async addNote(contactId, noteData, orgId, userId) {
    this.logger.info('ContactService: Adding note to contact', {
      contactId,
      orgId,
      userId,
    });

    try {
      // Verify contact exists
      const contact = await this.findById(contactId, orgId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      // Validate note data
      if (!noteData.content || noteData.content.trim().length === 0) {
        throw new Error('Note content is required');
      }

      // Add note
      const note = await this.repository.addNote(
        contactId,
        { ...noteData, orgId },
        userId
      );

      this.logger.info('ContactService: Note added to contact', {
        contactId,
        noteId: note.id,
        orgId,
      });

      return note;
    } catch (error) {
      this.logger.error('ContactService: Error adding note', {
        contactId,
        orgId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get notes for contact
   * @param {number} contactId - Contact ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<Array>} Contact notes
   */
  async getNotes(contactId, orgId) {
    this.logger.debug('ContactService: Getting notes for contact', {
      contactId,
      orgId,
    });

    try {
      // Verify contact exists
      const contact = await this.findById(contactId, orgId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      return await this.repository.getNotes(contactId, orgId);
    } catch (error) {
      this.logger.error('ContactService: Error getting notes', {
        contactId,
        orgId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete note from contact
   * @param {number} contactId - Contact ID
   * @param {number} noteId - Note ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteNote(contactId, noteId, orgId) {
    this.logger.info('ContactService: Deleting note from contact', {
      contactId,
      noteId,
      orgId,
    });

    try {
      const deleted = await this.repository.deleteNote(noteId, contactId, orgId);
      
      if (!deleted) {
        throw new Error('Note not found');
      }

      this.logger.info('ContactService: Note deleted from contact', {
        contactId,
        noteId,
        orgId,
      });

      return true;
    } catch (error) {
      this.logger.error('ContactService: Error deleting note', {
        contactId,
        noteId,
        orgId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get contacts with recent activity
   * @param {number} orgId - Organization ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array>} Contacts with recent activity
   */
  async getRecentlyActive(orgId, days = 30) {
    this.logger.debug('ContactService: Getting recently active contacts', {
      orgId,
      days,
    });

    try {
      const contacts = await this.repository.findWithRecentActivity(orgId, days);
      return contacts.map(contact => this.enrichEntity(contact));
    } catch (error) {
      this.logger.error('ContactService: Error getting recently active contacts', {
        orgId,
        days,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get stale contacts (no recent activity)
   * @param {number} orgId - Organization ID
   * @param {number} days - Number of days threshold
   * @returns {Promise<Array>} Stale contacts
   */
  async getStale(orgId, days = 30) {
    this.logger.debug('ContactService: Getting stale contacts', {
      orgId,
      days,
    });

    try {
      const contacts = await this.repository.findStale(orgId, days);
      return contacts.map(contact => this.enrichEntity(contact));
    } catch (error) {
      this.logger.error('ContactService: Error getting stale contacts', {
        orgId,
        days,
        error: error.message,
      });
      throw error;
    }
  }

  // ============================================================================
  // Validation Hooks
  // ============================================================================

  /**
   * Validate contact data before creation
   * @param {Object} data - Contact data
   * @throws {Error} If validation fails
   */
  validateCreate(data) {
    // At least email or phone is required
    if (!data.email && !data.phone) {
      throw new Error('Contact must have either email or phone number');
    }

    // Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone format if provided
    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new Error('Invalid phone format');
    }

    // Validate stage if provided
    if (data.stage && !this.isValidStage(data.stage)) {
      throw new Error('Invalid contact stage');
    }

    // Validate value if provided
    if (data.value_ngn !== undefined && data.value_ngn < 0) {
      throw new Error('Contact value cannot be negative');
    }
  }

  /**
   * Validate contact data before update
   * @param {Object} data - Contact data
   * @param {Object} existing - Existing contact
   * @throws {Error} If validation fails
   */
  validateUpdate(data, existing) {
    // If updating email or phone, ensure at least one remains
    const newEmail = data.email !== undefined ? data.email : existing.email;
    const newPhone = data.phone !== undefined ? data.phone : existing.phone;

    if (!newEmail && !newPhone) {
      throw new Error('Contact must have either email or phone number');
    }

    // Validate email format if provided
    if (data.email !== undefined && data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone format if provided
    if (data.phone !== undefined && data.phone && !this.isValidPhone(data.phone)) {
      throw new Error('Invalid phone format');
    }

    // Validate stage if provided
    if (data.stage && !this.isValidStage(data.stage)) {
      throw new Error('Invalid contact stage');
    }

    // Validate value if provided
    if (data.value_ngn !== undefined && data.value_ngn < 0) {
      throw new Error('Contact value cannot be negative');
    }
  }

  // ============================================================================
  // Transformation Hooks
  // ============================================================================

  /**
   * Transform data before creation
   * @param {Object} data - Contact data
   * @returns {Object} Transformed data
   */
  transformForCreate(data) {
    const transformed = { ...data };

    // Normalize email
    if (transformed.email) {
      transformed.email = transformed.email.toLowerCase().trim();
    }

    // Normalize phone
    if (transformed.phone) {
      transformed.phone = this.normalizePhone(transformed.phone);
    }

    // Set default stage if not provided
    if (!transformed.stage) {
      transformed.stage = 'new';
    }

    // Set initial last_touch_at
    transformed.last_touch_at = new Date();

    return transformed;
  }

  /**
   * Transform data before update
   * @param {Object} data - Contact data
   * @param {Object} existing - Existing contact
   * @returns {Object} Transformed data
   */
  transformForUpdate(data, existing) {
    const transformed = { ...data };

    // Normalize email if provided
    if (transformed.email) {
      transformed.email = transformed.email.toLowerCase().trim();
    }

    // Normalize phone if provided
    if (transformed.phone) {
      transformed.phone = this.normalizePhone(transformed.phone);
    }

    // Update last_touch_at if stage changed
    if (transformed.stage && transformed.stage !== existing.stage) {
      transformed.last_touch_at = new Date();
    }

    return transformed;
  }

  // ============================================================================
  // Entity Enrichment
  // ============================================================================

  /**
   * Enrich contact with computed fields
   * @param {Object} contact - Raw contact from repository
   * @returns {Object} Enriched contact
   */
  enrichEntity(contact) {
    return {
      ...contact,
      displayName: this.getDisplayName(contact),
      hasRecentActivity: this.hasRecentActivity(contact),
      daysSinceLastTouch: this.getDaysSinceLastTouch(contact),
      isStale: this.isStale(contact),
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get display name for contact
   * @param {Object} contact - Contact object
   * @returns {string} Display name
   */
  getDisplayName(contact) {
    if (contact.full_name) return contact.full_name;
    if (contact.email) return contact.email;
    if (contact.phone) return contact.phone;
    return 'Unknown Contact';
  }

  /**
   * Check if contact has recent activity
   * @param {Object} contact - Contact object
   * @returns {boolean} True if has recent activity
   */
  hasRecentActivity(contact) {
    if (!contact.last_touch_at) return false;
    const daysSince = this.getDaysSinceLastTouch(contact);
    return daysSince < 30;
  }

  /**
   * Get days since last touch
   * @param {Object} contact - Contact object
   * @returns {number|null} Days since last touch or null
   */
  getDaysSinceLastTouch(contact) {
    if (!contact.last_touch_at) return null;
    const now = new Date();
    const lastTouch = new Date(contact.last_touch_at);
    const diffMs = now - lastTouch;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if contact is stale
   * @param {Object} contact - Contact object
   * @returns {boolean} True if stale
   */
  isStale(contact) {
    if (contact.stage === 'won' || contact.stage === 'lost') return false;
    const daysSince = this.getDaysSinceLastTouch(contact);
    return daysSince === null || daysSince > 30;
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   * @param {string} phone - Phone number
   * @returns {boolean} True if valid
   */
  isValidPhone(phone) {
    // Basic validation - at least 10 digits
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  }

  /**
   * Normalize phone number
   * @param {string} phone - Phone number
   * @returns {string} Normalized phone
   */
  normalizePhone(phone) {
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Validate contact stage
   * @param {string} stage - Contact stage
   * @returns {boolean} True if valid
   */
  isValidStage(stage) {
    const validStages = ['new', 'contacted', 'proposal_sent', 'won', 'lost'];
    return validStages.includes(stage);
  }
}

// Export singleton instance
module.exports = new ContactService();
