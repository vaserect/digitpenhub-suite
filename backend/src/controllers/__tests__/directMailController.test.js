const directMailController = require('../directMailController');
const db = require('../../db');

jest.mock('../../db');

describe('Direct Mail Controller Unit Tests', () => {
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

  describe('templates', () => {
    it('should create a template successfully and return it', async () => {
      req.body = {
        name: 'Promo Postcard',
        description: 'Black Friday Postcard',
        html_content: '<html>{{first_name}}</html>',
        size: '4x6',
        type: 'postcard'
      };

      const mockTemplate = { id: 'temp-uuid', ...req.body };
      db.query.mockResolvedValueOnce({ rows: [mockTemplate] });

      await directMailController.createTemplate(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockTemplate
      }));
    });

    it('should list templates successfully', async () => {
      const mockTemplates = [
        { id: 'temp-uuid-1', name: 'T1' },
        { id: 'temp-uuid-2', name: 'T2' }
      ];
      db.query.mockResolvedValueOnce({ rows: mockTemplates });

      await directMailController.listTemplates(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockTemplates
      }));
    });
  });

  describe('sends', () => {
    it('should send a mail postcard and calculate Lob pricing successfully', async () => {
      req.body = {
        template_id: 'temp-uuid',
        recipient: {
          to_name: 'John Doe',
          to_address_line1: '123 Pine St',
          to_city: 'Austin',
          to_state: 'TX',
          to_postal_code: '78701'
        }
      };

      // Mock template load
      const mockTemplate = { id: 'temp-uuid', size: '4x6', type: 'postcard' };
      db.query.mockResolvedValueOnce({ rows: [mockTemplate] }); // Load template query

      // Mock create send
      const mockSend = { id: 'send-uuid', cost: 0.48, to_name: 'John Doe' };
      db.query.mockResolvedValueOnce({ rows: [mockSend] }); // Create send record query

      // Mock insert daily analytics query
      db.query.mockResolvedValueOnce({ rows: [] });

      await directMailController.sendMail(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockSend
      }));
    });

    it('should fail if recipient address validation fails', async () => {
      req.body = {
        template_id: 'temp-uuid',
        recipient: {
          to_name: '', // Empty name!
          to_address_line1: '123 Pine St'
        }
      };

      // Mock template load
      const mockTemplate = { id: 'temp-uuid', size: '4x6', type: 'postcard' };
      db.query.mockResolvedValueOnce({ rows: [mockTemplate] });

      await directMailController.sendMail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Address validation failed: Recipient name is required'
      }));
    });
  });
});
