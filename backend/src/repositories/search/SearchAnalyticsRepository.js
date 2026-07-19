/**
 * SearchAnalyticsRepository - Phase 6: Analytics tracking
 * Handles search event logging and analytics queries
 */

const db = require('../../db');

class SearchAnalyticsRepository {
  /**
   * Track a search event
   */
  async trackSearchEvent({ orgId, userId, query, resultsCount, searchDurationMs, filtersUsed }) {
    try {
      const sql = `
        INSERT INTO search_events (
          org_id, user_id, query, results_count, search_duration_ms, filters_used
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      const result = await db.query(sql, [
        orgId, userId, query, resultsCount, searchDurationMs, JSON.stringify(filtersUsed || {})
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Failed to track search event:', error);
      return null; // Non-blocking
    }
  }

  /**
   * Track a clicked search result
   */
  async trackResultClick({ eventId, resultId, entityType, entityId }) {
    try {
      const sql = `
        UPDATE search_events
        SET clicked_result_id = $1,
            clicked_entity_type = $2,
            clicked_entity_id = $3
        WHERE id = $4
      `;
      await db.query(sql, [resultId, entityType, entityId, eventId]);
    } catch (error) {
      console.error('Failed to track result click:', error);
    }
  }

  /**
   * Get popular searches for an organization
   */
  async getPopularSearches(orgId, limit = 10) {
    try {
      const sql = `
        SELECT query, search_count, avg_results, click_count, ctr_percentage, last_searched
        FROM mv_popular_searches
        WHERE org_id = $1
        ORDER BY search_count DESC
        LIMIT $2
      `;
      const result = await db.query(sql, [orgId, limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get popular searches: ${error.message}`);
    }
  }

  /**
   * Get failed searches (0 results) for an organization
   */
  async getFailedSearches(orgId, limit = 10) {
    try {
      const sql = `
        SELECT query, failure_count, last_failed, avg_duration_ms
        FROM mv_failed_searches
        WHERE org_id = $1
        ORDER BY failure_count DESC
        LIMIT $2
      `;
      const result = await db.query(sql, [orgId, limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get failed searches: ${error.message}`);
    }
  }

  /**
   * Get search performance metrics
   */
  async getPerformanceMetrics(orgId, days = 30) {
    try {
      const sql = `
        SELECT 
          date, total_searches, unique_users, avg_results,
          avg_duration_ms, p95_duration_ms, zero_result_count, click_count
        FROM mv_search_performance
        WHERE org_id = $1
          AND date >= CURRENT_DATE - $2
        ORDER BY date DESC
      `;
      const result = await db.query(sql, [orgId, days]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get performance metrics: ${error.message}`);
    }
  }

  /**
   * Refresh materialized views (should be called periodically via cron)
   */
  async refreshAnalyticsViews() {
    try {
      await db.query('SELECT refresh_search_materialized_views()');
    } catch (error) {
      console.error('Failed to refresh analytics views:', error);
    }
  }
}

module.exports = SearchAnalyticsRepository;
