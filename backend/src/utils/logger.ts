import prisma from '../config/prisma.js';

interface LogActivityParams {
  userId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  message: string;
  meta?: any;
}

export const logActivity = async ({ userId, eventType, entityType, entityId, message, meta }: LogActivityParams) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        eventType,
        entityType,
        entityId,
        message,
        // Since meta isn't explicitly in the Prisma schema provided earlier, we'll omit it or log it to console if unsupported.
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
