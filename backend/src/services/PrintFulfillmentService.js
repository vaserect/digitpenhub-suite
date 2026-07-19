const BaseService = require('./base/BaseService');
const crypto = require('crypto');
const { trackActivity } = require('../utils/activityTracker');
const { notify } = require('../utils/notify');

/**
 * PrintFulfillmentService - Manages business logic for Print Fulfillment (Vistaprint/Moo benchmark)
 */
class PrintFulfillmentService extends BaseService {
  constructor(repository) {
    super(repository, { serviceName: 'PrintFulfillmentService' });
  }

  // ==================== CATALOG ====================

  async listProducts(filters) {
    return this.repository.findProducts(filters);
  }

  async getProduct(id) {
    const product = await this.repository.findProductById(id);
    if (!product) throw new Error('Product not found in print catalog');
    return product;
  }

  // ==================== ORDERS ====================

  async listOrders(orgId, filters) {
    return this.repository.findOrders(orgId, filters);
  }

  async getOrder(id, orgId) {
    const order = await this.repository.findOrderById(id, orgId);
    if (!order) throw new Error('Print order not found');
    return order;
  }

  /**
   * Validate address input fields
   */
  validateAddress(address) {
    const { to_name, line1, city, state, zip } = address;
    if (!to_name || !to_name.trim()) return 'Recipient name is required';
    if (!line1 || !line1.trim()) return 'Street address is required';
    if (!city || !city.trim()) return 'City is required';
    if (!state || !state.trim()) return 'State/Region is required';
    if (!zip || !zip.trim()) return 'Postal/ZIP code is required';
    return null;
  }

  /**
   * Place an order for custom print materials
   */
  async placeOrder(data, orgId, userId) {
    try {
      const { product_id, quantity, specs, artwork_url, shipping_address, shipping_method } = data;

      // Verify product
      const product = await this.getProduct(product_id);

      // Verify address
      const addressError = this.validateAddress(shipping_address);
      if (addressError) {
        throw new Error(`Shipping address error: ${addressError}`);
      }

      if (!artwork_url || !artwork_url.trim()) {
        throw new Error('Artwork design link/URL is required');
      }

      // Calculate shipping cost
      let shippingCost = 4.99; // Standard FedEx
      if (shipping_method === 'express') shippingCost = 14.99;
      else if (shipping_method === 'overnight') shippingCost = 29.99;

      // Calculate total price: base product rate + shipping
      const totalPrice = Number(product.base_price) + shippingCost;

      // Generate mock third-party identifiers
      const providerOrderId = 'po_' + crypto.randomBytes(8).toString('hex');
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + (shipping_method === 'overnight' ? 2 : shipping_method === 'express' ? 4 : 7));

      const order = await this.repository.createOrder({
        product_id,
        quantity,
        specs: specs || {},
        artwork_url,
        shipping_address,
        shipping_method: shipping_method || 'standard',
        shipping_cost: shippingCost,
        total_price: totalPrice,
        status: 'ordered',
        status_details: 'Print job received. Preparing design templates for manual pre-press proofing check.',
        provider_order_id: providerOrderId,
        estimated_delivery_date: estimatedDelivery
      }, orgId, userId);

      // Track aggregated daily metrics
      const today = new Date().toISOString().split('T')[0];
      await this.repository.db.query(
        `INSERT INTO print_analytics_daily (org_id, date, orders, revenue)
         VALUES ($1, $2, 1, $3)
         ON CONFLICT (org_id, date) 
         DO UPDATE SET orders = print_analytics_daily.orders + 1, revenue = print_analytics_daily.revenue + $3`,
        [orgId, today, totalPrice]
      );

      // Log platform telemetry activity
      await trackActivity(orgId, userId, 'print_fulfillment.ordered', {
        description: `Custom print job (${product.name}) placed successfully. Spec Quantity: ${quantity}. Order Ref: ${providerOrderId}`,
        metadata: { orderId: order.id, providerOrderId, totalPrice }
      });

      // Notify admins
      await notify(orgId, {
        type: 'print_order_submitted',
        title: 'New Print Fulfillment Order',
        body: `A new custom print job for ${product.name} has been placed. Cost: $${totalPrice}`,
        email: true
      });

      return order;
    } catch (error) {
      this.logger.error('PrintFulfillmentService: Error placing order', { data, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Advance print job tracking status (simulates printing operations callback)
   */
  async simulateStatusAdvance(id, orgId) {
    const order = await this.getOrder(id, orgId);

    const sequence = ['ordered', 'proofing', 'printing', 'shipped', 'delivered'];
    const currentIdx = sequence.indexOf(order.status);

    if (currentIdx === -1 || order.status === 'delivered' || order.status === 'cancelled') {
      return order;
    }

    const nextStatus = sequence[currentIdx + 1];
    let details = `Printing job updated automatically. Current phase: ${nextStatus}.`;
    let trackingNumber = order.tracking_number;

    if (nextStatus === 'proofing') {
      details = 'Pre-press artwork proofing passed successfully. Dimensions, bleeds, and DPI density verified.';
    } else if (nextStatus === 'printing') {
      details = 'Job queued into large-format sheet offset printer.';
    } else if (nextStatus === 'shipped') {
      trackingNumber = '1Z' + crypto.randomBytes(12).toString('hex').toUpperCase();
      details = `Print materials packed. Handed off to FedEx carrier. Tracking: ${trackingNumber}`;
    } else if (nextStatus === 'delivered') {
      details = 'Carrier confirmed drop-off at destination shipping dock/bin.';
    }

    // Update DB
    const query = `
      UPDATE print_orders
      SET status = $1, status_details = $2, tracking_number = $3, updated_at = now()
      WHERE id = $4 AND org_id = $5 RETURNING *
    `;
    const { rows } = await this.repository.db.query(query, [nextStatus, details, trackingNumber, id, orgId]);
    const updatedOrder = rows[0];

    // Notification alert on delivery
    if (nextStatus === 'delivered') {
      await notify(orgId, {
        userId: order.user_id,
        type: 'print_order_delivered',
        title: 'Print materials delivered!',
        body: `Your custom printed materials order (${order.product_name}) has been delivered successfully.`,
        email: false
      });
    }

    return updatedOrder;
  }

  // ==================== ANALYTICS ====================

  async getExecutiveAnalytics(orgId, startDate, endDate) {
    return this.repository.getAnalytics(orgId, startDate, endDate);
  }
}

module.exports = PrintFulfillmentService;
