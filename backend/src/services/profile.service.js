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
      where: { email: emailKey },
      include: { programme: true }
    });

    if (profile) return profile;

    return {
      id: emailKey,
      email: emailKey,
      name: emailKey.split('@')[0],
      indexNumber: '',
      reference: '',
      year: '',
      gender: '',
      programmeId: null,
      programmeName: '',
      notificationsEnabled: true,
      isPublic: true,
      dailyDigestEnabled: true,
      isDarkMode: false,
      publicResourceDirectoryEnabled: true,
      publicProfileEnabled: true,
      pushNotificationsMaster: true,
      classRemindersEnabled: true,
      studySessionRemindersEnabled: true,
      eventRemindersEnabled: true,
      friendRequestReceivedEnabled: true,
      friendRequestAcceptedEnabled: true,
      friendResourceUploadEnabled: true,
      friendCourseResourceUploadEnabled: true
    };
  },

  async updateProfile(email, profileData) {
    const emailKey = email.trim().toLowerCase();
    const existing = await prisma.profile.findUnique({
      where: { email: emailKey }
    });

    const updateFields = {};

    const fieldsToSync = [
      'name', 'indexNumber', 'reference', 'year', 'gender',
      'programmeId', 'programmeName', 'notificationsEnabled',
      'isPublic', 'dailyDigestEnabled', 'isDarkMode',
      'publicResourceDirectoryEnabled', 'publicProfileEnabled',
      'pushNotificationsMaster', 'classRemindersEnabled',
      'studySessionRemindersEnabled', 'eventRemindersEnabled',
      'friendRequestReceivedEnabled', 'friendRequestAcceptedEnabled',
      'friendResourceUploadEnabled', 'friendCourseResourceUploadEnabled'
    ];

    fieldsToSync.forEach(field => {
      if (profileData[field] !== undefined) {
        updateFields[field] = profileData[field];
      }
    });

    // Ensure isPublic and publicProfileEnabled stay synced if one is set
    if (profileData.publicProfileEnabled !== undefined) {
      updateFields.isPublic = profileData.publicProfileEnabled;
    }

    if (existing) {
      return await prisma.profile.update({
        where: { email: emailKey },
        data: updateFields,
        include: { programme: true }
      });
    } else {
      return await prisma.profile.create({
        data: {
          id: emailKey,
          email: emailKey,
          name: profileData.name || emailKey.split('@')[0],
          ...updateFields
        },
        include: { programme: true }
      });
    }
  },

  async getAllProfiles() {
    return await prisma.profile.findMany({
      include: { programme: true }
    });
  }
};
