import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, Clock, Checks, Bell, Play, Square, Circle, Tag, CaretRight } from '@phosphor-icons/react';

export function Dashboard({
  schedule = [],
  files = [],
  courses = [],
  studySessions = [],
  onSaveStudySession,
  onNavigate,
  profile
}) {
  // Timer States
  const [timerActive, setTimerActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const timerIntervalRef = useRef(null);

  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  useEffect(() => {
    const update = () => setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('storage', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', update);
    };
  }, []);

  const learningRingBaseColor = 'var(--bg-navigation)';
  const learningRingProgressColor = 'var(--accent-secondary)';

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const currentDay = today.getDate();
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long' });
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // Initialize and recover timer from localStorage
  useEffect(() => {
    const savedStart = localStorage.getItem('study-timer-start');
    if (savedStart) {
      const startTime = parseInt(savedStart, 10);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed >= 0 ? elapsed : 0);
      setTimerActive(true);

      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleStartTimer = () => {
    const startTime = Date.now();
    localStorage.setItem('study-timer-start', startTime.toString());
    setElapsedSeconds(0);
    setTimerActive(true);

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  const handleStopTimer = () => {
    setShowStopConfirm(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const savedStart = localStorage.getItem('study-timer-start');
    localStorage.removeItem('study-timer-start');
    setTimerActive(false);

    if (savedStart) {
      const startTimeVal = parseInt(savedStart, 10);
      const seconds = Math.floor((Date.now() - startTimeVal) / 1000);
      const durationMin = Math.round(seconds / 60) || 1;

      const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      onSaveStudySession({
        durationMinutes: durationMin,
        date: todayString,
        startTime: formatTime(startTimeVal),
        endTime: formatTime(Date.now())
      });
    }

    setElapsedSeconds(0);
  };

  const formatTimerString = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const formatDuration = (minutes) => {
    const totalMin = Math.round(minutes) || 1;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0 && m > 0) return `${h}hr${h > 1 ? 's' : ''} ${m}min${m > 1 ? 's' : ''}`;
    if (h > 0) return `${h}hr${h > 1 ? 's' : ''}`;
    return `${m}min${m > 1 ? 's' : ''}`;
  };

  const todaysSessions = studySessions.filter(s => s.date === todayString);
  const totalTodayMinutes = todaysSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  const targetMinutes = 120;
  const liveTotalMinutes = totalTodayMinutes + (timerActive ? elapsedSeconds / 60 : 0);
  const percentage = Math.min((liveTotalMinutes / targetMinutes) * 100, 100);
  const strokeDasharray = `${percentage} ${100 - percentage}`;

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Student';

  // TODAY'S CLASSES
  const todaysClasses = schedule
    .filter(item => {
      const isClassType = item.scheduleType ? item.scheduleType === 'CLASS' : item.isClass;
      if (!isClassType) return false;

      if (item.isRepeating) {
        return item.day === currentDayName;
      } else {
        return item.day === todayString;
      }
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // TODAY'S SCHEDULE / EVENTS
  const todaysScheduleEvents = schedule
    .filter(item => {
      const isClassType = item.scheduleType ? item.scheduleType === 'CLASS' : item.isClass;
      if (isClassType) return false;

      if (item.isRepeating) {
        return item.day === currentDayName;
      } else {
        return item.day === todayString;
      }
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const formatCategoryLabel = (item) => {
    if (item.scheduleType === 'CUSTOM' && item.customCategory) {
      return item.customCategory;
    }
    const map = {
      STUDY_SESSION: 'Study Session',
      ASSIGNMENT: 'Assignment',
      REMINDER: 'Reminder',
      PERSONAL_EVENT: 'Personal',
      CLASS: 'Class'
    };
    return map[item.scheduleType] || item.scheduleType || 'Event';
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case 'STUDY_SESSION': return { bg: 'rgba(59, 130, 246, 0.18)', text: '#60a5fa' };
      case 'ASSIGNMENT': return { bg: 'rgba(245, 158, 11, 0.18)', text: '#fbbf24' };
      case 'REMINDER': return { bg: 'rgba(239, 68, 68, 0.18)', text: '#f87171' };
      case 'PERSONAL_EVENT': return { bg: 'rgba(168, 85, 247, 0.18)', text: '#c084fc' };
      default: return { bg: 'rgba(16, 185, 129, 0.18)', text: '#34d399' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="dashboard-grid">
        {/* LEFT COLUMN: Main workspace */}
        <div>
          {/* Welcome Banner */}
          <div className="welcome-banner-card">
            <div className="welcome-banner-info">
              <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
                Hi {firstName}!
              </h2>
              <p style={{ fontSize: '13.5px', opacity: 0.9, lineHeight: '1.6' }}>
                {todaysClasses.length > 0
                  ? `You have ${todaysClasses.length} class session(s) and ${todaysScheduleEvents.length} scheduled event(s) for today.`
                  : todaysScheduleEvents.length > 0 
                    ? `No classes today, but you have ${todaysScheduleEvents.length} scheduled event(s) for today.`
                    : "You have no scheduled classes or events for today. Use the timer below to log your self-study time."}
              </p>
            </div>
            <svg className="welcome-banner-img" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="70" cy="70" r="70" fill="rgba(255,255,255,0.18)" />
              <circle cx="70" cy="62" r="20" fill="white" />
              <path d="M30 120 C30 88 110 88 110 120 Z" fill="white" />
              <rect x="44" y="42" width="52" height="8" rx="2" fill="white" />
              <polygon points="70,28 100,42 70,48 40,42" fill="white" />
              <line x1="100" y1="42" x2="104" y2="56" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="104" cy="59" r="3" fill="white" />
            </svg>
          </div>

          {/* Two-Column Middle widgets: Learning Timer & Today's Classes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
            {/* Learning Timer & Interactive Session History */}
            <div
              className="cohort-card nm-out"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-out)'
              }}
            >
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Learning Timer
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', gap: '16px' }}>
                  <div className="donut-chart-container" style={{ margin: 0 }}>
                    <svg width="100" height="100" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke={learningRingBaseColor} strokeWidth="4"></circle>
                      <circle
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={learningRingProgressColor}
                        strokeWidth="4"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset="25"
                        style={{
                          transition: 'stroke-dasharray 1s linear',
                          transformOrigin: 'center'
                        }}
                      ></circle>
                    </svg>
                    <div className="donut-chart-center">
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {Math.floor(liveTotalMinutes / 60)}h {Math.floor(liveTotalMinutes % 60)}m
                      </strong>
                      <span style={{ fontSize: '8px', color: 'var(--text-tertiary)' }}>Today</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'monospace', color: 'var(--text-primary)', textAlign: 'center' }}>
                      {formatTimerString(elapsedSeconds)}
                    </div>
                    {timerActive ? (
                      <div style={{ position: 'relative', width: '100%' }}>
                        <button
                          onClick={() => setShowStopConfirm(true)}
                          className="cohort-btn"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', width: '100%', justify: 'center', gap: '6px' }}
                        >
                          <Square size={12} weight="fill" />
                          <span>Stop Session</span>
                        </button>
                        {showStopConfirm && (
                          <div
                            onClick={() => setShowStopConfirm(false)}
                            style={{
                              position: 'fixed', inset: 0,
                              background: 'rgba(0,0,0,0.65)',
                              backdropFilter: 'blur(6px)',
                              WebkitBackdropFilter: 'blur(6px)',
                              zIndex: 9999,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <div
                              onClick={e => e.stopPropagation()}
                              style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '14px',
                                padding: '28px 32px',
                                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                                textAlign: 'center',
                                minWidth: '240px',
                              }}
                            >
                              <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>End session?</div>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={handleStopTimer} className="cohort-btn confirm-btn-yes" style={{ flex: 1, justifyContent: 'center', padding: '8px', background: '#15803d', color: '#ffffff', fontWeight: '700', border: 'none', borderRadius: '8px' }}>Yes</button>
                                <button onClick={() => setShowStopConfirm(false)} className="cohort-btn confirm-btn-no" style={{ flex: 1, justifyContent: 'center', padding: '8px', background: '#b91c1c', color: '#ffffff', fontWeight: '700', border: 'none', borderRadius: '8px' }}>No</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={handleStartTimer}
                        className="cohort-btn cohort-btn-primary"
                        style={{ width: '100%', justify: 'center', gap: '6px' }}
                      >
                        <Play size={12} weight="fill" />
                        <span>Start Study</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Logged Sessions Feed */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Completed Sessions Today ({todaysSessions.length})</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                  {todaysSessions.length > 0 ? (
                    todaysSessions.map((session, idx) => (
                      <div key={session.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-navigation)', borderRadius: '6px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          session {idx + 1}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {session.startTime && (
                            <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                              {session.startTime} - {session.endTime}
                            </span>
                          )}
                          <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.18)', padding: '2px 8px', borderRadius: '4px' }}>
                            {formatDuration(session.durationMinutes || 0)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', textAlign: 'center', padding: '10px 0' }}>
                      No study sessions logged today. Start timer to record session 1!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Today's Classes Section */}
            <div
              className="cohort-card nm-out"
              style={{
                padding: '24px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-out)'
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'baseline', gap: '8px', color: 'var(--text-primary)' }}>
                <span>Today's Classes</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-tertiary)' }}>• {currentDayName}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {todaysClasses.length > 0 ? (
                  todaysClasses.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('courses', item.courseId);
                        }
                      }}
                      style={{ 
                        cursor: 'pointer',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '10px 14px', 
                        background: 'var(--bg-navigation)', 
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      className="class-row-card"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Clock size={16} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {item.startTime} - {item.endTime} | {item.room || 'Lecture Room'}
                          </span>
                        </div>
                      </div>
                      <CaretRight size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                    No lectures scheduled for today.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Calendar Picker Widget */}
          <div className="cohort-card nm-out" style={{
            padding: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-out)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)' }}>{currentMonth} {currentYear}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontSize: '15px', fontWeight: '600' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{ color: 'var(--text-tertiary)', fontWeight: '700', fontSize: '10px', marginBottom: '2px' }}>{d}</div>
              ))}
              {Array.from({ length: new Date(today.getFullYear(), today.getMonth(), 1).getDay() }, (_, i) => (
                <div key={`empty-${i}`} style={{ padding: '6px', fontSize: '11px' }} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                <div
                  key={day}
                  className={`pref-day-btn ${day === currentDay ? 'cohort-btn-primary' : ''}`}
                  style={{
                    padding: '6px',
                    fontSize: '11px',
                    border: 'none',
                    background: day === currentDay ? 'var(--accent)' : 'transparent',
                    color: day === currentDay ? '#ffffff' : 'var(--text-primary)',
                    borderRadius: '50%',
                    fontWeight: day === currentDay ? '800' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    margin: '0 auto',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Schedule (All Non-Class Events Happening Today) */}
          <div className="cohort-card nm-out" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-out)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>Today's Schedule</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
              {todaysScheduleEvents.length > 0 ? (
                todaysScheduleEvents.map(event => {
                  const styleColors = getCategoryColor(event.scheduleType);
                  return (
                    <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-navigation)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Circle size={8} weight="fill" style={{ color: styleColors.text }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>{event.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {event.startTime} - {event.endTime} {event.room ? `| ${event.room}` : ''}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: styleColors.bg, color: styleColors.text }}>
                        {formatCategoryLabel(event)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11.5px', textAlign: 'center', padding: '20px 0' }}>
                  No non-class schedule items for today.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
