# Architecture Audit — 2026-07-16

## Current State

**Architecture Score: 4/10**
- 95/96 controllers use `db` pool directly — service/repository layers bypassed
- Service layer exists (5 base + 5 cached) but is NOT imported by any controller
- Repository layer exists (6 repos) with BaseRepository pattern but is NOT consumed
- DTO layer: MISSING entirely
- Validation layer: MISSING entirely
- Dual routing: app.js (active) + route config/loader (dead code)

**Test Coverage Score: 2/10**
- Backend: 12 test files across controllers, services, routes, cache
- Frontend: 0 actual test files (only node_modules)
- Services have unit tests (5 files) — the only tested layer
- No E2E, no API contract tests

**Security Score: 6/10**
- Present: Auth (session), CSRF, rate limiting, RBAC, request IDs
- Missing: Input validation, DTO sanitization, audit logging middleware

**Deduplication Score: 8/10** (after cleanup)
- Remaining: 082 migration 4-variant files, route config files duplicating app.js

**Overall Project Health: 5.2/10**

## Immediate Priority: Wire service layer into controllers
Services exist for CRM (CompanyService, ContactService), PM (ProjectService, TaskService),
Invoicing (InvoiceService). Need to refactor controllers to use them instead of raw db pool.
