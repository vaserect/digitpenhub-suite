# Digitpen Hub Suite — Quality Standards

This document defines the quality bar for all modules, pages, and features in the Digitpen Hub Suite. It is mandatory reading before any completion claim is accepted.

---

## 1. Concrete Definition of "Placeholder"

A module or feature is a **placeholder**, in whole or in part, if any of the following are true:

- **Filler content**: Contains literal lorem ipsum, "Lorem", "Sample text", "Coming soon", "TODO", or similar filler anywhere in live-facing content.
- **Dead buttons**: Any button, tab, or link that does nothing when clicked, or only shows a "not implemented" state.
- **Mock data**: Any list, chart, or dashboard populated with hardcoded/mock data instead of real data from the database.
- **Broken forms**: Any form that does not actually persist submitted data.
- **Code stubs**: Any code comment containing `// TODO`, `// FIXME`, `// placeholder`, `// stub`, or similar in files backing live-facing functionality.
- **Missing icons**: Generic, unstyled, or missing icons where the design system calls for real iconography (Lucide).
- **Fake settings**: Any settings/configuration screen that displays options but does not actually change real behavior when changed.
- **Incomplete workflow**: Any module whose core workflow (the thing it is actually supposed to do) cannot be completed start to finish by a real user.

---

## 2. The Evidence-Based Bar

Before any deployment, merge, or completion claim is accepted, **all** of the following must be true:

- [ ] All new endpoints have a corresponding test (Jest `*.test.js` or `node:test`).
- [ ] `npm test` in `backend/` passes with 0 failures.
- [ ] `verify_deployment.sh` passes against a running local instance.
- [ ] No placeholder markers (from Section 1) are present in code or rendered content.
- [ ] Key API endpoints respond as expected (200 for public, 401 for unauthenticated auth-required).
- [ ] Smoke test output is attached to the completion report.

**Self-reported completion is not sufficient.** Every claim must be accompanied by real evidence:
- Real HTTP response bodies (not just status codes)
- Real database rows created by a user action
- Real API error messages, not generic fallback text
- Screenshots or rendered output, not code descriptions

---

## 3. Mandatory Smoke Test

`verify_deployment.sh` at project root must be run before every deployment. It checks:

1. **Frontend availability** — GET `/login` returns 200
2. **Backend health** — GET `/api/v1/health` returns `{"status":"healthy"}`
3. **Rate limiting** — Rate-limit headers present on response
4. **Detailed health** — Database and payment gateway subsystems are operational
5. **Placeholder marker scan** — No `TODO`, `MOCK_`, or `mock-token` markers in critical API responses
6. **Key API endpoints** — `POST /api/v1/auth/login` returns valid response structure
7. **Module route health** — Core API paths return 2xx or 401 (not 502/000)

**The script's output must be included in every deployment report.** No deployment is complete without it.

---

## 4. Definition of Done Checklist

Every module or feature change must pass this checklist before being marked complete:

- [ ] Placeholder replaced with real logic or gated behind feature flag/env var
- [ ] Test written for the replacement logic
- [ ] No new warnings in logs during normal operation
- [ ] `npm test` passes in backend/
- [ ] `verify_deployment.sh` passes
- [ ] Smoke test output attached to report
- [ ] No hardcoded mock data in production code paths
- [ ] All buttons/links connected to real backend endpoints
- [ ] Forms persist data to the database
- [ ] Settings actually change behavior
- [ ] Design system tokens used (no hardcoded colors/spacing)
- [ ] Dark mode renders correctly
