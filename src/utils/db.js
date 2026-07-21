import { createClient } from "@supabase/supabase-js";

// Load configuration from local environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://replace-with-your-id.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "replace-with-your-anon-key-string-here";

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom Auth Adapter wrapping Supabase Auth to match the old Firebase Auth interface perfectly
export const auth = {
  onAuthStateChanged(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        callback({
          email: session.user.email,
          emailVerified: session.user.email_confirmed_at ? true : false,
          uid: session.user.id
        });
      } else {
        callback(null);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  },

  async signInWithEmailAndPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return {
      user: {
        email: data.user.email,
        emailVerified: data.user.email_confirmed_at ? true : false,
        uid: data.user.id
      }
    };
  },

  async createUserWithEmailAndPassword(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return {
      user: {
        email: data.user.email,
        emailVerified: data.user.email_confirmed_at ? true : false,
        uid: data.user.id
      }
    };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};

// Mock Firebase auth helper exports so Login.jsx and App.jsx require ZERO updates
export const signInWithEmailAndPassword = async (authInstance, email, password) => {
  return await auth.signInWithEmailAndPassword(email, password);
};

export const createUserWithEmailAndPassword = async (authInstance, email, password) => {
  return await auth.createUserWithEmailAndPassword(email, password);
};

export const signOut = async (authInstance) => {
  return await auth.signOut();
};

export const onAuthStateChanged = (authInstance, callback) => {
  return auth.onAuthStateChanged(callback);
};

export const sendEmailVerification = async (user) => {
  console.log("Supabase handles confirmation mails automatically on signup.");
};

export const DatabaseService = {
  // Option B: Profiles seeding ONLY, starting with blank info fields, no pre-loaded items
  async seedUserData(email, fullName) {
    const emailKey = email.toLowerCase().trim();
    
    // Check if profile already exists
    const { data: profileExists } = await supabase.from('profiles').select('id').eq('email', emailKey).maybeSingle();
    if (profileExists) return;

    // Create Blank Profile - user will fill in year, indexNumber, reference, gender
    await supabase.from('profiles').insert([{
      id: emailKey,
      email: emailKey,
      name: fullName || email.split('@')[0],
      indexNumber: '',
      reference: '',
      year: '',
      gender: '',
      notificationsEnabled: true,
      isPublic: true,
      dailyDigestEnabled: true
    }]);
  },

  // Profile queries & updates
  async getProfile(email) {
    const emailKey = email.toLowerCase().trim();
    const { data, error } = await supabase.from('profiles').select('*').eq('email', emailKey).maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateProfile(email, profileData) {
    const emailKey = email.toLowerCase().trim();
    const { error } = await supabase.from('profiles').update(profileData).eq('email', emailKey);
    if (error) throw error;
  },

  // Courses query & mutations
  async getCourses(userId) {
    const { data, error } = await supabase.from('courses').select('*').eq('userId', userId);
    if (error) throw error;
    return data || [];
  },

  async addCourse(userId, course) {
    const id = 'c_' + Date.now();
    const newCourse = { ...course, id, userId };
    const { error } = await supabase.from('courses').insert([newCourse]);
    if (error) throw error;
    return newCourse;
  },

  async deleteCourse(id) {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
  },

  // Schedule query & mutations
  async getSchedule(userId) {
    const { data, error } = await supabase.from('schedule').select('*').eq('userId', userId);
    if (error) throw error;
    return data || [];
  },

  async addScheduleItem(userId, item) {
    const id = 's_' + Date.now();
    const schedule = await this.getSchedule(userId);
    
    // Clash validation check
    const checkOverlap = (dayA, startA, endA, dayB, startB, endB) => {
      if (dayA !== dayB) return false;
      const toMin = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      return toMin(startA) < toMin(endB) && toMin(startB) < toMin(endA);
    };

    const clash = schedule.find(s => 
      checkOverlap(s.day, s.startTime, s.endTime, item.day, item.startTime, item.endTime)
    );

    if (clash) {
      return { success: false, error: `Clash detected! Overlaps with ${clash.name} on ${clash.day} (${clash.startTime} - ${clash.endTime}).` };
    }

    const { error } = await supabase.from('schedule').insert([{ ...item, id, userId }]);
    if (error) throw error;
    return { success: true, item: { ...item, id, userId } };
  },

  async updateScheduleItem(id, userId, item) {
    const schedule = (await this.getSchedule(userId)).filter(s => s.id !== id);
    
    const checkOverlap = (dayA, startA, endA, dayB, startB, endB) => {
      if (dayA !== dayB) return false;
      const toMin = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      return toMin(startA) < toMin(endB) && toMin(startB) < toMin(endA);
    };

    const clash = schedule.find(s => 
      checkOverlap(s.day, s.startTime, s.endTime, item.day, item.startTime, item.endTime)
    );

    if (clash) {
      return { success: false, error: `Clash detected! Overlaps with ${clash.name} on ${clash.day} (${clash.startTime} - ${clash.endTime}).` };
    }

    const { error } = await supabase.from('schedule').update(item).eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  async removeScheduleItem(id) {
    const { error } = await supabase.from('schedule').delete().eq('id', id);
    if (error) throw error;
  },

  // Files / Resources query & mutations
  async getFiles(userId) {
    const { data, error } = await supabase.from('files').select('*').eq('userId', userId);
    if (error) throw error;
    return data || [];
  },

  // Supabase Storage actual file upload
  async uploadFileToStorage(fileObj) {
    const uniquePath = `${Date.now()}_${fileObj.name.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage.from('resources').upload(uniquePath, fileObj, {
      cacheControl: '3600',
      upsert: false
    });
    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(uniquePath);
    return { publicUrl, size: fileObj.size };
  },

  async uploadFileMetadata(fileData) {
    const id = 'f_' + Date.now();
    const newFile = { ...fileData, id, downloads: 0, uploadDate: new Date().toISOString().split('T')[0] };
    const { error } = await supabase.from('files').insert([newFile]);
    if (error) throw error;
    return newFile;
  },

  async deleteFile(id, storageUrl) {
    // If it has a storage path, delete it from bucket
    if (storageUrl) {
      try {
        const pathSegments = storageUrl.split('/resources/');
        if (pathSegments.length > 1) {
          const storagePath = pathSegments[1];
          await supabase.storage.from('resources').remove([storagePath]);
        }
      } catch (err) {
        console.error("Error removing file from Supabase storage:", err);
      }
    }
    const { error } = await supabase.from('files').delete().eq('id', id);
    if (error) throw error;
  },

  async toggleFileVisibility(id, isPublic) {
    const { error } = await supabase.from('files').update({ isPublic }).eq('id', id);
    if (error) throw error;
  },

  // Global search for public files (visible to everyone)
  async searchGlobalPublicFiles(searchTerm) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('isPublic', true)
      .ilike('title', `%${searchTerm}%`);
    if (error) throw error;
    return data || [];
  },

  // Copy friend / global file metadata to own files list
  async addPublicFileToMine(fileObj, targetUserId) {
    const id = 'f_' + Date.now();
    const copiedFile = {
      id,
      title: fileObj.title,
      courseId: 'none',
      fileType: fileObj.fileType,
      size: fileObj.size,
      downloads: 0,
      isPublic: false, // Default private for local copy
      uploadDate: new Date().toISOString().split('T')[0],
      userId: targetUserId,
      url: fileObj.url // Points to the same storage public URL link
    };
    const { error } = await supabase.from('files').insert([copiedFile]);
    if (error) throw error;
    return copiedFile;
  },

  // Quizzes query & mutations
  async getQuizzes(userId) {
    const { data, error } = await supabase.from('quizzes').select('*').eq('userId', userId);
    if (error) throw error;
    return data || [];
  },

  async addQuiz(quiz) {
    const id = 'q_' + Date.now();
    const newQuiz = { ...quiz, id };
    const { error } = await supabase.from('quizzes').insert([newQuiz]);
    if (error) throw error;
    return newQuiz;
  },

  async deleteQuiz(id) {
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) throw error;
  },

  async updateQuiz(id, quiz) {
    const { error } = await supabase.from('quizzes').update(quiz).eq('id', id);
    if (error) throw error;
  },

  // Study Sessions query & mutations
  async getStudySessions(userId) {
    const { data, error } = await supabase.from('study_sessions').select('*').eq('userId', userId);
    if (error) throw error;
    return data || [];
  },

  async saveStudySession(session) {
    const id = 'ss_' + Date.now();
    const newSession = { ...session, id };
    const { error } = await supabase.from('study_sessions').insert([newSession]);
    if (error) throw error;
    return newSession;
  },

  // Study Circles (Groups) query & mutations
  async getGroups() {
    const { data, error } = await supabase.from('groups').select('*');
    if (error) throw error;
    return data || [];
  },

  async createStudyCircle(circleData) {
    const id = 'g_' + Date.now();
    const newCircle = { 
      ...circleData, 
      id, 
      admins: [circleData.creatorId],
      members: [circleData.creatorId],
      resources: []
    };
    const { error } = await supabase.from('groups').insert([newCircle]);
    if (error) throw error;
    return newCircle;
  },

  async joinStudyCircle(id, email) {
    const { data, error: fetchErr } = await supabase.from('groups').select('members').eq('id', id).single();
    if (fetchErr) throw fetchErr;
    if (!data.members.includes(email)) {
      const updatedMembers = [...data.members, email];
      const { error } = await supabase.from('groups').update({ members: updatedMembers }).eq('id', id);
      if (error) throw error;
    }
  },

  async leaveStudyCircle(id, email) {
    const { data, error: fetchErr } = await supabase.from('groups').select('members, admins').eq('id', id).single();
    if (fetchErr) throw fetchErr;
    const updatedMembers = data.members.filter(m => m !== email);
    const updatedAdmins = data.admins.filter(a => a !== email);
    const { error } = await supabase.from('groups').update({ members: updatedMembers, admins: updatedAdmins }).eq('id', id);
    if (error) throw error;
  },

  async promoteToAdmin(id, memberEmail) {
    const { data, error: fetchErr } = await supabase.from('groups').select('admins').eq('id', id).single();
    if (fetchErr) throw fetchErr;
    if (!data.admins.includes(memberEmail)) {
      const updatedAdmins = [...data.admins, memberEmail];
      const { error } = await supabase.from('groups').update({ admins: updatedAdmins }).eq('id', id);
      if (error) throw error;
    }
  },

  async addCircleResource(id, resource) {
    const { data, error: fetchErr } = await supabase.from('groups').select('resources').eq('id', id).single();
    if (fetchErr) throw fetchErr;
    const newRes = {
      ...resource,
      id: 'res_' + Date.now(),
      uploadDate: new Date().toISOString().split('T')[0]
    };
    const updatedResources = [...(data.resources || []), newRes];
    const { error } = await supabase.from('groups').update({ resources: updatedResources }).eq('id', id);
    if (error) throw error;
    return newRes;
  },

  // Friends & Social Directory Queries
  async getFriendships(userId) {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`);
    if (error) throw error;
    return data || [];
  },

  async sendFriendRequest(senderId, receiverId) {
    const id = 'fr_' + Date.now();
    const { error } = await supabase.from('friendships').insert([{
      id,
      senderId,
      receiverId,
      status: 'pending'
    }]);
    if (error) throw error;
  },

  async acceptFriendRequest(id) {
    const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
    if (error) throw error;
  },

  async removeFriendship(id) {
    const { error } = await supabase.from('friendships').delete().eq('id', id);
    if (error) throw error;
  },

  // Retrieve a peer's public files (accessible to friends)
  async getPeerPublicFiles(peerEmail) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('userId', peerEmail.toLowerCase().trim())
      .eq('isPublic', true);
    if (error) throw error;
    return data || [];
  },

  // Quiz Attempts queries & mutations
  async getQuizAttempts(userId) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('userId', userId.toLowerCase().trim());
    if (error) throw error;
    return data || [];
  },

  async saveQuizAttempt(attempt) {
    const id = 'qa_' + Date.now();
    const newAttempt = {
      ...attempt,
      id,
      attemptDate: new Date().toISOString().split('T')[0]
    };
    const { error } = await supabase.from('quiz_attempts').insert([newAttempt]);
    if (error) throw error;
    return newAttempt;
  }
};
export default DatabaseService;
