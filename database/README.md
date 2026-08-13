# INK FMCG Enterprise ERP — Database Project

Dedicated, version-controlled PostgreSQL database architecture project for the INK FMCG Enterprise ERP platform.

---

## 1. Purpose & Scope

This project serves as the single source of truth for the database architecture, schema DDLs, ERD diagrams, version-controlled migrations, reference data seeds, and maintenance scripts for the INK FMCG Enterprise ERP system.

---

## 2. Directory Structure & Responsibilities

```text
database/
├── README.md                 # Master Database Project Overview
├── architecture_blueprint.md # Official Enterprise Database Architecture Blueprint Specification
├── diagrams/                 # Visual ERD diagrams, physical data models, and Mermaid charts
├── schema/                   # DDL table creation scripts organized by domain schema
├── seeds/                    # Reference master data & development seed scripts
├── migrations/               # Version-controlled sequential SQL schema migration scripts
├── functions/                # PostgreSQL PL/pgSQL functions and stored expressions
├── views/                    # Standard SQL views and materialized reporting projections
├── triggers/                 # Automated audit and timestamp database triggers
├── procedures/               # Transactional stored procedures for batch processing
├── backups/                  # Backup policies, restore scripts, and PITR guidelines
└── scripts/                  # Database health diagnostics and index vacuuming utilities
```

---

## 3. Database & Naming Conventions

### PostgreSQL Conventions
- **Database Engine**: PostgreSQL 16+
- **Naming Standard**: `snake_case` for all schemas, tables, columns, indexes, foreign keys, and constraints.
- **Primary Keys**: `UUID v4` (`uuid_generate_v4()` / `gen_random_uuid()`) named `id` across all entities.
- **Audit Columns**: Every table must include `created_at` (TIMESTAMPTZ) and `last_modified_at` (TIMESTAMPTZ).
- **Foreign Keys**: `fk_<source_table>_<target_table>_<column>` with explicit index creation (`idx_<table_name>_<column_name>`).
- **Table Names**: Pluralized `snake_case` (e.g. `user_accounts`, `sales_orders`, `purchase_orders`).

---

## 4. PostgreSQL Architecture & Schema Organization

The enterprise database is logically segregated into domain schemas:

| Schema Name | Enterprise ERP Domain Module Boundary |
| :--- | :--- |
| `iam` | Authentication, Security Policies, Security Profiles, Overrides, Exceptions, Devices |
| `master` | Master Data Entities (Companies, Branches, Departments, Employees, Customers, Suppliers) |
| `pricing` | Price Lists, Customer Pricing, Discount Rules, Tax Configurations |
| `procurement` | Purchase Requisitions, RFQs, Purchase Orders, GRNs, Vendor Invoices |
| `warehouse` | WMS Storage Hierarchy (Zones, Aisles, Racks, Bins), Putaway & Picking Waves |
| `inventory` | Stock Master, FEFO Expiry Tracking, Adjustments, Cycle Counting |
| `sfa` | Beat & Territory Planning, GPS Check-ins, Field Orders, DCR Collections |
| `o2c` | Sales Orders, Quotations, GST Invoicing, Delivery Challans, Credit Notes |
| `returns` | Sales Returns (RMA), Supplier Returns (RTV), QC Inspections |
| `finance` | Accounts Receivable (AR), Accounts Payable (AP), General Ledger |
| `workflow` | Approval Matrix, Multi-level Routing Rules, Delegations |
| `hrms` | Employee Roster, Attendance Logs, Leave Approvals |
| `crm` | Customer 360, Complaints, Service Tickets |
| `logistics` | Fleet Vehicles, Delivery Routes, Proof of Delivery (POD) |
| `reports` | Reporting Configurations & Document Templates |
| `admin` | System Settings, Number Series Rules, Audit Trails |
| `bi` | Executive BI Snapshots, Analytics Projections |

---

## 5. Development & Production Workflow

### Development Workflow
1. Schema changes are designed visually in `diagrams/` and defined in DDL files under `schema/`.
2. Migration scripts are generated in `migrations/` following sequential versioning.
3. Seed scripts in `seeds/` load initial reference configurations and local mock datasets.

### Migration Strategy
- Migration scripts follow the naming format: `V<Version>__<Timestamp>_<ShortDescription>.sql` (e.g. `V1.0.0__20260724_InitialSchema.sql`).
- Executed idempotently using EF Core Migrations or database migration engines.

### Backup & PITR Strategy
- Daily automated `pg_dump` binary backups saved to isolated cloud storage.
- WAL (Write-Ahead Logging) archiving enabled for 30-day Point-in-Time Recovery (PITR).
