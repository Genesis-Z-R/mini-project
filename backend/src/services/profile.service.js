import { prisma } from '../config/db.js';

export const ProfileService = {
  async seedProfile(email, name) {
    const emailKey = email.trim().toLowerCase();
    const exists = await prisma.profile.findUnique({
      where: { id: emailKey }
    });

    if (!exists) {
      return await prisma.profile.create({
        data: {
          id: emailKey,
          email: emailKey,
          name: name.trim()
        }
      });
    }
    return exists;
  },

  async getProfileByEmail(email) {
    const emailKey = email.trim().toLowerCase();
    const profile = await prisma.profile.findUnique({
      where: { email: emailKey }
    });

    if (profile) return profile;

    // In-memory fallback profile matching Spring Boot & React frontend behavior
    return {
      id: emailKey,
      email: emailKey,
      name: emailKey.split('@')[0],
      indexNumber: '',
      reference: '',
      year: '',
      gender: '',
      notificationsEnabled: true,
      isPublic: true,
      dailyDigestEnabled: true
    };
  },

  async updateProfile(email, profileData) {
    const emailKey = email.trim().toLowerCase();
    const existing = await prisma.profile.findUnique({
      where: { email: emailKey }
    });

    const updateFields = {
      name: profileData.name,
      indexNumber: profileData.indexNumber,
      reference: profileData.reference,
      year: profileData.year,
      gender: profileData.gender,
      notificationsEnabled: profileData.notificationsEnabled ?? true,
      isPublic: profileData.isPublic ?? true,
      dailyDigestEnabled: profileData.dailyDigestEnabled ?? true
    };

    if (existing) {
      return await prisma.profile.update({
        where: { email: emailKey },
        data: updateFields
      });
    } else {
      return await prisma.profile.create({
        data: {
          id: emailKey,
          email: emailKey,
          ...updateFields
        }
      });
    }
  },

  async getAllProfiles() {
    return await prisma.profile.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        indexNumber: true,
        reference: true,
        year: true,
        gender: true,
        notificationsEnabled: true,
        isPublic: true,
        dailyDigestEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
};
