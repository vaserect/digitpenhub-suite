# Website Builder & Template System Reference Manual
**Status:** ✅ PRODUCTION READY (100% Core Complete)  
**Last Updated:** July 17, 2026  
**Supersedes:** 23 archived design, audit, and completion reports in `/docs/archive/by-topic/website-builder/`.

---

## 🎯 Executive Summary

The Digitpen Hub Website Builder is an enterprise-grade visual platform consolidating the website builder, landing page builder, funnel builder, template marketplace, and global theme system. The system is 100% complete and fully production-ready.

### Final Statistics
*   **Total Seeded Templates:** 460 premium, multi-page templates across 100+ industries, integrated with high-quality Pexels stock photos and fallback SVG thumbnails.
*   **Total Component Assets:** 142 reusable base components across 22 categories (hero, navigation, features, pricing, testimonials, footer, stats, modals, etc.).
*   **Pre-built Sections:** 50 pre-built layouts combining components.
*   **Animation System:** 20+ professional animations (fade, slide, zoom, float, etc.) with multiple triggers (onLoad, onClick, onHover, scroll).
*   **Marketplace & Gateways:** Completed Visual Component Marketplace supporting visual uploads, reviews, ratings, and 4 major payment gateways (Flutterwave primary, plus Paystack, Stripe, and PayPal).

---

## 🗄️ Database Schema & Architecture

The database model is comprised of the following key tables:

1.  `builder_sites` - Groups multi-page websites per organization.
2.  `builder_templates` - Store metadata for the 460 global/org-specific templates.
3.  `builder_template_pages` - Store page definitions under a template, including:
    *   `blocks` (JSONB) - Column containing a complete list of block renderers and properties.
4.  `page_components` - Stores individual visual components.
5.  `page_sections` - Reusable pre-built sections (e.g. Navigation + Hero, CTA + Testimonial).
6.  `builder_themes` - Global theme settings (colors, typography, spacing).
7.  `builder_assets` - Media library uploads for templates and sites.
8.  `builder_global_blocks` - Globally synced symbols/blocks (like headers/footers).
9.  `builder_page_revisions` - Page history tracking for rollbacks.
10. `marketplace_components` - Custom user-created components listed for sale or share.
11. `marketplace_reviews` - User rating system (1-5 stars) for marketplace items.

> [!NOTE]
> Older design documentation proposed a `builder_template_blocks` table. This structure was simplified; blocks are stored as a JSONB array (`blocks` column) directly inside `builder_template_pages`, which matches the dynamic nature of the page editor.

---

## 🖼️ Pexels Stock Photo Integration

The builder has a native stock photo lookup system built directly into the UI.
*   **API Configuration:** Integrated with 7 rolling API keys (`PEXELS_API_KEY_1` through `PEXELS_API_KEY_7`) to prevent rate limits.
*   **Fallback Assets:** Over 460 high-resolution JPG images hosted in `frontend/public/templates/` with matching SVG vector placeholders for offline development.

---

## 💳 Component Marketplace & Payments

Users can buy and sell custom components in the marketplace.
*   **Primary Payment Gateway:** **Flutterwave** (handling card processing, mobile money, and local banking).
*   **Secondary/Optional Gateways:** Paystack, Stripe, and PayPal.
*   **Admin Panel:** Full admin dashboard at `/admin/marketplace` for reviewing, approving, or banning submitted components.

---

## 🔌 API Routes Reference

All API routes are served under `/api/v1/` and require JWT auth (except public storefront and previews).

| Endpoint | Method | Description |
|---|---|---|
| `/builder/sites` | GET/POST/PUT/DELETE | CRUD operations for sites |
| `/builder/templates` | GET/POST | List and retrieve templates |
| `/components` | GET/POST | Component Library listings |
| `/marketplace` | GET/POST/PUT | Component Marketplace products & reviews |
| `/marketplace/payment` | POST | Initialize marketplace transactions |

---

## 📂 Frontend Routes

*   `/website-builder` - Main dashboard for creating pages.
*   `/builder` - Full multi-page website editor.
*   `/templates` - Template selection interface.
*   `/templates/preview/[id]` - Full-page interactive template preview.
*   `/marketplace` - Reusable component shop.
