-- =============================================================================
-- INK FMCG ENTERPRISE ERP — ENTERPRISE FINANCE SCHEMAS (v2.0 REFINED)
-- File Name      : finance_schema.sql
-- Target Database: PostgreSQL 16+
-- Schema Owner   : finance
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS finance;

-- =============================================================================
-- SECTION 1 — LOOKUP TABLES
-- =============================================================================

-- 1.1 Account Types
CREATE TABLE finance.account_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_account_types_code UNIQUE (code),
    CONSTRAINT chk_account_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE finance.account_types IS 
    '[LOOKUP] Asset, Liability, Equity, Revenue, Expense categories.';

-- 1.2 Account Groups
CREATE TABLE finance.account_groups (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_account_groups_code UNIQUE (code),
    CONSTRAINT chk_account_groups_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE finance.account_groups IS 
    '[LOOKUP] Account groupings like Current Assets, Operating Expenses, Long-Term Debt.';

-- 1.3 Journal Statuses
CREATE TABLE finance.journal_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_journal_statuses_code UNIQUE (code),
    CONSTRAINT chk_journal_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE finance.journal_statuses IS 
    '[LOOKUP] Journal review states: DRAFT, POSTING_PENDING, POSTED, CANCELLED.';

-- 1.4 Invoice Statuses
CREATE TABLE finance.invoice_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_invoice_statuses_code UNIQUE (code),
    CONSTRAINT chk_invoice_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE finance.invoice_statuses IS 
    '[LOOKUP] AR/AP states: DRAFT, APPROVED, SENT, PAID, PARTIALLY_PAID, VOID.';

-- 1.5 Currency Statuses
CREATE TABLE finance.currency_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_currency_statuses_code UNIQUE (code),
    CONSTRAINT chk_currency_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE finance.currency_statuses IS 
    '[LOOKUP] Active states for multi-currency registries.';

-- 1.6 Period Statuses
CREATE TABLE finance.period_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_period_statuses_code UNIQUE (code),
    CONSTRAINT chk_period_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE finance.period_statuses IS 
    '[LOOKUP] Close check statuses: OPEN, SOFT_CLOSED, HARD_CLOSED, AUDIT_LOCKED.';

-- =============================================================================
-- SECTION 2 — CHART OF ACCOUNTS & FOUNDATIONS
-- =============================================================================

-- 2.1 Currencies
CREATE TABLE finance.currencies (
    id                 UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    currency_code      CHAR(3)      NOT NULL,
    currency_name      VARCHAR(100) NOT NULL,
    currency_status_id UUID         NOT NULL REFERENCES finance.currency_statuses(id),

    CONSTRAINT uq_currencies_code UNIQUE (currency_code)
);

COMMENT ON TABLE finance.currencies IS 
    '[FOUNDATION] Currency codes registry conforming to ISO 4217 specifications.';

-- 2.2 Exchange Rates (Refined with Provider & Approvals)
CREATE TABLE finance.exchange_rates (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    from_currency_id     UUID          NOT NULL REFERENCES finance.currencies(id) ON DELETE CASCADE,
    to_currency_id       UUID          NOT NULL REFERENCES finance.currencies(id) ON DELETE CASCADE,
    rate_date            DATE          NOT NULL,
    rate                 NUMERIC(18,6) NOT NULL,
    
    -- v2.0 Extensions
    source_provider      VARCHAR(100)  NOT NULL DEFAULT 'MANUAL',
    imported_time        TIMESTAMPTZ,
    approved_by_user_id  UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    approved_at_utc      TIMESTAMPTZ,
    is_manual_override   BOOLEAN       NOT NULL DEFAULT FALSE,
    effective_timestamp  TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_exchange_rate UNIQUE (from_currency_id, to_currency_id, rate_date),
    CONSTRAINT chk_exch_rate CHECK (rate > 0.000000)
);

COMMENT ON TABLE finance.exchange_rates IS 
    '[FOUNDATION] Conversion rates registry with audit indicators mapping values to day keys.';

-- 2.3 Fiscal Years
CREATE TABLE finance.fiscal_years (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    year_name      VARCHAR(50)  NOT NULL,
    start_date     DATE         NOT NULL,
    end_date       DATE         NOT NULL,
    is_closed      BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_fiscal_year_name UNIQUE (year_name),
    CONSTRAINT chk_fiscal_year_dates CHECK (end_date >= start_date)
);

COMMENT ON TABLE finance.fiscal_years IS 
    '[FOUNDATION] Closed bookkeeping calendars.';

-- 2.4 Accounting Periods
CREATE TABLE finance.accounting_periods (
    id                 UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    fiscal_year_id     UUID         NOT NULL REFERENCES finance.fiscal_years(id) ON DELETE CASCADE,
    period_name        VARCHAR(50)  NOT NULL,
    period_number      INT          NOT NULL,
    start_date         DATE         NOT NULL,
    end_date           DATE         NOT NULL,
    period_status_id   UUID         NOT NULL REFERENCES finance.period_statuses(id),

    CONSTRAINT uq_accounting_period UNIQUE (fiscal_year_id, period_number),
    CONSTRAINT chk_period_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_period_num CHECK (period_number BETWEEN 1 AND 13)
);

COMMENT ON TABLE finance.accounting_periods IS 
    '[FOUNDATION] Sub-divisions of fiscal years verifying period lock checks.';

-- 2.5 Cost Centers
CREATE TABLE finance.cost_centers (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    company_id     UUID         NOT NULL REFERENCES organization.companies(id),
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_cost_center UNIQUE (company_id, code)
);

COMMENT ON TABLE finance.cost_centers IS 
    '[FOUNDATION] Cost segments grouping expenses.';

-- 2.6 Profit Centers
CREATE TABLE finance.profit_centers (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    company_id     UUID         NOT NULL REFERENCES organization.companies(id),
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_profit_center UNIQUE (company_id, code)
);

COMMENT ON TABLE finance.profit_centers IS 
    '[FOUNDATION] Profitability tracking dimensions.';

-- 2.7 Chart of Accounts
CREATE TABLE finance.chart_of_accounts (
    id                 UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    account_code       VARCHAR(50)  NOT NULL,
    account_name       VARCHAR(150) NOT NULL,
    account_type_id    UUID         NOT NULL REFERENCES finance.account_types(id),
    account_group_id   UUID         NOT NULL REFERENCES finance.account_groups(id),
    parent_account_id  UUID         REFERENCES finance.chart_of_accounts(id) ON DELETE SET NULL,
    
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    is_reconciliation  BOOLEAN      NOT NULL DEFAULT FALSE, -- Mapped control accounts (AR/AP control)
    
    -- Concurrency and Auditing
    row_version        INT          NOT NULL DEFAULT 1,
    created_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    is_deleted         BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_coa_code UNIQUE (account_code)
);

COMMENT ON TABLE finance.chart_of_accounts IS 
    '[FOUNDATION] Global General Ledger accounts defining reconciliation boundaries.';

-- =============================================================================
-- SECTION 3 — GENERAL LEDGER & DOUBLE ENTRY
-- =============================================================================

-- 3.1 Posting Batches
CREATE TABLE finance.posting_batches (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    batch_number   VARCHAR(50)  NOT NULL,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    posted_at_utc  TIMESTAMPTZ,
    posted_by_user_id UUID      REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_posting_batch UNIQUE (batch_number)
);

COMMENT ON TABLE finance.posting_batches IS 
    '[OPERATIONAL] Groupings of journals posted to the GL ledger.';

-- 3.2 Journal Headers
CREATE TABLE finance.journal_headers (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    journal_number         VARCHAR(50)   NOT NULL,
    journal_date           DATE          NOT NULL,
    accounting_period_id   UUID          NOT NULL REFERENCES finance.accounting_periods(id),
    currency_id            UUID          NOT NULL REFERENCES finance.currencies(id),
    exchange_rate          NUMERIC(18,6) NOT NULL DEFAULT 1.000000,
    posting_batch_id       UUID          REFERENCES finance.posting_batches(id) ON DELETE SET NULL,
    journal_status_id      UUID          NOT NULL REFERENCES finance.journal_statuses(id),
    
    is_recurring           BOOLEAN       NOT NULL DEFAULT FALSE,
    is_reversing           BOOLEAN       NOT NULL DEFAULT FALSE,
    reversal_date          DATE,
    reversal_journal_id    UUID          REFERENCES finance.journal_headers(id) ON DELETE SET NULL,
    
    approved_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    approved_at_utc        TIMESTAMPTZ,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_journal_header UNIQUE (journal_number),
    CONSTRAINT chk_journal_reversal CHECK (is_reversing = FALSE OR (is_reversing = TRUE AND reversal_date IS NOT NULL))
);

COMMENT ON TABLE finance.journal_headers IS 
    '[OPERATIONAL] Journal entry headers tracking approval milestones, currencies, and reversals.';

-- 3.3 Journal Lines
CREATE TABLE finance.journal_lines (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    journal_header_id    UUID          NOT NULL REFERENCES finance.journal_headers(id) ON DELETE CASCADE,
    chart_of_accounts_id UUID          NOT NULL REFERENCES finance.chart_of_accounts(id),
    
    debit_amount         NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    credit_amount        NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    debit_amount_base    NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    credit_amount_base   NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    
    cost_center_id       UUID          REFERENCES finance.cost_centers(id) ON DELETE SET NULL,
    profit_center_id     UUID          REFERENCES finance.profit_centers(id) ON DELETE SET NULL,
    line_description     TEXT,

    CONSTRAINT chk_journal_line_debit_credit CHECK (
        (debit_amount >= 0.0000 AND credit_amount = 0.0000) OR 
        (credit_amount >= 0.0000 AND debit_amount = 0.0000)
    ),
    CONSTRAINT chk_journal_line_base CHECK (
        (debit_amount_base >= 0.0000 AND credit_amount_base = 0.0000) OR 
        (credit_amount_base >= 0.0000 AND debit_amount_base = 0.0000)
    )
);

COMMENT ON TABLE finance.journal_lines IS 
    '[OPERATIONAL] Journal entry lines matching base and functional values.';

-- 3.4 Ledger Balances (Aggregated historical cache)
CREATE TABLE finance.ledger_balances (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    accounting_period_id UUID          NOT NULL REFERENCES finance.accounting_periods(id) ON DELETE CASCADE,
    chart_of_accounts_id UUID          NOT NULL REFERENCES finance.chart_of_accounts(id) ON DELETE CASCADE,
    cost_center_id       UUID          NOT NULL REFERENCES finance.cost_centers(id) ON DELETE CASCADE,
    
    opening_balance      NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    debit_turnover       NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    credit_turnover      NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    closing_balance      NUMERIC(18,4) GENERATED ALWAYS AS (opening_balance + debit_turnover - credit_turnover) STORED,

    CONSTRAINT uq_ledger_balance UNIQUE (accounting_period_id, chart_of_accounts_id, cost_center_id),
    CONSTRAINT chk_ledger_debit CHECK (debit_turnover >= 0.0000),
    CONSTRAINT chk_ledger_credit CHECK (credit_turnover >= 0.0000)
);

COMMENT ON TABLE finance.ledger_balances IS 
    '[OPERATIONAL] Aggregated periodic summaries of account balances.';

-- =============================================================================
-- SECTION 4 — ACCOUNTS RECEIVABLE (AR)
-- =============================================================================

-- 4.1 Customer Invoices
CREATE TABLE finance.customer_invoices (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    invoice_number       VARCHAR(50)   NOT NULL,
    company_id           UUID          NOT NULL REFERENCES organization.companies(id),
    customer_id          UUID          NOT NULL REFERENCES customer.customers(id),
    invoice_date         DATE          NOT NULL,
    due_date             DATE          NOT NULL,
    accounting_period_id UUID          NOT NULL REFERENCES finance.accounting_periods(id),
    currency_id          UUID          NOT NULL REFERENCES finance.currencies(id),
    exchange_rate        NUMERIC(18,6) NOT NULL DEFAULT 1.000000,
    invoice_status_id    UUID          NOT NULL REFERENCES finance.invoice_statuses(id),
    
    subtotal_amount      NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    tax_amount           NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    discount_amount      NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    total_amount         NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    paid_amount          NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    outstanding_amount   NUMERIC(18,4) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    
    sales_order_id       UUID          REFERENCES sales.sales_orders(id) ON DELETE SET NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_cust_invoice_number UNIQUE (invoice_number),
    CONSTRAINT chk_cust_invoice_dates CHECK (due_date >= invoice_date),
    CONSTRAINT chk_cust_invoice_tot CHECK (total_amount >= 0.0000),
    CONSTRAINT chk_cust_invoice_paid CHECK (paid_amount >= 0.0000 AND paid_amount <= total_amount)
);

COMMENT ON TABLE finance.customer_invoices IS 
    '[OPERATIONAL] Outbound customer invoices tracking totals, paid amounts, and sales links.';

-- 4.2 Customer Invoice Lines
CREATE TABLE finance.customer_invoice_lines (
    id                  UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_invoice_id UUID          NOT NULL REFERENCES finance.customer_invoices(id) ON DELETE CASCADE,
    product_id          UUID          NOT NULL REFERENCES product.products(id),
    quantity            NUMERIC(18,4) NOT NULL,
    unit_price          NUMERIC(18,4) NOT NULL,
    tax_rate_pct        NUMERIC(5,2)  NOT NULL,
    line_total          NUMERIC(18,4) NOT NULL,

    CONSTRAINT chk_cust_inv_qty CHECK (quantity > 0.0000),
    CONSTRAINT chk_cust_inv_price CHECK (unit_price >= 0.0000),
    CONSTRAINT chk_cust_inv_tax CHECK (tax_rate_pct >= 0.00)
);

COMMENT ON TABLE finance.customer_invoice_lines IS 
    '[OPERATIONAL] Line items on customer invoices.';

-- 4.3 Customer Receipts
CREATE TABLE finance.customer_receipts (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    receipt_number     VARCHAR(50)   NOT NULL,
    customer_id        UUID          NOT NULL REFERENCES customer.customers(id),
    receipt_date       DATE          NOT NULL,
    payment_method     VARCHAR(50)   NOT NULL, -- BANK_TRANSFER, CASH, CHEQUE
    currency_id        UUID          NOT NULL REFERENCES finance.currencies(id),
    amount             NUMERIC(18,4) NOT NULL,
    unapplied_amount   NUMERIC(18,4) NOT NULL,

    CONSTRAINT uq_receipt_number UNIQUE (receipt_number),
    CONSTRAINT chk_receipt_amt CHECK (amount > 0.0000),
    CONSTRAINT chk_receipt_unapplied CHECK (unapplied_amount >= 0.0000 AND unapplied_amount <= amount)
);

COMMENT ON TABLE finance.customer_receipts IS 
    '[OPERATIONAL] Incoming payment receipts registry.';

-- 4.4 Receipt Applications
CREATE TABLE finance.receipt_applications (
    id                  UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_receipt_id UUID          NOT NULL REFERENCES finance.customer_receipts(id) ON DELETE CASCADE,
    customer_invoice_id UUID          NOT NULL REFERENCES finance.customer_invoices(id) ON DELETE CASCADE,
    amount_applied      NUMERIC(18,4) NOT NULL,
    applied_date        DATE          NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT chk_receipt_applied CHECK (amount_applied > 0.0000)
);

COMMENT ON TABLE finance.receipt_applications IS 
    '[OPERATIONAL] Matches customer receipts to open invoices.';

-- 4.5 Customer Adjustments (Credit/Debit Notes)
CREATE TABLE finance.customer_adjustments (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    adjustment_number  VARCHAR(50)   NOT NULL,
    adjustment_type    VARCHAR(20)   NOT NULL, -- CREDIT_NOTE, DEBIT_NOTE
    customer_id        UUID          NOT NULL REFERENCES customer.customers(id),
    amount             NUMERIC(18,4) NOT NULL,
    reason             TEXT          NOT NULL,

    CONSTRAINT uq_cust_adj UNIQUE (adjustment_number),
    CONSTRAINT chk_cust_adj_type CHECK (adjustment_type IN ('CREDIT_NOTE', 'DEBIT_NOTE')),
    CONSTRAINT chk_cust_adj_amount CHECK (amount > 0.0000)
);

COMMENT ON TABLE finance.customer_adjustments IS 
    '[OPERATIONAL] Adjustments (credit/debit notes) issued to customers.';

-- =============================================================================
-- SECTION 5 — ACCOUNTS PAYABLE (AP)
-- =============================================================================

-- 5.1 Supplier Bills
CREATE TABLE finance.supplier_bills (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    bill_number          VARCHAR(50)   NOT NULL,
    company_id           UUID          NOT NULL REFERENCES organization.companies(id),
    supplier_id          UUID          NOT NULL REFERENCES supplier.suppliers(id),
    bill_date            DATE          NOT NULL,
    due_date             DATE          NOT NULL,
    currency_id          UUID          NOT NULL REFERENCES finance.currencies(id),
    exchange_rate        NUMERIC(18,6) NOT NULL DEFAULT 1.000000,
    
    total_amount         NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    paid_amount          NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    outstanding_amount   NUMERIC(18,4) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    
    grn_id               UUID          REFERENCES procurement.grns(id) ON DELETE SET NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_supplier_bill UNIQUE (supplier_id, bill_number),
    CONSTRAINT chk_supplier_bill_dates CHECK (due_date >= bill_date),
    CONSTRAINT chk_supplier_bill_tot CHECK (total_amount >= 0.0000),
    CONSTRAINT chk_supplier_bill_paid CHECK (paid_amount >= 0.0000 AND paid_amount <= total_amount)
);

COMMENT ON TABLE finance.supplier_bills IS 
    '[OPERATIONAL] Supplier bills registry tracking totals, GRN references, and payments.';

-- 5.2 Supplier Bill Lines
CREATE TABLE finance.supplier_bill_lines (
    id               UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_bill_id UUID          NOT NULL REFERENCES finance.supplier_bills(id) ON DELETE CASCADE,
    product_id       UUID          NOT NULL REFERENCES product.products(id),
    quantity         NUMERIC(18,4) NOT NULL,
    unit_price       NUMERIC(18,4) NOT NULL,
    line_total       NUMERIC(18,4) NOT NULL,

    CONSTRAINT chk_supp_bill_qty CHECK (quantity > 0.0000),
    CONSTRAINT chk_supp_bill_price CHECK (unit_price >= 0.0000)
);

COMMENT ON TABLE finance.supplier_bill_lines IS 
    '[OPERATIONAL] Line items on supplier bills.';

-- 5.3 Supplier Payments
CREATE TABLE finance.supplier_payments (
    id             UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    payment_number VARCHAR(50)   NOT NULL,
    supplier_id    UUID          NOT NULL REFERENCES supplier.suppliers(id),
    payment_date   DATE          NOT NULL,
    amount         NUMERIC(18,4) NOT NULL,
    payment_method VARCHAR(50)   NOT NULL,

    CONSTRAINT uq_payment_number UNIQUE (payment_number),
    CONSTRAINT chk_payment_amt CHECK (amount > 0.0000)
);

COMMENT ON TABLE finance.supplier_payments IS 
    '[OPERATIONAL] Outgoing supplier payment disbursements.';

-- 5.4 Payment Allocations
CREATE TABLE finance.payment_allocations (
    id                  UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_payment_id UUID          NOT NULL REFERENCES finance.supplier_payments(id) ON DELETE CASCADE,
    supplier_bill_id    UUID          NOT NULL REFERENCES finance.supplier_bills(id) ON DELETE CASCADE,
    amount_allocated    NUMERIC(18,4) NOT NULL,

    CONSTRAINT chk_payment_allocated CHECK (amount_allocated > 0.0000)
);

COMMENT ON TABLE finance.payment_allocations IS 
    '[OPERATIONAL] Matches supplier payments to outstanding bills.';

-- 5.5 Supplier Adjustments (Credit/Debit Notes)
CREATE TABLE finance.supplier_adjustments (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    adjustment_number  VARCHAR(50)   NOT NULL,
    adjustment_type    VARCHAR(20)   NOT NULL, -- CREDIT_NOTE, DEBIT_NOTE
    supplier_id        UUID          NOT NULL REFERENCES supplier.suppliers(id),
    amount             NUMERIC(18,4) NOT NULL,
    reason             TEXT          NOT NULL,

    CONSTRAINT uq_supp_adj UNIQUE (supplier_id, adjustment_number),
    CONSTRAINT chk_supp_adj_type CHECK (adjustment_type IN ('CREDIT_NOTE', 'DEBIT_NOTE')),
    CONSTRAINT chk_supp_adj_amount CHECK (amount > 0.0000)
);

COMMENT ON TABLE finance.supplier_adjustments IS 
    '[OPERATIONAL] Adjustments (credit/debit notes) issued to/by suppliers.';

-- =============================================================================
-- SECTION 6 — BANKING & RECONCILIATION
-- =============================================================================

-- 6.1 Bank Accounts
CREATE TABLE finance.bank_accounts (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    account_number     VARCHAR(50)   NOT NULL,
    bank_name          VARCHAR(100)  NOT NULL,
    branch_name        VARCHAR(100),
    currency_id        UUID          NOT NULL REFERENCES finance.currencies(id),
    current_balance    NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    gl_account_id      UUID          NOT NULL REFERENCES finance.chart_of_accounts(id),

    CONSTRAINT uq_bank_account UNIQUE (account_number)
);

COMMENT ON TABLE finance.bank_accounts IS 
    '[FOUNDATION] Operational bank accounts linked to GL control codes.';

-- 6.2 Bank Transactions
CREATE TABLE finance.bank_transactions (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    bank_account_id    UUID          NOT NULL REFERENCES finance.bank_accounts(id) ON DELETE CASCADE,
    transaction_date   DATE          NOT NULL,
    reference_number   VARCHAR(100),
    debit_amount       NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    credit_amount      NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    is_reconciled      BOOLEAN       NOT NULL DEFAULT FALSE,
    reconciled_date    DATE,

    CONSTRAINT chk_bank_tx_debit_credit CHECK (
        (debit_amount >= 0.0000 AND credit_amount = 0.0000) OR 
        (credit_amount >= 0.0000 AND debit_amount = 0.0000)
    )
);

COMMENT ON TABLE finance.bank_transactions IS 
    '[OPERATIONAL] Bank ledger events matching debits and credits.';

-- 6.3 Bank Statements
CREATE TABLE finance.bank_statements (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    bank_account_id    UUID          NOT NULL REFERENCES finance.bank_accounts(id) ON DELETE CASCADE,
    statement_date     DATE          NOT NULL,
    opening_balance    NUMERIC(18,4) NOT NULL,
    closing_balance    NUMERIC(18,4) NOT NULL
);

COMMENT ON TABLE finance.bank_statements IS 
    '[OPERATIONAL] Headers for imported bank statement documents.';

-- 6.4 Bank Reconciliation Details
CREATE TABLE finance.bank_reconciliation_details (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    bank_statement_id    UUID         NOT NULL REFERENCES finance.bank_statements(id) ON DELETE CASCADE,
    bank_transaction_id  UUID         NOT NULL REFERENCES finance.bank_transactions(id) ON DELETE CASCADE,
    reconciled_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    reconciled_at_utc    TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_bank_recon_match UNIQUE (bank_statement_id, bank_transaction_id)
);

COMMENT ON TABLE finance.bank_reconciliation_details IS 
    '[OPERATIONAL] Reconciliation logs matching transactions to imported statement files.';

-- =============================================================================
-- SECTION 7 — TAX MANAGEMENT (GST/VAT READY)
-- =============================================================================

-- 7.1 Tax Jurisdictions
CREATE TABLE finance.tax_jurisdictions (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,

    CONSTRAINT uq_tax_jurisdiction UNIQUE (code)
);

COMMENT ON TABLE finance.tax_jurisdictions IS 
    '[FOUNDATION] Tax authorities (e.g. State, Federal, Regional levels).';

-- 7.2 Tax Codes
CREATE TABLE finance.tax_codes (
    id                  UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                VARCHAR(50)  NOT NULL,
    name                VARCHAR(100) NOT NULL,
    tax_jurisdiction_id UUID         NOT NULL REFERENCES finance.tax_jurisdictions(id),

    CONSTRAINT uq_tax_code UNIQUE (code)
);

COMMENT ON TABLE finance.tax_codes IS 
    '[FOUNDATION] Tax categories (e.g. GST_18, GST_5, VAT_EXEMPT).';

-- 7.3 Tax Rates
CREATE TABLE finance.tax_rates (
    id                  UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    tax_code_id         UUID         NOT NULL REFERENCES finance.tax_codes(id) ON DELETE CASCADE,
    rate_pct            NUMERIC(5,2) NOT NULL,
    effective_from      DATE         NOT NULL,
    effective_to        DATE,

    CONSTRAINT chk_tax_rate CHECK (rate_pct >= 0.00),
    CONSTRAINT chk_tax_rate_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE finance.tax_rates IS 
    '[FOUNDATION] Tax percentages mapped over timelines.';

-- 7.4 Tax Ledger
CREATE TABLE finance.tax_ledger (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    tax_code_id          UUID          NOT NULL REFERENCES finance.tax_codes(id),
    transaction_type     VARCHAR(20)   NOT NULL, -- INPUT, OUTPUT
    base_amount          NUMERIC(18,4) NOT NULL,
    tax_amount           NUMERIC(18,4) NOT NULL,
    transaction_date     DATE          NOT NULL,
    source_document_type VARCHAR(50)   NOT NULL, -- CUSTOMER_INVOICE, SUPPLIER_BILL
    source_document_id   UUID          NOT NULL,

    CONSTRAINT chk_tax_ledg_type CHECK (transaction_type IN ('INPUT', 'OUTPUT')),
    CONSTRAINT chk_tax_ledg_base CHECK (base_amount >= 0.0000)
);

COMMENT ON TABLE finance.tax_ledger IS 
    '[OPERATIONAL] Consolidated tax reporting logs (input and output tax tracking).';

-- =============================================================================
-- SECTION 8 — FINANCIAL CLOSING
-- =============================================================================

-- 8.1 Period Close Checklist
CREATE TABLE finance.period_close_checklist (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    accounting_period_id UUID         NOT NULL REFERENCES finance.accounting_periods(id) ON DELETE CASCADE,
    task_name            VARCHAR(150) NOT NULL,
    is_completed         BOOLEAN      NOT NULL DEFAULT FALSE,
    completed_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    completed_at_utc     TIMESTAMPTZ,

    CONSTRAINT uq_period_close_task UNIQUE (accounting_period_id, task_name)
);

COMMENT ON TABLE finance.period_close_checklist IS 
    '[OPERATIONAL] Verification checklists before closing a bookkeeping period.';

-- 8.2 Closing Approvals
CREATE TABLE finance.closing_approvals (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    accounting_period_id UUID         NOT NULL REFERENCES finance.accounting_periods(id) ON DELETE CASCADE,
    approver_user_id     UUID         NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    approval_type        VARCHAR(50)  NOT NULL, -- SOFT_CLOSE, HARD_CLOSE, AUDIT_LOCK
    approved_at_utc      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_closing_approval UNIQUE (accounting_period_id, approver_user_id, approval_type)
);

COMMENT ON TABLE finance.closing_approvals IS 
    '[OPERATIONAL] Period close approval signatures.';

-- =============================================================================
-- SECTION 9 — FINANCIAL KPI SNAPSHOTS & HISTORY (REFINED)
-- =============================================================================

CREATE TABLE finance.gl_snapshots (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    recorded_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
    accounting_period_id UUID          NOT NULL REFERENCES finance.accounting_periods(id) ON DELETE CASCADE,
    chart_of_accounts_id UUID          NOT NULL REFERENCES finance.chart_of_accounts(id) ON DELETE CASCADE,
    
    closing_balance      NUMERIC(18,4) NOT NULL,
    
    calculation_version  INT           NOT NULL DEFAULT 1,
    aggregation_period   VARCHAR(50)   NOT NULL DEFAULT 'DAILY', -- DAILY, WEEKLY, MONTHLY
    calculation_source   VARCHAR(100)  NOT NULL DEFAULT 'SYSTEM_BATCH',
    execution_timestamp  TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    created_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_gl_snapshot UNIQUE (recorded_date, chart_of_accounts_id, calculation_version),
    CONSTRAINT chk_gl_snap_calc_ver CHECK (calculation_version >= 1),
    CONSTRAINT chk_gl_snap_period CHECK (aggregation_period IN ('DAILY', 'WEEKLY', 'MONTHLY'))
);

COMMENT ON TABLE finance.gl_snapshots IS 
    '[HISTORY] Trial balance snapshots caching balances per account.';

-- =============================================================================
-- SECTION 10 — TIMELINES & ASSIGNMENT AUDITING (v2.0 ADDITIONS)
-- =============================================================================

-- 10.1 Journal Lifecycle History
CREATE TABLE finance.journal_lifecycle_history (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    journal_header_id    UUID         NOT NULL REFERENCES finance.journal_headers(id) ON DELETE CASCADE,
    journal_status_id    UUID         NOT NULL REFERENCES finance.journal_statuses(id) ON DELETE CASCADE,
    effective_from       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    effective_to         TIMESTAMPTZ,
    comments             TEXT,
    changed_by_user_id   UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_journal_lifecycle_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE finance.journal_lifecycle_history IS 
    '[HISTORY] Immutable transition log tracking journal review and post flows.';

-- 10.2 Account Balance History (Daily and Period snapshots)
CREATE TABLE finance.account_balance_history (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    snapshot_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
    chart_of_accounts_id UUID          NOT NULL REFERENCES finance.chart_of_accounts(id) ON DELETE CASCADE,
    cost_center_id       UUID          REFERENCES finance.cost_centers(id) ON DELETE CASCADE,
    
    opening_balance      NUMERIC(18,4) NOT NULL,
    debit_movement       NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    credit_movement      NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    closing_balance      NUMERIC(18,4) GENERATED ALWAYS AS (opening_balance + debit_movement - credit_movement) STORED,
    
    snapshot_type        VARCHAR(20)   NOT NULL, -- DAILY, PERIOD
    accounting_period_id UUID          REFERENCES finance.accounting_periods(id) ON DELETE CASCADE,
    created_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_acc_bal_snap_type CHECK (snapshot_type IN ('DAILY', 'PERIOD')),
    CONSTRAINT chk_acc_bal_debit CHECK (debit_movement >= 0.0000),
    CONSTRAINT chk_acc_bal_credit CHECK (credit_movement >= 0.0000)
);

COMMENT ON TABLE finance.account_balance_history IS 
    '[HISTORY] Historical ledger parameters caching totals per day/period to speed up financial reporting.';

-- 10.3 Finance Audit Event Timeline
CREATE TABLE finance.finance_audit_event_timeline (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    event_type           VARCHAR(100) NOT NULL, -- JOURNAL_POSTED, INVOICE_APPROVED, INVOICE_CANCELLED, RECEIPT_APPLIED, AP_PAYMENT_COMPLETED, RECON_COMPLETED, EXCHANGE_RATE_UPDATED, PERIOD_CLOSED, YEAR_CLOSED, AUDIT_LOCK_APPLIED
    source_document_type VARCHAR(50)  NOT NULL, -- JOURNAL, INVOICE, RECEIPT, PAYMENT, STATEMENT, EXCHANGE_RATE, PERIOD
    source_document_id   UUID         NOT NULL,
    event_timestamp      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    performed_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    payload              JSONB,

    created_at_utc       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE finance.finance_audit_event_timeline IS 
    '[HISTORY] Immutable master timeline log for all critical financial postings and closes.';

-- 10.4 Approval History (Multi-level workflow details)
CREATE TABLE finance.approval_history (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    source_document_type VARCHAR(50)  NOT NULL, -- JOURNAL, INVOICE, PAYMENT, RECONCILIATION, ADJUSTMENT
    source_document_id   UUID         NOT NULL,
    approval_level       INT          NOT NULL,
    workflow_stage       VARCHAR(50)  NOT NULL, -- SUBMITTED, REVIEW, LEVEL_1, LEVEL_2, FINAL
    approver_user_id     UUID         NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    decision             VARCHAR(20)  NOT NULL, -- APPROVED, REJECTED, DELEGATED
    comments             TEXT,
    decision_timestamp   TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_approval_level CHECK (approval_level >= 1),
    CONSTRAINT chk_approval_decision CHECK (decision IN ('APPROVED', 'REJECTED', 'DELEGATED'))
);

COMMENT ON TABLE finance.approval_history IS 
    '[HISTORY] Approval tracking registers backing multi-level authorization workflows.';

-- 10.5 Financial Adjustment Registry
CREATE TABLE finance.financial_adjustment_registry (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    adjustment_type        VARCHAR(50)   NOT NULL, -- WRITE_OFF, MANUAL_ADJUSTMENT, CORRECTION, ACCRUAL, PROVISION
    chart_of_accounts_id   UUID          NOT NULL REFERENCES finance.chart_of_accounts(id) ON DELETE CASCADE,
    amount                 NUMERIC(18,4) NOT NULL,
    reason                 TEXT          NOT NULL,
    reference_document_type VARCHAR(50)   NOT NULL, -- INVOICE, BILL, JOURNAL, BANK_TX
    reference_document_id  UUID          NOT NULL,
    approved_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    
    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_fin_adj_type CHECK (adjustment_type IN ('WRITE_OFF', 'MANUAL_ADJUSTMENT', 'CORRECTION', 'ACCRUAL', 'PROVISION')),
    CONSTRAINT chk_fin_adj_amount CHECK (amount <> 0.0000)
);

COMMENT ON TABLE finance.financial_adjustment_registry IS 
    '[OPERATIONAL] Authorized write-offs, manual corrections, provisions, and adjustments.';

-- 10.6 Bank Reconciliation Run History
CREATE TABLE finance.bank_reconciliation_history (
    id                           UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    bank_statement_id            UUID         NOT NULL REFERENCES finance.bank_statements(id) ON DELETE CASCADE,
    operator_user_id             UUID         NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    matched_transactions_count   INT          NOT NULL DEFAULT 0,
    unmatched_transactions_count INT          NOT NULL DEFAULT 0,
    completed_at_utc             TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    status                       VARCHAR(50)  NOT NULL, -- COMPLETED, PARTIAL, FAILED

    CONSTRAINT chk_recon_counts CHECK (matched_transactions_count >= 0 AND unmatched_transactions_count >= 0),
    CONSTRAINT chk_recon_status CHECK (status IN ('COMPLETED', 'PARTIAL', 'FAILED'))
);

COMMENT ON TABLE finance.bank_reconciliation_history IS 
    '[HISTORY] Detailed audits of bank reconciliation runs.';

-- 10.7 Financial Close Timeline
CREATE TABLE finance.financial_close_timeline (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    accounting_period_id UUID         NOT NULL REFERENCES finance.accounting_periods(id) ON DELETE CASCADE,
    close_stage          VARCHAR(50)  NOT NULL, -- CLOSE_STARTED, VALIDATION_COMPLETED, APPROVAL_COMPLETED, AUDIT_LOCK_APPLIED, PERIOD_REOPENED, YEAR_CLOSED
    stage_timestamp      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    operator_user_id     UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    comments             TEXT,

    CONSTRAINT chk_close_stage CHECK (close_stage IN ('CLOSE_STARTED', 'VALIDATION_COMPLETED', 'APPROVAL_COMPLETED', 'AUDIT_LOCK_APPLIED', 'PERIOD_REOPENED', 'YEAR_CLOSED'))
);

COMMENT ON TABLE finance.financial_close_timeline IS 
    '[HISTORY] Close process milestone records tracking accounting period lockdowns.';

-- 10.8 Financial SLA Monitoring
CREATE TABLE finance.financial_sla_monitoring (
    id                      UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sla_type                VARCHAR(50)  NOT NULL, -- INVOICE_POSTING, PAYMENT_PROCESSING, JOURNAL_APPROVAL, BANK_RECONCILIATION, PERIOD_CLOSING
    source_document_id      UUID         NOT NULL,
    target_duration_minutes INT          NOT NULL,
    actual_duration_minutes INT,
    is_breached             BOOLEAN      GENERATED ALWAYS AS (actual_duration_minutes > target_duration_minutes) STORED,
    delay_reason            TEXT,
    created_at_utc          TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_fin_sla_target CHECK (target_duration_minutes > 0),
    CONSTRAINT chk_fin_sla_actual CHECK (actual_duration_minutes IS NULL OR actual_duration_minutes >= 0),
    CONSTRAINT chk_fin_sla_type CHECK (sla_type IN ('INVOICE_POSTING', 'PAYMENT_PROCESSING', 'JOURNAL_APPROVAL', 'BANK_RECONCILIATION', 'PERIOD_CLOSING'))
);

COMMENT ON TABLE finance.financial_sla_monitoring IS 
    '[OPERATIONAL] Monitors transactional processing timelines against internal SLA goals.';

-- =============================================================================
-- SECTION 11 — INDEX STRATEGY (B-TREE FOREIGNS & COMPOSITE COVERING)
-- =============================================================================

-- 11.1 B-Tree Indexes on all Foreign Keys
CREATE INDEX idx_currencies_status_fk          ON finance.currencies (currency_status_id);

CREATE INDEX idx_rate_from_fk                  ON finance.exchange_rates (from_currency_id);
CREATE INDEX idx_rate_to_fk                    ON finance.exchange_rates (to_currency_id);
CREATE INDEX idx_rate_approver_fk              ON finance.exchange_rates (approved_by_user_id);

CREATE INDEX idx_period_year_fk                ON finance.accounting_periods (fiscal_year_id);
CREATE INDEX idx_period_status_fk              ON finance.accounting_periods (period_status_id);

CREATE INDEX idx_cost_company_fk               ON finance.cost_centers (company_id);
CREATE INDEX idx_profit_company_fk             ON finance.profit_centers (company_id);

CREATE INDEX idx_coa_type_fk                   ON finance.chart_of_accounts (account_type_id);
CREATE INDEX idx_coa_group_fk                  ON finance.chart_of_accounts (account_group_id);
CREATE INDEX idx_coa_parent_fk                 ON finance.chart_of_accounts (parent_account_id);

CREATE INDEX idx_batch_user_fk                 ON finance.posting_batches (posted_by_user_id);

CREATE INDEX idx_journal_period_fk             ON finance.journal_headers (accounting_period_id);
CREATE INDEX idx_journal_currency_fk           ON finance.journal_headers (currency_id);
CREATE INDEX idx_journal_batch_fk              ON finance.journal_headers (posting_batch_id);
CREATE INDEX idx_journal_status_fk             ON finance.journal_headers (journal_status_id);
CREATE INDEX idx_journal_reversal_fk           ON finance.journal_headers (reversal_journal_id);
CREATE INDEX idx_journal_approved_fk           ON finance.journal_headers (approved_by_user_id);

CREATE INDEX idx_jlines_header_fk              ON finance.journal_lines (journal_header_id);
CREATE INDEX idx_jlines_coa_fk                 ON finance.journal_lines (chart_of_accounts_id);
CREATE INDEX idx_jlines_cost_fk                ON finance.journal_lines (cost_center_id);
CREATE INDEX idx_jlines_profit_fk              ON finance.journal_lines (profit_center_id);

CREATE INDEX idx_balance_period_fk             ON finance.ledger_balances (accounting_period_id);
CREATE INDEX idx_balance_coa_fk                ON finance.ledger_balances (chart_of_accounts_id);
CREATE INDEX idx_balance_cost_fk               ON finance.ledger_balances (cost_center_id);

CREATE INDEX idx_invoice_company_fk            ON finance.customer_invoices (company_id);
CREATE INDEX idx_invoice_customer_fk           ON finance.customer_invoices (customer_id);
CREATE INDEX idx_invoice_period_fk             ON finance.customer_invoices (accounting_period_id);
CREATE INDEX idx_invoice_currency_fk           ON finance.customer_invoices (currency_id);
CREATE INDEX idx_invoice_status_fk             ON finance.customer_invoices (invoice_status_id);
CREATE INDEX idx_invoice_order_fk              ON finance.customer_invoices (sales_order_id);

CREATE INDEX idx_invlines_invoice_fk           ON finance.customer_invoice_lines (customer_invoice_id);
CREATE INDEX idx_invlines_product_fk           ON finance.customer_invoice_lines (product_id);

CREATE INDEX idx_receipt_customer_fk           ON finance.customer_receipts (customer_id);
CREATE INDEX idx_receipt_currency_fk           ON finance.customer_receipts (currency_id);

CREATE INDEX idx_rapp_receipt_fk               ON finance.receipt_applications (customer_receipt_id);
CREATE INDEX idx_rapp_invoice_fk               ON finance.receipt_applications (customer_invoice_id);

CREATE INDEX idx_cadj_customer_fk              ON finance.customer_adjustments (customer_id);

CREATE INDEX idx_bill_company_fk               ON finance.supplier_bills (company_id);
CREATE INDEX idx_bill_supplier_fk              ON finance.supplier_bills (supplier_id);
CREATE INDEX idx_bill_currency_fk              ON finance.supplier_bills (currency_id);
CREATE INDEX idx_bill_grn_fk                   ON finance.supplier_bills (grn_id);

CREATE INDEX idx_billlines_bill_fk             ON finance.supplier_bill_lines (supplier_bill_id);
CREATE INDEX idx_billlines_product_fk           ON finance.supplier_bill_lines (product_id);

CREATE INDEX idx_payment_supplier_fk           ON finance.supplier_payments (supplier_id);

CREATE INDEX idx_palloc_payment_fk             ON finance.payment_allocations (supplier_payment_id);
CREATE INDEX idx_palloc_bill_fk                ON finance.payment_allocations (supplier_bill_id);

CREATE INDEX idx_sadj_supplier_fk              ON finance.supplier_adjustments (supplier_id);

CREATE INDEX idx_bank_currency_fk              ON finance.bank_accounts (currency_id);
CREATE INDEX idx_bank_coa_fk                   ON finance.bank_accounts (gl_account_id);

CREATE INDEX idx_btx_account_fk                ON finance.bank_transactions (bank_account_id);

CREATE INDEX idx_bs_account_fk                 ON finance.bank_statements (bank_account_id);

CREATE INDEX idx_brecon_statement_fk           ON finance.bank_reconciliation_details (bank_statement_id);
CREATE INDEX idx_brecon_tx_fk                  ON finance.bank_reconciliation_details (bank_transaction_id);
CREATE INDEX idx_brecon_user_fk                ON finance.bank_reconciliation_details (reconciled_by_user_id);

CREATE INDEX idx_taxcode_jurisdiction_fk       ON finance.tax_codes (tax_jurisdiction_id);

CREATE INDEX idx_taxrate_code_fk               ON finance.tax_rates (tax_code_id);

CREATE INDEX idx_taxledg_code_fk               ON finance.tax_ledger (tax_code_id);

CREATE INDEX idx_checklist_period_fk           ON finance.period_close_checklist (accounting_period_id);
CREATE INDEX idx_checklist_user_fk             ON finance.period_close_checklist (completed_by_user_id);

CREATE INDEX idx_close_period_fk               ON finance.closing_approvals (accounting_period_id);
CREATE INDEX idx_close_user_fk                 ON finance.closing_approvals (approver_user_id);

CREATE INDEX idx_snapshot_period_fk            ON finance.gl_snapshots (accounting_period_id);
CREATE INDEX idx_snapshot_coa_fk               ON finance.gl_snapshots (chart_of_accounts_id);

-- v2.0 Indexes
CREATE INDEX idx_jhistory_header_fk            ON finance.journal_lifecycle_history (journal_header_id);
CREATE INDEX idx_jhistory_status_fk            ON finance.journal_lifecycle_history (journal_status_id);
CREATE INDEX idx_jhistory_user_fk              ON finance.journal_lifecycle_history (changed_by_user_id);

CREATE INDEX idx_bal_hist_coa_fk               ON finance.account_balance_history (chart_of_accounts_id);
CREATE INDEX idx_bal_hist_cost_fk              ON finance.account_balance_history (cost_center_id);
CREATE INDEX idx_bal_hist_period_fk            ON finance.account_balance_history (accounting_period_id);

CREATE INDEX idx_faudit_user_fk                ON finance.finance_audit_event_timeline (performed_by_user_id);

CREATE INDEX idx_approve_hist_approver_fk      ON finance.approval_history (approver_user_id);

CREATE INDEX idx_fin_adj_coa_fk                ON finance.financial_adjustment_registry (chart_of_accounts_id);
CREATE INDEX idx_fin_adj_approver_fk           ON finance.financial_adjustment_registry (approved_by_user_id);
CREATE INDEX idx_fin_adj_user_fk               ON finance.financial_adjustment_registry (created_by_user_id);

CREATE INDEX idx_brecon_hist_statement_fk      ON finance.bank_reconciliation_history (bank_statement_id);
CREATE INDEX idx_brecon_hist_operator_fk       ON finance.bank_reconciliation_history (operator_user_id);

CREATE INDEX idx_fclose_period_fk              ON finance.financial_close_timeline (accounting_period_id);
CREATE INDEX idx_fclose_user_fk                ON finance.financial_close_timeline (operator_user_id);

-- 11.2 Composite Indexes (Covering common finance queries)
CREATE INDEX idx_journal_posting_comp          ON finance.journal_headers (accounting_period_id, journal_status_id);
CREATE INDEX idx_invoice_aging_comp            ON finance.customer_invoices (customer_id, due_date, outstanding_amount);
CREATE INDEX idx_bill_aging_comp               ON finance.supplier_bills (supplier_id, due_date, outstanding_amount);
CREATE INDEX idx_tax_reporting_comp            ON finance.tax_ledger (transaction_date, tax_code_id, transaction_type);
CREATE INDEX idx_bal_hist_date_coa             ON finance.account_balance_history (snapshot_date, chart_of_accounts_id, snapshot_type);

-- 11.3 Partial Indexes (Optimizing active/hot records)
CREATE INDEX idx_journal_unposted             ON finance.journal_headers (id) WHERE journal_status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80e5'; -- references pending POSTING_PENDING ID
CREATE INDEX idx_invoice_outstanding           ON finance.customer_invoices (id) WHERE outstanding_amount > 0.0000;
CREATE INDEX idx_bill_outstanding              ON finance.supplier_bills (id) WHERE outstanding_amount > 0.0000;
CREATE INDEX idx_bank_unreconciled             ON finance.bank_transactions (id) WHERE is_reconciled = FALSE;
CREATE INDEX idx_period_checklist_pending      ON finance.period_close_checklist (id) WHERE is_completed = FALSE;
CREATE INDEX idx_sla_breached_finance          ON finance.financial_sla_monitoring (source_document_id) WHERE is_breached = TRUE;
CREATE INDEX idx_adjustments_unapproved        ON finance.financial_adjustment_registry (chart_of_accounts_id) WHERE approved_by_user_id IS NULL;
