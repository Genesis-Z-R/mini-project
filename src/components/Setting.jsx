import { useState } from 'react';
import { motion } from 'motion/react';
import { Gear, Bell, Shield, Clock, CheckCircle } from '@phosphor-icons/react';

export function Setting({ theme, onToggleTheme, profile, onUpdateProfile }) {
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [success, setSuccess] = useState('');

  const handleSaveSettings = () => {
    setSuccess('Preferences updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const subTabs = [
    { id: 'general', label: 'General Settings', icon: Gear },
    { id: 'reminders', label: 'Learning Reminders', icon: Clock }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Settings</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
        Manage your user preferences, layouts, and account notifications.
      </p>

      {success && (
        <div className="success-box" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} weight="fill" />
          <span>{success}</span>
        </div>
      )}

      {/* Setting Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Left Column Tab Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {subTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`estudy-nav-item ${activeSubTab === tab.id ? 'active' : ''}`}
                style={{ 
                  border: 'none', 
                  background: 'transparent', 
                  textAlign: 'left', 
                  width: '100%',
                  padding: '12px 16px' 
                }}
              >
                <Icon size={16} weight="bold" />
                <span style={{ marginLeft: '12px' }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Column Content Panels */}
        <div className="cohort-card nm-out" style={{ padding: '32px', minHeight: '340px' }}>
          {activeSubTab === 'general' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>General Settings</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
                Customize your layout view, dark mode theme, and profile search settings.
              </p>

              {/* Dark Mode Theme */}
              <div className="profile-table-row" style={{ padding: '16px 0' }}>
                <div>
                  <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Dark Mode Theme</span>
                  <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                    Switch between dark and light themes manually.
                  </p>
                </div>
                <label className="cohort-switch">
                  <input 
                    type="checkbox" 
                    checked={theme === 'dark'} 
                    onChange={onToggleTheme}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* Public Search Toggle */}
              <div className="profile-table-row" style={{ padding: '16px 0' }}>
                <div>
                  <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Public Directory Searchable</span>
                  <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                    Allow other students to search for you in the Peers Directory.
                  </p>
                </div>
                <label className="cohort-switch">
                  <input 
                    type="checkbox" 
                    checked={profile?.isPublic ?? true} 
                    onChange={(e) => onUpdateProfile({ ...profile, isPublic: e.target.checked })}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* Push Notifications Toggle */}
              <div className="profile-table-row" style={{ borderBottom: 'none', padding: '16px 0' }}>
                <div>
                  <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Push Notifications</span>
                  <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                    Enable real-time push alerts and class starting popups.
                  </p>
                </div>
                <label className="cohort-switch">
                  <input 
                    type="checkbox" 
                    checked={profile?.notificationsEnabled} 
                    onChange={(e) => onUpdateProfile({ ...profile, notificationsEnabled: e.target.checked })}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <button 
                className="cohort-btn cohort-btn-primary" 
                onClick={handleSaveSettings}
                style={{ marginTop: '32px' }}
              >
                Save General Settings
              </button>
            </div>
          )}

          {activeSubTab === 'reminders' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>Learning Reminders</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
                Setup push notifications on your calendar entries or class start alerts.
              </p>

              <div className="profile-table-row" style={{ borderBottom: 'none', padding: '16px 0' }}>
                <div>
                  <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Daily Digest Alert</span>
                  <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                    Receive a summary of today's schedule at 08:00 AM.
                  </p>
                </div>
                <label className="cohort-switch">
                  <input 
                    type="checkbox" 
                    checked={profile?.dailyDigestEnabled ?? true} 
                    onChange={(e) => onUpdateProfile({ ...profile, dailyDigestEnabled: e.target.checked })}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <button 
                className="cohort-btn cohort-btn-primary" 
                onClick={handleSaveSettings}
                style={{ marginTop: '32px' }}
              >
                Save Reminders
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
export default Setting;
