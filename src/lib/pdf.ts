import puppeteer from 'puppeteer';
import { invoiceTemplate } from '../templates/invoice.html.ts';

export const generateInvoicePdf = async (invoice) => {
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const htmlContent = invoiceTemplate(invoice);
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
