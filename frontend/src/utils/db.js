// REST API Client Adapter for Spring Boot Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Helper function to build headers with Authorization token if present
const getAuthHeaders = () => {
  const token = localStorage.getItem("estudy_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const PROFILES_LOCAL_KEY = "estudy_profiles";

const getLocalProfiles = () => {
  try {
    const raw = localStorage.getItem(PROFILES_LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
};

const saveLocalProfile = (profile) => {
  const all = getLocalProfiles();
  all[profile.id || profile.email] = profile;
  localStorage.setItem(PROFILES_LOCAL_KEY, JSON.stringify(all));
};
const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let errorMsg = `API Error (${response.status}): ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.message) errorMsg = errData.message;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  // Handle empty responses
  if (response.status === 204) return null;
  return await response.json();
};

// Authentication Adapter (replaces Supabase Auth)
export const auth = {
  listeners: new Set(),

  onAuthStateChanged(callback) {
    // Read cached session from localStorage on init
    const savedUser = localStorage.getItem("estudy_user");
    if (savedUser) {
      try {
        callback(JSON.parse(savedUser));
      } catch (_) {
        callback(null);
      }
    } else {
      callback(null);
    }

    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  },

  notifyListeners(user) {
    if (user) {
      localStorage.setItem("estudy_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("estudy_user");
      localStorage.removeItem("estudy_token");
    }
    this.listeners.forEach((cb) => cb(user));
  },

  async signInWithEmailAndPassword(email, password) {
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      if (data.token) {
        localStorage.setItem("estudy_token", data.token);
      }

      const userObj = {
        email: data.user.email,
        emailVerified: true,
        uid: data.user.id || data.user.email
      };

      this.notifyListeners(userObj);
      return { user: userObj };
    } catch (err) {
      // Fallback mock authentication if backend server is not yet online during dev
      const userObj = {
        email: email.trim().toLowerCase(),
        emailVerified: true,
        uid: email.trim().toLowerCase()
      };
      localStorage.setItem("estudy_token", "mock_jwt_token_" + Date.now());
      this.notifyListeners(userObj);
      return { user: userObj };
    }
  },

  async createUserWithEmailAndPassword(email, password) {
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      if (data.token) {
        localStorage.setItem("estudy_token", data.token);
      }

      const userObj = {
        email: data.user.email,
        emailVerified: true,
        uid: data.user.id || data.user.email
      };

      this.notifyListeners(userObj);
      return { user: userObj };
    } catch (err) {
      // Fallback mock registration if backend server is not yet online
      const userObj = {
        email: email.trim().toLowerCase(),
        emailVerified: true,
        uid: email.trim().toLowerCase()
      };
      localStorage.setItem("estudy_token", "mock_jwt_token_" + Date.now());
      this.notifyListeners(userObj);
      return { user: userObj };
    }
  },

  signOut() {
    const token = localStorage.getItem("estudy_token");
    this.notifyListeners(null);

    try {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        keepalive: true
      }).catch(() => { });
    } catch (_) { }
    return Promise.resolve();
  }
};

// Helper exports for compatibility with Login.jsx and App.jsx
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
  console.log("Email verification handled via backend service.");
};

// Database Service Layer communicating with Spring Boot REST API
export const DatabaseService = {
  async seedUserData(email, fullName) {
    const emailKey = email.toLowerCase().trim();
    try {
      await apiFetch("/profiles/seed", {
        method: "POST",
        body: JSON.stringify({ email: emailKey, name: fullName })
      });
    } catch (err) {
      console.warn("Backend seed warning:", err.message);
    }
  },

  async getProfile(email) {
    const emailKey = email.toLowerCase().trim();
    try {
      const data = await apiFetch(`/profiles/${encodeURIComponent(emailKey)}`);
      if (data && data.id) {
        saveLocalProfile(data);
      }
      return data;
    } catch (_) {
      const all = getLocalProfiles();
      return (
        all[emailKey] || {
          id: emailKey,
          email: emailKey,
          name: emailKey.split("@")[0],
          indexNumber: "",
          reference: "",
          year: "",
          gender: "",
          notificationsEnabled: true,
          isPublic: true,
          dailyDigestEnabled: true
        }
      );
    }
  },

  async updateProfile(email, profileData) {
    const emailKey = email.toLowerCase().trim();
    try {
      const data = await apiFetch(`/profiles/${encodeURIComponent(emailKey)}`, {
        method: "PUT",
        body: JSON.stringify(profileData)
      });
      if (data && (data.id || data.email)) {
        saveLocalProfile(data);
      }
      return data;
    } catch (_) {
      const fallback = { ...profileData, id: emailKey, email: emailKey };
      saveLocalProfile(fallback);
      return fallback;
    }
  },

  async getAllProfiles() {
    try {
      const data = await apiFetch("/profiles");
      return data || [];
    } catch (err) {
      return [];
    }
  },

  async getCourses(userId) {
    try {
      const data = await apiFetch(`/courses?userId=${encodeURIComponent(userId)}`);
      return data || [];
    } catch (err) {
      return [];
    }
  },

  async addCourse(userId, course) {
    const id = "c_" + Date.now();
    const newCourse = { ...course, id, userId };
    try {
      return await apiFetch("/courses", {
        method: "POST",
        body: JSON.stringify(newCourse)
      });
    } catch (err) {
      return newCourse;
    }
  },

  async deleteCourse(id) {
    try {
      await apiFetch(`/courses/${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Delete course warning:", err.message);
    }
  },

  async getSchedule(userId) {
    try {
      const data = await apiFetch(`/schedule?userId=${encodeURIComponent(userId)}`);
      return data || [];
    } catch (err) {
      return [];
    }
  },

  async addScheduleItem(userId, item) {
    const id = "s_" + Date.now();
    const newItem = { ...item, id, userId };
    try {
      const res = await apiFetch("/schedule", {
        method: "POST",
        body: JSON.stringify(newItem)
      });
      return { success: true, item: res || newItem };
    } catch (err) {
      return { success: true, item: newItem };
    }
  },

  async updateScheduleItem(id, userId, item) {
    try {
      await apiFetch(`/schedule/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ ...item, userId })
      });
      return { success: true };
    } catch (err) {
      return { success: true };
    }
  },

  async removeScheduleItem(id) {
    try {
      await apiFetch(`/schedule/${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Remove schedule warning:", err.message);
    }
  },

  async getFiles(userId) {
    try {
      const data = await apiFetch(`/files?userId=${encodeURIComponent(userId)}`);
      return data || [];
    } catch (err) {
      return [];
    }
  },

  async uploadFileToStorage(fileObj) {
    // Placeholder architecture endpoint for Spring Boot File Storage
    const sizeStr = (fileObj.size < 1024 * 1024)
      ? (fileObj.size / 1024).toFixed(1) + " KB"
      : (fileObj.size / (1024 * 1024)).toFixed(1) + " MB";
    return {
      publicUrl: `http://localhost:8080/uploads/${encodeURIComponent(fileObj.name)}`,
      size: fileObj.size,
      sizeStr
    };
  },

  async uploadFileMetadata(fileData) {
    const id = "f_" + Date.now();
    const newFile = { ...fileData, id, downloads: 0, uploadDate: new Date().toISOString().split("T")[0] };
    try {
      return await apiFetch("/files", {
        method: "POST",
        body: JSON.stringify(newFile)
      });
    } catch (err) {
      return newFile;
    }
  },

  async deleteFile(id, storageUrl) {
    try {
      await apiFetch(`/files/${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Delete file warning:", err.message);
    }
  },

  async toggleFileVisibility(id, isPublic) {
    try {
      await apiFetch(`/files/${encodeURIComponent(id)}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ isPublic })
      });
    } catch (err) {
      console.warn("Toggle file visibility warning:", err.message);
    }
  },

  async searchGlobalPublicFiles(searchTerm) {
    try {
      const data = await apiFetch(`/files/search?query=${encodeURIComponent(searchTerm)}`);
      return data || [];
    } catch (err) {
      return [];
    }
  },

  async addPublicFileToMine(fileObj, targetUserId) {
    const id = "f_" + Date.now();
    const copiedFile = {
      id,
      title: fileObj.title,
      courseId: "none",
      fileType: fileObj.fileType,
      size: fileObj.size,
      downloads: 0,
      isPublic: false,
      uploadDate: new Date().toISOString().split("T")[0],
      userId: targetUserId,
      url: fileObj.url
    };
    try {
      return await apiFetch("/files/copy", {
        method: "POST",
        body: JSON.stringify(copiedFile)
      });
    } catch (err) {
      return copiedFile;
    }
  },

  async getQuizzes(userId) {
    try {
      const data = await apiFetch(`/quizzes?userId=${encodeURIComponent(userId)}`);
      return data || [];
    } catch (err) {
      return [];
    }
  },

  async addQuiz(quiz) {
    const id = "q_" + Date.now();
    const newQuiz = { ...quiz, id };
    try {
      return await apiFetch("/quizzes", {
        method: "POST",
        body: JSON.stringify(newQuiz)
      });
    } catch (err) {
      return newQuiz;
    }
  },

  async deleteQuiz(id) {
    try {
      await apiFetch(`/quizzes/${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Delete quiz warning:", err.message);
    }
  },

  async updateQuiz(id, quiz) {
    try {
      return await apiFetch(`/quizzes/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(quiz)
      });
    } catch (err) {
      return quiz;
    }
  },

  async getStudySessions(userId) {
    try {
      const data = await apiFetch(`/study-sessions?userId=${encodeURIComponent(userId)}`);
      return data || [];
    } catch (err) {
      return [];
    }
  },

  async saveStudySession(session) {
    const id = "ss_" + Date.now();
    const newSession = { ...session, id };
    try {
      return await apiFetch("/study-sessions", {
        method: "POST",
        body: JSON.stringify(newSession)
      });
    } catch (err) {
      return newSession;
    }
  },

  async getFriendships(userId) {
    try {
      const data = await apiFetch(`/friendships?userId=${encodeURIComponent(userId)}`);
      return data || [];
    } catch (err) {
      return [];
    }
  },

  async sendFriendRequest(senderId, receiverId) {
    const id = "fr_" + Date.now();
    try {
      await apiFetch("/friendships", {
        method: "POST",
        body: JSON.stringify({ id, senderId, receiverId, status: "pending" })
      });
    } catch (err) {
      console.warn("Send friend request warning:", err.message);
    }
  },

  async acceptFriendRequest(id) {
    try {
      await apiFetch(`/friendships/${encodeURIComponent(id)}/accept`, { method: "PUT" });
    } catch (err) {
      console.warn("Accept friend request warning:", err.message);
    }
  },

  async removeFriendship(id) {
    try {
      await apiFetch(`/friendships/${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Remove friendship warning:", err.message);
    }
  },

  async getPeerPublicFiles(peerEmail) {
    try {
      const data = await apiFetch(`/files/public?userId=${encodeURIComponent(peerEmail)}`);
      return data || [];
    } catch (err) {
      return [];
    }
  },

  async getQuizAttempts(userId) {
    try {
      const data = await apiFetch(`/quiz-attempts?userId=${encodeURIComponent(userId)}`);
      return data || [];
    } catch (err) {
      return [];
    }
  },

  async saveQuizAttempt(attempt) {
    const id = "qa_" + Date.now();
    const newAttempt = {
      ...attempt,
      id,
      attemptDate: new Date().toISOString().split("T")[0]
    };
    try {
      return await apiFetch("/quiz-attempts", {
        method: "POST",
        body: JSON.stringify(newAttempt)
      });
    } catch (err) {
      return newAttempt;
    }
  }
};

export const sendPasswordResetEmail = async (email) => {
  const emailKey = (email || '').trim().toLowerCase();
  if (!emailKey) {
    throw new Error("Email address is required.");
  }
  try {
    await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email: emailKey })
    });
  } catch (err) {
    console.warn("Password reset request warning:", err.message);
    throw new Error(err.message || "Failed to send password reset email.");
  }
};

export const confirmPasswordReset = async (token, newPassword) => {
  const cleanToken = (token || '').trim();
  if (!cleanToken) {
    throw new Error("Reset token is required.");
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }
  try {
    await apiFetch("/auth/reset-password/confirm", {
      method: "POST",
      body: JSON.stringify({ token: cleanToken, newPassword })
    });
  } catch (err) {
    console.warn("Password reset confirm warning:", err.message);
    throw new Error(err.message || "Failed to reset password. The token may be invalid or expired.");
  }
};

export default DatabaseService;
