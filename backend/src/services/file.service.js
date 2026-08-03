import { prisma } from '../config/db.js';

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

  async searchPublicFiles(query) {
    return await prisma.fileMetadata.findMany({
      where: {
        isPublic: true,
        title: { contains: query }
      }
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
    return await prisma.fileMetadata.upsert({
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

  async deleteFile(id) {
    await prisma.fileMetadata.delete({
      where: { id }
    });
  }
};
