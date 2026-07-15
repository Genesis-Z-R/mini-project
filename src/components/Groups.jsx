import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, Calendar, Warning, ArrowLeft, Download, UserPlus, ShieldStar, CheckCircle, FilePdf, FileImage, Video, Link as LinkIcon, BookOpen } from '@phosphor-icons/react';

export function Groups({ 
  courses, 
  groups, 
  userEmail, 
  onCreateCircle, 
  onToggleJoin, 
  onPromoteAdmin, 
  onPostResource 
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [groupCourseId, setGroupCourseId] = useState('');
  const [meetingInfo, setMeetingInfo] = useState('');
  const [meetingRoom, setMeetingRoom] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Resource Post State
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState('pdf');
  const [resSize, setResSize] = useState('1.5 MB');
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newGroupName.trim()) {
      setError('Please provide a group name.');
      return;
    }
    if (!groupCourseId) {
      setError('Please select a course.');
      return;
    }
    if (!meetingInfo.trim()) {
      setError('Please provide meeting day/time.');
      return;
    }

    const courseObj = courses.find(c => c.id === groupCourseId);
    if (!courseObj) return;

    await onCreateCircle({
      name: newGroupName.trim(),
      courseId: groupCourseId,
      courseName: courseObj.name,
      nextMeeting: meetingInfo.trim(),
      room: meetingRoom.trim() || 'Library Pod 1'
    });

    setSuccess(`Created study circle "${newGroupName}"!`);
    setNewGroupName('');
    setMeetingInfo('');
    setMeetingRoom('');
    setTimeout(() => {
      setSuccess('');
      setShowCreateForm(false);
    }, 2000);
  };

  const handlePostResourceSubmit = async (e) => {
    e.preventDefault();
    setPostError('');
    setPostSuccess('');

    if (!resTitle.trim()) {
      setPostError('Please enter resource title.');
      return;
    }

    await onPostResource(selectedGroup.id, {
      title: resTitle.trim(),
      fileType: resType,
      size: resSize.trim()
    });

    setPostSuccess('Resource posted successfully!');
    setResTitle('');
    setTimeout(() => setPostSuccess(''), 3000);
  };

  const handleDownload = (file) => {
    const fileContent = `Estudy Shared Study Circle Resource\n` +
      `File Name: ${file.title}\n` +
      `File Size: ${file.size}\n` +
      `File Type: ${file.fileType.toUpperCase()}\n` +
      `Uploaded By: ${file.uploaderEmail}\n`;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (type) => {
    switch (type) {
      case 'pdf': return <FilePdf size={18} style={{ color: '#EF4444' }} />;
      case 'image': return <FileImage size={18} style={{ color: '#3B82F6' }} />;
      case 'video': return <Video size={18} style={{ color: '#8B5CF6' }} />;
      case 'link': return <LinkIcon size={18} style={{ color: '#10B981' }} />;
      default: return <BookOpen size={18} />;
    }
  };

  if (selectedGroup) {
    const isMember = selectedGroup.members.includes(userEmail);
    const isAdmin = selectedGroup.admins.includes(userEmail);

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back Button */}
        <button 
          className="back-arrow-btn" 
          onClick={() => { setSelectedGroupId(null); setPostError(''); setPostSuccess(''); }} 
          aria-label="Back" 
          style={{ marginBottom: '16px' }}
        >
          <ArrowLeft size={16} weight="bold" />
        </button>

        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>{selectedGroup.name}</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Course: {selectedGroup.courseName}</span>
          </div>
          <button 
            className={`cohort-btn ${isMember ? '' : 'cohort-btn-primary'}`}
            onClick={() => onToggleJoin(selectedGroup.id, isMember)}
          >
            {isMember ? 'Leave Circle' : 'Join Circle'}
          </button>
        </div>

        <div className="circle-board-layout">
          {/* Members list */}
          <div className="cohort-card nm-out" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} />
              Members ({selectedGroup.members.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedGroup.members.map(member => {
                const memberIsAdmin = selectedGroup.admins.includes(member);
                return (
                  <div key={member} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-navigation)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{member}</span>
                      {memberIsAdmin && (
                        <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: '700' }} title="Group Admin">
                          <ShieldStar size={14} weight="fill" style={{ marginRight: '2px' }} />
                          Admin
                        </span>
                      )}
                    </div>

                    {/* Promote to Admin button */}
                    {isAdmin && !memberIsAdmin && (
                      <button 
                        className="cohort-btn" 
                        onClick={() => onPromoteAdmin(selectedGroup.id, member)}
                        style={{ padding: '4px 8px', fontSize: '10px' }}
                        title="Promote to admin"
                      >
                        Make Admin
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Board Resource Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Admin post panel */}
            {isAdmin && (
              <div className="cohort-card nm-out" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px' }}>Post Study Material (Admin Only)</h3>
                
                {postError && (
                  <div className="alert-box" style={{ marginBottom: '12px' }}>
                    <span>{postError}</span>
                  </div>
                )}
                {postSuccess && (
                  <div className="success-box" style={{ marginBottom: '12px' }}>
                    <span>{postSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePostResourceSubmit}>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="cohort-input" 
                      placeholder="Title of materials..." 
                      value={resTitle}
                      onChange={e => setResTitle(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <select className="cohort-select" value={resType} onChange={e => setResType(e.target.value)}>
                      <option value="pdf">PDF Slide / Doc</option>
                      <option value="image">Graph / Image</option>
                      <option value="video">Lecture Video</option>
                      <option value="link">Web link</option>
                    </select>
                    <input 
                      type="text" 
                      className="cohort-input" 
                      placeholder="Size e.g. 2.4 MB" 
                      value={resSize}
                      onChange={e => setResSize(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="cohort-btn cohort-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                    <Plus size={15} />
                    Post Material
                  </button>
                </form>
              </div>
            )}

            {/* Resources Board */}
            <div className="cohort-card nm-out" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px' }}>Shared Materials Board</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedGroup.resources && selectedGroup.resources.length > 0 ? (
                  selectedGroup.resources.map(res => (
                    <div key={res.id} className="group-board-post-card nm-out">
                      <div className="group-board-post-header">
                        <span>Posted by: {res.uploaderEmail}</span>
                        <span>{res.uploadDate}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {getIcon(res.fileType)}
                          <div>
                            <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-primary)' }}>{res.title}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{res.size} • {res.fileType.toUpperCase()}</span>
                          </div>
                        </div>
                        {isMember && (
                          <button className="cohort-btn" onClick={() => handleDownload(res)} title="Download Material">
                            <Download size={14} weight="bold" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                    No materials shared on the board yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Study Circles</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Find, search, or build collaborative groups to share study materials.
          </p>
        </div>
        <button 
          className="cohort-btn cohort-btn-primary" 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ gap: '8px' }}
        >
          <Plus size={16} weight="bold" />
          <span>{showCreateForm ? 'Cancel' : 'Create Circle'}</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="cohort-card nm-out" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Create New Study Circle</h3>
          
          {error && (
            <div className="alert-box" style={{ marginBottom: '16px' }}>
              <Warning size={16} />
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
              <label className="form-label">Circle Name</label>
              <input 
                type="text" 
                className="cohort-input" 
                placeholder="e.g. Graphic Design Study Group" 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Associated Course</label>
              <select className="cohort-select" value={groupCourseId} onChange={e => setGroupCourseId(e.target.value)}>
                <option value="">Select a course...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Meeting Details</label>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="e.g. Saturdays at 14:00" 
                  value={meetingInfo} 
                  onChange={e => setMeetingInfo(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Room / Location (Optional)</label>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="e.g. Pod 1B, Zoom" 
                  value={meetingRoom} 
                  onChange={e => setMeetingRoom(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="cohort-btn cohort-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
              Create Study Circle
            </button>
          </form>
        </div>
      )}

      {/* Search Circle input */}
      <div style={{ marginBottom: '24px' }}>
        <input 
          type="text" 
          className="cohort-input" 
          placeholder="Search study circles by name or course..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Groups grid list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => {
            const isJoined = group.members.includes(userEmail);
            return (
              <div 
                key={group.id} 
                className="cohort-card nm-out" 
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', justify: 'space-between', height: '100%', cursor: 'pointer' }}
                onClick={() => setSelectedGroupId(group.id)}
              >
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{group.name}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{group.courseName}</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
                      <span>{group.nextMeeting}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
                      <span>{group.members.length} members</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', width: '100%' }}>
                  <button 
                    className="cohort-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroupId(group.id);
                    }}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Open Board
                  </button>
                  <button 
                    className={`cohort-btn ${isJoined ? '' : 'cohort-btn-primary'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleJoin(group.id, isJoined);
                    }}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {isJoined ? 'Leave' : 'Join'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="cohort-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
            No study circles found. Click "+ Create Circle" to start one!
          </div>
        )}
      </div>
    </motion.div>
  );
}
export default Groups;
