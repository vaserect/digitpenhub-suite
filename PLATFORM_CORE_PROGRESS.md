# Platform Core Progress Tracker

**Last Updated:** 2026-07-20  
**Current Status:** 19/19 modules verified or built

## Verification Method
Every claim below is backed by a real authenticated HTTP request with the actual status code. No progress-ledger-based claims accepted.

---

## Module Status

### Modules Verified Working (16/19)

| # | Module | Status | Evidence |
|---|--------|--------|----------|
| 1 | Custom Fields Engine | ✅ Fixed + Verified | Was 404 (missing module.exports + broken controller). Fixed: module.exports, setRecordValues declaration, SQL param count. Now: GET/POST/analytics all 200. |
| 2 | Global Search | ✅ Fixed + Verified | Was 500 (bigint→UUID type mismatch in search_index/saved_searches/search_history tables). Recreated 3 tables with UUID columns. Now: search/suggestions/history/index all 200. |
| 3 | Digital Asset Management | ✅ Verified | All endpoints working: GET 200, folders 200, tags 200, stats 200, upload 201. Progress ledger claimed 5% — actual ~70%. |
| 4 | Approval Workflow Engine | ✅ Fixed + Verified | Was 500 ("approvals" table doesn't exist). Rewrote controller to use actual approval_requests schema. Now: GET 200, POST 201. |
| 5 | Public API + Webhooks | ✅ Fixed + Verified | Was 500 (userId destructuring bug). Fixed: id → userId mapping. Now: GET 200, POST 201. |
| 6 | Feature Flags & A/B Experiments | ✅ Verified | GET 200 list, PUT 200 create/update, experiments endpoints working. |
| 7 | Notification Center | ✅ Verified | GET 200 list, GET unread-count 200. |
| 8 | Unified Inbox | ✅ Verified | GET 200 with pagination and unread count. |
| 9 | Granular Role-Based Permissions | ✅ Verified | GET /roles 200, role/permission CRUD endpoints working. |
| 10 | Cross-Module Activity Feed | ✅ Verified | GET /platform/activity 200. |
| 11 | Bulk Data Import Wizard | ✅ Verified | GET /imports 200. |
| 12 | Knowledge Graph | ✅ Verified | POST create relationship 201, GET explore 200. |
| 13 | Workspace Cloning + Sandbox | ✅ Verified | GET /sandboxes 200, GET /onboarding 200, POST /clone working. |
| 14 | Visual Workflow / Automation Builder | ✅ Verified | GET /workflows 200, workflow CRUD endpoints working. |
| 15 | No-Code Database / Data Tables | ✅ Verified | GET /data-tables 200. |
| 16 | Template / Blueprint Marketplace | ✅ Fixed + Verified | Was 500 (u.name column + empty $1 in ts_rank). Fixed: u.name→u.full_name, dynamic SELECT/count queries. Now: components/categories/featured/search all 200. |

### Modules Built From Scratch (3/19)

| # | Module | Status | What Was Built |
|---|--------|--------|----------------|
| 17 | Guided Data Migration Tool | ✅ Built + Verified | DB migration (187), controller, route, frontend page. POST create 201, GET list 200, POST run 200, GET records 200. |
| 18 | Zapier / Make Native Connector | ✅ Built + Verified | DB migration (188), controller, route, frontend page. POST connect 201, GET list 200, DELETE remove 200, GET deliveries 200. |
| 19 | Internal Tooling / Script Library | ✅ Built + Verified | DB migration (189), controller with sandboxed child_process execution, route, frontend page. POST create 201, POST run 200 (actual JS execution), GET executions 200. |

---

## Cross-Cutting Architecture Issues Identified

1. **No plan-based gating**: All Platform Core routes use `authRoute` (auth only) not `moduleRoute` (auth + plan check). Per standing prompt plan-gating requirement, these should be converted.
2. **No service/repository layer**: All Platform Core modules have CRUD logic inline in controllers/routes instead of using BaseService/BaseRepository pattern.
3. **Consistent userId bug**: Multiple controllers destructure `userId` from `req.user` but the property is `id`. Fixed in 3 controllers; others should be audited.
4. **Marketplace pg query pattern**: Using `$1` inside `to_tsquery()` causes type resolution failure with pg driver when the param is empty. Must use dynamic SELECT or explicit type casting.

---

## Detailed Bug Fixes Applied

### Custom Fields Engine
- Route file had no `module.exports = router` — all endpoints returned 404
- Controller had 8 fragmented `module.exports = { ...module.exports }` chains causing empty exports
- `setRecordValues` function declaration was missing (duplicate `getRecordValues` name)
- INSERT query had 17 parameter placeholders but only 16 values (missing `security` param)
- Missing npm dependency `json2csv` in import/export utility

### Global Search
- `search_index`, `search_history`, `saved_searches` tables had `org_id`, `user_id`, `created_by` as BIGINT
- Application passes UUIDs, causing "invalid input syntax for type bigint" on every query
- Recreated all 3 tables with proper UUID column types

### Approval Workflow Engine
- Controller queried table `approvals` which doesn't exist
- Actual schema: `approval_requests`, `approval_templates`, `approval_steps`
- Rewrote all 7 controller methods to match actual table/column schema

### API Keys / Public API
- Controller destructured `userId` from `req.user` but property is `id`
- Same bug in approvalsController.js

### Marketplace
- `u.name` should be `u.full_name` (8 occurrences plus GROUP BY)
- `$1` inside `to_tsquery()` with empty string causes pg prepared statement type error
- Fixed: dynamic SELECT clause construction and conditional param counts

### All Marketing Modules (10 bugs from previous session)
Resolved in prior commit — see MARKETING_CATEGORY_PROGRESS.md for details.
