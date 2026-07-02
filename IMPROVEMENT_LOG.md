# DigitPenHub Suite — Improvement Log

This file is the memory trail for the recurring "continuous improvement" audit
pass. Read it before starting a new pass — don't repeat what's logged as done;
go deeper or cover new ground instead.

---

### Current state (as of end of Pass 7)
**A real, live production bug was reported and fixed**: a genuine user
(confirmed in Pass 6, `digitpen3@gmail.com`) signed up, then on a later visit
could not sign back in — every login attempt bounced back to the public
signup/marketing page instead of the app, even though credentials were
correct. Root cause: `app/page.jsx` (made a cookie-reading Server Component
in Pass 5) was being navigated to via `router.push('/') + router.refresh()`
after login/signup — a client-side Next.js App Router transition that can
serve a stale, cached signed-out render instead of re-evaluating the session
cookie server-side. Fixed by switching every auth-transition navigation
(login, signup, MFA verify, sign-out, and the session-expiry redirect) to a
hard `window.location.href` navigation, which always hits the server fresh.
Verified by reproducing the exact reported journey (sign up → sign out →
sign back in with the same credentials) across 5 independent fresh-browser
sessions with zero failures — previously this was silently broken for real
users. Also closed the last concrete gap from Pass 6's multi-page site
templates: Contact pages now embed a real, working lead-capture form (not
just a `mailto:` link), reusing the existing Lead Generation module's public
submission endpoint — verified by submitting a real anonymous visitor
message and confirming it landed in the org's actual Lead Generation inbox.
A broader regression sweep across CRM/Invoices/Team/Billing/Website
Builder/Funnel Builder turned up no other bugs.

---

### Current state (as of end of Pass 6)
Step 1b ("the most important gap to close this pass" per the standing
prompt's own repeated wording) had been deprioritized for five passes in a
row in favor of other concrete wins — every template in the library was
still a single standalone page with no way to link to another page at all
(no `nav`/`footer` block type existed anywhere in the renderer). This pass
built genuine multi-page, cross-linked site templates: new `nav`/`footer`
block types (renderer + editor UI in both Website Builder and Landing Page
Builder), a `site_templates`/`site_template_pages` data model distinct from
the existing single-page `page_templates`, and 3 fully-written multi-page
sites (Real Estate, SaaS & Tech Startups, Restaurants & Food Delivery — 18
pages total) with genuine narrative copy (real "our story"/team bios/
service descriptions/testimonials, not placeholder text) and real Pexels
imagery per page. Verified end-to-end in a live browser: created a site
from a template, published all 6 generated pages, and confirmed clicking
nav links actually navigates between distinct real published pages with
matching content — not a cosmetic mockup. 15 of ~18 brief categories still
only have single-page templates; this is the clear next-pass target to
keep pushing the same direction rather than treating 3 categories as done.

---

### Current state (as of end of Pass 5)
Step 1m (public marketing site + sign-up funnel), explicitly flagged in the
standing prompt as **high priority — fix this pass**, had gone completely
untouched across Passes 1–4 (confirmed by grep: zero mentions in this log
before today). This pass closed it for real: a working public sign-up
(`POST /api/v1/auth/register`), a forgot/reset-password flow that didn't
exist at all before, a genuine public marketing homepage + `/pricing` +
`/features` (previously `/` instantly bounced every visitor to `/login`
with zero front door), and a login page that now actually handles the 2FA
challenge step it was silently dropping. Along the way this pass caught and
fixed two real, previously-invisible bugs: (1) a transaction-atomicity bug
in the new signup endpoint where bare `pool.query('BEGIN'/'COMMIT')` doesn't
guarantee same-connection execution — caught by the first real signup
attempt failing with a bogus unique-constraint error; (2) the login card's
logo `<img>` had zero CSS sizing (a raw 2000×2000 PNG), blowing up the
entire card layout — this is almost certainly what the standing prompt's
own audit meant by "login page looks cramped/unstructured." Also confirmed,
via direct audit (grep + live DB queries, not just reading the log), that
four items Pass 4 listed as "still open" were **already secretly finished**
by an interrupted prior run that never got logged: full 18-category/36-
template library (Step 1b breadth), profile self-serve name/email/avatar
editing, and notification email fallback for high-value events all exist
and work. This is the third pass in a row to find silently-completed work
from an interrupted run — worth remembering that "still open" in this log
is a lead to verify, not ground truth. Funnel-level templates and custom
domains/white-label (Step 1d, still blocked on real Cloudflare credentials)
remain genuinely open.

---

## Pass 7 — 2026-07-01

### User-reported bug: real accounts couldn't sign back in (fixed, root-caused, verified)
The user reported directly: a real person signed up, later tried to sign in
with the same email/password, and instead of reaching the app kept landing
back on the public signup/marketing page — unable to access any modules.

**Diagnosis, not guesswork**: pulled the live API access logs
(`/root/.pm2/logs/digitpenhub-suite-api-out-11.log`) and found the exact
real-world sequence from a genuine external IP (159.26.101.102, matching the
`digitpen3@gmail.com` signup found in Pass 6): `register` 201 → `login` 200
eleven seconds later (meaning they landed somewhere that made them try
logging in *again*) → `register` 409 (tried signing up again, meaning they
were back on the signup page) → `login` 200 → `login` 200 again 25 minutes
later. The backend was returning success (200/201) every time — this was
never an authentication bug (password hashing, comparison, session
creation all checked out and matched Pass 2's confirmed contract). The bug
was entirely client-side navigation.

**Root cause**: Pass 5 turned `app/page.jsx` into a Server Component that
reads the `dph_session` cookie (`cookies().has(...)`) to decide between
rendering `AppShell` or `MarketingHome`. The login/signup pages navigated
there via `router.push('/'); router.refresh();` — a Next.js App Router
client-side transition. This pairing is not reliable for a signed-out →
signed-in transition: the client Router Cache can serve a previously-cached
render of `/` (from before the user had a session) instead of forcing a
fresh server evaluation of the now-present cookie, so the user lands back on
the marketing page and has to re-discover the login/signup links — exactly
matching the reported symptom and the real log sequence above.

**Fix**: replaced every auth-transition navigation with a hard
`window.location.href` redirect, which always issues a fresh request re-
evaluated server-side, eliminating the Router Cache ambiguity entirely:
- `frontend/app/login/page.jsx` — both the normal login success path and
  the MFA-verify success path.
- `frontend/app/signup/page.jsx` — signup success path.
- `frontend/components/AppShell.jsx` — `handleSignOut()` (was
  `router.push('/login')`) and the session-expiry redirect inside the
  `/auth/me` bootstrap effect (same risk in reverse — a stale authenticated
  render persisting after the cookie is actually gone).
- Removed the now-unused `useRouter` import/usage from both auth pages.

**Verified the exact reported user journey, not just the fix in isolation**:
in a real headless-browser session, signed up a fresh account, confirmed the
real app loaded, signed out, confirmed the marketing page appeared, then
signed back in with the same credentials and confirmed the real app loaded
— repeated across 5 independent fresh browser contexts with zero failures
(previously this would have been flaky/broken depending on Router Cache
timing, matching why it looked "random" to the reporting user).

### Regression sweep (requested explicitly — "fix all bugs")
Given the severity of the bug above, did a broader sanity pass rather than
assuming it was isolated: signed up a fresh test account and clicked through
CRM, Invoices, Team, Billing & Plans, Website Builder, and Funnel Builder.
All loaded correctly with real data and zero console errors. (Two false
positives in the first automated pass — "Team" and "Billing" aren't in the
module search box, they're separate sidebar-footer links/routes — confirmed
by testing them directly rather than trusting the first script's output.)
Also grepped the entire frontend for every other `router.push` call to rule
out the same bug class elsewhere — the only other instances are
authenticated-to-authenticated navigations (e.g. opening an invoice) or
transitions to already-safe client-only pages, none of which cross the
cookie-reading Server Component boundary that caused this bug.

### Step 1b follow-up: real working contact forms (closes Pass 6's flagged gap)
Pass 6 shipped multi-page site templates but used a `mailto:` link on
Contact pages rather than a working form, explicitly flagging a fake/non-
functional form as against the standing rule. This pass builds the real
thing by reusing existing infrastructure, not duplicating it:
- New `form` block type: `frontend/app/p/[slug]/FormBlock.jsx` (a small
  client-component island inside the otherwise server-rendered public page)
  fetches and submits against the **existing** Lead Generation module's
  already-built public endpoints (`GET/POST /api/v1/leads/forms/:id/...`) —
  no new submission/storage system invented.
- Block editor UI (`AppShell.jsx`, both Website Builder and Landing Page
  Builder) lets any page's form block pick an existing lead form from the
  org's real list, or one-click create a new Name/Email/Message form.
- `siteTemplatesController.js`'s `useSiteTemplate` now creates a real
  `lead_forms` row (inside the same dedicated-client transaction as the
  pages) whenever a generated site includes a contact-role page, and embeds
  a working `form` block referencing it — every site created from a
  template now has a genuinely functional contact form from the moment it's
  published, with submissions flowing into the org's real Lead Generation
  inbox and triggering the existing new-lead email notification.
- **Verified, not assumed**: created a real "Test Bistro" site from the
  Restaurant template, published the contact page, submitted the form as a
  completely anonymous visitor in a real browser (no auth), and confirmed
  the submission appeared in `GET /api/v1/leads/submissions` with the
  correct form name and message content.

### Decisions made
- Chose a hard navigation (`window.location.href`) over trying to force
  Next.js's Router Cache to invalidate correctly (e.g. via cache-busting
  query params or `router.replace`) — a full navigation is the simplest,
  most deterministic fix for an auth boundary specifically, and the minor
  cost (one extra full page load) is invisible next to the cost of users
  silently failing to log in at all.
- Kept the `form` block's lead-form selection as "pick an existing form or
  create a simple one," not a full inline field-builder inside the page
  editor — the Lead Generation module already has a complete field editor;
  duplicating it inside the block editor would be redundant machinery for a
  block type whose main job (for now) is embedding, not authoring.

### Known gaps for next pass
- 15 of ~18 template categories still single-page only (unchanged from
  Pass 6 — the multi-page + working-form infrastructure now fully exists for
  whichever categories get built next).
- Funnel-level templates, other-module templates (Step 1c), and custom
  domains/white-label (Step 1d, blocked on credentials) all remain open,
  same as every prior pass.
- Worth a future pass explicitly grepping for any other Next.js App Router
  navigation that crosses a cookie/auth-state boundary via `router.push`
  rather than a hard navigation — this pass fixed every instance found, but
  it's a class of bug worth remembering when adding new auth-adjacent flows
  (e.g. accepting a team invite, which currently sends the user to `/login`
  manually rather than auto-signing them in — safe today, but worth the
  same scrutiny if that flow ever changes to auto-login).

---

## Pass 6 — 2026-07-01

### Re-audit before planning
Re-read `IMPROVEMENT_LOG.md` per the standing process but verified rather
than trusted it. Spot-checked: both PM2 processes were still running with
the exact PID/uptime left at the end of Pass 5 (no external changes since);
confirmed via `psql` that a **real user signed up live in production**
during this pass (`digitpen3@gmail.com` / org "Pamcet Academy") — genuine,
independent validation that Pass 5's sign-up fix works outside of this
session's own test accounts, not just under controlled verification. Did
not touch this real account or org.

### Step 1b — multi-page site templates (previously: every template was a single page; now: genuinely linked multi-page sites)
The standing prompt calls this "the most important gap to close this pass"
verbatim, every time it's pasted — it had been consciously deprioritized in
Passes 1–5 in favor of other concrete, well-scoped wins each time. Grepped
the renderer (`frontend/app/p/[slug]/page.jsx`) and confirmed there was no
`nav` or `footer` block type at all — meaning even *if* multiple pages
existed, nothing could link them together. Built the missing foundation and
the multi-page template system on top of it:

**New block types** (`nav`, `footer`) — real, reusable, not template-only:
- `frontend/app/p/[slug]/page.jsx`: `NavBlock` (sticky header, logo, links,
  optional CTA button) and `FooterBlock` (logo, links, copyright line)
  renderers, wired into the existing `Block()` switch.
- `frontend/components/AppShell.jsx`: added to `BLOCK_DEFAULTS` (so they're
  selectable from the existing "+ Add block" dropdown on *any* page, not
  just generated ones) and full per-type editor UI (add/remove/edit links)
  in **both** the Website Builder and Landing Page Builder block editors —
  this codebase duplicates the block-editor UI between the two builders
  (pre-existing pattern, not introduced this pass), so both copies were
  updated to keep them consistent.

**New data model** — `backend/db/063_site_templates.sql`: `site_templates`
(category, name, description) + `site_template_pages` (page_role,
slug_suffix, title, nav_label, blocks — content blocks only, nav/footer
injected at use-time). Deliberately a separate model from `page_templates`
rather than overloading it — a site template is a *group* of pages with a
shared identity (site name, cross-page nav), which the single-page model
has no concept of.

**Backend** (`siteTemplatesController.js`, `routes/siteTemplates.js`,
mounted at `/api/v1/site-templates`): `useSiteTemplate` reserves a
collision-free base slug for the whole site (checks both exact match and
`base-%` prefix so e.g. "sunrise-realty" can't collide with an
already-existing "sunrise-realty-contact"), computes every page's final
slug up front, then builds one real `nav`/`footer` block per page pointing
at every other page's *actual* slug and inserts all pages in a single
dedicated-client transaction (`await db.connect()`, not bare
`pool.query('BEGIN')` — applying the exact lesson from Pass 5's connection-
safety bug from the start this time, not after hitting it again).
Content authored with `__LINK:role__` placeholders (e.g. "View featured
listings" needs to point at the portfolio page, but that page's real slug
isn't known until the site is instantiated) — resolved to real `/p/<slug>`
hrefs at use-time via a JSON-string replace against the now-known slug map.

**Content — 3 fully-written multi-page sites** (`db/seedSiteTemplates.js`,
18 pages total, idempotent by site name):
- **Harborview Realty** (Real Estate) — home, about (real founding story +
  3 named team members with roles), services (4 described services),
  featured listings (3 real property write-ups with prices), testimonials
  (3 natural-sounding quotes), contact.
- **Ledgerly** (SaaS & Tech Startups) — home, about, platform (4 features),
  testimonials, blog (3 real post summaries), contact.
- **Basil & Ember** (Restaurants & Food Delivery) — home, about (founding
  story + chef bios), menu highlights, gallery, reviews, contact.
Each page has a real Pexels-fetched hero image matched to its actual
content (e.g. the listings page uses an interior photo, not the same hero
image reused everywhere).

**Frontend gallery**: new "Multi-page site template" button in Website
Builder (next to the existing single-page "Choose a template"), a
`renderSiteTemplateGallery()` modal (same plain-function-not-component
pattern as the existing gallery, deliberately avoiding the nested-component
remount bug Pass 1 found and documented) with a site-name input per card and
a "Create this site" action.

**Verified end-to-end in a real headless-browser session, twice** — once
via direct API calls (created a site, confirmed all 6 pages had correct
slugs and correctly-resolved internal links, e.g. the home page's hero CTA
pointed at `/p/sunrise-realty-listings`), and once through the actual UI
(signed in as a fresh test account, searched the sidebar for "Website
Builder", opened the gallery, saw all 3 real templates with page counts and
descriptions). Published all 6 generated pages and clicked through the live
nav bar between Home → About → Listings → Contact, confirming each click
lands on a distinct, correctly-rendered real page — not a static mockup.
Zero console errors throughout. All test data (site pages, test org/user)
deleted afterward.

### Decisions made
- Kept `site_templates` fully separate from `page_templates` rather than
  adding a "group" foreign key to the existing table — a page template's
  `use` endpoint creates exactly one page; a site template's `use` endpoint
  creates N pages in a single transaction and needs slug-collision handling
  across all of them together, which is different enough machinery to
  deserve its own model rather than overloading one endpoint with two
  shapes of behavior.
- Content blocks store cross-page links as `__LINK:role__` placeholders at
  seed time and resolve them at use-time, rather than hardcoding relative
  paths — the final slug depends on the org's chosen site name, which isn't
  known until `useSiteTemplate` runs.
- Picked 3 categories (Real Estate, SaaS, Restaurants) to do properly rather
  than spreading thin across more — matches the pattern that's worked in
  every prior pass (depth over breadth), and let the reusable nav/footer
  block infrastructure (not just this pass's specific 3 sites) be the
  actual lasting deliverable.
- Did not build a "form" block type for the Contact pages — the brief asks
  for "working form + address/map block." A real working form needs either
  a backend submission endpoint or wiring into the existing Forms module;
  faking one that doesn't submit anywhere would violate the standing rule
  against fake buttons. Used real address/phone/email/hours content plus a
  `mailto:` CTA instead — honest about current capability. Flagged below as
  a concrete next step now that the infrastructure (nav/footer, multi-page
  sites) exists to hang it off of.

### Known gaps for next pass
- **15 of ~18 brief categories still single-page only** — Finance, E-
  commerce, Health/Fitness, Legal, Nonprofit, Events, Travel, Beauty,
  Education, Automotive, Coaching, Creative Portfolio, Construction, Crypto,
  Marketplace all still need the same multi-page treatment just given to
  Real Estate/SaaS/Restaurants. The `site_templates` infrastructure now
  exists — this is now "write more real content following the established
  pattern," not "solve a new technical problem."
- **A real "form" block type** — would let Contact pages (and other pages)
  embed an actual working lead-capture form instead of a `mailto:` link.
  The existing Lead Forms/Forms modules already have submission handling;
  the natural next step is a block type that embeds or links to one of
  those rather than reinventing form storage.
- **Funnel-level templates** — still not built (carried over from Pass 1;
  now more valuable than before, since funnel steps could reference the new
  multi-page site templates' generated pages directly).
- **Templates for other modules** (Step 1c) — Invoices/Quotations, Popup
  Builder, Forms/Survey Builder, Certificate Generator, Quiz Builder — still
  none started.
- Custom domains/white-label (Step 1d) — still blocked on Cloudflare
  credentials, same as every prior pass.

---

## Pass 5 — 2026-07-01

### Step 1m — public marketing site & sign-up funnel (previously 0% done, now built and browser-verified)
Confirmed via grep across the whole repo, not assumption, that this was
completely untouched: no `register`/`signup` handler anywhere in
`authController.js`, no forgot/reset-password route, `app/page.jsx` was a
one-line `<AppShell />` with no separate marketing content, and
`frontend/middleware.js` redirected every signed-out visitor hitting `/`
straight to `/login` — meaning the product had no front door at all.

**Backend** (`backend/src/controllers/authController.js`,
`backend/src/routes/auth.js`, migration `062_password_reset_tokens.sql`):
- `POST /api/v1/auth/register` — creates an organization + owner user +
  signs the user in immediately (no admin approval gate; this is the
  platform's own free-trial sign-up, distinct from `teamController.js`'s
  invite-to-*existing*-org flow). Discovered mid-build that a DB trigger
  (`trg_org_subscription` / `auto_create_subscription()`, from the same
  earlier interrupted session that built the other silently-finished work
  above) already auto-creates a free-plan `subscriptions` row for every new
  org — removed a redundant manual insert that was colliding with it.
- `POST /api/v1/auth/forgot-password` — always responds identically whether
  or not the email exists (no account enumeration), emails a 1-hour
  one-time token via the existing `mailer.js`.
- `POST /api/v1/auth/reset-password` — consumes the token, revokes all
  sessions, matches the same 8-char minimum as change-password.
- Fixed a real bug found during the first live test: `register()` used
  bare `db.query('BEGIN')` / `db.query('COMMIT')` against the shared `pg`
  Pool (the same pattern already used elsewhere in this codebase, e.g.
  `inventoryController.js`) — this does not guarantee every statement in
  the "transaction" runs on the same physical connection. The very first
  real signup attempt failed with `duplicate key value violates unique
  constraint "subscriptions_org_id_key"` for a genuinely fresh org — traced
  with temporary debug logging to the DB trigger race above, then fixed
  properly by switching to a dedicated `client = await db.connect()` for
  the whole transaction (`client.query`/`COMMIT`/`ROLLBACK`/`release()`),
  which is the correct node-postgres pattern. Worth a future pass auditing
  other bare `db.query('BEGIN')` call sites (inventory, payroll, digital
  products controllers) for the same latent bug under real concurrency.
- Drive-by fix: `authController.js` had `require('qrcode')` hardcoded to an
  absolute path (`require('/home/suite.../node_modules/qrcode')`) instead
  of the package name — harmless today but fragile; fixed to a normal
  `require('qrcode')` (it's a real `package.json` dependency).

**Frontend**:
- `app/login/page.jsx` rewritten: now actually handles `requiresMfa` from
  the login response (previously silently ignored — any 2FA-enabled user's
  login would appear to succeed with no session cookie ever set, since
  `login()` returns 200 + `{requiresMfa, mfaToken}` rather than throwing,
  so the old code's success path just navigated to `/` with no cookie).
  Added a second-step MFA/backup-code form, a "Forgot password?" link, and
  a "Create a free account" link.
- New `app/signup/page.jsx`, `app/forgot-password/page.jsx`,
  `app/reset-password/[token]/page.jsx` — same `login-card` visual pattern
  as the existing login page.
- **Real bug fixed while screenshotting for verification**: `.login-card
  .brandmark` had no size rule on its `<img>` at all — `/logo.png` is a raw
  2000×2000 PNG, so it rendered at native size, blowing the whole card
  layout apart (this is very likely the exact "login page looks cramped/
  unstructured" complaint in the standing prompt). Fixed
  (`.login-card .brandmark img{height:32px;width:32px}`) — now affects
  login, signup, forgot-password, and reset-password identically since they
  share the markup.
- New `app/page.jsx`: server component reading the `dph_session` cookie via
  `next/headers` — renders `AppShell` if present, a new `MarketingHome` if
  not, instead of always rendering the app and letting client-side code
  redirect.
- New `components/marketing/{MarketingNav,MarketingFooter,MarketingHome}.jsx`
  and `app/pricing/page.jsx` (fetches real, live plan data from
  `GET /api/v1/billing/plans` — moved this one route above the `requireAuth`
  gate in `backend/src/routes/billing.js` since it's public pricing info,
  not account data) and `app/features/page.jsx`. Copy is specific to what
  this product actually does (97 real modules across 10 categories, pulled
  from the real category list) — not generic SaaS placeholder text.
- `middleware.js`: `/`, `/pricing`, `/features` added to the public
  allowlist (previously any signed-out request to `/` was force-redirected
  to `/login` before the page could even decide what to render); `/signup`,
  `/forgot-password`, `/reset-password` added to the "auth pages" group that
  bounces already-signed-in users back to the app, same as `/login` already
  did.

**Verified end-to-end in a real headless-browser session (Playwright), not
just curl**: home page → clicked "Start free" → filled and submitted the
real signup form → landed straight in the live app dashboard ("97 of 97
modules live", real sidebar, real avatar initials) with zero console
errors → signed out → signed back in with the same credentials → session
worked. Also independently verified via curl: forgot-password triggers a
real DKIM-signed send attempt (confirmed in `/var/log/maillog`; bounced only
because the test recipient wasn't a real routed mailbox — expected, not a
bug), reset-password's token is single-use (second attempt correctly
rejected), and the old password stops working immediately after a reset.
All test accounts/orgs created during verification were deleted afterward;
confirmed only real pre-existing data remains.

### Decisions made
- Sign-up is fully self-serve with no admin approval step, matching the
  standing prompt's explicit instruction ("Free-tier or trial sign-up
  should work start-to-finish... unless that is a deliberate product
  decision — if so, note it explicitly"). No such deliberate restriction
  was found anywhere in the code, so self-serve was treated as the correct
  default rather than something to ask about.
- `forgot-password` always returns the same generic response regardless of
  whether the email exists, to avoid account enumeration — standard
  practice, not called out in the brief but a correctness issue too cheap
  to skip.
- Kept `register()`'s org/user creation as a dedicated-client transaction
  rather than reverting to the bare-pool pattern used elsewhere in the
  codebase, even though it's inconsistent with existing code — the bug it
  hit on the very first real test proved the existing pattern is
  genuinely unsafe, not just stylistically different.
- Did not attempt custom-domain/white-label (Step 1d) or a public domain-
  purchase flow this pass — still blocked on the same missing Cloudflare/
  registrar credentials flagged in every prior pass; revisit once those
  exist rather than re-flagging every time.

### Needs external action (cannot be completed from this environment)
- Same as every prior pass: real DKIM/SPF DNS records for mail
  deliverability, and Cloudflare/registrar API credentials for Step 1d.
  See `NEXT_STEPS_FOR_YOU.md`.

### Known gaps for next pass
- **Funnel-level templates** — still not built (needs a small
  `funnel_templates` + `funnel_template_steps` data model referencing the
  existing 36-template `page_templates` library; scoped in Pass 1's notes,
  still valid). This was this pass's original plan before the Step 1m audit
  surfaced a much higher-priority, completely-untouched gap instead.
- **Additional page types per template category** — every category still
  only has a homepage + one landing page; the brief's "multi-page site per
  template" bar (About/Services/Portfolio/Testimonials/Contact/Blog all
  linked via real nav) is not met by any category yet — this is the single
  biggest remaining gap against the Step 1b brief.
- **Templates for other creation modules** (Step 1c) — Email Marketing has
  templates (Pass 2); Invoices/Quotations, Popup Builder, Forms/Survey
  Builder, Certificate Generator, Quiz Builder still don't.
- **Audit other bare `pool.query('BEGIN')` call sites** for the same
  connection-safety bug just found and fixed in `register()` — at minimum
  `inventoryController.js`, `payrollController.js`,
  `digitalProductsController.js` use the same pattern; low real-world risk
  (all single-request, low-contention paths) but worth converting to
  dedicated-client transactions opportunistically.
- **Leftover test account from an earlier interrupted session**:
  `pass5-verify@digitpenhub.com` (org "Pass5 Verify Org") still exists in
  the live `users`/`organizations` tables — not created this pass, and not
  deleted per the standing rule against removing user records without
  explicit confirmation. Flagging for the account owner to delete (or ask
  a future pass to) rather than acting on it unilaterally.
- Custom domains/white-label (Step 1d) — still fully unstarted, same
  Cloudflare-credential blocker as every prior pass.

---

## Pass 4 — 2026-07-01

### Published-site SEO (Step 1f) — audited, finished, verified
Found this already substantially built (migration `060_pages_seo.sql`,
`og_image`/`canonical_url` columns, `pagesController.js` read/write support,
editor UI fields with Pexels search wired to the OG image field,
`generateMetadata()` in `p/[slug]/page.jsx` emitting OG/Twitter tags +
canonical link, `frontend/app/sitemap.js` + `robots.js`) — evidently an
earlier run of this same pass got partway through and was interrupted before
logging it. Did **not** assume it worked from the code alone:
- Hit `/sitemap.xml` and `/robots.txt` live — both return correct, valid
  output (sitemap currently lists 0 published pages, which is accurate: no
  page in the `pages` table has `status='published'` right now — not a bug).
- Temporarily published a real seeded page with test `og_image`/
  `canonical_url` values, curled `/p/<slug>`, confirmed real `<meta
  property="og:*">`, `twitter:*`, and `<link rel="canonical">` tags render
  with the correct values, then reverted the page back to its original
  draft/null state so no test data was left live.
- This closes out the last open item from Pass 3's Step 1f audit.

### Team invite emails now actually send (Step 1f gap from Pass 3)
- New `backend/src/utils/mailer.js` — thin wrapper around the same
  `nodemailer` sendmail-transport pattern already used by
  `emailController.js` (local Postfix, DKIM via opendkim), but
  non-throwing: returns `{ ok, error }` instead of rejecting, so a mail
  failure can never break invite creation.
- `teamController.js`'s `inviteMember` now calls `sendMail()` with a real
  invite email (inviter name, org name, role, link, 7-day expiry — matches
  the actual `invitations.expires_at` default) and returns `emailSent` in
  the response alongside the existing `inviteLink`.
- `frontend/app/team/page.jsx`: the invite-link box now reads "Invitation
  sent by email — you can also share this link directly" or "Could not
  email this invite — please share this link directly" based on the new
  `emailSent` field, instead of always implying email was sent. Rebuilt
  (`npm run build`) and restarted the web PM2 process; confirmed `/team`
  still returns 200 and renders post-rebuild.
- **Bug found and fixed**: `FRONTEND_ORIGIN` in `backend/.env` was
  `http://localhost:4000` — meaning every invite link this app has ever
  generated in production was a dead `localhost` URL, not
  `https://suite.digitpenhub.com/invite/...`. Fixed to the real production
  origin. Confirmed via a live invite: link now correctly reads
  `https://suite.digitpenhub.com/invite/<token>`.
- Verified with two real invite calls against the live API (to a
  deliberately-invalid test address and to a real Gmail address), inspected
  `/var/log/maillog` for actual postfix/DKIM behavior (not just trusting
  `emailSent: true`, since sendmail-transport success only means "handed to
  the local queue," not "delivered"), then deleted both test invitations
  via the real cancel endpoint afterward so no test data was left pending.

### opendkim was down VPS-wide since 2026-06-29 (found while verifying the above, not part of the original brief — fixed because it directly blocked the feature just built)
`emailSent: true` looked like success, but the mail was silently bouncing.
Investigation trail: `systemctl status opendkim` showed it crash-looping
(exit code 78) since 2026-06-29 17:37 — one day before this pass, meaning
**every app on this shared VPS** (pamcet, tekforce, slidegen, leadvault,
this suite) has had zero DKIM signing on outbound mail for over a day, not
something specific to this codebase.
- Root cause: `/etc/opendkim/KeyTable` was owned `root:root` (its sibling
  files `SigningTable`/`TrustedHosts` are correctly `opendkim:opendkim`) —
  the `opendkim` service user couldn't read its own key table
  (`dkimf_db_open(): Permission denied`), confirmed by running the binary
  directly as the `opendkim` user to reproduce the exact exit code before
  touching anything. Fixed ownership/mode to match its siblings; service is
  now `active (running)`.
- While fixing this, noticed the `SigningTable`/`KeyTable` had a working
  entry for `*@suite.digitpenhub.com` but none for the apex `digitpenhub.com`
  domain — which is what this app's actual outbound `From:` address
  (`sasere@digitpenhub.com`, from `ADMIN_EMAIL`) uses. A key pair for
  `digitpenhub.com` already existed on disk (`/etc/opendkim/keys/
  digitpenhub.com/`, generated 2026-06-28) but was never wired into either
  table. Added the missing lines to both (additive only — did not touch any
  other tenant's existing entries). Confirmed via `/var/log/maillog`:
  outbound mail now shows `DKIM-Signature field added (s=default,
  d=digitpenhub.com)`, which it did not before.
- **Caution for future passes**: editing `/etc/opendkim/{KeyTable,
  SigningTable}` with a normal file-write tool resets their ownership back
  to `root:root`, silently reintroducing the exact crash — had to re-`chown`
  both files after every edit this pass. If either file is touched again,
  immediately verify ownership is `opendkim:opendkim` mode `640` before
  restarting the service.

### Notification error swallowing (Step 1f gap from Pass 3)
- `backend/src/utils/notify.js`'s `catch { /* intentionally silent */ }`
  now logs `console.error('notify() failed:', {...})` with org/type/user
  context — a failed notification is no longer completely invisible. Did
  not add retry/email-fallback (bigger scope, not attempted this pass).

### Needs external action (cannot be completed from this environment)
- **Real mail deliverability is still blocked on DNS, not code.** Even with
  opendkim now signing correctly, Gmail rejected the test send with `DKIM =
  did not pass` / `SPF ... did not pass` because:
  1. No `default._domainkey.digitpenhub.com` TXT record is published (`dig`
     confirms empty) — the exact value to publish is sitting right there in
     `/etc/opendkim/keys/digitpenhub.com/default.txt`.
  2. `default._domainkey.suite.digitpenhub.com` also has no TXT record
     published, despite already being in the signing table before this pass.
  3. digitpenhub.com's existing SPF record
     (`v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com ~all`)
     does not authorize this server's outbound IP (`72.62.177.168`) — needs
     an added `ip4:72.62.177.168` mechanism.
  No `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ZONE_ID` exist anywhere on this box
  (checked), so none of this can be automated from here per the standing
  rule against faking DNS/SSL behavior without real credentials. **Action
  needed from the account owner**: add the DKIM TXT record(s) above and the
  SPF `ip4` mechanism in whichever DNS provider manages digitpenhub.com
  (likely Cloudflare, given the existing SPF `include:_spf.mx.cloudflare.net`).
  Until then, invite/campaign emails will keep bouncing at major providers —
  the in-app copy/paste link (now correctly pointing at production) remains
  the reliable fallback, which is exactly why the frontend still shows it
  unconditionally.

### Decisions made
- Built a separate `mailer.js` rather than extending or importing
  `emailController.js`'s private `makeTransport()` — invites are
  transactional/system mail, not campaign mail; keeping them decoupled means
  a future change to campaign-sending behavior (unsubscribe links, list
  logic, etc.) can't accidentally affect invite delivery.
- `sendMail()` never throws — invite creation succeeds the same way it did
  before this pass even if the email fails, matching how the existing
  in-app UI has behaved until now, and how Pass 3 confirmed this codebase's
  actual error contract (`apiFetch` throws) — an email-send failure isn't a
  request failure.
- Did not attempt to add a retry/backoff to `sendMail()` — invite emails are
  low-volume, user-initiated, one-at-a-time actions with a visible fallback
  (the link is always shown); the same retry complexity Pass 3 correctly
  scoped down to "only where it's actually needed" for AI calls doesn't
  clearly pay for itself here yet.

### Known gaps for next pass
- **DNS records for deliverability** (see "Needs external action" above) —
  the single highest-leverage next step for this feature, but requires the
  account owner's DNS/Cloudflare access, not more code.
- Everything still open from Pass 1–3: template category breadth (5 of ~17
  brief categories untouched), additional page types per existing category,
  funnel-level templates, profile name/email self-serve editing, templates
  for Invoices/Popup Builder/Forms/Certificate Generator/Quiz Builder,
  custom domains/white-label (Step 1d, still fully unstarted — same
  Cloudflare-credential blocker as above, worth solving once so both
  features unblock together), a full fresh Step 1 surface sweep (still not
  re-run since the original 15-batch pass — four passes in a row have now
  found concrete scoped features/bugs instead; still the right call each
  time so far, but worth revisiting if a pass turns up nothing concrete).
- Notification delivery is still in-app/polled only — no email fallback for
  high-value notification types, and no retry logic. Now that a real
  transactional mailer (`mailer.js`) exists from this pass, wiring an email
  fallback for e.g. "payment received" or "domain verified" notifications
  is a much smaller lift than it would have been before.

---

### Current state (as of end of Pass 3)
AI reliability (timeouts + call logging) is live on the two modules that
actually make external AI calls. The sidebar/home IA overhaul (collapsible
categories, live module search, pin/unpin, dashboard "Pinned modules"
replacing the 97-card wall) is built and verified in-browser with zero
console errors. A fast audit of team/roles, billing, notifications, and
published-site SEO found team/roles and billing to be genuinely more
built-out than expected (real invite flow, real Flutterwave payment
integration) — only SEO (no OG tags/canonical/sitemap/robots.txt) and
notification delivery (in-app only, no email/push) are real gaps; see
Pass 3 below for citations. Still open from earlier passes: 5+ template
categories, additional page types per category, funnel-level templates,
templates in ~5 other candidate modules, profile self-serve editing.
Passes so far have each picked a small number of concrete, well-scoped
items and finished them properly (built + browser-verified) rather than
spreading thin across the full brief in one shot — that pattern keeps
paying off and should continue.

---

## Pass 3 — 2026-07-01

### AI reliability (Step 1e)
Audited which "AI-named" modules actually call an external provider before
building anything — only two do: `aiDocumentsController.js` (AI Writer,
Anthropic) and `aiTranslatorController.js` (AI Translator). Everything else
that reads as "AI" in the module list either has no real external call yet
or was out of scope. Avoided building a general-purpose retry/fallback
system for modules that don't need it.
- New `backend/src/utils/aiReliability.js`: `fetchWithTimeout()` wraps
  `fetch` with `AbortSignal.timeout()` (default 15s), `logAiCall()` writes
  to a new `ai_call_log` table (migration `059_ai_call_log.sql`: org_id,
  feature, provider, success, used_fallback, error_message, duration_ms) —
  logging failures are swallowed so observability can never break the real
  request.
- Both controllers now: log the no-key fallback path, wrap their external
  fetch in `fetchWithTimeout`, log success with duration, and distinguish
  timeout (`AbortError`/`TimeoutError`) from other failures in both the log
  row and the user-facing warning message.
- Verified end-to-end with Playwright against the live AI Writer module —
  generation completed normally, no hang, response arrived well under the
  timeout.

### Sidebar / home dashboard IA overhaul (Step 1a)
Confirmed the complaint was real before touching anything: the home
dashboard's "Active now" section rendered `activeModules.map(...)` — all 97
live modules as cards, unfiltered, unsorted. Rebuilt the IA rather than
patching around it:
- `frontend/components/ui/Sidebar.jsx` rewritten: persistent search input
  that live-filters every active module by name across all categories with
  a star to pin/unpin directly from results; a "Pinned" section above
  categories when the user has pinned anything; categories are now
  collapsible (chevron toggle, per-category expand state) and reveal
  individual module links with pin stars when expanded, plus a "View all in
  X" link to the existing category-listing view for anyone who wants the
  full grid.
- New `localStorage`-backed state in `AppShell.jsx`: `pinnedSlugs` (key
  `dph-pinned-modules`, same pattern as the existing `dph-theme` key),
  `sidebarSearch`, `expandedCats`; `togglePin(slug)` persists on every
  change. `openModule(slug)` (pre-existing function, already did the right
  thing — real navigation + analytics tracking + per-module lazy loads) is
  reused as-is for both sidebar search results and pinned-section clicks.
- Home dashboard's "Active now" section renamed "Pinned modules" and now
  renders `pinnedModules` (a `useMemo` filtering `activeModules` by
  `pinnedSlugs`) instead of all 97 modules, with a proper empty state
  ("Pin your favorite modules from the sidebar…") for first-time users with
  no pins yet — no dead-end blank section.
- New CSS: `.sidebar-search`, `.nav-item-sub`, `.nav-pin`/`.nav-pin.is-pinned`,
  `.nav-empty-note`, `.nav-item-viewall` in `globals.css`; `.sidebar` changed
  from a plain scrollable block to a sticky flex column so the search box and
  category list stay independently scrollable from the fixed brand/account
  footer regions. Existing mobile drawer CSS (`@media max-width: 820px`)
  needed no changes — it already targets `.sidebar`/`.nav-item` generically.
- Verified in-browser with Playwright: expanded a category and saw its real
  module list, pinned a module via its star, confirmed it appeared in both
  the sidebar's "Pinned" section and the dashboard's "Pinned modules" card,
  searched "CRM" and clicked through to the real CRM module — zero console
  errors across the whole flow.

### Platform fundamentals audit — team/roles, billing, notifications, SEO (Step 1f)
Scoped as an audit-and-log pass, not a build pass, given everything else
already shipped this session — the goal was an honest inventory, not new
code. Findings (grep/read-verified, not assumed from naming):
- **Team & roles — real, working.** `organizations`/`org_id` model +
  `invitations` table (`backend/db/003_teams.sql`), full CRUD in
  `teamController.js` (invite/list/accept/role-change/remove) behind
  `requireRole('owner','admin')` middleware (`backend/src/middleware/rbac.js`),
  real frontend pages (`frontend/app/team/page.jsx`,
  `frontend/app/invite/[token]/page.jsx`). Gap: invite links aren't emailed —
  `teamController.js` returns the link directly instead of sending it, so
  invites currently require manual copy/paste. No "viewer" role, only
  owner/admin/member.
- **Billing — real, working, and not what the prompt assumed.** No
  Stripe/Paddle; a genuine Flutterwave integration instead
  (`billingController.js`) — real REST calls, server-side transaction
  verification, signed webhook validation, idempotent subscription
  activation against real `plans`/`subscriptions`/`payments` tables
  (`backend/db/008_subscriptions.sql`, seeded with Free/Starter/
  Growth/Business NGN pricing). The Upgrade button in AppShell's billing
  view calls real `/initiate`/`/verify` endpoints, not a no-op. Gated behind
  `FLUTTERWAVE_PUBLIC_KEY`/`SECRET_KEY` — returns a clean 503 if unset;
  whether those are actually set in production wasn't confirmed from the
  repo alone.
- **Notifications — real, DB-backed, in-app only.** Real `notifications`
  table + controller (`backend/db/010_notifications.sql`,
  `notificationsController.js`), AppShell fetches real counts/lists (not
  hardcoded), a shared `notify()` util is invoked from real events (e.g.
  team-join). Gap: delivery is in-app/polled only — no WebSocket/SSE push,
  no email (nodemailer exists in the codebase but isn't used for
  notifications), and `notify()` fails silently on error (empty catch),
  so a broken notification is currently invisible.
- **Published-site SEO — the one real gap.** Public pages
  (`frontend/app/p/[slug]/page.jsx`) do set a real per-page `<title>` and
  meta description via `generateMetadata()`, server-fetched from the page's
  own data — not a placeholder. But there are zero Open Graph tags, zero
  Twitter Card tags, no canonical URL, and no `sitemap.xml`/`robots.txt`
  anywhere in the repo. The `pages` table itself has no `og_image`/
  `canonical_url` columns, so even the data isn't captured yet — this needs
  a small migration plus `generateMetadata()`/route work, not just a
  frontend tweak. Flagging for a future pass rather than rushing it in.

### Decisions made
- Kept to two concrete, browser-verified deliverables (AI reliability,
  sidebar IA) plus one audit-and-log pass, instead of attempting all four
  Step-1f areas as builds — team/roles and billing turned out to already be
  real, so building them would have been wasted/duplicate work; the audit
  caught that before any code was written.
- Did not implement email delivery for invites/notifications or SEO
  meta/sitemap work this pass — both are clearly scoped, real gaps, but
  starting either properly (transactional email provider choice + templates
  for the former; DB column + route work for the latter) is a full unit of
  work on its own, better done as its own focused pass.

### Known gaps for next pass
- **SEO**: add `og_image`/`canonical_url` columns to `pages`, extend
  `generateMetadata()` with OG/Twitter tags, add a dynamic `sitemap.xml`
  route (one entry per published page) and a static `robots.txt`.
- **Invite emails**: wire the existing invite-link generation to an actual
  email send (nodemailer is already a dependency, just unused for this).
- **Notification delivery**: at minimum, stop swallowing `notify()` errors
  silently; consider email fallback for high-value notification types.
- Everything still open from Pass 1/Pass 2 (see above) is still open —
  template category coverage, funnel-level templates, profile self-serve
  editing, custom domains/white-label (Step 1d, not attempted any pass so
  far — needs Cloudflare API credentials that aren't in `backend/.env` yet).

---

## Pass 2 — 2026-07-01

Picked up directly from Pass 1's "Known gaps for next pass" rather than
re-auditing from scratch.

### Closed from Pass 1's "Needs backend work"
- **Password change**: added `POST /api/v1/auth/change-password`
  (`authController.js`) — verifies current password via existing
  `verifyPassword`/bcrypt, requires 8+ char new password, revokes every other
  session on success (consistent with "changing your password should log out
  stolen sessions" security practice), logs `password_changed` to the audit
  trail. Wired into the Account & Security → Security tab as a new "Change
  password" card above the existing 2FA card.
- Profile name/email self-serve editing and funnel-level templates are
  **still** open — not attempted this pass either, same reasoning as Pass 1
  (no safe/obvious backend shape to improvise for profile edits; funnel
  templates need their own small data model, see Pass 1 notes, still valid).

### In-editor Pexels image search
- `image` block's URL field (both Website Builder and Landing Page Builder
  block editors) now has a "Search Pexels" button opening a picker modal —
  search box, results grid, click to apply directly into the block. Reuses
  the exact `/api/v1/images/search` endpoint built in Pass 1 with zero new
  backend work. Existing `alt` text is preserved if already set.

### Template Library (page/funnel builder) — now 24 templates / 12 categories
Doubled the library by adding 6 new categories (2 templates each, one `page`
+ one `landing`, real Pexels imagery fetched at seed time exactly like Pass
1): **Legal & Professional Services, Nonprofit & Fundraising, Events &
Weddings, Travel & Hospitality, Beauty & Fashion, Education & Online
Courses**. Re-ran `seedPageTemplates.js` — confirmed idempotent (skipped all
12 Pass-1 templates by name, inserted exactly the 12 new ones). Verified in
browser: gallery dropdown correctly lists all 12 categories with accurate
counts.

Still open from Pass 1: Finance & Fintech / Real Estate / etc. only have 1
page type each (homepage + landing) — the brief also calls for pricing/about/
"coming soon"/contact-booking page types per category. Still not started:
Marketplace, Automotive, Coaching & Consulting, Creative Portfolio & Agency,
Construction & Home Services, Crypto & Web3 (5 of the ~17 brief categories
remain untouched).

### Templates — other modules (Step 1c — first module started)
- **Email Marketing**: new `email_templates` table + `GET
  /api/v1/email-templates` (list/categories/get), seeded with **12 templates
  across 6 categories** (Newsletter, Promotional & Sales, Welcome &
  Onboarding, Re-engagement, Product Announcement, Event Invitation) — each
  with a real subject line, preview text, and full HTML body using
  `{{placeholder}}` merge-field convention matching the existing campaign
  send flow. "Choose a template" button added next to "+ New campaign";
  selecting one pre-fills the campaign draft form (not a separate creation
  endpoint — campaigns aren't persisted until the user submits, so the
  template just seeds the same form state a from-scratch campaign uses).
  Verified end-to-end in browser: gallery renders, template applies
  correctly into the editable form fields.
- No other modules attempted this pass (Invoices/Quotations, Popup Builder,
  Forms/Survey Builder, Certificate Generator, Quiz Builder all still
  flagged from Pass 1 as strong candidates — none started).

### Bugs found and fixed (via verification, not code reading)
Two real bugs were caught this pass by actually driving the new features in
a browser and probing failure paths, not by re-reading the code:
1. **Silent failure on every Account & Security error path.** All five
   2FA/password handlers (`handleStart2fa`, `handleConfirm2fa`,
   `handleChangePassword`, `handleDisable2fa`, `handleRegenerateBackupCodes`)
   plus `confirmRevokeSession`, `useTemplate`, and `useEmailTemplate` were
   written checking `if (data.error) { ... }` after `await apiFetch(...)`.
   But this app's `apiFetch` (`frontend/lib/api.js`) **throws** on any
   non-2xx response rather than returning `{error}` — confirmed by checking
   how existing working handlers like `handleCreateCampaign` do it
   (`try/catch` with `err.message`). Every backend error in the new code
   (wrong password, invalid 2FA code, expired template) was silently
   swallowed: the loading spinner would just stop with zero feedback to the
   user. Found by submitting a deliberately wrong current password and
   noticing no error appeared. Fixed all eight call sites to use
   `try/catch(err) { showToast(err.message) }` or the equivalent
   `setXError(err.message)`, matching the codebase's established
   convention. **This confirms the app's actual error-handling contract
   (throw-based, not return-based) — worth remembering for any future
   handler written against these APIs.**
2. **(Recap from Pass 1, same root cause, watch for it recurring)** Nested
   function-component definitions used as JSX elements (`<Foo/>` where
   `function Foo(){}` is declared inside the render body) force a full
   remount on every parent re-render, breaking any controlled input inside
   them. Pass 1 hit this with the page-template gallery search box. This
   pass's new galleries (`renderEmailTemplateGallery`, `renderPexelsPicker`)
   were written from the start as the correct pattern (plain function
   returning JSX, called inline) specifically to avoid repeating it — and
   were verified clean via the same probe (typing a full search string,
   confirming it reaches the network request intact).

### Decisions made
- Password change revokes all *other* sessions but not the current one
  (matches how 2FA disable/enable don't force re-login either) — changing
  your password shouldn't log you out of the tab you're actively using it
  from, only stolen/idle sessions elsewhere.
- Email templates store a flat `subject`/`preview_text`/`body_html` shape
  rather than reusing the block-based `page_templates` schema — campaigns
  are raw HTML today (no block editor for emails exists), so forcing them
  into the page-block shape would have been speculative over-engineering for
  a format the app doesn't actually use yet.
- Did not build a `/use` POST endpoint for email templates (unlike page
  templates) — applying an email template doesn't create a persisted object,
  it just pre-fills a draft form the user hasn't submitted yet, so a GET-and-
  merge-client-side is the right amount of machinery, not less correct than
  page templates (which persist immediately because that's how the existing
  "+ New page" flow already works).

### Known gaps for next pass
- 5 of ~17 brief categories still untouched (Marketplace, Automotive,
  Coaching & Consulting, Creative Portfolio & Agency, Construction & Home
  Services, Crypto & Web3) — next lever for template breadth.
- Additional page types within existing categories (pricing, about/team,
  "coming soon", contact/booking) not started — everything so far is
  homepage + one landing page per category.
- Funnel-level templates (see Pass 1 — needs `funnel_templates` table).
- Profile name/email/avatar self-serve editing (needs new backend endpoint).
- Templates for Invoices/Quotations, Popup Builder, Forms/Survey Builder,
  Certificate Generator, Quiz Builder — all flagged, none started.
- Full fresh Step 1 surface audit (visual consistency beyond the original
  15-batch pass, IA, a real consolidated Settings area, accessibility,
  performance) still not re-run from scratch — two passes in a row have now
  focused on concrete scoped features instead. If Pass 3 doesn't have an
  obvious next concrete feature to build, this is the right time to do that
  full sweep instead of finding a third feature to bolt on.
- Given this pass caught two real bugs purely through verification (not code
  reading), it's worth explicitly budgeting verification time in every
  future pass, not just building — the `if (data.error)` vs `try/catch`
  mismatch could easily exist in other new code written without checking.

---

## Pass 1 — 2026-07-01

### Context: prior work this session (not tracked under this log, but directly relevant)
Before this log existed, the same session ran a full 15-batch UI/UX design-system
overhaul across all 97 modules (foundation components, home shell, then every
category). Highlights future passes should know about:
- Shared component library exists at `frontend/components/ui/`: Button, Card,
  Badge (+`info` variant), Input, Select, Textarea, Modal (supports `wide`
  prop), ConfirmDialog, Toast, SearchInput, Pagination, Skeleton/SkeletonRows,
  Tooltip, Menu/MenuItem/MenuSeparator, Sidebar, Topbar, Table, TabBar,
  StatusBadge, StatCard, BulkActionBar.
- Design tokens live in `frontend/app/globals.css` (`:root` + `[data-theme='dark']`).
- **75 confirmation-dialog bugs were found and fixed** (missing `ConfirmDialog`
  renders, zero-confirmation deletes, native `confirm()` popups) — this was a
  systemic pattern across almost every module. If you find another one, it's
  worth checking whether it's a genuinely new instance or one that was missed.
- Two serious logic bugs were found and fixed: a `handleDeleteTask` function-name
  collision between Task Management and Project Management (silently broke
  deletion in one of them), and the Certificates module calling entirely
  undeclared/wrong state setters (broke create/edit/delete).
- **Not yet done**: full component migration (raw `<button className="btn-primary">`
  etc. → `<Button>`) across most modules — only modules that got deeper
  refactors were migrated. ~450 raw button usages and ~55 raw `.card` usages
  still exist, kept visually correct via CSS aliasing (`.card`≈`.card-shell`,
  `.primary-btn`≈`.btn-primary`). Do not delete the legacy CSS classes until
  this migration is finished — see `.claude` plan file if it still exists.

### Step 0 — Audit trail & environment
- Created this file (first run).
- Added `PEXELS_API_KEY_1..7` to `backend/.env` (already gitignored; repo is
  not a git repository at all currently, so there's no committed-secret risk
  to flag).
- Built `backend/src/utils/pexels.js` — rotates across all 7 keys on 429/failure,
  6-hour in-memory cache per `query|perPage|orientation|page`, exposes
  `searchImages(query, opts)` and `firstImage(query, opts)`.
- Exposed it via `GET /api/v1/images/search?q=...` (`imagesController.js` /
  `routes/images.js`) for reuse anywhere in the app that needs stock imagery
  (e.g. an in-editor "swap image" tool — not built yet, see gaps below).

### Template Library (page/funnel builder)
- New table `page_templates` (migration `057_page_templates.sql`): category,
  page_type (`page`|`landing`), name, description, thumbnail_url, blocks (jsonb),
  sort_order.
- New endpoints: `GET /api/v1/page-templates` (filter by category/pageType/q),
  `GET /api/v1/page-templates/categories`, `GET /api/v1/page-templates/:id`,
  `POST /api/v1/page-templates/:id/use` (clones template blocks into a new
  page in the caller's org, returns the created page ready to edit).
- Seeded **12 templates across 6 categories** (2 each — one `page`, one
  `landing`), via `backend/db/seedPageTemplates.js` (idempotent — re-run
  safely, skips existing names by name match). Each template's hero image is
  a real Pexels photo fetched at seed time via the utility above, so nothing
  is a placeholder/gray box. Categories covered: Finance & Fintech, Real
  Estate, E-commerce & Retail, SaaS & Tech Startups, Health/Fitness/Wellness,
  Restaurants & Food Delivery.
- Frontend: new "Choose a template" entry point (alongside the existing
  "+ New page") in both **Website Builder** and **Landing Page Builder** —
  they share one gallery (`renderTemplateGallery(pageType, source)` in
  `AppShell.jsx`) with category filter, search, and thumbnail cards. Selecting
  a template creates a real page via the new endpoint and opens it directly
  in the existing block editor — every block is immediately editable,
  reorderable, removable, exactly like a from-scratch page (no separate
  "template mode").
- **Bug found + fixed during verification**: the gallery was originally
  written as a nested React component (`function TemplateGallery(){...}`
  used as `<TemplateGallery/>`) inside the main render body. That gives React
  a new function identity every render, forcing a full remount of the modal
  subtree on every keystroke — the search box only ever kept the first typed
  character. Fixed by converting it to a plain function that returns JSX,
  called inline (`{renderTemplateGallery(...)}`) rather than used as a
  component. Verified via Playwright: full search strings now reach the API
  correctly and the empty state renders. **Watch for this same pattern
  elsewhere** — `Tile` in the same file has the identical shape but hasn't
  caused visible bugs yet because it holds no focused input.
- Funnel Builder was **not** wired to templates this pass — funnels are a
  separate `funnels`/`funnel_steps` table (a funnel is a sequence of page
  steps), so a real "funnel template" needs a small `funnel_templates` concept
  (a named group of page-template references + step order), not just reusing
  `page_templates` directly. Logged as a gap below rather than guessed at.

### User Profile & Account
- Backend already had full 2FA (`setup2fa`/`confirm2fa`/`disable2fa`/
  `regenerateBackup`), session management (`listSessions`/`revokeSession`/
  `revokeAllOtherSessions`), and a security audit log (`getAuditLog`) —
  **none of it was reachable from the frontend at all.** This is exactly the
  kind of "backend the UI doesn't surface" gap Step 1 asks to look for.
- Built a new **Account & Security** page (`view === 'account'` in
  `AppShell.jsx`) with four tabs:
  - **Profile** — name/email/role/2FA status display.
  - **Security** — 2FA enable flow (QR code + confirm code), disable flow
    (code-gated), backup-code regeneration (code-gated).
  - **Sessions** — live table of active sessions with device/IP/signed-in
    time, current-session badge, per-session revoke + "sign out all others."
  - **Activity** — last 50 audit-log entries (logins, logouts, key actions).
- Reachable two ways: the Topbar avatar is now a real button (was inert
  before) opening this page, and a new "Account & Security" entry in the
  Sidebar footer next to "Billing & Plans."
- Small backend addition: `req.user` (via `requireAuth` middleware) now
  includes `totpEnabled` — needed for the frontend to know 2FA state without
  an extra round trip; pulled from the already-existing `users.totp_enabled`
  column, not invented.
- Verified end-to-end in a real browser (Playwright): all four tabs load real
  data (including genuine historical sessions/audit entries going back days),
  no console errors.

### Decisions made
- Pexels keys went in `backend/.env`, not a frontend `.env` — third-party API
  keys must never ship in client-side bundles; the backend already proxies
  every other external integration (Flutterwave) the same way.
- Template gallery shares one implementation across Website Builder and
  Landing Page Builder rather than duplicating it, since both already share
  the same `pages` table, `page_type` field, and block editor.
- Templates create a real page via a dedicated `/use` endpoint (not just
  handing the frontend raw block JSON to POST itself) so slug-uniqueness and
  org-scoping stay server-enforced, consistent with how `pages` creation
  already works elsewhere.
- Did not touch Funnel Builder's template story this pass — building it
  properly needs a small new backend concept (see gaps), and guessing at a
  shape here risked a half-right data model that's harder to fix later than
  to just do properly next pass.
- Did not attempt name/email/avatar self-serve editing on the Profile tab —
  no backend endpoint exists for it and one wasn't obviously safe to
  improvise (email changes usually need re-verification flows). Logged below
  instead of guessing.

### Needs backend work (not built — flagging instead of faking)
- **Password change** — no endpoint exists anywhere (`grep`-confirmed). A
  mature "Security" tab should have this; needs a new
  `POST /api/v1/auth/change-password` (current password + new password,
  reuse `bcrypt` already in use for login) before the frontend can offer it.
- **Profile edit (name/avatar)** — no endpoint exists. The Profile tab
  currently says as much rather than pretending to save. Needs a
  `PATCH /api/v1/auth/me` or similar plus, for avatar, real file upload
  storage (the app already has a Cloud Storage/assets module whose upload
  path could likely be reused).
- **Funnel templates** — needs a `funnel_templates` table (name, category,
  description, ordered list of `{ pageTemplateId, stepType }`) and a
  `POST /api/v1/funnel-templates/:id/use` that creates a funnel + funnel_steps
  + the underlying pages in one transaction. Page-level templates already
  built this pass are the building block for it.

### Known gaps for next pass
- **Template library breadth**: 12 templates / 6 categories is a genuine,
  working foundation — not close to "finished." The full brief calls for ~17
  categories × multiple page types each (Legal, Nonprofit, Events, Travel,
  Beauty, Automotive, Coaching, Creative Portfolio, Construction, Crypto/Web3,
  Education still needs a template, etc.), plus more page types per existing
  category (pricing page, about/team, "coming soon," contact/booking form).
  Next pass: pick up where `seedPageTemplates.js` leaves off — it's
  idempotent, so it's safe to just add more entries to the `TEMPLATES` array
  and re-run.
- **Templates in other modules** (Step 1c of the standing prompt) — not
  started at all this pass. Strongest candidates based on what already
  exists: Email Marketing (campaign templates), Invoices (invoice/quote
  templates — Quotations module already has line-item structure to reuse),
  Popup Builder, Forms/Survey Builder, Certificate Generator (already has
  3 built-in visual templates — classic/modern/elegant — but no *content*
  template library), Quiz Builder.
- **In-editor Pexels image swap** — the `/api/v1/images/search` endpoint
  exists and works (proven by the seed script), but no frontend UI calls it
  yet. The block editor's `image` block currently only takes a raw URL field.
  Wiring a "search Pexels" button into that field is a small, high-value next
  step.
- **Full Step 1 surface audit** (visual consistency beyond the earlier
  15-batch pass, feature completeness per module against "premium tool" bar,
  navigation/IA, a real Settings area — general/notifications/privacy/
  appearance/integrations/billing as one coherent place rather than scattered,
  accessibility, performance) was not re-run from scratch this pass — this
  pass focused on the two concrete, well-scoped gaps found (templates,
  account/security) rather than a shallow pass across everything. A full
  fresh Step 1 sweep is the right next move once template breadth work
  plateaus for a session.
- **Sidebar/Topbar "Tile" nested-component pattern** — same risky shape as
  the bug fixed this pass; low priority since it isn't currently causing
  visible symptoms, but worth converting to the same plain-function pattern
  if it ever grows a controlled input.

### What state this is actually in
Two real, previously-nonexistent capabilities were added and verified working
end-to-end in a browser: a genuine (if not yet broad) template library for
page building, and a genuine account-security surface backed by
already-built backend features that had simply never been exposed. Neither is
"done" — the template library needs to be an order of magnitude bigger to
match the brief's Webflow/Framer bar, and Account & Security is missing
password/profile self-serve editing pending new backend endpoints. The
highest-value next pass is almost certainly either (a) expanding template
breadth significantly, since that's explicitly scoped as "never finished," or
(b) building the password-change endpoint + wiring it, since it's the most
conspicuous gap in an otherwise-real Security tab.

---

### Pass 8 — Plan-gating audit (targeted, prompted by user: "lock access where necessary according to users plan")

Turned out the plan-gating system (`backend/src/utils/planAccess.js`'s
`requireModuleAccess`/`requireUsageCapacity`, wired into `app.js` per-route
and into `frontend/components/AppShell.jsx`'s `openModule`/`isModuleLocked`)
was already far more complete than expected — this is not a fresh build,
it's a closeout of a system a prior pass mostly finished. Audited all 97
`modules` DB rows against every backend route file (dispatched to a
sub-agent to cross-reference each slug against `app.js` mounts and internal
`router.use(requireModuleAccess(...))` calls, since that required reading
~130 route files).

**Findings:**
- 90+ of 97 modules are correctly gated, either via `app.js`
  (`requireModuleAccess('<slug>')` on the route mount) or internally in the
  route file (email.js, appointments.js, pages.js, portal.js). crm,
  lead-generation, invoices are correctly free-tier (invoices/crm additionally
  cap via `requireUsageCapacity` on contacts/invoices counts; team.js caps
  users the same way).
- Frontend lock UX (`isModuleLocked` + upgrade-prompt modal in `openModule`,
  AppShell.jsx:5761-5778) was already solid — blocks navigation into any
  module the `/api/v1/modules` response marks `locked`, shows a real upgrade
  CTA, not a dead click.
- Modules with no dedicated backend route (graphic-design-editor, logo-maker,
  flyer-builder, resume-builder, image-compression, background-removal,
  basic-video-editor, image-converter, file-converter, password-generator,
  json-formatter) are pure client-side tools — nothing to bypass via direct
  API call, so no backend gate is meaningful for them; frontend lock is the
  only enforcement point and that's already correct.
- **One real gap found and fixed**: `business-dashboard` (served by
  `backend/src/routes/analytics.js` → `overview`/`activity`/`modules/usage`)
  had zero plan gating — any authenticated user on any plan, including Free,
  could hit it directly via `curl` even though the pricing page explicitly
  markets "Analytics" as a Growth-plan-and-up feature and the module list
  correctly marks it `locked` for Free/Starter in the UI. Fixed by adding
  `requireModuleAccess('business-dashboard')` to the three dashboard-data
  routes only — deliberately left `POST /track` ungated, since
  `openModule()` fires that endpoint unconditionally on *every* module open
  regardless of plan (it's the app's own usage-instrumentation, not a paid
  feature), and gating it would have silently broken analytics collection
  for Free/Starter orgs.

**Verified:** `node -e "require('./src/app.js')"` loads clean, PM2 restarted
the API process without errors, confirmed `/api/v1/analytics/overview`
still 401s pre-auth as expected (same as every other gated route). Did not
create a live Free-tier test account to hit the route post-auth and confirm
the 403 — the fix is the identical one-line pattern already proven working
on 90+ other routes (`hr`, `expenses`, `accounting`, etc.), so this was
judged low-risk, but a next pass (or the user) should do one real click-test:
log in as a Free-tier org, try the Business Dashboard / Analytics tile,
confirm the upgrade prompt shows and a direct `curl` to
`/api/v1/analytics/overview` with that org's cookie returns 403.

**Not done / lower priority, noted for completeness, not urgent:**
- ai-email-assistant, ai-proposal-generator, ai-blog-generator are three
  separate module rows in the DB but share one backend router
  (`/api/v1/ai-documents`, gated as `'ai-writer'`). Security-wise this is
  fine (Free users are already blocked from all of them), but the 403
  error message a Free user sees always says "ai-writer" regardless of
  which of the three they clicked. Cosmetic, not a security gap — skipped
  this pass in favor of the one real gap.
- Did not re-run the full Step 1 surface sweep; this pass was intentionally
  narrow and finished the one system the user pointed at.

---

### Pass 9 — Step 1o (module page standardization): a real ~60-module layout bug found and fixed, not just cosmetic drift

The v8 standing prompt added Step 1o, calling out CRM as the reference layout
and explicitly naming Popup Builder and AI Writer as modules missing pieces
CRM has (breadcrumb, description line, stat cards, search/filter). Triage:
this is a Tier 2 item (works but thinner than the reference), so it became
the pass's main focus, prioritizing the two modules the brief named.

**Built:** `frontend/components/ui/ModulePage.jsx` — a shared wrapper
matching CRM's exact structure (a real "← Workspace"-style back-link,
title + one-line description, primary action top-right, a `stats` row using
the existing `StatCard` component, an optional `toolbar` slot, then
children). Supports nested sub-pages via `back={{label, onClick}}` scoped to
each nesting level (e.g. a document-detail view points back to "AI Writer",
not "Workspace") rather than a crumbs array, matching the existing
single-level `back-link` convention instead of inventing a new one.

**Retrofitted onto it:** Popup Builder and all four AI Documents modules
(AI Writer / AI Email Assistant / AI Proposal Generator / AI Blog Generator,
which share one component keyed by doc type). Added what was missing:
real breadcrumbs (previously "← Back" going to `setView('home')` directly,
bypassing `goHome()`'s state reset), one-line descriptions, a working search
box over each list (neither had any way to filter once records pile up —
added `pbQuery`/`aiDocQuery` state, wired into `SearchInput`), and swapped
raw inline-styled empty-states for the real `EmptyState` component (icon +
message + CTA) including a distinct "no search results" state, and swapped
hand-rolled `stat-value`/`stat-label` divs (which had the DOM order
backwards — value before label — visually inverted vs. every other module's
`StatCard`) for real `StatCard` usage.

**Verified in a live browser, not just build-checked.** Signed up a fresh
test account via Playwright (headless Chromium, browsers already cached at
`~/.cache/ms-playwright`), hit the (correctly-working, confirmed from Pass 8)
Free-tier upgrade gate on both modules, upgraded that one test org directly
in the DB to Business plan to get past it, then drove the real UI: created 3
popups, confirmed the search box filters them live and shows a distinct
"No matching popups" empty state; created an AI Writer document, confirmed
search-by-title works, confirmed opening a document shows "← AI Writer" (not
"← Workspace") proving the nested-breadcrumb design actually works. No
console errors. Test account and its org were deleted afterward.

**Found something bigger while verifying — this is the real finding of the
pass.** The first verification screenshots showed both retrofitted modules
rendering ~500-700px lower than they should, as if scrolled. It wasn't a
scroll bug (added a `scrollMainToTop()` call on every `goHome`/
`openCategory`/`openModule` regardless, since resetting scroll position on
navigation is correct either way — but it didn't fix the symptom). Direct
DOM inspection (`element.getBoundingClientRect()` + `main.contains(panel)`)
found the actual cause: `frontend/components/AppShell.jsx` had two stray
`</div>` tags at (the then-)lines 8182–8183, right after the Invoices
module's block, that closed `.main` and `.app-shell` two whole modules too
early — Invoices was apparently the last module in the list at some earlier
point in this file's history, and every module added after it in later
batches (Website Builder onward — roughly 60 of the app's 97 modules,
including Website Builder, Funnel Builder, HR, all of Marketing Automation
through Quiz Builder, Popup Builder, every AI module, all of SEO, all of
Creative, LMS/School/CBT, Store Builder — essentially everything past
"Batch 3") has been rendering as a sibling *after* the app shell closes,
not inside `.main`, for an unknown number of prior passes. Confirmed via a
binary-search script across ~50 modules before and after the fix (bisecting
by testing `main.contains(panel)` for each) — before: false for every module
from Website Builder onward; after: true for all of them, `panelRect.top`
correctly at 64 (right under the topbar) instead of 720+ (below the fold).
Fix: moved the two closing tags from right after Invoices to their correct
place — immediately after the `upgradePrompt` Modal and `Toast` at the true
end of the module list, right before the pre-existing final `</div>` that
closes the component's root wrapper.

**Why this matters more than it sounds:** this fully explains why "some
modules feel structurally worse than CRM" was the standing prompt's own
framing in Step 1o — it wasn't (only) that individual modules were built
without stat cards or search boxes, it's that roughly two-thirds of the app
has been rendering in the wrong part of the DOM tree, which likely also
explains layout/overflow oddities in unrelated earlier passes that got
attributed to individual modules rather than this one shared structural
cause. This is exactly the kind of bug Step 0's "never trust a past pass's
summary" instinct exists for — no prior log entry mentioned it because it's
invisible unless you inspect actual rendered DOM position, not just "does
the module load and show data."

**Verified the fix doesn't regress anything:** re-ran the full binary-search
sweep after the fix — all ~50 tested modules (Landing Page Builder through
Quiz Builder, plus CRM, AI Chatbot Builder, AI Meeting Notes, Popup Builder,
AI Writer individually) now report `isInsideMain: true` with `panelTop: 64`.
`next build` clean both before and after. PM2 restarted cleanly.

**Decisions made:**
- Fixed the ~60-module structural bug as part of this pass rather than just
  noting it, since it directly undermines the very thing Step 1o asks for
  (every module matching CRM's structure) and would have made the
  ModulePage retrofit itself look broken to any real user.
- Did not retrofit every remaining module onto `ModulePage` this pass — only
  the two the brief explicitly named as the worst offenders. The component
  and pattern now exist and are proven; the mechanical work of moving each
  remaining module (~90 of them) onto it is real but repetitive, and is the
  natural target for dedicated future passes.
- Did not investigate whether the stray-`</div>` bug has a sibling instance
  elsewhere in the file (e.g. inside one of the 90+ module blocks
  themselves, not just at the main/app-shell boundary) — the binary-search
  verification only checked "is this module's root element inside `.main`,"
  not deeper internal nesting correctness within each module's own markup.

**Conformance checklist (Step 1o), current state:**
- Fully conformant (breadcrumb + description + stats + search/filter +
  real empty states, via `ModulePage` or equivalent hand-built structure):
  CRM, Popup Builder, AI Writer, AI Email Assistant, AI Proposal Generator,
  AI Blog Generator.
- Structurally correct (renders inside `.main`, in the right place) but not
  yet retrofitted onto `ModulePage`/missing search-filter or stat-card
  polish: all other ~90 modules — this is now purely a design-system
  polish backlog, not a broken-rendering problem.

**Suggested priority for next pass:** pick the next batch of modules for
the `ModulePage` retrofit (Task Management, Forms, and Help Desk are good
next candidates — all have real lists that would benefit from search), and/or
do a targeted audit for whether any *other* module block in this file has
its own internal mis-nesting (this pass only verified the outer
main/app-shell boundary, not nesting inside individual module bodies).

---

### Pass 10 — Step 1o retrofit batch 2, plus a Tier 1 fix that turned into real new depth (Forms conditional logic)

**Re-audit first, per Step 0.** Dispatched a background agent to statically
check for other main/app-shell-style nesting bugs beyond the one fixed in
Pass 9 (indentation-depth scan across all ~97 module blocks, hunt for stray
consecutive `</div>` pairs, check internal tab/sub-view nesting in modules
like Recruitment and Accounting). Result: none found — the Pass 9 fix was
complete, the file's structure is otherwise sound. Confirmed live in-browser
too (see Verified, below).

**Retrofitted 5 more modules onto `ModulePage`** (Task Management, Forms,
Help Desk, SMS Marketing, Calendar), following the exact pattern from Pass 9:
real breadcrumb, description line, stat cards via the `StatCard` component,
a working search box, `EmptyState` for both "no records" and "no search
results." Help Desk and Forms have nested sub-pages (ticket detail, form
responses) — each renders its own `ModulePage` with `back` pointing to the
parent module name, not "Workspace," matching the multi-level breadcrumb
pattern proven in Pass 9's AI Writer retrofit.

**Two real dead-click bugs found and fixed while retrofitting, not
cosmetic.** Both are the same failure shape: a `handleDelete*` function sets
a confirm-dialog state variable, but the `<ConfirmDialog>` that's supposed to
read it either didn't exist or read a *different* variable, so clicking
"Delete" did nothing at all with no error and no feedback — the kind of bug
that's invisible in code review (the handler function looks correct in
isolation) and only shows up when you actually click the button:
- **Forms module** (`frontend/components/AppShell.jsx`): the delete-form
  button called `handleDeleteFbForm` → set `fbFormConfirmDelete`, but the
  rendered `<ConfirmDialog>` at the bottom of the block was wired to
  `tmConfirmDelete`/`confirmTmDelete`/`tmDeleting` — Task Management's
  state, not Forms'. Every "Delete" click on a form silently did nothing.
- **Task Management**: `handleDeleteTmTask` correctly set `tmConfirmDelete`,
  but there was no `<ConfirmDialog>` anywhere in Task Management's own block
  reading it at all — the only place that variable was ever rendered was the
  Forms module's *miswired* dialog above. Fixed by giving Task Management
  its own correctly-wired `<ConfirmDialog>`.
Both are fixed now and verified end-to-end in a live browser (see below) —
clicking Delete on a form and on a task both now show a real confirmation
dialog and actually delete on confirm.

**Bigger finding while investigating the Forms bug: the "Forms & Surveys"
module could never actually collect a response from anyone.** Auditing
`backend/src/routes/forms.js` while fixing the delete-dialog bug turned up
that the entire router was `requireAuth`-gated with zero public routes —
unlike the "Lead Generation" module (a separate, older system) which has a
working public fill-and-submit page, "Forms & Surveys" had a builder with no
way for an actual visitor to ever see or submit the form. `form_responses`
had a table and a `listResponses` endpoint to view results that could never
have any rows. This is a Tier 1 "doesn't work end-to-end" bug, not a design
gap. Fixed:
- `backend/src/controllers/formsController.js`: added `getPublicForm` and
  `submitPublicResponse`, mirroring the Lead Generation pattern (public
  GET for form config, rate-limited public POST for submission, required-
  field validation server-side).
- `backend/src/routes/forms.js` + `backend/src/app.js`: moved the module's
  `requireAuth`/`requireModuleAccess('forms')` gate from the app.js mount
  into the router itself (matching how `leads.js` does it), so the two new
  public routes aren't blocked by the same gate that protects the builder.
- `frontend/app/forms/[formId]/page.jsx`: new public fill/submit page,
  modeled on `app/leads/[formId]/page.jsx`.
- **`frontend/middleware.js` — a second bug in my own new code, caught by
  verification, not by review**: the new public form page redirected
  anonymous visitors straight to `/login`, because the middleware's
  public-route allowlist didn't know about `/forms/*`. This would have made
  the entire feature completely unreachable for real visitors — a signed-out
  person clicking a form link would just get bounced to a login screen for
  a form that isn't theirs to log into. Only caught because verification
  used a real separate anonymous browser context (no session cookie) instead
  of testing everything from one already-logged-in session, which would
  have hidden this completely. Fixed by adding `/forms/` to the allowlist.

**Built Step 1p's forms conditional logic while fixing the above** — since
the module needed real depth added anyway. A field can now be configured
`showIf: { fieldId, operator: 'equals'|'not_equals', value }`; the field
picker only offers *earlier* fields in the list (so a condition can't
reference a field defined after it). Evaluated identically in three places
so it can't be bypassed or drift out of sync: live in the builder's field
list (shows "shown if X = Y" as a badge), live on the public form as the
visitor types (`frontend/app/forms/[formId]/page.jsx`), and again
server-side on submit (`isFieldVisible()` in `formsController.js`) so a
required-but-hidden field can't be forged as missing by someone hitting the
API directly. Also fixed a latent bug in the (previously-dead) responses
table: it looked up answers by `field.label` but the data is genuinely keyed
by `field.id` — would have shown blank/`—` for every column even once
responses existed.

**Fourth build this pass: SMS bulk CSV import**, explicitly named as a gap
in the standing prompt's Step 1n ("not just single-number send"). Added
`bulkCreateContacts` to `backend/src/controllers/smsController.js` (dedupes
against existing contacts by phone within the org and against duplicates
within the same upload, caps at 2000 rows/request, reports
imported/duplicate/invalid counts back) and a paste-or-upload CSV import
modal in the SMS Marketing module.

**Verified everything in a live browser** (Playwright, headless Chromium,
fresh signup account upgraded to Business plan in the DB for testing paid
modules — same approach as Pass 9): Forms module breadcrumb/description/
search all correct; created a form with a real conditional field
("Attending?" Yes/No → "Guest name" shown only if Yes) and drove the
*actual public page in a separate anonymous browser context with no session
cookie* — confirmed the field appears/disappears live as the radio changes,
confirmed submission succeeds, confirmed the response shows up correctly in
the (now-fixed) responses table with real data in the right columns.
Confirmed both dead-click bugs are fixed (Delete on a form and a task both
now open a real dialog). Confirmed Help Desk's nested ticket-detail
breadcrumb reads "← Help Desk" not "← Workspace." Confirmed SMS CSV import
via the actual modal ("Imported 2 contacts"). Zero console errors across
the whole run except a headless-sandbox clipboard-permission message
unrelated to the app. `next build` clean after every edit; PM2 restarted
both processes cleanly; checked both processes' error logs afterward and
confirmed the only entries were stale (dated before this session) or
pre-existing and unrelated to anything touched this pass (see below).

**Spotted, not fixed — out of scope for this pass:**
- `backend/src/controllers/performanceReportsController.js:6`
  (`getKpiSnapshot`) throws `invalid input value for enum contact_stage:
  "Won"` — looks like a case-sensitivity mismatch between whatever calls
  this (capitalized "Won") and the CRM's actual lowercase `contact_stage`
  enum values (`new`/`contacted`/`proposal_sent`/`won`/`lost`). Confirmed
  via log timestamp this predates this session's changes and isn't
  something this pass touched — flagging for a future pass since it means
  Performance Reports' KPI snapshot is currently broken for any org with
  CRM data.

**Conformance checklist (Step 1o), current state:**
- Fully conformant: CRM, Popup Builder, AI Writer, AI Email Assistant, AI
  Proposal Generator, AI Blog Generator, Task Management, Forms &
  Surveys/Survey Builder, Help Desk, SMS Marketing, Calendar (11 of 97).
- Structurally correct, not yet retrofitted: remaining ~86 modules.

**Suggested priority for next pass:** fix the Performance Reports enum bug
(quick, real, currently broken for any org with CRM data); continue the
`ModulePage` retrofit batch by batch — Inventory, POS, and Quotations are
good next candidates since they're all real record-list modules; consider
whether Email Marketing (a Tier-1-adjacent module given how central it is)
deserves the same "does it actually work end-to-end" scrutiny that just
found the Forms module's missing public page — worth specifically checking
whether its public-facing pieces (unsubscribe links, tracking pixels) are
real or similarly incomplete.

---

### Pass 11 — Step 1c per-module audit table (new this version of the standing prompt), sample content, 3 more ModulePage retrofits

**Tier 1 fix, already diagnosed last pass:** `performanceReportsController.js` queried
`stage='Won'` against the `contact_stage` enum, which only has lowercase
values (`new`/`contacted`/`proposal_sent`/`won`/`lost`) — every KPI snapshot
request threw a DB error. One-line fix, verified against the live enum
range. Restarted the API, confirmed clean.

**Built the Step 1c audit table** this version of the standing prompt now
requires — a per-module row for sample content / layout conformance /
feature completeness. Given the scale (97 modules), dispatched 4 parallel
research agents grouped by category to do a fast static triage (read the
module's JSX block + backend controller/routes, not a live click-through).

**Important methodology note — verify agent claims before trusting them.**
Spot-checking the results caught two real errors:
1. One agent marked `referral-program` and `quiz-builder` as layout-conformant
   ("Y") when neither uses `ModulePage` at all — confirmed by grep, both are
   still on the old `module-area`/`module-wrap` pattern. Likely confusion
   from adjacent modules that *are* conformant.
2. A second agent marked all 7 education modules (`learning-management-system`,
   `school-management`, `cbt-platform`, `assignments`, `student-portal`,
   `teacher-portal`, `parent-portal`) as having "no backend controller" and
   therefore not feature-complete. This was a research-method error, not a
   real finding: this codebase has two backend patterns — a separate
   `controllers/*Controller.js` file (most modules), or DB logic written
   directly inline in the `routes/*.js` file (a handful of modules,
   including these). The agent only searched for `*Controller.js` files and
   concluded "no backend" when it didn't find one. Manually confirmed
   `backend/src/routes/lms.js` and `routes/school.js` have full real CRUD
   (100+ lines each, real SQL, real INSERT/UPDATE/DELETE) and the frontend
   genuinely calls them (`apiFetch('/api/v1/lms/courses')` etc., confirmed
   via grep in `AppShell.jsx`). Corrected in the table below.

Given this, treat the **Feature-Complete** column below as a fast triage,
not a certified audit — real for the modules I personally spot-checked
(noted), reasonable-effort for the rest, but a future pass re-verifying via
actual browser clicks (not static reading) would find more corrections like
the two above.

**The one column I did NOT delegate — Layout** — is ground truth, not
agent-reported: I know exactly which 15 modules use `ModulePage` because
I've personally written every one of them across Pass 9–11: `crm`,
`popup-builder`, `ai-writer`, `ai-email-assistant`, `ai-proposal-generator`,
`ai-blog-generator`, `sms-marketing`, `forms`/`survey-builder` (shared
block), `task-management`, `help-desk`, `calendar`, and — new this pass —
`inventory`, `pos`, `quotations`. Every other module below is "N" regardless
of what an agent reported.

**Built this pass: `inventory`, `pos`, `quotations` retrofitted onto
`ModulePage`.** All three were already reasonably well-built (real
stat-grids, tabs, `EmptyState` with icons, working `ConfirmDialog`s — no
dead-click bugs found in these three, unlike Pass 10's Forms/Task Management
discoveries) but had **zero way to navigate back to Workspace** — no
back-link, no breadcrumb, nothing, only the sidebar. Added the real
breadcrumb + description + consistent stat-card/search treatment via
`ModulePage`, preserving all existing functionality (POS's register/cart/
sessions tabs, Inventory's products/categories/stock-movements tabs,
Quotations' status filter) and adding a search box to Quotations (client
name / quote number) where none existed before.

**Built this pass: real starter sample content for 4 modules**, via a new
migration (`backend/db/065_starter_sample_content.sql`) — a
`seed_starter_content(org_id)` function + `trg_org_starter_content` trigger
on `organizations` INSERT, mirroring the existing `auto_create_subscription`
trigger pattern from `008_subscriptions.sql`. Seeds, for every *new* org
going forward:
- **CRM**: 5 realistic contacts spanning every pipeline stage (new →
  contacted → proposal sent → won → lost), real Nigerian names/companies/
  emails/phone numbers, realistic deal values.
- **Invoices**: 1 client + 2 invoices (one paid with tax calculated
  correctly, one draft) with real line items.
- **Task Management**: 5 tasks spread across all 4 board columns (todo,
  in progress, review, done), with realistic titles tied to the other seeded
  data (e.g. "Follow up with Tunde Bakare on proposal").
- **Email Marketing**: 1 subscriber list, 3 subscribers (reusing the same
  seeded CRM contacts' emails so the data feels like one coherent business,
  not 4 disconnected demo datasets), 1 draft welcome campaign.
Deliberately **not backfilled onto existing orgs** — this seeds new signups
only, so real customer accounts (e.g. the `digitpen3@gmail.com` / "Pamcet
Academy" account mentioned in earlier passes) never get fake data injected
into them after the fact. Verified the trigger in a rolled-back transaction
first (confirmed exact row counts, then `ROLLBACK` — no data left behind),
then verified for real via a live signup in a browser: CRM showed all 5
contacts with correct stages/values, Invoices showed the client and both
invoices with a live "₦677,250 value in invoices" billing summary.

**A real bug caught during verification, not introduced by this pass's
edits — a stale-deploy issue.** The first live-browser verification attempt
crashed on a fresh signup with `Application error: a client-side exception
has occurred` / `ChunkLoadError: Loading chunk 931 failed` / minified React
error #423. Root cause: I'd run `next build` after the Inventory/POS/
Quotations edits but hadn't restarted the PM2 web process afterward — the
running Next.js server was still serving HTML from the *previous* build
while referencing chunk files the *new* `.next` directory no longer had
under those hashes. Restarted `digitpenhub-suite-web`, re-ran the exact same
verification, everything passed clean. **Lesson for future passes:** always
restart PM2 after the *final* build in a batch of edits, not just after
each individual build — verification must happen against the same build
that's actually being served, and a build succeeding is not the same as the
running process serving it.

**Step 1c audit table.** `Layout` is ground truth (see above). `Sample
Content` reflects this pass's new seeding (4 modules) plus what agents found
pre-existing. `Feature-Complete` is agent-reported and spot-check-corrected
where noted — treat as directional, not certified.

**Marketing (20 modules)**

| Module | Sample Content | Layout | Feature-Complete | Note |
|---|---|---|---|---|
| crm | Y (seeded) | Y | Y | |
| lead-generation | N | N | Y | Forms+leads+pipeline work |
| landing-page-builder | N | N | Y | Full page editor, CRUD works |
| website-builder | N | N | Y | Full page editor, CRUD works |
| funnel-builder | N | N | Y | List+create+edit complete |
| email-marketing | Y (seeded) | N | Y | Lists+campaigns CRUD works |
| sms-marketing | N | Y | Y | Campaigns+contacts+CSV import |
| whatsapp-marketing | N | N | Y | Workflows+messages CRUD works |
| marketing-automation | N | N | Y | Workflows CRUD works |
| affiliate-system | N | N | Y | Create+list+edit works |
| referral-program | N | N | Y | Referrals+rewards work (layout corrected from agent's Y) |
| appointment-booking | N | N | Y | Bookings+stats work |
| forms | N | Y | Y | Public page + conditional logic (Pass 10) |
| popup-builder | N | Y | Y | |
| survey-builder | N | Y | Y | Shares Forms' block/backend |
| quiz-builder | N | N | Y | Quizzes+results work (layout corrected from agent's Y) |
| url-shortener | N | N | Y | Create+list+edit work |
| qr-code-generator | N | N | Y | Create+list+edit work |
| link-in-bio | N | N | Partial | Create/edit thinner than others |
| digital-business-cards | N | N | Y | Create+list+edit work |

**AI (9 modules)**

| Module | Sample Content | Layout | Feature-Complete | Note |
|---|---|---|---|---|
| ai-writer | N | Y | Y | |
| ai-chatbot-builder | N | N | Y | Create+list+edit work |
| ai-email-assistant | N | Y | Y | |
| ai-proposal-generator | N | Y | Y | |
| ai-blog-generator | N | Y | Y | |
| ai-translator | N | N | Partial | No update/delete on translations |
| ai-meeting-notes | N | N | Y | Create+list+edit work |
| ai-knowledge-base | N | N | Y | Create+list+edit work |
| ai-customer-support | N | N | Y | Create+list+edit work |

**SEO (8 modules) — mostly client-side tools, no backend persistence by design**

| Module | Sample Content | Layout | Feature-Complete | Note |
|---|---|---|---|---|
| keyword-research | N | N | Y | Client-side, real API calls |
| rank-tracking | N | N | Y | Real API-backed, no seed |
| seo-audit | N | N | Y | Creates real audits via API |
| backlink-monitoring | N | N | Y | Functional, no seed |
| schema-generator | N | N | Y | Client-side JSON-LD generator |
| meta-generator | N | N | Y | Client-side, copy/download |
| sitemap-generator | N | N | Y | Client-side URL builder |
| robots-generator | N | N | Y | Client-side, preview+download |

**Creative (9 modules)**

| Module | Sample Content | Layout | Feature-Complete | Note |
|---|---|---|---|---|
| graphic-design-editor | N | N | Partial | Canvas editor works, export varies |
| brand-kit | N | N | Y | Full CRUD via API |
| logo-maker | N | N | Y | Client-side, SVG export |
| flyer-builder | N | N | Y | 3 templates, print/PDF export |
| certificate-generator | N | N | Y | Full CRUD, print+email ready |
| resume-builder | N | N | Y | Client-side, PDF export |
| image-compression | N | N | Y | Browser canvas compression |
| background-removal | N | N | Y | Client-side, PNG/JPG export |
| basic-video-editor | N | N | Partial | Trim/overlay works, export variable |

**Business (15 modules)**

| Module | Sample Content | Layout | Feature-Complete | Note |
|---|---|---|---|---|
| accounting | N | N | Y | Needs layout retrofit |
| invoices | Y (seeded) | N | Y | Needs layout retrofit |
| quotations | N | Y | Y | |
| expenses | N | N | Y | Needs layout retrofit |
| payroll | N | N | Partial | Limited CRUD |
| inventory | N | Y | Y | |
| pos | N | Y | Partial | No sale-record editing |
| asset-management | N | N | Y | Needs layout retrofit |
| hr | N | N | Y | Needs layout retrofit |
| recruitment | N | N | Y | Needs layout retrofit |
| project-management | N | N | Y | Needs layout retrofit |
| task-management | Y (seeded) | Y | Y | |
| help-desk | N | Y | Y | |
| knowledge-base | N | N | Y | Needs layout retrofit |
| client-portal | N | N | Partial | Token generation only |

**Education (8 modules) — corrected this pass, see methodology note above**

| Module | Sample Content | Layout | Feature-Complete | Note |
|---|---|---|---|---|
| learning-management-system | N | N | Y | Real inline-route CRUD, confirmed wired to frontend |
| school-management | N | N | Y | Real inline-route CRUD, confirmed wired to frontend |
| cbt-platform | N | N | Y | Real route file (100 lines), confirmed wired |
| assignments | N | N | Y | Real route, confirmed wired (`/api/v1/school-assignments`) |
| student-portal | N | N | Partial | Reuses school-management data, read-heavy |
| teacher-portal | N | N | Partial | Reuses school-management data, read-heavy |
| parent-portal | N | N | Partial | Reuses school-management data, read-heavy |
| certificates | N | N | Y | Needs layout retrofit |

**Commerce (7 modules)**

| Module | Sample Content | Layout | Feature-Complete | Note |
|---|---|---|---|---|
| online-store-builder | N | N | Partial | Multi-tab editor, publish toggle works |
| marketplace | N | N | Y | Full CRUD, active/draft status |
| order-management | N | N | Y | Create/edit/view, status workflow |
| coupons | N | N | Y | Full CRUD with validation |
| subscriptions | Y (pre-existing) | N | Y | Plans+subscribers tabs |
| digital-products | N | N | Y | CRUD with sales tracking |
| delivery-tracking | N | N | Y | Create/track, priority levels |

**Productivity (7 modules)**

| Module | Sample Content | Layout | Feature-Complete | Note |
|---|---|---|---|---|
| calendar | Y (pre-existing) | Y | Y | |
| notes | N | N | Y | Color/tag/pin all work |
| file-manager | N | N | Y | Folder nav, upload, delete work |
| cloud-storage | N | N | Y | Grid/list, folder/file mgmt |
| workflow-automation | N | N | Partial | Trigger-config UX incomplete |
| document-management | N | N | Y | Folders, search, CRUD work |
| time-tracking | N | N | Y | Timer, manual log, projects work |

**Analytics (6 modules)**

| Module | Sample Content | Layout | Feature-Complete | Note |
|---|---|---|---|---|
| business-dashboard | N | N | Y | 30-day chart, real metric cards |
| marketing-dashboard | N | N | Y | Email/SMS/WhatsApp/leads tabs |
| sales-dashboard | N | N | Y | Revenue/products/quotes, 12mo history |
| website-analytics | N | N | Y | Daily activity, module usage |
| performance-reports | N | N | Y | Fixed this pass (enum bug) |
| custom-reports | N | N | Y | Ad-hoc + saved reports |

**Utilities (8 modules) — client-side tools by design, no persistence expected**

| Module | Sample Content | Layout | Feature-Complete | Note |
|---|---|---|---|---|
| pdf-tools | N | N | Y | Merge/split/compress/rotate work |
| image-converter | N | N | Y | Canvas-based, works |
| file-converter | N | N | Y | CSV/JSON/TSV/TXT conversion works |
| barcode-generator | N | N | Y | Create + scan count work |
| password-manager | N | N | Y | Strength meter, categories work |
| password-generator | N | N | Y | Client-side, works |
| json-formatter | N | N | Y | Format/minify work |
| color-palette-generator | N | N | Y | Save/drag/copy hex work |

**Conformance summary:** 15/97 layout-conformant (up from 11 last pass).
4/97 have real seeded sample content (up from 0). ~85/97 report as
feature-complete or partial — the real gap across this whole audit is
**layout conformance and sample content, not raw functionality**. Most
modules already work; they just don't look premium on first open and give
a new user nothing to look at.

**Decisions made:**
- Chose CRM/Invoices/Task Management/Email Marketing as the 4 seeded
  modules over other candidates because they're the highest-traffic
  "business fundamentals" a new user opens first, and seeding them as one
  coherent fictional business (same contact names/emails reused across CRM,
  Invoices, and Email Marketing) reads as a real account, not 4 disconnected
  demo blocks.
- Did not backfill sample content onto existing orgs — a deliberate,
  conservative choice to never write fake data into a real customer's
  account without being asked.
- Did not attempt to fix the `link-in-bio`, `ai-translator`,
  `graphic-design-editor`, `basic-video-editor`, `payroll`, `pos`,
  `client-portal`, `workflow-automation`, or `online-store-builder` partial-
  completeness gaps this pass — flagged in the table for a future pass,
  each would need real investigation before fixing (this pass's time went
  to the table itself, 3 retrofits, and sample content).

**Suggested priority for next pass:** seed sample content for the next tier
of high-visibility modules (Website Builder already has templates, so
Task Management/Email Marketing-adjacent candidates like Calendar events
or Help Desk tickets would round out the "new user sees a working business"
story); continue the `ModulePage` retrofit (accounting, expenses, hr, and
project-management are good next candidates — all Business-category,
already confirmed feature-complete, just need the layout treatment); re-verify
the `Partial` feature-completeness rows via actual browser clicks rather
than static reading, since this pass's agent-assisted table caught two
real research errors that only surfaced through spot-checking.

---

### Pass 12 — 4 more ModulePage retrofits, 2 more seeded modules, and Workflow Automation's real gap: it didn't actually run anything

**Retrofitted Accounting, Expenses, HR, and Project Management onto
`ModulePage`** (16/97 now conformant, up from 15). All four were already
feature-rich (Accounting: ledger/P&L/balance sheet/chart of accounts;
Expenses: expenses/categories/summary/budget; HR: staff/departments/leave/
payroll) but had **zero way back to Workspace** — same gap as Inventory/POS/
Quotations last pass, just not caught yet. Project Management was a
partial exception — it already had a hand-rolled breadcrumb, description,
and search (from an earlier pass, before `ModulePage` existed), just no
stat cards; converted it to the real component for consistency and added
a stats row (project/todo/in-progress/done counts).

**Found and merged a small pre-existing code smell while retrofitting
Expenses**: two separate JSX blocks both gated on `activeModuleSlug ===
'expenses'` — the main content, and a second orphaned block ~300 lines later
containing only two `ConfirmDialog`s. Not a visible bug (both render
correctly as siblings; a fixed-position dialog doesn't care where in the DOM
tree it sits), but confusing to maintain and a smell worth cleaning up while
already touching the file. Merged into one block.

**Seeded sample content for 2 more modules** (Calendar, Help Desk), via a
second migration (`066_more_starter_content.sql`) that redefines
`seed_starter_content()` from last pass with two more sections — same
function, not a second trigger, so there's one source of truth for "what a
new org gets." Calendar gets 3 realistic events (a call tied to the seeded
CRM contact, a team sync, an all-day invoice-due reminder) spanning both
timed and all-day events. Help Desk gets 3 tickets across open/pending/
resolved status, reusing the seeded CRM contacts as requesters so the whole
account still reads as one coherent fictional business. Verified via the
same rolled-back-transaction method as last pass, then live in a browser
(Calendar stats showed 3/3/1 exactly as seeded; Help Desk showed 3 ticket
rows).

**The real work this pass: Workflow Automation didn't actually do
anything.** Investigating the `Partial` rows from last pass's table led
here — `ai-translator` and `client-portal`'s "Partial" markings turned out
to be inaccurate on inspection (translator has a working delete, just no
"edit" which doesn't make sense for a translation history log; client
portal is deliberately read-only/link-generation by design, matching its
one job) — but `workflow-automation`'s was real, and much bigger than "UX
incomplete" suggested:
- The `/run` endpoint (`backend/src/routes/workflowAutomation.js`) never
  executed a single real action for any step type. It looped over the
  configured steps, waited a random 120–320ms per step, and returned
  `{ ok: true }` (or a random true/false for `condition` steps) regardless
  of what was actually configured. A "Send Email" step never sent an email.
  An "HTTP Request" step never made a request. This directly undermines
  Step 1k's explicit ask for "a real visual automation builder," and would
  have been an unpleasant surprise for the first real user who built a
  workflow expecting it to do what it says.
- Compounding it: the run result **was captured into state
  (`wfRunLog`) and then never rendered anywhere.** Clicking "▶ Run" showed
  a generic "Workflow completed!" toast and nothing else — even a user who
  somehow suspected the execution was fake had no way to see per-step
  detail to confirm it.
- 5 of the 8 step types (`send_sms`, `condition`, `create_task`,
  `update_crm`, `send_notification`) had no configuration UI at all beyond
  a name field — there was no way to specify a phone number, a task title,
  or which CRM contact/stage to update, even before getting to whether
  execution was real.

**Fixed all three, honestly.** Added a real `executeStep()` function that
dispatches to genuine integrations where the platform actually has one:
`send_email` calls the real `sendMail()` utility (same Postfix/DKIM
transport used elsewhere); `send_notification` calls the real `notify()`
utility, which inserts an actual row into `notifications` for org admins;
`http_request` makes a real request via the existing `fetchWithTimeout`
utility (10s timeout, matching the AI-reliability pattern from Step 1g);
`create_task` inserts a real row into `task_items`; `update_crm` updates a
real contact's `stage` in `contacts`. **`send_sms` and `condition` are left
honestly simulated, not silently faked as if they were real** — `send_sms`
because no SMS provider is configured anywhere in this codebase yet (this
is a pre-existing, separate gap: the SMS Marketing module's own "Send
Campaign" button is *also* fully simulated — see Blocked section below);
`condition` because a manual "Run Now" has no real trigger payload to branch
on — real conditional branching only makes sense once a workflow fires from
an actual live trigger event with data attached, which doesn't exist yet.
The run-log UI now shows a distinct "Simulated" badge (amber) vs "OK"
(green) vs "Failed" (red) per step, so this honesty is visible to the user,
not just in the code.

Added the missing config UI for all 5 previously-bare step types (phone+
message for SMS, a description field for condition with an explanatory
note, a title field for create-task, a contact-picker + stage-picker for
update-CRM reusing the same `contacts` data CRM uses, a message field for
notifications), plus subject/body fields for send_email (previously only
had a "to" field) and a method selector for HTTP requests (previously
POST-only, no way to choose).

**Built the run-log modal** that was captured but never shown — one entry
per step with name, OK/Simulated/Failed badge, and the real (or honestly-
simulated) result note.

**Verified end-to-end in a live browser**, not just build-checked: created
a workflow with a real "Send Notification" step, saved it, clicked Run, and
confirmed the run-log modal showed "1. send notification — OK — In-app
notification created for org admins." Then queried the database directly
and confirmed a real row now exists in `notifications` with the exact
message text typed into the step config — proof this is genuinely wired
end-to-end, not just a nicer-looking simulation. `next build` clean, backend
`require()` sanity check clean, both PM2 processes restarted and confirmed
online before testing.

**Decisions made:**
- Chose to fix Workflow Automation's real-execution gap over doing more
  ModulePage retrofits, once discovered, because it's a Tier 1-adjacent
  trust issue (a feature that silently doesn't do what it visibly claims to
  do) rather than a Tier 2 polish item — closer to the Forms-module public-
  page gap from two passes ago than to a missing breadcrumb.
- Left `send_sms` and `condition` simulated rather than building a fake-but-
  more-convincing version of either — being honest about what's real in the
  UI (the "Simulated" badge) was judged better than quietly expanding the
  scope of what's faked.
- Did not attempt to fix the pre-existing, separate finding that SMS
  Marketing's own campaign-send is also fully simulated (`sendCampaign` in
  `smsController.js` just flips `status='sent'` with no provider call) —
  flagged in Blocked below since it needs a real decision (which SMS
  provider) more than it needs code.

**Blocked — needs credentials:**
- **SMS sending has no real provider anywhere in this codebase.** Both the
  SMS Marketing module's campaign send and Workflow Automation's `send_sms`
  step are simulated because there is no Termii/Twilio/Africa's Talking (or
  similar) integration wired up at all — not even a stubbed env var. This
  is worth a deliberate choice, not a silent fix: pick a provider, add its
  API key to `.env`, and both places can be made real in the same pass.
  Noted in `NEXT_STEPS_FOR_YOU.md`.

**Step 1c conformance update:** 16/97 layout-conformant (+4 this pass:
accounting, expenses, hr, project-management/pm). 6/97 have real seeded
sample content (+2 this pass: calendar, help-desk). `workflow-automation`'s
Feature-Complete status upgraded from the implicit "Y" it had (never
actually audited for *real* execution, only for whether the UI had CRUD)
to a more honest "Partial — real execution for 6/8 step types, 2 honestly
simulated pending an SMS provider and a live-trigger system."

**Suggested priority for next pass:** pick an SMS provider and wire up real
sending for both SMS Marketing campaigns and the workflow `send_sms` step
in the same pass, now that the fake-vs-real distinction is clear; continue
the `ModulePage` retrofit (recruitment, asset-management, and
knowledge-base are good next candidates — same Business category, likely
same "feature-rich but no breadcrumb" shape as this batch); consider
whether other modules have the same "looks feature-complete but the core
action is simulated" issue Workflow Automation had — Marketing Automation
and Appointment Booking's reminder-sending are worth the same scrutiny.

---

### Pass 13 — Admin editorial CMS, scoped admin roles + audit trail, a real guided white-label flow, mobile nav bug, and a copy accuracy fix

This pass covered five separate asks in one go (content rewrite, mobile,
bug-fixing, admin editorial/access-control, white-label guided activation).
Given the size, prioritized the two systems explicitly named as wanted in
full ("I want my admin panel to have full editorial and all access control...
the whitelabel section and the process...") over a broad shallow pass on
everything else, consistent with the standing prompt's own tiering guidance.

**Built: a real content-management system, not hardcoded strings.**
New `site_content` table (migration `067_admin_editorial_and_whitelabel.sql`)
— key/value content blocks with a label, section, and type, editable from
the admin panel and rendered live on the public marketing homepage. Seeded
with genuinely rewritten hero/value copy (see Copy fixes below) as both the
initial DB values and the component's fallback strings, so a fetch failure
never regresses below the previous copy quality. New public, no-auth
endpoint `GET /api/v1/content/public` (scoped to explicit public sections
only, not the whole table) that `MarketingHome.jsx` now fetches from
client-side. **Verified the full loop live, not just built**: edited the
hero title in the admin panel, confirmed a real `content.update` row landed
in `audit_log`, then loaded the public homepage in a *separate browser
context* and confirmed the edited text rendered — proof this is a genuine
CMS pipeline, not a UI that writes somewhere nothing reads from.

**Built: scoped admin roles, not just one all-or-nothing super-admin flag.**
Added `users.is_content_admin` alongside the existing `is_super_admin`.
A content-editor admin can reach `/admin` and edit `site_content` only —
every other admin route (orgs, users, plans, payments, admin-role
management itself) stays behind `is_super_admin` alone, enforced via a new
`requireAnyAdmin` middleware (`superAdmin.js`) used only on the content
routes, leaving `requireSuperAdmin` guarding everything else. The admin
frontend (`app/admin/page.jsx`) now checks both flags on load and shows
only the "Content" tab to a content-only admin — they land straight on it
rather than being redirected away or seeing tabs that 403 when clicked.
Super admins get 3 new tabs: **Content**, **Admins** (search a user by
email, grant/revoke content-editor or super-admin access, see the current
admin roster), and **Audit Log** (the last 150 admin actions, who did them,
when).

**Built: a real audit trail, not just a table that existed but nothing
wrote to.** Found that `audit_log` already existed (used by auth actions)
but no admin mutation had ever written to it. Added `logAdminAction()` to
`adminController.js` and wired it into every existing mutating admin
action that didn't already have it — org suspend/unsuspend, subscription
override, user role change, user delete, plan create/update — plus the
three new content/admin-role actions. Verified live: the Audit Log tab
showed the `content.update` entry from the CMS test immediately after
making it.

**Built: white-label as a real guided flow, not scattered settings.**
New `org_branding` table (one row per org: logo, favicon, colors, display
name, custom domain + verification state, sender identity, activation
state) and `backend/src/controllers/whiteLabelController.js` /
`routes/whiteLabel.js`, gated to the Business plan (an autonomous product
decision — white-labeling the whole suite is the clearest "agency reselling
this platform" use case, matching how the pricing page already positions
Business as the agency tier). New "White Label" section in
Account/Settings (a persistent sidebar nav item, matching Account &
Security / Billing & Plans) implementing the exact 6-stage flow asked for:
eligibility → domain → branding → sender identity → preview → activate —
each stage with a real, computed status (done/pending/not_started/blocked/
locked) shown in a stage tracker, not just a form with no sense of
progress. A live preview block renders the actual branded topbar (logo,
display name, primary color) before the user commits. Domain connection
gives real DNS instructions (CNAME target) and is honest that automatic
verification needs a Cloudflare API token that isn't configured yet — the
stage shows "Pending" rather than faking "Verified." **Verified the entire
flow live in a browser**: saved branding, connected a domain, watched the
preview update with the real logo/color/sender text, activated, and
confirmed the stage tracker flipped to "Live" with a working Deactivate
button.

**Bug found and fixed: the marketing homepage had no mobile navigation at
all.** A background research agent's mobile audit flagged this, and direct
testing (Playwright, iPhone 12 viewport) confirmed it: `.mkt-nav-links`
simply had `display:none` below 720px with no hamburger menu or any other
way to reach Features/Pricing/Sign in — the nav just vanished. Rebuilt
`MarketingNav.jsx` as a client component with a real hamburger toggle and
slide-down mobile menu; added the missing `.mkt-nav-toggle`/`.mkt-nav-mobile`
CSS. Verified: hamburger renders and is clickable on mobile now.

**Two suspected mobile bugs from the same audit turned out to be false
positives on direct testing** — worth noting since this is the second pass
in a row where a static-analysis-only audit produced a wrong conclusion
that only surfaced via actually driving the browser:
- The audit read `.sidebar`'s CSS in isolation and concluded mobile
  collapses it into an unusable horizontal scroll strip. In fact a second,
  more specific `.app-shell .sidebar` rule (higher CSS specificity, later
  in the file) already implements a proper slide-in drawer with a working
  toggle button and backdrop — confirmed by screenshotting the drawer
  actually open on an iPhone 12 viewport, showing the full category list,
  search, and account/billing/white-label nav cleanly. The two rules were
  genuinely redundant (dead CSS, confusing to read) but not actually
  broken in effect, since the higher-specificity rule always wins. Left
  the cleanup for a future pass rather than risk touching working CSS
  under this pass's time pressure.
- The audit predicted `.stat-grid`/`.stats-row` would squeeze into
  unreadable thin columns on mobile. In fact `repeat(auto-fill,
  minmax(150px, 1fr))` is a self-adjusting CSS Grid pattern that already
  reduces column *count* (not width) on narrow screens — confirmed live on
  CRM's stat row on an iPhone 12 viewport, rendering as a clean 3-then-1
  layout with fully readable numbers and labels.
- (First caught mid-verification, not by the audit) The very first mobile
  test run hit `Application error: a client-side exception` — not a real
  bug, but the same stale-PM2-process issue from Pass 11/12: multiple
  `next build`s had run since the last `pm2 restart digitpenhub-suite-web`,
  so the running process was serving old HTML referencing chunk files the
  new build had already overwritten. Restarted, re-ran, clean. **This is
  now the third time this exact mistake has happened across passes** —
  worth internalizing as a hard rule: restart PM2 after the *last* build in
  a batch, always, before any verification step, no exceptions.

**Bug found and fixed: the pricing page's subtitle was factually wrong, not
just generic.** Said "Every plan includes all 97 modules... not
locked-away features" — but the Free plan has always been limited to
CRM/Lead Generation/Invoices only (confirmed against `planAccess.js`'s
`FREE_TIER_MODULE_SLUGS`, unchanged since Pass 8). This wasn't a copy-tone
issue flagged by the audit, it was actively misleading a prospective
signup about what they'd get for free. Rewrote both the pricing headline
and the features-page subtitle to be accurate and specific rather than
generic.

**`.modal-card` mobile fix**: added `max-height:min(88vh,720px)` +
`overflow-y:auto` — previously a tall form (e.g. this pass's own white-label
branding form, or SMS CSV import) had no cap and no internal scroll, so on
a short viewport (landscape phone, or portrait with the keyboard open) the
submit button could render below the fold with no way to reach it.

**Decisions made:**
- White-label eligibility gated to the Business plan specifically, not "any
  paid plan" — a deliberate reading of "agency reselling the platform" as
  the top-tier use case, consistent with existing pricing-page positioning.
- Scoped the public content endpoint to an explicit allowlist of sections
  (`homepage`, `footer`) rather than exposing the whole `site_content`
  table — content added to a future gated section (e.g. an internal admin
  dashboard message) won't accidentally leak publicly just by existing in
  the same table.
- Did not build a full drag-and-drop or WYSIWYG content editor — the admin
  content tab is plain labeled text/textarea fields per content key. This
  covers the explicit ask (editorial control without a code deploy) without
  over-building; a richer editor is a reasonable future upgrade once more
  content is migrated into the CMS.
- Did not migrate every marketing/empty-state string into the CMS this
  pass — only the homepage hero + value section + footer tagline (7 keys).
  Expanding CMS coverage (features page, pricing page, published-site
  legal-page defaults) is real remaining work, logged below, not silently
  treated as done.
- Left the dead/redundant `.sidebar` mobile CSS block from the pre-drawer
  era in place rather than removing it under time pressure, since it's
  confirmed inert (never wins the cascade) rather than actively harmful.

**Still weak / not done this pass:**
- CMS coverage is 7 content keys (homepage hero/value/footer) — the
  features page, pricing page, legal/terms pages, and every module's
  landing description (Step 1b/1t's "expand into a short paragraph") are
  still hardcoded. Real remaining work, not a rounding error.
- White-label's custom-domain verification is UI-complete but not live —
  still blocked on a Cloudflare API token (same blocker as Step 1f in
  every prior pass that touched domains).
- Icons/imagery: reviewed the existing icon usage (marketing category
  icons, module EmptyStates, White Label's stage tracker) and found it
  already reasonably consistent from prior passes — did not find a
  concrete, high-value gap worth new work this pass beyond what's already
  in place. Flagging this honestly rather than claiming a real "icons and
  imagery" pass happened when it was mostly a review that found things
  already adequate.
- Did not do a site-wide copy rewrite (Step 1t's full scope) — fixed the
  two most consequential lines found (the factually-wrong pricing claim,
  the vanished-nav bug) plus the CMS-seeded homepage copy, not every page.

**Suggested priority for next pass:** expand CMS coverage to the features/
pricing pages next (the pattern is now proven, it's mechanical repetition
from here); remove the dead pre-drawer sidebar CSS now that it's confirmed
safe to delete; pick an SMS provider (still open from Pass 12) and wire
real sending; continue the `ModulePage` retrofit batch (recruitment,
asset-management, knowledge-base, per Pass 12's suggestion, still not
done). Also: **before any live-browser verification step in any future
pass, restart PM2 first** — this has now cost real time three passes running.
