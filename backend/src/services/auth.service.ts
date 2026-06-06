import { logActivity } from '../utils/logger.js';
import bcrypt from 'bcrypt';
import { AuthRepository } from '../repositories/auth.repository.js';
import prisma from '../config/prisma.js';
import { generateAccessToken } from '../utils/generateToken.js';
import { PERMISSIONS, ROLES } from '../constants/permissions.js';

export class AuthService {
  static async register(data: any) {
    const existing = await AuthRepository.findUserByEmail(data.email);
    if (existing) throw new Error('Email already in use');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role.toUpperCase()
        }
      });

      if (user.role === ROLES.VENDOR) {
        await tx.vendor.create({
          data: {
            userId: user.id,
            name: user.name,
            email: user.email,
            status: 'ACTIVE',
            rating: 0,
            portalEnabled: true
          }
        });
      }

      await logActivity({
          userId: user.id,
          eventType: 'user_registered',
          entityType: 'User',
          entityId: user.id,
          message: 'User registered successfully'
        });

      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to VendorBridge',
          message: 'Your account has been created successfully',
          type: 'SYSTEM'
        }
      });

      const token = generateAccessToken({ id: user.id, email: user.email, role: user.role });
      
      const { password, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    });
  }

  static async login(data: any) {
    const user = await AuthRepository.findUserByEmail(data.email);
    if (!user) throw new Error('Invalid credentials');
    if (!user.isActive) throw new Error('Account is inactive');

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) throw new Error('Invalid credentials');

    const token = generateAccessToken({ id: user.id, email: user.email, role: user.role });

    await logActivity({
        userId: user.id,
        eventType: 'user_login',
        entityType: 'User',
        entityId: user.id,
        message: 'User logged in'
      });

    if (user.role === ROLES.VENDOR) {
      await prisma.vendor.update({
        where: { userId: user.id },
        data: { lastLoginAt: new Date() }
      });
    }

    const { password, ...userWithoutPassword } = user;
    const permissions = PERMISSIONS[user.role as keyof typeof PERMISSIONS] || [];
    return { user: userWithoutPassword, permissions, token };
  }

  static async getProfile(userId: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new Error('User not found');

    const { password, ...userWithoutPassword } = user;
    let vendorData = null;

    if (user.role === ROLES.VENDOR) {
      vendorData = await prisma.vendor.findUnique({ where: { userId: user.id } });
    }

    const permissions = PERMISSIONS[user.role as keyof typeof PERMISSIONS] || [];
    return { ...userWithoutPassword, permissions, vendorProfile: vendorData };
  }

  static async forgotPassword(email: string) {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) return; // Silent return for security

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await AuthRepository.createPasswordResetOTP(user.id, otp, expiresAt);
    
    console.log(`[DEV] OTP for ${email}: ${otp}`);

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Password Reset OTP Generated',
        message: 'An OTP has been generated for your account reset.',
        type: 'SYSTEM'
      }
    });
  }

  static async resetPassword(data: any) {
    const otpRecord = await AuthRepository.verifyPasswordResetOTP(data.otp);
    if (!otpRecord) throw new Error('Invalid OTP');
    if (new Date() > otpRecord.expiresAt) throw new Error('OTP expired');

    const user = await AuthRepository.findUserById(otpRecord.userId);
    if (!user || user.email !== data.email) throw new Error('Invalid OTP or email');

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await AuthRepository.updatePassword(user.id, hashedPassword);
    await AuthRepository.deletePasswordResetOTP(otpRecord.id);

    await logActivity({
        userId: user.id,
        eventType: 'password_reset',
        entityType: 'User',
        entityId: user.id,
        message: 'Password reset successfully'
      });
  }
}
