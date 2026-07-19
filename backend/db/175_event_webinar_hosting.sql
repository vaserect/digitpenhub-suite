-- Migration 175: Event / Webinar Hosting System
-- Module 34 of Marketing Category
-- Benchmark: Livestorm / Demio / Zoom Webinars

-- Main Events Table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'live' CHECK (type IN ('live', 'on-demand', 'hybrid', 'recurring')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',
    duration_minutes INTEGER,
    capacity INTEGER DEFAULT 100,
    registration_type VARCHAR(20) DEFAULT 'open' CHECK (registration_type IN ('open', 'approval', 'closed')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'ended', 'cancelled')),
    branding_settings JSONB,
    landing_page_settings JSONB,
    recording_enabled BOOLEAN DEFAULT TRUE,
    chat_enabled BOOLEAN DEFAULT TRUE,
    qa_enabled BOOLEAN DEFAULT TRUE,
    polls_enabled BOOLEAN DEFAULT TRUE,
    video_provider VARCHAR(50) DEFAULT 'daily',
    video_room_url TEXT,
    video_room_token TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_org_id ON events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

-- Event Sessions (for multi-session events)
CREATE TABLE IF NOT EXISTS event_sessions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    session_order INTEGER DEFAULT 0,
    speakers JSONB,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_sessions_event_id ON event_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sessions_start_time ON event_sessions(start_time);

-- Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    registration_data JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'attended')),
    ticket_type VARCHAR(100),
    payment_status VARCHAR(20) DEFAULT 'free' CHECK (payment_status IN ('free', 'pending', 'paid', 'refunded')),
    payment_amount DECIMAL(10,2) DEFAULT 0,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    attended BOOLEAN DEFAULT FALSE,
    join_time TIMESTAMP,
    leave_time TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_contact_id ON event_registrations(contact_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- Event Attendees (live tracking)
CREATE TABLE IF NOT EXISTS event_attendees (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_id INTEGER NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES event_sessions(id) ON DELETE SET NULL,
    join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leave_time TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    ip_address VARCHAR(45),
    location JSONB
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_registration_id ON event_attendees(registration_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_session_id ON event_attendees(session_id);

-- Event Presenters/Panelists
CREATE TABLE IF NOT EXISTS event_presenters (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'panelist' CHECK (role IN ('host', 'co-host', 'panelist', 'moderator')),
    bio TEXT,
    photo_url TEXT,
    social_links JSONB,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_presenters_event_id ON event_presenters(event_id);
CREATE INDEX IF NOT EXISTS idx_event_presenters_user_id ON event_presenters(user_id);

-- Event Chat Messages
CREATE TABLE IF NOT EXISTS event_chat_messages (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES event_sessions(id) ON DELETE SET NULL,
    sender_id INTEGER,
    sender_name VARCHAR(255),
    sender_type VARCHAR(20) DEFAULT 'attendee' CHECK (sender_type IN ('attendee', 'presenter', 'moderator')),
    message TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    recipient_id INTEGER,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_chat_messages_event_id ON event_chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_session_id ON event_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_sender_id ON event_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_sent_at ON event_chat_messages(sent_at);

-- Event Q&A
CREATE TABLE IF NOT EXISTS event_questions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES event_sessions(id) ON DELETE SET NULL,
    attendee_id INTEGER REFERENCES event_registrations(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'dismissed')),
    upvotes INTEGER DEFAULT 0,
    answered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    answer TEXT,
    asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_questions_event_id ON event_questions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_questions_session_id ON event_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_event_questions_status ON event_questions(status);
CREATE INDEX IF NOT EXISTS idx_event_questions_upvotes ON event_questions(upvotes);

-- Event Polls
CREATE TABLE IF NOT EXISTS event_polls (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES event_sessions(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    poll_type VARCHAR(20) DEFAULT 'single' CHECK (poll_type IN ('single', 'multiple', 'open')),
    options JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    results_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    launched_at TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_polls_event_id ON event_polls(event_id);
CREATE INDEX IF NOT EXISTS idx_event_polls_session_id ON event_polls(session_id);
CREATE INDEX IF NOT EXISTS idx_event_polls_status ON event_polls(status);

-- Event Poll Responses
CREATE TABLE IF NOT EXISTS event_poll_responses (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES event_polls(id) ON DELETE CASCADE,
    attendee_id INTEGER REFERENCES event_registrations(id) ON DELETE SET NULL,
    response JSONB NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_poll_responses_poll_id ON event_poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_event_poll_responses_attendee_id ON event_poll_responses(attendee_id);

-- Event Recordings
CREATE TABLE IF NOT EXISTS event_recordings (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES event_sessions(id) ON DELETE SET NULL,
    recording_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    transcript TEXT,
    chapters JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_recordings_event_id ON event_recordings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_recordings_session_id ON event_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_event_recordings_status ON event_recordings(status);

-- Event Recording Views (for on-demand analytics)
CREATE TABLE IF NOT EXISTS event_recording_views (
    id SERIAL PRIMARY KEY,
    recording_id INTEGER NOT NULL REFERENCES event_recordings(id) ON DELETE CASCADE,
    viewer_id INTEGER REFERENCES event_registrations(id) ON DELETE SET NULL,
    email VARCHAR(255),
    watch_duration_seconds INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_recording_views_recording_id ON event_recording_views(recording_id);
CREATE INDEX IF NOT EXISTS idx_event_recording_views_viewer_id ON event_recording_views(viewer_id);

-- Event Email Communications
CREATE TABLE IF NOT EXISTS event_emails (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    email_type VARCHAR(20) DEFAULT 'invitation' CHECK (email_type IN ('invitation', 'reminder', 'followup', 'noshow', 'thankyou', 'recording')),
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    send_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed')),
    recipients_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_emails_event_id ON event_emails(event_id);
CREATE INDEX IF NOT EXISTS idx_event_emails_email_type ON event_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_event_emails_status ON event_emails(status);
CREATE INDEX IF NOT EXISTS idx_event_emails_send_time ON event_emails(send_time);

-- Event Analytics (daily aggregation)
CREATE TABLE IF NOT EXISTS event_analytics_daily (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    registrations INTEGER DEFAULT 0,
    attendees INTEGER DEFAULT 0,
    peak_concurrent INTEGER DEFAULT 0,
    avg_watch_time_seconds INTEGER DEFAULT 0,
    chat_messages INTEGER DEFAULT 0,
    questions_asked INTEGER DEFAULT 0,
    poll_responses INTEGER DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, date)
);

CREATE INDEX IF NOT EXISTS idx_event_analytics_daily_event_id ON event_analytics_daily(event_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_daily_date ON event_analytics_daily(date);

-- Event Landing Pages
CREATE TABLE IF NOT EXISTS event_landing_pages (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    template VARCHAR(100) DEFAULT 'default',
    custom_html TEXT,
    custom_css TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    og_image TEXT,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_landing_pages_event_id ON event_landing_pages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_landing_pages_slug ON event_landing_pages(slug);

-- Event Tickets/Pricing
CREATE TABLE IF NOT EXISTS event_tickets (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    quantity_total INTEGER,
    quantity_sold INTEGER DEFAULT 0,
    sale_start TIMESTAMP,
    sale_end TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_is_active ON event_tickets(is_active);

-- Event Breakout Rooms
CREATE TABLE IF NOT EXISTS event_breakout_rooms (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES event_sessions(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_breakout_rooms_event_id ON event_breakout_rooms(event_id);
CREATE INDEX IF NOT EXISTS idx_event_breakout_rooms_session_id ON event_breakout_rooms(session_id);

-- Event Breakout Participants
CREATE TABLE IF NOT EXISTS event_breakout_participants (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES event_breakout_rooms(id) ON DELETE CASCADE,
    attendee_id INTEGER NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
    join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leave_time TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_breakout_participants_room_id ON event_breakout_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_event_breakout_participants_attendee_id ON event_breakout_participants(attendee_id);

-- Event Webhooks
CREATE TABLE IF NOT EXISTS event_webhooks (
    id SERIAL PRIMARY KEY,
    org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events JSONB NOT NULL,
    secret VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    last_triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_webhooks_org_id ON event_webhooks(org_id);
CREATE INDEX IF NOT EXISTS idx_event_webhooks_event_id ON event_webhooks(event_id);
CREATE INDEX IF NOT EXISTS idx_event_webhooks_status ON event_webhooks(status);
