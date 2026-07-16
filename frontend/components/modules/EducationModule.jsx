'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';
import SearchInput from '../ui/SearchInput';
import Pagination from '../ui/Pagination';
import { useHotkey, useSearchHotkey } from '../../lib/hotkeys';

export default function EducationModule({ goHome }) {
  const [tab, setTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [gradeCategories, setGradeCategories] = useState([]);
  const [cbtExams, setCbtExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null);
  const [courseDraft, setCourseDraft] = useState({ title: '', description: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useSearchHotkey();
  useHotkey('n', () => { setShowForm('course'); setCourseDraft({ title: '', description: '' }); });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [co, st, at, as2, gc, cbt] = await Promise.all([
        apiFetch('/api/v1/lms/courses'),
        apiFetch('/api/v1/school/students').catch(() => { console.error('Failed to load students'); return { students: [] }; }),
        apiFetch('/api/v1/lms/attendance').catch(() => { console.error('Failed to load attendance'); return { records: [] }; }),
        apiFetch('/api/v1/lms/attendance/stats').catch(() => { console.error('Failed to load attendance stats'); return { stats: null }; }),
        apiFetch('/api/v1/lms/grade-categories').catch(() => { console.error('Failed to load grade categories'); return { categories: [] }; }),
        apiFetch('/api/v1/cbt/quizzes').catch(() => { console.error('Failed to load CBT quizzes'); return { quizzes: [] }; }),
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
      await apiFetch('/api/v1/lms/courses', { method: 'POST', body: JSON.stringify(courseDraft) });
      toast.success('Course created');
      setShowForm(null); setCourseDraft({ title: '', description: '' }); load();
    } catch (err) { toast.error(err.message); }
  }

  function exportCsv(items, filename) {
    if (!items.length) return toast.error('Nothing to export');
    const cols = Object.keys(items[0]).filter(k => !['id','org_id'].includes(k));
    const csv = [cols.join(','), ...items.map(r => cols.map(c => `"${String(r[c]||'')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${filename}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(blob);
    toast.success('CSV exported');
  }

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(c => (c.title||'').toLowerCase().includes(q) || (c.description||'').toLowerCase().includes(q));
  }, [courses, search]);
  const cp = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));

  const filteredCbt = useMemo(() => {
    if (!search.trim() || tab !== 'cbt') return cbtExams;
    const q = search.toLowerCase();
    return cbtExams.filter(e => (e.title||'').toLowerCase().includes(q));
  }, [cbtExams, search, tab]);

  useEffect(() => { setPage(1); }, [search, tab]);

  const activeData = tab === 'courses' ? filteredCourses : tab === 'cbt' ? filteredCbt : tab === 'attendance' ? attendance : gradeCategories;

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Education Suite</h1>
          <p className="module-sub">LMS, CBT, assignments, attendance, gradebook, portals. <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘N new</kbd> <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘F search</kbd></p>
        </div>
      </div>
      {attendanceStats && (
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{attendanceStats.total || 0}</div><div className="stat-label">Records</div></div>
          <div className="stat-card"><div className="stat-value" style={{color:'var(--success)'}}>{attendanceStats.present || 0}</div><div className="stat-label">Present</div></div>
          <div className="stat-card"><div className="stat-value" style={{color:'var(--danger)'}}>{attendanceStats.absent || 0}</div><div className="stat-label">Absent</div></div>
          <div className="stat-card"><div className="stat-value">{courses.length}</div><div className="stat-label">Courses</div></div>
        </div>
      )}
      <div className="invoice-tabs" style={{marginBottom:16,flexWrap:'wrap'}}>
        {[{k:'courses',l:'Courses'},{k:'cbt',l:'CBT Exams'},{k:'attendance',l:'Attendance'},{k:'gradebook',l:'Gradebook'},{k:'portals',l:'Portals'}].map(t=>(
          <button key={t.k} className={`invoice-tab${tab===t.k?' active':''}`} onClick={()=>setTab(t.k)}>{t.l}</button>
        ))}
      </div>

      {loading ? <SkeletonRows rows={5} /> : (
        <>
          {tab === 'courses' && (
            <>
              <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
                <Button onClick={()=>{setShowForm('course');setCourseDraft({title:'',description:''});}}>+ New Course</Button>
                <Button variant="secondary" size="sm" onClick={() => exportCsv(courses, 'courses')}>📥 CSV</Button>
              </div>
              {courses.length > 0 && <SearchInput value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses…" data-hotkey-search style={{marginBottom:12}} />}
              <Modal isOpen={showForm==='course'} title="Create Course" onClose={()=>setShowForm(null)}>
                <form onSubmit={createCourse}>
                  <div className="field"><label className="field-label">Title</label><input className="field-input" value={courseDraft.title} onChange={e=>setCourseDraft({...courseDraft,title:e.target.value})} required autoFocus /></div>
                  <div className="field"><label className="field-label">Description</label><textarea className="field-input" value={courseDraft.description} onChange={e=>setCourseDraft({...courseDraft,description:e.target.value})} rows={3} /></div>
                  <div style={{display:'flex',gap:8}}><Button type="submit">Create</Button><Button variant="secondary" type="button" onClick={()=>setShowForm(null)}>Cancel</Button></div>
                </form>
              </Modal>
              {courses.length === 0 ? <EmptyState icon="📚" title="No courses yet" action={<Button onClick={()=>{setShowForm('course');setCourseDraft({title:'',description:''});}}>+ New Course</Button>} /> : (
                <>
                  <div className="table-wrap"><table className="data-table">
                    <thead><tr><th>Title</th><th>Students</th><th>Lessons</th><th>Progress</th></tr></thead>
                    <tbody>{filteredCourses.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(c=>(
                      <tr key={c.id}><td style={{fontWeight:600}}>{c.title}</td><td>{c.student_count||0}</td><td>{c.lesson_count||0}</td><td>{c.progress||0}%</td></tr>
                    ))}</tbody>
                  </table></div>
                  {cp>1 && <Pagination page={page} pageCount={cp} total={filteredCourses.length} pageSize={PAGE_SIZE} onPageChange={setPage} />}
                </>
              )}
            </>
          )}

          {tab === 'cbt' && (
            <>
              {cbtExams.length > 0 && <SearchInput value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exams…" data-hotkey-search style={{marginBottom:12}} />}
              {cbtExams.length === 0 ? <EmptyState icon="📝" title="No CBT exams yet" description="Create timed exams with randomized questions." /> : (
                <div className="table-wrap"><table className="data-table">
                  <thead><tr><th>Title</th><th>Duration</th><th>Questions</th><th>Pass %</th><th>Status</th></tr></thead>
                  <tbody>{filteredCbt.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(e=>(
                    <tr key={e.id}><td style={{fontWeight:600}}>{e.title}</td><td>{e.duration_minutes}m</td><td>{e.question_count||0}</td><td>{e.pass_percentage||0}%</td><td><Badge variant={e.status==='published'?'success':'neutral'}>{e.status}</Badge></td></tr>
                  ))}</tbody>
                </table></div>
              )}
            </>
          )}

          {tab === 'attendance' && (
            <>
              {attendance.length === 0 ? <EmptyState icon="📋" title="No attendance records yet" /> : (
                <div className="table-wrap"><table className="data-table">
                  <thead><tr><th>Student</th><th>Date</th><th>Status</th><th>Late (min)</th><th>Course</th></tr></thead>
                  <tbody>{attendance.map(a=>(
                    <tr key={a.id}><td style={{fontWeight:600}}>{a.student_name}</td>
                      <td style={{fontSize:'0.8rem'}}>{a.date?.slice(0,10)}</td>
                      <td><Badge variant={a.status==='present'?'success':a.status==='absent'?'danger':a.status==='late'?'warning':'neutral'}>{a.status}</Badge></td>
                      <td>{a.minutes_late||0}</td>
                      <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{a.course_name||'—'}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </>
          )}

          {tab === 'gradebook' && (
            gradeCategories.length === 0 ? <EmptyState icon="📊" title="No grade categories yet" /> : (
              <div className="table-wrap"><table className="data-table">
                <thead><tr><th>Category</th><th>Course</th><th>Weight</th><th>Max Score</th></tr></thead>
                <tbody>{gradeCategories.map(g=>(
                  <tr key={g.id}><td style={{fontWeight:600}}>{g.name}</td><td style={{fontSize:'0.8rem'}}>{g.course_name||g.course_id?.slice(0,8)}</td><td>{g.weight}%</td><td>{g.max_score||'—'}</td></tr>
                ))}</tbody>
              </table></div>
            )
          )}

          {tab === 'portals' && (
            <div style={{display:'grid',gap:12}}>
              {[{slug:'student-portal',label:'Student Portal',desc:'Course progress, grades, attendance view for students.',icon:'🎓'},{slug:'parent-portal',label:'Parent Portal',desc:'Read-only child progress dashboard.',icon:'👨‍👩‍👧'},{slug:'teacher-portal',label:'Teacher Portal',desc:'Class management, grading, and attendance marking.',icon:'👨‍🏫'}].map(p=>(
                <div key={p.slug} className="card" style={{padding:16,display:'flex',flexDirection:'column',gap:4}}>
                  <div style={{fontSize:'1.2rem'}}>{p.icon}</div>
                  <div style={{fontWeight:600,fontSize:'0.95rem'}}>{p.label}</div>
                  <div style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>{p.desc}</div>
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
