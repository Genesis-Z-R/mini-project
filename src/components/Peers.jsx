import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  UserPlus, UserMinus, Users, UserCheck, MagnifyingGlass, User, ShieldStar, Download, Plus, ArrowLeft, Warning, CheckCircle 
} from '@phosphor-icons/react';
import { supabase, DatabaseService } from '../utils/db';

export function Peers({ friendships, userEmail, onRefresh, onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('friends'); // 'friends' | 'find' | 'requests'
  const [searchQuery, setSearchQuery] = useState('');
  const [allProfiles, setAllProfiles] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendFiles, setFriendFiles] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch all profiles from Supabase to match emails
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      setAllProfiles(data || []);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [friendships]);

  // Load selected friend's files
  useEffect(() => {
    const fetchFriendFiles = async () => {
      if (!selectedFriend) return;
      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('userId', selectedFriend.email)
          .eq('isPublic', true);
        if (error) throw error;
        setFriendFiles(data || []);
      } catch (err) {
        console.error("Error fetching friend files:", err);
      }
    };
    fetchFriendFiles();
  }, [selectedFriend]);

  const showNotification = (msg, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  // Add friend
  const handleSendRequest = async (peerEmail) => {
    try {
      await DatabaseService.sendFriendRequest(userEmail, peerEmail);
      showNotification(`Friend request sent to ${peerEmail}`);
      onRefresh();
    } catch (err) {
      showNotification("Error sending request.", false);
    }
  };

  // Accept request
  const handleAcceptRequest = async (friendshipId) => {
    try {
      await DatabaseService.acceptFriendRequest(friendshipId);
      showNotification("Friend request accepted!");
      onRefresh();
    } catch (err) {
      showNotification("Error accepting request.", false);
    }
  };

  // Decline/Remove friendship
  const handleRemoveFriendship = async (friendshipId) => {
    try {
      await DatabaseService.removeFriendship(friendshipId);
      showNotification("Friendship/Request removed.");
      onRefresh();
      setSelectedFriend(null);
    } catch (err) {
      showNotification("Error removing friendship.", false);
    }
  };

  // Copy friend resource to mine
  const handleCopyResource = async (file) => {
    try {
      await DatabaseService.addPublicFileToMine(file, userEmail);
      showNotification(`"${file.title}" added to your My Resources folder!`);
      onRefresh();
    } catch (err) {
      showNotification("Error copying file.", false);
    }
  };

  // Helper file download mock
  const handleDownload = (file) => {
    const fileContent = `Estudy Shared Peer Resource\n` +
      `File Name: ${file.title}\n` +
      `File Size: ${file.size}\n` +
      `Download Link: ${file.url || 'None'}\n`;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = file.url || url;
    a.target = '_blank';
    a.download = file.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (!file.url) URL.revokeObjectURL(url);
  };

  // Helper calculations
  // Get accepted friends emails
  const acceptedFriendEmails = friendships
    .filter(f => f.status === 'accepted')
    .map(f => f.senderId === userEmail ? f.receiverId : f.senderId);

  const friendsProfiles = allProfiles.filter(p => acceptedFriendEmails.includes(p.email));

  // Get incoming requests
  const incomingRequests = friendships.filter(f => f.receiverId === userEmail && f.status === 'pending');
  // Get profiles of senders
  const incomingRequestProfiles = incomingRequests.map(req => {
    const profile = allProfiles.find(p => p.email === req.senderId);
    return {
      id: req.id,
      profile: profile || { email: req.senderId, name: req.senderId.split('@')[0] }
    };
  });

  // Filter out users who are already friends, sent requests, or yourself
  const searchResults = allProfiles.filter(p => {
    if (p.email === userEmail) return false;
    // Check match query
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getFriendshipStatus = (peerEmail) => {
    const relation = friendships.find(f => 
      (f.senderId === userEmail && f.receiverId === peerEmail) ||
      (f.senderId === peerEmail && f.receiverId === userEmail)
    );
    if (!relation) return 'none';
    if (relation.status === 'accepted') return 'accepted';
    if (relation.status === 'pending') {
      return relation.senderId === userEmail ? 'sent' : 'received';
    }
    return 'none';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Standalone Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Peers Directory</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Connect with friends, accept invites, and share study materials.
        </p>
      </div>

      {successMsg && (
        <div className="success-box" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} weight="fill" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert-box" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Warning size={16} weight="bold" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs list */}
      <div className="timetable-toggle-container" style={{ marginBottom: '24px' }}>
        <div className="timetable-toggle-bar">
          <button 
            className={`timetable-toggle-btn ${activeSubTab === 'friends' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('friends'); setSelectedFriend(null); }}
          >
            My Friends ({friendsProfiles.length})
          </button>
          <button 
            className={`timetable-toggle-btn ${activeSubTab === 'find' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('find'); setSelectedFriend(null); }}
          >
            Find Peers
          </button>
          <button 
            className={`timetable-toggle-btn ${activeSubTab === 'requests' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('requests'); setSelectedFriend(null); }}
            style={{ position: 'relative' }}
          >
            Friend Requests {incomingRequestProfiles.length > 0 && (
              <span style={{ background: 'var(--accent)', color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '9px', fontWeight: 'bold', marginLeft: '6px' }}>
                {incomingRequestProfiles.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {selectedFriend ? (
        /* ============================================================
           FRIEND DETAILS & FILE LIST
           ============================================================ */
        <div className="cohort-card nm-out" style={{ padding: '28px' }}>
          <button 
            className="back-arrow-btn" 
            onClick={() => setSelectedFriend(null)} 
            style={{ marginBottom: '20px' }}
          >
            <ArrowLeft size={16} weight="bold" />
          </button>

          <div style={{ display: 'flex', justify: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="peer-avatar" style={{ width: '48px', height: '48px' }}>
                <User size={24} weight="bold" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{selectedFriend.name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedFriend.email}</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '11.5px', color: 'var(--accent)', fontWeight: '700' }}>
                  <span>{selectedFriend.year || 'No Year'}</span>
                  <span>•</span>
                  <span>{selectedFriend.indexNumber || 'No Index'}</span>
                </div>
              </div>
            </div>
            
            {/* Remove Friend button */}
            <button
              className="cohort-btn"
              onClick={() => {
                const link = friendships.find(f => 
                  (f.senderId === userEmail && f.receiverId === selectedFriend.email) ||
                  (f.senderId === selectedFriend.email && f.receiverId === userEmail)
                );
                if (link && confirm(`Remove ${selectedFriend.name} from friends?`)) {
                  handleRemoveFriendship(link.id);
                }
              }}
              style={{ color: '#EF4444' }}
            >
              Unfriend
            </button>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px' }}>Shared Resources</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {friendFiles.length > 0 ? (
              friendFiles.map(file => (
                <div key={file.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-navigation)', borderRadius: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--text-primary)' }}>{file.title}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{file.size} • {file.fileType.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="cohort-btn cohort-btn-primary" 
                      onClick={() => handleCopyResource(file)}
                      style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }}
                    >
                      <Plus size={12} weight="bold" />
                      Add to My Resources
                    </button>
                    <button 
                      className="cohort-btn" 
                      onClick={() => handleDownload(file)}
                      style={{ padding: '6px' }}
                    >
                      <Download size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                This friend hasn't shared any public files yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ============================================================
           TAB VIEWS
           ============================================================ */
        <div>
          {activeSubTab === 'friends' && (
            <div className="peers-grid">
              {friendsProfiles.length > 0 ? (
                friendsProfiles.map(peer => (
                  <div 
                    key={peer.email} 
                    className="peer-profile-card nm-out"
                    onClick={() => setSelectedFriend(peer)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="peer-avatar">
                      <User size={24} weight="bold" />
                    </div>
                    <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-primary)' }}>{peer.name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{peer.email}</span>
                    <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700', marginTop: '8px' }}>
                      {peer.year || 'No Year'} • {peer.indexNumber || 'No Index'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="cohort-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
                  You haven't added any friends yet. Navigate to "Find Peers" to search and connect!
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'find' && (
            <div>
              <div className="peers-search-bar" style={{ marginBottom: '24px' }}>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="Search registered students by name or email..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {searchResults.length > 0 ? (
                  searchResults.map(peer => {
                    const status = getFriendshipStatus(peer.email);
                    return (
                      <div key={peer.email} className="cohort-card nm-out" style={{ padding: '20px', display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--text-primary)' }}>{peer.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{peer.email}</span>
                        </div>

                        <div>
                          {status === 'none' && (
                            <button className="cohort-btn cohort-btn-primary" onClick={() => handleSendRequest(peer.email)} style={{ fontSize: '11.5px', padding: '6px 12px' }}>
                              Add Friend
                            </button>
                          )}
                          {status === 'sent' && (
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>Requested</span>
                          )}
                          {status === 'received' && (
                            <button 
                              className="cohort-btn cohort-btn-primary" 
                              onClick={() => {
                                const req = friendships.find(f => f.senderId === peer.email && f.receiverId === userEmail);
                                if (req) handleAcceptRequest(req.id);
                              }}
                              style={{ fontSize: '11px', padding: '6px 12px' }}
                            >
                              Accept
                            </button>
                          )}
                          {status === 'accepted' && (
                            <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700' }}>
                              <UserCheck size={14} />
                              Friends
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="cohort-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    No students found.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'requests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {incomingRequestProfiles.length > 0 ? (
                incomingRequestProfiles.map(item => (
                  <div key={item.id} className="cohort-card nm-out" style={{ padding: '20px', display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="peer-avatar" style={{ width: '38px', height: '38px' }}>
                        <User size={18} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '14px', display: 'block' }}>{item.profile.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.profile.email}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="cohort-btn cohort-btn-primary" onClick={() => handleAcceptRequest(item.id)}>
                        Accept
                      </button>
                      <button className="cohort-btn" onClick={() => handleRemoveFriendship(item.id)} style={{ color: '#EF4444' }}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                  No pending incoming friend requests.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
export default Peers;
