import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Trash, Warning, Download, MagnifyingGlass, User, Eye, EyeSlash, FilePdf, FileImage, Video, Link as LinkIcon 
} from '@phosphor-icons/react';
import { firestoreDb } from '../utils/db';
import { collection, getDocs, query, where } from 'firebase/firestore';

export function Repository({ courses, files, userEmail, onAddFile, onDeleteFile, onToggleFileVisibility }) {
  const [activeSubTab, setActiveSubTab] = useState('mine'); // 'mine' or 'peers'
  const [activeCategory, setActiveCategory] = useState('all');

  // File Upload Form State
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [fileSize, setFileSize] = useState('2.4 MB');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Peers Search State
  const [peerSearchQuery, setPeerSearchQuery] = useState('');
  const [peersList, setPeersList] = useState([]);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [peerFiles, setPeerFiles] = useState([]);

  // Fetch peers on mount / search change
  useEffect(() => {
    const fetchPeers = async () => {
      try {
        const qSnap = await getDocs(collection(firestoreDb, 'users'));
        const list = qSnap.docs
          .map(d => d.data())
          .filter(u => u.email !== userEmail);
        setPeersList(list);
      } catch (err) {
        console.error("Error fetching peers:", err);
      }
    };
    if (activeSubTab === 'peers') {
      fetchPeers();
    }
  }, [activeSubTab, userEmail]);

  // Fetch selected peer's public resources
  useEffect(() => {
    const fetchPeerFiles = async () => {
      if (!selectedPeer) return;
      try {
        const qSnap = await getDocs(
          query(
            collection(firestoreDb, 'files'), 
            where('userId', '==', selectedPeer.email), 
            where('isPublic', '==', true)
          )
        );
        setPeerFiles(qSnap.docs.map(d => d.data()));
      } catch (err) {
        console.error("Error fetching peer files:", err);
      }
    };
    fetchPeerFiles();
  }, [selectedPeer]);

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Please enter a resource title.');
      return;
    }

    onAddFile({
      title: title.trim(),
      courseId: courseId || 'none',
      fileType,
      size: fileSize.trim(),
      isPublic
    });

    setSuccess('Resource metadata uploaded successfully!');
    setTitle('');
    setCourseId('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDownload = (file) => {
    // Generate custom text blob content simulating actual files
    const fileContent = `Estudy Academic Companion\n` +
      `File Name: ${file.title}\n` +
      `File Size: ${file.size}\n` +
      `File Type: ${file.fileType.toUpperCase()}\n` +
      `Uploaded By: ${file.userId}\n` +
      `This mock download represents the real study resource compiled on Estudy.\n`;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.title.replace(/\s+/g, '_')}.${file.fileType === 'link' ? 'url' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter user's own files
  const myFiles = files.filter(f => f.userId === userEmail);
  const filteredMyFiles = myFiles.filter(f => {
    if (activeCategory === 'all') return true;
    return f.fileType === activeCategory;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'pdf': return <FilePdf size={20} style={{ color: '#EF4444' }} />;
      case 'image': return <FileImage size={20} style={{ color: '#3B82F6' }} />;
      case 'video': return <Video size={20} style={{ color: '#8B5CF6' }} />;
      case 'link': return <LinkIcon size={20} style={{ color: '#10B981' }} />;
      default: return <BookOpen size={20} />;
    }
  };

  const filteredPeers = peersList.filter(p => 
    p.name.toLowerCase().includes(peerSearchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(peerSearchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Tab Switcher */}
      <div className="timetable-toggle-container">
        <div className="timetable-toggle-bar">
          <button 
            className={`timetable-toggle-btn ${activeSubTab === 'mine' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('mine'); setSelectedPeer(null); }}
          >
            My Resources
          </button>
          <button 
            className={`timetable-toggle-btn ${activeSubTab === 'peers' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('peers')}
          >
            Peers Directory
          </button>
        </div>
      </div>

      {activeSubTab === 'mine' ? (
        /* ============================================================
           MY RESOURCES TAB
           ============================================================ */
        <div>
          <div className="resources-header-row" style={{ marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Study Resources</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Store course guides, lectures, and images. Configure visibility to share with peers.
              </p>
            </div>
          </div>

          <div className="timetable-split-layout">
            {/* File List */}
            <div className="cohort-card nm-out" style={{ padding: '24px' }}>
              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                {['all', 'pdf', 'image', 'video', 'link'].map(cat => (
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
                        {/* Public/Private indicator button */}
                        <button
                          className="cohort-btn"
                          onClick={() => onToggleFileVisibility(file.id, !file.isPublic)}
                          title={file.isPublic ? 'Visible to peers' : 'Private to me'}
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
                          style={{ padding: '6px' }}
                        >
                          <Download size={14} weight="bold" />
                        </button>

                        <button 
                          className="cohort-btn" 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${file.title}"?`)) {
                              onDeleteFile(file.id);
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
                    No files found in this category.
                  </div>
                )}
              </div>
            </div>

            {/* File Form */}
            <div className="cohort-card nm-out" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '20px' }}>Upload Resource Reference</h3>
              
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

              <form onSubmit={handleUploadSubmit}>
                <div className="form-group">
                  <label className="form-label">Resource Title</label>
                  <input 
                    type="text" 
                    className="cohort-input" 
                    placeholder="e.g. Chapter 4 Slides" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Linked Course</label>
                  <select className="cohort-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
                    <option value="">None / Other</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Resource Type</label>
                  <select className="cohort-select" value={fileType} onChange={e => setFileType(e.target.value)}>
                    <option value="pdf">PDF Document</option>
                    <option value="image">Image/Graph</option>
                    <option value="video">Video Lecture</option>
                    <option value="link">Web Resource Link</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">File Size</label>
                  <input 
                    type="text" 
                    className="cohort-input" 
                    placeholder="e.g. 1.2 MB or 4.5 MB" 
                    value={fileSize} 
                    onChange={e => setFileSize(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="isPublicCheck"
                    checked={isPublic} 
                    onChange={e => setIsPublic(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isPublicCheck" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                    Make this resource public to other students
                  </label>
                </div>

                <button type="submit" className="cohort-btn cohort-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                  <Plus size={16} />
                  Upload Resource Metadata
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================
           PEERS DIRECTORY TAB
           ============================================================ */
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Peers Directory</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            Find registered students and view their shared public study materials.
          </p>

          {!selectedPeer ? (
            <div>
              {/* Search Box */}
              <div className="peers-search-bar">
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="Search students by name or email..." 
                  value={peerSearchQuery}
                  onChange={e => setPeerSearchQuery(e.target.value)}
                />
              </div>

              {/* Peers grid */}
              <div className="peers-grid">
                {filteredPeers.length > 0 ? (
                  filteredPeers.map(peer => (
                    <div 
                      key={peer.id} 
                      className="peer-profile-card nm-out"
                      onClick={() => setSelectedPeer(peer)}
                    >
                      <div className="peer-avatar">
                        <User size={24} weight="bold" />
                      </div>
                      <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-primary)' }}>{peer.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>{peer.email}</span>
                      <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700', marginTop: '8px' }}>
                        {peer.year} | {peer.group}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="cohort-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    No students found matching your search.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Selected Peer's Public Files view */
            <div className="cohort-card nm-out" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{selectedPeer.name}'s Public Resources</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedPeer.email} • {selectedPeer.year}</span>
                </div>
                <button className="cohort-btn" onClick={() => setSelectedPeer(null)}>
                  Back to Directory
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {peerFiles.length > 0 ? (
                  peerFiles.map(file => (
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
                      <button 
                        className="cohort-btn" 
                        onClick={() => handleDownload(file)}
                        title="Download peer resource"
                      >
                        <Download size={14} weight="bold" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                    This user hasn't shared any public study materials.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
export default Repository;
