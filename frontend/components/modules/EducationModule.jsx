'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';

export default function EducationModule({ goHome }) {
  const [tab, setTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [gradeCategories, setGradeCategories] = useState([]);
  const [cbtExams, setCbtExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null);
  const [courseDraft, setCourseDraft] = useState({ title: '', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [co, st, at, as2, gc, cbt] = await Promise.all([
        apiFetch('/api/v1/lms/courses'),
        apiFetch('/api/v1/school/students'),
        apiFetch('/api/v1/lms/attendance'),
        apiFetch('/api/v1/lms/attendance/stats'),
        apiFetch('/api/v1/lms/grade-categories'),
        apiFetch('/api/v1/cbt/quizzes'),
      ]);
      setCourses(co.courses || []);
      setStudents(st.students || []);
      setAttendance(at.records || []);
      setAttendanceStats(as2.stats || null);
      setGradeCategories(gc.categories || []);
      setCbtExams(cbt.quizzes || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createCourse(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/courses', { method: 'POST', body: JSON.stringify(courseDraft) });
      toast.success('Course created');
      setShowForm(null); setCourseDraft({ title: '', description: '' }); load();
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>Education Suite</h1>
        <p className="module-sub">Learning management, CBT, assignments, attendance, gradebook, and portals.</p>
      </div>
      {attendanceStats && (
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{attendanceStats.total || 0}</div><div className="stat-label">Records</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{attendanceStats.present || 0}</div><div className="stat-label">Present</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--danger)' }}>{attendanceStats.absent || 0}</div><div className="stat-label">Absent</div></div>
          <div className="stat-card"><div className="stat-value">{courses.length}</div><div className="stat-label">Courses</div></div>
        </div>
      )}
      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        {[{ k: 'courses', l: 'Courses' }, { k: 'cbt', l: 'CBT Exams' }, { k: 'attendance', l: 'Attendance' }, { k: 'gradebook', l: 'Gradebook' }, { k: 'portals', l: 'Portals' }].map((t) => (
          <button key={t.k} className={`invoice-tab${tab === t.k ? ' active' : ''}`} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>
      {loading ? <SkeletonRows rows={5} /> : (
        <>
          {tab === 'courses' && (
            <>
              <Button onClick={() => setShowForm('course')}>+ New Course</Button>
              <Modal isOpen={showForm === 'course'} title="Create Course" onClose={() => setShowForm(null)}>
                <form onSubmit={createCourse}>
                  <div className="field"><label className="field-label">Title</label><input className="field-input" value={courseDraft.title} onChange={(e) => setCourseDraft({...courseDraft,title:e.target.value})} required /></div>
                  <div className="field"><label className="field-label">Description</label><textarea className="field-input" value={courseDraft.description} onChange={(e) => setCourseDraft({...courseDraft,description:e.target.value})} rows={3} /></div>
                  <Button type="submit">Create</Button>
                </form>
              </Modal>
              {courses.length === 0 ? <EmptyState icon="📚" title="No courses yet" action={<Button onClick={() => setShowForm('course')}>+ New Course</Button>} /> : (
                <div className="table-wrap"><table className="data-table">
                  <thead><tr><th>Title</th><th>Students</th><th>Progress</th></tr></thead>
                  <tbody>{courses.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.title}</td>
                      <td>{c.student_count || 0}</td>
                      <td>{c.progress || 0}%</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </>
          )}
          {tab === 'cbt' && (
            cbtExams.length === 0 ? <EmptyState icon="📝" title="No CBT exams yet" description="Create timed exams with randomized questions." /> : (
              <div className="table-wrap"><table className="data-table">
                <thead><tr><th>Title</th><th>Duration</th><th>Questions</th><th>Status</th></tr></thead>
                <tbody>{cbtExams.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.title}</td>
                    <td>{e.duration_minutes}m</td>
                    <td>{e.question_count || 0}</td>
                    <td><Badge variant={e.status === 'published' ? 'success' : 'neutral'}>{e.status}</Badge></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )
          )}
          {tab === 'attendance' && (
            <>
              <Button onClick={() => setShowForm('attendance')}>+ Mark Attendance</Button>
              {attendance.length === 0 ? <EmptyState icon="📋" title="No attendance records yet" /> : (
                <div className="table-wrap"><table className="data-table">
                  <thead><tr><th>Student</th><th>Date</th><th>Status</th><th>Late (min)</th></tr></thead>
                  <tbody>{attendance.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.student_name}</td>
                      <td style={{ fontSize: '0.8rem' }}>{a.date?.slice(0, 10)}</td>
                      <td><Badge variant={a.status === 'present' ? 'success' : a.status === 'absent' ? 'danger' : a.status === 'late' ? 'warning' : 'neutral'}>{a.status}</Badge></td>
                      <td>{a.minutes_late || 0}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </>
          )}
          {tab === 'gradebook' && (
            gradeCategories.length === 0 ? <EmptyState icon="📊" title="No grade categories yet" /> : (
              <div className="table-wrap"><table className="data-table">
                <thead><tr><th>Category</th><th>Course</th><th>Weight</th></tr></thead>
                <tbody>{gradeCategories.map((g) => (
                  <tr key={g.id}><td style={{ fontWeight: 600 }}>{g.name}</td><td>{g.course_name || g.course_id?.slice(0, 8)}</td><td>{g.weight}%</td></tr>
                ))}</tbody>
              </table></div>
            )
          )}
          {tab === 'portals' && (
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { slug: 'student-portal', label: 'Student Portal', desc: 'Course progress, grades, attendance view for students.' },
                { slug: 'parent-portal', label: 'Parent Portal', desc: 'Read-only child progress dashboard.' },
                { slug: 'teacher-portal', label: 'Teacher Portal', desc: 'Class management, grading, and attendance marking.' },
              ].map((p) => (
                <div key={p.slug} className="card" style={{ padding: 16 }}>
                  <div style={{ fontWeight: 600 }}>{p.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{p.desc}</div>
                  <Badge variant="info">API ready</Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
