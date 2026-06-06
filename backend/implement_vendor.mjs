import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

const files = {
  // Validators
  'validators/vendor.validator.ts': `import { z } from 'zod';

export const vendorCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  gstNumber: z.string().max(20).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  categoryId: z.string().uuid().optional()
});

export const vendorUpdateSchema = vendorCreateSchema.partial();

export const vendorQuerySchema = z.object({
  page: z.string().regex(/^\\d+$/).optional(),
  perPage: z.string().regex(/^\\d+$/).optional(),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'rating', 'status']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional()
});
`,

  // Repositories
  'repositories/lookup.repository.ts': `import prisma from '../config/prisma.js';

export class LookupRepository {
  static async getVendorCategories() {
    return prisma.vendorCategory.findMany();
  }

  static async getActivityEventTypes() {
    const events = await prisma.activityLog.findMany({
      distinct: ['eventType'],
      select: { eventType: true }
    });
    return events.map(e => e.eventType);
  }
}
`,
  'repositories/vendor.repository.ts': `import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export class VendorRepository {
  static async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.VendorWhereInput;
    orderBy: Prisma.VendorOrderByWithRelationInput;
  }) {
    return prisma.$transaction([
      prisma.vendor.count({ where: params.where }),
      prisma.vendor.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: { category: true }
      })
    ]);
  }

  static async findById(id: string) {
    return prisma.vendor.findUnique({
      where: { id },
      include: { category: true, user: { select: { id: true, name: true, email: true, role: true, isActive: true } } }
    });
  }

  static async create(data: Prisma.VendorCreateInput) {
    return prisma.vendor.create({ data, include: { category: true } });
  }

  static async update(id: string, data: Prisma.VendorUpdateInput) {
    return prisma.vendor.update({ where: { id }, data });
  }

  static async getPerformanceMetrics(vendorId: string) {
    const totalRfqsInvited = await prisma.rFQVendor.count({ where: { vendorId } });
    const totalQuotationsSubmitted = await prisma.quotation.count({ where: { vendorId } });
    const totalPosReceived = await prisma.purchaseOrder.count({ where: { vendorId } });
    const totalInvoices = await prisma.invoice.count({ where: { vendorId } });
    
    const selectedQuotations = await prisma.quotation.count({ where: { vendorId, isWinner: true } });
    
    const winRate = totalQuotationsSubmitted > 0 ? (selectedQuotations / totalQuotationsSubmitted) * 100 : 0;

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { rating: true, averageResponseTimeHours: true } });

    return {
      totalRfqsInvited,
      totalQuotationsSubmitted,
      totalPosReceived,
      totalInvoices,
      averageDeliveryDays: 0, // Requires more complex query across quotation items or deliveryDays fields
      winRate,
      rating: vendor?.rating || 0
    };
  }

  static async findVendorRfqs(vendorId: string, skip: number, take: number) {
    return prisma.rFQVendor.findMany({
      where: { vendorId },
      include: { rfq: true },
      skip, take, orderBy: { invitedAt: 'desc' }
    });
  }

  static async findVendorQuotations(vendorId: string, skip: number, take: number) {
    return prisma.quotation.findMany({
      where: { vendorId },
      include: { rfq: { select: { title: true } } },
      skip, take, orderBy: { submittedAt: 'desc' }
    });
  }

  static async findVendorPos(vendorId: string, skip: number, take: number) {
    return prisma.purchaseOrder.findMany({
      where: { vendorId },
      skip, take, orderBy: { createdAt: 'desc' }
    });
  }
}
`,
  'repositories/my.repository.ts': `import prisma from '../config/prisma.js';

export class MyRepository {
  static async getVendorIdByUserId(userId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    return vendor?.id;
  }

  static async getRfqs(vendorId: string) {
    return prisma.rFQVendor.findMany({
      where: { vendorId },
      include: { rfq: { include: { _count: { select: { items: true } } } } },
      orderBy: { invitedAt: 'desc' }
    });
  }

  static async getQuotations(vendorId: string) {
    return prisma.quotation.findMany({
      where: { vendorId },
      include: { rfq: { select: { title: true } } },
      orderBy: { submittedAt: 'desc' }
    });
  }

  static async getPurchaseOrders(vendorId: string) {
    return prisma.purchaseOrder.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getInvoices(vendorId: string) {
    return prisma.invoice.findMany({
      where: { vendorId },
      orderBy: { invoiceDate: 'desc' }
    });
  }
}
`,

  // Services
  'services/lookup.service.ts': `import { LookupRepository } from '../repositories/lookup.repository.js';

export class LookupService {
  static async getVendorCategories() {
    return await LookupRepository.getVendorCategories();
  }

  static getVendorStatuses() {
    return [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'blacklisted', label: 'Blacklisted' }
    ];
  }

  static getRfqStatuses() {
    return [
      { value: 'DRAFT' },
      { value: 'PUBLISHED' },
      { value: 'QUOTATION_RECEIVED' },
      { value: 'AWARDED' },
      { value: 'CLOSED' },
      { value: 'CANCELLED' }
    ];
  }

  static getQuotationStatuses() {
    return [
      { value: 'DRAFT' },
      { value: 'SUBMITTED' },
      { value: 'SELECTED' },
      { value: 'REJECTED' }
    ];
  }

  static getPoStatuses() {
    return [
      { value: 'ACTIVE' },
      { value: 'CLOSED' },
      { value: 'CANCELLED' }
    ];
  }

  static getInvoiceStatuses() {
    return [
      { value: 'DRAFT' },
      { value: 'SENT' },
      { value: 'PAID' },
      { value: 'OVERDUE' }
    ];
  }

  static getRoles() {
    return [
      { value: 'ADMIN' },
      { value: 'MANAGER' },
      { value: 'PROCUREMENT_OFFICER' },
      { value: 'VENDOR' }
    ];
  }

  static getUnits() {
    return [
      { value: 'pcs' },
      { value: 'kg' },
      { value: 'litre' },
      { value: 'box' },
      { value: 'set' },
      { value: 'metre' },
      { value: 'hour' }
    ];
  }

  static async getActivityEventTypes() {
    return await LookupRepository.getActivityEventTypes();
  }
}
`,
  'services/vendor.service.ts': `import { VendorRepository } from '../repositories/vendor.repository.js';
import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export class VendorService {
  static async getAll(query: any) {
    const page = parseInt(query.page || '1');
    const perPage = parseInt(query.perPage || '10');
    const skip = (page - 1) * perPage;

    const where: Prisma.VendorWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { gstNumber: { contains: query.search } }
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy) {
      orderBy = { [query.sortBy]: query.sortDir === 'asc' ? 'asc' : 'desc' };
    }

    const [total, data] = await VendorRepository.findMany({ skip, take: perPage, where, orderBy });
    
    return {
      data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage)
      }
    };
  }

  static async getById(id: string) {
    const vendor = await VendorRepository.findById(id);
    if (!vendor) throw new Error('Vendor not found');
    return vendor;
  }

  static async create(data: any, adminId: string) {
    // Generate placeholder user if email doesn't exist
    const vendorUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email || \`vendor-\${Date.now()}@example.com\`,
        password: 'ChangeMe123!',
        role: 'VENDOR'
      }
    });

    const vendor = await VendorRepository.create({
      ...data,
      user: { connect: { id: vendorUser.id } },
      ...(data.categoryId ? { category: { connect: { id: data.categoryId } } } : {})
    });

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        eventType: 'vendor_created',
        entityType: 'Vendor',
        entityId: vendor.id,
        message: \`Vendor \${vendor.name} was registered\`
      }
    });

    await prisma.notification.create({
      data: {
        userId: vendorUser.id,
        title: 'Vendor Account Created',
        message: 'Your vendor account has been created.',
        type: 'vendor_created'
      }
    });

    return vendor;
  }

  static async update(id: string, data: any, adminId: string) {
    const vendor = await VendorRepository.update(id, data);
    
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        eventType: 'vendor_updated',
        entityType: 'Vendor',
        entityId: vendor.id,
        message: \`Vendor \${vendor.name} was updated\`
      }
    });
    
    return vendor;
  }

  static async delete(id: string, adminId: string) {
    const vendor = await VendorRepository.findById(id);
    if (!vendor) throw new Error('Vendor not found');

    await VendorRepository.update(id, { status: 'INACTIVE' });
    if (vendor.user) {
      await prisma.user.update({ where: { id: vendor.userId }, data: { isActive: false } });
    }

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        eventType: 'vendor_deactivated',
        entityType: 'Vendor',
        entityId: vendor.id,
        message: \`Vendor \${vendor.name} was deactivated\`
      }
    });
  }

  static async getPerformance(id: string) {
    return await VendorRepository.getPerformanceMetrics(id);
  }

  static async getRfqs(id: string, page: number, perPage: number) {
    return await VendorRepository.findVendorRfqs(id, (page - 1) * perPage, perPage);
  }

  static async getQuotations(id: string, page: number, perPage: number) {
    return await VendorRepository.findVendorQuotations(id, (page - 1) * perPage, perPage);
  }

  static async getPos(id: string, page: number, perPage: number) {
    return await VendorRepository.findVendorPos(id, (page - 1) * perPage, perPage);
  }
}
`,
  'services/my.service.ts': `import { MyRepository } from '../repositories/my.repository.js';

export class MyService {
  static async getRfqs(userId: string) {
    const vendorId = await MyRepository.getVendorIdByUserId(userId);
    if (!vendorId) throw new Error('Vendor profile not found');
    return await MyRepository.getRfqs(vendorId);
  }

  static async getQuotations(userId: string) {
    const vendorId = await MyRepository.getVendorIdByUserId(userId);
    if (!vendorId) throw new Error('Vendor profile not found');
    return await MyRepository.getQuotations(vendorId);
  }

  static async getPurchaseOrders(userId: string) {
    const vendorId = await MyRepository.getVendorIdByUserId(userId);
    if (!vendorId) throw new Error('Vendor profile not found');
    return await MyRepository.getPurchaseOrders(vendorId);
  }

  static async getInvoices(userId: string) {
    const vendorId = await MyRepository.getVendorIdByUserId(userId);
    if (!vendorId) throw new Error('Vendor profile not found');
    return await MyRepository.getInvoices(vendorId);
  }
}
`,

  // Controllers
  'controllers/lookup.controller.ts': `import { Request, Response, NextFunction } from 'express';
import { LookupService } from '../services/lookup.service.js';

export class LookupController {
  static async getVendorCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await LookupService.getVendorCategories();
      res.json({ data });
    } catch (e) { next(e); }
  }

  static getVendorStatuses(req: Request, res: Response) { res.json(LookupService.getVendorStatuses()); }
  static getRfqStatuses(req: Request, res: Response) { res.json(LookupService.getRfqStatuses()); }
  static getQuotationStatuses(req: Request, res: Response) { res.json(LookupService.getQuotationStatuses()); }
  static getPoStatuses(req: Request, res: Response) { res.json(LookupService.getPoStatuses()); }
  static getInvoiceStatuses(req: Request, res: Response) { res.json(LookupService.getInvoiceStatuses()); }
  static getRoles(req: Request, res: Response) { res.json(LookupService.getRoles()); }
  static getUnits(req: Request, res: Response) { res.json(LookupService.getUnits()); }

  static async getActivityEventTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await LookupService.getActivityEventTypes();
      res.json(data);
    } catch (e) { next(e); }
  }
}
`,
  'controllers/vendor.controller.ts': `import { Request, Response, NextFunction } from 'express';
import { VendorService } from '../services/vendor.service.js';
import { vendorCreateSchema, vendorUpdateSchema, vendorQuerySchema } from '../validators/vendor.validator.js';

export class VendorController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = vendorQuerySchema.parse(req.query);
      const result = await VendorService.getAll(query);
      res.json(result);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getById(req.params.id);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = vendorCreateSchema.parse(req.body);
      const vendor = await VendorService.create(data, req.user!.id);
      res.status(201).json({ message: 'Vendor created', data: vendor });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = vendorUpdateSchema.parse(req.body);
      const vendor = await VendorService.update(req.params.id, data, req.user!.id);
      res.json({ message: 'Vendor updated', data: vendor });
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await VendorService.delete(req.params.id, req.user!.id);
      res.json({ message: 'Vendor deactivated' });
    } catch (e) { next(e); }
  }

  static async getPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getPerformance(req.params.id);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getRfqs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getRfqs(req.params.id, parseInt(req.query.page as string || '1'), parseInt(req.query.perPage as string || '10'));
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getQuotations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getQuotations(req.params.id, parseInt(req.query.page as string || '1'), parseInt(req.query.perPage as string || '10'));
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getPos(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getPos(req.params.id, parseInt(req.query.page as string || '1'), parseInt(req.query.perPage as string || '10'));
      res.json({ data });
    } catch (e) { next(e); }
  }
}
`,
  'controllers/my.controller.ts': `import { Request, Response, NextFunction } from 'express';
import { MyService } from '../services/my.service.js';

export class MyController {
  static async getRfqs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getRfqs(req.user!.id);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getQuotations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getQuotations(req.user!.id);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getPurchaseOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getPurchaseOrders(req.user!.id);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getInvoices(req.user!.id);
      res.json({ data });
    } catch (e) { next(e); }
  }
}
`,

  // Routes
  'routes/lookup.routes.ts': `import { Router } from 'express';
import { LookupController } from '../controllers/lookup.controller.js';

const router = Router();

router.get('/vendor-categories', LookupController.getVendorCategories);
router.get('/vendor-statuses', LookupController.getVendorStatuses);
router.get('/rfq-statuses', LookupController.getRfqStatuses);
router.get('/quotation-statuses', LookupController.getQuotationStatuses);
router.get('/po-statuses', LookupController.getPoStatuses);
router.get('/invoice-statuses', LookupController.getInvoiceStatuses);
router.get('/roles', LookupController.getRoles);
router.get('/units', LookupController.getUnits);
router.get('/activity-event-types', LookupController.getActivityEventTypes);

export default router;
`,
  'routes/vendor.routes.ts': `import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/permissions.js';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getAll);
router.post('/', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), VendorController.create);

router.get('/:id', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getById);
router.patch('/:id', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), VendorController.update);
router.delete('/:id', roleGuard(ROLES.ADMIN), VendorController.delete);

router.get('/:id/performance', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getPerformance);
router.get('/:id/rfqs', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getRfqs);
router.get('/:id/quotations', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getQuotations);
router.get('/:id/purchase-orders', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getPos);

export default router;
`,
  'routes/my.routes.ts': `import { Router } from 'express';
import { MyController } from '../controllers/my.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/permissions.js';

const router = Router();

router.use(authMiddleware);
router.use(roleGuard(ROLES.VENDOR));

router.get('/rfqs', MyController.getRfqs);
router.get('/quotations', MyController.getQuotations);
router.get('/purchase-orders', MyController.getPurchaseOrders);
router.get('/invoices', MyController.getInvoices);

export default router;
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(srcDir, filepath), content);
}

// 3. Register Routes in Server
const serverPath = path.join(srcDir, 'server.ts');
let serverContent = fs.readFileSync(serverPath, 'utf8');

if (!serverContent.includes('vendorRoutes')) {
  const imports = `import authRoutes from './routes/auth.routes.js';\nimport vendorRoutes from './routes/vendor.routes.js';\nimport lookupRoutes from './routes/lookup.routes.js';\nimport myRoutes from './routes/my.routes.js';\n`;
  serverContent = serverContent.replace(/import authRoutes.*/, imports);
  
  const middlewareReg = `app.use('/api/auth', authRoutes);\napp.use('/api/vendors', vendorRoutes);\napp.use('/api/lookups', lookupRoutes);\napp.use('/api/my', myRoutes);\n`;
  serverContent = serverContent.replace("app.use('/api/auth', authRoutes);", middlewareReg);
  
  fs.writeFileSync(serverPath, serverContent);
}

console.log('Vendor, Lookup, and My modules scaffolded.');
