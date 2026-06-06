import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendInvoiceEmail = async (toEmail, vendorName, pdfBuffer, invoiceNumber) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT || 1025,
    secure: false,
  });

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
