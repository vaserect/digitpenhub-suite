-- Migration 133: Collaboration Features for Website Builder
-- Comments, version history, and real-time collaboration

-- Page comments and feedback
CREATE TABLE IF NOT EXISTS page_comments (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    element_id VARCHAR(255), -- Optional: comment on specific element
    
    -- Comment content
    content TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'comment', -- 'comment', 'suggestion', 'issue', 'approval'
    
    -- Threading
    parent_id INTEGER REFERENCES page_comments(id) ON DELETE CASCADE,
    thread_id INTEGER, -- Root comment ID for threading
    
    -- Position (for element-specific comments)
    position_x INTEGER,
    position_y INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'resolved', 'archived'
    is_pinned BOOLEAN DEFAULT false,
    
    -- Mentions
    mentioned_users UUID[],
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP
);

-- Page version history
CREATE TABLE IF NOT EXISTS page_versions (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Version content
    page_data JSONB NOT NULL, -- Complete page snapshot
    page_html TEXT, -- Rendered HTML
    
    -- Change summary
    change_summary TEXT,
    changes_made JSONB DEFAULT '[]', -- Array of specific changes
    
    -- Version metadata
    is_published BOOLEAN DEFAULT false,
    is_auto_save BOOLEAN DEFAULT false,
    
    -- Author
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Restore info
    restored_from_version INTEGER,
    
    UNIQUE(page_id, version_number)
);

-- Real-time collaboration sessions
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Session info
    session_id VARCHAR(255) NOT NULL UNIQUE,
    socket_id VARCHAR(255),
    
    -- User state
    current_element_id VARCHAR(255), -- Element being edited
    cursor_position JSONB, -- {x, y} coordinates
    viewport JSONB, -- {width, height, scrollX, scrollY}
    
    -- Activity
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Session metadata
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Page locks (prevent concurrent editing)
CREATE TABLE IF NOT EXISTS page_locks (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    element_id VARCHAR(255), -- Optional: lock specific element
    
    -- Lock info
    locked_by UUID NOT NULL REFERENCES users(id),
    lock_type VARCHAR(20) DEFAULT 'soft', -- 'soft' (warning), 'hard' (prevent)
    
    -- Lock metadata
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    UNIQUE(page_id, element_id)
);

-- Activity log for collaboration
CREATE TABLE IF NOT EXISTS page_activity_log (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- 'edit', 'comment', 'publish', 'restore', 'share'
    activity_data JSONB DEFAULT '{}',
    description TEXT,
    
    -- Actor
    user_id UUID NOT NULL REFERENCES users(id),
    user_name VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Page sharing and permissions
CREATE TABLE IF NOT EXISTS page_shares (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    
    -- Share configuration
    share_token VARCHAR(255) NOT NULL UNIQUE,
    share_type VARCHAR(20) DEFAULT 'view', -- 'view', 'comment', 'edit'
    
    -- Access control
    allowed_users UUID[], -- Specific users (null = public)
    allowed_emails TEXT[], -- Email addresses for invite-only
    password_hash VARCHAR(255), -- Optional password protection
    
    -- Restrictions
    expires_at TIMESTAMP,
    max_views INTEGER,
    current_views INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP
);

-- Notification preferences for collaboration
CREATE TABLE IF NOT EXISTS collaboration_notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    
    -- Notification settings
    notify_on_comment BOOLEAN DEFAULT true,
    notify_on_mention BOOLEAN DEFAULT true,
    notify_on_edit BOOLEAN DEFAULT false,
    notify_on_publish BOOLEAN DEFAULT true,
    notify_on_share BOOLEAN DEFAULT true,
    
    -- Delivery preferences
    email_notifications BOOLEAN DEFAULT true,
    in_app_notifications BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, page_id)
);

-- Indexes for performance
CREATE INDEX idx_page_comments_page ON page_comments(page_id);
CREATE INDEX idx_page_comments_thread ON page_comments(thread_id);
CREATE INDEX idx_page_comments_status ON page_comments(status);
CREATE INDEX idx_page_comments_created_by ON page_comments(created_by);
CREATE INDEX idx_page_versions_page ON page_versions(page_id);
CREATE INDEX idx_page_versions_number ON page_versions(page_id, version_number DESC);
CREATE INDEX idx_collaboration_sessions_page ON collaboration_sessions(page_id);
CREATE INDEX idx_collaboration_sessions_user ON collaboration_sessions(user_id);
CREATE INDEX idx_collaboration_sessions_active ON collaboration_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_page_locks_page ON page_locks(page_id);
CREATE INDEX idx_page_activity_log_page ON page_activity_log(page_id);
CREATE INDEX idx_page_activity_log_date ON page_activity_log(created_at DESC);
CREATE INDEX idx_page_shares_token ON page_shares(share_token);
CREATE INDEX idx_page_shares_page ON page_shares(page_id);
CREATE INDEX idx_collab_notifications_user ON collaboration_notifications(user_id);

-- Function to auto-increment version number
CREATE OR REPLACE FUNCTION get_next_version_number(p_page_id UUID)
RETURNS INTEGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO next_version
    FROM page_versions
    WHERE page_id = p_page_id;
    
    RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
    DELETE FROM page_locks
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up inactive sessions
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
    UPDATE collaboration_sessions
    SET is_active = false, ended_at = NOW()
    WHERE is_active = true 
    AND last_activity_at < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE page_comments IS 'Comments and feedback on pages and elements';
COMMENT ON TABLE page_versions IS 'Version history for pages';
COMMENT ON TABLE collaboration_sessions IS 'Real-time collaboration sessions';
COMMENT ON TABLE page_locks IS 'Locks to prevent concurrent editing conflicts';
COMMENT ON TABLE page_activity_log IS 'Activity log for collaboration tracking';
COMMENT ON TABLE page_shares IS 'Page sharing and access control';
COMMENT ON TABLE collaboration_notifications IS 'User notification preferences for collaboration';
