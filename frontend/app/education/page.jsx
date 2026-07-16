'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import TabBar from '../../components/ui/TabBar';

const TABS = [
  { key: 'courses', label: 'Courses' },
  { key: 'students', label: 'Students' },
  { key: 'attendance', label: 'Attendance' },
];

export default function LmsPage() {
  const router = useRouter();
  const [tab, setTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', level: 'beginner' });

  const load = useCallback(async () => {
    try {
      const [c, s, a] = await Promise.all([
        apiFetch('/api/v1/lms/courses').catch(() => ({ courses: [] })),
        apiFetch('/api/v1/school/students').catch(() => ({ students: [] })),
        apiFetch('/api/v1/lms/attendance').catch(() => ({ records: [] })),
      ]);
      setCourses(c.courses || []);
      setStudents(s.students || []);
      setAttendance(a.records || []);
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await apiFetch('/api/v1/lms/courses', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Course created!'); setShowForm(false); setForm({title:'',description:'',category:'',level:'beginner'});
      const d = await apiFetch('/api/v1/lms/courses'); setCourses(d.courses || []);
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/')}>← Back</button>
      <div className="module-head"><h1>Education &amp; LMS</h1><p className="module-sub">Manage courses, students, and attendance.</p></div>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {loading ? <SkeletonRows rows={4} /> : tab === 'courses' && (
        <div>
          <Button onClick={() => setShowForm(true)} style={{margin:'16px 0'}}>+ New course</Button>
          {courses.length === 0 ? <EmptyState icon="📚" title="No courses yet" /> : (
            <div className="card-shell">{courses.map(c => (
              <div key={c.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
                <div style={{fontWeight:600}}>{c.title}</div>
                <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{c.lesson_count||0} lessons · {c.enrollment_count||0} enrolled · <Badge>{c.level||'beginner'}</Badge></div>
              </div>
            ))}</div>
          )}
        </div>
      )}
      {tab === 'students' && (students.length === 0 ? <EmptyState icon="👨‍🎓" title="No students" /> : (
        <div className="card-shell">{students.map(s => (
          <div key={s.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
            <div style={{fontWeight:600}}>{s.full_name}</div>
            <div style={{fontSize:12,color:'var(--text-muted)'}}>{s.email} · {s.class_name||'—'}</div>
          </div>
        ))}</div>
      ))}
      {tab === 'attendance' && (attendance.length === 0 ? <EmptyState icon="📋" title="No attendance records" /> : (
        <div className="card-shell">{attendance.map(a => (
          <div key={a.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
            <div style={{fontWeight:600}}>{a.student_name}</div>
            <div style={{fontSize:12,color:'var(--text-muted)'}}>{a.status} · {new Date(a.date).toLocaleDateString()}</div>
          </div>
        ))}</div>
      ))}
      {showForm && (<Modal isOpen title="New course" onClose={() => setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Title</label><input className="field-input" value={form.title} onChange={e => setForm({...form,title:e.target.value})} /></div>
        <div className="field"><label className="field-label">Description</label><textarea className="field-textarea" rows={3} value={form.description} onChange={e => setForm({...form,description:e.target.value})} /></div>
        <div className="field"><label className="field-label">Category</label><input className="field-input" value={form.category} onChange={e => setForm({...form,category:e.target.value})} /></div>
        <div className="field"><label className="field-label">Level</label><select className="field-select" value={form.level} onChange={e => setForm({...form,level:e.target.value})}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
      </form></Modal>)}
    </div>
  );
}
