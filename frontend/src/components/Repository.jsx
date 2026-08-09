import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FilePdf, FileImage, Video, FileDoc, BookOpen, Plus, Trash, Globe, Lock, Download, 
  MagnifyingGlass, CheckCircle, Warning, Spinner, GraduationCap, Sparkle, Funnel, Clock
} from '@phosphor-icons/react';
import { DatabaseService } from '../utils/db';

export function Repository({ 
  courses = [], 
  files = [], 
  userEmail = '', 
  onAddFile, 
  onDeleteFile, 
  onToggleFileVisibility,
  onRefresh,
  courseId,
  nestedMode = false,
  initialSubTab = 'mine'
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // 'mine' | 'global_search'
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Upload Form State
  const [fileTitle, setFileTitle] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(courseId || 'none');
  const [fileType, setFileType] = useState('pdf');
  const [isPublic, setIsPublic] = useState(true);

  // Global Search State & Filters
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const [filterProgrammeOnly, setFilterProgrammeOnly] = useState(false);
  const [filterSameCourseOnly, setFilterSameCourseOnly] = useState(false);
  const [filterFileType, setFilterFileType] = useState('ALL');
  const [filterRecentOnly, setFilterRecentOnly] = useState(false);

  useEffect(() => {
    if (courseId) {
      setSelectedCourseId(courseId);
    }
  }, [courseId]);

  // Execute global search whenever query or filters change
  const executeGlobalSearch = async (queryToUse = globalSearchQuery) => {
    if (!queryToUse.trim()) {
      setGlobalSearchResults([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    try {
      const results = await DatabaseService.searchGlobalPublicFiles(queryToUse, userEmail, {
        programmeOnly: filterProgrammeOnly,
        sameCourseOnly: filterSameCourseOnly,
        fileType: filterFileType,
        recentOnly: filterRecentOnly
      });
      setGlobalSearchResults(results || []);
      setSearched(true);
    } catch (err) {
      console.error("Global search error:", err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'global_search') {
      if (globalSearchQuery.trim()) {
        executeGlobalSearch();
      } else {
        setGlobalSearchResults([]);
        setSearched(false);
      }
    }
  }, [activeSubTab, globalSearchQuery, filterProgrammeOnly, filterSameCourseOnly, filterFileType, filterRecentOnly]);

  const handleGlobalSearchSubmit = (e) => {
    e.preventDefault();
    executeGlobalSearch();
  };

  const showNotification = (msg, isSuccess = true) => {
    if (isSuccess) {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!fileTitle) {
        setFileTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      const ext = file.name.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) setFileType('image');
      else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) setFileType('video');
      else if (['doc', 'docx'].includes(ext)) setFileType('docx');
      else setFileType('pdf');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showNotification("Please select a physical file to upload.", false);
      return;
    }
    if (!fileTitle.trim()) {
      showNotification("Please provide a title for the resource.", false);
      return;
    }

    setUploading(true);
    try {
      const storageResult = await DatabaseService.uploadFileToStorage(selectedFile);
      const newFileObj = {
        title: fileTitle.trim(),
        courseId: selectedCourseId || 'none',
        fileType,
        size: storageResult.sizeStr,
        downloads: 0,
        isPublic,
        uploadDate: new Date().toISOString().split('T')[0],
        userId: userEmail,
        url: storageResult.publicUrl
      };

      await onAddFile(newFileObj);
      showNotification(`"${fileTitle}" uploaded successfully!`);

      setSelectedFile(null);
      setFileTitle('');
      setIsPublic(true);
    } catch (err) {
      showNotification(err.message || "Failed to upload file to storage.", false);
    } finally {
      setUploading(false);
    }
  };

  const handleCopyResource = async (file) => {
    try {
      await DatabaseService.addPublicFileToMine(file, userEmail);
      showNotification(`"${file.title}" added to your My Resources folder!`);
      onRefresh();
    } catch (err) {
      showNotification("Failed to add resource.", false);
    }
  };

  const [fileToDelete, setFileToDelete] = useState(null);

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      await onDeleteFile(fileToDelete.id);
      showNotification(`"${fileToDelete.title}" deleted successfully!`);
      setFileToDelete(null);
    } catch (err) {
      showNotification(err.message || "Failed to delete file.", false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const res = await DatabaseService.getFileDownloadUrl(file.id);
      if (res && res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      } else if (file.url) {
        window.open(file.url, '_blank');
      }
    } catch (err) {
      if (file.url) {
        window.open(file.url, '_blank');
      } else {
        showNotification(err.message || "Failed to generate download link.", false);
      }
    }
  };

  const filteredMyFiles = files.filter(f => {
    if (activeCategory === 'all') return true;
    return f.fileType === activeCategory;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'pdf': return <FilePdf size={20} style={{ color: '#EF4444' }} />;
      case 'image': return <FileImage size={20} style={{ color: '#3B82F6' }} />;
      case 'video': return <Video size={20} style={{ color: '#8B5CF6' }} />;
      case 'docx': return <FileDoc size={20} style={{ color: '#2563EB' }} />;
      default: return <BookOpen size={20} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {!nestedMode && initialSubTab !== 'global_search' && (
        <div className="timetable-toggle-container" style={{ marginBottom: '24px' }}>
          <div className="timetable-toggle-bar">
            <button 
              className={`timetable-toggle-btn ${activeSubTab === 'mine' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('mine')}
            >
              My Resources
            </button>
            <button 
              className={`timetable-toggle-btn ${activeSubTab === 'global_search' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('global_search')}
            >
              Search Public Resources
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="success-box" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} weight="fill" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-box" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Warning size={16} weight="bold" />
          <span>{error}</span>
        </div>
      )}

      {activeSubTab === 'mine' ? (
        /* MY RESOURCES VIEW */
        <div>
          {!nestedMode && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Study Resources</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Upload actual study guides and slides to your public/private folders.
              </p>
            </div>
          )}

          <div className={nestedMode ? "my-resources-single-layout" : "timetable-split-layout"}>
            <div className="cohort-card nm-out" style={{ padding: '24px', flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', overflowX: 'auto' }}>
                {['all', 'pdf', 'image', 'video', 'docx'].map(cat => (
                  <button
                    key={cat}
                    className={`pref-day-btn ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                    style={{ padding: '6px 12px', fontSize: '12px', border: 'none' }}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredMyFiles.length > 0 ? (
                  filteredMyFiles.map(file => (
                    <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-navigation)', borderRadius: '12px', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                          {getIcon(file.fileType)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.title}
                          </strong>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            <span>{file.size}</span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: file.isPublic ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                              {file.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                              {file.isPublic ? 'Public' : 'Private'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          className={`cohort-btn visibility-toggle-btn ${file.isPublic ? 'is-public' : 'is-private'}`}
                          onClick={async () => {
                            try {
                              await onToggleFileVisibility(file.id, !file.isPublic);
                            } catch (err) {
                              showNotification("Failed to update resource privacy.", false);
                            }
                          }}
                          title={file.isPublic ? "Click to make Private" : "Click to make Public"}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: file.isPublic ? 'var(--badge-blue-bg, rgba(59, 130, 246, 0.1))' : 'var(--bg-surface)',
                            color: file.isPublic ? 'var(--brand-blue, #2563EB)' : 'var(--text-secondary)',
                            border: `1px solid ${file.isPublic ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-color)'}`
                          }}
                        >
                          {file.isPublic ? <Globe size={14} weight="bold" /> : <Lock size={14} weight="bold" />}
                          <span>{file.isPublic ? 'Public' : 'Private'}</span>
                        </button>
                        <button 
                          className="cohort-btn"
                          onClick={() => handleDownload(file)}
                          style={{ padding: '6px' }}
                          title="Download File"
                        >
                          <Download size={14} weight="bold" />
                        </button>
                        <button 
                          className="cohort-btn"
                          onClick={() => setFileToDelete(file)}
                          style={{ padding: '6px', color: '#EF4444' }}
                          title="Delete File"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                    {nestedMode ? 'No uploaded resources for this course.' : 'No files found in this category. Use the upload panel to add files!'}
                  </div>
                )}
              </div>
            </div>

            {/* UPLOAD FORM - Hidden in nestedMode (My Courses) */}
            {!nestedMode && (
              <div className="cohort-card nm-out" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Upload Resource
                </h3>

                <form onSubmit={handleUploadSubmit}>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Select Local File</label>
                    <input 
                      type="file" 
                      onChange={handleFileSelect}
                      className="cohort-input"
                      style={{ padding: '8px' }}
                      required
                    />
                    {selectedFile && (
                      <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Document Title</label>
                    <input 
                      type="text" 
                      className="cohort-input" 
                      placeholder="e.g. Chapter 3 Summary Notes" 
                      value={fileTitle}
                      onChange={e => setFileTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Associate Course</label>
                    <select 
                      className="cohort-select" 
                      value={selectedCourseId}
                      onChange={e => setSelectedCourseId(e.target.value)}
                    >
                      <option value="none">General / No Course</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">File Format / Category</label>
                    <select 
                      className="cohort-select" 
                      value={fileType}
                      onChange={e => setFileType(e.target.value)}
                    >
                      <option value="pdf">Academic Document (PDF)</option>
                      <option value="docx">Word Document (.docx / .doc)</option>
                      <option value="image">Diagram / Image</option>
                      <option value="video">Lecture Video</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
                    <input 
                      type="checkbox" 
                      id="isPublicCheck"
                      checked={isPublic} 
                      onChange={e => setIsPublic(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="isPublicCheck" className="form-label" style={{ margin: 0, cursor: 'pointer', fontWeight: '700' }}>
                      Make visible to everyone (globally searchable)
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    className="cohort-btn cohort-btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: '12px', gap: '8px' }}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Spinner size={16} className="animate-spin" />
                        <span>Uploading to Storage...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} weight="bold" />
                        <span>Upload to Resources</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* GLOBAL ACADEMIC RESOURCE SEARCH VIEW */
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Global Academic Resource Search</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Search academic materials prioritized by programme relevance, course match, and search keywords.
            </p>
          </div>

          <div className="cohort-card nm-out" style={{ padding: '24px' }}>
            {/* Search Input Bar */}
            <form onSubmit={handleGlobalSearchSubmit} className="global-search-bar-container" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <input 
                type="text" 
                className="cohort-input" 
                placeholder="Search resources by title or course code (e.g., Database Notes, CSM 352)..." 
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="cohort-btn cohort-btn-primary" style={{ gap: '8px', padding: '10px 20px' }}>
                <MagnifyingGlass size={16} weight="bold" />
                <span>Search</span>
              </button>
            </form>

            {/* Filter Control Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-navigation)', borderRadius: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                <Funnel size={14} />
                <span>Filters:</span>
              </div>

              {/* Same Programme Filter */}
              <button
                type="button"
                className={`cohort-btn ${filterProgrammeOnly ? 'cohort-btn-primary' : ''}`}
                onClick={() => setFilterProgrammeOnly(!filterProgrammeOnly)}
                style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px' }}
              >
                🎓 Same Programme Only
              </button>

              {/* Same Course Filter */}
              <button
                type="button"
                className={`cohort-btn ${filterSameCourseOnly ? 'cohort-btn-primary' : ''}`}
                onClick={() => setFilterSameCourseOnly(!filterSameCourseOnly)}
                style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px' }}
              >
                📚 Same Course Only
              </button>

              {/* Recently Uploaded Filter */}
              <button
                type="button"
                className={`cohort-btn ${filterRecentOnly ? 'cohort-btn-primary' : ''}`}
                onClick={() => setFilterRecentOnly(!filterRecentOnly)}
                style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px' }}
              >
                <Clock size={12} />
                <span>Recently Uploaded (30 Days)</span>
              </button>

              {/* File Type Filter */}
              <select
                className="cohort-select"
                value={filterFileType}
                onChange={e => setFilterFileType(e.target.value)}
                style={{ fontSize: '11.5px', padding: '4px 8px', width: 'auto' }}
              >
                <option value="ALL">All File Types</option>
                <option value="pdf">PDF Documents</option>
                <option value="docx">Word (.docx)</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
              </select>
            </div>

            {/* Search Results List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {searching ? (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', padding: '40px 0' }}>
                  Scanning globally shared study repository...
                </div>
              ) : globalSearchResults.length > 0 ? (
                globalSearchResults.map(file => {
                  const isOwnFile = file.userId === userEmail;
                  return (
                    <div key={file.id} className="public-resource-item">
                      <div className="public-resource-content">
                        <div style={{ marginTop: '2px', flexShrink: 0 }}>
                          {getIcon(file.fileType)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '15px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', wordBreak: 'break-word' }}>
                              {file.title}
                            </strong>
                            {file.relevanceScore > 0 && (
                              <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Sparkle size={10} weight="fill" />
                                Score: {file.relevanceScore}
                              </span>
                            )}
                          </div>

                          <div className="public-resource-meta" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            <span>Uploaded by: <strong>{file.uploaderName}</strong></span>
                            <span>•</span>
                            <span style={{ color: 'var(--accent)', fontWeight: '700' }}>🎓 {file.uploaderProgrammeName}</span>
                            {file.uploaderYear && (
                              <>
                                <span>•</span>
                                <span>Year: {file.uploaderYear}</span>
                              </>
                            )}
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
                            <span>{file.fileType.toUpperCase()} • {file.size}</span>
                            <span>•</span>
                            <span>📥 {file.downloads || 0} downloads</span>
                            {file.uploadDate && <span>• {file.uploadDate}</span>}
                          </div>

                          {/* Match Reasons Badges */}
                          {file.matchReasons && file.matchReasons.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {file.matchReasons.map((reason, idx) => (
                                <span key={idx} style={{ fontSize: '9.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="public-resource-actions">
                        {!isOwnFile && (
                          <button 
                            className="cohort-btn cohort-btn-primary" 
                            onClick={() => handleCopyResource(file)}
                            style={{ padding: '8px 14px', fontSize: '12px', gap: '6px' }}
                          >
                            <Plus size={14} weight="bold" />
                            <span>Add to My Resources</span>
                          </button>
                        )}
                        <button 
                          className="cohort-btn" 
                          onClick={() => handleDownload(file)}
                          style={{ padding: '8px 12px' }}
                          title="Download Resource"
                        >
                          <Download size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : searched ? (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                  No public academic resources found matching your active filters. Try clearing filters or searching for keywords!
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                  Type something in the search bar above to discover resources.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {fileToDelete && (
        <div className="estudy-modal-overlay" onClick={() => setFileToDelete(null)}>
          <div className="estudy-modal-container" onClick={e => e.stopPropagation()}>
            <div className="estudy-modal-header">
              <h3 className="estudy-modal-title">
                <Warning size={22} style={{ color: '#EF4444' }} weight="bold" />
                <span>Confirm Resource Deletion</span>
              </h3>
            </div>
            <div className="estudy-modal-body">
              Are you sure you want to delete <strong>"{fileToDelete.title}"</strong>? This will permanently remove the resource from your workspace and storage.
            </div>
            <div className="estudy-modal-footer">
              <button 
                className="estudy-modal-btn-cancel" 
                onClick={() => setFileToDelete(null)}
              >
                Cancel
              </button>
              <button 
                className="estudy-modal-btn-danger" 
                onClick={confirmDeleteFile}
              >
                Delete Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Repository;
