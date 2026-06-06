import prisma from '../lib/prisma.js';
import { generateInvoicePdf } from '../lib/pdf.js';
import { sendInvoiceEmail } from '../lib/mailer.js';

export const getAll = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { vendor: { select: { name: true } } }
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        po: {
          include: {
            approval: {
              include: {
                quotation: {
                  include: { rfq: true }
                }
              }
            }
          }
        }
      }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

export const generate = async (req, res, next) => {
  try {
    const { poId } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({ where: { id: poId } });
      if (!po) throw new Error('PO not found');

      const count = await tx.invoice.count();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          poId: po.id,
          vendorId: po.vendorId,
          subtotal: po.subtotal,
          taxAmount: po.taxAmount,
          total: po.total,
          status: 'DRAFT'
        }
      });

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'INVOICED' }
      });

      return invoice;
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const getPdf = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        po: {
          include: {
            approval: {
              include: {
                quotation: {
                  include: { rfq: true }
                }
              }
            }
          }
        }
      }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const pdfBuffer = await generateInvoicePdf(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

export const sendEmail = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        po: {
          include: {
            approval: {
              include: {
                quotation: {
                  include: { rfq: true }
                }
              }
            }
          }
        }
      }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const pdfBuffer = await generateInvoicePdf(invoice);
    await sendInvoiceEmail(invoice.vendor.email, invoice.vendor.name, pdfBuffer, invoice.invoiceNumber);

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'SENT', emailedAt: new Date() }
    });

    res.json({ message: 'Email sent successfully', invoice: updatedInvoice });
  } catch (err) {
    next(err);
  }
};
