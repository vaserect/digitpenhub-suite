const abTestingController = require('../abTestingController');
const db = require('../../db');

jest.mock('../../db');

describe('A/B Testing Controller Unit Tests', () => {
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

  describe('experiments management', () => {
    it('should create an experiment and automatically seed control & treatment variants', async () => {
      req.body = {
        name: 'Landing Page Header Test',
        description: 'Test different headlines on home page',
        target_type: 'landing_page',
        target_url: '/home',
        goal_type: 'click',
        traffic_split: 50,
        content_changes_a: { headline: 'Welcome to our platform' },
        content_changes_b: { headline: 'Get 50% discount today' }
      };

      // Mock create experiment query
      const mockExperiment = { id: 'exp-uuid', ...req.body };
      db.query.mockResolvedValueOnce({ rows: [mockExperiment] }); // Create experiment query

      // Mock create variation A query
      const mockVarA = { id: 'var-a-uuid', name: 'Control (Variation A)' };
      db.query.mockResolvedValueOnce({ rows: [mockVarA] });

      // Mock create variation B query
      const mockVarB = { id: 'var-b-uuid', name: 'Treatment (Variation B)' };
      db.query.mockResolvedValueOnce({ rows: [mockVarB] });

      await abTestingController.createExperiment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: 'exp-uuid',
          variations: expect.arrayContaining([
            expect.objectContaining({ name: 'Control (Variation A)' }),
            expect.objectContaining({ name: 'Treatment (Variation B)' })
          ])
        })
      }));
    });
  });

  describe('traffic routing & conversion tracking', () => {
    it('should route traffic to a variant using split weights', async () => {
      req.params = { id: 'exp-uuid' };

      // Mock variations fetch query
      const mockVariations = [
        { id: 'var-a-uuid', name: 'Control (Variation A)', traffic_weight: 50, content_changes: { headline: 'A' } },
        { id: 'var-b-uuid', name: 'Treatment (Variation B)', traffic_weight: 50, content_changes: { headline: 'B' } }
      ];
      db.query.mockResolvedValueOnce({ rows: mockVariations }); // load variations query

      // Mock increment views query
      db.query.mockResolvedValueOnce({ rows: [] }); // increment views
      db.query.mockResolvedValueOnce({ rows: [] }); // daily aggregation stats

      await abTestingController.routeTraffic(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          variation_id: expect.any(String),
          content_changes: expect.any(Object)
        })
      }));
    });

    it('should record goal conversion hits', async () => {
      req.params = { id: 'exp-uuid', variationId: 'var-b-uuid' };

      // Mock increment conversions query
      db.query.mockResolvedValueOnce({ rows: [] }); // increment conversions
      db.query.mockResolvedValueOnce({ rows: [] }); // daily aggregation stats

      await abTestingController.recordConversion(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { success: true }
      }));
    });
  });

  describe('statistical analytics', () => {
    it('should compute Z-Score p-value significance and check champ winner', async () => {
      req.params = { id: 'exp-uuid' };

      // Mock load experiment query
      const mockExperiment = { id: 'exp-uuid', name: 'Header Test' };
      db.query.mockResolvedValueOnce({ rows: [mockExperiment] });

      // Mock load variations query (with high significance for Variant B)
      const mockVariations = [
        { id: 'var-a-uuid', name: 'Control A', views: 1000, conversions: 50 },    // 5% CR
        { id: 'var-b-uuid', name: 'Treatment B', views: 1000, conversions: 120 } // 12% CR
      ];
      db.query.mockResolvedValueOnce({ rows: mockVariations });

      // Mock load daily timeline events query
      const mockTimeline = [];
      db.query.mockResolvedValueOnce({ rows: mockTimeline });

      await abTestingController.getAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          stats: expect.objectContaining({
            significant: true,
            confidence: expect.any(Number)
          })
        })
      }));
      
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.stats.confidence).toBeGreaterThan(99.0);
    });
  });
});
