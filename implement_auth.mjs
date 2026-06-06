import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

// 1. Append to schema.prisma
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

if (!schemaContent.includes('model PasswordResetOTP')) {
  schemaContent += `\nmodel PasswordResetOTP {
  id        String   @id @default(uuid())
  userId    String
  otp       String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}\n`;

  // Also need to add PasswordResetOTP relation to User model
  schemaContent = schemaContent.replace(
    'Notifications Notification[]',
    'Notifications Notification[]\n  PasswordResetOTPs PasswordResetOTP[]'
  );

  fs.writeFileSync(schemaPath, schemaContent);
  console.log('Appended PasswordResetOTP to schema.prisma');
}

// Ensure directories exist
const dirs = [
  'controllers', 'routes', 'services', 'repositories', 'validators', 'utils', 'types', 'middlewares', 'constants'
];
dirs.forEach(d => fs.mkdirSync(path.join(srcDir, d), { recursive: true }));

// 2. Generate Files
const files = {
  'constants/permissions.ts': `export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  PROCUREMENT_OFFICER: 'PROCUREMENT_OFFICER',
  VENDOR: 'VENDOR'
};

export const PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],
  [ROLES.MANAGER]: [
    'view_dashboard',
    'view_vendors',
    'view_rfqs',
    'view_quotations',
    'approve_request',
    'reject_request',
    'view_pos',
    'view_invoices',
    'view_reports',
    'view_activity_logs'
  ],
  [ROLES.PROCUREMENT_OFFICER]: [
    'view_dashboard',
    'create_rfq',
    'update_rfq',
    'publish_rfq',
    'close_rfq',
    'view_vendors',
    'manage_vendors',
    'view_quotations',
    'compare_quotations',
    'select_winner',
    'create_po',
    'generate_invoice',
    'send_invoice_email'
  ],
  [ROLES.VENDOR]: [
    'view_rfqs',
    'submit_quotation',
    'update_quotation',
    'view_own_pos',
    'view_own_invoices'
  ]
};
`,
  'types/auth.types.ts': `import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
`,
  'utils/generateToken.ts': `import jwt from 'jsonwebtoken';

export const generateAccessToken = (payload: { id: string; email: string; role: string }): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};
`,
  'utils/numberGenerator.ts': `import prisma from '../config/prisma';

async function generateNextSequence(prefix: string, model: 'rFQ' | 'quotation' | 'purchaseOrder' | 'invoice', field: string): Promise<string> {
  const year = new Date().getFullYear();
  const fullPrefix = \`\${prefix}-\${year}-\`;

  const lastRecord = await (prisma[model] as any).findFirst({
    where: { [field]: { startsWith: fullPrefix } },
    orderBy: { [field]: 'desc' }
  });

  if (!lastRecord) {
    return \`\${fullPrefix}001\`;
  }

  const lastNumber = parseInt(lastRecord[field].split('-').pop() || '0', 10);
  const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
  
  return \`\${fullPrefix}\${nextNumber}\`;
}

export const generateRFQNumber = () => generateNextSequence('RFQ', 'rFQ', 'rfqNumber');
export const generateQuotationNumber = () => generateNextSequence('QT', 'quotation', 'quotationNumber');
export const generatePONumber = () => generateNextSequence('PO', 'purchaseOrder', 'poNumber');
export const generateInvoiceNumber = () => generateNextSequence('INV', 'invoice', 'invoiceNumber');
`,
  'middlewares/auth.middleware.ts': `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
`,
  'middlewares/role.middleware.ts': `import { Request, Response, NextFunction } from 'express';

export const roleGuard = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
};
`,
  'middlewares/error.middleware.ts': `import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.errors
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({
      message: 'Database error',
      errors: [err.message]
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      message: 'Invalid database payload',
      errors: [err.message]
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token', errors: [] });
  }

  return res.status(500).json({
    message: err.message || 'Internal server error',
    errors: []
  });
};
`,
  'validators/auth.validator.ts': `import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(6)
});
`,
  'repositories/auth.repository.ts': `import prisma from '../config/prisma';

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
`,
  'services/auth.service.ts': `import bcrypt from 'bcrypt';
import { AuthRepository } from '../repositories/auth.repository';
import prisma from '../config/prisma';
import { generateAccessToken } from '../utils/generateToken';
import { PERMISSIONS, ROLES } from '../constants/permissions';

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

      await tx.activityLog.create({
        data: {
          userId: user.id,
          eventType: 'user_registered',
          entityType: 'User',
          entityId: user.id,
          message: 'User registered successfully'
        }
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

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        eventType: 'user_login',
        entityType: 'User',
        entityId: user.id,
        message: 'User logged in'
      }
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
    
    console.log(\`[DEV] OTP for \${email}: \${otp}\`);

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

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        eventType: 'password_reset',
        entityType: 'User',
        entityId: user.id,
        message: 'Password reset successfully'
      }
    });
  }
}
`,
  'controllers/auth.controller.ts': `import { Request, Response, NextFunction } from 'express';
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
`,
  'routes/auth.routes.ts': `import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authMiddleware, AuthController.getProfile);

export default router;
`,
  'server.ts': `import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes';
import { globalErrorHandler } from './middlewares/error.middleware';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(srcDir, filepath), content);
}

console.log('Auth module and utilities successfully scaffolded.');
