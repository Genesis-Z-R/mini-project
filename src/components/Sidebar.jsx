import { SquaresFour, ListChecks, Folder, Calendar, User, Gear, UsersThree, SignOut } from '@phosphor-icons/react';

export function Sidebar({ currentTab, setCurrentTab, user, onSignOut }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: SquaresFour },
    { id: 'quizzes', label: 'Quizzes', icon: ListChecks },
    { id: 'resources', label: 'Resources', icon: Folder },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'peers', label: 'Peers', icon: UsersThree },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'setting', label: 'Setting', icon: Gear }
  ];

  return (
    <aside className="estudy-sidebar">
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
      <div className="estudy-sidebar-footer">
        <div className="sidebar-footer-email">
          {user?.email}
        </div>
        <button 
          onClick={onSignOut}
          className="cohort-btn"
          style={{ width: '100%', gap: '8px', fontSize: '12px', justifyContent: 'center' }}
        >
          <SignOut size={14} weight="bold" />
          <span className="nav-text">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
