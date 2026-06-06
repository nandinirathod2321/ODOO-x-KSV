import jwt from 'jsonwebtoken';

export const generateAccessToken = (payload: { id: string; email: string; role: string }): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any
  });
};
