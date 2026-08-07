import { prisma } from '../config/db.js';
import { normalizeProgrammeName } from '../utils/programme.utils.js';

const DEFAULT_PROGRAMMES = [
  'Computer Science',
  'Computer Engineering',
  'Information Technology',
  'Electrical Engineering',
  'Business Administration',
  'Mechanical Engineering',
  'Mathematics & Statistics'
];

export const ProgrammeService = {
  async seedDefaultsIfEmpty() {
    const count = await prisma.programme.count();
    if (count === 0) {
      for (const name of DEFAULT_PROGRAMMES) {
        const normalizedName = normalizeProgrammeName(name);
        const id = `prog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await prisma.programme.upsert({
          where: { normalizedName },
          update: {},
          create: {
            id,
            name,
            normalizedName
          }
        });
      }
    }
  },

  async getAllProgrammes() {
    await this.seedDefaultsIfEmpty();
    return await prisma.programme.findMany({
      orderBy: { name: 'asc' }
    });
  },

  async getOrCreateProgramme(name) {
    if (!name || !name.trim()) {
      throw new Error('Programme name is required.');
    }
    const cleanName = name.trim();
    const normalizedName = normalizeProgrammeName(cleanName);

    let existing = await prisma.programme.findUnique({
      where: { normalizedName }
    });

    if (existing) {
      return existing;
    }

    const id = `prog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    return await prisma.programme.create({
      data: {
        id,
        name: cleanName,
        normalizedName
      }
    });
  }
};
