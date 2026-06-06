import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = __dirname; // backend directory

const dirs = [
  'src/repositories',
  'src/services',
  'src/validators',
  'src/websocket',
  'src/utils'
];

dirs.forEach(d => fs.mkdirSync(path.join(backendDir, d), { recursive: true }));

const files = {
  'prisma/schema.prisma': `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
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
  OPEN
  CLOSED
  AWARDED
  CANCELLED
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
  created_at    DateTime @default(now())

  rfqs          Rfq[]
  approvals     Approval[]
  activity_logs ActivityLog[]
}

model Vendor {
  id          String       @id @default(uuid())
  vendor_name String
  gst_number  String?
  email       String       @unique
  phone       String?
  rating      Float        @default(0.0)
  status      VendorStatus @default(ACTIVE)

  rfq_vendors RfqVendor[]
  quotations  Quotation[]
  pos         PurchaseOrder[]
}

model Rfq {
  id          String   @id @default(uuid())
  title       String
  description String
  quantity    Int
  deadline    DateTime
  status      RfqStatus @default(OPEN)
  created_by  String

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
  submitted_at  DateTime @default(now())
  status        QuotationStatus @default(SUBMITTED)

  rfq       Rfq             @relation(fields: [rfq_id], references: [id])
  vendor    Vendor          @relation(fields: [vendor_id], references: [id])
  approvals Approval[]
  pos       PurchaseOrder[]
}

model Approval {
  id           String   @id @default(uuid())
  quotation_id String
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
  quotation_id String
  vendor_id    String
  total_amount Decimal
  status       PoStatus @default(ISSUED)

  quotation Quotation @relation(fields: [quotation_id], references: [id])
  vendor    Vendor    @relation(fields: [vendor_id], references: [id])
  invoices  Invoice[]
}

model Invoice {
  id             String   @id @default(uuid())
  invoice_number String   @unique
  po_id          String
  subtotal       Decimal
  tax            Decimal
  grand_total    Decimal
  status         InvoiceStatus @default(DRAFT)

  po PurchaseOrder @relation(fields: [po_id], references: [id])
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

console.log('Update script completed.');
