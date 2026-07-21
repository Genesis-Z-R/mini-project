import { useState, useEffect } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Schedule } from './components/Schedule';
import { Repository } from './components/Repository';
import { Groups } from './components/Groups';
import { Profile } from './components/Profile';
import { Setting } from './components/Setting';
import { Peers } from './components/Peers';
import { Courses } from './components/Courses';
import { auth, DatabaseService, onAuthStateChanged, signOut } from './utils/db';
import { Warning, List, User } from '@phosphor-icons/react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Database States
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [files, setFiles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [profile, setProfile] = useState({
    name: 'Student',
    email: '',
    indexNumber: '',
    reference: '',
    year: '',
    gender: '',
    notificationsEnabled: true,
    isPublic: true,
    dailyDigestEnabled: true
  });

  // Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ac-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ac-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setAuthChecking(false);
      } else {
        setCurrentUser(null);
        setAuthChecking(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sync state data from Supabase
  const refreshAllData = async (emailKey) => {
    try {
      const profileData = await DatabaseService.getProfile(emailKey);
      if (profileData) {
        setProfile(profileData);
      }
      
      const coursesList = await DatabaseService.getCourses(emailKey);
      setCourses(coursesList);

      const scheduleList = await DatabaseService.getSchedule(emailKey);
      setSchedule(scheduleList);

      // Files: Load own files
      const filesList = await DatabaseService.getFiles(emailKey);
      setFiles(filesList);

      const groupsList = await DatabaseService.getGroups();
      setGroups(groupsList);

      const sessionsList = await DatabaseService.getStudySessions(emailKey);
      setStudySessions(sessionsList);

      const quizzesList = await DatabaseService.getQuizzes(emailKey);
      setQuizzes(quizzesList);

      const friendshipsList = await DatabaseService.getFriendships(emailKey);
      setFriendships(friendshipsList);

      const attemptsList = await DatabaseService.getQuizAttempts(emailKey);
      setQuizAttempts(attemptsList);
    } catch (err) {
      console.error("Error refreshing Supabase data:", err);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setCourses([]);
      setSchedule([]);
      setFiles([]);
      setGroups([]);
      setStudySessions([]);
      setQuizzes([]);
      setFriendships([]);
      setQuizAttempts([]);
      return;
    }
    const emailKey = currentUser.email.toLowerCase().trim();
    refreshAllData(emailKey);
  }, [currentUser]);

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  // Course Handlers
  const handleAddCourse = async (course) => {
    await DatabaseService.addCourse(currentUser.email.toLowerCase(), course);
    await refreshAllData(currentUser.email);
  };

  const handleDeleteCourse = async (id) => {
    await DatabaseService.deleteCourse(id);
    await refreshAllData(currentUser.email);
  };

  // Schedule Handlers
  const handleAddScheduleItem = async (item) => {
    const res = await DatabaseService.addScheduleItem(currentUser.email.toLowerCase(), item);
    if (res.success) {
      await refreshAllData(currentUser.email);
    }
    return res;
  };

  const handleRemoveScheduleItem = async (id) => {
    await DatabaseService.removeScheduleItem(id);
    await refreshAllData(currentUser.email);
  };

  const handleUpdateScheduleItem = async (id, item) => {
    const res = await DatabaseService.updateScheduleItem(id, currentUser.email.toLowerCase(), item);
    if (res.success) {
      await refreshAllData(currentUser.email);
    }
    return res;
  };

  // Study Sessions handler
  const handleSaveStudySession = async (session) => {
    await DatabaseService.saveStudySession({
      ...session,
      userId: currentUser.email.toLowerCase()
    });
    await refreshAllData(currentUser.email);
  };

  // Resources / Files Handlers
  const handleAddFile = async (fileData) => {
    await DatabaseService.uploadFileMetadata({
      ...fileData,
      userId: currentUser.email.toLowerCase()
    });
    await refreshAllData(currentUser.email);
  };

  const handleDeleteFile = async (id, url) => {
    await DatabaseService.deleteFile(id, url);
    await refreshAllData(currentUser.email);
  };

  const handleToggleFileVisibility = async (id, isPublic) => {
    await DatabaseService.toggleFileVisibility(id, isPublic);
    await refreshAllData(currentUser.email);
  };

  // Profile Handler
  const handleUpdateProfile = async (updatedProfile) => {
    await DatabaseService.updateProfile(currentUser.email, updatedProfile);
    await refreshAllData(currentUser.email);
  };

  // Quiz Handlers
  const handleCreateQuiz = async (quiz) => {
    await DatabaseService.addQuiz({
      ...quiz,
      userId: currentUser.email.toLowerCase()
    });
    await refreshAllData(currentUser.email);
  };

  const handleDeleteQuiz = async (id) => {
    await DatabaseService.deleteQuiz(id);
    await refreshAllData(currentUser.email);
  };

  const handleSaveQuizAttempt = async (attempt) => {
    await DatabaseService.saveQuizAttempt({
      ...attempt,
      userId: currentUser.email.toLowerCase()
    });
    await refreshAllData(currentUser.email);
  };

  // Study Circles (Groups) handlers
  const handleCreateStudyCircle = async (circle) => {
    await DatabaseService.createStudyCircle({
      ...circle,
      creatorId: currentUser.email.toLowerCase()
    });
    await refreshAllData(currentUser.email);
  };

  const handleToggleJoinGroup = async (id, isJoined) => {
    const email = currentUser.email.toLowerCase();
    if (isJoined) {
      await DatabaseService.leaveStudyCircle(id, email);
    } else {
      await DatabaseService.joinStudyCircle(id, email);
    }
    await refreshAllData(currentUser.email);
  };

  const handlePromoteCircleAdmin = async (groupId, email) => {
    await DatabaseService.promoteToAdmin(groupId, email);
    await refreshAllData(currentUser.email);
  };

  const handleCirclePostResource = async (groupId, resource) => {
    await DatabaseService.addCircleResource(groupId, {
      ...resource,
      uploaderEmail: currentUser.email.toLowerCase()
    });
    await refreshAllData(currentUser.email);
  };

  if (authChecking) {
    return (
      <div className="login-bg-overlay">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-primary)' }}>
          Loading Estudy Workspace...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Profile fields check to show warning alert
  const isProfileIncomplete = !profile?.indexNumber || !profile?.reference || !profile?.year || !profile?.gender;

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
            onNavigate={setActiveTab}
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
            onDeleteCourse={handleDeleteCourse}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
            onToggleFileVisibility={handleToggleFileVisibility}
            onCreateQuiz={handleCreateQuiz}
            onDeleteQuiz={handleDeleteQuiz}
            onSaveAttempt={handleSaveQuizAttempt}
            onRefresh={() => refreshAllData(currentUser.email.toLowerCase())}
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
      case 'peers':
        return (
          <Peers 
            friendships={friendships}
            userEmail={currentUser.email.toLowerCase()}
            onRefresh={() => refreshAllData(currentUser.email.toLowerCase())}
            onNavigate={setActiveTab}
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
        return (
          <Setting 
            theme={theme}
            onToggleTheme={toggleTheme}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case 'groups':
        return (
          <Groups 
            courses={courses} 
            groups={groups} 
            userEmail={currentUser.email.toLowerCase()}
            onCreateCircle={handleCreateStudyCircle}
            onToggleJoin={handleToggleJoinGroup}
            onPromoteAdmin={handlePromoteCircleAdmin}
            onPostResource={handleCirclePostResource}
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
        <button 
          className="mobile-profile-shortcut"
          onClick={() => setActiveTab('profile')}
          aria-label="View Profile"
        >
          <User size={20} weight="bold" />
        </button>
      </header>

      {/* Backdrop overlay for mobile sidebar drawer */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        currentTab={activeTab === 'groups' ? 'dashboard' : activeTab} 
        setCurrentTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false); // Auto-close drawer on selection
        }} 
        user={currentUser} 
        onSignOut={handleSignOut}
        className={isMobileMenuOpen ? 'mobile-open' : ''}
      />
      <main className="estudy-workspace">
        {isProfileIncomplete && (
          <div className="alert-box" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Warning size={18} weight="bold" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>
              ⚠️ Please complete your profile details (Index Number, Reference Number, Year, Gender) in the Profile tab to enable your full academic companion credentials.
            </span>
          </div>
        )}
        {renderPanel()}
      </main>
    </div>
  );
}

export default App;
