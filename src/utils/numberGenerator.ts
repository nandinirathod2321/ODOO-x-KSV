import prisma from '../config/prisma.ts';

async function generateNextSequence(prefix: string, model: 'rFQ' | 'quotation' | 'purchaseOrder' | 'invoice', field: string): Promise<string> {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;

  const lastRecord = await (prisma[model] as any).findFirst({
    where: { [field]: { startsWith: fullPrefix } },
    orderBy: { [field]: 'desc' }
  });

  if (!lastRecord) {
    return `${fullPrefix}001`;
  }

  const lastNumber = parseInt(lastRecord[field].split('-').pop() || '0', 10);
  const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
  
  return `${fullPrefix}${nextNumber}`;
}

export const generateRFQNumber = () => generateNextSequence('RFQ', 'rFQ', 'rfqNumber');
export const generateQuotationNumber = () => generateNextSequence('QT', 'quotation', 'quotationNumber');
export const generatePONumber = () => generateNextSequence('PO', 'purchaseOrder', 'poNumber');
export const generateInvoiceNumber = () => generateNextSequence('INV', 'invoice', 'invoiceNumber');
