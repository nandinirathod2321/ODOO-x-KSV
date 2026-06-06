import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

const files = {
  // Validators
  'validators/invoice.validator.ts': `import { z } from 'zod';

export const generateInvoiceSchema = z.object({
  purchaseOrderId: z.string().uuid()
});

export const markPaidSchema = z.object({});

export const sendInvoiceEmailSchema = z.object({
  toEmail: z.string().email(),
  ccEmail: z.string().email().optional(),
  subject: z.string().min(1),
  body: z.string().optional()
});
`,

  // Utilities
  'utils/formatCurrency.ts': `export const formatIndianCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};
`,
  'utils/invoiceHtmlTemplate.ts': `import { formatIndianCurrency } from './formatCurrency.js';

export const buildInvoiceHTML = (invoiceData: any, companyData: any) => {
  return \`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .company-details { font-size: 14px; }
    .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #34495e; text-align: right; }
    .meta-table { width: 100%; margin-bottom: 30px; }
    .meta-table td { padding: 5px; font-size: 14px; }
    .bill-to { margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
    .bill-to h3 { margin-top: 0; color: #2c3e50; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
    .items-table th { background-color: #f4f6f7; color: #2c3e50; }
    .items-table .text-right { text-align: right; }
    .summary-table { width: 50%; float: right; border-collapse: collapse; margin-bottom: 40px; }
    .summary-table td { padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 14px; }
    .summary-table .bold { font-weight: bold; font-size: 16px; color: #2c3e50; }
    .bank-details { clear: both; margin-top: 40px; font-size: 12px; color: #555; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 20px; }
    .signatory { float: right; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-details">
      <div class="company-name">\${companyData.name || 'VendorBridge Inc.'}</div>
      <div>\${companyData.address || '123 Business Road, Tech Park'}</div>
      <div>GSTIN: \${companyData.gstin || '27AADCB2230M1Z2'}</div>
      <div>Phone: \${companyData.phone || '+91 9876543210'} | Email: \${companyData.email || 'billing@vendorbridge.com'}</div>
    </div>
    <div>
      <div class="invoice-title">INVOICE</div>
    </div>
  </div>

  <table class="meta-table">
    <tr>
      <td width="50%">
        <strong>Invoice Number:</strong> \${invoiceData.invoiceNumber}<br>
        <strong>Purchase Order:</strong> \${invoiceData.purchaseOrder?.poNumber || 'N/A'}<br>
      </td>
      <td width="50%" style="text-align: right;">
        <strong>Invoice Date:</strong> \${new Date(invoiceData.invoiceDate).toLocaleDateString()}<br>
        <strong>Due Date:</strong> \${new Date(invoiceData.dueDate).toLocaleDateString()}<br>
      </td>
    </tr>
  </table>

  <div class="bill-to">
    <h3>Bill To:</h3>
    <strong>\${invoiceData.vendor.name}</strong><br>
    \${invoiceData.vendor.address || 'N/A'}<br>
    GSTIN: \${invoiceData.vendor.gstNumber || 'N/A'}<br>
    Attn: \${invoiceData.vendor.contactPerson || 'N/A'}
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th>Unit</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Tax %</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      \${invoiceData.items.map((item: any, i: number) => \`
        <tr>
          <td>\${i + 1}</td>
          <td>\${item.description}</td>
          <td class="text-right">\${item.quantity}</td>
          <td>\${item.unit}</td>
          <td class="text-right">\${formatIndianCurrency(item.unitPrice)}</td>
          <td class="text-right">\${item.taxPercent}%</td>
          <td class="text-right">\${formatIndianCurrency(item.lineTotal)}</td>
        </tr>
      \`).join('')}
    </tbody>
  </table>

  <table class="summary-table">
    <tr>
      <td>Subtotal:</td>
      <td class="bold">\${formatIndianCurrency(invoiceData.subtotal)}</td>
    </tr>
    \${invoiceData.igstAmount > 0 ? \`
    <tr>
      <td>IGST:</td>
      <td>\${formatIndianCurrency(invoiceData.igstAmount)}</td>
    </tr>\` : \`
    <tr>
      <td>CGST:</td>
      <td>\${formatIndianCurrency(invoiceData.cgstAmount)}</td>
    </tr>
    <tr>
      <td>SGST:</td>
      <td>\${formatIndianCurrency(invoiceData.sgstAmount)}</td>
    </tr>\`}
    <tr>
      <td class="bold">Grand Total:</td>
      <td class="bold">\${formatIndianCurrency(invoiceData.grandTotal)}</td>
    </tr>
  </table>

  <div class="bank-details">
    <h3>Bank Details</h3>
    Bank Name: \${companyData.bankName || 'HDFC Bank'}<br>
    Account Number: \${companyData.accountNumber || '0000123456789'}<br>
    IFSC: \${companyData.ifsc || 'HDFC0001234'}
  </div>

  <div class="signatory">
    <br><br>
    _______________________<br>
    Authorized Signatory
  </div>

  <div class="footer">
    This is a computer generated invoice and does not require a physical signature.
  </div>
</body>
</html>\`;
};

export const buildPurchaseOrderHTML = (poData: any, companyData: any) => {
  return \`<!DOCTYPE html><html><body><h2>Purchase Order \${poData.poNumber}</h2></body></html>\`;
};
`,

  // Services
  'services/pdf.service.ts': `import puppeteer from 'puppeteer';
import { buildInvoiceHTML, buildPurchaseOrderHTML } from '../utils/invoiceHtmlTemplate.js';

export class PDFService {
  static async generatePDF(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  static async generateInvoicePDF(invoiceData: any, companyData: any): Promise<Buffer> {
    const html = buildInvoiceHTML(invoiceData, companyData);
    return this.generatePDF(html);
  }

  static async generatePurchaseOrderPDF(poData: any, companyData: any): Promise<Buffer> {
    const html = buildPurchaseOrderHTML(poData, companyData);
    return this.generatePDF(html);
  }
}
`,
  'services/email.service.ts': `import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

export class EmailService {
  static async sendInvoiceEmail(to: string, cc: string | undefined, subject: string, html: string, pdfBuffer: Buffer, filename: string) {
    return transporter.sendMail({
      from: '"VendorBridge Billing" <billing@vendorbridge.com>',
      to,
      cc,
      subject,
      html,
      attachments: [{ filename, content: pdfBuffer }]
    });
  }

  static async sendPasswordResetEmail(to: string, otp: string) {
    return transporter.sendMail({
      from: '"VendorBridge Support" <support@vendorbridge.com>',
      to,
      subject: 'Password Reset OTP',
      html: \`<h2>Your Password Reset OTP</h2><p>Your OTP is: <strong>\${otp}</strong>. It expires in 10 minutes.</p>\`
    });
  }

  static async sendPurchaseOrderEmail(to: string, subject: string, html: string, pdfBuffer: Buffer, filename: string) {
    return transporter.sendMail({
      from: '"VendorBridge Procurement" <procurement@vendorbridge.com>',
      to,
      subject,
      html,
      attachments: [{ filename, content: pdfBuffer }]
    });
  }
}
`,

  // Repositories
  'repositories/invoice.repository.ts': `import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export class InvoiceRepository {
  static async findMany(params: { skip: number; take: number; where: Prisma.InvoiceWhereInput; orderBy: Prisma.InvoiceOrderByWithRelationInput }) {
    return prisma.$transaction([
      prisma.invoice.count({ where: params.where }),
      prisma.invoice.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: {
          vendor: { select: { id: true, name: true, email: true } },
          purchaseOrder: { select: { poNumber: true } }
        }
      })
    ]);
  }

  static async findById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        vendor: { select: { name: true, address: true, gstNumber: true, contactPerson: true, email: true, userId: true } },
        purchaseOrder: { select: { poNumber: true, deliveryDeadline: true, createdBy: true } }
      }
    });
  }

  static async findByPOId(purchaseOrderId: string) {
    return prisma.invoice.findFirst({ where: { purchaseOrderId } });
  }

  static async update(id: string, data: Prisma.InvoiceUpdateInput) {
    return prisma.invoice.update({ where: { id }, data });
  }
}
`,

  // Services
  'services/invoice.service.ts': `import { InvoiceRepository } from '../repositories/invoice.repository.js';
import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import { generateInvoiceNumber } from '../utils/numberGenerator.js';
import { PDFService } from './pdf.service.js';
import { EmailService } from './email.service.js';

export class InvoiceService {
  static async getAll(query: any) {
    const page = parseInt(query.page || '1');
    const perPage = parseInt(query.perPage || '10');
    const skip = (page - 1) * perPage;

    const where: Prisma.InvoiceWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search } },
        { vendor: { name: { contains: query.search } } }
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy) orderBy = { [query.sortBy]: query.sortDir === 'asc' ? 'asc' : 'desc' };

    const [total, data] = await InvoiceRepository.findMany({ skip, take: perPage, where, orderBy });
    return { data, meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) } };
  }

  static async getById(id: string) {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw new Error('Invoice not found');

    const createdBy = invoice.purchaseOrder?.createdBy 
      ? await prisma.user.findUnique({ where: { id: invoice.purchaseOrder.createdBy }, select: { id: true, name: true } }) 
      : null;

    const companySettings = { name: 'VendorBridge', gstin: '27AADCB2230M1Z2', paymentTerms: 'Net 30' };

    return {
      invoice: { ...invoice, createdBy },
      company: companySettings
    };
  }

  static async generate(purchaseOrderId: string, adminId: string, io: any) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true, vendor: true }
    });

    if (!po) throw new Error('Purchase Order not found');
    if (po.status !== 'ACTIVE' && po.status !== 'ISSUED') throw new Error('Purchase Order is not ACTIVE');

    const existingInvoice = await InvoiceRepository.findByPOId(purchaseOrderId);
    if (existingInvoice) throw new Error('One invoice per PO allowed');

    const companySettings = { gstin: '27AADCB2230M1Z2', paymentTerms: 'Net 30' };
    const companyStateCode = companySettings.gstin.substring(0, 2);
    const vendorStateCode = po.vendor.gstNumber ? po.vendor.gstNumber.substring(0, 2) : companyStateCode;

    const isIGST = companyStateCode !== vendorStateCode;

    let subtotal = 0;
    const invoiceItemsData = po.items.map(item => {
      const lineTotal = item.quantity * item.unitPrice; // pre-tax total
      subtotal += lineTotal;
      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxPercent: item.taxPercent,
        lineTotal
      };
    });

    let igstAmount = 0, cgstAmount = 0, sgstAmount = 0;
    
    // Calculate taxes across all items
    po.items.forEach(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const taxAmt = lineTotal * (item.taxPercent / 100);
      if (isIGST) {
        igstAmount += taxAmt;
      } else {
        cgstAmount += (taxAmt / 2);
        sgstAmount += (taxAmt / 2);
      }
    });

    const grandTotal = subtotal + igstAmount + cgstAmount + sgstAmount;
    const invoiceNumber = await generateInvoiceNumber();

    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          purchaseOrderId,
          vendorId: po.vendorId,
          invoiceDate,
          dueDate,
          paymentTerms: companySettings.paymentTerms,
          subtotal,
          igstAmount,
          cgstAmount,
          sgstAmount,
          grandTotal,
          status: 'DRAFT',
          items: { create: invoiceItemsData }
        },
        include: { items: true }
      });

      await tx.activityLog.create({
        data: {
          userId: adminId,
          eventType: 'invoice_generated',
          entityType: 'Invoice',
          entityId: invoice.id,
          message: \`Invoice \${invoiceNumber} generated for PO \${po.poNumber}\`
        }
      });

      if (po.vendor.userId) {
        await tx.notification.create({
          data: {
            userId: po.vendor.userId,
            title: 'New Invoice Generated',
            message: \`Invoice \${invoiceNumber} has been generated.\`,
            type: 'invoice_generated',
            referenceType: 'Invoice',
            referenceId: invoice.id
          }
        });
      }

      if (io) io.emit('invoice_generated', { invoiceId: invoice.id, invoiceNumber });

      return invoice;
    });
  }

  static async markPaid(id: string, adminId: string, io: any) {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw new Error('Invoice not found');

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({ where: { id }, data: { status: 'PAID' } });

      await tx.activityLog.create({
        data: {
          userId: adminId,
          eventType: 'invoice_paid',
          entityType: 'Invoice',
          entityId: id,
          message: \`Invoice \${invoice.invoiceNumber} marked as PAID\`
        }
      });

      if (invoice.vendor.userId) {
        await tx.notification.create({
          data: {
            userId: invoice.vendor.userId,
            title: 'Invoice Paid',
            message: \`Invoice \${invoice.invoiceNumber} has been marked as paid.\`,
            type: 'invoice_paid',
            referenceType: 'Invoice',
            referenceId: id
          }
        });
      }

      if (io) io.emit('invoice_paid', { invoiceId: id });
      return updated;
    });
  }

  static async getPdfBuffer(id: string) {
    const data = await this.getById(id);
    return PDFService.generateInvoicePDF(data.invoice, data.company);
  }

  static async sendEmail(id: string, data: any, adminId: string, io: any) {
    const invoiceData = await this.getById(id);
    const pdfBuffer = await PDFService.generateInvoicePDF(invoiceData.invoice, invoiceData.company);

    await EmailService.sendInvoiceEmail(
      data.toEmail,
      data.ccEmail,
      data.subject,
      data.body || '<p>Please find the attached invoice.</p>',
      pdfBuffer,
      \`Invoice-\${invoiceData.invoice.invoiceNumber}.pdf\`
    );

    return await prisma.$transaction(async (tx) => {
      const statusUpdate = invoiceData.invoice.status === 'DRAFT' ? 'SENT' : invoiceData.invoice.status;
      const updated = await tx.invoice.update({
        where: { id },
        data: { emailSentAt: new Date(), status: statusUpdate }
      });

      await tx.activityLog.create({
        data: {
          userId: adminId,
          eventType: 'invoice_emailed',
          entityType: 'Invoice',
          entityId: id,
          message: \`Invoice \${invoiceData.invoice.invoiceNumber} emailed to \${data.toEmail}\`
        }
      });

      if (invoiceData.invoice.vendor.userId) {
        await tx.notification.create({
          data: {
            userId: invoiceData.invoice.vendor.userId,
            title: 'Invoice Emailed',
            message: \`Invoice \${invoiceData.invoice.invoiceNumber} has been emailed to you.\`,
            type: 'invoice_emailed',
            referenceType: 'Invoice',
            referenceId: id
          }
        });
      }

      if (io) io.emit('invoice_emailed', { invoiceId: id });

      return updated;
    });
  }
}
`,

  // Controllers
  'controllers/invoice.controller.ts': `import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service.js';
import { generateInvoiceSchema, markPaidSchema, sendInvoiceEmailSchema } from '../validators/invoice.validator.js';

export class InvoiceController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InvoiceService.getAll(req.query);
      res.json(result);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InvoiceService.getById(req.params.id);
      
      // Enforce Vendor access
      if (req.user!.role === 'VENDOR' && result.invoice.vendor.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = generateInvoiceSchema.parse(req.body);
      const io = req.app.get('io');
      const result = await InvoiceService.generate(data.purchaseOrderId, req.user!.id, io);
      res.status(201).json({ message: 'Invoice generated', data: result });
    } catch (e) { next(e); }
  }

  static async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      markPaidSchema.parse(req.body);
      const io = req.app.get('io');
      const result = await InvoiceService.markPaid(req.params.id, req.user!.id, io);
      res.json({ message: 'Invoice marked paid', data: result });
    } catch (e) { next(e); }
  }

  static async getPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceData = await InvoiceService.getById(req.params.id);
      
      if (req.user!.role === 'VENDOR' && invoiceData.invoice.vendor.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const buffer = await InvoiceService.getPdfBuffer(req.params.id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', \`attachment; filename=Invoice-\${invoiceData.invoice.invoiceNumber}.pdf\`);
      res.send(buffer);
    } catch (e) { next(e); }
  }

  static async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendInvoiceEmailSchema.parse(req.body);
      const io = req.app.get('io');
      await InvoiceService.sendEmail(req.params.id, data, req.user!.id, io);
      res.json({ message: 'Invoice sent successfully' });
    } catch (e) { next(e); }
  }
}
`,

  // Routes
  'routes/invoice.routes.ts': `import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/permissions.js';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), InvoiceController.getAll);
router.post('/generate', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), InvoiceController.generate);

router.get('/:id', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.VENDOR), InvoiceController.getById);
router.patch('/:id/mark-paid', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), InvoiceController.markPaid);
router.get('/:id/pdf', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.VENDOR), InvoiceController.getPdf);
router.post('/:id/send-email', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), InvoiceController.sendEmail);

export default router;
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(path.join(srcDir, filepath)), { recursive: true });
  fs.writeFileSync(path.join(srcDir, filepath), content);
}

// Register Routes in Server
const serverPath = path.join(srcDir, 'server.ts');
let serverContent = fs.readFileSync(serverPath, 'utf8');

if (!serverContent.includes('invoiceRoutes')) {
  const imports = `import invoiceRoutes from './routes/invoice.routes.js';\n`;
  serverContent = serverContent.replace(/import quotationRoutes/, imports + 'import quotationRoutes');
  
  const middlewareReg = `app.use('/api/invoices', invoiceRoutes);\n`;
  serverContent = serverContent.replace("app.use('/api/quotations', quotationRoutes);", `app.use('/api/quotations', quotationRoutes);\n${middlewareReg}`);
  
  fs.writeFileSync(serverPath, serverContent);
}

// Update dashboard aggregations in dashboard.service.ts
const dashboardPath = path.join(srcDir, 'services', 'dashboard.service.ts');
if (fs.existsSync(dashboardPath)) {
  let dbContent = fs.readFileSync(dashboardPath, 'utf8');
  if (!dbContent.includes('pendingInvoices')) {
    dbContent = dbContent.replace(/const rfqs = .*/, `const rfqs = await prisma.rFQ.count({ where: { status: 'PUBLISHED' } });
    const pendingInvoices = await prisma.invoice.count({ where: { status: 'DRAFT' } });
    const paidInvoices = await prisma.invoice.count({ where: { status: 'PAID' } });
    const recentInvoices = await prisma.invoice.findMany({ take: 5, orderBy: { createdAt: 'desc' } });`);
    dbContent = dbContent.replace(/return \{ totalVendors.*/, `return { totalVendors: vendors, activeRFQs: rfqs, pendingInvoices, paidInvoices, recentInvoices };`);
    fs.writeFileSync(dashboardPath, dbContent);
  }
}

console.log('Invoice, PDF, and Email modules scaffolded successfully.');
