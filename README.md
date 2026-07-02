# Digitpen Hub Suite — Milestone 0: Platform Shell

## Purpose
The thin layer everything else gets built behind: real authentication, and a database-driven
module registry that decides which tiles on the dashboard are "Live" vs "Coming soon" — so
shipping a new module later is a data change (flip one row in Postgres), not a frontend
code change or a redeploy.

## What's in this milestone
- Email/password auth with hashed passwords, httpOnly session cookies, and server-side
  session revocation (real logout, not just "delete the cookie and hope").
- A `categories` + `modules` table seeded with the full 97-module catalog from the
  master prompt, grouped exactly as it specifies (Marketing, AI, SEO, Creative, Business,
  Education, Commerce, Productivity, Analytics, Utilities).
- A dashboard (Next.js) that renders entirely from that table: sidebar categories with
  live/total counts, a searchable module catalog, and two real working tiles — **CRM** and
  **Project Management** — which currently show illustrative data. Wiring those two to
  real contacts/tasks tables is Milestone 1, not this one.
- Rate-limited login, security headers (helmet), CORS locked to the known frontend origin.

## What's deliberately NOT in this milestone
- Multi-tenant / multiple organizations, SSO, RBAC beyond a single `role` column,
  invitations, 2FA, audit log *viewing* UI (the table exists and is written to, nothing
  reads it yet). These are real, called for in the master prompt, and premature until
  there's a second organization or a second admin to actually need them for.
- Any real data behind CRM or Project Management. Those screens are static on purpose.

---

## Architecture

```
Browser
  │  https://suite.digitpenhub.com
  ▼
OpenLiteSpeed (existing, this VPS)
  │  reverse proxy, "/" context
  ▼
Next.js  (127.0.0.1:4000, pm2: digitpenhub-suite-web)
  │  server-side rewrite: /api/* → backend, same browser origin throughout
  ▼
Express API  (127.0.0.1:4001, pm2: digitpenhub-suite-api)
  │
  ▼
PostgreSQL  (127.0.0.1:5432, already running on this VPS — new db: digitpenhub_suite)
```

Both Node processes bind to `127.0.0.1` only — never exposed directly to the internet,
only reachable through OpenLiteSpeed. Postgres is the instance already running on the box;
this just adds a new, separate database and role, untouched from PAMCET's `pamc_lmsdb` /
`slid_slidegen`.

## File structure
```
digitpenhub-suite/
├── backend/
│   ├── db/
│   │   ├── schema.sql          ← run once
│   │   ├── categories.data.js  ← the 97-module catalog, single source of truth
│   │   ├── seed.js             ← run after schema.sql, and again any time categories.data.js changes
│   │   └── migrate.js
│   ├── src/
│   │   ├── routes/auth.js, modules.js
│   │   ├── controllers/authController.js, modulesController.js
│   │   ├── middleware/auth.js
│   │   ├── utils/jwt.js, password.js
│   │   ├── db.js, app.js, server.js
│   ├── ecosystem.config.js     ← pm2
│   └── .env.example
└── frontend/
    ├── app/login/page.jsx, app/page.jsx, app/layout.jsx, app/globals.css
    ├── components/AppShell.jsx ← all dashboard interactivity
    ├── lib/api.js
    ├── middleware.js           ← redirect-to-login UX guard
    ├── next.config.js          ← /api/* rewrite to the backend
    └── public/logo.png         ← the approved brand mark
```

## Database schema
See `backend/db/schema.sql`. Tables: `organizations`, `users`, `sessions`, `categories`,
`modules`, `audit_log`. Comments in the file explain the reasoning for `sessions` (server-side
revocation) and `modules` (the registry the whole dashboard reads).

## API endpoints (`/api/v1`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | — (rate-limited) | Verify credentials, create session, set cookie |
| POST | `/auth/logout` | session | Revoke session, clear cookie |
| GET  | `/auth/me` | session | Current user |
| GET  | `/modules` | session | Categories + modules, with live/coming-soon status |
| GET  | `/health` | — | Liveness check |

---

## Installation

**1. Database** (on the VPS, as a user with Postgres admin rights):
```bash
sudo -u postgres psql -c "CREATE ROLE digitpenhub_suite WITH LOGIN PASSWORD 'pick-a-real-password';"
sudo -u postgres psql -c "CREATE DATABASE digitpenhub_suite OWNER digitpenhub_suite;"
```

**2. Backend**
```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET (openssl rand -base64 48),
                             # ADMIN_EMAIL / ADMIN_PASSWORD for the first login
npm install
npm run migrate             # applies schema.sql
npm run seed                # loads the 97 modules + creates your owner account
pm2 start ecosystem.config.js
pm2 save
```

**3. Frontend**
```bash
cd frontend
cp .env.example .env        # API_INTERNAL_URL=http://127.0.0.1:4001
npm install
npm run build
pm2 start npm --name digitpenhub-suite-web -- start
pm2 save
```

**4. OpenLiteSpeed (CyberPanel) — point suite.digitpenhub.com at the frontend**

CyberPanel's website list doesn't expose a Node reverse-proxy toggle directly, so this
goes through the WebAdmin console (the one already running on `:7080`, per the audit):
1. WebAdmin console → Virtual Hosts → `suite.digitpenhub.com` → Context
2. Add Context: Type = **Proxy**, URI = `/`, Web Server = `http://127.0.0.1:4000`
3. Graceful restart: `systemctl reload lshttpd`

Confirm `https://suite.digitpenhub.com` shows the real login page (not the CyberPanel
placeholder it currently shows), and that the padlock is clean per the earlier SSL check.

## Configuration
All secrets live in `backend/.env` and `frontend/.env` — neither file is committed
(see `.gitignore`). Rotate `JWT_SECRET` and the database password before this ever
touches real client data.

---

## Security review (this milestone)
- Passwords: bcrypt, 12 rounds. Never logged, never returned in any API response.
- Sessions: JWT is opaque besides `sub`/`jti`; the actual trust decision happens against
  the `sessions` table on every request, so logout/revocation is real, not cosmetic.
- Cookie: `httpOnly`, `secure` in production, `sameSite=lax` — inaccessible to JS, so an
  XSS bug elsewhere can't trivially steal the session token.
- Login is rate-limited (10/15min/IP); generic error message regardless of whether the
  email or the password was wrong (no account enumeration).
- `helmet` default security headers; CORS restricted to the known frontend origin, not `*`.
- Both Node processes bind to loopback only — OpenLiteSpeed is the only path in.
- Not yet done, flagged for Milestone 1+: 2FA, password reset flow, audit log viewer,
  per-IP anomaly detection. None of these are useful yet with a single user.

## Testing checklist
- [ ] Wrong password → generic error, no enumeration
- [ ] 11th login attempt in 15 min from same IP → rate-limited
- [ ] Login → refresh page → still signed in (cookie persists)
- [ ] Sign out → refresh → redirected to `/login`
- [ ] Manually revoke a session row in Postgres → next API call from that browser → 401
- [ ] `/api/v1/modules` reflects `categories.data.js` exactly after `npm run seed`
- [ ] Flip a module's `status` to `active` directly in Postgres → tile lights up on next
      page load with **zero frontend changes** — this is the actual thing to verify
- [ ] Mobile width (< 480px): sidebar collapses to horizontal scroll, tiles stack to 1 column

## Deployment checklist
- [ ] `.env` filled in on both apps, `JWT_SECRET` is a real random value, not the example
- [ ] `npm run migrate` then `npm run seed` completed without error
- [ ] `pm2 list` shows both `digitpenhub-suite-api` and `digitpenhub-suite-web` as `online`
- [ ] OpenLiteSpeed proxy context added and `lshttpd` reloaded
- [ ] `https://suite.digitpenhub.com` loads the login page with a valid cert
- [ ] `pm2 save` run so both processes survive a VPS reboot

## Rollback plan
- Both processes are independent PM2 apps — `pm2 stop digitpenhub-suite-web
  digitpenhub-suite-api` immediately takes the Suite offline without touching anything
  else on the VPS (PAMCET's services are unaffected; they don't share a process or vhost).
- Database changes are additive only — this milestone never touches `pamc_lmsdb`,
  `slid_slidegen`, or any existing table. Dropping `digitpenhub_suite` cleanly removes
  everything: `sudo -u postgres psql -c "DROP DATABASE digitpenhub_suite;"`
- If only the OpenLiteSpeed proxy context needs undoing: remove the Context entry added
  in step 4 above and reload `lshttpd` — `suite.digitpenhub.com` reverts to its prior
  (empty) state.

---

## Outstanding / next steps (Milestone 1)
- Real `contacts` / `deals` tables + API behind the CRM screen
- Real `projects` / `tasks` tables + API behind the Project Management board
- Both wired into the same `requireAuth` + `org_id` scoping pattern already established here

---

## Milestone 1 — Real CRM + Project Management data

Adds three new tables (`contacts`, `projects`, `tasks` — see `db/002_crm_pm.sql`) and wires
the CRM and Project Management screens to them for real, replacing the illustrative data
from Milestone 0.

### What's new
- `GET/POST /api/v1/crm/contacts`, `PATCH /api/v1/crm/contacts/:id` — list, create, and move
  a contact through its pipeline stage.
- `GET/POST /api/v1/pm/projects`, `POST /api/v1/pm/tasks`, `PATCH /api/v1/pm/tasks/:id` —
  list projects with nested tasks, create a task, move a task between columns.
- Every query is scoped by `org_id` from the authenticated session — there's no path in
  any of these endpoints that lets one organization read or write another's data, even by
  guessing a UUID.
- Migrations are now sequential and tracked: `db/migrate.js` applies any `NNN_*.sql` file
  in `db/` it hasn't seen before, recorded in a new `schema_migrations` table. Adding
  Milestone 2's tables later is just dropping in `003_*.sql` and re-running `npm run migrate`.
- The frontend's CRM screen got a stage dropdown per contact and an inline "add contact"
  form; the PM board got "← / →" buttons to move a task between columns and an inline
  "add task" form. No drag-and-drop yet — deliberately kept simple for this milestone.

### Re-deploying after pulling this update
```bash
cd backend
npm run migrate     # applies 002_crm_pm.sql only — 001 is already recorded, won't re-run
pm2 restart digitpenhub-suite-api

cd ../frontend
npm install          # no new frontend deps this milestone, safe either way
npm run build
pm2 restart digitpenhub-suite-web
```
First contacts/tasks for the existing org are seeded automatically by `npm run seed`
(safe to re-run — it skips seeding if contacts/projects already exist for that org).

### Testing checklist (Milestone 1 additions)
- [ ] Add a contact via the form → appears in the table, count in the stage strip updates
- [ ] Change a contact's stage via the dropdown → persists after page refresh
- [ ] Add a task → appears in "To do"
- [ ] Move a task right/left → lands in the correct column, persists after refresh
- [ ] Log in as a *different* org's user (once one exists) → confirm contacts/tasks from
      the first org never appear — this is the one that actually matters for security

### Outstanding / next steps (Milestone 2)
- Drag-and-drop for the task board (currently button-based)
- Editing/deleting contacts and tasks, not just creating and moving
- A real second organization to actually exercise the multi-tenant isolation, rather than
  trusting the `org_id` scoping on code-review alone

---

## Milestone 2 — Edit/delete on CRM, multi-project on PM

### What's new
- **CRM**: contacts can now be fully edited (name, company, email, phone, value — not just
  stage) and deleted, both with their own buttons per row.
- **PM**: multiple projects are now real — "+ New project" creates one, each project's
  name can be renamed inline, and a project can be deleted (cascades to its tasks at the
  database level via `ON DELETE CASCADE`, defined back in `002_crm_pm.sql`). Tasks can be
  renamed and deleted individually, alongside the existing move-between-columns buttons.

### New/changed API endpoints (`/api/v1`)
| Method | Path | Purpose |
|---|---|---|
| PATCH | `/crm/contacts/:id` | *(expanded)* now accepts fullName/company/email/phone too, not just stage/value |
| DELETE | `/crm/contacts/:id` | Delete a contact |
| POST | `/pm/projects` | *(already existed, now exposed in the UI)* create a project |
| PATCH | `/pm/projects/:id` | Rename a project |
| DELETE | `/pm/projects/:id` | Delete a project + its tasks |
| DELETE | `/pm/tasks/:id` | Delete a task |

No schema changes this milestone — `002_crm_pm.sql` already had everything needed
(including the cascade-delete relationship), so there's no `003_*.sql` to run. Just code.

### Re-deploying
```bash
cd backend && pm2 restart digitpenhub-suite-api
cd ../frontend && npm install && npm run build && pm2 restart digitpenhub-suite-web
```
No migration step needed this time — only application code changed.

### Testing checklist (Milestone 2 additions)
- [ ] Edit a contact's name/company/email/phone → Save → persists after refresh
- [ ] Delete a contact → confirmation prompt appears → row disappears, doesn't reappear on refresh
- [ ] Create a second project → appears as its own board below the first
- [ ] Rename a project → new name persists after refresh
- [ ] Delete a project → it and all its tasks are gone after refresh (confirms the cascade)
- [ ] Rename a task, delete a task → both persist after refresh
