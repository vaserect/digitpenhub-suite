-- School structure
CREATE TABLE IF NOT EXISTS school_classes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  grade_level  TEXT,
  academic_year TEXT DEFAULT '2024/2025',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_teachers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  subjects   JSONB DEFAULT '[]',
  status     TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_students (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id       UUID REFERENCES school_classes(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  student_no     TEXT,
  parent_email   TEXT,
  parent_phone   TEXT,
  date_of_birth  DATE,
  gender         TEXT,
  status         TEXT DEFAULT 'active',
  enrolled_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_subjects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id   UUID REFERENCES school_classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES school_teachers(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  code       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LMS
CREATE TABLE IF NOT EXISTS lms_courses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT DEFAULT 'General',
  level       TEXT DEFAULT 'Beginner',
  thumbnail   TEXT,
  instructor  TEXT,
  duration    TEXT,
  status      TEXT DEFAULT 'draft',
  enrolled    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lms_lessons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT,
  content_type TEXT DEFAULT 'text',
  duration_mins INTEGER DEFAULT 0,
  order_num    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lms_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  student_name  TEXT NOT NULL,
  student_email TEXT,
  progress      INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'active',
  enrolled_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- Assignments
CREATE TABLE IF NOT EXISTS school_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id     UUID REFERENCES school_classes(id) ON DELETE SET NULL,
  subject_id   UUID REFERENCES school_subjects(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  instructions TEXT,
  due_date     DATE,
  max_score    INTEGER DEFAULT 100,
  status       TEXT DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES school_assignments(id) ON DELETE CASCADE,
  student_id    UUID REFERENCES school_students(id) ON DELETE SET NULL,
  student_name  TEXT,
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  score         INTEGER,
  feedback      TEXT,
  file_url      TEXT,
  status        TEXT DEFAULT 'submitted'
);

-- CBT
CREATE TABLE IF NOT EXISTS cbt_quizzes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id         UUID REFERENCES school_classes(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  duration_minutes INTEGER DEFAULT 30,
  pass_score       INTEGER DEFAULT 50,
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cbt_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID NOT NULL REFERENCES cbt_quizzes(id) ON DELETE CASCADE,
  question       TEXT NOT NULL,
  option_a       TEXT,
  option_b       TEXT,
  option_c       TEXT,
  option_d       TEXT,
  correct_answer TEXT NOT NULL,
  marks          INTEGER DEFAULT 1,
  order_num      INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cbt_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id      UUID NOT NULL REFERENCES cbt_quizzes(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_id   UUID REFERENCES school_students(id) ON DELETE SET NULL,
  score        INTEGER DEFAULT 0,
  total_marks  INTEGER DEFAULT 0,
  passed       BOOLEAN DEFAULT FALSE,
  answers      JSONB DEFAULT '{}',
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  finished_at  TIMESTAMPTZ,
  status       TEXT DEFAULT 'completed'
);

-- Online Store Builder
CREATE TABLE IF NOT EXISTS store_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  store_name    TEXT DEFAULT 'My Store',
  tagline       TEXT,
  logo_url      TEXT,
  banner_url    TEXT,
  theme         TEXT DEFAULT 'modern',
  primary_color TEXT DEFAULT '#2563eb',
  currency      TEXT DEFAULT 'NGN',
  contact_email TEXT,
  contact_phone TEXT,
  address       TEXT,
  social        JSONB DEFAULT '{}',
  is_published  BOOLEAN DEFAULT FALSE,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
