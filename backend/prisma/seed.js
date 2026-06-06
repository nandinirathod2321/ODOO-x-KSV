import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const usersPath = path.join(__dirname, '../seed-data/users.json');
  const vendorsPath = path.join(__dirname, '../seed-data/vendors.json');
  const categoriesPath = path.join(__dirname, '../seed-data/categories.json');

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const vendors = JSON.parse(fs.readFileSync(vendorsPath, 'utf8'));
  const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

  console.log('Cleaning existing database...');
  // Clean in correct order of dependency (children first)
  await prisma.passwordResetOTP.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.quotationComparisonSnapshot.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.pOItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rFQItem.deleteMany({});
  await prisma.rFQVendor.deleteMany({});
  await prisma.rFQ.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.vendorCategory.deleteMany({});

  console.log('Seeding categories...');
  const categoryMap = {};
  for (const catName of categories) {
    const cat = await prisma.vendorCategory.create({
      data: { name: catName }
    });
    categoryMap[catName] = cat.id;
  }

  console.log('Seeding non-vendor users...');
  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.create({
      data: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role
      }
    });

    if (u.role === 'VENDOR') {
      // Create a default vendor profile for the test vendor
      await prisma.vendor.create({
        data: {
          userId: user.id,
          name: u.name,
          email: u.email,
          status: 'ACTIVE',
          categoryId: categoryMap['IT Hardware'] || null
        }
      });
    }
  }

  console.log('Seeding vendors and their users...');
  for (const v of vendors) {
    const hashedPassword = await bcrypt.hash('vendor123', 10);
    // Create corresponding user for this vendor
    const user = await prisma.user.create({
      data: {
        name: v.name,
        email: v.email,
        password: hashedPassword,
        role: 'VENDOR'
      }
    });

    // Create the vendor profile
    await prisma.vendor.create({
        data: {
          userId: user.id,
          name: v.name,
          email: v.email,
          phone: v.phone,
          gstNumber: v.gstNumber,
          address: v.address,
          status: v.status || 'ACTIVE',
          categoryId: categoryMap[v.category] || null
        }
      });
    }

    console.log('Seeding rich procurement cycles (RFQs, Quotations, Approvals, POs)...');
    
    // Find key users
    const officerUser = await prisma.user.findFirst({ where: { role: 'PROCUREMENT_OFFICER' } });
    const managerUser = await prisma.user.findFirst({ where: { role: 'MANAGER' } });
    const officerId = officerUser ? officerUser.id : 'default-officer';
    const managerId = managerUser ? managerUser.id : 'default-manager';

    // Find key vendors
    const vendorTech = await prisma.vendor.findFirst({ where: { name: 'Tech Corp India' } });
    const vendorOffice = await prisma.vendor.findFirst({ where: { name: 'Office Plus' } });
    const vendorTest = await prisma.vendor.findFirst({ where: { name: 'Test Vendor' } });

    if (vendorTech && vendorOffice && vendorTest) {
      // 1. RFQ-001: IT & Office Equipment (QUOTATION_RECEIVED status)
      const rfq1 = await prisma.rFQ.create({
        data: {
          rfqNumber: 'RFQ-2026-001',
          title: 'Ergonomic Workstation Upgrade Q2',
          description: 'Procurement of ergonomic mesh office chairs, dual-monitor desks, and conference meeting tables for the main office.',
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          status: 'QUOTATION_RECEIVED',
          createdBy: officerId,
          items: {
            create: [
              { description: 'Ergonomic Office Chair', quantity: 20, unit: 'pcs', notes: 'Mesh back, adjustable armrest and lumbar support.' },
              { description: 'Dual Monitor Workstation Desk', quantity: 10, unit: 'pcs', notes: 'L-shaped wooden desk with cable management.' },
              { description: 'Conference Meeting Table', quantity: 3, unit: 'pcs', notes: '8-seater wooden table with built-in power strip.' }
            ]
          },
          vendors: {
            create: [
              { vendorId: vendorTech.id },
              { vendorId: vendorOffice.id },
              { vendorId: vendorTest.id }
            ]
          }
        },
        include: { items: true }
      });

      // Seed Quotations for RFQ-001
      // Quotation 1: Tech Corp India (Tech-focused, premium prices)
      const qTech = await prisma.quotation.create({
        data: {
          quotationNumber: 'QT-2026-001A',
          rfqId: rfq1.id,
          vendorId: vendorTech.id,
          deliveryDays: 14,
          validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentTerms: 'Net 30',
          notes: 'Premium ergonomic options with 3-year warranty.',
          totalAmount: 387040,
          status: 'SUBMITTED',
          items: {
            create: [
              { rfqItemId: rfq1.items[0].id, description: 'Ergonomic Office Chair', quantity: 20, unit: 'pcs', unitPrice: 7500, taxPercent: 18, lineTotal: 177000 }, // 150000 + 27000 tax
              { rfqItemId: rfq1.items[1].id, description: 'Dual Monitor Workstation Desk', quantity: 10, unit: 'pcs', unitPrice: 11800, taxPercent: 18, lineTotal: 139240 }, // 118000 + 21240 tax
              { rfqItemId: rfq1.items[2].id, description: 'Conference Meeting Table', quantity: 3, unit: 'pcs', unitPrice: 20000, taxPercent: 18, lineTotal: 70800 } // 60000 + 10800 tax
            ]
          }
        }
      });

      // Quotation 2: Office Plus (Cheaper options - Winner)
      const qOffice = await prisma.quotation.create({
        data: {
          quotationNumber: 'QT-2026-001B',
          rfqId: rfq1.id,
          vendorId: vendorOffice.id,
          deliveryDays: 21,
          validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentTerms: 'Net 30',
          notes: 'Durable commercial grade furniture. Best bulk rates.',
          totalAmount: 378780,
          status: 'SUBMITTED',
          items: {
            create: [
              { rfqItemId: rfq1.items[0].id, description: 'Ergonomic Office Chair', quantity: 20, unit: 'pcs', unitPrice: 7200, taxPercent: 18, lineTotal: 169920 }, // 144000 + 25920 tax
              { rfqItemId: rfq1.items[1].id, description: 'Dual Monitor Workstation Desk', quantity: 10, unit: 'pcs', unitPrice: 11500, taxPercent: 18, lineTotal: 135700 }, // 115000 + 20700 tax
              { rfqItemId: rfq1.items[2].id, description: 'Conference Meeting Table', quantity: 3, unit: 'pcs', unitPrice: 20666.67, taxPercent: 18, lineTotal: 73160 } // 62000 + 11160 tax
            ]
          }
        }
      });

      // Quotation 3: Test Vendor (High pricing, fast delivery)
      const qTest = await prisma.quotation.create({
        data: {
          quotationNumber: 'QT-2026-001C',
          rfqId: rfq1.id,
          vendorId: vendorTest.id,
          deliveryDays: 10,
          validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentTerms: '100% Advance',
          notes: 'Immediate dispatch. Limited stock.',
          totalAmount: 404740,
          status: 'SUBMITTED',
          items: {
            create: [
              { rfqItemId: rfq1.items[0].id, description: 'Ergonomic Office Chair', quantity: 20, unit: 'pcs', unitPrice: 7800, taxPercent: 18, lineTotal: 184080 },
              { rfqItemId: rfq1.items[1].id, description: 'Dual Monitor Workstation Desk', quantity: 10, unit: 'pcs', unitPrice: 12200, taxPercent: 18, lineTotal: 143960 },
              { rfqItemId: rfq1.items[2].id, description: 'Conference Meeting Table', quantity: 3, unit: 'pcs', unitPrice: 21666.67, taxPercent: 18, lineTotal: 76700 }
            ]
          }
        }
      });

      // Log comparison snapshot
      const ranking = [
        { quotationId: qOffice.id, vendorId: vendorOffice.id, vendorName: vendorOffice.name, totalAmount: 378780, deliveryDays: 21, rating: 4.8, score: 95 },
        { quotationId: qTech.id, vendorId: vendorTech.id, vendorName: vendorTech.name, totalAmount: 387040, deliveryDays: 14, rating: 4.3, score: 92 },
        { quotationId: qTest.id, vendorId: vendorTest.id, vendorName: vendorTest.name, totalAmount: 404740, deliveryDays: 10, rating: 4.5, score: 87 }
      ];

      await prisma.quotationComparisonSnapshot.create({
        data: {
          rfqId: rfq1.id,
          generatedBy: officerId,
          recommendedVendorId: vendorOffice.id,
          comparisonScoreJson: JSON.stringify(ranking)
        }
      });


      // 2. RFQ-002: Infrastructure Upgrade (AWARDED status, PO generated)
      const rfq2 = await prisma.rFQ.create({
        data: {
          rfqNumber: 'RFQ-2026-002',
          title: 'Laptop and Power Infrastructure Upgrade',
          description: 'Developer laptops and high capacity UPS procurement for engineering team.',
          deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // deadline passed 5 days ago
          status: 'AWARDED',
          createdBy: officerId,
          items: {
            create: [
              { description: 'Developer Laptop (16GB RAM, 512GB SSD)', quantity: 5, unit: 'pcs', notes: 'Core i7 or Ryzen 7 processor.' },
              { description: 'Uninterruptible Power Supply (UPS) 1kVA', quantity: 3, unit: 'pcs', notes: 'Line-interactive UPS.' }
            ]
          },
          vendors: {
            create: [
              { vendorId: vendorTech.id }
            ]
          }
        },
        include: { items: true }
      });

      const qTech2 = await prisma.quotation.create({
        data: {
          quotationNumber: 'QT-2026-002A',
          rfqId: rfq2.id,
          vendorId: vendorTech.id,
          deliveryDays: 7,
          validityDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          paymentTerms: 'Net 30',
          notes: 'Standard OEM warranty.',
          totalAmount: 411820,
          status: 'ACCEPTED',
          isWinner: true,
          items: {
            create: [
              { rfqItemId: rfq2.items[0].id, description: 'Developer Laptop (16GB RAM, 512GB SSD)', quantity: 5, unit: 'pcs', unitPrice: 65000, taxPercent: 18, lineTotal: 383500 }, // 325000 + 58500 tax
              { rfqItemId: rfq2.items[1].id, description: 'Uninterruptible Power Supply (UPS) 1kVA', quantity: 3, unit: 'pcs', unitPrice: 8000, taxPercent: 18, lineTotal: 28320 } // 24000 + 4320 tax
            ]
          }
        }
      });

      // Create Approval Request
      const approval2 = await prisma.approval.create({
        data: {
          quotationId: qTech2.id,
          requestedBy: officerId,
          approvedBy: managerId,
          status: 'APPROVED',
          remarks: 'Approved. Price is within budget. High rating vendor.',
          requestedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          actionedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      });

      // Create Purchase Order
      const po2 = await prisma.purchaseOrder.create({
        data: {
          poNumber: 'PO-2026-001',
          rfqId: rfq2.id,
          quotationId: qTech2.id,
          vendorId: vendorTech.id,
          approvalId: approval2.id,
          totalAmount: 411820,
          deliveryDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          status: 'ISSUED',
          createdBy: officerId,
          items: {
            create: [
              { description: 'Developer Laptop (16GB RAM, 512GB SSD)', quantity: 5, unit: 'pcs', unitPrice: 65000, taxPercent: 18, lineTotal: 383500 },
              { description: 'Uninterruptible Power Supply (UPS) 1kVA', quantity: 3, unit: 'pcs', unitPrice: 8000, taxPercent: 18, lineTotal: 28320 }
            ]
          }
        }
      });

      // Create Invoice
      await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2026-001',
          purchaseOrderId: po2.id,
          vendorId: vendorTech.id,
          invoiceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
          paymentTerms: 'Net 30',
          subtotal: 349000, // 325000 + 24000
          cgstAmount: 31410, // 9%
          sgstAmount: 31410, // 9%
          grandTotal: 411820,
          status: 'PENDING',
          items: {
            create: [
              { description: 'Developer Laptop (16GB RAM, 512GB SSD)', quantity: 5, unit: 'pcs', unitPrice: 65000, taxPercent: 18, lineTotal: 383500 },
              { description: 'Uninterruptible Power Supply (UPS) 1kVA', quantity: 3, unit: 'pcs', unitPrice: 8000, taxPercent: 18, lineTotal: 28320 }
            ]
          }
        }
      });


      // 3. RFQ-003: Printed Brochures (DRAFT status)
      await prisma.rFQ.create({
        data: {
          rfqNumber: 'RFQ-2026-003',
          title: 'Marketing Campaign Collaterals',
          description: 'A4 tri-fold flyers and corporate roll-up banners for upcoming regional summits.',
          deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          status: 'DRAFT',
          createdBy: officerId,
          items: {
            create: [
              { description: 'Printed Brochure (A4, Tri-fold, 150gsm)', quantity: 1000, unit: 'pcs', notes: 'Double-sided glossy print.' },
              { description: 'Roll-up Standee banner (6x3 ft)', quantity: 15, unit: 'pcs', notes: 'Aluminium stand, high-resolution flex print.' }
            ]
          },
          vendors: {
            create: [
              { vendorId: vendorOffice.id }
            ]
          }
        }
      });


      // Log Activity History
      await prisma.activityLog.createMany({
        data: [
          { eventType: 'rfq_created', entityType: 'RFQ', entityId: rfq1.id, userId: officerId, message: 'Procurement Officer created RFQ-2026-001 (Ergonomic Workstation Upgrade Q2)' },
          { eventType: 'rfq_published', entityType: 'RFQ', entityId: rfq1.id, userId: officerId, message: 'RFQ-2026-001 was published to assigned vendors' },
          { eventType: 'quotation_submitted', entityType: 'Quotation', entityId: qTech.id, userId: vendorTech.userId, message: 'Tech Corp India submitted Quote QT-2026-001A for RFQ-2026-001' },
          { eventType: 'quotation_submitted', entityType: 'Quotation', entityId: qOffice.id, userId: vendorOffice.userId, message: 'Office Plus submitted Quote QT-2026-001B for RFQ-2026-001' },
          { eventType: 'rfq_created', entityType: 'RFQ', entityId: rfq2.id, userId: officerId, message: 'Procurement Officer created RFQ-2026-002 (Laptop Upgrade)' },
          { eventType: 'rfq_published', entityType: 'RFQ', entityId: rfq2.id, userId: officerId, message: 'RFQ-2026-002 was published to assigned vendors' },
          { eventType: 'quotation_submitted', entityType: 'Quotation', entityId: qTech2.id, userId: vendorTech.userId, message: 'Tech Corp India submitted Quote QT-2026-002A for RFQ-2026-002' },
          { eventType: 'winner_selected', entityType: 'Quotation', entityId: qTech2.id, userId: officerId, message: 'Procurement Officer selected QT-2026-002A as winner for RFQ-2026-002' },
          { eventType: 'approval_approved', entityType: 'Approval', entityId: approval2.id, userId: managerId, message: 'Manager Vikram Patel approved L1 request for RFQ-2026-002' },
          { eventType: 'po_generated', entityType: 'PurchaseOrder', entityId: po2.id, userId: managerId, message: 'Purchase Order PO-2026-001 was generated automatically' }
        ]
      });
    }

    console.log('Database seeded with rich ERP cycles successfully!');
  }

  main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
