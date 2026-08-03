import { useState } from 'react';
import { Users, Plus, BookOpen, Clock, ArrowRight, UserPlus, Check } from '@phosphor-icons/react';

export function Groups({ courses = [], userEmail = '', onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('registry');
  const [joinedGroups, setJoinedGroups] = useState(new Set(['g1']));

  const [sampleGroups, setSampleGroups] = useState([
    {
      id: 'g1',
      name: 'Algorithm Mastery Circle',
      courseCode: 'CS302',
      courseName: 'Data Structures & Algorithms',
      nextMeeting: 'Wed 4:00 PM',
      room: 'Lab 4B',
      members: 14,
      admin: userEmail || 'student@university.edu'
    },
    {
      id: 'g2',
      name: 'Software Design Systems',
      courseCode: 'CS401',
      courseName: 'Software Engineering II',
      nextMeeting: 'Fri 2:00 PM',
      room: 'Room 201',
      members: 8,
      admin: 'alex@university.edu'
    },
    {
      id: 'g3',
      name: 'Database Systems Study Group',
      courseCode: 'CS204',
      courseName: 'Database Management',
      nextMeeting: 'Mon 5:30 PM',
      room: 'Library Room A',
      members: 22,
      admin: 'sarah@university.edu'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newMeeting, setNewMeeting] = useState('');
  const [newRoom, setNewRoom] = useState('');

  const toggleJoin = (groupId) => {
    setJoinedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newG = {
      id: 'g_' + Date.now(),
      name: newGroupName.trim(),
      courseCode: newCourseCode.trim() || 'GEN101',
      courseName: newGroupName.trim(),
      nextMeeting: newMeeting.trim() || 'TBD',
      room: newRoom.trim() || 'Online Room',
      members: 1,
      admin: userEmail
    };
    setSampleGroups([newG, ...sampleGroups]);
    setJoinedGroups(prev => new Set(prev).add(newG.id));
    setNewGroupName('');
    setNewCourseCode('');
    setNewMeeting('');
    setNewRoom('');
    setShowAddModal(false);
  };

  return (
    <div className="planner-container">
      <div className="planner-header">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} weight="duotone" style={{ color: 'var(--accent)' }} />
            Collaborative Study Circles
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Join study groups, coordinate project meetings, and share academic notes with peers.
          </p>
        </div>

        <button 
          className="cohort-btn cohort-btn-primary" 
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} weight="bold" />
          <span>Create Study Circle</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '24px' }}>
        {sampleGroups.map(group => {
          const isJoined = joinedGroups.has(group.id);
          return (
            <div key={group.id} className="nm-out" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="badge" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
                  {group.courseCode}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} /> {group.members + (isJoined ? 1 : 0)} members
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
                {group.name}
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {group.courseName}
              </p>

              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} style={{ color: 'var(--accent)' }} />
                  <span>Next Meeting: <strong>{group.nextMeeting}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={15} style={{ color: 'var(--accent)' }} />
                  <span>Location: <strong>{group.room}</strong></span>
                </div>
              </div>

              <button
                className={`cohort-btn ${isJoined ? '' : 'cohort-btn-primary'}`}
                onClick={() => toggleJoin(group.id)}
                style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
              >
                {isJoined ? (
                  <>
                    <Check size={16} weight="bold" /> Joined Circle
                  </>
                ) : (
                  <>
                    <UserPlus size={16} weight="bold" /> Join Study Circle
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="login-bg-overlay" style={{ zIndex: 1000 }}>
          <div className="login-auth-card nm-out" style={{ maxWidth: '440px', width: '100%' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
              Create New Study Circle
            </h2>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Circle Name</label>
                <input
                  type="text"
                  className="cohort-input"
                  placeholder="e.g. Algorithms Prep"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Course Code</label>
                <input
                  type="text"
                  className="cohort-input"
                  placeholder="e.g. CS302"
                  value={newCourseCode}
                  onChange={e => setNewCourseCode(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Next Meeting Time</label>
                <input
                  type="text"
                  className="cohort-input"
                  placeholder="e.g. Thursday 3:00 PM"
                  value={newMeeting}
                  onChange={e => setNewMeeting(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Meeting Room / Location</label>
                <input
                  type="text"
                  className="cohort-input"
                  placeholder="e.g. Lab 4B or Zoom Link"
                  value={newRoom}
                  onChange={e => setNewRoom(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="cohort-btn cohort-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Create Circle
                </button>
                <button type="button" className="cohort-btn" onClick={() => setShowAddModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Groups;
