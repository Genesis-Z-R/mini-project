import { FileService } from '../services/file.service.js';
import { StorageService } from '../services/storage.service.js';
import { formatPaginatedResponse } from '../utils/response.js';

export const FileController = {
  async getFiles(req, res, next) {
    try {
      const userId = req.query.userId || (req.user ? req.user.email : '');
      const { page, limit } = req.query;
      if (!userId) {
        return res.status(200).json(formatPaginatedResponse([], 0, page, limit));
      }
      const result = await FileService.getFilesByUser(userId, page, limit);
      if (page && limit) {
        return res.status(200).json(formatPaginatedResponse(result.items, result.total, page, limit));
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getPeerPublicFiles(req, res, next) {
    try {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(200).json([]);
      }
      const files = await FileService.getPublicFilesByUser(userId);
      return res.status(200).json(files);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async searchPublicFiles(req, res, next) {
    try {
      const query = req.query.query || '';
      const userId = req.query.userId || (req.user ? req.user.email : '');
      const filters = {
        programmeOnly: req.query.programmeOnly === 'true',
        sameCourseOnly: req.query.sameCourseOnly === 'true',
        fileType: req.query.fileType || '',
        recentOnly: req.query.recentOnly === 'true'
      };
      const files = await FileService.searchPublicFiles(query, userId, filters);
      return res.status(200).json(files);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async uploadFileMetadata(req, res, next) {
    try {
      const fileMetadata = await FileService.createFileMetadata(req.body);
      return res.status(200).json(fileMetadata);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async uploadBinaryFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const storageResult = await StorageService.saveFile(req.file);
      const sizeStr = (req.file.size < 1024 * 1024)
        ? (req.file.size / 1024).toFixed(1) + ' KB'
        : (req.file.size / (1024 * 1024)).toFixed(1) + ' MB';

      return res.status(200).json({
        publicUrl: storageResult.publicUrl,
        size: req.file.size,
        sizeStr,
        filename: storageResult.filename
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async copyPublicFile(req, res, next) {
    try {
      const fileMetadata = await FileService.copyFileMetadata(req.body);
      return res.status(200).json(fileMetadata);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async toggleVisibility(req, res, next) {
    try {
      const id = req.params.id;
      const isPublic = req.body.isPublic ?? true;
      const updated = await FileService.toggleVisibility(id, isPublic);
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }
  },

  async deleteFile(req, res, next) {
    try {
      const id = req.params.id;
      await FileService.deleteFile(id);
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
