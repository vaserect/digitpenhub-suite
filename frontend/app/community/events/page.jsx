'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EventsCalendar() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('calendar'); // calendar or list
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/community/events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
    setLoading(false);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/community/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({});
        loadEvents();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await fetch(`/api/v1/community/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadEvents();
    } catch (error) {
      console.error('Error RSVPing:', error);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-200"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-2 overflow-y-auto ${isToday ? 'bg-blue-50' : 'bg-white'}`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          {dayEvents.map(event => (
            <div
              key={event.id}
              onClick={() => router.push(`/community/events/${event.id}`)}
              className="text-xs p-1 mb-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 truncate"
            >
              {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {event.title}
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div>
        <div className="grid grid-cols-7 gap-0 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-700 py-2 bg-gray-100">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {days}
        </div>
      </div>
    );
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/community')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Community
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Events Calendar</h1>
              <p className="text-gray-600">View and manage community events</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Event
            </button>
          </div>
        </div>

        {/* View Toggle & Navigation */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-lg ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                📅 Calendar
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                📋 List
              </button>
            </div>
            
            {view === 'calendar' && (
              <div className="flex items-center gap-4">
                <button
                  onClick={previousMonth}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50"
                >
                  ←
                </button>
                <span className="font-semibold text-lg">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <button
                  onClick={nextMonth}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50"
                >
                  →
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50"
                >
                  Today
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calendar or List View */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading events...</p>
            </div>
          ) : view === 'calendar' ? (
            renderCalendar()
          ) : (
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No events scheduled</p>
                </div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📅 {new Date(event.start_time).toLocaleDateString()}</span>
                          <span>🕐 {new Date(event.start_time).toLocaleTimeString()}</span>
                          <span className={`px-2 py-1 rounded ${
                            event.event_type === 'online' ? 'bg-blue-100 text-blue-800' :
                            event.event_type === 'in_person' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {event.event_type}
                          </span>
                          <span>👥 {event.attendee_count} attending</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRSVP(event.id, 'going')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Going
                        </button>
                        <button
                          onClick={() => handleRSVP(event.id, 'maybe')}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                          Maybe
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Create Event</h3>
              <form onSubmit={handleCreateEvent}>
                <input
                  type="text"
                  placeholder="Event Title"
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Description"
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                  rows="3"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                  value={formData.start_time || ''}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  required
                />
                <select
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                  value={formData.event_type || 'online'}
                  onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                >
                  <option value="online">Online</option>
                  <option value="in_person">In Person</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({});
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
