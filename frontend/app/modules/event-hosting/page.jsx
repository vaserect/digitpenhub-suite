'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';
import Button from '../../../components/ui/Button';
import StatCard from '../../../components/ui/StatCard';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import { 
  Calendar, Video, Users, Plus, RefreshCw, Clock, MapPin, 
  Tv, Award, CheckCircle, ExternalLink
} from 'lucide-react';

export default function EventHostingPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  
  const [eventDraft, setEventDraft] = useState({
    title: '',
    description: '',
    eventType: 'webinar', // webinar | in_person
    startAt: '',
    endAt: '',
    maxAttendees: 100,
    videoUrl: ''
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/v1/green-modules/events');
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error loading events:', err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/green-modules/events', {
        method: 'POST',
        body: JSON.stringify(eventDraft)
      });
      if (res.event) {
        toast.success('Event scheduled successfully!');
        setShowEventModal(false);
        setEventDraft({
          title: '',
          description: '',
          eventType: 'webinar',
          startAt: '',
          endAt: '',
          maxAttendees: 100,
          videoUrl: ''
        });
        loadEvents();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to schedule event');
    }
  };

  const handleRegister = async (eventId) => {
    try {
      const res = await apiFetch(`/api/v1/green-modules/events/${eventId}/register`, {
        method: 'POST'
      });
      if (res.attendee) {
        toast.success('Successfully registered for this event!');
        loadEvents();
      }
    } catch (err) {
      toast.error('Registration failed');
    }
  };

  // KPIs
  const totalAttendees = events.reduce((sum, e) => sum + (e.attendee_count || 0), 0);
  const upcomingCount = events.filter(e => new Date(e.start_at) > new Date()).length;
  const liveCount = events.filter(e => {
    const now = new Date();
    return new Date(e.start_at) <= now && (!e.end_at || new Date(e.end_at) >= now);
  }).length;

  return (
    <div className="module-wrap">
      <div className="module-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-link" onClick={() => window.location.href = '/'}>← Back</button>
          <Tv className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold">Event & Webinar Hosting</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={loadEvents}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" onClick={() => setShowEventModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Schedule Event
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
        <StatCard label="Total Events Hosted" value={events.length} />
        <StatCard label="Registered Attendees" value={totalAttendees} />
        <StatCard label="Upcoming Events" value={upcomingCount} />
        <StatCard label="Currently Live" value={liveCount} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted">Retrieving webinar streams and seminar agendas...</p>
        </div>
      ) : events.length === 0 ? (
        <EmptyState title="No events or webinars scheduled yet" action={<Button onClick={() => setShowEventModal(true)}>+ Schedule Event</Button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {events.map(event => {
            const isWebinar = event.event_type === 'webinar';
            const startDate = new Date(event.start_at);
            const isUpcoming = startDate > new Date();

            return (
              <div 
                key={event.id}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Badge variant={isWebinar ? 'default' : 'secondary'}>
                      {isWebinar ? 'Webinar' : 'In Person'}
                    </Badge>
                    {isUpcoming ? (
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Upcoming
                      </span>
                    ) : (
                      <span className="text-xs text-green-600 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Active / Past
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold" style={{ margin: 0 }}>{event.title}</h3>
                  <p className="text-sm text-muted mt-1" style={{ maxWidth: '600px' }}>{event.description || 'No description provided.'}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar className="w-4 h-4" />
                      <span>{startDate.toLocaleString()}</span>
                    </div>
                    {event.max_attendees && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users className="w-4 h-4" />
                        <span>Max Capacity: {event.max_attendees} ({event.attendee_count} Registered)</span>
                      </div>
                    )}
                    {event.video_url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Video className="w-4 h-4" />
                        <a href={event.video_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold inline-flex items-center gap-0.5">
                          Stream Link <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  {event.my_status === 'registered' ? (
                    <Badge variant="success">Registered ✓</Badge>
                  ) : (
                    <Button onClick={() => handleRegister(event.id)}>
                      Register for Event
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE EVENT MODAL */}
      <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title="Schedule New Webinar / Event">
        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Event Title</label>
            <input 
              type="text" 
              className="form-input w-full" 
              placeholder="e.g. Masterclass: Dynamic Lead Generation" 
              value={eventDraft.title}
              onChange={e => setEventDraft(p => ({ ...p, title: e.target.value }))}
              required 
            />
          </div>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Description</label>
            <textarea 
              className="form-input w-full" 
              placeholder="Provide agenda, expectations, guest speakers..."
              value={eventDraft.description}
              onChange={e => setEventDraft(p => ({ ...p, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Event Type</label>
              <select 
                className="form-input w-full"
                value={eventDraft.eventType}
                onChange={e => setEventDraft(p => ({ ...p, eventType: e.target.value }))}
              >
                <option value="webinar">Online Webinar</option>
                <option value="in_person">In-Person Seminar</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Attendee Capacity Limit</label>
              <input 
                type="number" 
                className="form-input w-full" 
                value={eventDraft.maxAttendees}
                onChange={e => setEventDraft(p => ({ ...p, maxAttendees: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Start Date/Time</label>
              <input 
                type="datetime-local" 
                className="form-input w-full" 
                value={eventDraft.startAt}
                onChange={e => setEventDraft(p => ({ ...p, startAt: e.target.value }))}
                required 
              />
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">End Date/Time (Optional)</label>
              <input 
                type="datetime-local" 
                className="form-input w-full" 
                value={eventDraft.endAt}
                onChange={e => setEventDraft(p => ({ ...p, endAt: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Broadcast Stream URL / Video Link</label>
            <input 
              type="text" 
              className="form-input w-full" 
              placeholder="e.g. https://zoom.us/j/..., Youtube Live Link"
              value={eventDraft.videoUrl}
              onChange={e => setEventDraft(p => ({ ...p, videoUrl: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setShowEventModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Schedule Event</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
