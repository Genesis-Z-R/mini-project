import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  increment,
  query,
  where
} from "firebase/firestore";

// Firebase App configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZW528oF4Lt48SZmZyDVDkTwRo2ZJ8LlQ",
  authDomain: "estudy-companion.firebaseapp.com",
  projectId: "estudy-companion",
  storageBucket: "estudy-companion.firebasestorage.app",
  messagingSenderId: "679747279506",
  appId: "1:679747279506:web:fbb7094354631c1ac2244b",
  measurementId: "G-5QPS0QXLMK"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with persistent multi-tab local cache for offline-first capabilities
export const firestoreDb = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initial mock data for first load representing default seed data
const INITIAL_COURSES = [
  { id: 'c1', name: 'Computer Architecture', code: 'CS-301', room: 'Computer Labs' },
  { id: 'c2', name: 'Embedded System', code: 'CS-302', room: 'Lab 3B' },
  { id: 'c3', name: 'Research Method and IT Project', code: 'CS-303', room: 'Lecture Hall C' },
  { id: 'c4', name: 'Financial Accounting', code: 'CS-304', room: 'Room 401' },
  { id: 'c5', name: 'Data Structures II', code: 'CS-305', room: 'Lecture Hall A' },
  { id: 'c6', name: 'Computer Graphics', code: 'CS-306', room: 'Lecture Hall B' },
  { id: 'c7', name: 'E-Commerce', code: 'CS-307', room: 'Room 202' },
  { id: 'c8', name: 'Operations Research II', code: 'CS-308', room: 'Room 105' }
];

const INITIAL_SCHEDULE = [
  { id: 's1', courseId: 'c1', name: 'Computer Architecture Lecture', day: 'Monday', startTime: '09:00', endTime: '11:00', room: 'Computer Labs', isRepeating: true, repeatFrequency: 'weekly', isClass: true },
  { id: 's2', courseId: 'c2', name: 'Embedded System Practical', day: 'Tuesday', startTime: '11:30', endTime: '13:30', room: 'Lab 3B', isRepeating: true, repeatFrequency: 'weekly', isClass: true },
  { id: 's3', courseId: 'c3', name: 'Research Methods Workshop', day: 'Wednesday', startTime: '14:00', endTime: '16:00', room: 'Lecture Hall C', isRepeating: true, repeatFrequency: 'weekly', isClass: true },
  { id: 's4', courseId: 'c5', name: 'Data Structures II Seminar', day: 'Thursday', startTime: '09:00', endTime: '11:00', room: 'Lecture Hall A', isRepeating: true, repeatFrequency: 'weekly', isClass: true },
  { id: 's5', courseId: 'c1', name: 'Project Status Review', day: 'Friday', startTime: '15:00', endTime: '16:00', room: 'Online Zoom', isRepeating: false, repeatFrequency: 'none', isClass: false } // Non-class task
];

const INITIAL_FILES = [
  { id: 'f1', title: 'Lecture 1: Intro to Pipelines', courseId: 'c1', fileType: 'pdf', size: '2.4 MB', downloads: 14, isPublic: true, uploadDate: '2026-07-10' },
  { id: 'f2', title: 'Module 2 Quiz Solutions', courseId: 'c2', fileType: 'pdf', size: '1.8 MB', downloads: 8, isPublic: true, uploadDate: '2026-07-12' },
  { id: 'f3', title: 'Term Project Guidelines', courseId: 'c3', fileType: 'pdf', size: '1.1 MB', downloads: 35, isPublic: false, uploadDate: '2026-07-08' }
];

const INITIAL_QUIZZES = [
  {
    id: 'q1',
    courseId: 'c1',
    courseName: 'Computer Architecture',
    title: 'Pipelining Basics Quiz',
    questionCount: 3,
    type: 'multiple choice',
    questions: [
      { id: 1, text: 'Which stage fetches instructions?', options: ['IF', 'ID', 'EX', 'MEM'], answer: 'IF' },
      { id: 2, text: 'What hazard is caused by data dependencies?', options: ['Structural', 'Data', 'Control', 'Branch'], answer: 'Data' },
      { id: 3, text: 'Which stage writes register results back?', options: ['MEM', 'WB', 'EX', 'ID'], answer: 'WB' }
    ]
  }
];

// Helper to determine time overlaps for course scheduling
function hasOverlap(dayA, startA, endA, dayB, startB, endB) {
  if (dayA !== dayB) return false;
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const startAMin = toMinutes(startA);
  const endAMin = toMinutes(endA);
  const startBMin = toMinutes(startB);
  const endBMin = toMinutes(endB);
  return startAMin < endBMin && startBMin < endAMin;
}

export const DatabaseService = {
  // Auth Profile seeding
  async seedUserData(email, fullName) {
    const emailKey = email.toLowerCase().trim();
    const userRef = doc(firestoreDb, 'users', emailKey);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) return;

    const batch = writeBatch(firestoreDb);
    
    // Seed User Profile
    batch.set(userRef, {
      id: emailKey,
      email: emailKey,
      name: fullName || email.split('@')[0],
      indexNumber: 'UG-18-' + Math.floor(1000 + Math.random() * 9000),
      reference: 'REF-' + Math.floor(100000 + Math.random() * 900000),
      year: 'Year 3',
      gender: 'Male',
      group: 'Group 2',
      notificationsEnabled: true,
      isPublic: true
    });

    // Seed Courses
    INITIAL_COURSES.forEach(c => {
      batch.set(doc(firestoreDb, 'courses', c.id + '_' + emailKey), {
        ...c,
        id: c.id + '_' + emailKey,
        userId: emailKey
      });
    });

    // Seed Schedule
    INITIAL_SCHEDULE.forEach(s => {
      batch.set(doc(firestoreDb, 'schedule', s.id + '_' + emailKey), {
        ...s,
        id: s.id + '_' + emailKey,
        courseId: s.courseId + '_' + emailKey,
        userId: emailKey
      });
    });

    // Seed Files
    INITIAL_FILES.forEach(f => {
      batch.set(doc(firestoreDb, 'files', f.id + '_' + emailKey), {
        ...f,
        id: f.id + '_' + emailKey,
        courseId: f.courseId + '_' + emailKey,
        userId: emailKey
      });
    });

    // Seed Quizzes
    INITIAL_QUIZZES.forEach(q => {
      batch.set(doc(firestoreDb, 'quizzes', q.id + '_' + emailKey), {
        ...q,
        id: q.id + '_' + emailKey,
        courseId: q.courseId + '_' + emailKey,
        userId: emailKey
      });
    });

    await batch.commit();
  },

  async updateProfile(email, profileData) {
    const emailKey = email.toLowerCase().trim();
    await updateDoc(doc(firestoreDb, 'users', emailKey), profileData);
  },

  // Files / Resources mutations
  async uploadFileMetadata(fileData) {
    const id = 'f_' + Date.now();
    const newFile = { ...fileData, id, downloads: 0, uploadDate: new Date().toISOString().split('T')[0] };
    await setDoc(doc(firestoreDb, 'files', id), newFile);
    return newFile;
  },

  async deleteFile(id) {
    await deleteDoc(doc(firestoreDb, 'files', id));
  },

  async toggleFileVisibility(id, isPublic) {
    await updateDoc(doc(firestoreDb, 'files', id), { isPublic });
  },

  // Quizzes mutations
  async addQuiz(quiz) {
    const id = 'q_' + Date.now();
    const newQuiz = { ...quiz, id };
    await setDoc(doc(firestoreDb, 'quizzes', id), newQuiz);
    return newQuiz;
  },

  async deleteQuiz(id) {
    await deleteDoc(doc(firestoreDb, 'quizzes', id));
  },

  async updateQuiz(id, quiz) {
    await setDoc(doc(firestoreDb, 'quizzes', id), quiz);
  },

  // Study Sessions mutations
  async saveStudySession(session) {
    const id = 'ss_' + Date.now();
    const newSession = { ...session, id };
    await setDoc(doc(firestoreDb, 'study_sessions', id), newSession);
    return newSession;
  },

  // Schedule mutations
  async addScheduleItem(userId, item) {
    const id = 's_' + Date.now();
    const querySnapshot = await getDocs(query(collection(firestoreDb, 'schedule'), where('userId', '==', userId)));
    const schedule = querySnapshot.docs.map(doc => doc.data());
    
    // Clash check
    const clash = schedule.find(s => 
      hasOverlap(s.day, s.startTime, s.endTime, item.day, item.startTime, item.endTime)
    );
    
    if (clash) {
      return { success: false, error: `Clash detected! Overlaps with ${clash.name} on ${clash.day} (${clash.startTime} - ${clash.endTime}).` };
    }

    await setDoc(doc(firestoreDb, 'schedule', id), { ...item, id, userId });
    return { success: true, item: { ...item, id, userId } };
  },

  async updateScheduleItem(id, userId, item) {
    const querySnapshot = await getDocs(query(collection(firestoreDb, 'schedule'), where('userId', '==', userId)));
    const schedule = querySnapshot.docs
      .map(doc => doc.data())
      .filter(s => s.id !== id);
    
    // Clash check
    const clash = schedule.find(s => 
      hasOverlap(s.day, s.startTime, s.endTime, item.day, item.startTime, item.endTime)
    );
    
    if (clash) {
      return { success: false, error: `Clash detected! Overlaps with ${clash.name} on ${clash.day} (${clash.startTime} - ${clash.endTime}).` };
    }
    
    await setDoc(doc(firestoreDb, 'schedule', id), { ...item, id, userId });
    return { success: true };
  },

  async removeScheduleItem(id) {
    await deleteDoc(doc(firestoreDb, 'schedule', id));
  },

  // Study Blocks mutations
  async addManualStudyBlock(block) {
    const id = 'sb_' + Date.now();
    const newBlock = { ...block, id };
    await setDoc(doc(firestoreDb, 'study_blocks', id), newBlock);
    return newBlock;
  },

  async removeStudyBlock(id) {
    await deleteDoc(doc(firestoreDb, 'study_blocks', id));
  },

  async saveStudyBlocks(blocks) {
    const batch = writeBatch(firestoreDb);
    blocks.forEach(b => {
      batch.set(doc(firestoreDb, 'study_blocks', b.id), b);
    });
    await batch.commit();
  },

  // Study Circles (Groups) mutations
  async createStudyCircle(circleData) {
    const id = 'g_' + Date.now();
    const newCircle = { 
      ...circleData, 
      id, 
      admins: [circleData.creatorId],
      members: [circleData.creatorId],
      resources: []
    };
    await setDoc(doc(firestoreDb, 'groups', id), newCircle);
    return newCircle;
  },

  async joinStudyCircle(id, email) {
    const docRef = doc(firestoreDb, 'groups', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    if (!data.members.includes(email)) {
      const updatedMembers = [...data.members, email];
      await updateDoc(docRef, { members: updatedMembers });
    }
  },

  async leaveStudyCircle(id, email) {
    const docRef = doc(firestoreDb, 'groups', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    const updatedMembers = data.members.filter(m => m !== email);
    const updatedAdmins = data.admins.filter(a => a !== email);
    await updateDoc(docRef, { members: updatedMembers, admins: updatedAdmins });
  },

  async promoteToAdmin(id, memberEmail) {
    const docRef = doc(firestoreDb, 'groups', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    if (!data.admins.includes(memberEmail)) {
      const updatedAdmins = [...data.admins, memberEmail];
      await updateDoc(docRef, { admins: updatedAdmins });
    }
  },

  async addCircleResource(id, resource) {
    const docRef = doc(firestoreDb, 'groups', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    const newRes = {
      ...resource,
      id: 'res_' + Date.now(),
      uploadDate: new Date().toISOString().split('T')[0]
    };
    const updatedResources = [...(data.resources || []), newRes];
    await updateDoc(docRef, { resources: updatedResources });
    return newRes;
  }
};
