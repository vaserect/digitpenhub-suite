const ugcAggregatorController = require('../ugcAggregatorController');
const db = require('../../db');

jest.mock('../../db');

describe('UGC Aggregator Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        id: 'user-uuid-123',
        org_id: 'org-uuid-456',
        orgId: 'org-uuid-456'
      },
      body: {},
      query: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('feeds', () => {
    it('should create a new UGC feed source successfully', async () => {
      req.body = {
        name: 'Brand Instagram Hashtag Feed',
        source_platform: 'instagram',
        query_type: 'hashtag',
        query_value: '#digitpen'
      };

      const mockFeed = { id: 'feed-uuid', ...req.body };
      db.query.mockResolvedValueOnce({ rows: [mockFeed] }); // createFeed database insertion

      await ugcAggregatorController.createFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockFeed
      }));
    });
  });

  describe('moderation & curation queue', () => {
    it('should approve a pending post and return it', async () => {
      req.params = { id: 'post-uuid' };

      const mockUpdatedPost = { id: 'post-uuid', moderation_status: 'approved' };
      db.query.mockResolvedValueOnce({ rows: [mockUpdatedPost] });

      await ugcAggregatorController.approvePost(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUpdatedPost
      }));
    });

    it('should trigger feed import sync generating 3 mock creator posts', async () => {
      req.params = { id: 'feed-uuid' };

      // Mock feed configuration fetch
      const mockFeed = { id: 'feed-uuid', name: 'Hashtag Feed', source_platform: 'instagram', query_value: '#promo' };
      db.query.mockResolvedValueOnce({ rows: [mockFeed] }); // getFeed query

      // Mock 3 posts insertions
      db.query.mockResolvedValueOnce({ rows: [{ id: 'post-1' }] });
      db.query.mockResolvedValueOnce({ rows: [{ id: 'post-2' }] });
      db.query.mockResolvedValueOnce({ rows: [{ id: 'post-3' }] });

      await ugcAggregatorController.syncFeed(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'post-1' }),
          expect.objectContaining({ id: 'post-2' }),
          expect.objectContaining({ id: 'post-3' })
        ])
      }));
    });
  });

  describe('telemetry', () => {
    it('should record public widget impressions telemetry', async () => {
      req.params = { orgId: 'org-uuid-456' };
      req.query = { type: 'impression' };

      db.query.mockResolvedValueOnce({ rows: [] }); // insert daily widget stats

      await ugcAggregatorController.recordTelemetry(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { success: true }
      }));
    });
  });
});
