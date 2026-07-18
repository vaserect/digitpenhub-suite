const express = require('express');
const router = express.Router();
const responsiveController = require('../controllers/responsiveController');
const { requireAuth: authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Breakpoint management
router.get('/breakpoints', responsiveController.getBreakpoints);
router.get('/breakpoints/:id', responsiveController.getBreakpointById);
router.post('/breakpoints', responsiveController.createBreakpoint);
router.put('/breakpoints/:id', responsiveController.updateBreakpoint);
router.delete('/breakpoints/:id', responsiveController.deleteBreakpoint);
router.post('/breakpoints/:id/set-default', responsiveController.setDefaultBreakpoint);
router.post('/breakpoints/reorder', responsiveController.reorderBreakpoints);

// Element styles
router.get('/styles/:pageId/:elementId', responsiveController.getElementStyles);
router.post('/styles', responsiveController.saveElementStyles);
router.delete('/styles/:pageId/:elementId/:breakpointId', responsiveController.deleteElementStyles);

// Computed styles and inheritance
router.get('/computed/:pageId/:elementId/:breakpointId', responsiveController.getComputedStyles);
router.get('/inheritance/:breakpointId', responsiveController.getInheritanceChain);

// Responsive images
router.post('/images', responsiveController.saveResponsiveImage);
router.get('/images/:pageId/:elementId', responsiveController.getResponsiveImages);

module.exports = router;
