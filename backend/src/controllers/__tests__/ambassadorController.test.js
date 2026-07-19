const ambassadorController = require('../ambassadorController');
const db = require('../../db');

jest.mock('../../db');

describe('Ambassador Controller Unit Tests', () => {
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
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('onboard', () => {
    it('should onboard a user successfully and return the profile', async () => {
      req.body = {
        referral_code: 'MYCODE',
        social_handles: { instagram: '@test' },
        notes: 'Hello'
      };

      // Mock finding by userId
      db.query.mockResolvedValueOnce({ rows: [] }); // Not already onboarded
      // Mock finding by code
      db.query.mockResolvedValueOnce({ rows: [] }); // Code not in use
      // Mock insert profile
      const mockProfile = { id: 'profile-uuid', referral_code: 'MYCODE' };
      db.query.mockResolvedValueOnce({ rows: [mockProfile] }); // Create profile

      await ambassadorController.onboard(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockProfile
      }));
    });

    it('should fail if user is already onboarded', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 'profile-uuid' }] }); // Already onboarded

      await ambassadorController.onboard(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User is already onboarded as an ambassador'
      }));
    });
  });

  describe('getProfile', () => {
    it('should return profile details', async () => {
      const mockProfile = { id: 'profile-uuid', user_id: 'user-uuid-123', referral_code: 'MYCODE' };
      db.query.mockResolvedValueOnce({ rows: [mockProfile] });

      await ambassadorController.getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockProfile
      }));
    });
  });

  describe('missions', () => {
    it('should create a mission successfully', async () => {
      req.body = {
        title: 'Share a post',
        description: 'Post about us',
        mission_type: 'social_post',
        reward_type: 'points',
        points_reward: 100
      };

      const mockMission = { id: 'mission-uuid', ...req.body };
      db.query.mockResolvedValueOnce({ rows: [mockMission] });

      await ambassadorController.createMission(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockMission
      }));
    });
  });
});
