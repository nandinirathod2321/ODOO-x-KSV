<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:16a34a,100:15803d&height=200&section=header&text=VendorBridge&fontSize=72&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Procurement%20%26%20Vendor%20Management%20ERP&descAlignY=60&descColor=dcfce7" width="100%"/>

<br/>

[![Built for](https://img.shields.io/badge/Built%20for-Odoo%20×%20KSV%20Hackathon%202026-7c3aed?style=for-the-badge&logo=odoo&logoColor=white)](https://hackathon.odoo.com/event/odoo-x-ksv-hackathon-2026-23/register)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20%2B%20Node.js%20%2B%20MySQL-16a34a?style=for-the-badge&logo=react&logoColor=white)](https://github.com/nandinirathod2321/ODOO-x-KSV)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![PRs](https://img.shields.io/badge/PRs-Welcome-ff6b6b?style=for-the-badge)](https://github.com/nandinirathod2321/ODOO-x-KSV/pulls)

<br/>

> **VendorBridge** digitises the entire procurement lifecycle — RFQ creation, multi-vendor quotation collection, side-by-side comparison, manager approval, purchase order generation, GST-split invoice management, real-time notifications, and a full audit trail — all in one role-aware platform.

<br/>

[✦ Features](#-features) · [✦ Architecture](#-architecture) · [✦ Tech Stack](#-tech-stack) · [✦ Quick Start](#-quick-start) · [✦ API Reference](#-api-reference) · [✦ Schema](#-database-schema) · [✦ Team](#-team)

<br/>

</div>

---

## ✦ The Problem

Procurement in most organisations still runs on email threads, Excel sheets, and WhatsApp forwards. Quotations get lost. Approvals stall. Vendors get no visibility. Finance chases invoices manually.

**VendorBridge fixes this end-to-end.**

---

## ✦ Features

### 👤 Role-Based Dashboards

Every user sees a dashboard tailored exactly to their job:

| Role | What they see |
|---|---|
| **Procurement Officer** | KPI cards (active RFQs, pending approvals, monthly spend, open invoices) · recent activity · procurement funnel · spend chart · action alerts |
| **Manager / Approver** | Approval queue with SLA timers · approval history · one-click approve/reject |
| **Vendor** | Open RFQs assigned to them · submitted quotes · active POs · delivery deadlines |
| **Admin** | Full vendor registry · spend-by-category chart · system alerts · user overview |

---

### 📋 RFQ Management

- Create RFQs with title, description, deadline, and line items (description · qty · unit · notes)
- Invite specific vendors to an RFQ
- Lifecycle: `DRAFT` → `PUBLISHED` → `QUOTATION_RECEIVED` → `AWARDED` → `CLOSED` / `CANCELLED`
- Paginated listing with search, status filter, and sort

---

### 💬 Quotation Engine

- Vendors submit quotations with per-line unit prices, tax %, delivery days, validity date, and payment terms
- Procurement officers run a **side-by-side comparison** across all received quotes
- Select a winner — triggers approval workflow automatically
- Comparison snapshots are saved with recommended vendor scoring

---

### ✅ Approval Workflow

- Manager queue shows all pending approvals with SLA elapsed timers
- One-click `APPROVE` or `REJECT` with optional remarks
- Approval actions are logged in the activity trail and trigger real-time notifications

---

### 📦 Purchase Orders

- Auto-generated from an approved, winning quotation
- PO number auto-incremented (`PO-XXXX-YYYY`)
- Statuses: `ISSUED` → `ACKNOWLEDGED` → `PARTIAL_DELIVERY` → `DELIVERED` → `CLOSED`
- Includes terms & conditions and delivery deadline

---

### 🧾 Invoice Management

- Generate invoices from a PO — line items, GST split (CGST / SGST / IGST), grand total
- Auto-incremented invoice numbers (`INV-XXXX`)
- Mark as `PAID` · statuses: `PENDING`, `OVERDUE`, `PAID`, `CANCELLED`
- **PDF generation** via Puppeteer — download or email directly from the UI
- **Email dispatch** via Nodemailer with invoice HTML template

---

### 🔔 Real-Time Notifications

- Socket.io broadcasts on every major event (quote submitted, approval actioned, PO issued, invoice sent)
- Per-user notification store with mark-as-read and mark-all-read
- Frontend listens via `socket.io-client` with live badge counters

---

### 📊 Reports & Analytics

- Vendor performance report
- Spending summary by category and period
- Monthly procurement trends
- Full procurement stats
- CSV/Excel export

---

### 🏢 Vendor Registry

- Full CRUD with GST number, category, rating, contact, address, portal toggle
- Status lifecycle: `ACTIVE` · `INACTIVE` · `BLOCKED`
- Vendor performance profile: avg response time, quote history, PO history
- Search by name, email, GST

---

### 📝 Activity Log / Audit Trail

- Every significant action (create, update, approve, reject, pay) writes an immutable log entry
- Queryable audit log in the Admin panel

---

## ✦ Procurement Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     VENDORBRIDGE WORKFLOW                           │
└─────────────────────────────────────────────────────────────────────┘

  PROCUREMENT OFFICER          VENDOR(S)              MANAGER
  ─────────────────────        ──────────────         ──────────────────

  1. Create RFQ                                        
     + line items              
     + invite vendors          
          │                    
          ▼                    
  2. Publish RFQ  ────────────▶  Notified via          
                                 Socket.io             
                                      │                
                                      ▼                
                                 3. Submit             
                                    Quotation          
                                      │                
          ◀─────────────────────────────               
          │                                            
          ▼                                            
  4. Compare Quotes                                    
     (side-by-side)                                    
          │                                            
          ▼                                            
  5. Select Winner  ─────────────────────────────────▶ 6. Approve / Reject
                                                             │
          ◀────────────────────────────────────────────────  │
          │                                                   
          ▼                                                   
  7. Generate PO ────────────▶  Vendor sees PO               
                                in their portal              
          │                                                   
          ▼                                                   
  8. Generate Invoice                                         
     (GST split, PDF)                                         
          │                                                   
          ▼                                                   
  9. Send via Email                                           
     or Download PDF                                          
          │                                                   
          ▼                                                   
 10. Mark as PAID ──────────▶  Activity Log updated
```

---

## ✦ Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                        FRONTEND  (Vite + React 19)                │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Zustand │  │ TanStack │  │ React    │  │  socket.io-client│  │
│  │  Auth    │  │ Query v5 │  │ Router v7│  │  (live events)   │  │
│  │  Store   │  │ (cache)  │  │ + Guards │  │                  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                                   │
│  Layouts: AppLayout · AuthLayout · PrintLayout                    │
│  Pages:   Dashboard · Vendors · RFQs · Quotations · POs ·        │
│           Invoices · Approvals · Reports · Activity               │
└─────────────────────────────┬─────────────────────────────────────┘
                              │  HTTP (Axios + JWT Bearer)
                              │  WS  (Socket.io)
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                     BACKEND  (Express + TypeScript)               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Middleware Layer                          │ │
│  │  authMiddleware (JWT verify) · roleGuard · errorHandler      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Routes → Controllers → Services → Repositories → Prisma         │
│                                                                   │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌─────────────┐  │
│  │  Auth  │ │Vendors │ │  RFQs    │ │Quotes  │ │  Approvals  │  │
│  └────────┘ └────────┘ └──────────┘ └────────┘ └─────────────┘  │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌─────────────┐  │
│  │  POs   │ │Invoice │ │ Reports  │ │  Logs  │ │Notifications│  │
│  └────────┘ └────────┘ └──────────┘ └────────┘ └─────────────┘  │
│                                                                   │
│  ┌──────────────┐  ┌───────────┐  ┌──────────────┐               │
│  │  Puppeteer   │  │Nodemailer │  │  Socket.io   │               │
│  │  (PDF gen)   │  │ (email)   │  │  (realtime)  │               │
│  └──────────────┘  └───────────┘  └──────────────┘               │
└─────────────────────────────┬─────────────────────────────────────┘
                              │  Prisma ORM
                              ▼
                    ┌──────────────────┐
                    │   MySQL 8+        │
                    │  (vendorbridge)   │
                    └──────────────────┘
```

---

## ✦ Tech Stack

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool |
| Tailwind CSS | v4 | Styling |
| React Router | v7 | Routing + Guards |
| Zustand | v5 | Auth state management |
| TanStack Query | v5 | Server state + caching |
| Axios | v1 | HTTP client with JWT interceptor |
| React Hook Form | v7 | Form handling |
| Zod | v4 | Schema validation |
| Socket.io-client | v4 | Real-time events |
| jsPDF + html2canvas | latest | Client-side PDF export |
| Lucide React | v1 | Icons |
| react-hot-toast | v2 | Toast notifications |

### Backend

| Package | Version | Purpose |
|---|---|---|
| Express | v4 | HTTP server |
| TypeScript | v6 | Type safety |
| Prisma | v5 | ORM + migrations |
| MySQL | 8+ | Database |
| jsonwebtoken | v9 | JWT auth |
| bcryptjs | v2 | Password hashing |
| Socket.io | v4 | WebSocket server |
| Nodemailer | v6 | Email dispatch |
| Puppeteer | v25 | Headless PDF generation |
| Zod | v4 | Request validation |

---

## ✦ Repository Structure

> The repo uses a **branch-per-concern** strategy:

| Branch | Contents |
|---|---|
| `main` | Standalone HTML prototype — 1800+ lines, zero dependencies, open in browser |
| `frontend` | Same standalone HTML prototype |
| `Nandini` | **Full-stack source** — `backend/` + `frontend/` |
| `iamdev3011-v1` | Full-stack source + polished `vendorbridge_v3.html` prototype |

### Full-Stack Source (`Nandini` branch)

```
ODOO-x-KSV/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Full MySQL schema (16 models)
│   │   ├── seed.js                # Demo data seeder
│   │   └── seed.ts
│   ├── seed-data/
│   │   ├── users.json             # Pre-seeded users for all 4 roles
│   │   ├── vendors.json
│   │   └── categories.json
│   └── src/
│       ├── config/
│       │   └── prisma.ts          # Prisma client singleton
│       ├── constants/
│       │   └── permissions.ts     # ROLES + PERMISSIONS map
│       ├── controllers/           # Request handlers (thin layer)
│       │   ├── auth.controller.ts
│       │   ├── vendor.controller.ts
│       │   ├── rfq.controller.ts
│       │   ├── quotation.controller.ts
│       │   ├── approval.controller.ts
│       │   ├── po.controller.ts
│       │   ├── invoice.controller.ts
│       │   ├── reports.controller.ts
│       │   ├── notification.controller.ts
│       │   ├── activityLog.controller.ts
│       │   ├── dashboard.controller.ts
│       │   └── lookup.controller.ts
│       ├── services/              # Business logic layer
│       │   ├── auth.service.ts
│       │   ├── vendor.service.ts
│       │   ├── rfq.service.ts
│       │   ├── quotation.service.ts
│       │   ├── approval.service.ts
│       │   ├── po.service.ts
│       │   ├── invoice.service.ts
│       │   ├── pdf.service.ts
│       │   ├── email.service.ts
│       │   ├── reports.service.ts
│       │   ├── notification.service.ts
│       │   └── dashboard.service.ts
│       ├── repositories/          # Prisma data-access layer
│       │   ├── auth.repository.ts
│       │   ├── vendor.repository.ts
│       │   ├── rfq.repository.ts
│       │   ├── quotation.repository.ts
│       │   ├── approval.repository.ts
│       │   ├── po.repository.ts
│       │   ├── invoice.repository.ts
│       │   └── ...
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── vendor.routes.ts
│       │   ├── rfq.routes.ts
│       │   ├── quotation.routes.ts
│       │   ├── approval.routes.ts
│       │   ├── po.routes.ts
│       │   ├── invoice.routes.ts
│       │   ├── reports.routes.ts
│       │   ├── notification.routes.ts
│       │   ├── activityLog.routes.ts
│       │   ├── lookup.routes.ts
│       │   └── my.routes.ts
│       ├── middlewares/
│       │   ├── auth.middleware.ts  # JWT verify
│       │   ├── role.middleware.ts  # Role-based guard
│       │   └── error.middleware.ts # Global error handler
│       ├── validators/             # Zod schemas for all request bodies
│       ├── utils/
│       │   ├── generateToken.ts
│       │   ├── numberGenerator.ts  # Auto-increment RFQ/PO/INV numbers
│       │   ├── formatCurrency.ts
│       │   ├── invoiceHtmlTemplate.ts
│       │   └── exportHelpers.ts
│       ├── websocket/
│       │   └── index.ts           # Socket.io init + broadcastEvent
│       ├── templates/
│       │   └── invoice.html.ts    # Puppeteer invoice template
│       └── server.ts              # Express app entry point
│
└── frontend/
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── layouts/
        │   ├── AppLayout.jsx       # Sidebar + topbar shell
        │   ├── AuthLayout.jsx      # Centered auth wrapper
        │   └── PrintLayout.jsx     # Print-friendly wrapper
        ├── pages/
        │   ├── DashboardPage.jsx
        │   └── auth/
        │       └── LoginPage.jsx
        ├── routes/
        │   ├── App.jsx             # Route definitions
        │   └── guards/
        │       ├── ProtectedRoute.jsx
        │       └── RoleGuard.jsx
        ├── services/
        │   └── auth.service.js
        ├── store/
        │   └── authStore.js        # Zustand auth state
        └── lib/
            ├── axios.js            # Axios instance + JWT interceptor
            ├── queryClient.js      # TanStack Query client
            └── context/
                ├── ThemeContext.jsx
                └── ModalContext.jsx
```

---

## ✦ Quick Start

### Prerequisites

```
Node.js  ≥ 18
MySQL    ≥ 8   (or XAMPP)
npm      ≥ 9
```

### 1 · Clone & checkout the full-stack branch

```bash
git clone https://github.com/nandinirathod2321/ODOO-x-KSV.git
cd ODOO-x-KSV
git checkout Nandini
```

### 2 · Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# → edit DATABASE_URL, JWT_SECRET, SMTP_* in .env

# Run migrations
npx prisma migrate dev --name init

# Seed demo data (all 4 roles + sample vendors)
npm run db:seed

# Start dev server  →  http://localhost:5000
npm run dev
```

> **Tip:** Run `npm run db:studio` to open Prisma Studio and browse your data visually at `http://localhost:5555`

### 3 · Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server  →  http://localhost:5173
npm run dev
```

> The frontend proxies API calls to `http://localhost:5000`. Update `src/lib/axios.js` if your backend port differs.

### 4 · (Optional) Standalone prototype

No backend? No problem.

```bash
# Just open this in any browser — zero dependencies, fully interactive
open main/Frontend.html.html
```

---

## ✦ Environment Variables

`backend/.env` (copy from `.env.example`):

```env
# ── Server ──────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ────────────────────────────────────────
# Local MySQL with password
DATABASE_URL="mysql://root:password@localhost:3306/vendorbridge"

# XAMPP (no password)
# DATABASE_URL="mysql://root@localhost:3306/vendorbridge"

# Docker
# DATABASE_URL="mysql://root:password@db:3306/vendorbridge"

# ── Auth ────────────────────────────────────────────
JWT_SECRET="replace_with_a_long_random_secret"
JWT_EXPIRES_IN="24h"

# ── Email (use Mailtrap for dev) ─────────────────────
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
```

---

## ✦ API Reference

All endpoints are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Auth  `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user |
| `POST` | `/login` | Public | Login, returns JWT |
| `POST` | `/forgot-password` | Public | Send OTP reset email |
| `POST` | `/reset-password` | Public | Reset password with OTP |
| `GET` | `/me` | Auth | Get current user profile |

### Vendors  `/api/vendors`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Officer · Manager · Admin | List vendors (search, filter, paginate) |
| `POST` | `/` | Officer · Admin | Create vendor |
| `GET` | `/:id` | Officer · Manager · Admin | Get vendor by ID |
| `PATCH` | `/:id` | Officer · Admin | Update vendor |
| `DELETE` | `/:id` | Admin | Delete vendor |
| `GET` | `/:id/performance` | Officer · Manager · Admin | Vendor performance metrics |
| `GET` | `/:id/rfqs` | Officer · Manager · Admin | RFQs assigned to vendor |
| `GET` | `/:id/quotations` | Officer · Manager · Admin | All quotations by vendor |
| `GET` | `/:id/purchase-orders` | Officer · Manager · Admin | All POs for vendor |

### RFQs  `/api/rfqs`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | All roles | List RFQs (vendors see only their invites) |
| `POST` | `/` | Officer · Admin | Create RFQ with items |
| `GET` | `/:id` | Auth | Get RFQ detail |
| `PATCH` | `/:id` | Officer · Admin | Update RFQ |
| `PATCH` | `/:id/publish` | Officer · Admin | Publish RFQ to invited vendors |
| `PATCH` | `/:id/close` | Officer · Admin | Close RFQ |
| `DELETE` | `/:id` | Admin | Delete RFQ |

### Quotations  `/api/quotations`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Officer · Manager · Admin | List all quotations |
| `GET` | `/compare/:rfqId` | Officer · Manager · Admin | Side-by-side comparison for an RFQ |
| `GET` | `/:id` | Auth | Get quotation detail |
| `POST` | `/` | Vendor | Submit quotation |
| `PATCH` | `/:id` | Vendor | Update quotation |
| `PATCH` | `/:id/select-winner` | Officer · Admin | Mark quotation as winner |

### Approvals  `/api/approvals`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Manager · Admin | List approval requests |
| `GET` | `/:id` | Manager · Admin | Get approval detail |
| `PATCH` | `/:id/approve` | Manager | Approve request |
| `PATCH` | `/:id/reject` | Manager | Reject request |

### Purchase Orders  `/api/pos`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Officer · Manager · Admin | List all POs |
| `GET` | `/:id` | Auth | Get PO detail |

### Invoices  `/api/invoices`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Officer · Admin | List invoices |
| `POST` | `/generate` | Officer · Admin | Generate invoice from PO (GST split) |
| `GET` | `/:id` | Officer · Admin · Vendor | Get invoice detail |
| `PATCH` | `/:id/mark-paid` | Officer · Admin | Mark invoice as paid |
| `GET` | `/:id/pdf` | Officer · Admin · Vendor | Download invoice as PDF |
| `POST` | `/:id/send-email` | Officer · Admin | Email invoice to vendor |

### Reports  `/api/reports`  *(Admin · Manager only)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/vendor-performance` | Per-vendor performance stats |
| `GET` | `/spending-summary` | Spend by category |
| `GET` | `/monthly-trends` | Month-over-month trends |
| `GET` | `/procurement-stats` | Overall procurement KPIs |
| `GET` | `/export` | Export report as CSV/Excel |

### Notifications  `/api/notifications`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get all notifications for current user |
| `PATCH` | `/:id/read` | Mark notification as read |
| `PATCH` | `/read-all` | Mark all as read |

### Other

| Path | Description |
|---|---|
| `GET /api/health` | Server health check |
| `GET /api/lookups` | Dropdown data (categories, statuses) |
| `GET /api/my/*` | Vendor self-service routes |
| `GET /api/activity-logs` | Audit log (Admin) |

---

## ✦ Database Schema

16 models covering the complete procurement domain:

```
User ──────────────── ActivityLog
 │                    Notification
 │                    PasswordResetOTP
 │
 └── Vendor ────────── VendorCategory
          │
          ├── RFQVendor ◄──── RFQ ──── RFQItem
          │                    │
          ├── Quotation ◄──────┘        QuotationItem
          │        │
          │        ├── Approval
          │        │       │
          │        └── PurchaseOrder ── POItem
          │                  │
          └── Invoice ◄──────┘          InvoiceItem
```

### Key model fields

**RFQ**
```
rfqNumber  · title  · description  · deadline
status: DRAFT | PUBLISHED | QUOTATION_RECEIVED | AWARDED | CLOSED | CANCELLED
```

**Quotation**
```
quotationNumber  · deliveryDays  · validityDate  · paymentTerms
totalAmount  · status: SUBMITTED | UNDER_REVIEW | ACCEPTED | REJECTED
isWinner: Boolean
```

**PurchaseOrder**
```
poNumber  · totalAmount  · deliveryDeadline  · termsAndConditions
status: ISSUED | ACKNOWLEDGED | PARTIAL_DELIVERY | DELIVERED | CLOSED
```

**Invoice**
```
invoiceNumber  · invoiceDate  · dueDate
subtotal  · cgstAmount  · sgstAmount  · igstAmount  · grandTotal
status: PENDING | PAID | OVERDUE | CANCELLED
```

---

## ✦ Roles & Permissions

```
ADMIN              ─── Full access (*)
                   
MANAGER            ─── view_dashboard
                       view_vendors · view_rfqs · view_quotations
                       approve_request · reject_request
                       view_pos · view_invoices
                       view_reports · view_activity_logs
                   
PROCUREMENT_OFFICER ── view_dashboard
                       create_rfq · update_rfq · publish_rfq · close_rfq
                       view_vendors · manage_vendors
                       view_quotations · compare_quotations · select_winner
                       create_po
                       generate_invoice · send_invoice_email
                   
VENDOR             ─── view_rfqs (own invites only)
                       submit_quotation · update_quotation
                       view_own_pos · view_own_invoices
```

---

## ✦ Demo Credentials

Pre-seeded by `npm run db:seed`:

| Role | Email | Password |
|---|---|---|
| 🔧 Procurement Officer | `officer@vendorbridge.com` | `officer123` |
| ✅ Manager / Approver | `manager@vendorbridge.com` | `manager123` |
| 🏢 Vendor | `vendor@vendorbridge.com` | `vendor123` |
| ⚙️ Admin | `admin@vendorbridge.com` | `admin123` |

---

## ✦ Scripts Reference

### Backend

```bash
npm run dev          # Start dev server with --watch (port 5000)
npm run start        # Start production server
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed all demo data
npm run db:studio    # Open Prisma Studio (port 5555)
```

### Frontend

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
```

---

## ✦ Team

Built with ☕ and zero sleep at **Odoo × KSV Hackathon 2026**.

| | Name | Role | GitHub |
|---|---|---|---|
| 🧠 | Nandini Rathod | Backend + Architecture | [@nandinirathod2321](https://github.com/nandinirathod2321) |
| 🎨 | Dev | Frontend | [@iamdev3011](https://github.com/iamdev3011) |
| ⚡ | Vraj Talati | Full Stack + AI Integration | [@GalacticVraj](https://github.com/GalacticVraj) |

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:15803d,100:16a34a&height=100&section=footer" width="100%"/>

*If this saved your procurement headaches, leave a ⭐*

</div>
