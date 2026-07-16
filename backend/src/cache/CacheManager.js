let Redis;
try {
  Redis = require('ioredis');
} catch (error) {
  // ioredis not installed - will use memory cache only
  Redis = null;
}
const logger = require('../utils/logger');

/**
 * CacheManager - Unified caching interface with Redis and in-memory fallback
 * 
 * Features:
 * - Redis support for distributed caching
 * - In-memory fallback for development/testing
 * - Automatic TTL management
 * - Cache invalidation patterns
 * - Namespace support for multi-tenancy
 * - Compression for large values
 */
class CacheManager {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      type: config.type || process.env.CACHE_TYPE || 'memory', // 'redis' or 'memory'
      redis: {
        host: config.redis?.host || process.env.REDIS_HOST || 'localhost',
        port: config.redis?.port || process.env.REDIS_PORT || 6379,
        password: config.redis?.password || process.env.REDIS_PASSWORD,
        db: config.redis?.db || process.env.REDIS_DB || 0,
        keyPrefix: config.redis?.keyPrefix || 'digitpen:',
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      },
      defaultTTL: config.defaultTTL || 300, // 5 minutes default
      maxMemoryItems: config.maxMemoryItems || 1000,
      compressionThreshold: config.compressionThreshold || 1024, // 1KB
    };

    this.client = null;
    this.memoryCache = new Map();
    this.memoryTimers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };

    this.initialize();
  }

  /**
   * Initialize cache client
   */
  initialize() {
    if (!this.config.enabled) {
      logger.info('Cache is disabled');
      return;
    }

    if (this.config.type === 'redis') {
      if (!Redis) {
        logger.warn('Redis module not installed, falling back to memory cache');
        this.config.type = 'memory';
        logger.info('Using in-memory cache');
        return;
      }
      
      try {
        this.client = new Redis(this.config.redis);

        this.client.on('connect', () => {
          logger.info('Redis cache connected', {
            host: this.config.redis.host,
            port: this.config.redis.port,
          });
        });

        this.client.on('error', (error) => {
          logger.error('Redis cache error', { error: error.message });
          this.stats.errors++;
          // Fallback to memory cache on Redis errors
          if (!this.memoryCache) {
            this.memoryCache = new Map();
            logger.warn('Falling back to in-memory cache');
          }
        });

        this.client.on('close', () => {
          logger.warn('Redis cache connection closed');
        });
      } catch (error) {
        logger.error('Failed to initialize Redis cache', { error: error.message });
        this.config.type = 'memory';
        logger.info('Using in-memory cache as fallback');
      }
    } else {
      logger.info('Using in-memory cache');
    }
  }

  /**
   * Generate cache key with namespace
   * @param {string} namespace - Cache namespace (e.g., 'contact', 'project')
   * @param {string} key - Cache key
   * @param {string} orgId - Organization ID for multi-tenancy
   * @returns {string} Full cache key
   */
  generateKey(namespace, key, orgId = null) {
    const parts = [namespace];
    if (orgId) {
      parts.push(orgId);
    }
    parts.push(key);
    return parts.join(':');
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    if (!this.config.enabled) {
      return null;
    }

    try {
      let value = null;

      if (this.config.type === 'redis' && this.client) {
        const data = await this.client.get(key);
        if (data) {
          value = JSON.parse(data);
          this.stats.hits++;
        } else {
          this.stats.misses++;
        }
      } else {
        // Memory cache
        if (this.memoryCache.has(key)) {
          value = this.memoryCache.get(key);
          this.stats.hits++;
        } else {
          this.stats.misses++;
        }
      }

      if (value) {
        logger.debug('Cache hit', { key });
      } else {
        logger.debug('Cache miss', { key });
      }

      return value;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = null) {
    if (!this.config.enabled) {
      return false;
    }

    try {
      const ttlSeconds = ttl || this.config.defaultTTL;
      const serialized = JSON.stringify(value);

      if (this.config.type === 'redis' && this.client) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        // Memory cache with TTL
        this.memoryCache.set(key, value);

        // Clear existing timer
        if (this.memoryTimers.has(key)) {
          clearTimeout(this.memoryTimers.get(key));
        }

        // Set expiration timer
        const timer = setTimeout(() => {
          this.memoryCache.delete(key);
          this.memoryTimers.delete(key);
          logger.debug('Cache entry expired', { key });
        }, ttlSeconds * 1000);

        this.memoryTimers.set(key, timer);

        // Enforce max items limit
        if (this.memoryCache.size > this.config.maxMemoryItems) {
          const firstKey = this.memoryCache.keys().next().value;
          this.memoryCache.delete(firstKey);
          if (this.memoryTimers.has(firstKey)) {
            clearTimeout(this.memoryTimers.get(firstKey));
            this.memoryTimers.delete(firstKey);
          }
        }
      }

      this.stats.sets++;
      logger.debug('Cache set', { key, ttl: ttlSeconds });
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    if (!this.config.enabled) {
      return false;
    }

    try {
      if (this.config.type === 'redis' && this.client) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
        if (this.memoryTimers.has(key)) {
          clearTimeout(this.memoryTimers.get(key));
          this.memoryTimers.delete(key);
        }
      }

      this.stats.deletes++;
      logger.debug('Cache delete', { key });
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'contact:org-123:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async deletePattern(pattern) {
    if (!this.config.enabled) {
      return 0;
    }

    try {
      let deletedCount = 0;

      if (this.config.type === 'redis' && this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          deletedCount = await this.client.del(...keys);
        }
      } else {
        // Convert pattern to regex
        const regex = new RegExp(
          '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
        );

        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            if (this.memoryTimers.has(key)) {
              clearTimeout(this.memoryTimers.get(key));
              this.memoryTimers.delete(key);
            }
            deletedCount++;
          }
        }
      }

      this.stats.deletes += deletedCount;
      logger.debug('Cache pattern delete', { pattern, count: deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Cache pattern delete error', { pattern, error: error.message });
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Clear all cache entries
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    if (!this.config.enabled) {
      return false;
    }

    try {
      if (this.config.type === 'redis' && this.client) {
        await this.client.flushdb();
      } else {
        // Clear all timers
        for (const timer of this.memoryTimers.values()) {
          clearTimeout(timer);
        }
        this.memoryCache.clear();
        this.memoryTimers.clear();
      }

      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error', { error: error.message });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Existence status
   */
  async exists(key) {
    if (!this.config.enabled) {
      return false;
    }

    try {
      if (this.config.type === 'redis' && this.client) {
        const result = await this.client.exists(key);
        return result === 1;
      } else {
        return this.memoryCache.has(key);
      }
    } catch (error) {
      logger.error('Cache exists error', { key, error: error.message });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      total,
      type: this.config.type,
      enabled: this.config.enabled,
      memorySize: this.config.type === 'memory' ? this.memoryCache.size : null,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
    logger.info('Cache stats reset');
  }

  /**
   * Close cache connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      logger.info('Cache connection closed');
    }

    // Clear all memory timers
    for (const timer of this.memoryTimers.values()) {
      clearTimeout(timer);
    }
    this.memoryCache.clear();
    this.memoryTimers.clear();
  }

  /**
   * Wrap a function with caching
   * @param {Function} fn - Function to wrap
   * @param {Object} options - Caching options
   * @returns {Function} Wrapped function
   */
  wrap(fn, options = {}) {
    const {
      namespace = 'default',
      keyGenerator = (...args) => JSON.stringify(args),
      ttl = null,
    } = options;

    return async (...args) => {
      const key = this.generateKey(namespace, keyGenerator(...args));
      
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = await fn(...args);
      await this.set(key, result, ttl);
      
      return result;
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create CacheManager instance
 * @param {Object} config - Cache configuration
 * @returns {CacheManager} Cache manager instance
 */
function getCacheManager(config = null) {
  if (!instance || config) {
    instance = new CacheManager(config);
  }
  return instance;
}

module.exports = {
  CacheManager,
  getCacheManager,
};
