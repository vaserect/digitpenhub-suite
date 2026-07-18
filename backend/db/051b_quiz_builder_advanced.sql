-- ══════════════════════════════════════════════════════════════════════════════
-- Quiz Builder Advanced Features Migration
-- Extends the basic quiz builder with enterprise-grade features matching
-- Outgrow/Interact benchmarks: templates, personality quizzes, branching logic,
-- custom results pages, advanced analytics, and lead capture integration.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Quiz Templates ────────────────────────────────────────────────────────────
-- Pre-built quiz templates for common use cases (personality, assessment, trivia)
CREATE TABLE IF NOT EXISTS quiz_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'personality', 'assessment', 'trivia', 'lead_gen', 'product_recommendation'
  quiz_type TEXT NOT NULL, -- 'scored', 'personality', 'outcome_based'
  thumbnail_url TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  outcomes JSONB NOT NULL DEFAULT '[]', -- For personality/outcome-based quizzes
  settings JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT true, -- System templates vs user-created
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Quiz Outcomes/Results Pages ───────────────────────────────────────────────
-- Custom result pages shown based on score ranges or personality types
CREATE TABLE IF NOT EXISTS quiz_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  min_score INTEGER, -- For scored quizzes: minimum score to show this outcome
  max_score INTEGER, -- For scored quizzes: maximum score to show this outcome
  personality_type TEXT, -- For personality quizzes: which personality type gets this outcome
  outcome_key TEXT, -- Generic key for outcome-based quizzes
  cta_text TEXT, -- Call-to-action button text
  cta_url TEXT, -- Call-to-action URL
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_outcomes_quiz_id ON quiz_outcomes(quiz_id);
CREATE INDEX idx_quiz_outcomes_org_id ON quiz_outcomes(org_id);

-- ── Quiz Branching Logic ──────────────────────────────────────────────────────
-- Conditional logic to show/hide questions based on previous answers
CREATE TABLE IF NOT EXISTS quiz_branching_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL, -- The question this rule applies to
  condition_type TEXT NOT NULL, -- 'show_if', 'hide_if', 'jump_to'
  trigger_question_id TEXT NOT NULL, -- The question whose answer triggers this rule
  trigger_answer TEXT, -- The specific answer that triggers this rule (JSON for multiple)
  target_question_id TEXT, -- For 'jump_to' rules: which question to jump to
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_branching_quiz_id ON quiz_branching_rules(quiz_id);

-- ── Quiz Analytics ────────────────────────────────────────────────────────────
-- Detailed analytics for quiz performance tracking
CREATE TABLE IF NOT EXISTS quiz_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0, -- How many times the quiz was viewed
  starts INTEGER DEFAULT 0, -- How many times someone started the quiz
  completions INTEGER DEFAULT 0, -- How many times the quiz was completed
  avg_completion_time INTEGER, -- Average time to complete in seconds
  avg_score DECIMAL(5,2), -- Average score for scored quizzes
  drop_off_points JSONB DEFAULT '{}', -- Which questions people drop off at
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, date)
);

CREATE INDEX idx_quiz_analytics_quiz_id ON quiz_analytics(quiz_id);
CREATE INDEX idx_quiz_analytics_date ON quiz_analytics(date);

-- ── Quiz Question Analytics ───────────────────────────────────────────────────
-- Per-question performance metrics
CREATE TABLE IF NOT EXISTS quiz_question_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}', -- Count of each answer option
  correct_count INTEGER DEFAULT 0, -- For scored questions
  incorrect_count INTEGER DEFAULT 0,
  skip_count INTEGER DEFAULT 0,
  avg_time_spent INTEGER, -- Average time spent on this question in seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, question_id, date)
);

CREATE INDEX idx_quiz_question_analytics_quiz_id ON quiz_question_analytics(quiz_id);

-- ── Quiz Lead Captures ────────────────────────────────────────────────────────
-- Enhanced lead capture with CRM integration
CREATE TABLE IF NOT EXISTS quiz_lead_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  response_id UUID REFERENCES quiz_responses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Link to CRM contact
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  custom_fields JSONB DEFAULT '{}',
  outcome_id UUID REFERENCES quiz_outcomes(id) ON DELETE SET NULL,
  score INTEGER,
  personality_type TEXT,
  lead_source TEXT DEFAULT 'quiz',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_lead_captures_quiz_id ON quiz_lead_captures(quiz_id);
CREATE INDEX idx_quiz_lead_captures_contact_id ON quiz_lead_captures(contact_id);
CREATE INDEX idx_quiz_lead_captures_email ON quiz_lead_captures(email);

-- ── Quiz Embed Configurations ─────────────────────────────────────────────────
-- Different embed types and configurations
CREATE TABLE IF NOT EXISTS quiz_embeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  embed_type TEXT NOT NULL, -- 'inline', 'popup', 'slide_in', 'fullscreen'
  trigger_type TEXT, -- For popup/slide_in: 'time_delay', 'scroll_depth', 'exit_intent', 'click'
  trigger_value TEXT, -- Trigger configuration (e.g., "5000" for 5s delay, "50" for 50% scroll)
  position TEXT, -- For slide_in: 'bottom_right', 'bottom_left', 'top_right', 'top_left'
  custom_css TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_embeds_quiz_id ON quiz_embeds(quiz_id);

-- ── Quiz A/B Tests ────────────────────────────────────────────────────────────
-- A/B testing for quiz variations
CREATE TABLE IF NOT EXISTS quiz_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variant_a_config JSONB NOT NULL, -- Configuration for variant A
  variant_b_config JSONB NOT NULL, -- Configuration for variant B
  traffic_split INTEGER DEFAULT 50, -- Percentage of traffic to variant A (0-100)
  status TEXT DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
  winner TEXT, -- 'a', 'b', or NULL if no winner yet
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_ab_tests_quiz_id ON quiz_ab_tests(quiz_id);

-- ── Quiz A/B Test Results ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES quiz_ab_tests(id) ON DELETE CASCADE,
  variant TEXT NOT NULL, -- 'a' or 'b'
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  starts INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  leads_captured INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, variant, date)
);

CREATE INDEX idx_quiz_ab_test_results_test_id ON quiz_ab_test_results(test_id);

-- ── Update existing quizzes table with new fields ─────────────────────────────
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS quiz_type TEXT DEFAULT 'scored'; -- 'scored', 'personality', 'outcome_based'
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES quiz_templates(id) ON DELETE SET NULL;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS lead_capture_enabled BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS lead_capture_position TEXT DEFAULT 'end'; -- 'start', 'end', 'both'
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS lead_capture_fields JSONB DEFAULT '["name", "email"]';
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS social_sharing_enabled BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS retake_allowed BOOLEAN DEFAULT true;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_progress_bar BOOLEAN DEFAULT true;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS randomize_answers BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS pass_percentage INTEGER; -- For assessment quizzes
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS starts_count INTEGER DEFAULT 0;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5,2);

-- ── Update quiz_responses table with new fields ───────────────────────────────
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS outcome_id UUID REFERENCES quiz_outcomes(id) ON DELETE SET NULL;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS personality_type TEXT;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS time_spent INTEGER; -- Time spent in seconds
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS device_type TEXT; -- 'desktop', 'mobile', 'tablet'
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- ── Seed System Quiz Templates ────────────────────────────────────────────────
INSERT INTO quiz_templates (name, description, category, quiz_type, questions, outcomes, settings) VALUES
(
  'Personality Assessment',
  'Discover your personality type with this engaging quiz',
  'personality',
  'personality',
  '[
    {
      "id": "q1",
      "type": "multiple_choice",
      "text": "How do you prefer to spend your free time?",
      "options": ["Reading a book", "Going to a party", "Exercising outdoors", "Working on a project"],
      "personality_weights": {"introvert": 2, "extrovert": 0, "active": 1, "creative": 1}
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "text": "When making decisions, you rely more on:",
      "options": ["Logic and facts", "Intuition and feelings", "Past experiences", "Others'' opinions"],
      "personality_weights": {"analytical": 2, "emotional": 2, "practical": 1, "social": 1}
    },
    {
      "id": "q3",
      "type": "multiple_choice",
      "text": "In a group setting, you typically:",
      "options": ["Lead the discussion", "Listen and observe", "Contribute ideas", "Support others"],
      "personality_weights": {"leader": 2, "observer": 2, "creative": 1, "supportive": 2}
    }
  ]'::jsonb,
  '[
    {
      "personality_type": "analytical_leader",
      "title": "The Analytical Leader",
      "description": "You combine logical thinking with natural leadership abilities. You excel at making data-driven decisions and guiding teams toward success.",
      "traits": ["Strategic thinker", "Natural leader", "Data-driven", "Goal-oriented"]
    },
    {
      "personality_type": "creative_innovator",
      "title": "The Creative Innovator",
      "description": "You bring fresh ideas and creative solutions to every challenge. Your innovative thinking inspires others and drives change.",
      "traits": ["Creative", "Innovative", "Inspiring", "Visionary"]
    },
    {
      "personality_type": "supportive_collaborator",
      "title": "The Supportive Collaborator",
      "description": "You excel at building relationships and creating harmony in teams. Your empathy and support make you invaluable to any group.",
      "traits": ["Empathetic", "Team player", "Supportive", "Diplomatic"]
    }
  ]'::jsonb,
  '{"showScore": false, "shuffleQuestions": false}'::jsonb
),
(
  'Product Knowledge Assessment',
  'Test your knowledge about our products and services',
  'assessment',
  'scored',
  '[
    {
      "id": "q1",
      "type": "multiple_choice",
      "text": "What is the primary benefit of our flagship product?",
      "options": ["Cost savings", "Time efficiency", "Better quality", "All of the above"],
      "correct_answer": 3,
      "points": 10
    },
    {
      "id": "q2",
      "type": "true_false",
      "text": "Our product integrates with over 100 third-party tools.",
      "options": ["True", "False"],
      "correct_answer": "True",
      "points": 5
    },
    {
      "id": "q3",
      "type": "multiple_choice",
      "text": "Which industry is our product most commonly used in?",
      "options": ["Healthcare", "Finance", "Technology", "Retail"],
      "correct_answer": 2,
      "points": 10
    }
  ]'::jsonb,
  '[
    {
      "min_score": 0,
      "max_score": 10,
      "title": "Getting Started",
      "description": "You''re just beginning to learn about our products. We recommend checking out our beginner resources.",
      "cta_text": "View Beginner Guide",
      "cta_url": "/resources/beginner"
    },
    {
      "min_score": 11,
      "max_score": 20,
      "title": "Intermediate Knowledge",
      "description": "You have a good understanding of our products. Ready to take your knowledge to the next level?",
      "cta_text": "Explore Advanced Features",
      "cta_url": "/resources/advanced"
    },
    {
      "min_score": 21,
      "max_score": 25,
      "title": "Expert Level",
      "description": "Congratulations! You''re a product expert. Consider becoming a certified partner.",
      "cta_text": "Apply for Certification",
      "cta_url": "/certification"
    }
  ]'::jsonb,
  '{"showScore": true, "passPercentage": 70, "certificateEnabled": true}'::jsonb
),
(
  'Lead Generation Quiz',
  'Discover the perfect solution for your business needs',
  'lead_gen',
  'outcome_based',
  '[
    {
      "id": "q1",
      "type": "multiple_choice",
      "text": "What is your company size?",
      "options": ["1-10 employees", "11-50 employees", "51-200 employees", "200+ employees"],
      "outcome_mapping": {"small": 0, "medium": 1, "large": 2, "enterprise": 3}
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "text": "What is your primary business goal?",
      "options": ["Increase sales", "Improve efficiency", "Reduce costs", "Scale operations"],
      "outcome_mapping": {"sales": 0, "efficiency": 1, "cost": 2, "scale": 3}
    },
    {
      "id": "q3",
      "type": "multiple_choice",
      "text": "What is your budget range?",
      "options": ["Under $1,000/mo", "$1,000-$5,000/mo", "$5,000-$10,000/mo", "$10,000+/mo"],
      "outcome_mapping": {"starter": 0, "professional": 1, "business": 2, "enterprise": 3}
    }
  ]'::jsonb,
  '[
    {
      "outcome_key": "starter_plan",
      "title": "Starter Plan - Perfect for You",
      "description": "Based on your answers, our Starter Plan is the ideal solution for your business. Get started with essential features at an affordable price.",
      "cta_text": "Start Free Trial",
      "cta_url": "/pricing/starter"
    },
    {
      "outcome_key": "professional_plan",
      "title": "Professional Plan - Recommended",
      "description": "Your business needs advanced features and scalability. Our Professional Plan offers the perfect balance of power and value.",
      "cta_text": "Schedule Demo",
      "cta_url": "/demo"
    },
    {
      "outcome_key": "enterprise_plan",
      "title": "Enterprise Plan - Built for Scale",
      "description": "Your organization requires enterprise-grade features, security, and support. Let''s discuss a custom solution.",
      "cta_text": "Contact Sales",
      "cta_url": "/contact-sales"
    }
  ]'::jsonb,
  '{"leadCaptureEnabled": true, "leadCapturePosition": "start", "leadCaptureFields": ["name", "email", "company", "phone"]}'::jsonb
),
(
  'Trivia Challenge',
  'Test your general knowledge with this fun trivia quiz',
  'trivia',
  'scored',
  '[
    {
      "id": "q1",
      "type": "multiple_choice",
      "text": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correct_answer": 2,
      "points": 10
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "text": "Who painted the Mona Lisa?",
      "options": ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso", "Michelangelo"],
      "correct_answer": 1,
      "points": 10
    },
    {
      "id": "q3",
      "type": "true_false",
      "text": "The Great Wall of China is visible from space.",
      "options": ["True", "False"],
      "correct_answer": "False",
      "points": 10
    }
  ]'::jsonb,
  '[
    {
      "min_score": 0,
      "max_score": 10,
      "title": "Trivia Novice",
      "description": "Keep learning! Every expert was once a beginner.",
      "cta_text": "Try Another Quiz",
      "cta_url": "/quizzes"
    },
    {
      "min_score": 11,
      "max_score": 20,
      "title": "Trivia Enthusiast",
      "description": "Good job! You have solid general knowledge.",
      "cta_text": "Challenge Your Friends",
      "cta_url": "/share"
    },
    {
      "min_score": 21,
      "max_score": 30,
      "title": "Trivia Master",
      "description": "Excellent! You''re a true trivia champion!",
      "cta_text": "Share Your Score",
      "cta_url": "/share"
    }
  ]'::jsonb,
  '{"showScore": true, "socialSharingEnabled": true, "retakeAllowed": true}'::jsonb
),
(
  'Customer Satisfaction Survey',
  'Help us improve by sharing your experience',
  'lead_gen',
  'outcome_based',
  '[
    {
      "id": "q1",
      "type": "multiple_choice",
      "text": "How satisfied are you with our product?",
      "options": ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"],
      "outcome_mapping": {"promoter": 0, "passive": 2, "detractor": 4}
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "text": "How likely are you to recommend us to a friend?",
      "options": ["Very likely", "Likely", "Neutral", "Unlikely", "Very unlikely"],
      "outcome_mapping": {"promoter": 0, "passive": 2, "detractor": 4}
    },
    {
      "id": "q3",
      "type": "short_answer",
      "text": "What can we do to improve your experience?",
      "placeholder": "Share your thoughts..."
    }
  ]'::jsonb,
  '[
    {
      "outcome_key": "promoter",
      "title": "Thank You for Your Support!",
      "description": "We''re thrilled you love our product! Would you mind leaving us a review?",
      "cta_text": "Leave a Review",
      "cta_url": "/reviews"
    },
    {
      "outcome_key": "passive",
      "title": "Thanks for Your Feedback",
      "description": "We appreciate your input. Let us show you some features you might have missed.",
      "cta_text": "Explore Features",
      "cta_url": "/features"
    },
    {
      "outcome_key": "detractor",
      "title": "We Want to Make This Right",
      "description": "We''re sorry to hear about your experience. Let''s talk about how we can help.",
      "cta_text": "Contact Support",
      "cta_url": "/support"
    }
  ]'::jsonb,
  '{"leadCaptureEnabled": true, "leadCapturePosition": "end"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- ── Comments ──────────────────────────────────────────────────────────────────
COMMENT ON TABLE quiz_templates IS 'Pre-built quiz templates for common use cases';
COMMENT ON TABLE quiz_outcomes IS 'Custom result pages shown based on quiz performance';
COMMENT ON TABLE quiz_branching_rules IS 'Conditional logic for showing/hiding questions';
COMMENT ON TABLE quiz_analytics IS 'Daily aggregated analytics for quiz performance';
COMMENT ON TABLE quiz_question_analytics IS 'Per-question performance metrics';
COMMENT ON TABLE quiz_lead_captures IS 'Lead information captured from quiz completions';
COMMENT ON TABLE quiz_embeds IS 'Embed configurations for different display types';
COMMENT ON TABLE quiz_ab_tests IS 'A/B testing configurations for quiz variations';
COMMENT ON TABLE quiz_ab_test_results IS 'Results tracking for A/B tests';
