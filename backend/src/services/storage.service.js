import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export const StorageService = {
  async saveFile(file) {
    const filename = file.filename;
    const publicUrl = `http://localhost:${env.PORT || 8080}/uploads/${filename}`;
    return {
      filename,
      publicUrl
    };
  },

  async deleteFile(filename) {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  },

  getFileUrl(filename) {
    return `http://localhost:${env.PORT || 8080}/uploads/${filename}`;
  }
};
