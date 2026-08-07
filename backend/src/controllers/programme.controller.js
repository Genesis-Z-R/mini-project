import { ProgrammeService } from '../services/programme.service.js';

export const ProgrammeController = {
  async getProgrammes(req, res) {
    try {
      const programmes = await ProgrammeService.getAllProgrammes();
      return res.status(200).json(programmes);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createProgramme(req, res) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Programme name is required.' });
      }
      const programme = await ProgrammeService.getOrCreateProgramme(name);
      return res.status(200).json(programme);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};
