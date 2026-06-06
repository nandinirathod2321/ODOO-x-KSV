import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = __dirname;

const files = {
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
`,
  'prisma/schema.prisma': `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  PROCUREMENT_OFFICER
  VENDOR
  MANAGER
}

enum VendorStatus {
  ACTIVE
  INACTIVE
  BLACKLISTED
}

enum RfqStatus {
  DRAFT
  SENT
  QUOTATION_RECEIVED
  CLOSED
}

enum QuotationStatus {
  SUBMITTED
  SELECTED
  REJECTED
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

enum PoStatus {
  ISSUED
  INVOICED
  CLOSED
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
}

model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  password_hash String
  role          Role
  status        String   @default("ACTIVE")
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  rfqs          Rfq[]
  approvals     Approval[]
  activity_logs ActivityLog[]
  notifications Notification[]
}

model Vendor {
  id              String       @id @default(uuid())
  vendor_name     String
  vendor_category String?
  gst_number      String?
  email           String       @unique
  phone           String?
  address         String?
  rating          Float        @default(0.0)
  status          VendorStatus @default(ACTIVE)
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt

  rfq_vendors     RfqVendor[]
  quotations      Quotation[]
  pos             PurchaseOrder[]
}

model Rfq {
  id          String   @id @default(uuid())
  title       String
  description String
  quantity    Int
  deadline    DateTime
  status      RfqStatus @default(DRAFT)
  created_by  String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  user        User     @relation(fields: [created_by], references: [id])
  rfq_vendors RfqVendor[]
  quotations  Quotation[]
}

model RfqVendor {
  id        String @id @default(uuid())
  rfq_id    String
  vendor_id String

  rfq    Rfq    @relation(fields: [rfq_id], references: [id])
  vendor Vendor @relation(fields: [vendor_id], references: [id])

  @@unique([rfq_id, vendor_id])
}

model Quotation {
  id            String   @id @default(uuid())
  rfq_id        String
  vendor_id     String
  price         Decimal
  delivery_days Int
  remarks       String?
  status        QuotationStatus @default(SUBMITTED)
  submitted_at  DateTime @default(now())

  rfq       Rfq             @relation(fields: [rfq_id], references: [id])
  vendor    Vendor          @relation(fields: [vendor_id], references: [id])
  approvals Approval[]
  pos       PurchaseOrder[]
}

model Approval {
  id           String   @id @default(uuid())
  quotation_id String   @unique
  approver_id  String
  status       ApprovalStatus @default(PENDING)
  remarks      String?
  approved_at  DateTime?

  quotation Quotation @relation(fields: [quotation_id], references: [id])
  approver  User      @relation(fields: [approver_id], references: [id])
}

model PurchaseOrder {
  id           String   @id @default(uuid())
  po_number    String   @unique
  quotation_id String   @unique
  vendor_id    String
  total_amount Decimal
  status       PoStatus @default(ISSUED)
  created_at   DateTime @default(now())

  quotation Quotation @relation(fields: [quotation_id], references: [id])
  vendor    Vendor    @relation(fields: [vendor_id], references: [id])
  invoices  Invoice[]
}

model Invoice {
  id             String   @id @default(uuid())
  invoice_number String   @unique
  po_id          String   @unique
  subtotal       Decimal
  tax_amount     Decimal
  grand_total    Decimal
  status         InvoiceStatus @default(DRAFT)
  created_at     DateTime @default(now())

  po PurchaseOrder @relation(fields: [po_id], references: [id])
}

model Notification {
  id         String   @id @default(uuid())
  user_id    String
  title      String
  message    String
  is_read    Boolean  @default(false)
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [id])
}

model ActivityLog {
  id          String   @id @default(uuid())
  user_id     String
  action      String
  entity_type String
  entity_id   String
  timestamp   DateTime @default(now())

  user User @relation(fields: [user_id], references: [id])
}
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(backendDir, filepath), content);
}

// Rename src files to .ts
const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (file.endsWith('.js') && !file.includes('node_modules')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const jsFiles = walkSync(path.join(backendDir, 'src'));
jsFiles.forEach(file => {
  const newFile = file.replace(/\.js$/, '.ts');
  fs.renameSync(file, newFile);
});

console.log('TS setup and file renaming complete.');
