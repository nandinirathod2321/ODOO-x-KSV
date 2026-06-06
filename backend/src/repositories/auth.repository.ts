import prisma from '../config/prisma.js';

export class AuthRepository {
  static async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  static async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async createUser(data: any) {
    return prisma.user.create({ data });
  }

  static async updatePassword(id: string, hash: string) {
    return prisma.user.update({ where: { id }, data: { password: hash } });
  }

  static async createPasswordResetOTP(userId: string, otp: string, expiresAt: Date) {
    return prisma.passwordResetOTP.create({ data: { userId, otp, expiresAt } });
  }

  static async verifyPasswordResetOTP(otp: string) {
    return prisma.passwordResetOTP.findFirst({ where: { otp } });
  }

  static async deletePasswordResetOTP(id: string) {
    return prisma.passwordResetOTP.delete({ where: { id } });
  }
}
