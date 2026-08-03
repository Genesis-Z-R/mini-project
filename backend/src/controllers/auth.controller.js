import { AuthService } from '../services/auth.service.js';

export const AuthController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(401).json({ success: false, message: err.message });
    }
  },

  async register(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.register(email, password);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async logout(req, res) {
    return res.status(204).build ? res.status(204).build() : res.status(204).send();
  },

  async resetPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.resetPassword(email);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async confirmPasswordReset(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await AuthService.confirmPasswordReset(token, newPassword);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};
