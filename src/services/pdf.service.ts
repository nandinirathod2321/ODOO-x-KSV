import puppeteer from 'puppeteer';
import { buildInvoiceHTML, buildPurchaseOrderHTML } from '../utils/invoiceHtmlTemplate.ts';

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
