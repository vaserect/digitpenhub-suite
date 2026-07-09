# BUGS — Discovered During Sessions

| # | Module | Severity | Description | Status | Session |
|---|--------|----------|-------------|--------|---------|
| 1 | Auth | Critical | Test password hash out of sync after password-change flow in smoke test (bcrypt hash mismatch, not a real bug — expected behavior of change-password, rate limiter then blocked retry) | Fixed — reset hash to known value | 1 |
| 2 | Publishing | Medium | `funnels` table has no `slug` column; `forms` table has no `updated_at` column — publishing route queried non-existent columns | Fixed — corrected queries to use `id::text` and `created_at` | 2 |
| 3 | Feature Flags | Medium | Pre-existing `feature_flags` table from another project had different schema (no `org_id` column, different column names) causing 500 errors | Fixed — renamed conflicting table, re-created with correct schema | 3 |
| 4 | Permissions | Medium | Duplicate `setTheme` useState declaration in AppShell after edit — caused build failure | Fixed — removed duplicate | 4 |
| 5 | Global Search | Low | `funnels.slug`, `tasks.description`, `documents.description` columns queried but didn't exist in schema — search queries failed silently | Fixed — safe-guarded all queries | 5 |
| 6 | AppShell | Medium | Account/billing/white-label inline views left unclosed during extraction, causing JSX unterminated literal build error | Fixed — replaced inline blocks with stubs, reverted to clean git state | 6 |
| 7 | Email Templates | Low | `email_campaigns` has no `name` column — `useTemplate` controller inserted into non-existent column | Fixed — removed `name` from insert, using `subject` as title | 7 |
| 8 | Form Templates | Low | `forms.id` is bigserial (not UUID); template `fields_json` is JSONB object in pg but needed explicit `::jsonb` cast for insert | Fixed — added `::jsonb` cast | 8 |
| 9 | Funnel Templates | Low | Page template `blocks` is JSONB but needed explicit `::jsonb` cast when read from pg and inserted into `pages` | Fixed — added `::jsonb` cast | 9 |
| 10 | Marketplace Payouts | Low | `vendor_id` column defined as UUID but accepts text identifiers from marketplace | Fixed — altered column to TEXT | 10 |
| 11 | Event Registration | Low | `ON CONFLICT DO UPDATE` needs explicit constraint name for composite PK | Fixed — used `ON CONFLICT ON CONSTRAINT event_attendees_pkey` | 11 |
| 12 | Account/Billing extraction | Low | Stray `pp;` at end of app.js (editor artifact) | Fixed — removed | 12 |
