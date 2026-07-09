-- Education Suite upgrades: attendance tracker, gradebook with weighted categories, progress dashboard

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES school_classes(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','excused')),
  minutes_late INT DEFAULT 0,
  notes TEXT,
  marked_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, class_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(org_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id, date);

CREATE TABLE IF NOT EXISTS grade_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID REFERENCES lms_courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight NUMERIC(5,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grade_cat_course ON grade_categories(course_id);

ALTER TABLE lms_courses ADD COLUMN IF NOT EXISTS grade_categories_json JSONB DEFAULT '[]';
ALTER TABLE school_assignments ADD COLUMN IF NOT EXISTS grade_category_id UUID REFERENCES grade_categories(id) ON DELETE SET NULL;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS grade NUMERIC(5,2);
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS max_grade NUMERIC(5,2) DEFAULT 100;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES users(id);
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES lms_courses(id) ON DELETE CASCADE,
  overall_grade NUMERIC(5,2),
  attendance_pct NUMERIC(5,2),
  lessons_completed INT DEFAULT 0,
  total_lessons INT DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id);
