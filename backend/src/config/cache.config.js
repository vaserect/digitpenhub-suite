/**
 * Cache Configuration
 * 
 * Defines caching strategies, TTL policies, and namespace patterns
 * for different entity types and operations.
 */

module.exports = {
  // Global cache settings
  enabled: process.env.CACHE_ENABLED !== 'false',
  type: process.env.CACHE_TYPE || 'memory', // 'redis' or 'memory'
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'digitpen:',
  },

  // Memory cache settings
  memory: {
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
  },

  // Default TTL values (in seconds)
  ttl: {
    default: 300, // 5 minutes
    short: 60, // 1 minute
    medium: 300, // 5 minutes
    long: 900, // 15 minutes
    veryLong: 3600, // 1 hour
  },

  // Entity-specific cache configurations
  entities: {
    // Contact caching
    contact: {
      namespace: 'contact',
      ttl: {
        findById: 300, // 5 minutes
        findAll: 180, // 3 minutes
        search: 120, // 2 minutes
        count: 300, // 5 minutes
        stats: 300, // 5 minutes
      },
      invalidateOn: ['create', 'update', 'delete', 'bulkCreate', 'bulkUpdate', 'bulkDelete'],
    },

    // Company caching
    company: {
      namespace: 'company',
      ttl: {
        findById: 300, // 5 minutes
        findAll: 180, // 3 minutes
        search: 120, // 2 minutes
        count: 300, // 5 minutes
        stats: 300, // 5 minutes
      },
      invalidateOn: ['create', 'update', 'delete', 'bulkCreate', 'bulkUpdate', 'bulkDelete'],
    },

    // Project caching
    project: {
      namespace: 'project',
      ttl: {
        findById: 180, // 3 minutes (more dynamic)
        findByIdWithStats: 120, // 2 minutes (includes stats)
        findAll: 120, // 2 minutes
        findAllWithStats: 120, // 2 minutes
        search: 120, // 2 minutes
        count: 180, // 3 minutes
        stats: 180, // 3 minutes
      },
      invalidateOn: ['create', 'update', 'delete', 'bulkCreate', 'bulkUpdate', 'bulkDelete'],
    },

    // Task caching
    task: {
      namespace: 'task',
      ttl: {
        findById: 120, // 2 minutes (very dynamic)
        findByProject: 120, // 2 minutes
        findAll: 120, // 2 minutes
        search: 120, // 2 minutes
        count: 180, // 3 minutes
        stats: 120, // 2 minutes
      },
      invalidateOn: ['create', 'update', 'delete', 'updateStatus', 'reorder', 'bulkCreate', 'bulkUpdate', 'bulkDelete'],
      // Also invalidate project cache when tasks change
      cascadeInvalidate: ['project'],
    },

    // Invoice caching
    invoice: {
      namespace: 'invoice',
      ttl: {
        findById: 300, // 5 minutes
        findAll: 180, // 3 minutes
        search: 120, // 2 minutes
        count: 300, // 5 minutes
        stats: 300, // 5 minutes
      },
      invalidateOn: ['create', 'update', 'delete', 'bulkCreate', 'bulkUpdate', 'bulkDelete'],
    },
  },

  // Cache key patterns
  keyPatterns: {
    // Single entity: namespace:orgId:method:id
    entity: '{namespace}:{orgId}:{method}:{id}',
    
    // List queries: namespace:orgId:method:hash(filters)
    list: '{namespace}:{orgId}:{method}:{filtersHash}',
    
    // Search queries: namespace:orgId:search:query
    search: '{namespace}:{orgId}:search:{query}',
    
    // Statistics: namespace:orgId:stats
    stats: '{namespace}:{orgId}:stats',
    
    // Count: namespace:orgId:count:hash(filters)
    count: '{namespace}:{orgId}:count:{filtersHash}',
  },

  // Cache invalidation strategies
  invalidation: {
    // Invalidate on write operations
    onWrite: true,
    
    // Invalidate related caches
    cascading: true,
    
    // Patterns to invalidate on entity changes
    patterns: {
      entity: [
        '{namespace}:{orgId}:findById:{id}',
        '{namespace}:{orgId}:findAll:*',
        '{namespace}:{orgId}:search:*',
        '{namespace}:{orgId}:count:*',
        '{namespace}:{orgId}:stats',
      ],
      list: [
        '{namespace}:{orgId}:findAll:*',
        '{namespace}:{orgId}:search:*',
        '{namespace}:{orgId}:count:*',
      ],
    },
  },

  // Performance settings
  performance: {
    // Compress values larger than this (bytes)
    compressionThreshold: 1024,
    
    // Maximum cache key length
    maxKeyLength: 250,
    
    // Batch operations
    batchSize: 100,
  },

  // Monitoring
  monitoring: {
    // Log cache operations
    logOperations: process.env.CACHE_LOG_OPERATIONS === 'true',
    
    // Track cache statistics
    trackStats: true,
    
    // Stats reporting interval (ms)
    statsInterval: 60000, // 1 minute
  },
};
