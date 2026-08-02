import { useState } from 'react';
import { SquaresFour, Calendar, User, Gear, UsersThree, GraduationCap, Globe, SignOut } from '@phosphor-icons/react';

export function Sidebar({ currentTab, setCurrentTab, user, onSignOut, className }) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: SquaresFour },
    { id: 'courses', label: 'My Courses', icon: GraduationCap },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'peers', label: 'Peers', icon: UsersThree },
    { id: 'global_search', label: 'Global Search', icon: Globe },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'setting', label: 'Setting', icon: Gear }
  ];

  return (
    <aside className={`estudy-sidebar ${className || ''}`}>
      {/* Brand Header */}
      <div className="estudy-logo-area">
        <div className="estudy-logo-icon">E</div>
        <div className="estudy-logo-text">
          <span className="brand-title">Estudy</span>
          <span className="brand-tagline">Learn From Home</span>
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
          <SignOut size={14} weight="bold" style={{color:'#FFFFFF'}}/>
          <span className="nav-text" style={{ color: '#FFFFFF' }}>Sign Out</span>
        </button>
        {showSignOutConfirm && (
          <div
            onClick={() => setShowSignOutConfirm(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '28px 32px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                textAlign: 'center',
                minWidth: '240px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: '#0f172a' }}>Sign out?</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => { setShowSignOutConfirm(false); onSignOut(); }} className="cohort-btn confirm-btn-yes" style={{ flex: 1, justifyContent: 'center', padding: '8px', background: '#15803d', color: '#ffffff', fontWeight: '700', border: 'none', borderRadius: '8px' }}>Yes</button>
                <button type="button" onClick={() => setShowSignOutConfirm(false)} className="cohort-btn confirm-btn-no" style={{ flex: 1, justifyContent: 'center', padding: '8px', background: '#b91c1c', color: '#ffffff', fontWeight: '700', border: 'none', borderRadius: '8px' }}>No</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
export default Sidebar;
