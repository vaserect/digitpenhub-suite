/**
 * E-commerce & Store Routes Configuration
 * Store builder, products, orders, inventory, and POS
 */

module.exports = {
  group: 'E-commerce',
  routes: [
    {
      path: '/api/v1/store-builder',
      router: require('../storeBuilder'),
      middleware: [],
      description: 'Store builder (includes public storefront routes)',
      public: false,
      moduleSlug: 'store-builder',
    },
    {
      path: '/api/v1/inventory',
      router: require('../inventory'),
      middleware: [],
      description: 'Inventory management',
      public: false,
      moduleSlug: 'inventory',
    },
    {
      path: '/api/v1/pos',
      router: require('../pos'),
      middleware: [],
      description: 'Point of Sale system',
      public: false,
      moduleSlug: 'pos',
    },
    {
      path: '/api/v1/orders',
      router: require('../orders'),
      middleware: [],
      description: 'Order management and tracking',
      public: false,
      moduleSlug: 'order-management',
    },
    {
      path: '/api/v1/customer-subs',
      router: require('../subscriptions'),
      middleware: [],
      description: 'Customer subscriptions management',
      public: false,
      moduleSlug: 'subscriptions',
    },
    {
      path: '/api/v1/delivery',
      router: require('../delivery'),
      middleware: [],
      description: 'Delivery tracking and logistics',
      public: false,
      moduleSlug: 'delivery-tracking',
    },
    {
      path: '/api/v1/coupons',
      router: require('../coupons'),
      middleware: [],
      description: 'Coupon and discount management',
      public: false,
      moduleSlug: 'coupons',
    },
    {
      path: '/api/v1/digital-products',
      router: require('../digitalProducts'),
      middleware: [],
      description: 'Digital product management and delivery',
      public: false,
      moduleSlug: 'digital-products',
    },
  ],
};
