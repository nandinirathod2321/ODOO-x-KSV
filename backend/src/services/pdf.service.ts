import PDFDocument from 'pdfkit';

export class PDFService {
  async generateInvoicePdf(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Basic Invoice PDF
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).text(`Invoice #: ${invoice.invoice_number}`);
        doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`);
        doc.moveDown();

        doc.text(`Subtotal: $${invoice.subtotal}`);
        doc.text(`Tax: $${invoice.tax_amount}`);
        doc.fontSize(14).text(`Grand Total: $${invoice.grand_total}`, { underline: true });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
