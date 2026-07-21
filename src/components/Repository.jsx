import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Trash, Warning, Download, MagnifyingGlass, Eye, EyeSlash, FilePdf, FileImage, Video, Link as LinkIcon, BookOpen, CheckCircle, Spinner, FileDoc 
} from '@phosphor-icons/react';
import { DatabaseService } from '../utils/db';

export function Repository({ 
  courses, 
  files, 
  userEmail, 
  onAddFile, 
  onDeleteFile, 
  onToggleFileVisibility, 
  onRefresh,
  nestedMode = false,
  initialSubTab = 'mine'
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);
  const [activeCategory, setActiveCategory] = useState('all');

  // File Upload Form State
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [fileType, setFileType] = useState('pdf');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    // Auto-detect type
    const ext = file.name.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      setFileType('image');
    } else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      setFileType('video');
    } else if (['docx', 'doc'].includes(ext)) {
      setFileType('docx');
    } else {
      setFileType('pdf'); // Default standard document
    }

    if (!title.trim()) {
      // Auto-fill title with filename without extension
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(nameWithoutExt);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedFile) {
      setError('Please select an actual file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a resource title.');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload actual file to Supabase Storage
      const { publicUrl, size } = await DatabaseService.uploadFileToStorage(selectedFile);
      
      // Calculate human-readable size
      const sizeStr = (size < 1024 * 1024) 
        ? (size / 1024).toFixed(1) + ' KB' 
        : (size / (1024 * 1024)).toFixed(1) + ' MB';

      // 2. Save metadata reference in files table
      const linkedCourse = nestedMode ? courses[0]?.id : (courseId || 'none');
      await onAddFile({
        title: title.trim(),
        courseId: linkedCourse,
        fileType,
        size: sizeStr,
        isPublic,
        url: publicUrl
      });

      setSuccess('Resource uploaded successfully to Supabase Storage!');
      setTitle('');
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('actual-file-picker');
      if (fileInput) fileInput.value = '';

      setTimeout(() => setSuccess(''), 3000);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please check your storage settings.');
    } finally {
      setUploading(false);
    }
  };

  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;

    try {
      const results = await DatabaseService.searchGlobalPublicFiles(globalSearchQuery.trim());
      setGlobalSearchResults(results);
      setSearched(true);
    } catch (err) {
      console.error("Global search error:", err);
    }
  };

  const handleCopyResource = async (file) => {
    try {
      await DatabaseService.addPublicFileToMine(file, userEmail);
      setSuccess(`"${file.title}" has been added to your My Resources folder!`);
      if (onRefresh) onRefresh();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error copying resource to your list.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDownload = (file) => {
    if (file.url) {
      window.open(file.url, '_blank');
    } else {
      // Fallback mock download
      const fileContent = `Estudy Resource Reference\nTitle: ${file.title}\nSize: ${file.size}\n`;
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Filter user's files
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
      {/* Sub Tab Switcher - Only display if not nested and not forced global search tab */}
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
        /* ============================================================
           MY RESOURCES VIEW (NESTED INSIDE A COURSE)
           ============================================================ */
        <div>
          {!nestedMode && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Study Resources</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Upload actual study guides and slides to your public/private folders.
              </p>
            </div>
          )}

          <div className="timetable-split-layout">
            {/* File list card */}
            <div className="cohort-card nm-out" style={{ padding: '24px' }}>
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
                    <div key={file.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-navigation)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {getIcon(file.fileType)}
                        <div>
                          <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--text-primary)' }}>{file.title}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {file.size} • {file.fileType.toUpperCase()} • {file.uploadDate}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          className="cohort-btn"
                          onClick={() => onToggleFileVisibility(file.id, !file.isPublic)}
                          title={file.isPublic ? 'Globally searchable by anyone' : 'Private to me'}
                          style={{ padding: '6px', border: 'none', background: 'transparent', boxShadow: 'none' }}
                        >
                          {file.isPublic ? (
                            <Eye size={16} style={{ color: 'var(--accent)' }} />
                          ) : (
                            <EyeSlash size={16} style={{ color: 'var(--text-tertiary)' }} />
                          )}
                        </button>

                        <button 
                          className="cohort-btn" 
                          onClick={() => handleDownload(file)}
                          title="Open or Download file"
                        >
                          <Download size={14} weight="bold" />
                        </button>

                        <button 
                          className="cohort-btn" 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${file.title}"?`)) {
                              onDeleteFile(file.id, file.url);
                            }
                          }}
                          style={{ padding: '6px', border: 'none', background: 'transparent', boxShadow: 'none' }}
                        >
                          <Trash size={15} style={{ color: 'var(--text-tertiary)' }} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '60px 0' }}>
                    No files uploaded yet. Select a file on the right to start!
                  </div>
                )}
              </div>
            </div>

            {/* Upload form card */}
            <div className="cohort-card nm-out" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '20px' }}>Upload Study File</h3>

              <form onSubmit={handleUploadSubmit}>
                <div className="form-group">
                  <label className="form-label">Select File</label>
                  <input 
                    type="file" 
                    id="actual-file-picker"
                    className="cohort-input" 
                    onChange={handleFileChange}
                    style={{ padding: '8px' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Resource Title</label>
                  <input 
                    type="text" 
                    className="cohort-input" 
                    placeholder="Chapter 2 slides..." 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                {!nestedMode && (
                  <div className="form-group">
                    <label className="form-label">Linked Course</label>
                    <select className="cohort-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
                      <option value="">None / General Reference</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Detected Type</label>
                  <select className="cohort-select" value={fileType} onChange={e => setFileType(e.target.value)}>
                    <option value="pdf">PDF Document</option>
                    <option value="docx">Word Document (.docx)</option>
                    <option value="image">Image/Graph</option>
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
                      <span>Uploading to Supabase Storage...</span>
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
          </div>
        </div>
      ) : (
        /* ============================================================
           GLOBAL PUBLIC SEARCH VIEW
           ============================================================ */
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Global Public Search</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Search globally shared materials uploaded by any student on Estudy.
            </p>
          </div>

          <div className="cohort-card nm-out" style={{ padding: '24px' }}>
            <form onSubmit={handleGlobalSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input 
                type="text" 
                className="cohort-input" 
                placeholder="e.g. introduction to economics" 
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="cohort-btn cohort-btn-primary" style={{ gap: '8px' }}>
                <MagnifyingGlass size={16} weight="bold" />
                <span>Search Resources</span>
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {globalSearchResults.length > 0 ? (
                globalSearchResults.map(file => {
                  const isOwnFile = file.userId === userEmail;
                  return (
                    <div key={file.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-navigation)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {getIcon(file.fileType)}
                        <div>
                          <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--text-primary)' }}>{file.title}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {file.size} • {file.fileType.toUpperCase()} • Shared by: {file.userId}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!isOwnFile && (
                          <button 
                            className="cohort-btn cohort-btn-primary" 
                            onClick={() => handleCopyResource(file)}
                            style={{ padding: '6px 12px', fontSize: '11.5px', gap: '4px' }}
                          >
                            <Plus size={12} weight="bold" />
                            Add to My Resources
                          </button>
                        )}
                        <button 
                          className="cohort-btn" 
                          onClick={() => handleDownload(file)}
                          style={{ padding: '6px' }}
                        >
                          <Download size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : searched ? (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                  No public resources found matching your search.
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                  Enter a keyword above to scan the globally shared study repository.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
export default Repository;
