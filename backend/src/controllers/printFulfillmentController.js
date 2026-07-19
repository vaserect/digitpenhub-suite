const PrintFulfillmentService = require('../services/PrintFulfillmentService');
const PrintFulfillmentRepository = require('../repositories/PrintFulfillmentRepository');
const db = require('../db');

const printFulfillmentRepository = new PrintFulfillmentRepository(db);
const printFulfillmentService = new PrintFulfillmentService(printFulfillmentRepository);

// ==================== CATALOG ====================

exports.listProducts = async (req, res) => {
  try {
    const products = await printFulfillmentService.listProducts(req.query);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await printFulfillmentService.getProduct(id);
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

// ==================== ORDERS ====================

exports.listOrders = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const orders = await printFulfillmentService.listOrders(orgId, req.query);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const order = await printFulfillmentService.getOrder(id, orgId);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const userId = req.user.id;
    const order = await printFulfillmentService.placeOrder(req.body, orgId, userId);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.simulateOrderAdvance = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const updated = await printFulfillmentService.simulateStatusAdvance(id, orgId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== ANALYTICS ====================

exports.getAnalytics = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { startDate, endDate } = req.query;
    const stats = await printFulfillmentService.getExecutiveAnalytics(orgId, startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
