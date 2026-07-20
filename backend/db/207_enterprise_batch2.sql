-- Enterprise upgrade batch 2 — 12 modules
-- Knowledge Base
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS helpful_count INT DEFAULT 0;
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
-- Time Tracking
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS billable BOOLEAN DEFAULT false;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS billable_rate NUMERIC(10,2);
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS description TEXT;
-- Workflows
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'manual';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS trigger_config JSONB DEFAULT '{}';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS run_count INT DEFAULT 0;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS error_count INT DEFAULT 0;
-- Collaborative Editing
ALTER TABLE shared_documents ADD COLUMN IF NOT EXISTS lock_expires_at TIMESTAMPTZ;
ALTER TABLE shared_documents ADD COLUMN IF NOT EXISTS change_log JSONB DEFAULT '[]';
ALTER TABLE shared_documents ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
-- Brand Kit
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS font_heading TEXT;
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS font_body TEXT;
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS guidelines TEXT;
-- Certificates
ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS verification_code TEXT;
ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS issued_by TEXT;
-- Barcodes
ALTER TABLE barcodes ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'qr';
ALTER TABLE barcodes ADD COLUMN IF NOT EXISTS foreground_color TEXT DEFAULT '#000000';
ALTER TABLE barcodes ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff';
ALTER TABLE barcodes ADD COLUMN IF NOT EXISTS logo_overlay TEXT;
-- Password Manager
ALTER TABLE password_entries ADD COLUMN IF NOT EXISTS strength TEXT;
ALTER TABLE password_entries ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE password_entries ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE password_entries ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE password_entries ADD COLUMN IF NOT EXISTS breach_checked_at TIMESTAMPTZ;
-- Forms/Surveys
ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_survey BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS conditional_logic JSONB DEFAULT '[]';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS ab_test_enabled BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS spam_protection BOOLEAN DEFAULT true;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS submission_count INT DEFAULT 0;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS notification_email TEXT;
-- Popup Builder
ALTER TABLE popups ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'time';
ALTER TABLE popups ADD COLUMN IF NOT EXISTS trigger_delay INT DEFAULT 5;
ALTER TABLE popups ADD COLUMN IF NOT EXISTS animation TEXT DEFAULT 'fade';
ALTER TABLE popups ADD COLUMN IF NOT EXISTS show_on_mobile BOOLEAN DEFAULT true;
ALTER TABLE popups ADD COLUMN IF NOT EXISTS frequency_days INT DEFAULT 0;
-- Appointment Booking
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_minutes INT DEFAULT 30;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;
