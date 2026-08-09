import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gear, Bell, Shield, Clock, CheckCircle, Moon, Globe, UserCheck, Broadcast, GraduationCap, Users, Warning } from '@phosphor-icons/react';

export function Setting({ theme, onToggleTheme, profile, onUpdateProfile }) {
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPushPermissionModal, setShowPushPermissionModal] = useState(false);

  const [settings, setSettings] = useState({
    isDarkMode: theme === 'dark',
    publicResourceDirectoryEnabled: profile?.publicResourceDirectoryEnabled ?? true,
    publicProfileEnabled: profile?.publicProfileEnabled ?? profile?.isPublic ?? true,
    pushNotificationsMaster: profile?.pushNotificationsMaster ?? false,
    dailyDigestEnabled: profile?.dailyDigestEnabled ?? false,
    classRemindersEnabled: profile?.classRemindersEnabled ?? false,
    studySessionRemindersEnabled: profile?.studySessionRemindersEnabled ?? false,
    eventRemindersEnabled: profile?.eventRemindersEnabled ?? false,
    friendRequestReceivedEnabled: profile?.friendRequestReceivedEnabled ?? false,
    friendRequestAcceptedEnabled: profile?.friendRequestAcceptedEnabled ?? false,
    friendResourceUploadEnabled: profile?.friendResourceUploadEnabled ?? false,
    friendCourseResourceUploadEnabled: profile?.friendCourseResourceUploadEnabled ?? false
  });

  useEffect(() => {
    if (profile) {
      setSettings(prev => ({
        ...prev,
        isDarkMode: theme === 'dark',
        publicResourceDirectoryEnabled: profile.publicResourceDirectoryEnabled ?? true,
        publicProfileEnabled: profile.publicProfileEnabled ?? profile.isPublic ?? true,
        pushNotificationsMaster: profile.pushNotificationsMaster ?? false,
        dailyDigestEnabled: profile.dailyDigestEnabled ?? false,
        classRemindersEnabled: profile.classRemindersEnabled ?? false,
        studySessionRemindersEnabled: profile.studySessionRemindersEnabled ?? false,
        eventRemindersEnabled: profile.eventRemindersEnabled ?? false,
        friendRequestReceivedEnabled: profile.friendRequestReceivedEnabled ?? false,
        friendRequestAcceptedEnabled: profile.friendRequestAcceptedEnabled ?? false,
        friendResourceUploadEnabled: profile.friendResourceUploadEnabled ?? false,
        friendCourseResourceUploadEnabled: profile.friendCourseResourceUploadEnabled ?? false
      }));
    }
  }, [profile, theme]);

  const handleToggle = async (key, val) => {
    if (key === 'pushNotificationsMaster' && val === true) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        setShowPushPermissionModal(true);
        return;
      }
    }

    await saveSettingChange(key, val);
  };

  const saveSettingChange = async (key, val) => {
    let updated = { ...settings, [key]: val };

    // If master push notification toggle is changed, sync ALL individual notification sub-toggles
    if (key === 'pushNotificationsMaster') {
      updated = {
        ...updated,
        pushNotificationsMaster: val,
        notificationsEnabled: val,
        dailyDigestEnabled: val,
        classRemindersEnabled: val,
        studySessionRemindersEnabled: val,
        eventRemindersEnabled: val,
        friendRequestReceivedEnabled: val,
        friendRequestAcceptedEnabled: val,
        friendResourceUploadEnabled: val,
        friendCourseResourceUploadEnabled: val
      };
    }

    setSettings(updated);

    if (key === 'isDarkMode') {
      if ((val && theme !== 'dark') || (!val && theme === 'dark')) {
        onToggleTheme();
      }
    }

    try {
      await onUpdateProfile({
        ...profile,
        ...updated,
        isPublic: key === 'publicProfileEnabled' ? val : (profile?.isPublic ?? true)
      });
      setSuccess(key === 'pushNotificationsMaster' 
        ? (val ? 'Push Notifications & All Alerts Enabled!' : 'All Push Notifications Disabled.') 
        : 'Preferences saved!');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const requestBrowserPermission = async () => {
    setShowPushPermissionModal(false);
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          await saveSettingChange('pushNotificationsMaster', true);
        } else {
          setError('Browser notification permission was denied.');
          setTimeout(() => setError(''), 3500);
          await saveSettingChange('pushNotificationsMaster', false);
        }
      } catch (e) {
        await saveSettingChange('pushNotificationsMaster', true);
      }
    } else {
      await saveSettingChange('pushNotificationsMaster', true);
    }
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
        Manage your user preferences, privacy overrides, and notification delivery channels.
      </p>

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

      {/* Setting Split Layout */}
      <div className="setting-split-layout" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px', alignItems: 'start' }}>
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
                Customize dark mode, resource directory visibility, public profile discovery, and master push notification alerts.
              </p>

              {/* 1. Dark Mode */}
              <div className="profile-table-row" style={{ padding: '16px 0' }}>
                <div>
                  <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Dark Mode Theme</span>
                  <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                    Enable clean dark mode interface.
                  </p>
                </div>
                <label className="cohort-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.isDarkMode} 
                    onChange={e => handleToggle('isDarkMode', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* 2. Public Resource Directory Override */}
              <div className="profile-table-row" style={{ padding: '16px 0' }}>
                <div>
                  <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Public Resource Directory</span>
                  <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                    When OFF, none of your uploaded resources will appear in public global search.
                  </p>
                </div>
                <label className="cohort-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.publicResourceDirectoryEnabled} 
                    onChange={e => handleToggle('publicResourceDirectoryEnabled', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* 3. Public Profile */}
              <div className="profile-table-row" style={{ padding: '16px 0' }}>
                <div>
                  <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Public Profile Discovery</span>
                  <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                    When OFF, your profile will be hidden from student peer search & recommendations.
                  </p>
                </div>
                <label className="cohort-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.publicProfileEnabled} 
                    onChange={e => handleToggle('publicProfileEnabled', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* 4. Browser Push Notifications Master Toggle */}
              <div className="profile-table-row" style={{ borderBottom: 'none', padding: '16px 0' }}>
                <div>
                  <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Push Notifications (Master)</span>
                  <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                    Master toggle for browser push alerts. (In-app notification center continues working).
                  </p>
                </div>
                <label className="cohort-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.pushNotificationsMaster} 
                    onChange={e => handleToggle('pushNotificationsMaster', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeSubTab === 'reminders' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>Notification & Reminder Preferences</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
                Select which specific academic, social, and study resource events you want to be notified about.
              </p>

              {/* CATEGORY 1: Academic & Schedule Alerts */}
              <div className="reminder-category-card" style={{ marginBottom: '24px', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                  <GraduationCap size={18} weight="bold" style={{ color: 'var(--accent)' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Academic & Schedule Alerts</h4>
                </div>

                {/* Daily Digest */}
                <div className="profile-table-row" style={{ padding: '12px 0' }}>
                  <div>
                    <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Daily Morning Summary</span>
                    <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                      Receive a morning breakdown of today's classes and events.
                    </p>
                  </div>
                  <label className="cohort-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.dailyDigestEnabled} 
                      onChange={e => handleToggle('dailyDigestEnabled', e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                {/* Upcoming Class Reminders */}
                <div className="profile-table-row" style={{ padding: '12px 0' }}>
                  <div>
                    <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Upcoming Class Reminders</span>
                    <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                      Reminders before your scheduled lectures begin.
                    </p>
                  </div>
                  <label className="cohort-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.classRemindersEnabled} 
                      onChange={e => handleToggle('classRemindersEnabled', e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                {/* Study Session Reminders */}
                <div className="profile-table-row" style={{ padding: '12px 0' }}>
                  <div>
                    <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Study Session Reminders</span>
                    <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                      Alerts for planned self-study sessions.
                    </p>
                  </div>
                  <label className="cohort-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.studySessionRemindersEnabled} 
                      onChange={e => handleToggle('studySessionRemindersEnabled', e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                {/* Event / Assignment Reminders */}
                <div className="profile-table-row" style={{ borderBottom: 'none', padding: '12px 0' }}>
                  <div>
                    <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Assignment & Event Reminders</span>
                    <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                      Reminders for personal events and assignment deadlines.
                    </p>
                  </div>
                  <label className="cohort-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.eventRemindersEnabled} 
                      onChange={e => handleToggle('eventRemindersEnabled', e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              </div>

              {/* CATEGORY 2: Social & Peer Activity Alerts */}
              <div className="reminder-category-card" style={{ marginBottom: '24px', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                  <Users size={18} weight="bold" style={{ color: 'var(--accent)' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Social & Peer Activity</h4>
                </div>

                {/* Friend Request Received */}
                <div className="profile-table-row" style={{ padding: '12px 0' }}>
                  <div>
                    <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Friend Request Received</span>
                    <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                      Notify when a student sends you a friend request.
                    </p>
                  </div>
                  <label className="cohort-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.friendRequestReceivedEnabled} 
                      onChange={e => handleToggle('friendRequestReceivedEnabled', e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                {/* Friend Request Accepted */}
                <div className="profile-table-row" style={{ borderBottom: 'none', padding: '12px 0' }}>
                  <div>
                    <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Friend Request Accepted</span>
                    <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                      Notify when a student accepts your friend request.
                    </p>
                  </div>
                  <label className="cohort-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.friendRequestAcceptedEnabled} 
                      onChange={e => handleToggle('friendRequestAcceptedEnabled', e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              </div>

              {/* CATEGORY 3: Resource Sharing & Course Updates */}
              <div className="reminder-category-card" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                  <Globe size={18} weight="bold" style={{ color: 'var(--accent)' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Resource Sharing & Course Updates</h4>
                </div>

                {/* Friend Resource Uploads */}
                <div className="profile-table-row" style={{ padding: '12px 0' }}>
                  <div>
                    <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Friend Resource Uploads</span>
                    <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                      Notify when a friend uploads a study resource.
                    </p>
                  </div>
                  <label className="cohort-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.friendResourceUploadEnabled} 
                      onChange={e => handleToggle('friendResourceUploadEnabled', e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                {/* Friend Course Resource Uploads */}
                <div className="profile-table-row" style={{ borderBottom: 'none', padding: '12px 0' }}>
                  <div>
                    <span className="profile-row-label" style={{ fontSize: '13.5px', fontWeight: '700' }}>Enrolled Course Resource Uploads</span>
                    <p className="profile-row-subtext" style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                      High-priority alert when a friend uploads notes for one of your enrolled courses.
                    </p>
                  </div>
                  <label className="cohort-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.friendCourseResourceUploadEnabled} 
                      onChange={e => handleToggle('friendCourseResourceUploadEnabled', e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Push Notification Explanation Modal */}
      {showPushPermissionModal && (
        <div className="estudy-modal-overlay" onClick={() => setShowPushPermissionModal(false)}>
          <div className="estudy-modal-container" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Broadcast size={24} weight="bold" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-primary)' }}>
              Enable Browser Push Notifications
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '24px' }}>
              Enable notifications to receive real-time class reminders, study session updates, and friend activity alerts directly on your device.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="cohort-btn cohort-btn-primary" 
                onClick={requestBrowserPermission}
                style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
              >
                Allow Notifications
              </button>
              <button 
                className="cohort-btn" 
                onClick={() => setShowPushPermissionModal(false)}
                style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Setting;
