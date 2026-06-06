import { InvoiceRepository } from '../repositories/invoice.repository.ts';
import prisma from '../config/prisma.ts';
import { Prisma } from '@prisma/client';
import { generateInvoiceNumber } from '../utils/numberGenerator.ts';
import { PDFService } from './pdf.service.ts';
import { EmailService } from './email.service.ts';

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
          message: `Invoice ${invoiceNumber} generated for PO ${po.poNumber}`
        }
      });

      if (po.vendor.userId) {
        await tx.notification.create({
          data: {
            userId: po.vendor.userId,
            title: 'New Invoice Generated',
            message: `Invoice ${invoiceNumber} has been generated.`,
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
          message: `Invoice ${invoice.invoiceNumber} marked as PAID`
        }
      });

      if (invoice.vendor.userId) {
        await tx.notification.create({
          data: {
            userId: invoice.vendor.userId,
            title: 'Invoice Paid',
            message: `Invoice ${invoice.invoiceNumber} has been marked as paid.`,
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
      `Invoice-${invoiceData.invoice.invoiceNumber}.pdf`
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
          message: `Invoice ${invoiceData.invoice.invoiceNumber} emailed to ${data.toEmail}`
        }
      });

      if (invoiceData.invoice.vendor.userId) {
        await tx.notification.create({
          data: {
            userId: invoiceData.invoice.vendor.userId,
            title: 'Invoice Emailed',
            message: `Invoice ${invoiceData.invoice.invoiceNumber} has been emailed to you.`,
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
