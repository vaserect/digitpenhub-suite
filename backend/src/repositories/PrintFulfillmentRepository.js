const BaseRepository = require('./base/BaseRepository');

/**
 * PrintFulfillmentRepository - Manages database operations for Print Fulfillment (Vistaprint/Moo benchmark)
 */
class PrintFulfillmentRepository extends BaseRepository {
  constructor(db) {
    // Base table is print_products
    super(db, 'print_products', {
      primaryKey: 'id',
      timestamps: false
    });
  }

  // ==================== PRODUCTS CATALOG ====================

  async findProducts(filters = {}) {
    try {
      const { category, limit = 50, offset = 0 } = filters;
      let query = `SELECT * FROM print_products`;
      const params = [];
      let paramIdx = 1;

      if (category) {
        query += ` WHERE category = $${paramIdx++}`;
        params.push(category);
      }

      query += ` ORDER BY name ASC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('PrintFulfillmentRepository: Error finding products', { filters, error: error.message });
      throw error;
    }
  }

  async findProductById(id) {
    const { rows } = await this.db.query(`SELECT * FROM print_products WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  // ==================== ORDERS ====================

  async findOrders(orgId, filters = {}) {
    try {
      const { status, limit = 50, offset = 0 } = filters;
      let query = `
        SELECT o.*, p.name as product_name, p.category as product_category
        FROM print_orders o
        JOIN print_products p ON o.product_id = p.id
        WHERE o.org_id = $1
      `;
      const params = [orgId];
      let paramIdx = 2;

      if (status) {
        query += ` AND o.status = $${paramIdx++}`;
        params.push(status);
      }

      query += ` ORDER BY o.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('PrintFulfillmentRepository: Error finding orders', { orgId, filters, error: error.message });
      throw error;
    }
  }

  async findOrderById(id, orgId) {
    const { rows } = await this.db.query(
      `SELECT o.*, p.name as product_name, p.category as product_category
       FROM print_orders o
       JOIN print_products p ON o.product_id = p.id
       WHERE o.id = $1 AND o.org_id = $2`,
      [id, orgId]
    );
    return rows[0] || null;
  }

  async createOrder(data, orgId, userId) {
    const query = `
      INSERT INTO print_orders (
        org_id, user_id, product_id, quantity, specs, artwork_url,
        shipping_address, shipping_method, shipping_cost, total_price,
        status, status_details, tracking_number, tracking_carrier, provider_order_id, estimated_delivery_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *
    `;
    const params = [
      orgId,
      userId || null,
      data.product_id,
      data.quantity,
      data.specs,
      data.artwork_url,
      data.shipping_address,
      data.shipping_method || 'standard',
      data.shipping_cost || 0.00,
      data.total_price,
      data.status || 'ordered',
      data.status_details || null,
      data.tracking_number || null,
      data.tracking_carrier || 'FedEx',
      data.provider_order_id || null,
      data.estimated_delivery_date || null
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async updateOrderStatus(id, status, details, orgId) {
    const query = `
      UPDATE print_orders
      SET status = $1, status_details = $2, updated_at = now()
      WHERE id = $3 AND org_id = $4 RETURNING *
    `;
    const { rows } = await this.db.query(query, [status, details || null, id, orgId]);
    return rows[0] || null;
  }

  // ==================== ANALYTICS ====================

  async getAnalytics(orgId, startDate, endDate) {
    try {
      const query = `
        SELECT
          COUNT(*) as total_orders,
          COALESCE(SUM(total_price), 0.00) as total_spend,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as total_delivered,
          COUNT(CASE WHEN status = 'printing' THEN 1 END) as total_in_production,
          COUNT(CASE WHEN status = 'shipped' THEN 1 END) as total_shipped
        FROM print_orders
        WHERE org_id = $1 AND created_at >= $2 AND created_at <= $3
      `;
      const { rows } = await this.db.query(query, [orgId, startDate || '1970-01-01', endDate || '9999-12-31']);
      return rows[0];
    } catch (error) {
      this.logger.error('PrintFulfillmentRepository: Error getting analytics', { orgId, error: error.message });
      throw error;
    }
  }
}

module.exports = PrintFulfillmentRepository;
