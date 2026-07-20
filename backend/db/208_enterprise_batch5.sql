-- Enterprise upgrade batch 5 — final batch covering 56+ modules
-- Education
ALTER TABLE lms_courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE lms_courses ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner';
ALTER TABLE school_students ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE school_students ADD COLUMN IF NOT EXISTS guardian_email TEXT;
ALTER TABLE cbt_tests ADD COLUMN IF NOT EXISTS time_limit_min INT;
ALTER TABLE cbt_tests ADD COLUMN IF NOT EXISTS passing_score INT DEFAULT 50;
-- AI
ALTER TABLE ai_content ADD COLUMN IF NOT EXISTS word_count INT;
ALTER TABLE ai_content ADD COLUMN IF NOT EXISTS readability_score NUMERIC(5,2);
ALTER TABLE ai_content ADD COLUMN IF NOT EXISTS seo_score NUMERIC(5,2);
ALTER TABLE ai_content ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'neutral';
-- Support/Success
ALTER TABLE ss_nps ADD COLUMN IF NOT EXISTS score INT;
ALTER TABLE ss_nps ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE ss_health ADD COLUMN IF NOT EXISTS score NUMERIC(5,2);
ALTER TABLE ss_sla ADD COLUMN IF NOT EXISTS target_minutes INT;
ALTER TABLE ss_roadmap ADD COLUMN IF NOT EXISTS votes INT DEFAULT 0;
-- Gamification
ALTER TABLE gm_badges ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE gm_badges ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;
ALTER TABLE gm_leaderboards ADD COLUMN IF NOT EXISTS period TEXT DEFAULT 'all_time';
ALTER TABLE gm_streaks ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE gm_onboarding ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]';
ALTER TABLE gm_onboarding ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
-- Mobile/Access
ALTER TABLE ma_mobile ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE ma_whitelabel_app ADD COLUMN IF NOT EXISTS app_name TEXT;
-- Media
ALTER TABLE mp_podcast ADD COLUMN IF NOT EXISTS episode_count INT DEFAULT 0;
ALTER TABLE mp_video ADD COLUMN IF NOT EXISTS duration_sec INT;
ALTER TABLE mp_demo ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]';
-- Non-Profit
ALTER TABLE np_donations ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2);
ALTER TABLE np_donations ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE np_volunteers ADD COLUMN IF NOT EXISTS hours_logged NUMERIC(6,2);
ALTER TABLE np_grants ADD COLUMN IF NOT EXISTS amount_requested NUMERIC(12,2);
-- Extended Vertical
ALTER TABLE ev_legal ADD COLUMN IF NOT EXISTS case_number TEXT;
ALTER TABLE ev_insurance ADD COLUMN IF NOT EXISTS policy_number TEXT;
ALTER TABLE ev_manufacturing ADD COLUMN IF NOT EXISTS quality_score INT;
ALTER TABLE ev_travel ADD COLUMN IF NOT EXISTS booking_reference TEXT;
ALTER TABLE ev_property ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE ev_iot ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE ev_agriculture ADD COLUMN IF NOT EXISTS crop_type TEXT;
ALTER TABLE ev_esports ADD COLUMN IF NOT EXISTS ranking INT;
ALTER TABLE ev_religious ADD COLUMN IF NOT EXISTS congregation_size INT;
ALTER TABLE ev_gov ADD COLUMN IF NOT EXISTS rfp_number TEXT;
-- Platform Admin
ALTER TABLE pa_vuln_scans ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';
ALTER TABLE pa_incidents ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';
ALTER TABLE pa_changelog ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE pa_addons ADD COLUMN IF NOT EXISTS developer_name TEXT;
ALTER TABLE pa_addons ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);
-- Integrations
ALTER TABLE int_native_hub ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE int_developer_apps ADD COLUMN IF NOT EXISTS app_name TEXT;
ALTER TABLE int_sandbox_sessions ADD COLUMN IF NOT EXISTS endpoint TEXT;
ALTER TABLE int_sandbox_sessions ADD COLUMN IF NOT EXISTS response_code INT;
ALTER TABLE int_oauth_apps ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE int_oauth_apps ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT '{}';
