'use client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import PostEditor from './PostEditor';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const VIEWS = ['month', 'week', 'day'];

// ─── helpers ────────────────────────────────────────────────────

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addDays(d, n)   { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function daysInMonth(d)  { return endOfMonth(d).getDate(); }
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate();
}
function formatDate(d) { return d.toISOString().split('T')[0]; }
function formatTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const PLATFORM_COLORS = {
  facebook:  '#1877F2',
  instagram: '#E4405F',
  twitter:   '#000000',
  linkedin:  '#0A66C2',
  tiktok:    '#000000',
  youtube:   '#FF0000',
  pinterest: '#BD081C',
};

// ─── Component ──────────────────────────────────────────────────

export default function ContentCalendar() {
  const [view, setView] = useState('month');
  const [today] = useState(new Date());
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [draggedId, setDraggedId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [platforms, setPlatforms] = useState([]);

  // ── Fetch events ──────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let from, to;
      if (view === 'month') {
        const first = startOfMonth(cursor);
        const last = endOfMonth(cursor);
        // Extend range to include padding days
        from = addDays(first, -first.getDay()).toISOString();
        to = addDays(last, 6 - last.getDay()).toISOString();
      } else if (view === 'week') {
        const start = new Date(cursor);
        start.setDate(start.getDate() - start.getDay());
        from = start.toISOString();
        to = addDays(start, 7).toISOString();
      } else {
        from = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()).toISOString();
        to = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 23, 59, 59).toISOString();
      }

      const params = new URLSearchParams({ from, to });
      if (filterPlatform) params.set('platformId', filterPlatform);
      // Filtering by status on client side after fetch is simpler

      const res = await apiFetch(`/api/v1/social-media/calendar?${params}`);
      setEvents(res.events || []);
    } catch (err) {
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [view, cursor, filterPlatform]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Load platforms for filter
  useEffect(() => {
    apiFetch('/api/v1/social-media/accounts')
      .then(res => {
        const unique = {};
        (res.accounts || []).forEach(a => { unique[a.platform_slug] = a.platform_name; });
        setPlatforms(Object.entries(unique).map(([slug, name]) => ({ slug, name })));
      })
      .catch(() => {});
  }, []);

  // ── Navigation ────────────────────────────────────────

  const goPrev = () => {
    if (view === 'month') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    else if (view === 'week') setCursor(addDays(cursor, -7));
    else setCursor(addDays(cursor, -1));
  };

  const goNext = () => {
    if (view === 'month') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    else if (view === 'week') setCursor(addDays(cursor, 7));
    else setCursor(addDays(cursor, 1));
  };

  const goToday = () => setCursor(new Date());

  // ── Drag & drop ───────────────────────────────────────

  const onDragStart = (e, targetId) => {
    setDraggedId(targetId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', targetId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = async (e, day) => {
    e.preventDefault();
    const targetId = e.dataTransfer.getData('text/plain');
    if (!targetId) return;

    // Get existing scheduled time and preserve the time portion
    const event = events.find(ev => ev.target_id === targetId);
    if (!event) return;

    const oldDate = new Date(event.scheduled_at);
    const newDate = new Date(day);
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    // Optimistically update UI
    setEvents(prev =>
      prev.map(ev =>
        ev.target_id === targetId
          ? { ...ev, scheduled_at: newDate.toISOString() }
          : ev
      )
    );

    try {
      await apiFetch('/api/v1/social-media/calendar/reschedule', {
        method: 'PUT',
        body: JSON.stringify({ targetId, scheduledAt: newDate.toISOString() }),
      });
      toast.success('Post rescheduled');
    } catch (err) {
      toast.error('Failed to reschedule');
      fetchEvents(); // Revert on failure
    } finally {
      setDraggedId(null);
    }
  };

  // ── Edit post ─────────────────────────────────────────

  const openEditor = (postId) => {
    // Find the post from events
    const event = events.find(e => e.post_id === postId);
    if (event) {
      setEditingPost({
        id: event.post_id,
        contentText: event.content_text,
        postType: event.post_type,
        status: event.post_status,
        scheduledAt: event.scheduled_at,
        accountId: event.account_id,
        platformSlug: event.platform_slug,
      });
      setShowEditor(true);
    }
  };

  const onEditorClose = () => {
    setShowEditor(false);
    setEditingPost(null);
    fetchEvents();
  };

  // ── Filtered events ───────────────────────────────────

  const filteredEvents = events.filter(e => {
    if (filterStatus && e.post_status !== filterStatus) return false;
    if (filterPlatform && e.platform_slug !== filterPlatform) return false;
    return true;
  });

  const eventsForDay = (day) =>
    filteredEvents.filter(e => isSameDay(new Date(e.scheduled_at), day))
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  // ── Render: Day cell ──────────────────────────────────

  const DayCell = ({ day, isCurrentMonth, isToday: isTodayFlag }) => (
    <div
      className={`cal-day ${!isCurrentMonth ? 'cal-day-other' : ''} ${isTodayFlag ? 'cal-day-today' : ''}`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, day)}
      style={{
        minHeight: view === 'month' ? 100 : 120,
        backgroundColor: isTodayFlag ? '#f8faff' : 'white',
        border: '1px solid #e2e8f0',
        borderTop: isTodayFlag ? '2px solid #2563eb' : '1px solid #e2e8f0',
        padding: 4, position: 'relative', cursor: 'default',
        opacity: isCurrentMonth ? 1 : 0.4,
      }}
    >
      <div style={{
        fontSize: 11, fontWeight: isTodayFlag ? 700 : 500,
        color: isTodayFlag ? '#2563eb' : '#64748b',
        marginBottom: 2, padding: '2px 4px',
      }}>
        {day.getDate()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {eventsForDay(day).slice(0, view === 'month' ? 3 : 8).map(ev => (
          <div
            key={ev.target_id}
            draggable
            onDragStart={(e) => onDragStart(e, ev.target_id)}
            onClick={() => openEditor(ev.post_id)}
            style={{
              padding: '2px 6px', borderRadius: 4, cursor: 'grab', fontSize: 11,
              backgroundColor: (PLATFORM_COLORS[ev.platform_slug] || '#666') + '18',
              borderLeft: `3px solid ${PLATFORM_COLORS[ev.platform_slug] || '#666'}`,
              color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              opacity: ev.post_status === 'draft' ? 0.6 : 1,
            }}
            title={`${ev.account_name}: ${ev.content_text?.substring(0, 80) || 'No content'}`}
          >
            <span style={{ fontWeight: 600 }}>
              {ev.platform_slug === 'instagram' ? 'IG' :
               ev.platform_slug === 'facebook' ? 'FB' :
               ev.platform_slug === 'twitter' ? 'X' :
               ev.platform_slug === 'linkedin' ? 'LI' :
               ev.platform_slug?.[0]?.toUpperCase() || '?'}
            </span>
            {' '}{ev.content_text?.substring(0, view === 'month' ? 30 : 60) || 'No content'}
            {view !== 'month' && <span style={{ color: '#94a3b8', marginLeft: 4 }}>
              {formatTime(new Date(ev.scheduled_at))}
            </span>}
          </div>
        ))}
        {view !== 'month' && eventsForDay(day).length > 8 && (
          <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
            +{eventsForDay(day).length - 8} more
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Monthly view ──────────────────────────────

  const renderMonth = () => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const startPad = first.getDay(); // days before 1st
    const totalDays = daysInMonth(cursor);

    const cells = [];
    // Padding days from previous month
    for (let i = startPad - 1; i >= 0; i--) {
      const d = addDays(first, -i - 1);
      cells.push(<DayCell key={`pad-${i}`} day={d} isCurrentMonth={false} isToday={isSameDay(d, today)} />);
    }
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), i);
      cells.push(<DayCell key={i} day={d} isCurrentMonth={true} isToday={isSameDay(d, today)} />);
    }

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.slice(i, i + 7)}
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 0 }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{
              padding: '6px 4px', fontSize: 11, fontWeight: 600, color: '#64748b',
              textAlign: 'center', borderBottom: '1px solid #e2e8f0',
            }}>{d}</div>
          ))}
        </div>
        {rows}
      </div>
    );
  };

  // ── Render: Weekly view ───────────────────────────────

  const renderWeek = () => {
    const start = new Date(cursor);
    start.setDate(start.getDate() - start.getDay());
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days.map(d => (
          <DayCell key={d.toISOString()} day={d} isCurrentMonth={d.getMonth() === cursor.getMonth()} isToday={isSameDay(d, today)} />
        ))}
      </div>
    );
  };

  // ── Render: Daily view ────────────────────────────────

  const renderDay = () => {
    const dayEvents = eventsForDay(cursor).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

    return (
      <div>
        <div style={{
          padding: '8px 12px', backgroundColor: '#f8faff', borderRadius: 8, marginBottom: 12,
          border: '1px solid #dbeafe',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{cursor.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{dayEvents.length} scheduled post(s)</div>
        </div>

        {dayEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No posts scheduled for this day.</div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 60 }}>
            {/* Time gutter */}
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} style={{
                position: 'absolute', left: 0, top: i * 60, fontSize: 11, color: '#94a3b8',
                width: 50, textAlign: 'right', paddingRight: 8, borderTop: '1px solid #f1f5f9', paddingTop: 2,
              }}>
                {String(i).padStart(2, '0')}:00
              </div>
            ))}
            {/* Events */}
            <div style={{ minHeight: 24 * 60 }}>
              {dayEvents.map(ev => {
                const d = new Date(ev.scheduled_at);
                const top = d.getHours() * 60 + d.getMinutes();
                return (
                  <div
                    key={ev.target_id}
                    draggable
                    onDragStart={(e) => onDragStart(e, ev.target_id)}
                    onClick={() => openEditor(ev.post_id)}
                    style={{
                      position: 'absolute', left: 0, right: 0, top, minHeight: 40,
                      margin: '2px 4px', padding: '6px 10px', borderRadius: 6, cursor: 'grab',
                      backgroundColor: (PLATFORM_COLORS[ev.platform_slug] || '#666') + '15',
                      borderLeft: `3px solid ${PLATFORM_COLORS[ev.platform_slug] || '#666'}`,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.account_name}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                      {ev.content_text?.substring(0, 100) || 'No content'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {formatTime(d)} · {ev.platform_name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────

  const title = view === 'month'
    ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
    : view === 'week'
    ? `Week of ${cursor.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`
    : cursor.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div>
      <div className="module-head" style={{ marginBottom: 16 }}>
        <div>
          <h2>Content Calendar</h2>
          <p className="module-sub">Drag posts to reschedule · Click to edit</p>
        </div>
        <PostEditor onDone={onEditorClose} />
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <button className="ctag" onClick={goPrev}>←</button>
        <button className="ctag" onClick={goToday} style={{ fontWeight: 600 }}>Today</button>
        <button className="ctag" onClick={goNext}>→</button>

        <span style={{ fontWeight: 700, fontSize: 16, marginLeft: 8, minWidth: 200 }}>{title}</span>

        <div style={{ flex: 1 }} />

        {/* View switcher */}
        {VIEWS.map(v => (
          <button key={v} className="ctag"
            style={{
              padding: '4px 14px', borderRadius: 6,
              backgroundColor: view === v ? '#2563eb' : '#f1f5f9',
              color: view === v ? 'white' : '#475569', fontWeight: 600, fontSize: 13,
              border: 'none',
            }}
            onClick={() => setView(v)}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}

        <div style={{ width: 1, height: 24, backgroundColor: '#e2e8f0', margin: '0 4px' }} />

        {/* Platform filter */}
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
          <option value="">All platforms</option>
          {platforms.map(p => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Calendar grid */}
      {loading ? <SkeletonRows rows={6} /> : (
        filteredEvents.length === 0
          ? <EmptyState icon="📅" title="No scheduled posts" description="Create and schedule a post to see it here." />
          : view === 'month' ? renderMonth()
          : view === 'week' ? renderWeek()
          : renderDay()
      )}

      {/* Post editor modal */}
      {showEditor && editingPost && (
        <PostEditor
          editPost={editingPost}
          onDone={onEditorClose}
        />
      )}
    </div>
  );
}
