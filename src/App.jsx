import { useState, useEffect } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Schedule } from './components/Schedule';
import { Repository } from './components/Repository';
import { Groups } from './components/Groups';
import { Quizzes } from './components/Quizzes';
import { Profile } from './components/Profile';
import { Setting } from './components/Setting';
import { auth, firestoreDb, DatabaseService } from './utils/db';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Database States
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [files, setFiles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [profile, setProfile] = useState({
    name: 'Student',
    email: '',
    indexNumber: '',
    reference: '',
    year: 'Year 3',
    gender: 'Male',
    group: 'Group 2',
    notificationsEnabled: true,
    isPublic: true
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

  // Auth State Listener & Subscriptions
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setCurrentUser(user);
        setAuthChecking(false);
      } else {
        setCurrentUser(null);
        setAuthChecking(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sync state queries filtered by authenticated user ID
  useEffect(() => {
    if (!currentUser) return;
    const emailKey = currentUser.email.toLowerCase().trim();

    const qCourses = query(collection(firestoreDb, 'courses'), where('userId', '==', emailKey));
    const unsubCourses = onSnapshot(qCourses, (snapshot) => {
      setCourses(snapshot.docs.map(d => d.data()));
    });

    const qSchedule = query(collection(firestoreDb, 'schedule'), where('userId', '==', emailKey));
    const unsubSchedule = onSnapshot(qSchedule, (snapshot) => {
      setSchedule(snapshot.docs.map(d => d.data()));
    });

    // Files: Show own files + public files from other users
    const unsubFiles = onSnapshot(collection(firestoreDb, 'files'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setFiles(list);
    });

    // Groups (Study Circles): show all groups
    const unsubGroups = onSnapshot(collection(firestoreDb, 'groups'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setGroups(list);
    });

    const qStudySessions = query(collection(firestoreDb, 'study_sessions'), where('userId', '==', emailKey));
    const unsubStudySessions = onSnapshot(qStudySessions, (snapshot) => {
      setStudySessions(snapshot.docs.map(d => d.data()));
    });

    const qQuizzes = query(collection(firestoreDb, 'quizzes'), where('userId', '==', emailKey));
    const unsubQuizzes = onSnapshot(qQuizzes, (snapshot) => {
      setQuizzes(snapshot.docs.map(d => d.data()));
    });

    const unsubProfile = onSnapshot(doc(firestoreDb, 'users', emailKey), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    });

    return () => {
      unsubCourses();
      unsubSchedule();
      unsubFiles();
      unsubGroups();
      unsubStudySessions();
      unsubQuizzes();
      unsubProfile();
    };
  }, [currentUser]);

  // Auth Listener imports helper
  function onAuthStateChanged(auth, callback) {
    return auth.onAuthStateChanged(callback);
  }

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  // Schedule Handlers
  const handleAddScheduleItem = async (item) => {
    return await DatabaseService.addScheduleItem(currentUser.email.toLowerCase(), item);
  };

  const handleRemoveScheduleItem = async (id) => {
    await DatabaseService.removeScheduleItem(id);
  };

  const handleUpdateScheduleItem = async (id, item) => {
    return await DatabaseService.updateScheduleItem(id, currentUser.email.toLowerCase(), item);
  };

  // Study Sessions handler
  const handleSaveStudySession = async (session) => {
    await DatabaseService.saveStudySession({
      ...session,
      userId: currentUser.email.toLowerCase()
    });
  };

  // Resources / Files Handlers
  const handleAddFile = async (fileData) => {
    await DatabaseService.uploadFileMetadata({
      ...fileData,
      userId: currentUser.email.toLowerCase()
    });
  };

  const handleDeleteFile = async (id) => {
    await DatabaseService.deleteFile(id);
  };

  const handleToggleFileVisibility = async (id, isPublic) => {
    await DatabaseService.toggleFileVisibility(id, isPublic);
  };

  // Profile Handler
  const handleUpdateProfile = async (updatedProfile) => {
    await DatabaseService.updateProfile(currentUser.email, updatedProfile);
  };

  // Quiz Handlers
  const handleCreateQuiz = async (quiz) => {
    await DatabaseService.addQuiz({
      ...quiz,
      userId: currentUser.email.toLowerCase()
    });
  };

  const handleDeleteQuiz = async (id) => {
    await DatabaseService.deleteQuiz(id);
  };

  // Study Circles (Groups) handlers
  const handleCreateStudyCircle = async (circle) => {
    await DatabaseService.createStudyCircle({
      ...circle,
      creatorId: currentUser.email.toLowerCase()
    });
  };

  const handleToggleJoinGroup = async (id, isJoined) => {
    const email = currentUser.email.toLowerCase();
    if (isJoined) {
      await DatabaseService.leaveStudyCircle(id, email);
    } else {
      await DatabaseService.joinStudyCircle(id, email);
    }
  };

  const handlePromoteCircleAdmin = async (groupId, email) => {
    await DatabaseService.promoteToAdmin(groupId, email);
  };

  const handleCirclePostResource = async (groupId, resource) => {
    await DatabaseService.addCircleResource(groupId, {
      ...resource,
      uploaderEmail: currentUser.email.toLowerCase()
    });
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
      case 'quizzes':
        return (
          <Quizzes 
            courses={courses} 
            quizzes={quizzes} 
            onCreateQuiz={handleCreateQuiz}
            onDeleteQuiz={handleDeleteQuiz}
          />
        );
      case 'resources':
        return (
          <Repository 
            courses={courses} 
            files={files} 
            userEmail={currentUser.email.toLowerCase()}
            onAddFile={handleAddFile} 
            onDeleteFile={handleDeleteFile}
            onToggleFileVisibility={handleToggleFileVisibility}
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
      <Sidebar 
        currentTab={activeTab === 'groups' ? 'dashboard' : activeTab} 
        setCurrentTab={setActiveTab} 
        user={currentUser} 
        onSignOut={handleSignOut}
      />
      <main className="estudy-workspace">
        {renderPanel()}
      </main>
    </div>
  );
}

export default App;
