# VendorBridge ERP System

> A full-stack B2B procurement ERP — RFQ management, vendor comparison, approvals, POs, invoicing, and activity tracking.

---

## 🗂️ Project Structure

```
ODOO-x-KSV/
├── backend/          # Node.js + TypeScript + Express + Prisma (SQLite)
├── frontend/         # React + Vite + Zustand
├── README.md         # This file
└── VERCEL.md         # Deployment guide (Vercel + Railway/Render)
```

---

## ⚡ Quick Start (Clone → Run in 4 steps)

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- npm 9+
- Git

### 1. Clone the repo
```bash
git clone https://github.com/nandinirathod2321/ODOO-x-KSV.git
cd ODOO-x-KSV
```

### 2. Set up the Backend
```bash
cd backend

# Copy environment config
cp .env.example .env

# Install, create DB, seed demo data — one command
npm run setup
```

### 3. Start the Backend
```bash
npm run dev
# Runs on http://localhost:8000
```

### 4. Set up & Start the Frontend
```bash
# Open a new terminal tab
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser. Done! ✅

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@vendorbridge.com` | `admin123` |
| **Manager** | `manager@vendorbridge.com` | `manager123` |
| **Procurement Officer** | `officer@vendorbridge.com` | `officer123` |
| **Vendor** | `vendor@vendorbridge.com` | `vendor123` |

---

## ✨ Features

| Module | Roles |
|--------|-------|
| **Dashboard** — live stats, charts, recent activity | All |
| **RFQ Management** — create, publish, close RFQs with line items | Admin, Procurement |
| **Vendor Quotations** — submit bids, itemised pricing with GST | Vendor |
| **Quotation Comparison** — side-by-side table, AI recommendation | Admin, Procurement |
| **Approvals** — L1/L2 manager approval workflow with remarks | Manager |
| **Purchase Orders** — auto-generated POs with professional PDF | All |
| **Invoices** — TAX INVOICE with CGST/SGST/IGST breakdown, PDF | All |
| **Vendor Registry** — CRUD with GSTIN, rating, category | Admin, Procurement |
| **Reports** — spend analytics, vendor performance | Admin, Manager |
| **Activity Log** — full audit trail of all actions | Admin, Manager |
| **Email** — Gmail composer auto-opens with pre-filled templates | All |

---

## 🛠 Backend Scripts

```bash
npm run dev          # Build TypeScript + watch mode
npm run build        # TypeScript compile only
npm run start        # Run compiled dist/server.js
npm run setup        # Install + DB push + seed (first-time setup)
npm run db:push      # Sync schema to SQLite (no data loss)
npm run db:seed      # Re-seed demo data
npm run db:reset     # Wipe DB + re-seed from scratch
npm run db:studio    # Open Prisma Studio (DB browser)
```

---

## 🗄 Backend Architecture

```
backend/src/
├── config/          # Prisma client singleton
├── constants/       # Role definitions and permissions
├── controllers/     # Request handlers (thin layer)
├── middlewares/     # Auth, Role guard, Error handler
├── repositories/    # Raw DB queries (Prisma)
├── routes/          # Express route definitions
├── services/        # Business logic
├── templates/       # HTML templates (invoice PDF)
├── types/           # TypeScript types
├── utils/           # Helpers (response format, numbers, etc.)
├── validators/      # Zod schemas
└── websocket/       # Socket.io real-time events
```

---

## 🌐 Frontend Architecture

```
frontend/src/
├── layouts/         # AppLayout, AuthLayout, PrintLayout
├── lib/             # Axios instance, styles, contexts, queryClient
├── pages/           # One file per page/module
├── routes/          # App router + role guards
├── services/        # API call wrappers per module
├── store/           # Zustand auth store
└── utils/           # Constants, config
```

---

## 🚀 Deploy to Production

See [VERCEL.md](./VERCEL.md) for step-by-step deployment to **Vercel** (frontend) + **Railway** (backend).

---

## 🧑‍💻 Tech Stack

**Backend:** Node.js · TypeScript · Express · Prisma ORM · SQLite · Socket.io · JWT · Zod · Puppeteer  
**Frontend:** React 19 · Vite · React Router · Zustand · Axios · React Query · html2canvas · jsPDF
