const InvoiceService = require('../InvoiceService');
const InvoiceRepository = require('../../../repositories/InvoiceRepository');

// Mock the repository
jest.mock('../../../repositories/InvoiceRepository');

describe('InvoiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the repository mock
    InvoiceService.repository = {
      createWithItems: jest.fn(),
      updateWithItems: jest.fn(),
      findByIdWithItems: jest.fn(),
      findAllWithClients: jest.fn(),
      getStatsByStatus: jest.fn(),
      findOverdue: jest.fn(),
      generateInvoiceNumber: jest.fn(),
      existsByNumber: jest.fn(),
      findByShareToken: jest.fn(),
    };
  });

  describe('createWithItems', () => {
    it('should create an invoice with line items', async () => {
      const mockInvoice = {
        id: '123',
        invoice_number: 'INV-0001',
        status: 'draft',
        subtotal: 100,
        tax_rate: 10,
        total: 110,
        items: [
          { description: 'Item 1', quantity: 1, unit_price: 100, amount: 100 },
        ],
      };

      InvoiceService.repository.existsByNumber = jest.fn().mockResolvedValue(false);
      InvoiceService.repository.createWithItems = jest.fn().mockResolvedValue(mockInvoice);

      const result = await InvoiceService.createWithItems(
        {
          invoice_number: 'INV-0001',
          issue_date: '2026-07-14',
          items: [{ description: 'Item 1', quantity: 1, unit_price: 100 }],
        },
        'org-1',
        'user-1'
      );

      expect(result.invoice_number).toBe('INV-0001');
      expect(result.total).toBe(110);
      expect(InvoiceService.repository.createWithItems).toHaveBeenCalled();
    });

    it('should throw error if invoice number is missing', async () => {
      await expect(
        InvoiceService.createWithItems(
          { issue_date: '2026-07-14', items: [] },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Invoice number is required');
    });

    it('should throw error if issue date is missing', async () => {
      await expect(
        InvoiceService.createWithItems(
          { invoice_number: 'INV-0001', items: [] },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Issue date is required');
    });

    it('should throw error if items array is empty', async () => {
      await expect(
        InvoiceService.createWithItems(
          {
            invoice_number: 'INV-0001',
            issue_date: '2026-07-14',
            items: [],
          },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Invoice must have at least one line item');
    });

    it('should throw error for invalid status', async () => {
      await expect(
        InvoiceService.createWithItems(
          {
            invoice_number: 'INV-0001',
            issue_date: '2026-07-14',
            status: 'invalid-status',
            items: [{ description: 'Item', quantity: 1, unit_price: 100 }],
          },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Status must be one of');
    });

    it('should throw error for negative subtotal', async () => {
      await expect(
        InvoiceService.createWithItems(
          {
            invoice_number: 'INV-0001',
            issue_date: '2026-07-14',
            subtotal: -100,
            items: [{ description: 'Item', quantity: 1, unit_price: 100 }],
          },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Subtotal cannot be negative');
    });

    it('should throw error for invalid tax rate', async () => {
      await expect(
        InvoiceService.createWithItems(
          {
            invoice_number: 'INV-0001',
            issue_date: '2026-07-14',
            tax_rate: 150,
            items: [{ description: 'Item', quantity: 1, unit_price: 100 }],
          },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Tax rate must be between 0 and 100');
    });

    it('should throw error if invoice number already exists', async () => {
      InvoiceService.repository.existsByNumber = jest.fn().mockResolvedValue(true);

      await expect(
        InvoiceService.createWithItems(
          {
            invoice_number: 'INV-0001',
            issue_date: '2026-07-14',
            items: [{ description: 'Item', quantity: 1, unit_price: 100 }],
          },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Invoice number already exists');
    });

    it('should throw error for item without description', async () => {
      await expect(
        InvoiceService.createWithItems(
          {
            invoice_number: 'INV-0001',
            issue_date: '2026-07-14',
            items: [{ description: '', quantity: 1, unit_price: 100 }],
          },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Description is required');
    });

    it('should throw error for item with zero quantity', async () => {
      await expect(
        InvoiceService.createWithItems(
          {
            invoice_number: 'INV-0001',
            issue_date: '2026-07-14',
            items: [{ description: 'Item', quantity: 0, unit_price: 100 }],
          },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Quantity must be greater than 0');
    });

    it('should throw error for item with negative unit price', async () => {
      await expect(
        InvoiceService.createWithItems(
          {
            invoice_number: 'INV-0001',
            issue_date: '2026-07-14',
            items: [{ description: 'Item', quantity: 1, unit_price: -100 }],
          },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Unit price cannot be negative');
    });

    it('should calculate totals correctly', async () => {
      const mockInvoice = {
        id: '123',
        invoice_number: 'INV-0001',
        subtotal: 300,
        tax_rate: 10,
        total: 330,
        items: [],
      };

      InvoiceService.repository.existsByNumber = jest.fn().mockResolvedValue(false);
      InvoiceService.repository.createWithItems = jest.fn().mockResolvedValue(mockInvoice);

      await InvoiceService.createWithItems(
        {
          invoice_number: 'INV-0001',
          issue_date: '2026-07-14',
          tax_rate: 10,
          items: [
            { description: 'Item 1', quantity: 2, unit_price: 100 },
            { description: 'Item 2', quantity: 1, unit_price: 100 },
          ],
        },
        'org-1',
        'user-1'
      );

      const createCall = InvoiceService.repository.createWithItems.mock.calls[0];
      expect(createCall[0].subtotal).toBe(300);
      expect(createCall[0].total).toBe(330);
    });

    it('should generate share token if not provided', async () => {
      const mockInvoice = { id: '123', share_token: 'generated-token' };

      InvoiceService.repository.existsByNumber = jest.fn().mockResolvedValue(false);
      InvoiceService.repository.createWithItems = jest.fn().mockResolvedValue(mockInvoice);

      await InvoiceService.createWithItems(
        {
          invoice_number: 'INV-0001',
          issue_date: '2026-07-14',
          items: [{ description: 'Item', quantity: 1, unit_price: 100 }],
        },
        'org-1',
        'user-1'
      );

      const createCall = InvoiceService.repository.createWithItems.mock.calls[0];
      expect(createCall[0].share_token).toBeDefined();
    });
  });

  describe('updateWithItems', () => {
    it('should update an invoice with items', async () => {
      const mockInvoice = {
        id: '123',
        invoice_number: 'INV-0001',
        status: 'sent',
        total: 220,
      };

      InvoiceService.repository.existsByNumber = jest.fn().mockResolvedValue(false);
      InvoiceService.repository.updateWithItems = jest.fn().mockResolvedValue(mockInvoice);

      const result = await InvoiceService.updateWithItems(
        '123',
        {
          status: 'sent',
          items: [{ description: 'Updated Item', quantity: 2, unit_price: 100 }],
        },
        'org-1',
        'user-1'
      );

      expect(result.status).toBe('sent');
      expect(InvoiceService.repository.updateWithItems).toHaveBeenCalled();
    });

    it('should return null if invoice not found', async () => {
      InvoiceService.repository.updateWithItems = jest.fn().mockResolvedValue(null);

      const result = await InvoiceService.updateWithItems(
        'non-existent',
        { status: 'sent' },
        'org-1',
        'user-1'
      );

      expect(result).toBeNull();
    });

    it('should throw error if updated invoice number already exists', async () => {
      InvoiceService.repository.existsByNumber = jest.fn().mockResolvedValue(true);

      await expect(
        InvoiceService.updateWithItems(
          '123',
          { invoice_number: 'INV-0002' },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Invoice number already exists');
    });

    it('should recalculate totals when items are updated', async () => {
      const mockInvoice = { id: '123', subtotal: 200, total: 220 };

      InvoiceService.repository.updateWithItems = jest.fn().mockResolvedValue(mockInvoice);

      await InvoiceService.updateWithItems(
        '123',
        {
          tax_rate: 10,
          items: [{ description: 'Item', quantity: 2, unit_price: 100 }],
        },
        'org-1',
        'user-1'
      );

      const updateCall = InvoiceService.repository.updateWithItems.mock.calls[0];
      expect(updateCall[1].subtotal).toBe(200);
      expect(updateCall[1].total).toBe(220);
    });
  });

  describe('findByIdWithItems', () => {
    it('should find an invoice with items', async () => {
      const mockInvoice = {
        id: '123',
        invoice_number: 'INV-0001',
        total: 110,
        due_date: '2026-07-30',
        items: [{ description: 'Item', quantity: 1, unit_price: 100 }],
      };

      InvoiceService.repository.findByIdWithItems = jest
        .fn()
        .mockResolvedValue(mockInvoice);

      const result = await InvoiceService.findByIdWithItems('123', 'org-1');

      expect(result.invoice_number).toBe('INV-0001');
      expect(result.items).toHaveLength(1);
      expect(result.is_overdue).toBeDefined();
      expect(result.days_until_due).toBeDefined();
    });

    it('should return null if invoice not found', async () => {
      InvoiceService.repository.findByIdWithItems = jest.fn().mockResolvedValue(null);

      const result = await InvoiceService.findByIdWithItems('non-existent', 'org-1');

      expect(result).toBeNull();
    });
  });

  describe('findAllWithClients', () => {
    it('should find all invoices with client info', async () => {
      const mockInvoices = [
        { id: '1', invoice_number: 'INV-0001', client_name: 'Client A' },
        { id: '2', invoice_number: 'INV-0002', client_name: 'Client B' },
      ];

      InvoiceService.repository.findAllWithClients = jest
        .fn()
        .mockResolvedValue(mockInvoices);

      const result = await InvoiceService.findAllWithClients('org-1');

      expect(result).toHaveLength(2);
      expect(result[0].is_overdue).toBeDefined();
    });

    it('should filter by status', async () => {
      const mockInvoices = [{ id: '1', status: 'paid' }];

      InvoiceService.repository.findAllWithClients = jest
        .fn()
        .mockResolvedValue(mockInvoices);

      await InvoiceService.findAllWithClients('org-1', { status: 'paid' });

      expect(InvoiceService.repository.findAllWithClients).toHaveBeenCalledWith('org-1', {
        status: 'paid',
      });
    });
  });

  describe('getStatistics', () => {
    it('should get invoice statistics', async () => {
      const mockStats = {
        draft: { count: 5, total: 1000 },
        sent: { count: 10, total: 5000 },
        paid: { count: 20, total: 10000 },
        overdue: { count: 3, total: 1500 },
        cancelled: { count: 1, total: 500 },
      };

      InvoiceService.repository.getStatsByStatus = jest.fn().mockResolvedValue(mockStats);

      const result = await InvoiceService.getStatistics('org-1');

      expect(result.by_status).toEqual(mockStats);
      expect(result.total_invoices).toBe(39);
      expect(result.total_revenue).toBe(18000);
      expect(result.outstanding).toBe(6500);
    });
  });

  describe('findOverdue', () => {
    it('should find overdue invoices', async () => {
      const mockInvoices = [
        { id: '1', invoice_number: 'INV-0001', due_date: '2026-07-01' },
        { id: '2', invoice_number: 'INV-0002', due_date: '2026-07-05' },
      ];

      InvoiceService.repository.findOverdue = jest.fn().mockResolvedValue(mockInvoices);

      const result = await InvoiceService.findOverdue('org-1');

      expect(result).toHaveLength(2);
      expect(result[0].is_overdue).toBeDefined();
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate next invoice number', async () => {
      InvoiceService.repository.generateInvoiceNumber = jest
        .fn()
        .mockResolvedValue('INV-0042');

      const result = await InvoiceService.generateInvoiceNumber('org-1');

      expect(result).toBe('INV-0042');
    });
  });

  describe('status management', () => {
    it('should mark invoice as sent', async () => {
      const mockInvoice = { id: '123', status: 'sent' };

      InvoiceService.repository.updateWithItems = jest.fn().mockResolvedValue(mockInvoice);

      const result = await InvoiceService.markAsSent('123', 'org-1', 'user-1');

      expect(result.status).toBe('sent');
    });

    it('should mark invoice as paid', async () => {
      const mockInvoice = { id: '123', status: 'paid' };

      InvoiceService.repository.updateWithItems = jest.fn().mockResolvedValue(mockInvoice);

      const result = await InvoiceService.markAsPaid('123', 'org-1', 'user-1');

      expect(result.status).toBe('paid');
    });

    it('should cancel invoice', async () => {
      const mockInvoice = { id: '123', status: 'cancelled' };

      InvoiceService.repository.updateWithItems = jest.fn().mockResolvedValue(mockInvoice);

      const result = await InvoiceService.cancel('123', 'org-1', 'user-1');

      expect(result.status).toBe('cancelled');
    });
  });

  describe('findByShareToken', () => {
    it('should find invoice by share token', async () => {
      const mockInvoice = {
        id: '123',
        invoice_number: 'INV-0001',
        share_token: 'token-123',
      };

      InvoiceService.repository.findByShareToken = jest
        .fn()
        .mockResolvedValue(mockInvoice);

      const result = await InvoiceService.findByShareToken('token-123');

      expect(result.invoice_number).toBe('INV-0001');
    });

    it('should return null if token not found', async () => {
      InvoiceService.repository.findByShareToken = jest.fn().mockResolvedValue(null);

      const result = await InvoiceService.findByShareToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('calculation helpers', () => {
    it('should calculate totals correctly', () => {
      const items = [
        { quantity: 2, unit_price: 50 },
        { quantity: 1, unit_price: 100 },
      ];

      const result = InvoiceService.calculateTotals(items, 10);

      expect(result.subtotal).toBe(200);
      expect(result.tax_amount).toBe(20);
      expect(result.total).toBe(220);
    });

    it('should calculate totals without tax', () => {
      const items = [{ quantity: 2, unit_price: 50 }];

      const result = InvoiceService.calculateTotals(items, 0);

      expect(result.subtotal).toBe(100);
      expect(result.tax_amount).toBe(0);
      expect(result.total).toBe(100);
    });

    it('should prepare line items with amounts', () => {
      const items = [
        { description: 'Item 1', quantity: 2, unit_price: 50 },
        { description: 'Item 2', quantity: 1, unit_price: 100 },
      ];

      const result = InvoiceService.prepareLineItems(items);

      expect(result[0].amount).toBe(100);
      expect(result[1].amount).toBe(100);
    });

    it('should check if invoice is overdue', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const overdueInvoice = {
        status: 'sent',
        due_date: pastDate.toISOString().split('T')[0],
      };

      expect(InvoiceService.isOverdue(overdueInvoice)).toBe(true);
    });

    it('should not mark paid invoice as overdue', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const paidInvoice = {
        status: 'paid',
        due_date: pastDate.toISOString().split('T')[0],
      };

      expect(InvoiceService.isOverdue(paidInvoice)).toBe(false);
    });

    it('should calculate days until due', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const invoice = {
        due_date: futureDate.toISOString().split('T')[0],
      };

      const days = InvoiceService.daysUntilDue(invoice);

      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThanOrEqual(10);
    });

    it('should return null for days until due if no due date', () => {
      const invoice = { due_date: null };

      expect(InvoiceService.daysUntilDue(invoice)).toBeNull();
    });
  });

  describe('enrichEntity', () => {
    it('should enrich invoice with computed fields', () => {
      const invoice = {
        id: '123',
        status: 'sent',
        total: 100,
        due_date: '2026-07-30',
      };

      const enriched = InvoiceService.enrichEntity(invoice);

      expect(enriched.is_overdue).toBeDefined();
      expect(enriched.days_until_due).toBeDefined();
      expect(enriched.amount_due).toBe(100);
    });

    it('should set amount_due to 0 for paid invoices', () => {
      const invoice = {
        id: '123',
        status: 'paid',
        total: 100,
      };

      const enriched = InvoiceService.enrichEntity(invoice);

      expect(enriched.amount_due).toBe(0);
    });
  });
});
