import { useState } from 'react';
import { motion } from 'motion/react';
import { Gear, Sparkle, Trash, Calendar, Plus } from '@phosphor-icons/react';

export function Planner({ 
  courses, 
  studyBlocks, 
  onGeneratePlan, 
  onClearPlan,
  onAddManualBlock,
  onRemoveStudyBlock
}) {
  const [courseHours, setCourseHours] = useState(() => {
    const initial = {};
    courses.forEach(c => {
      initial[c.id] = 2; // Default 2 hours per course
    });
    return initial;
  });

  const [selectedDays, setSelectedDays] = useState(['Monday', 'Wednesday', 'Friday']);
  const [targetHours, setTargetHours] = useState(8);
  const [successMsg, setSuccessMsg] = useState('');

  // Manual study block states
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualCourseId, setManualCourseId] = useState('');
  const [manualDay, setManualDay] = useState('Monday');
  const [manualStart, setManualStart] = useState('14:00');
  const [manualEnd, setManualEnd] = useState('16:00');
  const [manualError, setManualError] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleHourChange = (courseId, val) => {
    setCourseHours(prev => ({
      ...prev,
      [courseId]: parseInt(val, 10)
    }));
  };

  const handleDayToggle = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleGenerate = () => {
    onGeneratePlan(courseHours, selectedDays, targetHours);
    setSuccessMsg('Optimized study schedule generated successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setManualError('');

    if (!manualCourseId) {
      setManualError('Please select a course.');
      return;
    }

    const courseObj = courses.find(c => c.id === manualCourseId);
    if (!courseObj) return;

    onAddManualBlock({
      courseId: manualCourseId,
      name: `${courseObj.name} Study`,
      day: manualDay,
      startTime: manualStart,
      endTime: manualEnd
    });

    setManualCourseId('');
    setShowManualForm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>Smart Study Planner</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
        Generate an optimized weekly study schedule around your classes.
      </p>

      <div className="planner-split-layout">
        {/* Settings Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="cohort-card">
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gear size={18} />
              Study Settings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Target Hours */}
              <div className="form-group">
                <label className="form-label">Total Study Target (Hours)</label>
                <select 
                  className="cohort-select" 
                  value={targetHours} 
                  onChange={e => setTargetHours(parseInt(e.target.value, 10))}
                >
                  {[4, 6, 8, 10, 12, 16, 20].map(h => (
                    <option key={h} value={h}>{h} Hours / week</option>
                  ))}
                </select>
              </div>

              {/* Courses hours distribution */}
              <div className="form-group">
                <label className="form-label">Study Allocation per Course</label>
                <div className="course-hours-setting">
                  {courses.map(course => (
                    <div key={course.id} className="course-hours-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{course.code} - {course.name}</span>
                      <select
                        className="cohort-select"
                        style={{ width: '120px', padding: '8px 12px' }}
                        value={courseHours[course.id] || 2}
                        onChange={e => handleHourChange(course.id, e.target.value)}
                      >
                        {[2, 4, 6, 8].map(h => (
                          <option key={h} value={h}>{h} Hours</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Days picker */}
              <div className="form-group">
                <label className="form-label">Preferred Study Days</label>
                <div className="preferred-days-grid">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      className={`pref-day-btn ${selectedDays.includes(day) ? 'active' : ''}`}
                      onClick={() => handleDayToggle(day)}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button className="cohort-btn cohort-btn-primary" onClick={handleGenerate} style={{ flex: 1, justifyContent: 'center' }}>
                  <Sparkle size={16} weight="bold" />
                  Generate Plan
                </button>
                {studyBlocks.length > 0 && (
                  <button className="cohort-btn" onClick={onClearPlan} style={{ justifyContent: 'center', color: '#EF4444' }} title="Clear study plan">
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Add Manual Block Button/Form */}
          <div className="cohort-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showManualForm ? '16px' : '0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Manual Study Blocks</h3>
              <button 
                className="cohort-btn" 
                onClick={() => setShowManualForm(!showManualForm)}
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                {showManualForm ? 'Cancel' : '+ Add Block'}
              </button>
            </div>

            {showManualForm && (
              <form onSubmit={handleManualSubmit} style={{ marginTop: '12px' }}>
                {manualError && (
                  <div className="alert-box" style={{ marginBottom: '12px' }}>
                    <span>{manualError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Course Subject</label>
                  <select 
                    className="cohort-select" 
                    value={manualCourseId} 
                    onChange={e => setManualCourseId(e.target.value)}
                  >
                    <option value="">Select course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Day</label>
                  <select 
                    className="cohort-select" 
                    value={manualDay} 
                    onChange={e => setManualDay(e.target.value)}
                  >
                    {daysOfWeek.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input type="time" className="cohort-input" value={manualStart} onChange={e => setManualStart(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input type="time" className="cohort-input" value={manualEnd} onChange={e => setManualEnd(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="cohort-btn cohort-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                  <Plus size={16} />
                  Add Study Block
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Results Timeline Panel */}
        <div className="cohort-card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '20px' }}>Generated Study Plan</h3>
          
          {successMsg && (
            <div className="success-box">
              <span>{successMsg}</span>
            </div>
          )}

          {studyBlocks.length > 0 ? (
            <div className="planner-blocks-container">
              {daysOfWeek.map(day => {
                const dayBlocks = studyBlocks.filter(b => b.day === day);
                if (dayBlocks.length === 0) return null;
                
                return (
                  <div key={day} className="planner-day-block">
                    <div className="planner-day-name">{day}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {dayBlocks.map(block => (
                        <div key={block.id} className="planner-block-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="planner-block-title">{block.name}</span>
                            <span className="planner-block-time">
                              <Calendar size={13} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--text-tertiary)' }} />
                              {block.startTime} - {block.endTime}
                            </span>
                          </div>
                          <button
                            className="cohort-btn"
                            onClick={() => onRemoveStudyBlock(block.id)}
                            style={{ padding: '6px', border: 'none', background: 'transparent', boxShadow: 'none' }}
                            title="Remove study block"
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', color: 'var(--text-tertiary)', textAlign: 'center', gap: '12px' }}>
              <Sparkle size={32} weight="thin" />
              <p style={{ fontSize: '13px', maxWidth: '280px' }}>
                No study blocks generated yet. Set your preferences and click <strong>Generate Plan</strong> to construct an optimized schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
