import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  UserPlus, UserMinus, Users, UserCheck, MagnifyingGlass, User, ShieldStar, Download, Plus, ArrowLeft, Warning, CheckCircle, GraduationCap, Sparkle, BookOpen
} from '@phosphor-icons/react';
import { DatabaseService } from '../utils/db';

export function Peers({ friendships = [], setFriendships, userEmail, onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('find'); // 'find' (Recommended Peers) | 'following' | 'requests'
  const [searchQuery, setSearchQuery] = useState('');
  const [allProfiles, setAllProfiles] = useState([]);
  const [recommendedPeers, setRecommendedPeers] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendFiles, setFriendFiles] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingPeers, setLoadingPeers] = useState(false);

  // Fetch recommended peers and profiles once or when userEmail changes
  const fetchRecommendedPeers = async () => {
    setLoadingPeers(true);
    try {
      const [recData, profilesData] = await Promise.all([
        DatabaseService.getRecommendedPeers(userEmail),
        DatabaseService.getAllProfiles()
      ]);
      setRecommendedPeers(recData || []);
      setAllProfiles(profilesData || []);
    } catch (err) {
      console.error("Error fetching recommended peers:", err);
    } finally {
      setLoadingPeers(false);
    }
  };

  useEffect(() => {
    fetchRecommendedPeers();
  }, [userEmail]);

  // Load selected friend's files
  useEffect(() => {
    const fetchFriendFiles = async () => {
      if (!selectedFriend) return;
      try {
        const data = await DatabaseService.getPeerPublicFiles(selectedFriend.email);
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

  // Follow / Send request (Targeted State Update - No Blinking)
  const handleFollowPeer = async (peerEmail) => {
    try {
      const newFriendship = await DatabaseService.sendFriendRequest(userEmail, peerEmail);
      showNotification(`Request sent to ${peerEmail}`);
      
      // 1. Target update recommendedPeers state locally
      setRecommendedPeers(prev => prev.map(p => {
        if (p.email.toLowerCase() === peerEmail.toLowerCase()) {
          return { ...p, followStatus: 'sent', friendshipId: newFriendship?.id || `fr_${Date.now()}` };
        }
        return p;
      }));

      // 2. Target update friendships state in parent
      if (setFriendships && newFriendship) {
        setFriendships(prev => [...prev.filter(f => f.id !== newFriendship.id), newFriendship]);
      }
    } catch (err) {
      showNotification("Error connecting with peer.", false);
    }
  };

  // Accept request (Targeted State Update - No Blinking)
  const handleAcceptRequest = async (friendshipId, senderEmail) => {
    try {
      const updated = await DatabaseService.acceptFriendRequest(friendshipId, userEmail);
      showNotification("Peer request accepted!");

      // 1. Target update recommendedPeers state locally
      setRecommendedPeers(prev => prev.map(p => {
        if (p.friendshipId === friendshipId || (senderEmail && p.email.toLowerCase() === senderEmail.toLowerCase())) {
          return { ...p, followStatus: 'following', friendshipId };
        }
        return p;
      }));

      // 2. Target update friendships state in parent
      if (setFriendships) {
        setFriendships(prev => prev.map(f => f.id === friendshipId ? { ...f, status: 'accepted' } : f));
      }
    } catch (err) {
      showNotification("Error accepting request.", false);
    }
  };

  // Unfollow / Decline / Remove friendship (Targeted State Update - No Blinking)
  const handleRemoveFollow = async (friendshipId, peerEmail) => {
    try {
      await DatabaseService.removeFriendship(friendshipId, userEmail);
      showNotification("Peer connection removed.");

      // 1. Target update recommendedPeers state locally
      setRecommendedPeers(prev => prev.map(p => {
        if (p.friendshipId === friendshipId || (peerEmail && p.email.toLowerCase() === peerEmail.toLowerCase())) {
          return { ...p, followStatus: 'none', friendshipId: null };
        }
        return p;
      }));

      // 2. Target update friendships state in parent
      if (setFriendships) {
        setFriendships(prev => prev.filter(f => f.id !== friendshipId));
      }

      if (selectedFriend && (selectedFriend.friendshipId === friendshipId || selectedFriend.email === peerEmail)) {
        setSelectedFriend(null);
      }
    } catch (err) {
      showNotification("Error removing peer connection.", false);
    }
  };

  // Copy friend resource to mine
  const handleCopyResource = async (file) => {
    try {
      await DatabaseService.addPublicFileToMine(file, userEmail);
      showNotification(`"${file.title}" added to your My Resources folder!`);
    } catch (err) {
      showNotification("Error copying file.", false);
    }
  };

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

  // Accepted friends profiles
  const acceptedFriendEmails = friendships
    .filter(f => f.status === 'accepted')
    .map(f => f.senderId === userEmail ? f.receiverId : f.senderId);

  const followingProfiles = recommendedPeers.filter(p => p.followStatus === 'following' || acceptedFriendEmails.includes(p.email));

  // Get incoming requests
  const incomingRequests = friendships.filter(f => f.receiverId === userEmail && f.status === 'pending');
  const incomingRequestProfiles = incomingRequests.map(req => {
    const profile = allProfiles.find(p => p.email === req.senderId);
    return {
      id: req.id,
      profile: profile || { email: req.senderId, name: req.senderId.split('@')[0] }
    };
  });

  // Filter recommended peers by search query
  const filteredRecommendedPeers = recommendedPeers.filter(peer => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return peer.name?.toLowerCase().includes(query) ||
           peer.email.toLowerCase().includes(query) ||
           peer.programmeName?.toLowerCase().includes(query) ||
           (peer.sharedCourses || []).some(c => c.toLowerCase().includes(query));
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Find Peers</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Discover and connect with students in your programme and shared courses.
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

      {/* Navigation Sub-Tabs */}
      <div className="timetable-toggle-container" style={{ marginBottom: '24px' }}>
        <div className="timetable-toggle-bar">
          <button 
            className={`timetable-toggle-btn ${activeSubTab === 'find' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('find'); setSelectedFriend(null); }}
          >
            Find Peers
          </button>
          <button 
            className={`timetable-toggle-btn ${activeSubTab === 'following' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('following'); setSelectedFriend(null); }}
          >
            Following ({followingProfiles.length})
          </button>
          <button 
            className={`timetable-toggle-btn ${activeSubTab === 'requests' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('requests'); setSelectedFriend(null); }}
            style={{ position: 'relative' }}
          >
            Peer Requests {incomingRequestProfiles.length > 0 && (
              <span style={{ background: 'var(--accent)', color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '9px', fontWeight: 'bold', marginLeft: '6px' }}>
                {incomingRequestProfiles.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {selectedFriend ? (
        /* PEER DETAILS & SHARED FILES VIEW */
        <div className="cohort-card nm-out" style={{ padding: '28px' }}>
          <button 
            className="back-arrow-btn" 
            onClick={() => setSelectedFriend(null)} 
            style={{ marginBottom: '20px' }}
          >
            <ArrowLeft size={16} weight="bold" />
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '52px', height: '52px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={26} weight="bold" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>{selectedFriend.name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedFriend.email}</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '11.5px', color: 'var(--accent)', fontWeight: '700' }}>
                  <span>🎓 {selectedFriend.programmeName || 'Student'}</span>
                  <span>•</span>
                  <span>{selectedFriend.year || 'No Year'}</span>
                </div>
              </div>
            </div>
            
            <button
              className="cohort-btn"
              onClick={() => {
                if (selectedFriend.friendshipId && confirm(`Unfollow ${selectedFriend.name}?`)) {
                  handleRemoveFollow(selectedFriend.friendshipId, selectedFriend.email);
                }
              }}
              style={{ color: '#EF4444' }}
            >
              Unfollow
            </button>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px' }}>Shared Resources</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {friendFiles.length > 0 ? (
              friendFiles.map(file => (
                <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-navigation)', borderRadius: '12px' }}>
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
                This student hasn't shared any public files yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB CONTENT PANELS */
        <div>
          {/* TAB 1: RECOMMENDED PEERS */}
          {activeSubTab === 'find' && (
            <div>
              <div className="peers-search-bar" style={{ marginBottom: '24px' }}>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="Filter recommended peers by name, programme, or course code..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {loadingPeers ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  Calculating academic peer recommendations...
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {filteredRecommendedPeers.length > 0 ? (
                    filteredRecommendedPeers.map(peer => {
                      return (
                        <div key={peer.id} className="cohort-card nm-out" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div>
                                <strong style={{ fontSize: '15px', display: 'block', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                                  {peer.name}
                                </strong>
                                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{peer.email}</span>
                              </div>
                              {peer.matchScore > 0 && (
                                <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Sparkle size={10} weight="fill" />
                                  Match Score: {peer.matchScore}
                                </span>
                              )}
                            </div>

                            {/* Academic Tags */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <GraduationCap size={15} style={{ color: 'var(--accent)' }} />
                                <span>{peer.programmeName}</span>
                              </div>

                              {peer.year && (
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  Academic Level: <strong>{peer.year}</strong>
                                </div>
                              )}

                              {peer.matchReasons && peer.matchReasons.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                  {peer.matchReasons.map((reason, idx) => (
                                    <span key={idx} style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-navigation)', color: 'var(--text-secondary)' }}>
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            {peer.followStatus === 'none' && (
                              <button 
                                className="cohort-btn cohort-btn-primary" 
                                onClick={() => handleFollowPeer(peer.email)} 
                                style={{ fontSize: '12px', padding: '8px 16px', gap: '6px' }}
                              >
                                <UserPlus size={14} weight="bold" />
                                <span>Follow / Connect</span>
                              </button>
                            )}

                            {peer.followStatus === 'following' && (
                              <button 
                                className="cohort-btn"
                                onClick={() => setSelectedFriend(peer)}
                                style={{ fontSize: '12px', padding: '6px 12px', gap: '6px', background: 'rgba(16,185,129,0.15)', color: 'var(--accent)', border: 'none' }}
                              >
                                <UserCheck size={14} weight="bold" />
                                <span>Following (View Files)</span>
                              </button>
                            )}

                            {peer.followStatus === 'sent' && (
                              <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: '600', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <UserCheck size={14} />
                                Request Sent
                              </span>
                            )}

                            {peer.followStatus === 'received' && (
                              <button 
                                className="cohort-btn cohort-btn-primary" 
                                onClick={() => {
                                  if (peer.friendshipId) handleAcceptRequest(peer.friendshipId, peer.email);
                                }}
                                style={{ fontSize: '12px', padding: '8px 16px' }}
                              >
                                Accept Follow Request
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="cohort-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
                      No peer recommendations found matching your academic programme.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FOLLOWING / CONNECTIONS */}
          {activeSubTab === 'following' && (
            <div className="peers-grid">
              {followingProfiles.length > 0 ? (
                followingProfiles.map(peer => (
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
                      🎓 {peer.programmeName || 'Student'} • {peer.year || 'No Year'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="cohort-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
                  You are not following any peers yet. Explore recommended peers to build your student network!
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INCOMING PEER REQUESTS */}
          {activeSubTab === 'requests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {incomingRequestProfiles.length > 0 ? (
                incomingRequestProfiles.map(item => (
                  <div 
                    key={item.id} 
                    className="cohort-card nm-out" 
                    style={{ 
                      padding: '22px 28px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      gap: '20px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '46px', height: '46px', flexShrink: 0, background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={22} weight="bold" />
                      </div>
                      <div>
                        <strong style={{ fontSize: '15px', display: 'block', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                          {item.profile.name}
                        </strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                          {item.profile.email}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'center' }}>
                      <button 
                        className="cohort-btn cohort-btn-primary" 
                        onClick={() => handleAcceptRequest(item.id, item.profile.email)}
                        style={{ padding: '8px 20px', fontSize: '12px', fontWeight: '700' }}
                      >
                        Accept
                      </button>
                      <button 
                        className="cohort-btn" 
                        onClick={() => handleRemoveFollow(item.id, item.profile.email)} 
                        style={{ padding: '8px 16px', fontSize: '12px', color: '#EF4444', background: 'rgba(239, 68, 68, 0.08)', border: 'none' }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px 0' }}>
                  No pending incoming follow requests.
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
