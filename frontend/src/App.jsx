import { useState, useEffect } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Schedule } from './components/Schedule';
import { Repository } from './components/Repository';
import { Profile } from './components/Profile';
import { Setting } from './components/Setting';
import { Peers } from './components/Peers';
import { Courses } from './components/Courses';
import { NotificationBell } from './components/NotificationBell';
import { auth, DatabaseService, onAuthStateChanged, signOut } from './utils/db';
import { List, User } from '@phosphor-icons/react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState(null);
  
  // Database States
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [files, setFiles] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    indexNumber: '',
    reference: '',
    year: '',
    gender: '',
    notificationsEnabled: true,
    isPublic: true,
    dailyDigestEnabled: true,
    isDarkMode: false,
    publicResourceDirectoryEnabled: true,
    publicProfileEnabled: true,
    pushNotificationsMaster: true
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('estudy_theme') || 'light');

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('estudy_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (currentUser) {
      handleUpdateProfile({ ...profile, isDarkMode: nextTheme === 'dark' });
    }
  };

  // Auth Listener
  useEffect(() => {
    const storedUser = localStorage.getItem('estudy_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const u = { uid: user.uid, email: user.email };
        setCurrentUser(u);
        localStorage.setItem('estudy_user', JSON.stringify(u));
      } else {
        const local = localStorage.getItem('estudy_user');
        if (!local) {
          setCurrentUser(null);
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshAllData = async (emailKey) => {
    try {
      const userProfile = await DatabaseService.getProfile(emailKey);
      setProfile(userProfile);
      if (userProfile.isDarkMode !== undefined) {
        setTheme(userProfile.isDarkMode ? 'dark' : 'light');
      }

      const coursesList = await DatabaseService.getCourses(emailKey);
      setCourses(coursesList);

      const scheduleList = await DatabaseService.getSchedule(emailKey);
      setSchedule(scheduleList);

      const filesList = await DatabaseService.getFiles(emailKey);
      setFiles(filesList);

      const sessionsList = await DatabaseService.getStudySessions(emailKey);
      setStudySessions(sessionsList);

      const quizzesList = await DatabaseService.getQuizzes(emailKey);
      setQuizzes(quizzesList);

      const friendshipsList = await DatabaseService.getFriendships(emailKey);
      setFriendships(friendshipsList);

      const attemptsList = await DatabaseService.getQuizAttempts(emailKey);
      setQuizAttempts(attemptsList);

      const notifsList = await DatabaseService.getNotifications(emailKey);
      setNotifications(notifsList);
    } catch (err) {
      console.error("Error refreshing workspace data:", err);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setCourses([]);
      setSchedule([]);
      setFiles([]);
      setStudySessions([]);
      setQuizzes([]);
      setFriendships([]);
      setQuizAttempts([]);
      setNotifications([]);
      setProfile({
        name: '',
        email: '',
        indexNumber: '',
        reference: '',
        year: '',
        gender: '',
        notificationsEnabled: true,
        isPublic: true,
        dailyDigestEnabled: true
      });
      return;
    }
    const emailKey = currentUser.email.toLowerCase().trim();
    refreshAllData(emailKey);
  }, [currentUser]);

  const handleSignOut = async () => {
    localStorage.removeItem('estudy_user');
    localStorage.removeItem('estudy_token');
    setCurrentUser(null);
    setAuthChecking(false);
    setCourses([]);
    setSchedule([]);
    setFiles([]);
    setStudySessions([]);
    setQuizzes([]);
    setFriendships([]);
    setQuizAttempts([]);
    setNotifications([]);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out cleanup:", e.message);
    }
  };

  const handleUpdateProfile = async (updatedData) => {
    if (!currentUser) return;
    const emailKey = currentUser.email.toLowerCase().trim();
    const result = await DatabaseService.updateProfile(emailKey, updatedData);
    setProfile(result);
    if (updatedData.isDarkMode !== undefined) {
      setTheme(updatedData.isDarkMode ? 'dark' : 'light');
    }
  };

  const handleAddCourse = async (courseData) => {
    if (!currentUser) return;
    await DatabaseService.addCourse({ ...courseData, userId: currentUser.email.toLowerCase() });
    refreshAllData(currentUser.email.toLowerCase());
  };

  const handleRemoveCourse = async (courseId) => {
    if (!currentUser) return;
    await DatabaseService.removeCourse(courseId, currentUser.email.toLowerCase());
    refreshAllData(currentUser.email.toLowerCase());
  };

  const handleUpdateCourse = async (courseData) => {
    if (!currentUser) return;
    await DatabaseService.updateCourse(courseData, currentUser.email.toLowerCase());
    refreshAllData(currentUser.email.toLowerCase());
  };

  const handleAddScheduleItem = async (item) => {
    if (!currentUser) return;
    await DatabaseService.addScheduleItem({ ...item, userId: currentUser.email.toLowerCase() });
    refreshAllData(currentUser.email.toLowerCase());
  };

  const handleRemoveScheduleItem = async (id) => {
    if (!currentUser) return;
    await DatabaseService.removeScheduleItem(id, currentUser.email.toLowerCase());
    refreshAllData(currentUser.email.toLowerCase());
  };

  const handleUpdateScheduleItem = async (item) => {
    if (!currentUser) return;
    await DatabaseService.updateScheduleItem(item, currentUser.email.toLowerCase());
    refreshAllData(currentUser.email.toLowerCase());
  };

  const handleAddFile = async (fileObj) => {
    if (!currentUser) return;
    await DatabaseService.uploadFileMetadata({ ...fileObj, userId: currentUser.email.toLowerCase() });
    refreshAllData(currentUser.email.toLowerCase());
  };

  const handleDeleteFile = async (id) => {
    if (!currentUser) return;
    await DatabaseService.deleteFile(id);
    refreshAllData(currentUser.email.toLowerCase());
  };

  const handleToggleFileVisibility = async (id, isPublic) => {
    if (!currentUser) return;
    await DatabaseService.toggleFileVisibility(id, isPublic);
    refreshAllData(currentUser.email.toLowerCase());
  };

  const handleSaveStudySession = async (sessionData) => {
    if (!currentUser) return;
    await DatabaseService.addStudySession({ ...sessionData, userId: currentUser.email.toLowerCase() });
    refreshAllData(currentUser.email.toLowerCase());
  };

  const handleMarkNotificationAsRead = async (id) => {
    await DatabaseService.markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    await DatabaseService.markAllNotificationsAsRead(currentUser.email.toLowerCase());
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  if (authChecking) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-secondary)' }}>Loading Estudy Workspace...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={(u) => { setCurrentUser(u); setAuthChecking(false); }} />;
  }

  const renderPanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            schedule={schedule}
            files={files}
            courses={courses}
            studySessions={studySessions}
            onSaveStudySession={handleSaveStudySession}
            onNavigate={(tab, courseIdVal) => {
              if (courseIdVal) setTargetCourseId(courseIdVal);
              setActiveTab(tab);
            }}
            profile={profile}
          />
        );
      case 'courses':
        return (
          <Courses 
            courses={courses}
            files={files}
            quizzes={quizzes}
            quizAttempts={quizAttempts}
            userEmail={currentUser.email.toLowerCase()}
            onAddCourse={handleAddCourse}
            onRemoveCourse={handleRemoveCourse}
            onUpdateCourse={handleUpdateCourse}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
            onToggleFileVisibility={handleToggleFileVisibility}
            onRefresh={() => refreshAllData(currentUser.email.toLowerCase())}
            targetCourseId={targetCourseId}
            onClearTargetCourseId={() => setTargetCourseId(null)}
          />
        );
      case 'peers':
        return (
          <Peers 
            friendships={friendships}
            setFriendships={setFriendships}
            userEmail={currentUser.email.toLowerCase()}
            onRefresh={() => refreshAllData(currentUser.email.toLowerCase())}
            onNavigate={setActiveTab}
          />
        );
      case 'global_search':
        return (
          <Repository 
            courses={courses} 
            files={files} 
            userEmail={currentUser.email.toLowerCase()}
            onAddFile={handleAddFile} 
            onDeleteFile={handleDeleteFile}
            onToggleFileVisibility={handleToggleFileVisibility}
            onRefresh={() => refreshAllData(currentUser.email.toLowerCase())}
            initialSubTab="global_search"
          />
        );
      case 'schedule':
        return (
          <Schedule 
            courses={courses} 
            schedule={schedule} 
            onAddScheduleItem={handleAddScheduleItem} 
            onRemoveScheduleItem={handleRemoveScheduleItem} 
            onUpdateScheduleItem={handleUpdateScheduleItem}
          />
        );
      case 'profile':
        return (
          <Profile 
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onBack={() => setActiveTab('dashboard')}
          />
        );
      case 'setting':
      case 'settings':
        return (
          <Setting 
            theme={theme}
            onToggleTheme={toggleTheme}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="estudy-layout">
      {/* Mobile Top Header */}
      <header className="mobile-top-bar">
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <List size={22} weight="bold" />
        </button>
        <span className="mobile-brand-title">Estudy</span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationBell 
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationAsRead}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            onNavigate={setActiveTab}
          />
          <button 
            className="mobile-profile-shortcut"
            onClick={() => setActiveTab('profile')}
            aria-label="View Profile"
          >
            <User size={20} weight="bold" />
          </button>
        </div>
      </header>

      {/* Backdrop overlay for mobile sidebar drawer */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        currentTab={activeTab} 
        setCurrentTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }} 
        user={currentUser} 
        onSignOut={handleSignOut}
        className={isMobileMenuOpen ? 'mobile-open' : ''}
      />
      
      <main className="estudy-workspace">
        {/* Workspace Top Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
          <NotificationBell 
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationAsRead}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            onNavigate={setActiveTab}
          />
        </div>

        {renderPanel()}
      </main>
    </div>
  );
}

export default App;
