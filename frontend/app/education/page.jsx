'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import ModulePage from '../../components/ui/ModulePage';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import TabBar from '../../components/ui/TabBar';

const TABS = [
  { key: 'courses', label: 'Courses' },
  { key: 'students', label: 'Students' },
  { key: 'cbt', label: 'CBT' },
];

export default function EducationPage() {
  const router = useRouter();
  const [tab, setTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [c, s, e] = await Promise.all([
        apiFetch('/api/v1/lms').catch(() => ({ courses: [] })),
        apiFetch('/api/v1/school').catch(() => ({ students: [] })),
        apiFetch('/api/v1/cbt').catch(() => ({ exams: [] })),
      ]);
      setCourses(c.courses || []);
      setStudents(s.students || []);
      setExams(e.exams || []);
    } catch { toast.error('Failed to load education data'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Education" description="Manage courses, students, and exams.">
      <TabBar tabs={TABS} activeKey={tab} onChange={setTab} />
      {loading ? <SkeletonRows rows={4} /> : tab === 'courses' && (
        courses.length === 0 ? <EmptyState icon="📚" title="No courses yet" /> : (
          <div className="card-shell">{courses.map(c => (
            <div key={c.id} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{c.title||c.name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{c.students||0} students</div></div>
          ))}</div>
        )
      )}
      {tab === 'students' && (students.length === 0 ? <EmptyState icon="👨‍🎓" title="No students yet" /> : (
        <div className="card-shell">{students.map(s => (
          <div key={s.id} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{s.full_name||s.name||s.email}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{s.grade||s.class||''}</div></div>
        ))}</div>
      ))}
      {tab === 'cbt' && (exams.length === 0 ? <EmptyState icon="📝" title="No CBT exams yet" /> : (
        <div className="card-shell">{exams.map(e => (
          <div key={e.id} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{e.title||e.name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{e.questions||0} questions</div></div>
        ))}</div>
      ))}
    </ModulePage>
  );
}
