'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatTime(h, m) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function generateSlots(availability, service, existingAppts, selectedDate) {
  if (!service || !selectedDate) return [];
  const dow = selectedDate.getDay();
  const avail = availability.find((a) => a.day_of_week === dow);
  if (!avail) return [];

  const [startH, startM] = avail.start_time.split(':').map(Number);
  const [endH, endM] = avail.end_time.split(':').map(Number);
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  const dur = service.duration_minutes;
  const slots = [];

  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;

  for (let m = startMins; m + dur <= endMins; m += dur) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const isoStart = `${dateStr}T${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:00`;
    const slotStart = new Date(isoStart);
    const slotEnd = new Date(slotStart.getTime() + dur * 60000);

    const booked = existingAppts.some((a) => {
      const aStart = new Date(a.start_time);
      const aEnd = new Date(a.end_time);
      return slotStart < aEnd && slotEnd > aStart;
    });

    slots.push({ label: formatTime(h, min), isoStart, booked });
  }
  return slots;
}

export default function BookingPage() {
  const { orgId } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [step, setStep] = useState(1); // 1=service, 2=date, 3=time, 4=details, 5=confirm
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dayAppts, setDayAppts] = useState([]);
  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientPhone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(null);

  // Calendar state
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetch(`/api/v1/appointments/public/${orgId}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) { setError(d.error); } else { setInfo(d); } })
      .catch(() => setError('Failed to load booking page.'))
      .finally(() => setLoading(false));
  }, [orgId]);

  function isAvailableDay(date) {
    if (!info) return false;
    return info.availability.some((a) => a.day_of_week === date.getDay());
  }

  function selectDate(date) {
    setSelectedDate(date);
    setSelectedSlot(null);
    // Fetch existing appointments for this day from public endpoint — we pass date as query
    // We don't expose existing appointments publicly for privacy; just generate all slots and let clash be checked on submit
    setDayAppts([]);
    setStep(3);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.clientName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/appointments/public/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          clientPhone: form.clientPhone,
          startTime: selectedSlot.isoStart,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Booking failed.'); setSubmitting(false); return; }
      setBooked(data.appointment);
    } catch { alert('Network error. Please try again.'); }
    setSubmitting(false);
  }

  function renderCalendar() {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(calYear, calMonth, d);
      date.setHours(0, 0, 0, 0);
      cells.push(date);
    }
    return cells;
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ color: '#64748b' }}>Loading booking page…</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '0.5rem' }}>Page Not Found</h1>
        <p style={{ color: '#64748b' }}>{error}</p>
      </div>
    </div>
  );

  if (booked) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Booking Confirmed!</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            {selectedService?.name} on {DAYS[selectedDate?.getDay()]}, {MONTHS[selectedDate?.getMonth()]} {selectedDate?.getDate()}, {calYear} at {selectedSlot?.label}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>You will receive a confirmation if an email was provided.</p>
          <button style={btnStyle} onClick={() => { setBooked(null); setStep(1); setSelectedService(null); setSelectedDate(null); setSelectedSlot(null); setForm({ clientName: '', clientEmail: '', clientPhone: '', notes: '' }); }}>
            Book Another
          </button>
        </div>
      </div>
    </div>
  );

  const slots = generateSlots(info?.availability || [], selectedService, dayAppts, selectedDate);

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>{info?.org?.name}</h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Book an appointment</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        {['Service','Date','Time','Details'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, background: step > i + 1 ? '#2563eb' : step === i + 1 ? '#2563eb' : '#e2e8f0', color: step >= i + 1 ? 'white' : '#94a3b8' }}>{i + 1}</div>
            <span style={{ fontSize: '0.75rem', color: step === i + 1 ? '#2563eb' : '#94a3b8', fontWeight: step === i + 1 ? 700 : 400 }}>{s}</span>
            {i < 3 && <div style={{ width: 20, height: 2, background: step > i + 1 ? '#2563eb' : '#e2e8f0' }} />}
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        {/* Step 1: Choose service */}
        {step === 1 && (
          <div>
            <h2 style={stepTitleStyle}>Select a Service</h2>
            {info?.services?.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>No services available for booking.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {info?.services?.map((svc) => (
                  <button key={svc.id} onClick={() => { setSelectedService(svc); setStep(2); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `2px solid ${selectedService?.id === svc.id ? svc.color : '#e2e8f0'}`, borderRadius: '10px', background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: svc.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{svc.name}</div>
                      {svc.description && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>{svc.description}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{svc.price_ngn > 0 ? `₦${(svc.price_ngn / 100).toLocaleString()}` : 'Free'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{svc.duration_minutes} min</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Choose date */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={() => setStep(1)} style={backBtnStyle}>← Back</button>
              <h2 style={{ ...stepTitleStyle, margin: 0 }}>Select a Date</h2>
            </div>
            {/* Calendar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <button onClick={() => { const d = new Date(calYear, calMonth - 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); }} style={navBtnStyle}>‹</button>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{MONTHS[calMonth]} {calYear}</span>
              <button onClick={() => { const d = new Date(calYear, calMonth + 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); }} style={navBtnStyle}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '0.5rem' }}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{d}</div>
              ))}
              {renderCalendar().map((date, i) => {
                if (!date) return <div key={`empty-${i}`} />;
                const today = new Date(); today.setHours(0,0,0,0);
                const isPast = date < today;
                const avail = isAvailableDay(date);
                const isSel = selectedDate?.getTime() === date.getTime();
                return (
                  <button key={date.getTime()} onClick={() => avail && !isPast && selectDate(date)} disabled={isPast || !avail}
                    style={{ textAlign: 'center', padding: '8px 4px', borderRadius: '8px', border: 'none', cursor: isPast || !avail ? 'not-allowed' : 'pointer', background: isSel ? '#2563eb' : avail && !isPast ? '#eff6ff' : 'transparent', color: isSel ? 'white' : isPast ? '#cbd5e1' : avail ? '#1e293b' : '#cbd5e1', fontWeight: avail && !isPast ? 600 : 400, fontSize: '0.85rem' }}>
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Highlighted dates have availability</p>
          </div>
        )}

        {/* Step 3: Choose time */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={() => setStep(2)} style={backBtnStyle}>← Back</button>
              <h2 style={{ ...stepTitleStyle, margin: 0 }}>Select a Time</h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
              {DAYS[selectedDate?.getDay()]}, {MONTHS[selectedDate?.getMonth()]} {selectedDate?.getDate()}
            </p>
            {slots.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>No available slots for this day.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {slots.map((slot) => (
                  <button key={slot.isoStart} onClick={() => { if (!slot.booked) { setSelectedSlot(slot); setStep(4); } }} disabled={slot.booked}
                    style={{ padding: '0.6rem', border: `2px solid ${selectedSlot?.isoStart === slot.isoStart ? '#2563eb' : '#e2e8f0'}`, borderRadius: '8px', background: slot.booked ? '#f8fafc' : selectedSlot?.isoStart === slot.isoStart ? '#eff6ff' : 'white', color: slot.booked ? '#cbd5e1' : '#1e293b', fontWeight: 600, fontSize: '0.82rem', cursor: slot.booked ? 'not-allowed' : 'pointer' }}>
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Your details */}
        {step === 4 && (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <button type="button" onClick={() => setStep(3)} style={backBtnStyle}>← Back</button>
              <h2 style={{ ...stepTitleStyle, margin: 0 }}>Your Details</h2>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
              <strong>{selectedService?.name}</strong> · {DAYS[selectedDate?.getDay()]}, {MONTHS[selectedDate?.getMonth()]} {selectedDate?.getDate()} at {selectedSlot?.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              <input required value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} placeholder="Your name *" style={inputStyle} />
              <input type="email" value={form.clientEmail} onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))} placeholder="Email address" style={inputStyle} />
              <input value={form.clientPhone} onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))} placeholder="Phone number" style={inputStyle} />
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <button type="submit" disabled={submitting} style={{ ...btnStyle, width: '100%', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Booking…' : 'Confirm Booking'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: '#f8fafc',
  padding: '2rem 1rem',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  maxWidth: '480px',
  margin: '0 auto',
};

const cardStyle = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '1.5rem',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

const stepTitleStyle = {
  fontSize: '1rem',
  fontWeight: 700,
  color: '#1e293b',
  marginBottom: '1rem',
};

const btnStyle = {
  display: 'inline-block',
  marginTop: '1rem',
  padding: '0.75rem 2rem',
  background: 'linear-gradient(135deg,#2563eb,#38bdf8)',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const backBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  fontWeight: 600,
  fontSize: '0.82rem',
  cursor: 'pointer',
  padding: 0,
  flexShrink: 0,
};

const navBtnStyle = {
  background: '#f1f5f9',
  border: 'none',
  width: 32,
  height: 32,
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.85rem',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};
