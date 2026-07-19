# CRM Enterprise Module Reference Manual
**Status:** ✅ Phase 1 Deployed & Database Foundation Active  
**Last Updated:** July 17, 2026  
**Supersedes:** All archived CRM audits, roadmaps, blueprints, and summaries in `/docs/archive/by-topic/crm/`.

---

## 🎯 Executive Summary

The Digitpen Hub CRM has been upgraded from a basic contact manager to an enterprise-grade Customer Relationship Management system. The core database foundation (Phase 1) is 100% complete and fully verified.

### Core Achievements
*   **22 New Database Tables:** Created to handle deals, pipelines, stages, relationships, lists, custom fields, automation workflows, and AI insights.
*   **Code-Database Alignment:** Fully resolved pre-existing model/import mismatches across CRM repositories and services.
*   **Verified Pipeline System:** Deployed a default 6-stage sales pipeline (Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost) for organizations.
*   **Passing Unit Tests:** Unit tests for `DealRepository`, `DealService`, and related helper classes are fully operational and passing.

---

## 🗄️ Database Schema & Architecture

The 22 new database tables deployed in PostgreSQL for the enterprise CRM module:

1.  `crm_pipelines` - Multiple sales pipelines per organization.
2.  `crm_stages` - Customizable pipeline stages with deal probability.
3.  `crm_deals` - Deal tracking, pricing, close dates, status (open/won/lost), and association with contacts/companies.
4.  `crm_activities` - Meetings, tasks, calls, and email activity tracking.
5.  `crm_custom_field_definitions` - Dynamic fields customizer.
6.  `crm_tag_definitions` - Globally shared organization tag list.
7.  `crm_lists` - Customer groups and cohorts.
8.  `crm_list_members` - Maps contacts and companies to custom lists.
9.  `crm_relationships` - Defines contacts-to-companies and contact-to-contact relations.
10. `crm_attachments` - Files attached to contacts/deals/companies.
11. `crm_workflows` - Triggers and action steps for automation.
12. `crm_workflow_executions` - Log executions and track steps.
13. `crm_reports` - Saved report queries.
14. `crm_dashboards` - Dashboard grids.
15. `crm_lead_scores` - AI-generated scores.
16. `crm_ai_insights` - AI recommendations.
17. `crm_audit_log` - Security track log.
18. `crm_companies` - Company directory.
19. `contacts` - Basic contact profiles.
20. `contact_notes` - Direct notes.
21. `contact_tasks` - Individual tasks.
22. `crm_activity_log` - Historical logs.

---

## ⚙️ Service Layer & Infrastructure

The CRM upgrade added several core backend services:
*   **`eventBus.js`:** An event-driven architecture allowing CRM events (e.g. `deal.created`, `contact.converted`) to trigger other system modules (like Email Marketing or Invoices).
*   **`ActivityService.js`:** Manages activity tracking, validation, and auto-logging.
*   **`errors.js`:** Custom CRM business errors (e.g., `ValidationError`, `NotFoundError`).

---

## 📋 Phase 2 Implementation Roadmap

Following the **Dependency-First** principle, the next phase of feature development is scheduled as follows:

1.  **Activity Engine & Timeline:** Build interactive activity creation UI and feed timeline view.
2.  **Automation Engine:** Connect triggers to the workflow engine.
3.  **Notification Hub:** Integrate email/SMS notifications based on CRM activities.
4.  **Reporting & Dashboards:** Deconstruct raw deal data into analytics reports.
5.  **AI Insights:** Activate lead scoring and recommendation algorithms.
