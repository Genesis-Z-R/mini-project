import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, CaretLeft, Trash, BookOpen, Clock, ListChecks, Folder, PencilSimple, Warning, ArrowRight } from '@phosphor-icons/react';
import { Repository } from './Repository';
import { Quizzes } from './Quizzes';

export function Courses({ 
  courses = [], 
  files = [], 
  quizzes = [], 
  quizAttempts = [], 
  userEmail, 
  onAddCourse, 
  onUpdateCourse,
  onDeleteCourse,
  onAddFile,
  onDeleteFile,
  onToggleFileVisibility,
  onCreateQuiz,
  onDeleteQuiz,
  onSaveAttempt,
  onRefresh,
  targetCourseId = null
}) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'resources' | 'quizzes'

  useEffect(() => {
    if (targetCourseId && courses.length > 0) {
      const found = courses.find(c => c.id === targetCourseId);
      if (found) {
        setSelectedCourse(found);
        setActiveSubTab('overview');
      }
    }
  }, [targetCourseId, courses]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');

  // Handle browser back button (popstate)
  useEffect(() => {
    const handlePopState = (e) => {
      const state = e.state;
      if (state && state.courseId) {
        const found = courses.find(c => c.id === state.courseId);
        if (found) {
          setSelectedCourse(found);
          setActiveSubTab(state.subTab || 'overview');
        } else {
          setSelectedCourse(null);
          setActiveSubTab('overview');
        }
      } else {
        setSelectedCourse(null);
        setActiveSubTab('overview');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [courses]);

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setActiveSubTab('overview');
    if (window.history && window.history.pushState) {
      window.history.pushState({ courseId: course.id, subTab: 'overview' }, '');
    }
  };

  const handleNavigateSubTab = (subTab) => {
    setActiveSubTab(subTab);
    if (window.history && window.history.pushState && selectedCourse) {
      window.history.pushState({ courseId: selectedCourse.id, subTab }, '');
    }
  };

  const handleBackClick = () => {
    if (activeSubTab === 'resources' || activeSubTab === 'quizzes') {
      // First Back action: Return from subpage to Selected Course landing view
      setActiveSubTab('overview');
      if (window.history && window.history.pushState && selectedCourse) {
        window.history.pushState({ courseId: selectedCourse.id, subTab: 'overview' }, '');
      }
    } else {
      // Second Back action: Return from Selected Course landing view to main Courses page
      setSelectedCourse(null);
      setActiveSubTab('overview');
      if (window.history && window.history.pushState) {
        window.history.pushState({ courseId: null, subTab: null }, '');
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingCourse(null);
    setCode('');
    setName('');
    setRoom('');
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setCode(course.code || '');
    setName(course.name || '');
    setRoom(course.room || '');
    setModalError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const normCode = code.trim().toUpperCase().replace(/\s+/g, '');
    const normName = name.trim().toUpperCase().replace(/\s+/g, '');

    if (!normCode || !normName) {
      setModalError('Please enter both course code and course name.');
      return;
    }

    // Frontend duplicate check
    const otherCourses = editingCourse 
      ? courses.filter(c => c.id !== editingCourse.id) 
      : courses;

    for (const c of otherCourses) {
      const existingNormCode = c.code ? c.code.trim().toUpperCase().replace(/\s+/g, '') : '';
      const existingNormName = c.name ? c.name.trim().toUpperCase().replace(/\s+/g, '') : '';

      if (existingNormCode === normCode) {
        setModalError('A course with this code already exists.');
        return;
      }
      if (existingNormName === normName) {
        setModalError('A course with this name already exists.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (editingCourse) {
        if (onUpdateCourse) {
          await onUpdateCourse(editingCourse.id, {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            room: room.trim() || 'Online'
          });
        }
      } else {
        if (onAddCourse) {
          await onAddCourse({
            code: code.trim().toUpperCase(),
            name: name.trim(),
            room: room.trim() || 'Online'
          });
        }
      }

      // Success: reset form and close modal
      setCode('');
      setName('');
      setRoom('');
      setModalError('');
      setEditingCourse(null);
      setShowModal(false);
    } catch (err) {
      // Failure: Display backend error message and keep modal open with values intact
      setModalError(err.message || 'Failed to save course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render view inside a selected course
  if (selectedCourse) {
    const courseFiles = files.filter(f => f.courseId === selectedCourse.id);
    const courseQuizzes = quizzes.filter(q => q.courseId === selectedCourse.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back navigation header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="back-arrow-btn" 
              onClick={handleBackClick}
              aria-label="Back"
              title={activeSubTab === 'overview' ? "Back to All Courses" : "Back to Course Workspace"}
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <span style={{ color: 'var(--accent)' }}>{selectedCourse.code}</span>
                <span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>•</span>
                <span>{selectedCourse.name}</span>
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginTop: '2px' }}>
                Location: {selectedCourse.room}
              </span>
            </div>
          </div>

          {(activeSubTab === 'resources' || activeSubTab === 'quizzes') && (
            <div className="timetable-toggle-container" style={{ margin: 0 }}>
              <div className="timetable-toggle-bar">
                <button 
                  className={`timetable-toggle-btn ${activeSubTab === 'resources' ? 'active' : ''}`}
                  onClick={() => handleNavigateSubTab('resources')}
                >
                  <Folder size={16} />
                  <span>Resources ({courseFiles.length})</span>
                </button>
                <button 
                  className={`timetable-toggle-btn ${activeSubTab === 'quizzes' ? 'active' : ''}`}
                  onClick={() => handleNavigateSubTab('quizzes')}
                >
                  <ListChecks size={16} />
                  <span>Quizzes ({courseQuizzes.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Level 1: Selected Course Overview / Landing View */}
        {activeSubTab === 'overview' && (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Select a workspace category below to view study materials or take practice quizzes for this course.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Resources Card */}
              <div 
                className="cohort-card nm-out"
                onClick={() => handleNavigateSubTab('resources')}
                style={{ 
                  cursor: 'pointer', 
                  padding: '28px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  minHeight: '200px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <Folder size={36} weight="duotone" style={{ color: 'var(--accent)' }} />
                    <span style={{ background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px' }}>
                      {courseFiles.length} File{courseFiles.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Course Resources
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Access slides, lecture PDFs, notes, and uploaded reference materials for {selectedCourse.code}.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: '700', fontSize: '13px', marginTop: '20px' }}>
                  <span>Open Resources</span>
                  <ArrowRight size={16} weight="bold" />
                </div>
              </div>

              {/* Quizzes Card */}
              <div 
                className="cohort-card nm-out"
                onClick={() => handleNavigateSubTab('quizzes')}
                style={{ 
                  cursor: 'pointer', 
                  padding: '28px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  minHeight: '200px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <ListChecks size={36} weight="duotone" style={{ color: 'var(--accent-secondary)' }} />
                    <span style={{ background: 'var(--badge-green-bg)', color: 'var(--badge-green-text)', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px' }}>
                      {courseQuizzes.length} Quiz{courseQuizzes.length !== 1 ? 'zes' : ''}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Quizzes & Drills
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Take interactive practice quizzes, test your understanding, and review attempt scores.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-secondary)', fontWeight: '700', fontSize: '13px', marginTop: '20px' }}>
                  <span>Open Quizzes</span>
                  <ArrowRight size={16} weight="bold" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Level 2: Subpage Views (Resources or Quizzes) */}
        {(activeSubTab === 'resources' || activeSubTab === 'quizzes') && (
          <div>
            {/* Subtab content views */}
            {activeSubTab === 'resources' ? (
              <Repository 
                courses={[selectedCourse]}
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
          </div>
        )}
      </motion.div>
    );
  }

  // Level 0: Main Courses Page List
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
          onClick={handleOpenAddModal}
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
              onClick={() => handleSelectCourse(course)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px', padding: '24px', textAlign: 'left' }}
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700' }}>
                  Enter Workspace
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(course);
                    }}
                    className="cohort-btn"
                    style={{ padding: '6px', border: 'none', background: 'transparent', boxShadow: 'none' }}
                    title="Edit course"
                  >
                    <PencilSimple size={15} style={{ color: 'var(--text-secondary)' }} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCourseToDelete(course);
                    }}
                    className="cohort-btn"
                    style={{ padding: '6px', border: 'none', background: 'transparent', boxShadow: 'none' }}
                    title="Delete course"
                  >
                    <Trash size={15} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="cohort-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
            No courses added yet. Click "Add Course" above to set up your subjects!
          </div>
        )}
      </div>

      {/* Add / Edit Course modal dialog */}
      {showModal && (
        <div className="estudy-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="estudy-modal-container" onClick={e => e.stopPropagation()}>
            <div className="estudy-modal-header">
              <h3 className="estudy-modal-title">
                <GraduationCap size={22} style={{ color: 'var(--brand-blue)' }} weight="bold" />
                <span>{editingCourse ? 'Edit Course' : 'Add New Course'}</span>
              </h3>
            </div>

            {modalError && (
              <div className="alert-box" style={{ marginBottom: '16px' }}>
                <Warning size={16} />
                <span>{modalError}</span>
              </div>
            )}
            
            <form onSubmit={handleFormSubmit}>
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

              <div className="estudy-modal-footer">
                <button 
                  type="button" 
                  className="estudy-modal-btn-cancel" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="estudy-modal-btn-primary" 
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {courseToDelete && (
        <div className="estudy-modal-overlay" onClick={() => setCourseToDelete(null)}>
          <div className="estudy-modal-container" onClick={e => e.stopPropagation()}>
            <div className="estudy-modal-header">
              <h3 className="estudy-modal-title">
                <Warning size={22} style={{ color: '#EF4444' }} weight="bold" />
                <span>Confirm Course Deletion</span>
              </h3>
            </div>
            <div className="estudy-modal-body">
              Are you sure you want to delete <strong>"{courseToDelete.code} - {courseToDelete.name}"</strong>? All associated schedule items and file references will lose association.
            </div>
            <div className="estudy-modal-footer">
              <button 
                className="estudy-modal-btn-cancel" 
                onClick={() => setCourseToDelete(null)}
              >
                Cancel
              </button>
              <button 
                className="estudy-modal-btn-danger" 
                onClick={() => {
                  onDeleteCourse(courseToDelete.id);
                  setCourseToDelete(null);
                }}
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Courses;
