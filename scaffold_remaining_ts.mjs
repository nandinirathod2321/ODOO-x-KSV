import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = __dirname;

const files = {
  'src/services/pdf.service.ts': `import PDFDocument from 'pdfkit';

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
        
        doc.fontSize(12).text(\`Invoice #: \${invoice.invoice_number}\`);
        doc.text(\`Date: \${new Date(invoice.created_at).toLocaleDateString()}\`);
        doc.moveDown();

        doc.text(\`Subtotal: $\${invoice.subtotal}\`);
        doc.text(\`Tax: $\${invoice.tax_amount}\`);
        doc.fontSize(14).text(\`Grand Total: $\${invoice.grand_total}\`, { underline: true });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
`,
  'src/middlewares/auth.middleware.ts': `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
`,
  'src/validators/auth.validator.ts': `import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER'])
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(backendDir, filepath), content);
}

// Rename server.ts to app.ts
const serverTsPath = path.join(backendDir, 'src/server.ts');
const appTsPath = path.join(backendDir, 'src/app.ts');
if (fs.existsSync(serverTsPath)) {
  fs.renameSync(serverTsPath, appTsPath);
}

// Update package.json scripts
const pkgPath = path.join(backendDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
pkg.scripts.dev = 'ts-node src/app.ts';
pkg.scripts.start = 'ts-node src/app.ts';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log('Final TS scaffolding complete.');
