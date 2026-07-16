const { getCacheManager } = require('./CacheManager');

// Module-level cache instance (can be overridden for testing)
let cacheInstance = null;

/**
 * Set cache instance (for testing)
 */
function setCacheInstance(cache) {
  cacheInstance = cache;
}

/**
 * Get cache instance
 */
function getCacheInstance() {
  return cacheInstance || getCacheManager();
}

/**
 * Decorator for caching method results
 * 
 * @param {string} namespace - Cache namespace (e.g., 'contact', 'project')
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Optional custom key generator
 */
function cached(namespace, ttl, keyGenerator = null) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const cache = getCacheInstance();
      
      // Generate cache key
      const key = keyGenerator
        ? keyGenerator(...args)
        : cache.generateKey(namespace, propertyKey, ...args);

      // Try to get from cache
      const cached = await cache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      if (result !== null && result !== undefined) {
        await cache.set(key, result, ttl);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator for invalidating cache on method execution
 * 
 * @param {string} namespace - Cache namespace
 * @param {Function} keyGenerator - Optional custom key generator for specific keys
 * @param {boolean} invalidateAll - If true, invalidates all keys in namespace
 */
function invalidateCache(namespace, keyGenerator = null, invalidateAll = false) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      // Execute original method first
      const result = await originalMethod.apply(this, args);

      const cache = getCacheInstance();

      // Invalidate cache
      if (invalidateAll) {
        await cache.deletePattern(`${namespace}:*`);
      } else if (keyGenerator) {
        const key = keyGenerator(...args);
        await cache.delete(key);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator for caching with organization-specific keys
 * 
 * @param {string} namespace - Cache namespace
 * @param {number} ttl - Time to live in seconds
 * @param {number} orgIdIndex - Index of orgId in method arguments (default: 1)
 */
function cachedByOrg(namespace, ttl, orgIdIndex = 1) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const cache = getCacheInstance();
      const orgId = args[orgIdIndex];
      
      // Generate org-specific cache key
      const key = cache.generateKey(namespace, propertyKey, orgId, ...args);

      // Try to get from cache
      const cached = await cache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      if (result !== null && result !== undefined) {
        await cache.set(key, result, ttl);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator for methods that should invalidate multiple cache namespaces
 * 
 * @param {string[]} namespaces - Array of cache namespaces to invalidate
 */
function invalidateMultiple(namespaces) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      // Execute original method first
      const result = await originalMethod.apply(this, args);

      const cache = getCacheInstance();

      // Invalidate all specified namespaces
      for (const namespace of namespaces) {
        await cache.deletePattern(`${namespace}:*`);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Manual caching helper for services
 */
class CacheHelper {
  constructor(namespace, orgId = null) {
    this.namespace = namespace;
    this.orgId = orgId;
    this.cache = getCacheInstance();
  }

  /**
   * Generate cache key
   */
  key(method, ...args) {
    const argsKey = args.length > 0 ? JSON.stringify(args) : '';
    return this.cache.generateKey(this.namespace, `${method}:${argsKey}`, this.orgId);
  }

  /**
   * Get from cache
   */
  async get(method, ...args) {
    const key = this.key(method, ...args);
    return await this.cache.get(key);
  }

  /**
   * Set in cache
   */
  async set(method, value, ttl, ...args) {
    const key = this.key(method, ...args);
    return await this.cache.set(key, value, ttl);
  }

  /**
   * Delete from cache
   */
  async delete(method, ...args) {
    const key = this.key(method, ...args);
    return await this.cache.delete(key);
  }

  /**
   * Delete pattern
   */
  async deletePattern(pattern) {
    const fullPattern = `${this.namespace}:${this.orgId || '*'}:${pattern}`;
    return await this.cache.deletePattern(fullPattern);
  }

  /**
   * Invalidate specific entity
   */
  async invalidateEntity(entityId) {
    await this.delete('findById', entityId);
    await this.deletePattern('findAll:*');
    await this.deletePattern('search:*');
    await this.deletePattern('count:*');
  }

  /**
   * Invalidate all lists (findAll, search, count)
   */
  async invalidateLists() {
    await this.deletePattern('findAll:*');
    await this.deletePattern('search:*');
    await this.deletePattern('count:*');
  }

  /**
   * Invalidate everything in namespace
   */
  async invalidateAll() {
    const pattern = this.orgId 
      ? `${this.namespace}:${this.orgId}:*`
      : `${this.namespace}:*`;
    return await this.cache.deletePattern(pattern);
  }
}

/**
 * Create a cache helper instance
 */
function createCacheHelper(namespace, orgId = null) {
  return new CacheHelper(namespace, orgId);
}

/**
 * Utility to wrap a service method with caching
 */
async function withCache(namespace, method, ttl, fn, ...args) {
  const cache = getCacheInstance();
  const key = cache.generateKey(namespace, method, ...args);

  // Try cache first
  const cached = await cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function
  const result = await fn(...args);

  // Cache result
  if (result !== null && result !== undefined) {
    await cache.set(key, result, ttl);
  }

  return result;
}

/**
 * Utility to invalidate cache after operation
 */
async function withInvalidation(namespace, pattern, fn, ...args) {
  // Execute function first
  const result = await fn(...args);

  // Invalidate cache
  const cache = getCacheInstance();
  await cache.deletePattern(`${namespace}:${pattern}`);

  return result;
}

module.exports = {
  cached,
  invalidateCache,
  cachedByOrg,
  invalidateMultiple,
  createCacheHelper,
  withCache,
  withInvalidation,
  setCacheInstance,
  getCacheInstance,
};