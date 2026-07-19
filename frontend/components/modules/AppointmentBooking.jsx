'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../lib/api';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  ExternalLink, 
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  CheckSquare,
  Activity
} from 'lucide-react';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export default function AppointmentBookingModule({ goHome, showToast }) {
  const [tab, setTab] = useState('appointments');
  const [loading, setLoading] = useState(true);

  // Data State
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    this_month: 0
  });
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [availSchedule, setAvailSchedule] = useState([]);
  const [bookingUrl, setBookingUrl] = useState('');

  // Modals & Form Drafts
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceDraft, setServiceDraft] = useState({
    name: '',
    description: '',
    durationMinutes: 30,
    priceNgn: '',
    color: '#2563eb',
    status: 'active'
  });

  const [availSaving, setAvailSaving] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Deletions
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, svcRes, apptRes, availRes, meRes] = await Promise.all([
        apiFetch('/api/v1/appointments/stats'),
        apiFetch('/api/v1/appointments/services'),
        apiFetch('/api/v1/appointments/'),
        apiFetch('/api/v1/appointments/availability'),
        apiFetch('/api/v1/auth/me')
      ]);

      setStats(statsRes.stats || { pending: 0, confirmed: 0, completed: 0, this_month: 0 });
      setServices(svcRes.services || []);
      setBookings(apptRes.appointments || []);
      
      const sched = availRes.schedule || [];
      // Initialize availSchedule if empty, ensuring all 7 days of the week are present
      const daysFilled = DAYS_OF_WEEK.map(d => {
        const found = sched.find(s => s.day_of_week === d.value);
        return found ? { ...found, day_name: d.label } : {
          day_of_week: d.value,
          day_name: d.label,
          start_time: '09:00',
          end_time: '17:00',
          is_active: false
        };
      });
      setAvailSchedule(daysFilled);

      if (meRes?.user?.orgId) {
        setBookingUrl(`${window.location.origin}/book/${meRes.user.orgId}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load appointments data.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Service Management
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceDraft.name.trim()) {
      showToast('Service name is required.');
      return;
    }

    try {
      setIsSavingService(true);
      const payload = {
        name: serviceDraft.name.trim(),
        description: serviceDraft.description || '',
        durationMinutes: Number(serviceDraft.durationMinutes) || 30,
        priceNgn: Number(serviceDraft.priceNgn) || 0,
        color: serviceDraft.color,
        status: serviceDraft.status
      };

      if (editingService) {
        await apiFetch(`/api/v1/appointments/services/${editingService.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Service updated.');
      } else {
        await apiFetch('/api/v1/appointments/services', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Service created.');
      }

      setIsServiceModalOpen(false);
      setEditingService(null);
      setServiceDraft({
        name: '',
        description: '',
        durationMinutes: 30,
        priceNgn: '',
        color: '#2563eb',
        status: 'active'
      });
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save service.');
    } finally {
      setIsSavingService(false);
    }
  };

  const handleEditService = (svc) => {
    setEditingService(svc);
    setServiceDraft({
      name: svc.name,
      description: svc.description || '',
      durationMinutes: svc.duration_minutes,
      priceNgn: svc.price_ngn,
      color: svc.color || '#2563eb',
      status: svc.status
    });
    setIsServiceModalOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      setIsDeletingService(true);
      await apiFetch(`/api/v1/appointments/services/${serviceToDelete}`, { method: 'DELETE' });
      showToast('Service deleted.');
      setServiceToDelete(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete service.');
    } finally {
      setIsDeletingService(false);
    }
  };

  // Availability Management
  const handleSaveAvailability = async () => {
    try {
      setAvailSaving(true);
      const schedule = availSchedule.map(s => ({
        dayOfWeek: s.day_of_week,
        startTime: s.start_time || '09:00',
        endTime: s.end_time || '17:00',
        isActive: !!s.is_active
      }));

      await apiFetch('/api/v1/appointments/availability', {
        method: 'POST',
        body: JSON.stringify({ schedule })
      });
      showToast('Availability settings saved.');
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save availability.');
    } finally {
      setAvailSaving(false);
    }
  };

  // Appointment Status Transitions
  const handleUpdateApptStatus = async (id, status) => {
    try {
      await apiFetch(`/api/v1/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      showToast(`Appointment marked as ${status}.`);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update appointment.');
    }
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;
    try {
      setIsDeletingBooking(true);
      await apiFetch(`/api/v1/appointments/${bookingToDelete}`, { method: 'DELETE' });
      showToast('Appointment booking deleted.');
      setBookingToDelete(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete appointment.');
    } finally {
      setIsDeletingBooking(false);
    }
  };

  // Clipboard URL helper
  const handleCopyLink = () => {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl);
    showToast('Public booking page link copied!');
  };

  // Filters
  const filteredServices = useMemo(() => {
    return services.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [services, searchTerm]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        b.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.client_email && b.client_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.client_phone && b.client_phone.includes(searchTerm));
      
      const matchesService = !serviceFilter || b.service_id === serviceFilter;
      const matchesStatus = !statusFilter || b.status === statusFilter;
      
      return matchesSearch && matchesService && matchesStatus;
    });
  }, [bookings, searchTerm, serviceFilter, statusFilter]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return { background: 'rgba(16, 185, 129, 0.1)', color: 'rgb(16, 185, 129)', border: '1px solid rgba(16, 185, 129, 0.2)' };
      case 'completed':
        return { background: 'rgba(59, 130, 246, 0.1)', color: 'rgb(59, 130, 246)', border: '1px solid rgba(59, 130, 246, 0.2)' };
      case 'pending':
        return { background: 'rgba(245, 158, 11, 0.1)', color: 'rgb(245, 158, 11)', border: '1px solid rgba(245, 158, 11, 0.2)' };
      case 'cancelled':
        return { background: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.2)' };
      default:
        return { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' };
    }
  };

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      
      <div className="module-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Calendar className="primary-color" style={{ width: 28, height: 28 }} />
            Appointment Booking
          </h1>
          <p className="module-sub">Publish a public calendar, configure your hours, and automatically schedule consultation slots.</p>
        </div>
        
        {bookingUrl && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <a 
              href={bookingUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-ghost" 
              style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: 13 }}
            >
              <ExternalLink style={{ width: 14, height: 14 }} />
              Open Booking Page
            </a>
            <Button variant="secondary" onClick={handleCopyLink}>
              <Copy style={{ width: 14, height: 14, marginRight: 4 }} />
              Copy URL
            </Button>
          </div>
        )}
      </div>

      {/* Stats row */}
      {stats && (
        <div className="stage-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="stage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="num" style={{ color: 'var(--warning)' }}>{stats.pending || 0}</div>
              <Clock className="muted" style={{ width: 20, height: 20 }} />
            </div>
            <div className="lbl">Pending Confirmations</div>
          </div>
          <div className="stage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="num" style={{ color: 'var(--success)' }}>{stats.confirmed || 0}</div>
              <CheckSquare className="success-color" style={{ width: 20, height: 20 }} />
            </div>
            <div className="lbl">Confirmed Slots</div>
          </div>
          <div className="stage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="num" style={{ color: 'var(--primary)' }}>{stats.completed || 0}</div>
              <CheckCircle className="primary-color" style={{ width: 20, height: 20 }} />
            </div>
            <div className="lbl">Completed Sessions</div>
          </div>
          <div className="stage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="num">{stats.this_month || 0}</div>
              <Activity style={{ width: 20, height: 20 }} />
            </div>
            <div className="lbl">Total This Month</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="invoice-tabs" style={{ marginBottom: '1.5rem' }}>
        {[
          { id: 'appointments', label: `Scheduled Bookings (${bookings.length})` },
          { id: 'services', label: `Offered Services (${services.length})` },
          { id: 'availability', label: 'Availability Slots' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`invoice-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => {
              setTab(t.id);
              setSearchTerm('');
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-note">Loading booking details…</div>
      ) : (
        <>
          {/* TAB 1: BOOKINGS */}
          {tab === 'appointments' && (
            <div>
              {/* Filter controls */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ flex: 2, minWidth: 200, position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2rem', width: '100%' }}
                    placeholder="Search bookings by client name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select 
                  className="form-input" 
                  style={{ flex: 1, minWidth: 150 }} 
                  value={serviceFilter} 
                  onChange={(e) => setServiceFilter(e.target.value)}
                >
                  <option value="">All Services</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <select 
                  className="form-input" 
                  style={{ flex: 1, minWidth: 120 }} 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {filteredBookings.length === 0 ? (
                <EmptyState
                  icon="📅"
                  title="No scheduled bookings found"
                  description="Share your booking calendar page URL with your clients to begin receiving bookings."
                  action={
                    bookingUrl && (
                      <Button onClick={handleCopyLink}>
                        Copy Booking URL
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Booked Service</th>
                        <th>Date &amp; Time</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b) => {
                        const dateObj = new Date(b.start_time);
                        return (
                          <tr key={b.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{b.client_name}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {[b.client_email, b.client_phone].filter(Boolean).join(' · ')}
                              </div>
                            </td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color || '#2563eb' }} />
                                {b.service_name || 'Generic Session'}
                              </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 600 }}>{dateObj.toLocaleDateString()}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td>
                              <span className="ctag" style={getStatusStyle(b.status)}>
                                {b.status}
                              </span>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {b.notes || '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {b.status === 'pending' && (
                                  <button className="ctag success" onClick={() => handleUpdateApptStatus(b.id, 'confirmed')}>
                                    Confirm
                                  </button>
                                )}
                                {(b.status === 'pending' || b.status === 'confirmed') && (
                                  <button className="ctag" onClick={() => handleUpdateApptStatus(b.id, 'completed')}>
                                    Complete
                                  </button>
                                )}
                                {b.status !== 'cancelled' && b.status !== 'completed' && (
                                  <button className="ctag danger" onClick={() => handleUpdateApptStatus(b.id, 'cancelled')}>
                                    Cancel
                                  </button>
                                )}
                                <button className="btn-ghost" style={{ padding: 4, color: 'var(--danger)' }} onClick={() => setBookingToDelete(b.id)}>
                                  <Trash2 style={{ width: 14, height: 14 }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SERVICES */}
          {tab === 'services' && (
            <div>
              <div style={{ display: 'flex', justifyBetween: 'space-between', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2rem', width: '100%' }}
                    placeholder="Search offered services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={() => {
                  setEditingService(null);
                  setServiceDraft({ name: '', description: '', durationMinutes: 30, priceNgn: '', color: '#2563eb', status: 'active' });
                  setIsServiceModalOpen(true);
                }}>
                  <Plus style={{ width: 16, height: 16, marginRight: 4 }} />
                  Add Service
                </Button>
              </div>

              {filteredServices.length === 0 ? (
                <EmptyState
                  icon="📦"
                  title="No services match your search"
                  description="Offered services will appear here. Create a service to enable booking slots."
                  action={
                    <Button onClick={() => {
                      setEditingService(null);
                      setServiceDraft({ name: '', description: '', durationMinutes: 30, priceNgn: '', color: '#2563eb', status: 'active' });
                      setIsServiceModalOpen(true);
                    }}>
                      Create Service
                    </Button>
                  }
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {filteredServices.map((svc) => (
                    <div key={svc.id} className="card hover-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: svc.color || '#2563eb', flexShrink: 0 }} />
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{svc.name}</h3>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                          {svc.price_ngn > 0 ? `₦${(svc.price_ngn / 100).toLocaleString()}` : 'Free'}
                        </div>
                      </div>

                      {svc.description && (
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', minHeight: 34, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {svc.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', paddingTop: '0.25rem' }}>
                        <span>Duration: <strong>{svc.duration_minutes} mins</strong></span>
                        <span className="ctag" style={{ background: svc.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-active)', color: svc.status === 'active' ? 'rgb(16, 185, 129)' : 'var(--text-muted)' }}>
                          {svc.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                        <button className="btn-ghost" style={{ flex: 1, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => handleEditService(svc)}>
                          <Edit style={{ width: 12, height: 12 }} />
                          Edit
                        </button>
                        <button className="btn-ghost" style={{ flex: 1, fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => setServiceToDelete(svc.id)}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AVAILABILITY */}
          {tab === 'availability' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Set Working Hours</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                Select the days of the week and schedule ranges where clients are permitted to schedule meetings.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {availSchedule.map((slot, i) => (
                  <div key={slot.day_of_week} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--surface-active)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', minWidth: 120 }}>
                      <input 
                        type="checkbox" 
                        checked={!!slot.is_active} 
                        onChange={(e) => setAvailSchedule((prev) => prev.map((s, j) => j === i ? { ...s, is_active: e.target.checked } : s))} 
                      />
                      <span style={{ fontWeight: slot.is_active ? 600 : 400, color: slot.is_active ? 'var(--text)' : 'var(--text-muted)', fontSize: 13 }}>
                        {slot.day_name}
                      </span>
                    </label>

                    <input 
                      type="time" 
                      className="form-input" 
                      value={slot.start_time?.slice(0, 5) || '09:00'} 
                      disabled={!slot.is_active}
                      onChange={(e) => setAvailSchedule((prev) => prev.map((s, j) => j === i ? { ...s, start_time: e.target.value } : s))}
                      style={{ width: 110, opacity: slot.is_active ? 1 : 0.4 }} 
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={slot.end_time?.slice(0, 5) || '17:00'} 
                      disabled={!slot.is_active}
                      onChange={(e) => setAvailSchedule((prev) => prev.map((s, j) => j === i ? { ...s, end_time: e.target.value } : s))}
                      style={{ width: 110, opacity: slot.is_active ? 1 : 0.4 }} 
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <Button onClick={handleSaveAvailability} disabled={availSaving}>
                  {availSaving ? 'Saving hours…' : 'Save Availability Settings'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE/EDIT SERVICE MODAL */}
      {isServiceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: 450, display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--panel)', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              {editingService ? 'Edit Service Details' : 'Add Offered Service'}
            </h3>

            <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="field">
                <label className="field-label">Service Name *</label>
                <input
                  className="field-input"
                  required
                  placeholder="e.g. 1-on-1 Consultation"
                  value={serviceDraft.name}
                  onChange={(e) => setServiceDraft(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="field">
                <label className="field-label">Description</label>
                <textarea
                  className="field-input"
                  rows={2}
                  placeholder="Describe what is included in the scheduling slot..."
                  value={serviceDraft.description}
                  onChange={(e) => setServiceDraft(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="field">
                  <label className="field-label">Duration (Minutes)</label>
                  <input
                    className="field-input"
                    type="number"
                    min="5"
                    value={serviceDraft.durationMinutes}
                    onChange={(e) => setServiceDraft(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Price (Smallest unit, e.g. ₦1000 = 100000)</label>
                  <input
                    className="field-input"
                    type="number"
                    placeholder="0 = Free"
                    value={serviceDraft.priceNgn}
                    onChange={(e) => setServiceDraft(prev => ({ ...prev, priceNgn: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="field">
                  <label className="field-label">Badge Color</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={serviceDraft.color}
                      onChange={(e) => setServiceDraft(prev => ({ ...prev, color: e.target.value }))}
                      style={{ width: 40, height: 34, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', padding: 0 }}
                    />
                    <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{serviceDraft.color}</span>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Status</label>
                  <select
                    className="field-select"
                    value={serviceDraft.status}
                    onChange={(e) => setServiceDraft(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" type="button" onClick={() => setIsServiceModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingService}>
                  {isSavingService ? 'Saving…' : 'Save Service'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE SERVICE DIALOG */}
      <ConfirmDialog
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={confirmDeleteService}
        title="Delete Offered Service?"
        description="This will permanently delete this service and prevent clients from booking it."
        confirmLabel="Delete Service"
        danger
        loading={isDeletingService}
      />

      {/* CONFIRM DELETE BOOKING DIALOG */}
      <ConfirmDialog
        isOpen={!!bookingToDelete}
        onClose={() => setBookingToDelete(null)}
        onConfirm={confirmDeleteBooking}
        title="Delete Appointment Booking?"
        description="This will permanently remove the booked slot from the dashboard ledger."
        confirmLabel="Delete Booking"
        danger
        loading={isDeletingBooking}
      />
    </div>
  );
}
