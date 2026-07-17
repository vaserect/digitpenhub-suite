# Next steps for you (not doable from inside Claude Code)

## New: your admin panel now has editorial control and scoped roles — worth a look
Log in as your super-admin account and open `/admin` — there are 3 new tabs:
**Content** (edit the homepage headline/subtitle/etc. live, no code deploy —
try changing the hero title and refreshing the public homepage in another
tab), **Admins** (grant someone "content editor" access so they can edit
marketing copy without also getting access to your orgs/users/billing —
search by email, check a box), and **Audit Log** (every admin action, who
did it, when). Only the homepage hero/value section and footer tagline are
CMS-editable so far — expanding this to the features/pricing pages and
every module's description is real remaining work, not done yet.

## New: White Label guided flow — try it, and a domain decision is needed
There's a new "White Label" section in the sidebar (Account & Security /
Billing & Plans area) that walks through a real 6-stage flow: plan check →
custom domain → logo/colors → sender identity → preview → activate. It's
gated to the Business plan. The branding/preview/activate stages are fully
real and work end-to-end today. The **custom domain stage gives correct DNS
instructions but can't auto-verify yet** — same Cloudflare API token
blocker as the domain-connection work flagged in earlier passes. Once you
add `CLOUDFLARE_API_TOKEN` to `.env`, domain verification for both this and
the earlier custom-domain work can go live together.

## Decision needed: pick an SMS provider (nothing sends real SMS yet)
There is currently no SMS provider wired up anywhere in the app — SMS
Marketing's "Send Campaign" button and Workflow Automation's "Send SMS"
step both just mark themselves as sent without actually contacting anyone.
This was already true before this pass; it's now clearly labeled as
"Simulated" in Workflow Automation's run log instead of silently pretending
to be real. To make it real: pick a provider (Termii and Africa's Talking
are the two most commonly used for Nigerian numbers; Twilio works globally
but costs more per SMS to Nigerian numbers) and get an API key. Once you
tell me which one, I can wire up both SMS Marketing and the workflow step
in one pass.

## The "Forms & Surveys" module could never actually collect responses — now fixed
If anyone on your team already built a form in Forms & Surveys and shared
its link, that link was silently broken the whole time — there was no public
page for a visitor to fill it out, and even the response-viewing table was
reading data by the wrong key so it would have shown blank columns even if
a response somehow existed. Both are fixed, plus it now supports real
branching logic (a field can show only if an earlier answer matches). If
you or anyone shared an old form link before today, it won't work
retroactively — you'll need to re-copy the link from the form's row
("Copy link" button) and re-share it.

## Performance Reports bug (flagged last pass) is now fixed
The `contact_stage` enum-casing bug that broke every KPI snapshot request
is fixed and verified. No action needed — just confirming it's resolved.

## New signups now see real sample data instead of an empty account
CRM, Invoices, Task Management, and Email Marketing now seed realistic
starter content the moment a new organization is created (5 CRM contacts
across every pipeline stage, a client with 2 invoices, 5 tasks on the
board, and an email list with a draft welcome campaign — all built as one
coherent fictional business, "Lagos Fresh Foods" and friends). This is
**new-signups-only, on purpose** — no existing account (including any real
customers) had data touched or added. If you want this same sample content
retroactively added to a specific existing account (e.g. for a demo), ask
and it can be done deliberately for that one account — it won't happen
automatically.

## A major layout bug just got fixed — worth a quick look yourself
About 60 of the app's 97 modules (Website Builder, Funnel Builder, HR, most
of Marketing, all AI modules, all SEO tools, Creative, LMS/School, Store
Builder, and more) were rendering in the wrong place in the page — outside
the sidebar+content layout entirely, appearing as a disconnected block below
everything else instead of properly framed inside the app. This wasn't
visible as an obvious crash, just as those modules looking oddly placed or
"floating" — easy to miss unless you scrolled down past the normal content
area. It's fixed now (verified across 50+ modules in a live browser test).
Worth opening a few modules yourself — especially ones you use often like
Website Builder or Funnel Builder — to confirm they look right on your end
too, since this had apparently been broken for an unknown number of past
sessions without anyone (including prior automated passes) noticing it.

## The sign-in bug you reported is fixed — please have that user try again
Root cause found and fixed: after logging in, the app could show a stale
cached "signed out" view instead of the real app, making a successful login
look like it silently failed. This was a client-side navigation bug, not an
authentication bug — the account and password were fine the whole time.
Fixed and verified across 5 repeated fresh-browser login attempts with zero
failures. If this is the same person who signed up earlier
(`digitpen3@gmail.com`, workspace "Pamcet Academy"), ask them to try signing
in again — it should now work every time. If anyone still can't get in after
this fix, that would be a genuinely new/different issue worth reporting back.

## Mail deliverability (blocking real invite/notification/password-reset emails)
DKIM signing is fixed and working (confirmed in `/var/log/maillog`), but real delivery
to Gmail/Outlook still bounces because DNS records are missing. In your DNS provider
(likely Cloudflare, given the existing SPF record):
1. Add a TXT record `default._domainkey.digitpenhub.com` with the value from
   `/etc/opendkim/keys/digitpenhub.com/default.txt` on the server.
2. Add the same for `default._domainkey.suite.digitpenhub.com`.
3. Update the existing SPF record for `digitpenhub.com` to add `ip4:72.62.177.168`
   (this server's outbound IP) — current record only authorizes Cloudflare/Brevo.

Until this is done, invite links, password-reset emails, and email notifications
will keep bouncing — the in-app copy/paste link (invites) remains the reliable
fallback in the meantime.

## Custom domains, white-label, and domain purchase (Step 1d)
Not started in any pass yet — needs:
- A Cloudflare API token + Zone ID (for automated DNS/SSL on custom domains).
- A domain-registrar API account (if you want in-app domain purchase, not just
  "bring your own domain").
Once you have either of these, tell Claude Code which one and it can build the
full flow (the UI/UX can be built now; only the live API calls need the key).

## A leftover test account exists in your database
`pass5-verify@digitpenhub.com` (organization "Pass5 Verify Org") is sitting in your
live `users`/`organizations` tables from an earlier interrupted session — it's not
real customer data, just leftover test data. Claude Code won't delete user records
without your say-so. If you don't need it, ask Claude Code to delete it, or run:
```
DELETE FROM users WHERE email='pass5-verify@digitpenhub.com';
DELETE FROM organizations WHERE name='Pass5 Verify Org';
```

## Sign-up flow is confirmed working — a real person already used it
Since the sign-up fix, a real visitor signed up on their own
(`digitpen3@gmail.com`, workspace "Pamcet Academy") — genuine outside confirmation
the fix works, not just this session's own test accounts. Still worth trying
"Forgot password?" yourself with a real email to see the current UX (the email
itself won't arrive until the DNS item above is fixed, but the in-app messaging
should degrade gracefully).

## Try the new multi-page site templates (Website Builder)
Website Builder now has a "Multi-page site template" button next to the existing
single-page one — it creates a full linked site (home/about/services/etc, 6 pages)
in one click for Real Estate, SaaS, or Restaurant businesses, with real nav/footer
links between every page, and now a genuinely working contact form (submissions
land in Lead Generation). Worth clicking through once yourself to see if the
content quality and page count matches what you'd want more categories built to.
