const { CacheManager } = require('../../../cache/CacheManager');

describe('CacheManager', () => {
  let cache;

  beforeEach(() => {
    // Use in-memory cache for tests
    cache = new CacheManager({
      enabled: true,
      type: 'memory',
      defaultTTL: 60,
      maxMemoryItems: 100,
    });
  });

  afterEach(async () => {
    await cache.close();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      const key = 'test:key';
      const value = { name: 'Test', count: 42 };

      await cache.set(key, value);
      const result = await cache.get(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await cache.get('non:existent:key');
      expect(result).toBeNull();
    });

    it('should delete a value', async () => {
      const key = 'test:delete';
      const value = 'test value';

      await cache.set(key, value);
      expect(await cache.get(key)).toBe(value);

      await cache.delete(key);
      expect(await cache.get(key)).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'test:exists';
      
      expect(await cache.exists(key)).toBe(false);
      
      await cache.set(key, 'value');
      expect(await cache.exists(key)).toBe(true);
      
      await cache.delete(key);
      expect(await cache.exists(key)).toBe(false);
    });

    it('should clear all cache entries', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const key = 'test:ttl';
      const value = 'expires soon';

      // Set with 1 second TTL
      await cache.set(key, value, 1);
      
      // Should exist immediately
      expect(await cache.get(key)).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired
      expect(await cache.get(key)).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const key = 'test:default:ttl';
      const value = 'default ttl';

      await cache.set(key, value);
      expect(await cache.get(key)).toBe(value);
    });

    it('should handle different TTL values', async () => {
      await cache.set('short', 'value1', 1);
      await cache.set('medium', 'value2', 5);
      await cache.set('long', 'value3', 10);

      expect(await cache.get('short')).toBe('value1');
      expect(await cache.get('medium')).toBe('value2');
      expect(await cache.get('long')).toBe('value3');
    });
  });

  describe('Key Generation', () => {
    it('should generate key with namespace only', () => {
      const key = cache.generateKey('contact', 'findById:123');
      expect(key).toBe('contact:findById:123');
    });

    it('should generate key with namespace and orgId', () => {
      const key = cache.generateKey('contact', 'findById:123', 'org-456');
      expect(key).toBe('contact:org-456:findById:123');
    });

    it('should handle complex keys', () => {
      const key = cache.generateKey('project', 'search:marketing', 'org-789');
      expect(key).toBe('project:org-789:search:marketing');
    });
  });

  describe('Pattern Deletion', () => {
    it('should delete keys matching pattern', async () => {
      await cache.set('contact:org-1:findById:1', 'value1');
      await cache.set('contact:org-1:findById:2', 'value2');
      await cache.set('contact:org-1:findAll', 'value3');
      await cache.set('contact:org-2:findById:1', 'value4');

      const deleted = await cache.deletePattern('contact:org-1:*');

      expect(deleted).toBe(3);
      expect(await cache.get('contact:org-1:findById:1')).toBeNull();
      expect(await cache.get('contact:org-1:findById:2')).toBeNull();
      expect(await cache.get('contact:org-1:findAll')).toBeNull();
      expect(await cache.get('contact:org-2:findById:1')).toBe('value4');
    });

    it('should handle wildcard patterns', async () => {
      await cache.set('user:1:profile', 'profile1');
      await cache.set('user:1:settings', 'settings1');
      await cache.set('user:2:profile', 'profile2');

      await cache.deletePattern('user:1:*');

      expect(await cache.get('user:1:profile')).toBeNull();
      expect(await cache.get('user:1:settings')).toBeNull();
      expect(await cache.get('user:2:profile')).toBe('profile2');
    });

    it('should return 0 when no keys match pattern', async () => {
      const deleted = await cache.deletePattern('nonexistent:*');
      expect(deleted).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track cache hits and misses', async () => {
      cache.resetStats();

      await cache.set('key1', 'value1');
      await cache.get('key1'); // hit
      await cache.get('key2'); // miss
      await cache.get('key1'); // hit
      await cache.get('key3'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.total).toBe(4);
      expect(stats.hitRate).toBe('50.00%');
    });

    it('should track set operations', async () => {
      cache.resetStats();

      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      const stats = cache.getStats();
      expect(stats.sets).toBe(3);
    });

    it('should track delete operations', async () => {
      cache.resetStats();

      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.delete('key1');
      await cache.delete('key2');

      const stats = cache.getStats();
      expect(stats.deletes).toBe(2);
    });

    it('should reset statistics', async () => {
      await cache.set('key1', 'value1');
      await cache.get('key1');
      
      cache.resetStats();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);
      expect(stats.deletes).toBe(0);
    });

    it('should include cache type in stats', () => {
      const stats = cache.getStats();
      expect(stats.type).toBe('memory');
      expect(stats.enabled).toBe(true);
    });

    it('should include memory size in stats for memory cache', () => {
      const stats = cache.getStats();
      expect(stats.memorySize).toBeDefined();
      expect(typeof stats.memorySize).toBe('number');
    });
  });

  describe('Data Types', () => {
    it('should handle string values', async () => {
      await cache.set('string', 'hello world');
      expect(await cache.get('string')).toBe('hello world');
    });

    it('should handle number values', async () => {
      await cache.set('number', 42);
      expect(await cache.get('number')).toBe(42);
    });

    it('should handle boolean values', async () => {
      await cache.set('bool:true', true);
      await cache.set('bool:false', false);
      
      expect(await cache.get('bool:true')).toBe(true);
      expect(await cache.get('bool:false')).toBe(false);
    });

    it('should handle object values', async () => {
      const obj = {
        id: 1,
        name: 'Test',
        nested: { value: 'nested' },
        array: [1, 2, 3],
      };

      await cache.set('object', obj);
      expect(await cache.get('object')).toEqual(obj);
    });

    it('should handle array values', async () => {
      const arr = [1, 'two', { three: 3 }, [4, 5]];

      await cache.set('array', arr);
      expect(await cache.get('array')).toEqual(arr);
    });

    it('should handle null values', async () => {
      await cache.set('null', null);
      // Note: null is stored but get returns null for both "not found" and "stored null"
      // This is expected behavior
      const result = await cache.get('null');
      expect(result).toBeNull();
    });
  });

  describe('Memory Management', () => {
    it('should enforce max items limit', async () => {
      const smallCache = new CacheManager({
        enabled: true,
        type: 'memory',
        maxMemoryItems: 3,
      });

      await smallCache.set('key1', 'value1');
      await smallCache.set('key2', 'value2');
      await smallCache.set('key3', 'value3');
      await smallCache.set('key4', 'value4'); // Should evict key1

      expect(await smallCache.get('key1')).toBeNull();
      expect(await smallCache.get('key2')).toBe('value2');
      expect(await smallCache.get('key3')).toBe('value3');
      expect(await smallCache.get('key4')).toBe('value4');

      await smallCache.close();
    });
  });

  describe('Disabled Cache', () => {
    it('should not cache when disabled', async () => {
      const disabledCache = new CacheManager({
        enabled: false,
      });

      await disabledCache.set('key', 'value');
      const result = await disabledCache.get('key');

      expect(result).toBeNull();

      await disabledCache.close();
    });
  });

  describe('Wrap Function', () => {
    it('should wrap function with caching', async () => {
      let callCount = 0;
      
      const expensiveFunction = async (id) => {
        callCount++;
        return { id, data: `result-${id}` };
      };

      const cachedFunction = cache.wrap(expensiveFunction, {
        namespace: 'test',
        keyGenerator: (id) => `func:${id}`,
        ttl: 60,
      });

      // First call - should execute function
      const result1 = await cachedFunction(1);
      expect(result1).toEqual({ id: 1, data: 'result-1' });
      expect(callCount).toBe(1);

      // Second call - should use cache
      const result2 = await cachedFunction(1);
      expect(result2).toEqual({ id: 1, data: 'result-1' });
      expect(callCount).toBe(1); // Not incremented

      // Different argument - should execute function
      const result3 = await cachedFunction(2);
      expect(result3).toEqual({ id: 2, data: 'result-2' });
      expect(callCount).toBe(2);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent sets', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(cache.set(`concurrent:${i}`, `value${i}`));
      }

      await Promise.all(promises);

      for (let i = 0; i < 10; i++) {
        const value = await cache.get(`concurrent:${i}`);
        expect(value).toBe(`value${i}`);
      }
    });

    it('should handle concurrent gets', async () => {
      await cache.set('shared', 'shared-value');

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(cache.get('shared'));
      }

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result).toBe('shared-value');
      });
    });
  });
});
