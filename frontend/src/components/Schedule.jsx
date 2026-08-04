import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash, CalendarBlank, Warning, MapPin, UploadSimple, CheckCircle, Tag, PencilSimple, Clock, BookOpen, CaretUp, CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react';

export function Schedule({ 
  courses = [], 
  schedule = [], 
  onAddScheduleItem, 
  onRemoveScheduleItem,
  onUpdateScheduleItem
}) {
  const todayObj = new Date();
  const todayDateStr = todayObj.toISOString().split('T')[0];
  const todayDayName = todayObj.toLocaleDateString('en-US', { weekday: 'long' });

  // Selected date in calendar view
  const [selectedDate, setSelectedDate] = useState(todayDateStr);

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Event Form Fields
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [scheduleType, setScheduleType] = useState('CLASS'); // CLASS | STUDY_SESSION | ASSIGNMENT | REMINDER | PERSONAL_EVENT | CUSTOM
  const [customCategory, setCustomCategory] = useState('');
  const [eventType, setEventType] = useState('repeating'); // 'repeating' or 'onetime'
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [oneTimeDate, setOneTimeDate] = useState(todayDateStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [room, setRoom] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fileSuccess, setFileSuccess] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hoursOfDay = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const scheduleTypeOptions = [
    { value: 'CLASS', label: '🎓 Class', color: '#2563eb' },
    { value: 'STUDY_SESSION', label: '📖 Study Session', color: '#7c3aed' },
    { value: 'ASSIGNMENT', label: '📝 Assignment / Task', color: '#d97706' },
    { value: 'REMINDER', label: '🔔 Reminder', color: '#dc2626' },
    { value: 'PERSONAL_EVENT', label: '👤 Personal Event', color: '#9333ea' },
    { value: 'CUSTOM', label: '🏷️ Custom Category...', color: '#059669' }
  ];

  const changeDateDays = (days) => {
    const current = new Date(selectedDate);
    if (isNaN(current.getTime())) return;
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setName(item.name || '');
    setCourseId(item.courseId === 'none' ? '' : (item.courseId || ''));
    
    const type = item.scheduleType || (item.isClass ? 'CLASS' : 'PERSONAL_EVENT');
    setScheduleType(type);
    setCustomCategory(item.customCategory || '');
    
    setEventType(item.isRepeating ? 'repeating' : 'onetime');
    if (item.isRepeating) {
      setDayOfWeek(item.day || 'Monday');
    } else {
      setOneTimeDate(item.day || todayDateStr);
    }
    setStartTime(item.startTime || '09:00');
    setEndTime(item.endTime || '11:00');
    setRoom(item.room || '');
    setError('');
    setSuccess('');
    setShowAddModal(true);
  };

  const resetForm = () => {
    setName('');
    setCourseId('');
    setScheduleType('CLASS');
    setCustomCategory('');
    setEventType('repeating');
    setDayOfWeek('Monday');
    setOneTimeDate(todayDateStr);
    setStartTime('09:00');
    setEndTime('11:00');
    setRoom('');
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter an event title.');
      return;
    }

    if (scheduleType === 'CUSTOM' && !customCategory.trim()) {
      setError('Please enter a custom category name.');
      return;
    }

    const courseObj = courses.find(c => c.id === courseId);
    const dayValue = eventType === 'repeating' ? dayOfWeek : oneTimeDate;
    const isClass = scheduleType === 'CLASS';

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
      isClass,
      scheduleType,
      customCategory: scheduleType === 'CUSTOM' ? customCategory.trim() : null
    };

    if (editingId) {
      const result = await onUpdateScheduleItem(editingId, itemData);
      if (result && result.error) {
        setError(result.error);
      } else {
        setSuccess('Schedule item updated successfully!');
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
        }, 1000);
      }
    } else {
      const result = await onAddScheduleItem(itemData);
      if (result && result.error) {
        setError(result.error);
      } else {
        setSuccess('Schedule item added successfully!');
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
        }, 1000);
      }
    }
  };

  // Helper for displaying item classification badge & styling
  const getItemBadge = (item) => {
    if (item.scheduleType === 'CUSTOM' && item.customCategory) {
      return { label: `🏷️ ${item.customCategory}`, bg: '#d1fae5', color: '#047857' };
    }
    switch (item.scheduleType) {
      case 'CLASS':
        return { label: '🎓 CLASS', bg: '#dbeafe', color: '#1d4ed8' };
      case 'STUDY_SESSION':
        return { label: '📖 STUDY SESSION', bg: '#f3e8ff', color: '#7c3aed' };
      case 'ASSIGNMENT':
        return { label: '📝 ASSIGNMENT', bg: '#fef3c7', color: '#b45309' };
      case 'REMINDER':
        return { label: '🔔 REMINDER', bg: '#fee2e2', color: '#dc2626' };
      case 'PERSONAL_EVENT':
        return { label: '👤 PERSONAL', bg: '#fae8ff', color: '#9333ea' };
      default:
        return item.isClass 
          ? { label: '🎓 CLASS', bg: '#dbeafe', color: '#1d4ed8' }
          : { label: '📅 EVENT', bg: '#f3e8ff', color: '#7c3aed' };
    }
  };

  // Compute selected day details
  const getSelectedDayName = () => {
    const dateObj = new Date(selectedDate);
    if (isNaN(dateObj.getTime())) return 'Today';
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const selectedDayWeekday = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });

  // Filter items matching the selected date
  const selectedDayItems = schedule.filter(item => {
    if (item.isRepeating) {
      return item.day === selectedDayWeekday;
    } else {
      return item.day === selectedDate;
    }
  });

  const selectedClasses = selectedDayItems.filter(item => (item.scheduleType ? item.scheduleType === 'CLASS' : item.isClass));
  const selectedEvents = selectedDayItems.filter(item => (item.scheduleType ? item.scheduleType !== 'CLASS' : !item.isClass));

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
          if (res && res.success !== false) {
            importedCount++;
          } else {
            clashCount++;
          }
        }

        setFileSuccess(`Imported ${importedCount} event(s) successfully!${clashCount > 0 ? ` (${clashCount} skipped due to clashes)` : ''}`);
        setTimeout(() => setFileSuccess(''), 6000);
      } catch (err) {
        setError('Error parsing calendar file. Please ensure it is a valid .ics file.');
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

      const titleLower = (raw.summary || '').toLowerCase();
      const isAcademic = titleLower.includes('lecture') || 
                         titleLower.includes('class') || 
                         titleLower.includes('lab') || 
                         titleLower.includes('tutorial') || 
                         titleLower.includes('course');

      return {
        name: raw.summary,
        startTime,
        endTime,
        room: raw.location || 'Lecture Hall',
        day,
        isRepeating,
        repeatFrequency,
        courseId: 'none',
        isClass: isAcademic,
        scheduleType: isAcademic ? 'CLASS' : 'PERSONAL_EVENT'
      };
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Title & Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Schedule & Calendar Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage classes, study sessions, assignments, reminders, and custom schedule events.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="cohort-btn" style={{ gap: '8px', cursor: 'pointer' }}>
            <UploadSimple size={16} weight="bold" />
            <span>Import (.ics)</span>
            <input 
              type="file" 
              accept=".ics" 
              onChange={handleIcsUpload} 
              style={{ display: 'none' }}
            />
          </label>

          <button 
            onClick={handleOpenAdd}
            className="cohort-btn cohort-btn-primary"
            style={{ gap: '6px' }}
          >
            <Plus size={16} weight="bold" />
            <span>Add Schedule Item</span>
          </button>
        </div>
      </div>

      {fileSuccess && (
        <div className="success-box" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} weight="fill" />
          <span>{fileSuccess}</span>
        </div>
      )}

      {/* Main Schedule Grid: Calendar View & Day Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Side: Selected Date Breakdown (Classes vs Events) */}
        <div>
          {/* Day Header Bar */}
          <div className="cohort-card nm-out" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CalendarBlank size={24} style={{ color: 'var(--accent)' }} />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {getSelectedDayName()}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {selectedClasses.length} Class(es) • {selectedEvents.length} Event(s)
                </span>
              </div>
            </div>

            {/* Custom Styled Date Picker Control Bar with Up & Down Arrow Steppers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)' }}>Select Date:</span>
              <div className="date-picker-control-bar">
                <button 
                  type="button" 
                  className="date-stepper-btn" 
                  onClick={() => changeDateDays(-1)} 
                  title="Previous Day (Step Back)"
                >
                  <CaretDown size={15} weight="bold" />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="date" 
                    className="date-picker-custom-input" 
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                  />
                </div>

                <button 
                  type="button" 
                  className="date-stepper-btn" 
                  onClick={() => changeDateDays(1)} 
                  title="Next Day (Step Forward)"
                >
                  <CaretUp size={15} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* Group 1: Classes */}
          <div className="cohort-card nm-out" style={{ padding: '24px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '18px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎓 Classes</span>
              <span style={{ fontSize: '12px', background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)', padding: '2px 10px', borderRadius: '12px', fontWeight: '700' }}>
                {selectedClasses.length}
              </span>
            </h4>

            {selectedClasses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedClasses.map(item => {
                  const badge = getItemBadge(item);
                  return (
                    <motion.div 
                      key={item.id} 
                      className="event-card-premium"
                      whileHover={{ y: -2 }}
                    >
                      <div 
                        className="event-card-accent-stripe" 
                        style={{ background: badge.color }} 
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, paddingRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span className="event-card-badge" style={{ background: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                          <h5 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                            {item.name}
                          </h5>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span className="event-card-pill">
                            <Clock size={14} style={{ color: badge.color }} />
                            <span>{item.startTime} - {item.endTime}</span>
                          </span>

                          {item.room && (
                            <span className="event-card-pill">
                              <MapPin size={14} style={{ color: 'var(--accent)' }} />
                              <span>{item.room}</span>
                            </span>
                          )}

                          <span className="event-card-pill" style={{ opacity: 0.85 }}>
                            <span>{item.isRepeating ? `Weekly: ${item.day}` : `Date: ${item.day}`}</span>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button 
                          className="icon-action-btn"
                          onClick={() => handleEditClick(item)}
                          title="Edit class"
                        >
                          <PencilSimple size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button 
                          className="icon-action-btn danger"
                          onClick={() => {
                            if (confirm(`Remove class "${item.name}"?`)) {
                              onRemoveScheduleItem(item.id);
                            }
                          }}
                          title="Delete class"
                        >
                          <Trash size={16} style={{ color: 'var(--text-tertiary)' }} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '30px 0' }}>
                No classes scheduled for {selectedDayWeekday}.
              </div>
            )}
          </div>

          {/* Group 2: Events & Non-Class Items */}
          <div className="cohort-card nm-out" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '18px', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅 Events & Tasks</span>
              <span style={{ fontSize: '12px', background: '#d1fae5', color: '#047857', padding: '2px 10px', borderRadius: '12px', fontWeight: '700' }}>
                {selectedEvents.length}
              </span>
            </h4>

            {selectedEvents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedEvents.map(item => {
                  const badge = getItemBadge(item);
                  return (
                    <motion.div 
                      key={item.id} 
                      className="event-card-premium"
                      whileHover={{ y: -2 }}
                    >
                      <div 
                        className="event-card-accent-stripe" 
                        style={{ background: badge.color }} 
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, paddingRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span className="event-card-badge" style={{ background: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                          <h5 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                            {item.name}
                          </h5>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span className="event-card-pill">
                            <Clock size={14} style={{ color: badge.color }} />
                            <span>{item.startTime} - {item.endTime}</span>
                          </span>

                          {item.room && (
                            <span className="event-card-pill">
                              <MapPin size={14} style={{ color: 'var(--accent)' }} />
                              <span>{item.room}</span>
                            </span>
                          )}

                          <span className="event-card-pill" style={{ opacity: 0.85 }}>
                            <span>{item.isRepeating ? `Weekly: ${item.day}` : `Date: ${item.day}`}</span>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button 
                          className="icon-action-btn"
                          onClick={() => handleEditClick(item)}
                          title="Edit event"
                        >
                          <PencilSimple size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button 
                          className="icon-action-btn danger"
                          onClick={() => {
                            if (confirm(`Remove event "${item.name}"?`)) {
                              onRemoveScheduleItem(item.id);
                            }
                          }}
                          title="Delete event"
                        >
                          <Trash size={16} style={{ color: 'var(--text-tertiary)' }} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '30px 0' }}>
                No events or tasks scheduled for {selectedDayWeekday}.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Full Weekly Timeline View */}
        <div>
          <div className="schedule-timeline-card nm-out">
            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} />
              Hourly Grid Overview
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '540px', overflowY: 'auto' }}>
              {hoursOfDay.map(hour => {
                const hourNum = parseInt(hour.split(':')[0], 10);
                const activeHourEvents = selectedDayItems.filter(item => {
                  const startHour = parseInt(item.startTime.split(':')[0], 10);
                  const endHour = parseInt(item.endTime.split(':')[0], 10);
                  return hourNum >= startHour && hourNum < endHour;
                });

                return (
                  <div key={hour} className="schedule-hour-row">
                    <span className="schedule-hour-label">{hour}</span>
                    <div className="schedule-events-container">
                      {activeHourEvents.map(item => {
                        const badge = getItemBadge(item);
                        return (
                          <div 
                            key={item.id} 
                            className="schedule-event-block nm-out"
                            onClick={() => handleEditClick(item)}
                            style={{ 
                              cursor: 'pointer',
                              background: badge.bg,
                              borderLeft: `3px solid ${badge.color}`,
                              color: badge.color
                            }}
                            title="Click to edit event"
                          >
                            <div>
                              <strong style={{ display: 'block', fontSize: '12px' }}>
                                {item.name}
                              </strong>
                              <span style={{ fontSize: '10px', opacity: 0.85 }}>
                                {item.startTime} - {item.endTime} ({badge.label})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Event Creation / Edit Modal Dialog */}
      {showAddModal && (
        <div className="quiz-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="quiz-modal" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', textAlign: 'center' }}>
              {editingId ? 'Edit Schedule Item' : 'Add Schedule Item'}
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
              {/* Classification Select */}
              <div className="form-group">
                <label className="form-label">Classification / Type</label>
                <select 
                  className="cohort-select" 
                  value={scheduleType} 
                  onChange={e => setScheduleType(e.target.value)}
                >
                  {scheduleTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Custom Category Input (If CUSTOM selected) */}
              {scheduleType === 'CUSTOM' && (
                <div className="form-group">
                  <label className="form-label">Custom Category Name</label>
                  <input 
                    type="text" 
                    className="cohort-input" 
                    placeholder="e.g. Exam Prep, Lab Work, Project" 
                    value={customCategory} 
                    onChange={e => setCustomCategory(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Event Title */}
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="e.g. Database Systems Lecture" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              {/* Linked Course (Optional) */}
              <div className="form-group">
                <label className="form-label">Linked Course (Optional)</label>
                <select className="cohort-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
                  <option value="">None / Custom Event</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
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

              {/* Day / Date */}
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

              {/* Times */}
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

              {/* Room / Location */}
              <div className="form-group">
                <label className="form-label">Location / Room</label>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="e.g. Lab 3B, Zoom, Library" 
                  value={room} 
                  onChange={e => setRoom(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="cohort-btn cohort-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {editingId ? 'Update Event' : 'Save to Schedule'}
                </button>
                <button 
                  type="button" 
                  className="cohort-btn" 
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Schedule;
