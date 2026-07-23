-- Migration 215: Performance indexes and cleanup
-- Adds missing indexes for sequential-scan tables
-- Drops unused indexes (0 scans, not constraint-backed)

-- Add index for store_abandoned_carts (no status column, use recovered boolean)
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_org_recovered ON store_abandoned_carts(org_id, recovered);

-- Add indexes for automation_enrollments
CREATE INDEX IF NOT EXISTS idx_ae_org_status ON automation_enrollments(org_id, status);
CREATE INDEX IF NOT EXISTS idx_ae_workflow_enrolled ON automation_enrollments(workflow_id, enrolled_at DESC);

-- Add indexes for email_campaigns
CREATE INDEX IF NOT EXISTS idx_email_campaigns_org_status ON email_campaigns(org_id, status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled ON email_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Add indexes for email_subscribers
CREATE INDEX IF NOT EXISTS idx_email_subs_org_status ON email_subscribers(org_id, status);
CREATE INDEX IF NOT EXISTS idx_email_subs_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subs_list ON email_subscribers(list_id) WHERE list_id IS NOT NULL;

-- Drop unused indexes safely (not constraint-backed, not primary keys)
DO $$
DECLARE
  idx RECORD;
BEGIN
  FOR idx IN
    SELECT i.indexrelid::regclass::text as index_name
    FROM pg_stat_user_indexes i
    LEFT JOIN pg_constraint c ON c.conindid = i.indexrelid
    WHERE i.idx_scan = 0
      AND i.indexrelname NOT LIKE '%_pkey'
      AND c.contype IS NULL
      AND i.indexrelname NOT LIKE '%_key'
    ORDER BY i.relname
  LOOP
    BEGIN
      EXECUTE format('DROP INDEX IF EXISTS %I', idx.index_name);
      RAISE NOTICE 'Dropped unused index: %', idx.index_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not drop index %: %', idx.index_name, SQLERRM;
    END;
  END LOOP;
END $$;
