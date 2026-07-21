import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, CaretLeft, Trash, BookOpen, Clock, ListChecks, Folder } from '@phosphor-icons/react';
import { Repository } from './Repository';
import { Quizzes } from './Quizzes';

export function Courses({ 
  courses, 
  files, 
  quizzes, 
  quizAttempts, 
  userEmail, 
  onAddCourse, 
  onDeleteCourse,
  onAddFile,
  onDeleteFile,
  onToggleFileVisibility,
  onCreateQuiz,
  onDeleteQuiz,
  onSaveAttempt,
  onRefresh
}) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('resources'); // 'resources' | 'quizzes'
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    onAddCourse({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      room: room.trim() || 'Online'
    });

    setCode('');
    setName('');
    setRoom('');
    setShowAddModal(false);
  };

  if (selectedCourse) {
    // Nested view inside a selected course
    const courseFiles = files.filter(f => f.courseId === selectedCourse.id);
    const courseQuizzes = quizzes.filter(q => q.courseId === selectedCourse.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back and course headers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button 
            className="back-arrow-btn" 
            onClick={() => setSelectedCourse(null)}
            aria-label="Back to courses"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent)' }}>{selectedCourse.code}</span>
              <span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>•</span>
              <span>{selectedCourse.name}</span>
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Location: {selectedCourse.room}</span>
          </div>
        </div>

        {/* Tab switch bar */}
        <div className="timetable-toggle-container" style={{ marginBottom: '24px' }}>
          <div className="timetable-toggle-bar">
            <button 
              className={`timetable-toggle-btn ${activeSubTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('resources')}
              style={{ gap: '6px' }}
            >
              <Folder size={16} />
              <span>Resources ({courseFiles.length})</span>
            </button>
            <button 
              className={`timetable-toggle-btn ${activeSubTab === 'quizzes' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('quizzes')}
              style={{ gap: '6px' }}
            >
              <ListChecks size={16} />
              <span>Quizzes ({courseQuizzes.length})</span>
            </button>
          </div>
        </div>

        {/* Renders subtab panel views */}
        {activeSubTab === 'resources' ? (
          <Repository 
            courses={[selectedCourse]} // Force only active course dropdown
            files={courseFiles}
            userEmail={userEmail}
            onAddFile={onAddFile}
            onDeleteFile={onDeleteFile}
            onToggleFileVisibility={onToggleFileVisibility}
            onRefresh={onRefresh}
            nestedMode={true}
          />
        ) : (
          <Quizzes 
            courses={[selectedCourse]}
            quizzes={courseQuizzes}
            quizAttempts={quizAttempts}
            onCreateQuiz={onCreateQuiz}
            onDeleteQuiz={onDeleteQuiz}
            onSaveAttempt={onSaveAttempt}
            nestedMode={true}
          />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Title & Action header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>My Courses</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage your academic companion courses, files, and generated study quizzes.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="cohort-btn cohort-btn-primary"
          style={{ gap: '6px' }}
        >
          <Plus size={16} weight="bold" />
          <span>Add Course</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="peers-grid">
        {courses.length > 0 ? (
          courses.map(course => (
            <div 
              key={course.id} 
              className="peer-profile-card nm-out"
              onClick={() => {
                setSelectedCourse(course);
                setActiveSubTab('resources');
              }}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justify: 'space-between', minHeight: '160px', padding: '24px', textAlign: 'left' }}
            >
              <div>
                <span style={{ background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                  {course.code}
                </span>
                <strong style={{ fontSize: '16px', display: 'block', color: 'var(--text-primary)', marginTop: '12px', lineHeight: '1.3' }}>
                  {course.name}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginTop: '6px' }}>
                  Room: {course.room}
                </span>
              </div>

              <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700' }}>
                  Enter Workspace
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete ${course.code}? All nested files and quizzes will lose association.`)) {
                      onDeleteCourse(course.id);
                    }
                  }}
                  className="cohort-btn"
                  style={{ padding: '6px', border: 'none', background: 'transparent', boxShadow: 'none' }}
                  title="Delete course"
                >
                  <Trash size={14} style={{ color: 'var(--text-tertiary)' }} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="cohort-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
            No courses added yet. Click "Add Course" above to set up your subjects!
          </div>
        )}
      </div>

      {/* Add Course modal dialog */}
      {showAddModal && (
        <div className="login-bg-overlay" style={{ zIndex: 1100 }}>
          <div className="login-auth-card nm-out" style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', textAlign: 'center' }}>
              Add New Course
            </h3>
            
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Course Code</label>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="e.g. CS-301" 
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Name</label>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="e.g. Computer Architecture" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location / Lecture Room</label>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="e.g. Lab 3B (or Online)" 
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="cohort-btn cohort-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Create Subject
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
export default Courses;
