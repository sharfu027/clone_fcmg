# Enterprise FMCG Distribution ERP System

A production-grade, enterprise-scale FMCG Distribution Resource Planning (ERP) platform built with a modern full-stack architecture.

## Repository Structure

```text
.
├── frontend/             # React 19 + TypeScript + Vite Enterprise Web App
│   ├── src/              # Feature-based ERP modules & shared components
│   ├── public/           # Static assets & web manifest
│   ├── package.json      # Dependencies & scripts
│   ├── vite.config.ts    # Vite build configuration
│   └── tsconfig.json     # TypeScript strict configuration
│
├── backend/              # ASP.NET Core 9 Clean Architecture & Web API (Coming Soon)
│
├── docs/                 # System Architecture, API Contracts & User Guides
│
├── scripts/              # CI/CD, Deployment & Local Environment Utilities
│
├── LICENSE               # Enterprise License Agreement
└── README.md             # Project Overview & Getting Started Guide
```

---

## 1. Frontend Web Client (`/frontend`)

The frontend application is built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**, providing a hyper-responsive, policy-driven enterprise interface.

### Features & Completed Modules
1. **Authentication & Security Center (IAM v16.3)**: Policy-Driven multi-factor authentication, Biometrics, Geofencing, Device Control, Password Rules, and Security Profiles.
2. **Master Data Engine**: 12 core FMCG entities (Companies, Branches, Departments, Employees, Customers, Suppliers, Products, Warehouses).
3. **Pricing & Promotions Engine**: Price Lists, Volume Discounts, Customer-Specific Pricing, Promotion Rules, Taxes (GST/VAT).
4. **Procurement & Sourcing**: PRs, RFQs, POs, GRN Receiving, 3-Way Invoice Matching, Vendor Returns.
5. **Warehouse Management System (WMS)**: Zone/Bin Hierarchy, Putaway Optimization, Wave Picking, Packing Staging.
6. **Inventory Control**: FEFO Expiry Tracking, FIFO Valuation, Stock Adjustments, Cycle Counting.
7. **Sales Force Automation (SFA)**: Beat Planning, GPS Store Visits, Live Order Booking, DCR Collections.
8. **Order-to-Cash (O2C)**: Quotations, Sales Orders, Tax Invoicing, Delivery Challans, Customer Sub-ledgers.
9. **Returns Management**: RMA Authorization, Damage Classification, Disposition Routing, RTV.
10. **Finance (AR/AP)**: Accounts Receivable, Accounts Payable, Payment Allocation, 5-Tier Aging, Ledger.
11. **Approval Workflow Engine**: Reusable multi-level approval designer, SLA Routing, Delegations.
12. **HRMS Portal**: Employee Roster, Attendance Tracking, Leave Approvals.
13. **CRM & Customer Service**: Customer 360, Complaints, SLA Service Tickets.
14. **Logistics & Delivery**: Fleet Management, Route Optimization, Proof of Delivery (POD).
15. **Reports & Document Engine**: Dynamic Query Builder, Print-Ready Document Renderer.
16. **Administration & System Settings**: Security Policies, Number Series Rules, Audit Trails.
17. **Executive Business Intelligence (BI)**: Executive Dashboards, Sales Analytics, Financial KPI Cards.

### Quick Start (Frontend)

```bash
# Navigate to the frontend workspace
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev

# Run TypeScript compilation check
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## 2. Backend API Services (`/backend`) — Coming Soon

The upcoming backend layer will be built with **ASP.NET Core 9 (C#)** using **Clean Architecture** & **MediatR CQRS**:

- **Domain Layer**: Core FMCG domain entities, value objects, and domain events.
- **Application Layer**: Use cases, CQRS commands/queries, MediatR handlers, and FluentValidation.
- **Infrastructure Layer**: EF Core 9, PostgreSQL DB Provider, Redis Caching, SignalR Hubs.
- **API Layer**: ASP.NET Core REST APIs, OpenApi / Swagger specifications, JWT & OAuth2 middleware.

---

## 3. Documentation (`/docs`)

Architecture design documents, ERD schemas, and API specifications are stored in the `/docs` folder.

---

## 4. Environment & Deployment Scripts (`/scripts`)

Automation scripts for local setup, Docker Compose deployment, and CI/CD pipelines are located in `/scripts`.
