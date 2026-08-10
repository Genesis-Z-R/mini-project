import { useState } from 'react';
import { SquaresFour, Calendar, User, Gear, UsersThree, GraduationCap, Globe, SignOut, Warning } from '@phosphor-icons/react';

export function Sidebar({ currentTab, setCurrentTab, user, onSignOut, className }) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: SquaresFour },
    { id: 'courses', label: 'My Courses', icon: GraduationCap },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'peers', label: 'Find Peers', icon: UsersThree },
    { id: 'global_search', label: 'Resources', icon: Globe },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'setting', label: 'Settings', icon: Gear }
  ];

  return (
    <aside className={`estudy-sidebar ${className || ''}`}>
      {/* Brand Header */}
      <div className="estudy-logo-area">
        <div className="estudy-logo-icon" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
          <img src="/logo96.png" alt="Estudy Logo" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
        </div>
        <div className="estudy-logo-text">
          <span className="brand-title">Estudy</span>
          <span className="brand-tagline">Easy Learning</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="estudy-nav-list">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`estudy-nav-item ${currentTab === item.id ? 'active' : ''}`}
              title={item.label}
              style={{ border: 'none', background: 'transparent', textAlign: 'left', width: '100%' }}
            >
              <Icon size={18} weight={currentTab === item.id ? 'fill' : 'regular'} />
              <span className="nav-text" style={{ marginLeft: '12px' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="estudy-sidebar-footer" style={{ position: 'relative' }}>
        <div className="sidebar-footer-email">
          {user?.email}
        </div>
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="cohort-btn cohort-btn-signout"
          style={{ width: '100%', gap: '8px', fontSize: '12px', justifyContent: 'center', background: 'var(--brand-blue)' }}
        >
          <SignOut size={14} weight="bold" style={{ color: '#FFFFFF' }} />
          <span className="nav-text" style={{ color: '#FFFFFF' }}>Sign Out</span>
        </button>

        {/* Standard Non-Transparent Sign Out Modal */}
        {showSignOutConfirm && (
          <div className="estudy-modal-overlay" onClick={() => setShowSignOutConfirm(false)}>
            <div className="estudy-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
              <div className="estudy-modal-header">
                <h3 className="estudy-modal-title">
                  <Warning size={22} style={{ color: '#EF4444' }} weight="bold" />
                  <span>Confirm Sign Out</span>
                </h3>
              </div>
              <div className="estudy-modal-body">
                Are you sure you want to sign out of your Estudy workspace session?
              </div>
              <div className="estudy-modal-footer">
                <button
                  type="button"
                  className="estudy-modal-btn-cancel"
                  onClick={() => setShowSignOutConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="estudy-modal-btn-danger"
                  onClick={() => {
                    setShowSignOutConfirm(false);
                    onSignOut();
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
