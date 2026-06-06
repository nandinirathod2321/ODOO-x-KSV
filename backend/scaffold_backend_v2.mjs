import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

const dirs = [
  'controllers',
  'services',
  'repositories',
  'routes',
  'middlewares',
  'validators',
  'websocket',
  'utils',
  'types',
  'interfaces',
  'constants',
  'templates',
  'config'
];

dirs.forEach(d => fs.mkdirSync(path.join(srcDir, d), { recursive: true }));

const files = {
  'config/prisma.ts': `import { PrismaClient } from '@prisma/client';\n\nconst prisma = new PrismaClient();\nexport default prisma;\n`,
  
  // Controllers
  'controllers/rfq.controller.ts': `import { Request, Response } from 'express';\nimport { RFQService } from '../services/rfq.service';\n\nexport class RFQController {\n  static async create(req: Request, res: Response) {\n    try {\n      const result = await RFQService.create(req.body, req.user.id);\n      res.status(201).json({ message: 'RFQ created', data: result });\n    } catch (e: any) {\n      res.status(400).json({ message: e.message });\n    }\n  }\n}\n`,
  'controllers/quotation.controller.ts': `import { Request, Response } from 'express';\nimport { QuotationService } from '../services/quotation.service';\n\nexport class QuotationController {\n  static async submit(req: Request, res: Response) {\n    try {\n      const result = await QuotationService.submit(req.body, req.user.id);\n      res.status(201).json({ message: 'Quotation submitted', data: result });\n    } catch (e: any) {\n      res.status(400).json({ message: e.message });\n    }\n  }\n}\n`,
  'controllers/approval.controller.ts': `import { Request, Response } from 'express';\nimport { ApprovalService } from '../services/approval.service';\n\nexport class ApprovalController {\n  static async approve(req: Request, res: Response) {\n    try {\n      const result = await ApprovalService.approve(req.params.quotationId, req.user.id);\n      res.status(200).json({ message: 'Approved', data: result });\n    } catch (e: any) {\n      res.status(400).json({ message: e.message });\n    }\n  }\n}\n`,
  'controllers/po.controller.ts': `import { Request, Response } from 'express';\nimport { POService } from '../services/po.service';\n\nexport class POController {\n  static async getPOs(req: Request, res: Response) {\n    try {\n      const result = await POService.getAll();\n      res.status(200).json({ data: result });\n    } catch (e: any) {\n      res.status(400).json({ message: e.message });\n    }\n  }\n}\n`,
  'controllers/invoice.controller.ts': `import { Request, Response } from 'express';\nimport { InvoiceService } from '../services/invoice.service';\n\nexport class InvoiceController {\n  static async getInvoices(req: Request, res: Response) {\n    try {\n      const result = await InvoiceService.getAll();\n      res.status(200).json({ data: result });\n    } catch (e: any) {\n      res.status(400).json({ message: e.message });\n    }\n  }\n}\n`,
  'controllers/dashboard.controller.ts': `import { Request, Response } from 'express';\nimport { DashboardService } from '../services/dashboard.service';\n\nexport class DashboardController {\n  static async getAdminDashboard(req: Request, res: Response) {\n    try {\n      const result = await DashboardService.getAdminStats();\n      res.status(200).json({ data: result });\n    } catch (e: any) {\n      res.status(400).json({ message: e.message });\n    }\n  }\n}\n`,
  'controllers/notification.controller.ts': `import { Request, Response } from 'express';\nimport { NotificationService } from '../services/notification.service';\n\nexport class NotificationController {\n  static async getNotifications(req: Request, res: Response) {\n    try {\n      const result = await NotificationService.getForUser(req.user.id);\n      res.status(200).json({ data: result });\n    } catch (e: any) {\n      res.status(400).json({ message: e.message });\n    }\n  }\n}\n`,

  // Services
  'services/rfq.service.ts': `import { RFQRepository } from '../repositories/rfq.repository';\n\nexport class RFQService {\n  static async create(data: any, userId: string) {\n    // Business logic\n    return await RFQRepository.create({ ...data, createdBy: userId });\n  }\n}\n`,
  'services/quotation.service.ts': `import { QuotationRepository } from '../repositories/quotation.repository';\n\nexport class QuotationService {\n  static async submit(data: any, vendorUserId: string) {\n    return await QuotationRepository.create({ ...data, vendorId: vendorUserId });\n  }\n}\n`,
  'services/approval.service.ts': `import { ApprovalRepository } from '../repositories/approval.repository';\n\nexport class ApprovalService {\n  static async approve(quotationId: string, approverId: string) {\n    return await ApprovalRepository.updateStatus(quotationId, 'APPROVED', approverId);\n  }\n}\n`,
  'services/po.service.ts': `import { PORepository } from '../repositories/po.repository';\n\nexport class POService {\n  static async getAll() {\n    return await PORepository.findAll();\n  }\n}\n`,
  'services/invoice.service.ts': `import { InvoiceRepository } from '../repositories/invoice.repository';\n\nexport class InvoiceService {\n  static async getAll() {\n    return await InvoiceRepository.findAll();\n  }\n}\n`,
  'services/dashboard.service.ts': `import prisma from '../config/prisma';\n\nexport class DashboardService {\n  static async getAdminStats() {\n    const vendors = await prisma.vendor.count();\n    const rfqs = await prisma.rFQ.count({ where: { status: 'PUBLISHED' } });\n    return { totalVendors: vendors, activeRFQs: rfqs };\n  }\n}\n`,
  'services/notification.service.ts': `import prisma from '../config/prisma';\n\nexport class NotificationService {\n  static async getForUser(userId: string) {\n    return await prisma.notification.findMany({ where: { userId } });\n  }\n}\n`,
  'services/pdf.service.ts': `import puppeteer from 'puppeteer';\n\nexport class PDFService {\n  static async generatePDF(htmlContent: string) {\n    const browser = await puppeteer.launch({ headless: true });\n    const page = await browser.newPage();\n    await page.setContent(htmlContent);\n    const pdfBuffer = await page.pdf({ format: 'A4' });\n    await browser.close();\n    return pdfBuffer;\n  }\n}\n`,

  // Repositories
  'repositories/rfq.repository.ts': `import prisma from '../config/prisma';\n\nexport class RFQRepository {\n  static async create(data: any) {\n    return await prisma.rFQ.create({ data });\n  }\n}\n`,
  'repositories/quotation.repository.ts': `import prisma from '../config/prisma';\n\nexport class QuotationRepository {\n  static async create(data: any) {\n    return await prisma.quotation.create({ data });\n  }\n}\n`,
  'repositories/approval.repository.ts': `import prisma from '../config/prisma';\n\nexport class ApprovalRepository {\n  static async updateStatus(quotationId: string, status: string, approverId: string) {\n    // Dummy logic\n    return { quotationId, status, approverId };\n  }\n}\n`,
  'repositories/po.repository.ts': `import prisma from '../config/prisma';\n\nexport class PORepository {\n  static async findAll() {\n    return await prisma.purchaseOrder.findMany();\n  }\n}\n`,
  'repositories/invoice.repository.ts': `import prisma from '../config/prisma';\n\nexport class InvoiceRepository {\n  static async findAll() {\n    return await prisma.invoice.findMany();\n  }\n}\n`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(srcDir, filepath), content);
}

// Write the massive Seed script
const seedScript = `import { PrismaClient } from '@prisma/client';\nimport bcrypt from 'bcrypt';\n\nconst prisma = new PrismaClient();\n\nasync function main() {\n  const hashed = await bcrypt.hash('password123', 10);\n  \n  const admin = await prisma.user.upsert({\n    where: { email: 'admin@vendorbridge.com' },\n    update: {},\n    create: {\n      name: 'Admin User',\n      email: 'admin@vendorbridge.com',\n      password: hashed,\n      role: 'ADMIN'\n    }\n  });\n  \n  console.log('Seeded admin:', admin.email);\n}\n\nmain().catch(console.error).finally(() => prisma.$disconnect());\n`;
fs.writeFileSync(path.join(process.cwd(), 'prisma', 'seed.ts'), seedScript);

console.log('Backend TS modules generated.');
