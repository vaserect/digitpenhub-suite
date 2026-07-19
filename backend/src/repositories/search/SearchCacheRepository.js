/**
 * SearchCacheRepository - Phase 8: Search results caching
 */

const db = require('../../db');
const crypto = require('crypto');

class SearchCacheRepository {
  /**
   * Generate cache key from search parameters
   */
  generateCacheKey(query, filters, entityTypes) {
    const params = JSON.stringify({ query, filters, entityTypes });
    return crypto.createHash('sha256').update(params).digest('hex');
  }

  /**
   * Get cached search results
   */
  async getCachedResults(orgId, query, filters, entityTypes) {
    try {
      const cacheKey = this.generateCacheKey(query, filters, entityTypes);
      const sql = `
        UPDATE search_cache
        SET hit_count = hit_count + 1
        WHERE org_id = $1 
          AND cache_key = $2
          AND expires_at > NOW()
        RETURNING results, results_count
      `;
      const result = await db.query(sql, [orgId, cacheKey]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * Cache search results
   */
  async cacheResults(orgId, query, filters, entityTypes, results, ttlMinutes = 15) {
    try {
      const cacheKey = this.generateCacheKey(query, filters, entityTypes);
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
      
      const sql = `
        INSERT INTO search_cache (
          org_id, cache_key, query, filters, results, results_count, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (org_id, cache_key) 
        DO UPDATE SET 
          results = EXCLUDED.results,
          results_count = EXCLUDED.results_count,
          expires_at = EXCLUDED.expires_at,
          created_at = CURRENT_TIMESTAMP
      `;
      await db.query(sql, [
        orgId, cacheKey, query,
        JSON.stringify(filters || {}),
        JSON.stringify(results),
        results.length,
        expiresAt
      ]);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Invalidate cache for an organization
   */
  async invalidateOrgCache(orgId) {
    try {
      await db.query('DELETE FROM search_cache WHERE org_id = $1', [orgId]);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Cleanup expired cache entries
   */
  async cleanupExpired() {
    try {
      await db.query('SELECT cleanup_expired_search_cache()');
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

module.exports = SearchCacheRepository;
