-- Attendance & Grade Book for School Management
CREATE TABLE IF NOT EXISTS attendance_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id   UUID REFERENCES school_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES school_students(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  status     TEXT NOT NULL DEFAULT 'present', -- present | absent | late | excused
  marked_by  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, date)
);

CREATE TABLE IF NOT EXISTS grade_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id        UUID REFERENCES school_classes(id) ON DELETE CASCADE,
  subject_id      UUID REFERENCES school_subjects(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES school_students(id) ON DELETE CASCADE,
  term            TEXT NOT NULL,
  assessment_type TEXT NOT NULL DEFAULT 'Test',
  score           NUMERIC NOT NULL,
  max_score       NUMERIC NOT NULL DEFAULT 100,
  weight          NUMERIC NOT NULL DEFAULT 1,
  recorded_by     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_records (class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records (student_id);
CREATE INDEX IF NOT EXISTS idx_grade_student ON grade_records (student_id);
CREATE INDEX IF NOT EXISTS idx_grade_class_term ON grade_records (class_id, term);
