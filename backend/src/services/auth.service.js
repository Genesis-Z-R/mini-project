import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { signToken } from '../utils/jwt.js';

export const AuthService = {
  async login(email, password) {
    const emailKey = email.trim().toLowerCase();
    const profile = await prisma.profile.findUnique({
      where: { email: emailKey }
    });

    if (!profile || !profile.passwordHash) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, profile.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = signToken({ id: profile.id, email: profile.email });
    return {
      token,
      user: {
        email: profile.email,
        id: profile.id
      }
    };
  },

  async register(email, password) {
    const emailKey = email.trim().toLowerCase();
    const existing = await prisma.profile.findUnique({
      where: { email: emailKey }
    });

    if (existing && existing.passwordHash) {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let profile;
    if (existing) {
      profile = await prisma.profile.update({
        where: { email: emailKey },
        data: { passwordHash }
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          id: emailKey,
          email: emailKey,
          name: emailKey.split('@')[0],
          passwordHash
        }
      });
    }

    const token = signToken({ id: profile.id, email: profile.email });
    return {
      token,
      user: {
        email: profile.email,
        id: profile.id
      }
    };
  },

  async resetPassword(email) {
    const emailKey = email.trim().toLowerCase();
    const profile = await prisma.profile.findUnique({
      where: { email: emailKey }
    });

    if (!profile) {
      return { message: 'Password reset link sent to your email.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.profile.update({
      where: { email: emailKey },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    return {
      message: 'Password reset link sent to your email.',
      resetToken
    };
  },

  async confirmPasswordReset(token, newPassword) {
    const profile = await prisma.profile.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!profile) {
      const error = new Error('Failed to reset password. The token may be invalid or expired.');
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return { message: 'Password has been reset successfully.' };
  }
};
