import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash, CalendarBlank, Warning, Download, MapPin, UploadSimple, CheckCircle } from '@phosphor-icons/react';

export function Schedule({ 
  courses, 
  schedule, 
  onAddScheduleItem, 
  onRemoveScheduleItem,
  onUpdateScheduleItem
}) {
  const [editingId, setEditingId] = useState(null);
  
  // Event Form State
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [eventType, setEventType] = useState('repeating'); // 'repeating' or 'onetime'
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [oneTimeDate, setOneTimeDate] = useState('2026-07-15');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [room, setRoom] = useState('');
  const [isClass, setIsClass] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fileSuccess, setFileSuccess] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hoursOfDay = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter an event title.');
      return;
    }

    const courseObj = courses.find(c => c.id === courseId);
    const dayValue = eventType === 'repeating' ? dayOfWeek : oneTimeDate;

    const itemData = {
      name: name.trim(),
      courseId: courseId || 'none',
      courseName: courseObj ? courseObj.name : 'Other Event',
      day: dayValue,
      startTime,
      endTime,
      room: room.trim() || (courseObj ? courseObj.room : 'General'),
      isRepeating: eventType === 'repeating',
      repeatFrequency: eventType === 'repeating' ? 'weekly' : 'none',
      isClass
    };

    if (editingId) {
      const result = await onUpdateScheduleItem(editingId, itemData);
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess('Event updated successfully!');
        setEditingId(null);
        resetForm();
        setTimeout(() => setSuccess(''), 3000);
      }
    } else {
      const result = await onAddScheduleItem(itemData);
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess('Event added successfully!');
        resetForm();
        setTimeout(() => setSuccess(''), 3000);
      }
    }
  };

  const resetForm = () => {
    setName('');
    setCourseId('');
    setRoom('');
    setEditingId(null);
    setIsClass(true);
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setCourseId(item.courseId === 'none' ? '' : item.courseId);
    setEventType(item.isRepeating ? 'repeating' : 'onetime');
    if (item.isRepeating) {
      setDayOfWeek(item.day);
    } else {
      setOneTimeDate(item.day);
    }
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setRoom(item.room);
    setIsClass(item.isClass ?? true);
    setError('');
    setSuccess('');
  };

  // .ics parser implementation
  const handleIcsUpload = (e) => {
    setError('');
    setFileSuccess('');
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      try {
        const parsedEvents = parseICS(text);
        if (parsedEvents.length === 0) {
          setError('No valid events found in the .ics file.');
          return;
        }

        let importedCount = 0;
        let clashCount = 0;

        for (let item of parsedEvents) {
          const res = await onAddScheduleItem(item);
          if (res.success) {
            importedCount++;
          } else {
            clashCount++;
          }
        }

        setFileSuccess(`Imported ${importedCount} events successfully!${clashCount > 0 ? ` (${clashCount} events skipped due to scheduling clashes)` : ''}`);
        setTimeout(() => setFileSuccess(''), 6000);
      } catch (err) {
        setError('Error parsing calendar file. Please ensure it is a valid iCalendar (.ics) file.');
      }
    };
    reader.readAsText(file);
  };

  const parseICS = (text) => {
    const events = [];
    const lines = text.split(/\r?\n/);
    let currentEvent = null;

    for (let line of lines) {
      line = line.trim();
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT') {
        if (currentEvent && currentEvent.summary) {
          events.push(currentEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        const match = line.match(/^([A-Z0-9-]+)(?:;.*)?:(.*)$/);
        if (match) {
          const [_, key, value] = match;
          if (key === 'SUMMARY') {
            currentEvent.summary = value;
          } else if (key === 'LOCATION') {
            currentEvent.location = value;
          } else if (key === 'DTSTART') {
            currentEvent.dtstart = value;
          } else if (key === 'DTEND') {
            currentEvent.dtend = value;
          } else if (key === 'RRULE') {
            currentEvent.rrule = value;
          }
        }
      }
    }

    return events.map(raw => {
      let startTime = '09:00';
      let endTime = '10:00';
      let day = 'Monday';
      let isRepeating = false;
      let repeatFrequency = 'none';

      if (raw.dtstart && raw.dtstart.includes('T')) {
        const timePart = raw.dtstart.split('T')[1];
        startTime = timePart.substring(0, 2) + ':' + timePart.substring(2, 4);
      }
      if (raw.dtend && raw.dtend.includes('T')) {
        const timePart = raw.dtend.split('T')[1];
        endTime = timePart.substring(0, 2) + ':' + timePart.substring(2, 4);
      }

      if (raw.rrule) {
        isRepeating = true;
        repeatFrequency = 'weekly';
        if (raw.rrule.includes('BYDAY=')) {
          const dayCode = raw.rrule.split('BYDAY=')[1].substring(0, 2);
          const dayMap = { MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday', FR: 'Friday', SA: 'Saturday', SU: 'Sunday' };
          day = dayMap[dayCode] || 'Monday';
        }
      } else {
        isRepeating = false;
        repeatFrequency = 'none';
        if (raw.dtstart) {
          const dateStr = raw.dtstart.substring(0, 4) + '-' + raw.dtstart.substring(4, 6) + '-' + raw.dtstart.substring(6, 8);
          day = dateStr;
        }
      }

      // Check if it sounds like a class/lecture or a generic meeting
      const titleLower = (raw.summary || '').toLowerCase();
      const isAcademic = titleLower.includes('lecture') || 
                         titleLower.includes('class') || 
                         titleLower.includes('lab') || 
                         titleLower.includes('tutorial') || 
                         titleLower.includes('seminar') || 
                         titleLower.includes('course') || 
                         titleLower.includes('practical') || 
                         titleLower.includes('exam');

      return {
        name: raw.summary,
        startTime,
        endTime,
        room: raw.location || 'Lecture Hall',
        day,
        isRepeating,
        repeatFrequency,
        courseId: 'none',
        isClass: isAcademic
      };
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>My Schedule</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Plan repeating weekly classes or one-time events.
          </p>
        </div>

        {/* .ics Upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="cohort-btn" style={{ gap: '8px', cursor: 'pointer' }}>
            <UploadSimple size={16} weight="bold" />
            <span>Import Calendar (.ics)</span>
            <input 
              type="file" 
              accept=".ics" 
              onChange={handleIcsUpload} 
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {fileSuccess && (
        <div className="success-box" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} weight="fill" />
          <span>{fileSuccess}</span>
        </div>
      )}

      <div className="schedule-layout">
        {/* Left Side: Daily Timeline */}
        <div className="schedule-timeline-card nm-out">
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarBlank size={18} />
            Hourly Grid Blocks
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {hoursOfDay.map(hour => {
              const hourNum = parseInt(hour.split(':')[0], 10);
              
              // Filter events happening at this hour
              const activeEvents = schedule.filter(item => {
                const startHour = parseInt(item.startTime.split(':')[0], 10);
                const endHour = parseInt(item.endTime.split(':')[0], 10);
                return hourNum >= startHour && hourNum < endHour;
              });

              return (
                <div key={hour} className="schedule-hour-row">
                  <span className="schedule-hour-label">{hour}</span>
                  <div className="schedule-events-container">
                    {activeEvents.map(item => (
                      <div 
                        key={item.id} 
                        className={`schedule-event-block ${
                          item.isClass ? 'green' : 'blue'
                        } nm-out`}
                        onClick={() => handleEditClick(item)}
                        style={{ cursor: 'pointer' }}
                        title="Click to edit event"
                      >
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text-primary)' }}>
                            {item.name} {item.isClass ? ' (Class)' : ' (Event/Task)'}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {item.startTime} - {item.endTime} | {item.room} ({item.day})
                          </span>
                        </div>
                        <button
                          className="cohort-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove event "${item.name}"?`)) {
                              onRemoveScheduleItem(item.id);
                            }
                          }}
                          style={{ padding: '6px', border: 'none', background: 'transparent', boxShadow: 'none' }}
                        >
                          <Trash size={14} style={{ color: 'var(--text-tertiary)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Event Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="schedule-calendar-widget nm-out">
            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '20px' }}>
              {editingId ? 'Edit Event Details' : 'Schedule Custom Event'}
            </h3>

            {error && (
              <div className="alert-box" style={{ marginBottom: '16px' }}>
                <Warning size={16} weight="bold" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-box" style={{ marginBottom: '16px' }}>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="e.g. Embedded Labs" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Linked Course (Optional)</label>
                <select className="cohort-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
                  <option value="">None / Custom Event</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' }}>
                <input 
                  type="checkbox" 
                  id="isClassCheck" 
                  checked={isClass} 
                  onChange={e => setIsClass(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
                />
                <label htmlFor="isClassCheck" className="form-label" style={{ margin: 0, cursor: 'pointer', fontWeight: '700' }}>
                  Mark as Class session (shows in Dashboard Classes feed)
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Frequency</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    className={`pref-day-btn ${eventType === 'repeating' ? 'active' : ''}`}
                    onClick={() => setEventType('repeating')}
                    style={{ flex: 1 }}
                  >
                    Weekly Repeat
                  </button>
                  <button 
                    type="button" 
                    className={`pref-day-btn ${eventType === 'onetime' ? 'active' : ''}`}
                    onClick={() => setEventType('onetime')}
                    style={{ flex: 1 }}
                  >
                    One-time Event
                  </button>
                </div>
              </div>

              {eventType === 'repeating' ? (
                <div className="form-group">
                  <label className="form-label">Day of Week</label>
                  <select className="cohort-select" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
                    {daysOfWeek.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input 
                    type="date" 
                    className="cohort-input" 
                    value={oneTimeDate} 
                    onChange={e => setOneTimeDate(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="cohort-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="cohort-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Venue / Room</label>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="e.g. Lab 3B, Zoom" 
                  value={room} 
                  onChange={e => setRoom(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" className="cohort-btn cohort-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {editingId ? 'Update Event' : 'Add to Calendar'}
                </button>
                {editingId && (
                  <button type="button" className="cohort-btn" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
export default Schedule;
