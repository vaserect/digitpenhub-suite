const BaseService = require('./base/BaseService');
const PlaybookRepository = require('../repositories/PlaybookRepository');
const BattlecardRepository = require('../repositories/BattlecardRepository');

/**
 * SalesPlaybookService - Business logic for sales playbooks and battlecards
 */
class SalesPlaybookService extends BaseService {
  constructor(db) {
    const playbookRepo = new PlaybookRepository(db);
    super(playbookRepo);
    this.playbookRepo = playbookRepo;
    this.battlecardRepo = new BattlecardRepository(db);
    this.db = db;
  }

  // ==================== PLAYBOOKS ====================

  async getPlaybooks(orgId, filters = {}) {
    try {
      return await this.playbookRepo.findAll(orgId, filters);
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error getting playbooks', { orgId, filters, error: error.message });
      throw error;
    }
  }

  async getPlaybookById(id, orgId) {
    try {
      const playbook = await this.playbookRepo.findByIdWithDetails(id, orgId);
      if (!playbook) {
        throw new Error('Playbook not found');
      }
      return playbook;
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error getting playbook', { id, orgId, error: error.message });
      throw error;
    }
  }

  async createPlaybook(data, orgId, userId) {
    try {
      if (!data.title) {
        throw new Error('Playbook title is required');
      }
      return await this.playbookRepo.create(data, orgId, userId);
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error creating playbook', { data, orgId, error: error.message });
      throw error;
    }
  }

  async updatePlaybook(id, data, orgId, userId) {
    try {
      const playbook = await this.playbookRepo.update(id, data, orgId, userId);
      if (!playbook) {
        throw new Error('Playbook not found');
      }
      return playbook;
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error updating playbook', { id, data, orgId, error: error.message });
      throw error;
    }
  }

  async deletePlaybook(id, orgId) {
    try {
      const result = await this.playbookRepo.delete(id, orgId);
      if (!result) {
        throw new Error('Playbook not found');
      }
      return { success: true, message: 'Playbook deleted successfully' };
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error deleting playbook', { id, orgId, error: error.message });
      throw error;
    }
  }

  async publishPlaybook(id, orgId, userId) {
    try {
      return await this.updatePlaybook(id, { 
        status: 'published',
        published_at: new Date()
      }, orgId, userId);
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error publishing playbook', { id, orgId, error: error.message });
      throw error;
    }
  }

  // ==================== BATTLECARDS ====================

  async getBattlecards(orgId, filters = {}) {
    try {
      return await this.battlecardRepo.findAll(orgId, filters);
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error getting battlecards', { orgId, filters, error: error.message });
      throw error;
    }
  }

  async getBattlecardById(id, orgId) {
    try {
      const battlecard = await this.battlecardRepo.findByIdWithDetails(id, orgId);
      if (!battlecard) {
        throw new Error('Battlecard not found');
      }
      return battlecard;
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error getting battlecard', { id, orgId, error: error.message });
      throw error;
    }
  }

  async getBattlecardsByCompetitor(competitorName, orgId) {
    try {
      return await this.battlecardRepo.findByCompetitor(competitorName, orgId);
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error getting battlecards by competitor', { competitorName, orgId, error: error.message });
      throw error;
    }
  }

  async createBattlecard(data, orgId, userId) {
    try {
      if (!data.competitor_name) {
        throw new Error('Competitor name is required');
      }
      return await this.battlecardRepo.create(data, orgId, userId);
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error creating battlecard', { data, orgId, error: error.message });
      throw error;
    }
  }

  async updateBattlecard(id, data, orgId) {
    try {
      const battlecard = await this.battlecardRepo.update(id, data, orgId);
      if (!battlecard) {
        throw new Error('Battlecard not found');
      }
      return battlecard;
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error updating battlecard', { id, data, orgId, error: error.message });
      throw error;
    }
  }

  async deleteBattlecard(id, orgId) {
    try {
      const result = await this.battlecardRepo.delete(id, orgId);
      if (!result) {
        throw new Error('Battlecard not found');
      }
      return { success: true, message: 'Battlecard deleted successfully' };
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error deleting battlecard', { id, orgId, error: error.message });
      throw error;
    }
  }

  // ==================== CONTENT INTERACTION ====================

  async trackView(contentType, contentId, userId, duration = 0, source = 'browse') {
    try {
      const query = `
        INSERT INTO content_views (content_type, content_id, user_id, duration_seconds, source)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const { rows } = await this.db.query(query, [contentType, contentId, userId, duration, source]);
      return rows[0];
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error tracking view', { contentType, contentId, userId, error: error.message });
      throw error;
    }
  }

  async rateContent(contentType, contentId, userId, rating, comment = null) {
    try {
      const query = `
        INSERT INTO content_ratings (content_type, content_id, user_id, rating, comment)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (content_type, content_id, user_id) 
        DO UPDATE SET rating = $4, comment = $5
        RETURNING *
      `;
      const { rows } = await this.db.query(query, [contentType, contentId, userId, rating, comment]);
      return rows[0];
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error rating content', { contentType, contentId, userId, rating, error: error.message });
      throw error;
    }
  }

  async toggleFavorite(contentType, contentId, userId) {
    try {
      // Check if already favorited
      const checkQuery = `
        SELECT id FROM content_favorites 
        WHERE content_type = $1 AND content_id = $2 AND user_id = $3
      `;
      const { rows: existing } = await this.db.query(checkQuery, [contentType, contentId, userId]);
      
      if (existing.length > 0) {
        // Remove favorite
        await this.db.query(
          'DELETE FROM content_favorites WHERE id = $1',
          [existing[0].id]
        );
        return { favorited: false };
      } else {
        // Add favorite
        await this.db.query(
          'INSERT INTO content_favorites (content_type, content_id, user_id) VALUES ($1, $2, $3)',
          [contentType, contentId, userId]
        );
        return { favorited: true };
      }
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error toggling favorite', { contentType, contentId, userId, error: error.message });
      throw error;
    }
  }

  async getFavorites(userId, contentType = null) {
    try {
      let query = `
        SELECT cf.*, 
               CASE 
                 WHEN cf.content_type = 'playbook' THEN p.title
                 WHEN cf.content_type = 'battlecard' THEN b.competitor_name
               END as title
        FROM content_favorites cf
        LEFT JOIN playbooks p ON cf.content_type = 'playbook' AND cf.content_id = p.id
        LEFT JOIN battlecards b ON cf.content_type = 'battlecard' AND cf.content_id = b.id
        WHERE cf.user_id = $1
      `;
      
      const params = [userId];
      if (contentType) {
        query += ' AND cf.content_type = $2';
        params.push(contentType);
      }
      
      query += ' ORDER BY cf.created_at DESC';
      
      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error getting favorites', { userId, contentType, error: error.message });
      throw error;
    }
  }

  // ==================== SEARCH ====================

  async searchContent(orgId, searchTerm, filters = {}) {
    try {
      const { contentType, limit = 50 } = filters;
      
      let playbookResults = [];
      let battlecardResults = [];
      
      if (!contentType || contentType === 'playbook') {
        playbookResults = await this.playbookRepo.findAll(orgId, { search: searchTerm, limit });
      }
      
      if (!contentType || contentType === 'battlecard') {
        battlecardResults = await this.battlecardRepo.findAll(orgId, { search: searchTerm, limit });
      }
      
      return {
        playbooks: playbookResults,
        battlecards: battlecardResults,
        total: playbookResults.length + battlecardResults.length
      };
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error searching content', { orgId, searchTerm, filters, error: error.message });
      throw error;
    }
  }

  // ==================== STATISTICS ====================

  async getStatistics(orgId) {
    try {
      const playbookStats = await this.playbookRepo.getStatistics(orgId);
      const battlecardStats = await this.battlecardRepo.getStatistics(orgId);
      
      return {
        playbooks: playbookStats,
        battlecards: battlecardStats,
        total_content: parseInt(playbookStats.total_playbooks) + parseInt(battlecardStats.total_battlecards),
        total_views: parseInt(playbookStats.total_views) + parseInt(battlecardStats.total_views)
      };
    } catch (error) {
      this.logger.error('SalesPlaybookService: Error getting statistics', { orgId, error: error.message });
      throw error;
    }
  }
}

module.exports = SalesPlaybookService;
