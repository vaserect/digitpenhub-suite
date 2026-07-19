const BaseService = require('./base/BaseService');
const { trackActivity } = require('../utils/activityTracker');

/**
 * UGCAggregatorService - Manages creator feeds sync and moderation queues (Taggbox/Flowbox benchmark)
 */
class UGCAggregatorService extends BaseService {
  constructor(repository) {
    super(repository, { serviceName: 'UGCAggregatorService' });
  }

  // ==================== FEEDS ====================

  async listFeeds(orgId, filters) {
    return this.repository.findFeeds(orgId, filters);
  }

  async getFeed(id, orgId) {
    const feed = await this.repository.findFeedById(id, orgId);
    if (!feed) throw new Error('Feed not found');
    return feed;
  }

  async createFeed(data, orgId, userId) {
    const feed = await this.repository.createFeed(data, orgId);

    // Track activity
    await trackActivity(orgId, userId, 'ugc_aggregator.feed_created', {
      description: `New UGC aggregator feed source "${feed.name}" (${feed.source_platform}) created.`,
      metadata: { feedId: feed.id }
    });

    return feed;
  }

  async updateFeed(id, data, orgId) {
    return this.repository.updateFeed(id, data, orgId);
  }

  async deleteFeed(id, orgId) {
    return this.repository.deleteFeed(id, orgId);
  }

  // ==================== POSTS moderation & Shoppable link ====================

  async listPosts(orgId, filters) {
    return this.repository.findPosts(orgId, filters);
  }

  async approvePost(id, orgId) {
    return this.repository.updatePostModeration(id, 'approved', orgId);
  }

  async rejectPost(id, orgId) {
    return this.repository.updatePostModeration(id, 'rejected', orgId);
  }

  async tagShoppableProduct(id, productId, orgId) {
    return this.repository.linkProductToPost(id, productId, orgId);
  }

  async togglePinPost(id, pinned, orgId) {
    return this.repository.togglePin(id, pinned, orgId);
  }

  // ==================== TELEMETRY TRAFFIC ====================

  async recordTelemetry(orgId, type) {
    if (!['impression', 'click', 'shoppable_click'].includes(type)) {
      throw new Error('Invalid widget telemetry event type');
    }
    await this.repository.recordWidgetTelemetry(orgId, type);
    return { success: true };
  }

  // ==================== MOCK IMPORT ENGINE ====================

  /**
   * Simulates fetching creator posts from social API based on feed parameters
   */
  async triggerFeedSync(feedId, orgId, userId) {
    try {
      const feed = await this.getFeed(feedId, orgId);
      
      const query = feed.query_value;
      const platform = feed.source_platform;

      // Mock posts data based on query value
      const mockCreators = [
        { name: 'Sarah Jenkins', handle: '@sarah_j_reviews', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
        { name: 'Marcus Miller', handle: '@marcus_tech_guy', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
        { name: 'Elena Rostova', handle: '@elena_looks', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' }
      ];

      const mockCaptions = [
        `Obsessed with this custom merchandise! The print resolution is stunning. ${query} #gifted`,
        `Just unboxed my new kit. Quality is absolutely top-tier. Highly recommended! ${query}`,
        `Quick look at the design details. Clean aesthetics and premium build. Check them out! ${query}`
      ];

      const mockImages = [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', // red shoes
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', // white camera/watch
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'  // headphones
      ];

      const insertedPosts = [];

      for (let i = 0; i < 3; i++) {
        const creator = mockCreators[i];
        const post = await this.repository.createPost({
          feed_id: feedId,
          creator_name: creator.name,
          creator_handle: creator.handle,
          creator_avatar: creator.avatar,
          media_type: 'image',
          media_url: mockImages[i],
          caption: mockCaptions[i],
          likes_count: Math.floor(Math.random() * 450) + 50,
          comments_count: Math.floor(Math.random() * 80) + 10,
          published_at: new Date(Date.now() - i * 3600 * 1000 * 24),
          moderation_status: 'pending'
        }, orgId);
        
        insertedPosts.push(post);
      }

      // Track Activity
      await trackActivity(orgId, userId, 'ugc_aggregator.imported', {
        description: `Synced feed "${feed.name}" and imported 3 creator posts into moderation queue.`,
        metadata: { feedId, postsCount: 3 }
      });

      return insertedPosts;
    } catch (error) {
      this.logger.error('UGCAggregatorService: Error syncing feed', { feedId, orgId, error: error.message });
      throw error;
    }
  }

  // ==================== EMBED GENERATOR ====================

  getEmbedCode(orgId) {
    return `<div id="ugc-aggregator-feed" data-org-id="${orgId}"></div>\n<script src="https://suite.digitpenhub.com/scripts/ugc-widget.js" async></script>`;
  }

  // ==================== ANALYTICS ====================

  async getExecutiveStats(orgId, startDate, endDate) {
    return this.repository.getAnalytics(orgId, startDate, endDate);
  }
}

module.exports = UGCAggregatorService;
