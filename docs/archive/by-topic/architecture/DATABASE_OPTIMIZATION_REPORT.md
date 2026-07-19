# Database Schema & Performance Optimization Report

**Date:** July 13, 2026  
**Auditor:** Bob Shell (Automated Database Analysis)  
**Platform:** Digitpen Hub Suite - PostgreSQL Database  
**Scope:** Schema design, indexing strategy, query optimization, performance recommendations

---

## Executive Summary

Comprehensive analysis of the PostgreSQL database schema across 121 migration files reveals a **well-structured multi-tenant architecture** with recent performance improvements. The platform has already implemented critical org_id indexes (68 tables) and full-text search capabilities. This report identifies additional optimization opportunities and provides recommendations for production-scale performance.

### Key Findings

- ✅ **Strong Foundation:** Proper foreign keys, CASCADE deletes, UUID primary keys
- ✅ **Multi-Tenant Isolation:** org_id on all tenant-scoped tables with indexes (Migration 073)
- ✅ **Full-Text Search:** GIN indexes for global search across 8 core entities (Migration 088)
- ✅ **Security:** Password hashing, session management, audit logging
- ⚠️ **Optimization Needed:** Additional composite indexes, query patterns, connection pooling

---

## Database Architecture Overview

### Core Schema (Migration 001)

```sql
organizations (id, name, created_at)
├── users (id, org_id, email, password_hash, role, created_at)
│   └── sessions (id, user_id, user_agent, ip_address, created_at, expires_at, revoked_at)
├── categories (id, key, name, badge, sort_order)
│   └── modules (id, category_id, name, slug, status, route, sort_order)
└── audit_log (id, user_id, action, meta, ip_address, created_at)
```

**Design Strengths:**
- UUID primary keys for distributed systems and security
- Proper CASCADE deletes for data integrity
- Session-based JWT revocation capability
- Comprehensive audit logging with JSONB metadata

---

## Index Coverage Analysis

### ✅ Existing Indexes (Well Implemented)

#### 1. Multi-Tenant Performance (Migration 073)
**68 org_id indexes** added to prevent sequential scans:
```sql
CREATE INDEX idx_contacts_org ON contacts(org_id);
CREATE INDEX idx_invoices_org ON invoices(org_id);
CREATE INDEX idx_projects_org ON projects(org_id);
-- ... 65 more tables
```

**Impact:** Critical for multi-tenant SaaS performance. Without these, every query would scan all organizations' data.

#### 2. Full-Text Search (Migration 088)
**GIN indexes** for fast text search:
```sql
-- Contacts: name, company, email
CREATE INDEX idx_search_contacts ON contacts 
  USING gin(to_tsvector('english', coalesce(full_name,'') || ' ' || coalesce(company,'') || ' ' || coalesce(email,'')));

-- Invoices: invoice_number, notes
CREATE INDEX idx_search_invoices ON invoices 
  USING gin(to_tsvector('english', coalesce(invoice_number,'') || ' ' || coalesce(notes,'')));

-- Projects, Tasks, Pages, Documents, Notes, Lead Forms
-- ... 6 more full-text indexes
```

**Impact:** Enables fast global search across the platform without LIKE queries.

#### 3. Foreign Key Indexes
```sql
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_modules_category ON modules(category_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
```

**Impact:** Optimizes JOIN operations and CASCADE deletes.

---

## Performance Optimization Recommendations

### 🔴 Critical: Composite Indexes for Common Query Patterns

#### 1. User Authentication & Session Management

**Current:** Single-column indexes on `users(org_id)` and `sessions(user_id)`

**Problem:** Login queries filter by BOTH email AND org_id:
```sql
SELECT * FROM users WHERE email = $1 AND org_id = $2;
```

**Recommendation:**
```sql
-- Composite index for login queries
CREATE INDEX idx_users_email_org ON users(email, org_id);

-- Active sessions lookup
CREATE INDEX idx_sessions_user_active ON sessions(user_id, expires_at) 
  WHERE revoked_at IS NULL;
```

**Expected Impact:** 50-80% faster login queries, especially with millions of users.

---

#### 2. Invoice & Payment Queries

**Common Patterns:**
```sql
-- Unpaid invoices for an organization
SELECT * FROM invoices WHERE org_id = $1 AND status = 'unpaid' ORDER BY due_date;

-- Recent invoices
SELECT * FROM invoices WHERE org_id = $1 ORDER BY created_at DESC LIMIT 20;
```

**Recommendation:**
```sql
-- Status-based queries
CREATE INDEX idx_invoices_org_status_due ON invoices(org_id, status, due_date);

-- Time-based queries
CREATE INDEX idx_invoices_org_created ON invoices(org_id, created_at DESC);

-- Invoice number lookups (unique per org)
CREATE INDEX idx_invoices_org_number ON invoices(org_id, invoice_number);
```

---

#### 3. CRM Contact Management

**Common Patterns:**
```sql
-- Active contacts for an organization
SELECT * FROM contacts WHERE org_id = $1 AND status = 'active' ORDER BY last_contacted DESC;

-- Contact search by email
SELECT * FROM contacts WHERE org_id = $1 AND email = $2;
```

**Recommendation:**
```sql
-- Status and activity tracking
CREATE INDEX idx_contacts_org_status_activity ON contacts(org_id, status, last_contacted DESC);

-- Email lookups (for deduplication)
CREATE INDEX idx_contacts_org_email ON contacts(org_id, email);

-- Lead scoring and segmentation
CREATE INDEX idx_contacts_org_score ON contacts(org_id, lead_score DESC) 
  WHERE lead_score IS NOT NULL;
```

---

#### 4. Project & Task Management

**Common Patterns:**
```sql
-- Active tasks for a project
SELECT * FROM tasks WHERE project_id = $1 AND status != 'completed' ORDER BY priority, due_date;

-- User's assigned tasks
SELECT * FROM tasks WHERE org_id = $1 AND assigned_to = $2 AND status != 'completed';
```

**Recommendation:**
```sql
-- Project task queries
CREATE INDEX idx_tasks_project_status_priority ON tasks(project_id, status, priority, due_date);

-- User task assignment
CREATE INDEX idx_tasks_org_assignee_status ON tasks(org_id, assigned_to, status);

-- Overdue tasks
CREATE INDEX idx_tasks_org_due ON tasks(org_id, due_date) 
  WHERE status != 'completed' AND due_date < CURRENT_DATE;
```

---

#### 5. Email Marketing Campaigns

**Common Patterns:**
```sql
-- Campaign performance
SELECT * FROM email_campaigns WHERE org_id = $1 ORDER BY sent_at DESC;

-- Recipient tracking
SELECT * FROM email_recipients WHERE campaign_id = $1 AND status = 'sent';
```

**Recommendation:**
```sql
-- Campaign listing
CREATE INDEX idx_email_campaigns_org_sent ON email_campaigns(org_id, sent_at DESC);

-- Recipient status tracking
CREATE INDEX idx_email_recipients_campaign_status ON email_recipients(campaign_id, status);

-- Engagement metrics
CREATE INDEX idx_email_recipients_opened ON email_recipients(campaign_id, opened_at) 
  WHERE opened_at IS NOT NULL;
```

---

### 🟡 Medium Priority: Partial Indexes

Partial indexes are smaller and faster for specific query patterns:

```sql
-- Active subscriptions only
CREATE INDEX idx_subscriptions_org_active ON customer_subscriptions(org_id, next_billing_date) 
  WHERE status = 'active';

-- Unread notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) 
  WHERE is_read = false;

-- Pending appointments
CREATE INDEX idx_appointments_org_pending ON appointments(org_id, scheduled_at) 
  WHERE status = 'pending';

-- Open helpdesk tickets
CREATE INDEX idx_helpdesk_org_open ON helpdesk_tickets(org_id, priority, created_at) 
  WHERE status IN ('open', 'in_progress');
```

**Expected Impact:** 30-50% smaller indexes, faster queries for filtered data.

---

### 🟢 Low Priority: Covering Indexes

For frequently accessed columns, include them in the index to avoid table lookups:

```sql
-- Invoice list view (avoid table lookup)
CREATE INDEX idx_invoices_list ON invoices(org_id, created_at DESC) 
  INCLUDE (invoice_number, total_amount, status, client_name);

-- Contact list view
CREATE INDEX idx_contacts_list ON contacts(org_id, full_name) 
  INCLUDE (email, phone, company, status);
```

**Expected Impact:** 20-40% faster for list/grid views with many columns.

---

## Query Optimization Recommendations

### 1. Avoid N+1 Queries

**Problem:** Loading related data in loops
```javascript
// BAD: N+1 query
const invoices = await db.query('SELECT * FROM invoices WHERE org_id = $1', [orgId]);
for (const invoice of invoices) {
  const items = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
  invoice.items = items;
}
```

**Solution:** Use JOINs or batch queries
```javascript
// GOOD: Single query with JOIN
const result = await db.query(`
  SELECT i.*, json_agg(ii.*) as items
  FROM invoices i
  LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
  WHERE i.org_id = $1
  GROUP BY i.id
`, [orgId]);
```

---

### 2. Pagination with Cursors

**Problem:** OFFSET becomes slow with large datasets
```sql
-- BAD: Slow for page 1000
SELECT * FROM contacts WHERE org_id = $1 ORDER BY created_at DESC LIMIT 20 OFFSET 20000;
```

**Solution:** Cursor-based pagination
```sql
-- GOOD: Fast regardless of page depth
SELECT * FROM contacts 
WHERE org_id = $1 AND created_at < $2 
ORDER BY created_at DESC 
LIMIT 20;
```

---

### 3. Aggregate Queries with Materialized Views

**Problem:** Expensive dashboard queries run on every page load
```sql
-- Slow: Aggregates across millions of rows
SELECT 
  COUNT(*) as total_contacts,
  COUNT(*) FILTER (WHERE status = 'active') as active_contacts,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_contacts
FROM contacts WHERE org_id = $1;
```

**Solution:** Materialized view refreshed periodically
```sql
CREATE MATERIALIZED VIEW org_dashboard_stats AS
SELECT 
  org_id,
  COUNT(*) as total_contacts,
  COUNT(*) FILTER (WHERE status = 'active') as active_contacts,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_contacts,
  NOW() as refreshed_at
FROM contacts
GROUP BY org_id;

CREATE UNIQUE INDEX ON org_dashboard_stats(org_id);

-- Refresh every 5 minutes via cron job
REFRESH MATERIALIZED VIEW CONCURRENTLY org_dashboard_stats;
```

---

## Connection Pooling & Configuration

### Recommended PostgreSQL Settings

```ini
# postgresql.conf optimizations for production

# Connection Management
max_connections = 200
shared_buffers = 4GB              # 25% of RAM
effective_cache_size = 12GB       # 75% of RAM
maintenance_work_mem = 1GB
work_mem = 20MB

# Query Performance
random_page_cost = 1.1            # For SSD storage
effective_io_concurrency = 200    # For SSD storage
default_statistics_target = 100

# Write Performance
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB

# Logging (for query optimization)
log_min_duration_statement = 1000  # Log queries > 1 second
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
```

### Node.js Connection Pool (pg)

```javascript
// backend/src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Connection pool settings
  max: 20,                    // Maximum connections
  min: 5,                     // Minimum idle connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail fast if no connection available
  
  // Statement timeout (prevent long-running queries)
  statement_timeout: 30000,   // 30 seconds
  
  // Query timeout
  query_timeout: 30000,
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
});
```

---

## Monitoring & Maintenance

### 1. Query Performance Monitoring

```sql
-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries averaging > 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Find queries with high I/O
SELECT 
  query,
  calls,
  shared_blks_hit,
  shared_blks_read,
  (shared_blks_read::float / NULLIF(shared_blks_hit + shared_blks_read, 0)) * 100 as cache_miss_ratio
FROM pg_stat_statements
WHERE shared_blks_read > 1000
ORDER BY cache_miss_ratio DESC
LIMIT 20;
```

### 2. Index Usage Analysis

```sql
-- Find unused indexes (candidates for removal)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find missing indexes (sequential scans on large tables)
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / NULLIF(seq_scan, 0) as avg_seq_tup_read,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_stat_user_tables
WHERE seq_scan > 1000
  AND seq_tup_read / NULLIF(seq_scan, 0) > 10000
ORDER BY seq_tup_read DESC;
```

### 3. Table Bloat & Maintenance

```sql
-- Vacuum and analyze regularly (via cron)
VACUUM ANALYZE;

-- Reindex to reduce bloat (during maintenance window)
REINDEX DATABASE digitpenhub_suite;

-- Check table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

---

## Schema Design Recommendations

### 1. Partitioning for Large Tables

For tables that grow indefinitely (audit logs, analytics, email tracking):

```sql
-- Partition audit_log by month
CREATE TABLE audit_log_2026_07 PARTITION OF audit_log
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- Automatic partition creation via cron
CREATE OR REPLACE FUNCTION create_audit_log_partition()
RETURNS void AS $$
DECLARE
  partition_date DATE := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
  partition_name TEXT := 'audit_log_' || TO_CHAR(partition_date, 'YYYY_MM');
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    partition_date,
    partition_date + INTERVAL '1 month'
  );
END;
$$ LANGUAGE plpgsql;
```

### 2. Soft Deletes with Indexes

```sql
-- Add deleted_at column to important tables
ALTER TABLE contacts ADD COLUMN deleted_at TIMESTAMPTZ;

-- Partial index excludes deleted records
CREATE INDEX idx_contacts_org_active ON contacts(org_id, created_at) 
  WHERE deleted_at IS NULL;

-- Queries automatically filter deleted records
SELECT * FROM contacts WHERE org_id = $1 AND deleted_at IS NULL;
```

### 3. JSONB for Flexible Metadata

Already implemented in `audit_log.meta` - good practice for:
- Custom fields per organization
- Feature flags
- Integration settings
- Webhook payloads

```sql
-- Index JSONB fields for fast queries
CREATE INDEX idx_audit_log_action ON audit_log((meta->>'action'));
CREATE INDEX idx_audit_log_resource ON audit_log((meta->>'resource_type'), (meta->>'resource_id'));
```

---

## Implementation Priority

### Phase 1: Critical (Week 1)
- [ ] Add composite indexes for authentication (users, sessions)
- [ ] Add composite indexes for invoices (org_id, status, created_at)
- [ ] Add composite indexes for contacts (org_id, status, email)
- [ ] Configure connection pooling with proper limits
- [ ] Enable pg_stat_statements for monitoring

### Phase 2: High Priority (Week 2-3)
- [ ] Add composite indexes for tasks and projects
- [ ] Add partial indexes for active subscriptions, notifications
- [ ] Implement cursor-based pagination for large lists
- [ ] Create materialized views for dashboard stats
- [ ] Set up automated VACUUM and ANALYZE

### Phase 3: Medium Priority (Month 2)
- [ ] Add covering indexes for list views
- [ ] Implement table partitioning for audit logs
- [ ] Add soft delete columns and indexes
- [ ] Optimize N+1 queries in controllers
- [ ] Set up query performance monitoring dashboard

### Phase 4: Ongoing
- [ ] Regular index usage analysis (monthly)
- [ ] Query performance reviews (weekly)
- [ ] Table bloat monitoring (weekly)
- [ ] Capacity planning (quarterly)

---

## Testing Recommendations

### Load Testing Queries

```sql
-- Simulate 1000 concurrent users
-- Test with pgbench or k6

-- Login query (should be < 10ms)
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'test@example.com' AND org_id = 'uuid-here';

-- Dashboard query (should be < 100ms)
EXPLAIN ANALYZE
SELECT * FROM invoices WHERE org_id = 'uuid-here' ORDER BY created_at DESC LIMIT 20;

-- Search query (should be < 200ms)
EXPLAIN ANALYZE
SELECT * FROM contacts 
WHERE org_id = 'uuid-here' 
  AND to_tsvector('english', full_name || ' ' || company) @@ to_tsquery('english', 'search:*')
LIMIT 20;
```

---

## Conclusion

The Digitpen Hub Suite database is **well-architected** with proper multi-tenant isolation and recent performance improvements (org_id indexes, full-text search). Implementing the recommended composite indexes and query optimizations will ensure the platform scales efficiently to thousands of organizations and millions of records.

**Estimated Performance Gains:**
- **Login queries:** 50-80% faster
- **List views:** 40-60% faster
- **Search queries:** Already optimized with GIN indexes
- **Dashboard aggregates:** 90%+ faster with materialized views
- **Overall throughput:** 2-3x improvement with connection pooling

**Next Steps:**
1. Implement Phase 1 critical indexes
2. Set up monitoring with pg_stat_statements
3. Load test with realistic data volumes
4. Iterate based on actual query patterns

---

**Report Generated:** July 13, 2026  
**Tool:** Bob Shell Database Analysis  
**Version:** 1.0.6
