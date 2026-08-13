-- =============================================================================
-- INK FMCG ENTERPRISE ERP — SUPPLIER MANAGEMENT MODULE REFINEMENTS (v16.5)
-- Patch File     : supplier_schema_refinements.sql
-- Applies To     : supplier_schema.sql (v16.4)
-- Target Engine  : PostgreSQL 16+
-- Schema         : supplier
-- Status         : ENTERPRISE ARCHITECTURE REVIEW — APPLIED
-- =============================================================================
-- APPLY ORDER:
--   1. supplier_schema.sql          (v16.4 base)
--   2. supplier_schema_refinements.sql (v16.5 this file)
-- =============================================================================
-- CHANGES IN THIS FILE:
--   NEW LOOKUPS    : supplier_site_types, supplier_contact_roles,
--                    bank_account_approval_statuses, incoterms_codes
--   NEW TABLES     : supplier_sites, supplier_contact_role_assignments,
--                    supplier_allowed_currencies
--   ALTER TABLE    : supplier_contacts        — add supplier_site_id
--                    supplier_addresses       — add supplier_site_id
--                    supplier_bank_accounts   — add supplier_site_id,
--                                               approval_status_id, approval columns
--                    supplier_tax_profiles    — add supplier_site_id,
--                                               replace UNIQUE with partial indexes
--                    supplier_product_category_approvals — add incoterms,
--                                               packaging_standard, preferred_brand,
--                                               default_delivery_site_id
--                    supplier_compliance      — add ESG, sanctions, RoHS,
--                                               REACH, import/export compliance
--                    suppliers                — add preferred_settlement_currency
--   SCHEMA COMMENT : updated boundary classification
-- =============================================================================

-- =============================================================================
-- SECTION A — NEW LOOKUP TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A.1 Supplier Site Types
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.supplier_site_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_supplier_site_types_code UNIQUE (code)
);

COMMENT ON TABLE supplier.supplier_site_types IS
    '[LOOKUP] Supplier site operational classification: HeadOffice, Factory, Warehouse, '
    'RegionalOffice, BillingOffice, ExportOffice, DistributionCenter, RetailOutlet, '
    'ServiceCenter, ResearchDevelopment.';

-- ---------------------------------------------------------------------------
-- A.2 Supplier Contact Roles (replaces single contact_type boolean pattern)
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.supplier_contact_roles (
    id                 UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code               VARCHAR(50)  NOT NULL,
    name               VARCHAR(100) NOT NULL,
    description        TEXT,
    is_notification_role BOOLEAN    NOT NULL DEFAULT FALSE,
    is_escalation_role BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order      INT          NOT NULL DEFAULT 1,

    created_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_sup_contact_roles_code UNIQUE (code)
);

COMMENT ON TABLE  supplier.supplier_contact_roles IS
    '[LOOKUP] Role-based contact responsibility classification. A single contact can hold '
    'multiple roles via supplier_contact_role_assignments (M:M). '
    'Roles: Procurement, Finance, AccountsPayable, Quality, Logistics, Technical, '
    'Legal, Executive, Escalation, Emergency, SalesRepresentative, CustomerService.';
COMMENT ON COLUMN supplier.supplier_contact_roles.is_notification_role IS
    'TRUE for roles that receive automated procurement notifications (Procurement, AccountsPayable, Logistics).';
COMMENT ON COLUMN supplier.supplier_contact_roles.is_escalation_role IS
    'TRUE for roles used when standard contacts are unresponsive (Escalation, Executive, Emergency).';

-- ---------------------------------------------------------------------------
-- A.3 Bank Account Approval Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.bank_account_approval_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    allows_payment BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_bank_approval_statuses_code UNIQUE (code)
);

COMMENT ON TABLE  supplier.bank_account_approval_statuses IS
    '[LOOKUP] Bank account governance approval lifecycle: PendingVerification, '
    'PendingApproval, Approved, Rejected, Suspended, Revoked. '
    'Finance module gates payment disbursement on allows_payment = TRUE.';
COMMENT ON COLUMN supplier.bank_account_approval_statuses.allows_payment IS
    'TRUE only for Approved status. Finance module checks this flag before processing payment.';

-- ---------------------------------------------------------------------------
-- A.4 Incoterms Codes
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.incoterms_codes (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(10)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    version_year   INT          NOT NULL DEFAULT 2020,
    description    TEXT,
    risk_transfer_point TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_incoterms_code        UNIQUE (code, version_year),
    CONSTRAINT chk_incoterms_year       CHECK (version_year IN (1990, 2000, 2010, 2020)),
    CONSTRAINT chk_incoterms_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE  supplier.incoterms_codes IS
    '[LOOKUP] International Commercial Terms (Incoterms) master. '
    'Incoterms 2020: EXW, FCA, FAS, FOB, CFR, CIF, CPT, CIP, DAP, DPU, DDP. '
    'Used by supplier_product_category_approvals and future Procurement Purchase Orders.';
COMMENT ON COLUMN supplier.incoterms_codes.risk_transfer_point IS
    'Description of where risk transfers from seller to buyer under this Incoterm.';

-- =============================================================================
-- SECTION B — NEW SUPPLIER SITE TABLE
-- =============================================================================

CREATE TABLE supplier.supplier_sites (
    id                             UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id                    UUID          NOT NULL,
    site_type_id                   UUID          NOT NULL,

    -- Site Identity
    site_code                      VARCHAR(50)   NOT NULL,
    site_name                      VARCHAR(200)  NOT NULL,
    description                    TEXT,

    -- Operational Flags
    is_active                      BOOLEAN       NOT NULL DEFAULT TRUE,
    is_primary_site                BOOLEAN       NOT NULL DEFAULT FALSE,
    is_default_procurement_site    BOOLEAN       NOT NULL DEFAULT FALSE,
    is_default_billing_site        BOOLEAN       NOT NULL DEFAULT FALSE,
    is_default_shipping_site       BOOLEAN       NOT NULL DEFAULT FALSE,

    -- Payment Terms Override (Precedence: Site > Supplier > Global Default)
    payment_terms_id               UUID,
    currency_code                  VARCHAR(10),

    -- Geographic Reference (denormalized for quick region filtering)
    country_id                     UUID,
    state_id                       UUID,

    -- Capacity (for WMS/Logistics integration)
    storage_capacity_sqm           NUMERIC(12,2),

    -- Integration Forward References
    warehouse_id                   UUID,          -- future warehouse.warehouses(id)

    remarks                        TEXT,

    row_version                    INT           NOT NULL DEFAULT 1,
    created_at_utc                 TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id             UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted                     BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc                 TIMESTAMPTZ,
    deleted_by_user_id             UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Foreign Keys
    CONSTRAINT fk_sup_sites_supplier     FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
    CONSTRAINT fk_sup_sites_type         FOREIGN KEY (site_type_id)
        REFERENCES supplier.supplier_site_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sup_sites_payment_terms FOREIGN KEY (payment_terms_id)
        REFERENCES supplier.payment_terms(id) ON DELETE SET NULL,
    CONSTRAINT fk_sup_sites_country      FOREIGN KEY (country_id)
        REFERENCES organization.countries(id) ON DELETE SET NULL,
    CONSTRAINT fk_sup_sites_state        FOREIGN KEY (state_id)
        REFERENCES organization.states(id) ON DELETE SET NULL,

    -- Business Uniqueness
    CONSTRAINT uq_sup_sites_code         UNIQUE (supplier_id, site_code),

    -- Integrity
    CONSTRAINT chk_sup_sites_code        CHECK (length(trim(site_code)) > 0),
    CONSTRAINT chk_sup_sites_name        CHECK (length(trim(site_name)) > 0),
    CONSTRAINT chk_sup_sites_capacity    CHECK (storage_capacity_sqm IS NULL OR storage_capacity_sqm > 0)
);

COMMENT ON TABLE  supplier.supplier_sites IS
    '[FOUNDATION — Registry] Supplier operational site layer. Each supplier can have '
    'multiple sites (HeadOffice, Factory, Warehouse, DistributionCenter, etc.). '
    'Sites inherit contacts, addresses, bank accounts, and tax profiles from the parent supplier '
    'UNLESS a site-specific record exists (supplier_site_id IS NOT NULL on child tables). '
    'PAYMENT TERMS PRECEDENCE: Site-level (this.payment_terms_id) > Supplier-level '
    '(suppliers.payment_terms_id) > Global Default (application config). '
    'Procurement module resolves: COALESCE(site.payment_terms_id, supplier.payment_terms_id, <global>). '
    'warehouse_id is a forward reference UUID for future warehouse.warehouses(id) integration.';
COMMENT ON COLUMN supplier.supplier_sites.is_default_procurement_site IS
    'TRUE for the site that Procurement module uses as the default ship-from/collection point when raising POs.';
COMMENT ON COLUMN supplier.supplier_sites.is_default_billing_site IS
    'TRUE for the site whose address and bank account are used for Finance invoice matching.';
COMMENT ON COLUMN supplier.supplier_sites.payment_terms_id IS
    '[OVERRIDE] Site-specific payment terms. When NOT NULL, overrides supplier.payment_terms_id. '
    'Resolution chain: Site → Supplier → Global Default.';
COMMENT ON COLUMN supplier.supplier_sites.currency_code IS
    '[OVERRIDE] Site-specific transaction currency override. When NOT NULL, overrides supplier.default_currency_code.';
COMMENT ON COLUMN supplier.supplier_sites.warehouse_id IS
    'Forward reference UUID for warehouse.warehouses(id). FK enforced when Warehouse module is linked. '
    'Represents the physical warehouse registered in the ERP that corresponds to this supplier site.';

-- =============================================================================
-- SECTION C — NEW CONTACT ROLE ASSIGNMENTS (M:M)
-- =============================================================================

CREATE TABLE supplier.supplier_contact_role_assignments (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    contact_id               UUID         NOT NULL,
    contact_role_id          UUID         NOT NULL,

    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    assigned_at_utc          TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    assigned_by_user_id      UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_crole_contact  FOREIGN KEY (contact_id)
        REFERENCES supplier.supplier_contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_sup_crole_role     FOREIGN KEY (contact_role_id)
        REFERENCES supplier.supplier_contact_roles(id) ON DELETE RESTRICT,

    CONSTRAINT uq_sup_crole_assignment UNIQUE (contact_id, contact_role_id)
);

COMMENT ON TABLE supplier.supplier_contact_role_assignments IS
    '[FOUNDATION] M:M role assignments for supplier contacts. A single contact can hold '
    'multiple operational roles (e.g. same person is both Finance and AccountsPayable contact). '
    'Procurement module uses this table to find the correct contact to notify for each '
    'document type (PO → Procurement role, Invoice → AccountsPayable role). '
    'The legacy contact_type_id on supplier_contacts remains for general categorization; '
    'this table provides granular operational role routing.';

-- =============================================================================
-- SECTION D — SUPPLIER ALLOWED CURRENCIES (Multi-currency support)
-- =============================================================================

CREATE TABLE supplier.supplier_allowed_currencies (
    id                           UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id                  UUID         NOT NULL,

    currency_code                VARCHAR(10)  NOT NULL,
    is_preferred_settlement      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active                    BOOLEAN      NOT NULL DEFAULT TRUE,

    -- Exchange rate readiness (rate management handled by Finance module)
    fx_account_available         BOOLEAN      NOT NULL DEFAULT FALSE,
    remarks                      TEXT,

    created_at_utc               TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_currencies_supplier FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,

    CONSTRAINT uq_sup_currencies           UNIQUE (supplier_id, currency_code),

    CONSTRAINT chk_sup_currencies_code     CHECK (length(trim(currency_code)) >= 3)
);

COMMENT ON TABLE  supplier.supplier_allowed_currencies IS
    '[FOUNDATION] Allowed transaction currencies per supplier. Enables multi-currency '
    'procurement: a supplier may accept payment in USD, EUR, and INR. '
    'is_preferred_settlement marks the supplier''s preferred payment currency. '
    'Finance module enforces that PO currency is in this allowed list. '
    'Exchange rate management is NOT implemented here — rates are owned by Finance module.';
COMMENT ON COLUMN supplier.supplier_allowed_currencies.fx_account_available IS
    'TRUE when Finance module has confirmed a functional FX account for this currency, '
    'enabling cross-currency payment disbursement.';
COMMENT ON COLUMN supplier.supplier_allowed_currencies.is_preferred_settlement IS
    'The currency the supplier prefers to be paid in. Finance module defaults to this '
    'for payment settlement when multiple allowed currencies exist.';

-- =============================================================================
-- SECTION E — ALTER TABLE: ADD SUPPLIER_SITE_ID TO CHILD TABLES
--
-- ARCHITECTURE DECISION:
--   supplier_site_id IS NULL  → Record applies supplier-wide (all sites inherit it)
--   supplier_site_id IS NOT NULL → Record applies to that specific site only
--   Procurement/Finance resolves: site-specific first, fall back to supplier-wide.
-- =============================================================================

-- E.1 supplier_contacts — add site affinity
ALTER TABLE supplier.supplier_contacts
    ADD COLUMN supplier_site_id UUID
        REFERENCES supplier.supplier_sites(id) ON DELETE SET NULL;

COMMENT ON COLUMN supplier.supplier_contacts.supplier_site_id IS
    'NULL = supplier-wide contact (visible to all sites). '
    'NOT NULL = site-specific contact (applies only to this supplier site). '
    'Resolution: Procurement first looks for site-specific contacts, falls back to supplier-wide.';

-- E.2 supplier_addresses — add site affinity
ALTER TABLE supplier.supplier_addresses
    ADD COLUMN supplier_site_id UUID
        REFERENCES supplier.supplier_sites(id) ON DELETE SET NULL;

COMMENT ON COLUMN supplier.supplier_addresses.supplier_site_id IS
    'NULL = supplier-wide address (e.g. registered office applies to all sites). '
    'NOT NULL = site-specific address (e.g. Factory gate address for goods collection).';

-- E.3 supplier_bank_accounts — add site affinity + approval governance
ALTER TABLE supplier.supplier_bank_accounts
    ADD COLUMN supplier_site_id           UUID
        REFERENCES supplier.supplier_sites(id) ON DELETE SET NULL,
    ADD COLUMN bank_account_approval_status_id UUID
        REFERENCES supplier.bank_account_approval_statuses(id) ON DELETE SET NULL,
    ADD COLUMN approval_remarks           TEXT,
    ADD COLUMN approval_requested_at_utc  TIMESTAMPTZ,
    ADD COLUMN approval_actioned_by_user_id UUID
        REFERENCES iam.users(id) ON DELETE SET NULL,
    ADD COLUMN approval_actioned_at_utc   TIMESTAMPTZ;

COMMENT ON COLUMN supplier.supplier_bank_accounts.supplier_site_id IS
    'NULL = supplier-wide bank account used for consolidated payments. '
    'NOT NULL = site-specific account (e.g. Factory site has its own operational account). '
    'Finance module resolves: site-specific account first, then supplier-wide primary account.';
COMMENT ON COLUMN supplier.supplier_bank_accounts.bank_account_approval_status_id IS
    'Governance approval state for this bank account. Finance module MUST check '
    'bank_account_approval_statuses.allows_payment = TRUE before processing any payment. '
    'A verified-but-not-approved account cannot be used for payment.';
COMMENT ON COLUMN supplier.supplier_bank_accounts.approval_actioned_by_user_id IS
    'User who approved or rejected this bank account. Combined with approval_actioned_at_utc '
    'forms a complete bank account governance audit trail.';

-- E.4 supplier_tax_profiles — add site affinity
--     IMPORTANT: DROP the single UNIQUE(supplier_id) constraint.
--     Replace with TWO partial unique indexes:
--       - One supplier-level profile (site_id IS NULL)
--       - One profile per site (site_id IS NOT NULL)

ALTER TABLE supplier.supplier_tax_profiles
    ADD COLUMN supplier_site_id UUID
        REFERENCES supplier.supplier_sites(id) ON DELETE CASCADE;

-- Drop the original single-supplier UNIQUE constraint
ALTER TABLE supplier.supplier_tax_profiles
    DROP CONSTRAINT uq_sup_tax_supplier;

-- Supplier-level tax profile: exactly one per supplier where site is NULL
CREATE UNIQUE INDEX uix_sup_tax_supplier_level
    ON supplier.supplier_tax_profiles (supplier_id)
    WHERE supplier_site_id IS NULL;

-- Site-level tax profile: exactly one per site
CREATE UNIQUE INDEX uix_sup_tax_site_level
    ON supplier.supplier_tax_profiles (supplier_site_id)
    WHERE supplier_site_id IS NOT NULL;

COMMENT ON COLUMN supplier.supplier_tax_profiles.supplier_site_id IS
    'NULL = supplier-wide tax registration (applies to all sites). '
    'NOT NULL = site-specific tax registration (e.g. Factory site has separate GST registration). '
    'UNIQUENESS: uix_sup_tax_supplier_level enforces one supplier-level profile (site_id IS NULL). '
    'uix_sup_tax_site_level enforces one profile per site (site_id IS NOT NULL). '
    'Finance module resolves: site-specific tax profile first, falls back to supplier-wide.';

-- =============================================================================
-- SECTION F — ALTER TABLE: ENHANCE PRODUCT PROCUREMENT PROFILE
-- =============================================================================

ALTER TABLE supplier.supplier_product_category_approvals
    ADD COLUMN incoterms_id              UUID
        REFERENCES supplier.incoterms_codes(id) ON DELETE SET NULL,
    ADD COLUMN packaging_standard        TEXT,
    ADD COLUMN preferred_brand           VARCHAR(200),
    ADD COLUMN default_delivery_site_id  UUID
        REFERENCES supplier.supplier_sites(id) ON DELETE SET NULL,
    ADD COLUMN quality_certification_required BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN inspection_required       BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN lead_time_min_days        INT,
    ADD COLUMN lead_time_max_days        INT;

COMMENT ON COLUMN supplier.supplier_product_category_approvals.incoterms_id IS
    'Default Incoterm for this supplier + product category combination. '
    'Procurement module pre-fills PO Incoterm from this field.';
COMMENT ON COLUMN supplier.supplier_product_category_approvals.packaging_standard IS
    'Required packaging specification (e.g. "FMCG Secondary: RSC corrugated, max 10 kg per carton"). '
    'Quality module validates GRN packaging against this standard.';
COMMENT ON COLUMN supplier.supplier_product_category_approvals.preferred_brand IS
    'Preferred brand/manufacturer for this category from this supplier. '
    'Used by Procurement sourcing algorithm for brand-specific purchase orders.';
COMMENT ON COLUMN supplier.supplier_product_category_approvals.default_delivery_site_id IS
    'Supplier site from which goods in this category are typically collected/dispatched. '
    'Procurement module defaults collection address from this site. '
    'Must belong to the same supplier as this approval record.';
COMMENT ON COLUMN supplier.supplier_product_category_approvals.lead_time_min_days IS
    'Minimum lead time (best case). Procurement uses lead_time_min_days..lead_time_max_days range '
    'for delivery date planning. lead_time_days (existing) is the typical/average.';
COMMENT ON COLUMN supplier.supplier_product_category_approvals.quality_certification_required IS
    'TRUE if Quality module must verify supplier certification before approving GRN for this category.';

-- Add CHECK for lead time range
ALTER TABLE supplier.supplier_product_category_approvals
    ADD CONSTRAINT chk_sup_pca_lead_time_range CHECK (
        lead_time_min_days IS NULL OR lead_time_max_days IS NULL OR
        lead_time_max_days >= lead_time_min_days
    );

-- =============================================================================
-- SECTION G — ALTER TABLE: EXTEND COMPLIANCE (ESG + SANCTIONS + REGULATORY)
-- =============================================================================

ALTER TABLE supplier.supplier_compliance
    -- ESG (Environmental, Social, Governance)
    ADD COLUMN esg_rating                    VARCHAR(20),
    ADD COLUMN esg_assessment_date           DATE,
    ADD COLUMN esg_report_reference          VARCHAR(500),
    ADD COLUMN esg_next_assessment_date      DATE,
    ADD COLUMN esg_notes                     TEXT,

    -- Sanctions Screening
    ADD COLUMN is_sanction_screened          BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN sanction_screening_date       DATE,
    ADD COLUMN sanction_screening_result     VARCHAR(50),
    ADD COLUMN sanction_screening_reference  VARCHAR(200),
    ADD COLUMN sanction_watch_list_match     BOOLEAN NOT NULL DEFAULT FALSE,

    -- Conflict Minerals (Dodd-Frank / EU Conflict Minerals Regulation)
    ADD COLUMN is_conflict_minerals_assessed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN conflict_minerals_compliant   BOOLEAN,
    ADD COLUMN conflict_minerals_cert_date   DATE,

    -- Product Regulatory Compliance
    ADD COLUMN is_rohs_compliant             BOOLEAN,
    ADD COLUMN rohs_cert_date                DATE,
    ADD COLUMN rohs_cert_expiry_date         DATE,

    ADD COLUMN is_reach_compliant            BOOLEAN,
    ADD COLUMN reach_assessment_date         DATE,

    -- Import / Export Compliance
    ADD COLUMN is_import_export_compliant    BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN import_export_license_number  VARCHAR(100),
    ADD COLUMN import_export_license_expiry  DATE,
    ADD COLUMN export_control_classification VARCHAR(50),

    -- Anti-Bribery / FCPA / UK Bribery Act
    ADD COLUMN anti_bribery_policy_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN anti_bribery_confirmed_date   DATE,

    -- Data Privacy
    ADD COLUMN gdpr_compliant                BOOLEAN,
    ADD COLUMN data_processing_agreement_date DATE;

-- CHECKs for new compliance date ranges
ALTER TABLE supplier.supplier_compliance
    ADD CONSTRAINT chk_sup_comp_esg_dates CHECK (
        esg_assessment_date IS NULL OR esg_next_assessment_date IS NULL OR
        esg_next_assessment_date > esg_assessment_date
    ),
    ADD CONSTRAINT chk_sup_comp_rohs_dates CHECK (
        rohs_cert_date IS NULL OR rohs_cert_expiry_date IS NULL OR
        rohs_cert_expiry_date >= rohs_cert_date
    ),
    ADD CONSTRAINT chk_sup_comp_imp_exp_dates CHECK (
        import_export_license_number IS NULL OR
        import_export_license_expiry IS NULL OR
        import_export_license_expiry >= CURRENT_DATE - INTERVAL '1 year'
    );

COMMENT ON COLUMN supplier.supplier_compliance.esg_rating IS
    'ESG (Environmental, Social, Governance) composite rating from an accredited agency '
    '(e.g. MSCI: AAA–CCC, EcoVadis: 0–100). Format free — Finance/SRM modules interpret.';
COMMENT ON COLUMN supplier.supplier_compliance.sanction_watch_list_match IS
    'TRUE if supplier name/entity appeared on any sanction screening watchlist. '
    'Procurement module blocks PO creation when TRUE. Requires compliance team clearance.';
COMMENT ON COLUMN supplier.supplier_compliance.conflict_minerals_compliant IS
    'TRUE if supplier has confirmed compliance with Dodd-Frank Section 1502 or '
    'EU Conflict Minerals Regulation (3TG: Tin, Tantalum, Tungsten, Gold).';
COMMENT ON COLUMN supplier.supplier_compliance.is_rohs_compliant IS
    'TRUE if products from this supplier comply with RoHS Directive '
    '(Restriction of Hazardous Substances in electrical/electronic equipment).';
COMMENT ON COLUMN supplier.supplier_compliance.is_reach_compliant IS
    'TRUE if supplier demonstrates REACH compliance '
    '(Registration, Evaluation, Authorisation of Chemicals — EU Regulation 1907/2006).';
COMMENT ON COLUMN supplier.supplier_compliance.export_control_classification IS
    'Export Control Classification Number (ECCN) or equivalent. '
    'Used by Logistics module for export documentation and customs compliance.';

-- =============================================================================
-- SECTION H — ALTER TABLE: ADD preferred_settlement_currency TO SUPPLIERS
-- =============================================================================

ALTER TABLE supplier.suppliers
    ADD COLUMN preferred_settlement_currency VARCHAR(10);

COMMENT ON COLUMN supplier.suppliers.preferred_settlement_currency IS
    'The currency the supplier prefers to receive payment in, independent of invoice currency. '
    'Finance module uses this for settlement FX conversion. '
    'Must exist in supplier_allowed_currencies for this supplier. '
    'FK not enforced at DB level — application layer validates consistency.';

-- =============================================================================
-- SECTION I — NEW INDEXES FOR ALL NEW TABLES AND COLUMNS
-- =============================================================================

-- ── SUPPLIER SITE TYPES ───────────────────────────────────────────────────────
CREATE INDEX idx_sup_site_types_active ON supplier.supplier_site_types (is_active)
    WHERE is_active = TRUE;

-- ── SUPPLIER SITES ────────────────────────────────────────────────────────────
CREATE INDEX idx_sup_sites_supplier_id           ON supplier.supplier_sites (supplier_id);
CREATE INDEX idx_sup_sites_type_id               ON supplier.supplier_sites (site_type_id);
CREATE INDEX idx_sup_sites_country_id            ON supplier.supplier_sites (country_id)
    WHERE country_id IS NOT NULL;
CREATE INDEX pix_sup_sites_active                ON supplier.supplier_sites (supplier_id, is_active)
    WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_sup_sites_procurement_default   ON supplier.supplier_sites (supplier_id)
    WHERE is_default_procurement_site = TRUE AND is_deleted = FALSE;
CREATE INDEX pix_sup_sites_primary               ON supplier.supplier_sites (supplier_id)
    WHERE is_primary_site = TRUE AND is_deleted = FALSE;
CREATE INDEX trgm_sup_sites_name                 ON supplier.supplier_sites USING GIN (site_name gin_trgm_ops);

-- ── SUPPLIER CONTACT ROLE ASSIGNMENTS ────────────────────────────────────────
CREATE INDEX idx_sup_crole_contact_id            ON supplier.supplier_contact_role_assignments (contact_id);
CREATE INDEX idx_sup_crole_role_id               ON supplier.supplier_contact_role_assignments (contact_role_id);
CREATE INDEX pix_sup_crole_active                ON supplier.supplier_contact_role_assignments (contact_id, contact_role_id)
    WHERE is_active = TRUE;
-- Fast lookup: find all Procurement contacts for a supplier (via contact → role)
CREATE INDEX idx_sup_crole_role_active           ON supplier.supplier_contact_role_assignments (contact_role_id)
    WHERE is_active = TRUE;

-- ── SUPPLIER ALLOWED CURRENCIES ───────────────────────────────────────────────
CREATE INDEX idx_sup_currencies_supplier_id      ON supplier.supplier_allowed_currencies (supplier_id);
CREATE INDEX pix_sup_currencies_preferred        ON supplier.supplier_allowed_currencies (supplier_id)
    WHERE is_preferred_settlement = TRUE AND is_active = TRUE;

-- ── CONTACTS — NEW SITE COLUMN ────────────────────────────────────────────────
CREATE INDEX idx_sup_contacts_site_id            ON supplier.supplier_contacts (supplier_site_id)
    WHERE supplier_site_id IS NOT NULL;
-- Supplier-wide contacts (site_id IS NULL) fast lookup
CREATE INDEX pix_sup_contacts_supplier_wide      ON supplier.supplier_contacts (supplier_id)
    WHERE supplier_site_id IS NULL AND is_deleted = FALSE;

-- ── ADDRESSES — NEW SITE COLUMN ───────────────────────────────────────────────
CREATE INDEX idx_sup_addr_site_id                ON supplier.supplier_addresses (supplier_site_id)
    WHERE supplier_site_id IS NOT NULL;
CREATE INDEX pix_sup_addr_supplier_wide          ON supplier.supplier_addresses (supplier_id)
    WHERE supplier_site_id IS NULL AND is_deleted = FALSE;

-- ── BANK ACCOUNTS — NEW SITE + APPROVAL COLUMNS ──────────────────────────────
CREATE INDEX idx_sup_bank_site_id                ON supplier.supplier_bank_accounts (supplier_site_id)
    WHERE supplier_site_id IS NOT NULL;
CREATE INDEX idx_sup_bank_approval_status_id     ON supplier.supplier_bank_accounts (bank_account_approval_status_id)
    WHERE bank_account_approval_status_id IS NOT NULL;
CREATE INDEX pix_sup_bank_pending_approval       ON supplier.supplier_bank_accounts (supplier_id)
    WHERE bank_account_approval_status_id IS NOT NULL AND is_deleted = FALSE;

-- ── TAX PROFILES — NEW SITE COLUMN ───────────────────────────────────────────
CREATE INDEX idx_sup_tax_site_id                 ON supplier.supplier_tax_profiles (supplier_site_id)
    WHERE supplier_site_id IS NOT NULL;

-- ── PRODUCT CATEGORY APPROVALS — NEW COLUMNS ─────────────────────────────────
CREATE INDEX idx_sup_pca_incoterms_id            ON supplier.supplier_product_category_approvals (incoterms_id)
    WHERE incoterms_id IS NOT NULL;
CREATE INDEX idx_sup_pca_delivery_site_id        ON supplier.supplier_product_category_approvals (default_delivery_site_id)
    WHERE default_delivery_site_id IS NOT NULL;

-- ── COMPLIANCE — SANCTIONS (CRITICAL — FREQUENT SCAN) ────────────────────────
CREATE INDEX pix_sup_comp_sanctions_flagged      ON supplier.supplier_compliance (supplier_id)
    WHERE sanction_watch_list_match = TRUE;
CREATE INDEX idx_sup_comp_esg_next_assess        ON supplier.supplier_compliance (esg_next_assessment_date ASC)
    WHERE esg_next_assessment_date IS NOT NULL;
CREATE INDEX idx_sup_comp_imp_exp_expiry         ON supplier.supplier_compliance (import_export_license_expiry ASC)
    WHERE import_export_license_expiry IS NOT NULL;

-- ── INCOTERMS CODES ───────────────────────────────────────────────────────────
CREATE INDEX idx_incoterms_code                  ON supplier.incoterms_codes (code, version_year);

-- =============================================================================
-- SECTION J — UPDATED SCHEMA COMMENT (boundary classification)
-- =============================================================================

COMMENT ON SCHEMA supplier IS
  'Enterprise Supplier Management Module v16.5 — Architectural Boundary: FOUNDATION + OPERATIONAL. '
  '─── FOUNDATION (permanent registries and configuration) ─── '
  'LOOKUP (13+4=17): supplier_types, supplier_categories, supplier_groups, supplier_statuses, '
  'payment_terms, address_types, contact_types, document_types, risk_ratings, kyc_statuses, '
  'approval_statuses, compliance_statuses, review_frequencies, '
  'supplier_site_types [NEW], supplier_contact_roles [NEW], '
  'bank_account_approval_statuses [NEW], incoterms_codes [NEW]. '
  'REGISTRY (permanent): suppliers, supplier_sites [NEW]. '
  'FOUNDATION (config, 1:1 or 1:M): supplier_contacts, supplier_addresses, supplier_bank_accounts, '
  'supplier_tax_profiles, supplier_documents, supplier_compliance, supplier_relationships, '
  'supplier_certifications, supplier_product_category_approvals, '
  'supplier_contact_role_assignments [NEW], supplier_allowed_currencies [NEW]. '
  '─── HYBRID ─── '
  'HYBRID (config + operational): supplier_performance_profiles. '
  '─── OPERATIONAL ─── '
  'OPERATIONAL (append-only): supplier_status_history. '
  'Permanent foundation for Procurement, Finance, Inventory, Logistics, '
  'Quality, Returns, Analytics, and SRM modules.';

-- =============================================================================
-- SECTION K — UPDATED TABLE COMMENT ON (boundary classification)
-- =============================================================================

-- New Lookups
COMMENT ON TABLE supplier.supplier_site_types                  IS '[LOOKUP] Supplier site operational type classification. Seeded at deployment.';
COMMENT ON TABLE supplier.supplier_contact_roles               IS '[LOOKUP] Role-based contact responsibility master for multi-role assignment.';
COMMENT ON TABLE supplier.bank_account_approval_statuses       IS '[LOOKUP] Bank account governance lifecycle master. Finance payment gated on allows_payment=TRUE.';
COMMENT ON TABLE supplier.incoterms_codes                      IS '[LOOKUP] International Commercial Terms master (Incoterms 2020).';

-- New Core Tables
COMMENT ON TABLE supplier.supplier_sites                       IS '[REGISTRY — PERMANENT] Supplier operational site layer. Each supplier has ≥1 sites. All child tables (contacts, addresses, bank accounts, tax profiles) can be supplier-wide (site_id IS NULL) or site-specific (site_id IS NOT NULL).';
COMMENT ON TABLE supplier.supplier_contact_role_assignments    IS '[FOUNDATION] M:M operational role assignments per contact. Replaces single contact_type with multi-role capability.';
COMMENT ON TABLE supplier.supplier_allowed_currencies          IS '[FOUNDATION] Allowed transaction currencies per supplier. Finance enforces PO currency is in this set.';

-- Updated boundary tags for existing tables
COMMENT ON TABLE supplier.suppliers                            IS '[REGISTRY — PERMANENT] Core supplier master. Parent of all supplier data. Never hard-deleted.';
COMMENT ON TABLE supplier.supplier_contacts                    IS '[FOUNDATION] Contacts per supplier. supplier_site_id IS NULL = supplier-wide; IS NOT NULL = site-specific.';
COMMENT ON TABLE supplier.supplier_addresses                   IS '[FOUNDATION] Addresses per supplier. Site affinity via supplier_site_id.';
COMMENT ON TABLE supplier.supplier_bank_accounts               IS '[FOUNDATION] Bank accounts per supplier. Governed by bank_account_approval_status. Finance gates payment on allows_payment=TRUE.';
COMMENT ON TABLE supplier.supplier_tax_profiles                IS '[FOUNDATION] Tax configurations per supplier and/or site. Partial unique indexes enforce one supplier-level + one per-site profile.';
COMMENT ON TABLE supplier.supplier_documents                   IS '[FOUNDATION] Document metadata registry. Binary files in external store.';
COMMENT ON TABLE supplier.supplier_compliance                   IS '[FOUNDATION + ESG] Compliance, KYC, approval, risk, sanctions, ESG, RoHS, REACH profile per supplier.';
COMMENT ON TABLE supplier.supplier_performance_profiles        IS '[HYBRID: FOUNDATION review config + OPERATIONAL metrics] Rating, OTD%, defect% updated by Procurement/Quality modules.';
COMMENT ON TABLE supplier.supplier_relationships               IS '[FOUNDATION] Corporate hierarchy and M&A relationship graph.';
COMMENT ON TABLE supplier.supplier_certifications              IS '[FOUNDATION] Quality/compliance certification registry with GENERATED is_expired.';
COMMENT ON TABLE supplier.supplier_product_category_approvals  IS '[FOUNDATION] Approved procurement categories with MOQ/MOV/Incoterms/lead time per supplier.';
COMMENT ON TABLE supplier.supplier_status_history              IS '[OPERATIONAL — Append-only] Immutable status change audit trail with EXCLUDE overlap constraint.';
