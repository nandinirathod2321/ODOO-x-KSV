import nodemailer from 'nodemailer';

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
      html: `<h2>Your Password Reset OTP</h2><p>Your OTP is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`
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
