import { prisma } from '../config/db.js';
import { StorageService } from './storage.service.js';
import { NotificationService } from './notification.service.js';

export const FileService = {
  async getFilesByUser(userId, page, limit) {
    const emailKey = userId.trim().toLowerCase();
    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const [items, total] = await Promise.all([
        prisma.fileMetadata.findMany({
          where: { userId: emailKey },
          skip: (pageNum - 1) * limitNum,
          take: limitNum
        }),
        prisma.fileMetadata.count({ where: { userId: emailKey } })
      ]);
      return { items, total };
    }
    return await prisma.fileMetadata.findMany({
      where: { userId: emailKey }
    });
  },

  async getPublicFilesByUser(userId) {
    const emailKey = userId.trim().toLowerCase();
    return await prisma.fileMetadata.findMany({
      where: { userId: emailKey, isPublic: true }
    });
  },

  async searchPublicFiles(query = '', userId = '', filters = {}) {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return [];
    }

    const emailKey = userId ? userId.trim().toLowerCase() : '';

    // 1. Get current user's profile and enrolled courses if userId provided
    let currentUser = null;
    if (emailKey) {
      currentUser = await prisma.profile.findUnique({
        where: { id: emailKey },
        include: { programme: true, courses: true }
      });
    }

    const userProgrammeId = currentUser?.programmeId;
    const userProgrammeName = currentUser?.programmeName || currentUser?.programme?.name;
    const userCourseCodes = (currentUser?.courses || []).map(c => c.code.trim().toUpperCase());

    // 2. Fetch all public files where uploader's publicResourceDirectoryEnabled is true
    const rawFiles = await prisma.fileMetadata.findMany({
      where: {
        isPublic: true,
        user: {
          publicResourceDirectoryEnabled: true
        }
      },
      include: {
        user: {
          include: {
            programme: true,
            courses: true
          }
        }
      }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 3. Score and enrich each file
    const scoredFiles = rawFiles.map(file => {
      let score = 0;
      const matchReasons = [];
      const titleLower = file.title.toLowerCase();

      // Search relevance scoring
      if (cleanQuery) {
        if (titleLower === cleanQuery) {
          score += 100;
          matchReasons.push('Exact Title Match (+100)');
        } else if (titleLower.includes(cleanQuery) || (file.courseId && file.courseId.toLowerCase().includes(cleanQuery))) {
          score += 50;
          matchReasons.push('Keyword Match (+50)');
        }
      } else {
        score += 10; // Base score when browsing without query
      }

      // Academic proximity scoring: Same Programme (+30)
      const uploaderProgId = file.user?.programmeId;
      const uploaderProgName = file.user?.programmeName || file.user?.programme?.name;

      let sameProgramme = false;
      if (userProgrammeId && uploaderProgId && userProgrammeId === uploaderProgId) {
        sameProgramme = true;
      } else if (userProgrammeName && uploaderProgName && userProgrammeName.toLowerCase() === uploaderProgName.toLowerCase()) {
        sameProgramme = true;
      }

      if (sameProgramme) {
        score += 30;
        matchReasons.push(`Same Programme (${uploaderProgName || 'Matched'}) (+30)`);
      }

      // Academic proximity scoring: Same Course (+20)
      const uploaderCourseCodes = (file.user?.courses || []).map(c => c.code.trim().toUpperCase());
      const fileCourseCode = (file.courseId || '').trim().toUpperCase();
      let sameCourse = false;

      if (fileCourseCode && fileCourseCode !== 'NONE' && userCourseCodes.includes(fileCourseCode)) {
        sameCourse = true;
      } else if (uploaderCourseCodes.some(code => userCourseCodes.includes(code))) {
        sameCourse = true;
      }

      if (sameCourse) {
        score += 20;
        matchReasons.push('Same Course (+20)');
      }

      // Freshness: Uploaded within last 30 days (+10)
      const fileDate = file.createdAt ? new Date(file.createdAt) : new Date(file.uploadDate);
      const isRecent = !isNaN(fileDate.getTime()) && fileDate >= thirtyDaysAgo;

      if (isRecent) {
        score += 10;
        matchReasons.push('Recently Uploaded (+10)');
      }

      return {
        id: file.id,
        title: file.title,
        courseId: file.courseId,
        fileType: file.fileType,
        size: file.size,
        downloads: file.downloads,
        isPublic: file.isPublic,
        uploadDate: file.uploadDate,
        url: file.url,
        userId: file.userId,
        createdAt: file.createdAt,
        uploaderName: file.user?.name || file.userId.split('@')[0],
        uploaderEmail: file.userId,
        uploaderProgrammeName: uploaderProgName || 'General Student',
        uploaderProgrammeId: uploaderProgId || null,
        uploaderYear: file.user?.year || '—',
        relevanceScore: score,
        matchReasons,
        isSameProgramme: sameProgramme,
        isSameCourse: sameCourse,
        isRecent
      };
    });

    // 4. Apply Filters
    let filtered = scoredFiles;

    if (cleanQuery) {
      filtered = filtered.filter(f => f.title.toLowerCase().includes(cleanQuery) || (f.courseId && f.courseId.toLowerCase().includes(cleanQuery)) || f.relevanceScore >= 50);
    }

    if (filters.programmeOnly) {
      filtered = filtered.filter(f => f.isSameProgramme);
    }

    if (filters.sameCourseOnly) {
      filtered = filtered.filter(f => f.isSameCourse);
    }

    if (filters.fileType && filters.fileType !== 'ALL') {
      filtered = filtered.filter(f => f.fileType.toLowerCase() === filters.fileType.toLowerCase());
    }

    if (filters.recentOnly) {
      filtered = filtered.filter(f => f.isRecent);
    }

    // 5. Sort by relevanceScore descending, then by uploadDate descending
    return filtered.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return new Date(b.uploadDate || b.createdAt) - new Date(a.uploadDate || a.createdAt);
    });
  },

  async createFileMetadata(fileData) {
    const userId = fileData.userId.trim().toLowerCase();
    let profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) {
      await prisma.profile.create({
        data: { id: userId, email: userId, name: userId.split('@')[0] }
      });
    }

    const id = fileData.id || `f_${Date.now()}`;
    const result = await prisma.fileMetadata.upsert({
      where: { id },
      update: {
        title: fileData.title,
        courseId: fileData.courseId || 'none',
        fileType: fileData.fileType,
        size: fileData.size,
        downloads: fileData.downloads ?? 0,
        isPublic: fileData.isPublic ?? true,
        uploadDate: fileData.uploadDate || new Date().toISOString().split('T')[0],
        userId,
        url: fileData.url
      },
      create: {
        id,
        title: fileData.title,
        courseId: fileData.courseId || 'none',
        fileType: fileData.fileType,
        size: fileData.size,
        downloads: fileData.downloads ?? 0,
        isPublic: fileData.isPublic ?? true,
        uploadDate: fileData.uploadDate || new Date().toISOString().split('T')[0],
        userId,
        url: fileData.url
      }
    });

    if (result.isPublic) {
      await NotificationService.notifyFriendsOfResourceUpload(userId, result);
    }

    return result;
  },

  async copyFileMetadata(fileData) {
    return await this.createFileMetadata(fileData);
  },

  async toggleVisibility(id, isPublic) {
    return await prisma.fileMetadata.update({
      where: { id },
      data: { isPublic }
    });
  },

  async getDownloadUrl(id, authenticatedUserId = null) {
    const fileRecord = await prisma.fileMetadata.findUnique({ where: { id } });
    if (!fileRecord) {
      throw new Error('File not found');
    }

    const cleanAuthEmail = authenticatedUserId ? authenticatedUserId.trim().toLowerCase() : '';
    const isOwner = cleanAuthEmail && fileRecord.userId.toLowerCase() === cleanAuthEmail;

    if (!fileRecord.isPublic && !isOwner) {
      throw new Error('Access denied. This resource is private.');
    }

    let filename = '';
    if (fileRecord.url) {
      const parts = fileRecord.url.split('/');
      filename = parts[parts.length - 1];
    }
    if (!filename) {
      filename = fileRecord.id;
    }

    await prisma.fileMetadata.update({
      where: { id },
      data: { downloads: { increment: 1 } }
    }).catch(() => {});

    const downloadUrl = await StorageService.getPresignedDownloadUrl(filename);
    return {
      downloadUrl,
      filename: fileRecord.title,
      isPublic: fileRecord.isPublic
    };
  },

  async deleteFile(id) {
    const fileRecord = await prisma.fileMetadata.findUnique({ where: { id } });
    if (fileRecord && fileRecord.url) {
      const parts = fileRecord.url.split('/');
      const filename = parts[parts.length - 1];
      if (filename) {
        await StorageService.deleteFile(filename);
      }
    }
    await prisma.fileMetadata.delete({
      where: { id }
    });
  }
};
