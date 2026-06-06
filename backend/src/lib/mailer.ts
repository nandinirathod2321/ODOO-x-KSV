import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendInvoiceEmail = async (toEmail: string, vendorName: string, pdfBuffer: Buffer, invoiceNumber: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    secure: false,
  } as any);

  await transporter.sendMail({
    from: '"VendorBridge" <noreply@vendorbridge.com>',
    to: toEmail,
    subject: `Invoice ${invoiceNumber} from ${vendorName}`,
    text: `Please find attached the invoice ${invoiceNumber}.`,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};
