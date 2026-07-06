-- Milestone 77: SEM (paid ad campaign) tracking hooks for public-facing pages.
-- Lets store/site owners wire up Google Analytics 4, Google Ads conversion
-- tracking, and Meta/Facebook Pixel on their public storefront and
-- website-builder pages, so paid-campaign traffic can actually be measured.

ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS ga_measurement_id TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS google_ads_conversion_id TEXT;

ALTER TABLE pages ADD COLUMN IF NOT EXISTS ga_measurement_id TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS google_ads_conversion_id TEXT;
