import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, Clock, Checks, Bell, Play, Square, Circle } from '@phosphor-icons/react';

export function Dashboard({ 
  schedule, 
  files, 
  courses, 
  studySessions, 
  onSaveStudySession,
  onNavigate,
  profile
}) {
  // Timer States
  const [timerActive, setTimerActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef(null);

  const todayString = new Date().toISOString().split('T')[0];
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // 1. Initialize and recover timer from localStorage
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
      setElapsedSeconds(Math.floor((Date.now() - Date.now()) / 1000)); // Reset tick
      // Recalculate accurately based on start timestamp
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  const handleStopTimer = () => {
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
      const durationMin = Math.round(seconds / 60) || 1; // Minimum 1 minute
      
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

  // 2. Calculate daily total learning time from Firestore study sessions
  const todaysSessions = studySessions.filter(s => s.date === todayString);
  const totalTodayMinutes = todaysSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  // SVG Donut calculation (target 120 minutes = 100% stroke)
  const targetMinutes = 120;
  const percentage = Math.min((totalTodayMinutes / targetMinutes) * 100, 100);
  const strokeDasharray = `${percentage} ${100 - percentage}`;

  // 3. Greeting formatting
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Student';

  // 4. Map schedule items
  // TODAY'S CLASSES: repeating weekly on current weekday, OR one-time event set to today's date
  const todaysClasses = schedule
    .filter(item => {
      if (!item.isClass) return false;
      if (item.isRepeating) {
        return item.day === currentDayName;
      } else {
        return item.day === todayString;
      }
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // UPCOMING TASKS: non-class schedule items (meetings, tasks) happening in the next 7 days
  const getUpcomingTasks = () => {
    const today = new Date();
    const list = [];

    // Check weekday indexes for next 7 days
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const targetDayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
      const targetDateStr = targetDate.toISOString().split('T')[0];

      schedule.forEach(item => {
        if (item.isClass) return; // Only non-class events

        let matches = false;
        if (item.isRepeating) {
          matches = item.day === targetDayName;
        } else {
          matches = item.day === targetDateStr;
        }

        if (matches) {
          list.push({
            ...item,
            formattedDate: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : targetDayName,
            sortKey: i
          });
        }
      });
    }

    return list.sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      return a.startTime.localeCompare(b.startTime);
    });
  };

  const upcomingTasks = getUpcomingTasks();

  // 5. Dynamic Reminders: warning blocks for events starting within the next 2 hours today
  const getActiveReminders = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMin;

    const list = [];
    schedule.forEach(item => {
      let isToday = false;
      if (item.isRepeating) {
        isToday = item.day === currentDayName;
      } else {
        isToday = item.day === todayString;
      }

      if (isToday) {
        const [startH, startM] = item.startTime.split(':').map(Number);
        const startTotalMin = startH * 60 + startM;
        const diff = startTotalMin - currentTotalMin;
        
        // Starts in next 120 minutes and hasn't started yet
        if (diff > 0 && diff <= 120) {
          list.push({
            id: item.id,
            name: item.name,
            startTime: item.startTime,
            room: item.room,
            timeLeft: diff,
            isClass: item.isClass
          });
        }
      }
    });

    return list.sort((a, b) => a.timeLeft - b.timeLeft);
  };

  const reminders = getActiveReminders();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="dashboard-grid">
        {/* ==========================================
           LEFT COLUMN: Main workspace
           ========================================== */}
        <div>
          {/* Welcome Banner */}
          <div className="welcome-banner-card">
            <div className="welcome-banner-info">
              <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
                Hi {firstName}!
              </h2>
              <p style={{ fontSize: '13.5px', opacity: 0.9, lineHeight: '1.6' }}>
                {todaysClasses.length > 0 
                  ? `You have ${todaysClasses.length} class sessions scheduled for today. Start your learning now.`
                  : "You have no class sessions scheduled for today. Use the timer below to log your self-study time."}
              </p>
            </div>
            {/* Inline student illustration vector */}
            <svg className="welcome-banner-img" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" fill="rgba(255,255,255,0.15)" />
              <path d="M70 140 C 70 100, 130 100, 130 140 Z" fill="#ffffff" />
              <circle cx="100" cy="75" r="22" fill="#ffffff" />
              <rect x="75" y="110" width="50" height="24" rx="4" fill="#ffffff" stroke="#5E81F4" strokeWidth="3" />
              <line x1="85" y1="122" x2="115" y2="122" stroke="#5E81F4" strokeWidth="2" />
            </svg>
          </div>

          {/* Two-Column Middle widgets: Learning Time & Daily Schedule */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
            
            {/* Learning Time Interactive Donut & Stopwatch */}
            <div className="cohort-card nm-out" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justify: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px' }}>Learning Timer</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', gap: '16px' }}>
                  {/* Donut chart */}
                  <div className="donut-chart-container" style={{ margin: 0 }}>
                    <svg width="100" height="100" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg-navigation)" strokeWidth="4"></circle>
                      <circle 
                        cx="21" 
                        cy="21" 
                        r="15.915" 
                        fill="transparent" 
                        stroke="var(--accent)" 
                        strokeWidth="4" 
                        strokeDasharray={strokeDasharray} 
                        strokeDashoffset="25"
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      ></circle>
                    </svg>
                    <div className="donut-chart-center">
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {Math.floor(totalTodayMinutes / 60)}h {totalTodayMinutes % 60}m
                      </strong>
                      <span style={{ fontSize: '8px', color: 'var(--text-tertiary)' }}>Today</span>
                    </div>
                  </div>

                  {/* Stopwatch controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'monospace', color: timerActive ? 'var(--accent)' : 'var(--text-primary)', textAlign: 'center' }}>
                      {formatTimerString(elapsedSeconds)}
                    </div>
                    {timerActive ? (
                      <button 
                        onClick={handleStopTimer}
                        className="cohort-btn" 
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', width: '100%', justify: 'center', gap: '6px' }}
                      >
                        <Square size={12} weight="fill" />
                        <span>Stop Session</span>
                      </button>
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

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '12px' }}>
                {todaysSessions.length > 0 
                  ? `Completed ${todaysSessions.length} study session(s) today.`
                  : "No study periods logged yet. Start learning today!"}
              </div>
            </div>

            {/* Daily Schedule Ticker */}
            <div className="cohort-card nm-out" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
                <span>Today's Classes</span>
                <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-tertiary)' }}>{currentDayName}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                {todaysClasses.length > 0 ? (
                  todaysClasses.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-navigation)', borderRadius: '8px' }}>
                      <Clock size={16} style={{ color: 'var(--accent)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '700' }}>{item.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.startTime} - {item.endTime} | {item.room}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                    No lectures scheduled today.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
           RIGHT COLUMN: Widget sidebar
           ========================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Calendar Picker Widget */}
          <div className="cohort-card nm-out" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: '800' }}>July 2026</span>
            </div>
            {/* Simple calendar numbers grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontSize: '11px', fontWeight: '600' }}>
              {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} style={{ color: 'var(--text-tertiary)' }}>{d}</div>)}
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <div 
                  key={day} 
                  className={`pref-day-btn ${day === 15 ? 'active' : ''}`}
                  style={{ padding: '6px', fontSize: '11px', border: 'none', background: 'transparent' }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Tasks (Non-class events like meetings, tasks) */}
          <div className="cohort-card nm-out" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px' }}>Upcoming Tasks</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map(task => (
                  <div key={task.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-navigation)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Circle size={8} weight="fill" style={{ color: 'var(--accent)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '700' }}>{task.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {task.formattedDate} • {task.startTime} - {task.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11.5px', textAlign: 'center', padding: '20px 0' }}>
                  No pending meetings or events.
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Reminders */}
          <div className="cohort-card nm-out" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} />
              Reminders
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              {reminders.length > 0 ? (
                reminders.map(rem => (
                  <div 
                    key={rem.id} 
                    style={{ 
                      padding: '8px 12px', 
                      background: rem.isClass ? 'rgba(63, 195, 128, 0.06)' : 'rgba(94, 129, 244, 0.06)', 
                      borderLeft: `3px solid ${rem.isClass ? '#3FC380' : '#5E81F4'}`, 
                      borderRadius: '6px' 
                    }}
                  >
                    <strong>{rem.name} Starting Soon</strong>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Starts at {rem.startTime} (in {rem.timeLeft} minutes) | {rem.room}
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11.5px', textAlign: 'center', padding: '10px 0' }}>
                  All caught up for today!
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
