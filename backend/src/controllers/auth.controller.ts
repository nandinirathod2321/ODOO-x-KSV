import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.register(req.body);
      res.status(201).json({ message: 'Registered successfully', data });
    } catch (e) {
      next(e);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.login(req.body);
      res.status(200).json({ message: 'Login successful', data });
    } catch (e) {
      next(e);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.getProfile(req.user!.id);
      res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.forgotPassword(req.body.email);
      res.status(200).json({ message: 'OTP sent if account exists' });
    } catch (e) {
      next(e);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.resetPassword(req.body);
      res.status(200).json({ message: 'Password reset successfully' });
    } catch (e) {
      next(e);
    }
  }
}
