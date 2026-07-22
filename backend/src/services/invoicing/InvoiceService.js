const BaseService = require('../base/BaseService');
const InvoiceRepository = require('../../repositories/InvoiceRepository');
const logger = require('../../utils/logger');
const crypto = require('crypto');

// UUID v4 generator (compatible with Jest)
const uuidv4 = () => {
  return crypto.randomUUID();
};

/**
 * InvoiceService - Business logic for invoices
 * Handles invoice management, validation, and calculations
 */
class InvoiceService extends BaseService {
  constructor() {
    const repository = new InvoiceRepository();
    super(repository, {
      serviceName: 'InvoiceService',
      logger,
    });

    // Valid invoice statuses
    this.VALID_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
  }

  /**
   * Validate data before creating an invoice
   * @param {Object} data - Invoice data
   * @throws {Error} If validation fails
   */
  validateCreate(data) {
    // Validate invoice number
    if (!data.invoice_number || !data.invoice_number.trim()) {
      throw new Error('Invoice number is required');
    }

    // Validate issue date
    if (!data.issue_date) {
      throw new Error('Issue date is required');
    }

    // Validate status
    if (data.status && !this.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Status must be one of: ${this.VALID_STATUSES.join(', ')}`);
    }

    // Validate amounts
    if (data.subtotal !== undefined && data.subtotal < 0) {
      throw new Error('Subtotal cannot be negative');
    }

    if (data.tax_rate !== undefined && (data.tax_rate < 0 || data.tax_rate > 100)) {
      throw new Error('Tax rate must be between 0 and 100');
    }

    if (data.total !== undefined && data.total < 0) {
      throw new Error('Total cannot be negative');
    }

    // Validate items if provided
    if (data.items) {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new Error('Invoice must have at least one line item');
      }

      data.items.forEach((item, index) => {
        if (!item.description || !item.description.trim()) {
          throw new Error(`Item ${index + 1}: Description is required`);
        }

        if (item.quantity === undefined || item.quantity <= 0) {
          throw new Error(`Item ${index + 1}: Quantity must be greater than 0`);
        }

        if (item.unit_price === undefined || item.unit_price < 0) {
          throw new Error(`Item ${index + 1}: Unit price cannot be negative`);
        }
      });
    }
  }

  /**
   * Validate data before updating an invoice
   * @param {Object} data - Invoice data
   * @throws {Error} If validation fails
   */
  validateUpdate(data) {
    // Validate status if provided
    if (data.status !== undefined && !this.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Status must be one of: ${this.VALID_STATUSES.join(', ')}`);
    }

    // Validate amounts if provided
    if (data.subtotal !== undefined && data.subtotal < 0) {
      throw new Error('Subtotal cannot be negative');
    }

    if (data.tax_rate !== undefined && (data.tax_rate < 0 || data.tax_rate > 100)) {
      throw new Error('Tax rate must be between 0 and 100');
    }

    if (data.total !== undefined && data.total < 0) {
      throw new Error('Total cannot be negative');
    }

    // Validate items if provided
    if (data.items) {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new Error('Invoice must have at least one line item');
      }

      data.items.forEach((item, index) => {
        if (!item.description || !item.description.trim()) {
          throw new Error(`Item ${index + 1}: Description is required`);
        }

        if (item.quantity === undefined || item.quantity <= 0) {
          throw new Error(`Item ${index + 1}: Quantity must be greater than 0`);
        }

        if (item.unit_price === undefined || item.unit_price < 0) {
          throw new Error(`Item ${index + 1}: Unit price cannot be negative`);
        }
      });
    }
  }

  /**
   * Transform data before creating an invoice
   * @param {Object} data - Raw invoice data
   * @returns {Object} Transformed data
   */
  transformForCreate(data) {
    const transformed = {
      client_id: data.client_id || null,
      invoice_number: data.invoice_number.trim(),
      status: data.status || 'draft',
      issue_date: data.issue_date,
      due_date: data.due_date || null,
      subtotal: data.subtotal || 0,
      tax_rate: data.tax_rate || 0,
      total: data.total || 0,
      notes: data.notes ? data.notes.trim() : null,
      share_token: data.share_token || uuidv4(),
    };

    return transformed;
  }

  /**
   * Transform data before updating an invoice
   * @param {Object} data - Raw invoice data
   * @returns {Object} Transformed data
   */
  transformForUpdate(data) {
    const transformed = {};

    if (data.client_id !== undefined) {
      transformed.client_id = data.client_id;
    }

    if (data.invoice_number !== undefined) {
      transformed.invoice_number = data.invoice_number.trim();
    }

    if (data.status !== undefined) {
      transformed.status = data.status;
    }

    if (data.issue_date !== undefined) {
      transformed.issue_date = data.issue_date;
    }

    if (data.due_date !== undefined) {
      transformed.due_date = data.due_date;
    }

    if (data.subtotal !== undefined) {
      transformed.subtotal = data.subtotal;
    }

    if (data.tax_rate !== undefined) {
      transformed.tax_rate = data.tax_rate;
    }

    if (data.total !== undefined) {
      transformed.total = data.total;
    }

    if (data.notes !== undefined) {
      transformed.notes = data.notes ? data.notes.trim() : null;
    }

    return transformed;
  }

  /**
   * Enrich invoice entity with computed fields
   * @param {Object} entity - Invoice entity
   * @returns {Object} Enriched entity
   */
  enrichEntity(entity) {
    const enriched = {
      ...entity,
      is_overdue: this.isOverdue(entity),
      days_until_due: this.daysUntilDue(entity),
      amount_due: entity.status === 'paid' ? 0 : parseFloat(entity.total || 0),
    };

    return enriched;
  }

  /**
   * Calculate invoice totals from line items
   * @param {Array} items - Line items
   * @param {number} taxRate - Tax rate (0-100)
   * @returns {Object} Calculated totals
   */
  calculateTotals(items, taxRate = 0) {
    const subtotal = items.reduce((sum, item) => {
      const amount = parseFloat(item.quantity) * parseFloat(item.unit_price);
      return sum + amount;
    }, 0);

    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  }

  /**
   * Prepare line items with calculated amounts
   * @param {Array} items - Raw line items
   * @returns {Array} Prepared items
   */
  prepareLineItems(items) {
    return items.map((item) => ({
      description: item.description.trim(),
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price),
      amount: parseFloat((item.quantity * item.unit_price).toFixed(2)),
    }));
  }

  /**
   * Check if invoice is overdue
   * @param {Object} invoice - Invoice entity
   * @returns {boolean} True if overdue
   */
  isOverdue(invoice) {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return false;
    }

    if (!invoice.due_date) {
      return false;
    }

    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dueDate < today;
  }

  /**
   * Calculate days until due date
   * @param {Object} invoice - Invoice entity
   * @returns {number|null} Days until due (negative if overdue)
   */
  daysUntilDue(invoice) {
    if (!invoice.due_date) {
      return null;
    }

    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Create invoice with line items
   * @param {Object} data - Invoice data with items
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created invoice
   */
  async createWithItems(data, orgId, userId) {
    this.logger.info(`Creating invoice with items for org ${orgId}`);

    // Validate
    this.validateCreate(data);

    // Check for duplicate invoice number
    const exists = await this.repository.existsByNumber(data.invoice_number, orgId);
    if (exists) {
      throw new Error('Invoice number already exists');
    }

    // Prepare line items
    const items = this.prepareLineItems(data.items);

    // Calculate totals
    const totals = this.calculateTotals(items, data.tax_rate || 0);

    // Transform invoice data
    const invoiceData = this.transformForCreate({
      ...data,
      subtotal: totals.subtotal,
      total: totals.total,
    });

    try {
      // Create invoice with items in transaction
      const invoice = await this.repository.createWithItems(invoiceData, items, orgId);

      this.logger.info(`Invoice created with items`, { id: invoice.id });

      return this.enrichEntity(invoice);
    } catch (error) {
      this.logger.error('Error creating invoice with items:', error);
      throw new Error('Failed to create invoice');
    }
  }

  /**
   * Update invoice with line items
   * @param {string} id - Invoice ID
   * @param {Object} data - Update data with items
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated invoice
   */
  async updateWithItems(id, data, orgId, userId) {
    this.logger.info(`Updating invoice ${id} with items for org ${orgId}`);

    // Validate
    this.validateUpdate(data);

    // Check for duplicate invoice number if changing
    if (data.invoice_number) {
      const exists = await this.repository.existsByNumber(data.invoice_number, orgId, id);
      if (exists) {
        throw new Error('Invoice number already exists');
      }
    }

    // Prepare line items if provided
    let items = null;
    let invoiceData = this.transformForUpdate(data);

    if (data.items) {
      items = this.prepareLineItems(data.items);

      // Recalculate totals
      const totals = this.calculateTotals(items, data.tax_rate || 0);
      invoiceData.subtotal = totals.subtotal;
      invoiceData.total = totals.total;
    }

    try {
      // Update invoice with items in transaction
      const invoice = await this.repository.updateWithItems(id, invoiceData, items, orgId);

      if (!invoice) {
        this.logger.warn(`Invoice not found for update`, { id });
        return null;
      }

      this.logger.info(`Invoice updated with items`, { id });

      return this.enrichEntity(invoice);
    } catch (error) {
      this.logger.error('Error updating invoice with items:', error);
      throw new Error('Failed to update invoice');
    }
  }

  /**
   * Get invoice with all line items
   * @param {string} id - Invoice ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object|null>} Invoice with items
   */
  async findByIdWithItems(id, orgId) {
    this.logger.info(`Getting invoice ${id} with items for org ${orgId}`);

    try {
      const invoice = await this.repository.findByIdWithItems(id, orgId);

      if (!invoice) {
        return null;
      }

      return this.enrichEntity(invoice);
    } catch (error) {
      this.logger.error('Error getting invoice with items:', error);
      throw new Error('Failed to get invoice');
    }
  }

  /**
   * Get all invoices with client info
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Invoices
   */
  async findAllWithClients(orgId, options = {}) {
    this.logger.info(`Getting invoices with clients for org ${orgId}`);

    try {
      const invoices = await this.repository.findAllWithClients(orgId, options);
      return invoices.map((invoice) => this.enrichEntity(invoice));
    } catch (error) {
      this.logger.error('Error getting invoices with clients:', error);
      throw new Error('Failed to get invoices');
    }
  }

  /**
   * Get statistics by status
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(orgId) {
    this.logger.info(`Getting invoice statistics for org ${orgId}`);

    try {
      const stats = await this.repository.getStatsByStatus(orgId);

      // Calculate totals
      const totalInvoices = Object.values(stats).reduce(
        (sum, s) => sum + s.count,
        0
      );
      const totalRevenue = Object.values(stats).reduce(
        (sum, s) => sum + s.total,
        0
      );

      return {
        by_status: stats,
        total_invoices: totalInvoices,
        total_revenue: totalRevenue,
        outstanding: stats.sent.total + stats.overdue.total,
      };
    } catch (error) {
      this.logger.error('Error getting invoice statistics:', error);
      throw new Error('Failed to get statistics');
    }
  }

  /**
   * Get overdue invoices
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>} Overdue invoices
   */
  async findOverdue(orgId) {
    this.logger.info(`Getting overdue invoices for org ${orgId}`);

    try {
      const invoices = await this.repository.findOverdue(orgId);
      return invoices.map((invoice) => this.enrichEntity(invoice));
    } catch (error) {
      this.logger.error('Error getting overdue invoices:', error);
      throw new Error('Failed to get overdue invoices');
    }
  }

  /**
   * Generate next invoice number
   * @param {string} orgId - Organization ID
   * @returns {Promise<string>} Next invoice number
   */
  async generateInvoiceNumber(orgId) {
    try {
      return await this.repository.generateInvoiceNumber(orgId);
    } catch (error) {
      this.logger.error('Error generating invoice number:', error);
      throw new Error('Failed to generate invoice number');
    }
  }

  /**
   * Mark invoice as sent
   * @param {string} id - Invoice ID
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated invoice
   */
  async markAsSent(id, orgId, userId) {
    return this.updateWithItems(id, { status: 'sent' }, orgId, userId);
  }

  /**
   * Mark invoice as paid
   * @param {string} id - Invoice ID
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated invoice
   */
  async markAsPaid(id, orgId, userId) {
    return this.updateWithItems(id, { status: 'paid' }, orgId, userId);
  }

  /**
   * Cancel invoice
   * @param {string} id - Invoice ID
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated invoice
   */
  async cancel(id, orgId, userId) {
    return this.updateWithItems(id, { status: 'cancelled' }, orgId, userId);
  }

  /**
   * Get invoice by share token (public access)
   * @param {string} shareToken - Share token
   * @returns {Promise<Object|null>} Invoice with items
   */
  async findByShareToken(shareToken) {
    this.logger.info(`Getting invoice by share token`);

    try {
      const invoice = await this.repository.findByShareToken(shareToken);
      if (!invoice) return null;
      return this.enrichEntity(invoice);
    } catch (error) {
      this.logger.error('Error getting invoice by share token:', error);
      throw new Error('Failed to get invoice');
    }
  }

  // ── Client Management ──────────────────────────────────────────────────────

  async findAllClients(orgId) {
    this.logger.debug('InvoiceService: Finding all clients', { orgId });
    try {
      const { rows } = await require('../../db').query(
        `SELECT id, name, email, phone, company, address, created_at
         FROM invoice_clients WHERE org_id = $1 ORDER BY created_at DESC`,
        [orgId]
      );
      return rows;
    } catch (error) {
      this.logger.error('InvoiceService: Error finding clients', { orgId, error: error.message });
      throw error;
    }
  }

  async findClient(id, orgId) {
    this.logger.debug('InvoiceService: Finding client by ID', { id, orgId });
    try {
      const { rows } = await require('../../db').query(
        `SELECT id, name, email, phone, company, address, created_at
         FROM invoice_clients WHERE id = $1 AND org_id = $2`,
        [id, orgId]
      );
      return rows[0] || null;
    } catch (error) {
      this.logger.error('InvoiceService: Error finding client', { id, orgId, error: error.message });
      throw error;
    }
  }

  async createClient(data, orgId, userId) {
    this.logger.debug('InvoiceService: Creating client', { orgId });
    try {
      const { rows } = await require('../../db').query(
        `INSERT INTO invoice_clients (org_id, name, email, phone, company, address)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, email, phone, company, address, created_at`,
        [orgId, data.name, data.email || null, data.phone || null, data.company || null, data.address || null]
      );
      return rows[0];
    } catch (error) {
      this.logger.error('InvoiceService: Error creating client', { orgId, error: error.message });
      throw error;
    }
  }

  async updateClient(id, data, orgId, userId) {
    this.logger.debug('InvoiceService: Updating client', { id, orgId });
    try {
      const { rows } = await require('../../db').query(
        `UPDATE invoice_clients
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             phone = COALESCE($3, phone),
             company = COALESCE($4, company),
             address = COALESCE($5, address),
             updated_at = now()
         WHERE id = $6 AND org_id = $7
         RETURNING id, name, email, phone, company, address, created_at`,
        [data.name || null, data.email || null, data.phone || null, data.company || null, data.address || null, id, orgId]
      );
      return rows[0] || null;
    } catch (error) {
      this.logger.error('InvoiceService: Error updating client', { id, orgId, error: error.message });
      throw error;
    }
  }

  async deleteClient(id, orgId) {
    this.logger.debug('InvoiceService: Deleting client', { id, orgId });
    try {
      const { rowCount } = await require('../../db').query(
        `DELETE FROM invoice_clients WHERE id = $1 AND org_id = $2`,
        [id, orgId]
      );
      return rowCount > 0;
    } catch (error) {
      this.logger.error('InvoiceService: Error deleting client', { id, orgId, error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new InvoiceService();
