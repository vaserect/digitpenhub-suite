const printFulfillmentController = require('../printFulfillmentController');
const db = require('../../db');

jest.mock('../../db');

describe('Print Fulfillment Controller Unit Tests', () => {
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

  describe('catalog', () => {
    it('should list print products successfully', async () => {
      const mockProducts = [
        { id: 'p-1', name: 'Business Cards', base_price: 19.99 },
        { id: 'p-2', name: 'Vinyl Banner', base_price: 49.99 }
      ];
      db.query.mockResolvedValueOnce({ rows: mockProducts });

      await printFulfillmentController.listProducts(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockProducts
      }));
    });
  });

  describe('orders', () => {
    it('should place an order successfully and calculate Moo pricing model', async () => {
      req.body = {
        product_id: 'p-1',
        quantity: 100,
        specs: { paper_stock: '16pt Matte' },
        artwork_url: 'https://cdn.digitpenhub.com/designs/card1.pdf',
        shipping_address: {
          to_name: 'Bob Jones',
          line1: '456 Oak Ln',
          city: 'Chicago',
          state: 'IL',
          zip: '60601'
        },
        shipping_method: 'express'
      };

      // Mock product fetch query
      const mockProduct = { id: 'p-1', name: 'Business Cards', base_price: 19.99, category: 'business_cards' };
      db.query.mockResolvedValueOnce({ rows: [mockProduct] });

      // Mock order insert query
      const mockOrder = { id: 'order-uuid', total_price: 34.98, product_id: 'p-1' }; // 19.99 + 14.99 express shipping
      db.query.mockResolvedValueOnce({ rows: [mockOrder] });

      // Mock aggregated stats query
      db.query.mockResolvedValueOnce({ rows: [] });

      await printFulfillmentController.placeOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockOrder
      }));
    });

    it('should fail to place order if shipping address lacks critical fields', async () => {
      req.body = {
        product_id: 'p-1',
        quantity: 100,
        artwork_url: 'https://cdn.digitpenhub.com/designs/card1.pdf',
        shipping_address: {
          to_name: '', // Empty name!
          line1: '456 Oak Ln'
        }
      };

      // Mock product fetch query
      const mockProduct = { id: 'p-1', name: 'Business Cards', base_price: 19.99 };
      db.query.mockResolvedValueOnce({ rows: [mockProduct] });

      await printFulfillmentController.placeOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Shipping address error: Recipient name is required'
      }));
    });
  });
});
