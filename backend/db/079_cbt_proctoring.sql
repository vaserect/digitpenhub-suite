-- CBT: lightweight proctoring signals (tab-switch / window-blur tracking)
ALTER TABLE cbt_attempts ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER DEFAULT 0;
ALTER TABLE cbt_attempts ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;
