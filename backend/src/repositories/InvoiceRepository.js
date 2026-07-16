const BaseRepository = require('./base/BaseRepository');
const db = require('../db');

/**
 * InvoiceRepository - Data access layer for invoices
 * Handles all database operations for invoice records
 */
class InvoiceRepository extends BaseRepository {
  constructor() {
    super(db, 'invoices', {
      primaryKey: 'id',
      timestamps: true,
      tenantColumn: 'org_id',
    });
  }

  /**
   * Find invoice with all line items
   * @param {string} invoiceId - Invoice ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object|null>} Invoice with items
   */
  async findByIdWithItems(invoiceId, orgId) {
    const { rows: invoices } = await this.db.query(
      `SELECT i.*, 
              c.name as client_name,
              c.email as client_email,
              c.company as client_company
       FROM ${this.tableName} i
       LEFT JOIN invoice_clients c ON c.id = i.client_id
       WHERE i.id = $1 AND i.org_id = $2`,
      [invoiceId, orgId]
    );

    if (!invoices.length) return null;

    const invoice = invoices[0];

    // Get line items
    const { rows: items } = await this.db.query(
      `SELECT * FROM invoice_items 
       WHERE invoice_id = $1 
       ORDER BY created_at ASC`,
      [invoiceId]
    );

    return {
      ...invoice,
      items,
    };
  }

  /**
   * Find all invoices with client info
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Invoices with client info
   */
  async findAllWithClients(orgId, options = {}) {
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const status = options.status;
    const orderBy = options.orderBy || 'i.created_at DESC';

    let whereClause = 'i.org_id = $1';
    const params = [orgId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND i.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const { rows } = await this.db.query(
      `SELECT i.*,
              c.name as client_name,
              c.email as client_email,
              c.company as client_company
       FROM ${this.tableName} i
       LEFT JOIN invoice_clients c ON c.id = i.client_id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return rows;
  }

  /**
   * Get statistics by status
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Statistics
   */
  async getStatsByStatus(orgId) {
    const { rows } = await this.db.query(
      `SELECT 
        status,
        COUNT(*) as count,
        SUM(total) as total_amount
       FROM ${this.tableName}
       WHERE org_id = $1
       GROUP BY status`,
      [orgId]
    );

    const stats = {
      draft: { count: 0, total: 0 },
      sent: { count: 0, total: 0 },
      paid: { count: 0, total: 0 },
      overdue: { count: 0, total: 0 },
      cancelled: { count: 0, total: 0 },
    };

    rows.forEach((row) => {
      stats[row.status] = {
        count: parseInt(row.count, 10),
        total: parseFloat(row.total_amount || 0),
      };
    });

    return stats;
  }

  /**
   * Get overdue invoices
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>} Overdue invoices
   */
  async findOverdue(orgId) {
    const { rows } = await this.db.query(
      `SELECT i.*,
              c.name as client_name,
              c.email as client_email
       FROM ${this.tableName} i
       LEFT JOIN invoice_clients c ON c.id = i.client_id
       WHERE i.org_id = $1 
         AND i.status = 'sent'
         AND i.due_date < CURRENT_DATE
       ORDER BY i.due_date ASC`,
      [orgId]
    );

    return rows;
  }

  /**
   * Generate next invoice number
   * @param {string} orgId - Organization ID
   * @returns {Promise<string>} Next invoice number
   */
  async generateInvoiceNumber(orgId) {
    const { rows } = await this.db.query(
      `SELECT invoice_number 
       FROM ${this.tableName}
       WHERE org_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [orgId]
    );

    if (!rows.length) {
      return 'INV-0001';
    }

    const lastNumber = rows[0].invoice_number;
    const match = lastNumber.match(/INV-(\d+)/);

    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `INV-${String(nextNum).padStart(4, '0')}`;
    }

    return 'INV-0001';
  }

  /**
   * Check if invoice number exists
   * @param {string} invoiceNumber - Invoice number
   * @param {string} orgId - Organization ID
   * @param {string} excludeId - Invoice ID to exclude
   * @returns {Promise<boolean>} True if exists
   */
  async existsByNumber(invoiceNumber, orgId, excludeId = null) {
    const conditions = ['org_id = $1', 'invoice_number = $2'];
    const params = [orgId, invoiceNumber];

    if (excludeId) {
      conditions.push('id != $3');
      params.push(excludeId);
    }

    const { rows } = await this.db.query(
      `SELECT 1 FROM ${this.tableName}
       WHERE ${conditions.join(' AND ')}
       LIMIT 1`,
      params
    );

    return rows.length > 0;
  }

  /**
   * Create invoice with items in transaction
   * @param {Object} invoiceData - Invoice data
   * @param {Array} items - Line items
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Created invoice with items
   */
  async createWithItems(invoiceData, items, orgId) {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Create invoice
      const { rows: [invoice] } = await client.query(
        `INSERT INTO ${this.tableName} 
         (org_id, client_id, invoice_number, status, issue_date, due_date, 
          subtotal, tax_rate, total, notes, share_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          orgId,
          invoiceData.client_id,
          invoiceData.invoice_number,
          invoiceData.status || 'draft',
          invoiceData.issue_date,
          invoiceData.due_date,
          invoiceData.subtotal,
          invoiceData.tax_rate || 0,
          invoiceData.total,
          invoiceData.notes,
          invoiceData.share_token,
        ]
      );

      // Create line items
      const createdItems = [];
      for (const item of items) {
        const { rows: [createdItem] } = await client.query(
          `INSERT INTO invoice_items 
           (invoice_id, description, quantity, unit_price, amount)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [
            invoice.id,
            item.description,
            item.quantity,
            item.unit_price,
            item.amount,
          ]
        );
        createdItems.push(createdItem);
      }

      await client.query('COMMIT');

      return {
        ...invoice,
        items: createdItems,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update invoice with items in transaction
   * @param {string} invoiceId - Invoice ID
   * @param {Object} invoiceData - Invoice data
   * @param {Array} items - Line items (optional)
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Updated invoice with items
   */
  async updateWithItems(invoiceId, invoiceData, items, orgId) {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Update invoice
      const setClauses = [];
      const params = [];
      let paramIndex = 1;

      Object.keys(invoiceData).forEach((key) => {
        if (invoiceData[key] !== undefined) {
          setClauses.push(`${key} = $${paramIndex}`);
          params.push(invoiceData[key]);
          paramIndex++;
        }
      });

      setClauses.push(`updated_at = NOW()`);
      params.push(invoiceId, orgId);

      const { rows: [invoice] } = await client.query(
        `UPDATE ${this.tableName}
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
         RETURNING *`,
        params
      );

      if (!invoice) {
        await client.query('ROLLBACK');
        return null;
      }

      // Update items if provided
      let updatedItems = [];
      if (items) {
        // Delete existing items
        await client.query(
          `DELETE FROM invoice_items WHERE invoice_id = $1`,
          [invoiceId]
        );

        // Create new items
        for (const item of items) {
          const { rows: [createdItem] } = await client.query(
            `INSERT INTO invoice_items 
             (invoice_id, description, quantity, unit_price, amount)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
              invoiceId,
              item.description,
              item.quantity,
              item.unit_price,
              item.amount,
            ]
          );
          updatedItems.push(createdItem);
        }
      } else {
        // Get existing items
        const { rows } = await client.query(
          `SELECT * FROM invoice_items WHERE invoice_id = $1`,
          [invoiceId]
        );
        updatedItems = rows;
      }

      await client.query('COMMIT');

      return {
        ...invoice,
        items: updatedItems,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find invoice by share token (public access)
   * @param {string} shareToken - Share token
   * @returns {Promise<Object|null>} Invoice with items
   */
  async findByShareToken(shareToken) {
    const { rows: invoices } = await this.db.query(
      `SELECT i.*, 
              c.name as client_name,
              c.email as client_email,
              c.company as client_company,
              c.address as client_address
       FROM ${this.tableName} i
       LEFT JOIN invoice_clients c ON c.id = i.client_id
       WHERE i.share_token = $1`,
      [shareToken]
    );

    if (!invoices.length) return null;

    const invoice = invoices[0];

    // Get line items
    const { rows: items } = await this.db.query(
      `SELECT * FROM invoice_items 
       WHERE invoice_id = $1 
       ORDER BY created_at ASC`,
      [invoice.id]
    );

    return {
      ...invoice,
      items,
    };
  }
}

module.exports = InvoiceRepository;
