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
import { User, SquaresFour, GraduationCap, Calendar, UsersThree, Globe, Gear } from '@phosphor-icons/react';

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
    notificationsEnabled: false,
    isPublic: true,
    dailyDigestEnabled: false,
    isDarkMode: false,
    publicResourceDirectoryEnabled: true,
    publicProfileEnabled: true,
    pushNotificationsMaster: false,
    classRemindersEnabled: false,
    studySessionRemindersEnabled: false,
    eventRemindersEnabled: false,
    friendRequestReceivedEnabled: false,
    friendRequestAcceptedEnabled: false,
    friendResourceUploadEnabled: false,
    friendCourseResourceUploadEnabled: false
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const u = { uid: user.uid, email: user.email };
        setCurrentUser(u);
        refreshAllData(user.email.toLowerCase());
      } else {
        setCurrentUser(null);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshAllData = async (emailKey) => {
    try {
      const userProfile = await DatabaseService.getProfile(emailKey);
      setProfile(userProfile);
      if (userProfile && userProfile.isDarkMode !== undefined) {
        setTheme(userProfile.isDarkMode ? 'dark' : 'light');
      }

      const [userCourses, userSchedule, userFiles, userSessions, userQuizzes, userFriendships, userAttempts, userNotifs] = await Promise.all([
        DatabaseService.getCourses(emailKey),
        DatabaseService.getSchedule(emailKey),
        DatabaseService.getFiles(emailKey),
        DatabaseService.getStudySessions(emailKey),
        DatabaseService.getQuizzes(emailKey),
        DatabaseService.getFriendships(emailKey),
        DatabaseService.getQuizAttempts(emailKey),
        DatabaseService.getNotifications(emailKey)
      ]);

      setCourses(userCourses || []);
      setSchedule(userSchedule || []);
      setFiles(userFiles || []);
      setStudySessions(userSessions || []);
      setQuizzes(userQuizzes || []);
      setFriendships(userFriendships || []);
      setQuizAttempts(userAttempts || []);
      setNotifications(userNotifs || []);

    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  };

  const handleUpdateProfile = async (updatedData) => {
    try {
      const email = updatedData?.email || currentUser?.email?.toLowerCase();
      const updated = await DatabaseService.updateProfile(email, updatedData);
      setProfile(updated);
      return updated;
    } catch (err) {
      console.error("Failed to save profile:", err);
      throw err;
    }
  };

  const handleAddCourse = async (courseData) => {
    try {
      const newCourse = await DatabaseService.createCourse({
        ...courseData,
        userId: currentUser?.email?.toLowerCase()
      });
      setCourses(prev => [...prev, newCourse]);
      return newCourse;
    } catch (err) {
      console.error("Failed to add course:", err);
      throw err;
    }
  };

  const handleUpdateCourse = async (courseId, updatedData) => {
    try {
      const updated = await DatabaseService.updateCourse(courseId, updatedData, currentUser?.email?.toLowerCase());
      setCourses(prev => prev.map(c => c.id === courseId ? updated : c));
      return updated;
    } catch (err) {
      console.error("Failed to update course:", err);
      throw err;
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await DatabaseService.deleteCourse(courseId, currentUser?.email?.toLowerCase());
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (err) {
      console.error("Failed to delete course:", err);
    }
  };

  const handleAddFile = async (fileData) => {
    try {
      const newFile = await DatabaseService.createFile({
        ...fileData,
        userId: currentUser?.email?.toLowerCase()
      });
      setFiles(prev => [newFile, ...prev]);
      return newFile;
    } catch (err) {
      console.error("Failed to add file:", err);
      throw err;
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await DatabaseService.deleteFile(fileId, currentUser?.email?.toLowerCase());
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const handleToggleFileVisibility = async (fileId, currentVisibility) => {
    try {
      const updated = await DatabaseService.toggleFileVisibility(fileId, !currentVisibility, currentUser?.email?.toLowerCase());
      setFiles(prev => prev.map(f => f.id === fileId ? updated : f));
    } catch (err) {
      console.error("Failed to toggle file visibility:", err);
    }
  };

  const handleAddScheduleItem = async (itemData) => {
    try {
      const newItem = await DatabaseService.createScheduleItem({
        ...itemData,
        userId: currentUser?.email?.toLowerCase()
      });
      setSchedule(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error("Failed to add schedule item:", err);
      throw err;
    }
  };

  const handleRemoveScheduleItem = async (itemId) => {
    try {
      await DatabaseService.deleteScheduleItem(itemId, currentUser?.email?.toLowerCase());
      setSchedule(prev => prev.filter(s => s.id !== itemId));
    } catch (err) {
      console.error("Failed to remove schedule item:", err);
    }
  };

  const handleUpdateScheduleItem = async (itemId, updatedData) => {
    try {
      const updated = await DatabaseService.updateScheduleItem(itemId, updatedData);
      setSchedule(prev => prev.map(s => s.id === itemId ? updated : s));
      return updated;
    } catch (err) {
      console.error("Failed to update schedule item:", err);
      throw err;
    }
  };

  const handleSaveStudySession = async (sessionData) => {
    try {
      const newSession = await DatabaseService.saveStudySession(sessionData);
      setStudySessions(prev => [newSession, ...prev]);
      return newSession;
    } catch (err) {
      console.error("Failed to save study session:", err);
      throw err;
    }
  };

  const handleCreateQuiz = async (quizData) => {
    try {
      const newQuiz = await DatabaseService.createQuiz(quizData);
      setQuizzes(prev => [newQuiz, ...prev]);
      return newQuiz;
    } catch (err) {
      console.error("Failed to create quiz:", err);
      throw err;
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      await DatabaseService.deleteQuiz(quizId);
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    } catch (err) {
      console.error("Failed to delete quiz:", err);
    }
  };

  const handleSaveQuizAttempt = async (attemptData) => {
    try {
      const newAttempt = await DatabaseService.saveQuizAttempt(attemptData);
      setQuizAttempts(prev => [newAttempt, ...prev]);
      return newAttempt;
    } catch (err) {
      console.error("Failed to save quiz attempt:", err);
      throw err;
    }
  };

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await DatabaseService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    try {
      await DatabaseService.markAllNotificationsAsRead(currentUser.email.toLowerCase());
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setActiveTab('dashboard');
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  if (authChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-surface)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="donut-chart-container" style={{ width: '48px', height: '48px', margin: '0 auto 16px auto', animation: 'spin 1s linear infinite' }}>
            <svg width="48" height="48" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg-navigation)" strokeWidth="4"></circle>
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--accent)" strokeWidth="4" strokeDasharray="50 50" strokeDashoffset="25"></circle>
            </svg>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Loading Academic Workspace...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
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
            onNavigate={(tab, courseId) => {
              if (courseId) setTargetCourseId(courseId);
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
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
            onToggleFileVisibility={handleToggleFileVisibility}
            onCreateQuiz={handleCreateQuiz}
            onDeleteQuiz={handleDeleteQuiz}
            onSaveAttempt={handleSaveQuizAttempt}
            onRefresh={() => refreshAllData(currentUser.email.toLowerCase())}
            initialCourseId={targetCourseId}
            onClearTargetCourse={() => setTargetCourseId(null)}
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
      case 'global_search':
      case 'repository':
        return (
          <Repository 
            courses={courses}
            files={files}
            userEmail={currentUser.email.toLowerCase()}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
            onToggleFileVisibility={handleToggleFileVisibility}
            onRefresh={() => refreshAllData(currentUser.email.toLowerCase())}
          />
        );
      case 'peers':
        return (
          <Peers 
            userEmail={currentUser.email.toLowerCase()}
            files={files}
            friendships={friendships}
            setFriendships={setFriendships}
          />
        );
      case 'profile':
        return (
          <Profile 
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onBack={() => setActiveTab('dashboard')}
            onSignOut={handleSignOut}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo96.png" alt="Estudy Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span className="mobile-brand-title">Estudy</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationBell 
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationAsRead}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            onNavigate={setActiveTab}
          />
          <button 
            className="mobile-profile-shortcut"
            onClick={() => setActiveTab('settings')}
            aria-label="Settings"
            title="Settings"
          >
            <Gear size={20} weight="bold" />
          </button>
          <button 
            className="mobile-profile-shortcut"
            onClick={() => setActiveTab('profile')}
            aria-label="View Profile"
            title="View Profile"
          >
            <User size={20} weight="bold" />
          </button>
        </div>
      </header>

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
        <div className="workspace-top-toolbar" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
          <NotificationBell 
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationAsRead}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            onNavigate={setActiveTab}
          />
        </div>

        {renderPanel()}
      </main>

      {/* Mobile Bottom PWA Dock */}
      <nav className="mobile-bottom-dock">
        <button 
          className={`dock-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          aria-label="Dashboard"
        >
          <SquaresFour size={20} weight={activeTab === 'dashboard' ? 'fill' : 'regular'} />
          <span>Home</span>
        </button>

        <button 
          className={`dock-item ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
          aria-label="My Courses"
        >
          <GraduationCap size={20} weight={activeTab === 'courses' ? 'fill' : 'regular'} />
          <span>Courses</span>
        </button>

        <button 
          className={`dock-item ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
          aria-label="Schedule"
        >
          <Calendar size={20} weight={activeTab === 'schedule' ? 'fill' : 'regular'} />
          <span>Schedule</span>
        </button>

        <button 
          className={`dock-item ${activeTab === 'peers' ? 'active' : ''}`}
          onClick={() => setActiveTab('peers')}
          aria-label="Find Peers"
        >
          <UsersThree size={20} weight={activeTab === 'peers' ? 'fill' : 'regular'} />
          <span>Peers</span>
        </button>

        <button 
          className={`dock-item ${activeTab === 'global_search' ? 'active' : ''}`}
          onClick={() => setActiveTab('global_search')}
          aria-label="Search Resources"
        >
          <Globe size={20} weight={activeTab === 'global_search' ? 'fill' : 'regular'} />
          <span>Search</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
