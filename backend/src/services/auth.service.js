import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { signToken } from '../utils/jwt.js';

export const AuthService = {
  async login(email, password) {
    const emailKey = email.trim().toLowerCase();
    let profile = await prisma.profile.findUnique({
      where: { email: emailKey }
    });

    if (!profile) {
      // Auto-create profile if user doesn't exist yet (matching Spring Boot / frontend behavior)
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      profile = await prisma.profile.create({
        data: {
          id: emailKey,
          email: emailKey,
          name: emailKey.split('@')[0],
          passwordHash
        }
      });
    } else if (profile.passwordHash) {
      const isMatch = await bcrypt.compare(password, profile.passwordHash);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }
    } else {
      // If user profile exists without passwordHash (e.g. seeded), set password hash on first login
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      await prisma.profile.update({
        where: { email: emailKey },
        data: { passwordHash }
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

  async register(email, password) {
    const emailKey = email.trim().toLowerCase();
    const existing = await prisma.profile.findUnique({
      where: { email: emailKey }
    });

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
      // Return success message even if email not found (security best practice against user enumeration)
      return { message: 'Password reset link sent to your email.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.profile.update({
      where: { email: emailKey },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    return {
      message: 'Password reset link sent to your email.',
      resetToken // Returned for convenience in dev/testing
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
      throw new Error('Failed to reset password. The token may be invalid or expired.');
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
