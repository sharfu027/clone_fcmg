-- =============================================================================
-- INK FMCG ENTERPRISE ERP — SUPPLIER MANAGEMENT MODULE DDL (v16.4 FINAL)
-- Target Engine  : PostgreSQL 16+
-- Schema         : supplier
-- PK Strategy    : UUID v7 via iam.uuid_generate_v7()
-- Concurrency    : row_version (Optimistic Concurrency Control)
-- Extensions     : pg_trgm, btree_gist (inherited from iam schema)
-- Frozen Deps    : iam v1.0, organization v1.0, employee v1.0,
--                  product v1.0, warehouse v1.0, inventory v16.4
-- Status         : PRODUCTION FOUNDATION
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS supplier;

COMMENT ON SCHEMA supplier IS
  'Enterprise Supplier Management Module. Permanent supplier master registry for '
  'multinational FMCG distribution. Supports hundreds of thousands of suppliers across '
  'multiple companies, countries, currencies, and legal entities. '
  'FOUNDATION for Procurement, Inventory, Finance, Quality, Compliance, Logistics, '
  'Analytics, and future SRM (Supplier Relationship Management) modules. '
  'ARCHITECTURAL BOUNDARY: All tables are FOUNDATION (registry/configuration) except '
  'supplier_status_history (OPERATIONAL — append-only audit) and '
  'supplier_performance_profiles (HYBRID — config policy + operational snapshots).';

-- =============================================================================
-- SECTION 1 — LOOKUP MASTER TABLES (13 lookup tables — zero ENUMs)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 Supplier Types
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.supplier_types (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order            INT          NOT NULL DEFAULT 1,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_supplier_types_code CHECK (length(trim(code)) > 0),
    CONSTRAINT uq_supplier_types_ucode UNIQUE (code)
);

COMMENT ON TABLE supplier.supplier_types IS
    '[LOOKUP] Supplier classification by business model: Manufacturer, Distributor, '
    'Wholesaler, Importer, Exporter, ServiceProvider, Transporter, PackagingSupplier, '
    'RawMaterialSupplier, ContractManufacturer, TradingHouse.';

-- ---------------------------------------------------------------------------
-- 1.2 Supplier Categories
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.supplier_categories (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order            INT          NOT NULL DEFAULT 1,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_supplier_categories_code UNIQUE (code)
);

COMMENT ON TABLE supplier.supplier_categories IS
    '[LOOKUP] Strategic classification for supplier segmentation: '
    'Local, National, International, Strategic, Operational, Preferred, Spot.';

-- ---------------------------------------------------------------------------
-- 1.3 Supplier Groups
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.supplier_groups (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID         NOT NULL,
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order            INT          NOT NULL DEFAULT 1,

    row_version              INT          NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_supplier_groups_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_supplier_groups_code    UNIQUE (company_id, code)
);

COMMENT ON TABLE supplier.supplier_groups IS
    '[LOOKUP] Company-specific supplier grouping by commodity/industry: '
    'FMCG, Beverages, Stationery, IT, Packaging, Chemical, Logistics, Pharma.';

-- ---------------------------------------------------------------------------
-- 1.4 Supplier Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.supplier_statuses (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    blocks_procurement       BOOLEAN      NOT NULL DEFAULT FALSE,
    blocks_payment           BOOLEAN      NOT NULL DEFAULT FALSE,
    requires_approval        BOOLEAN      NOT NULL DEFAULT FALSE,
    is_terminal              BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order            INT          NOT NULL DEFAULT 1,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_supplier_statuses_code UNIQUE (code)
);

COMMENT ON TABLE  supplier.supplier_statuses                   IS
    '[LOOKUP] Supplier lifecycle status master: Active, Inactive, PendingApproval, '
    'Approved, Suspended, Blocked, Blacklisted, Terminated, UnderReview.';
COMMENT ON COLUMN supplier.supplier_statuses.blocks_procurement IS
    'TRUE for statuses that prevent new Purchase Orders being raised (Blocked, Blacklisted, Terminated).';
COMMENT ON COLUMN supplier.supplier_statuses.blocks_payment     IS
    'TRUE for statuses that prevent payment processing (Blocked, Blacklisted, Disputed).';
COMMENT ON COLUMN supplier.supplier_statuses.is_terminal        IS
    'TRUE for irreversible terminal statuses (Terminated, Blacklisted). Cannot be reversed without admin override.';

-- ---------------------------------------------------------------------------
-- 1.5 Payment Terms
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.payment_terms (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    net_days                 INT          NOT NULL DEFAULT 0,
    description              TEXT,
    is_advance               BOOLEAN      NOT NULL DEFAULT FALSE,
    discount_pct             NUMERIC(5,2),
    discount_days            INT,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order            INT          NOT NULL DEFAULT 1,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_payment_terms_code      UNIQUE (code),
    CONSTRAINT chk_payment_terms_net_days CHECK (net_days >= 0),
    CONSTRAINT chk_payment_terms_discount CHECK (
        discount_pct IS NULL OR discount_pct BETWEEN 0 AND 100
    ),
    CONSTRAINT chk_payment_terms_disc_days CHECK (
        discount_days IS NULL OR discount_days >= 0
    )
);

COMMENT ON TABLE  supplier.payment_terms             IS
    '[LOOKUP] Payment terms master: Advance, Immediate, Net15, Net30, Net45, Net60, Net90, Net120. '
    'net_days drives Finance module payment due date calculation.';
COMMENT ON COLUMN supplier.payment_terms.net_days    IS 'Number of days from invoice date to payment due date. 0 = immediate payment.';
COMMENT ON COLUMN supplier.payment_terms.discount_pct IS 'Early payment discount percentage. NULL = no early payment discount.';
COMMENT ON COLUMN supplier.payment_terms.discount_days IS 'Days within which early payment discount applies.';

-- ---------------------------------------------------------------------------
-- 1.6 Address Types
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.address_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_address_types_code UNIQUE (code)
);

COMMENT ON TABLE supplier.address_types IS
    '[LOOKUP] Supplier address classification: Billing, Shipping, HeadOffice, '
    'Branch, Warehouse, Factory, Registered, Correspondence.';

-- ---------------------------------------------------------------------------
-- 1.7 Contact Types
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.contact_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_contact_types_code UNIQUE (code)
);

COMMENT ON TABLE supplier.contact_types IS
    '[LOOKUP] Supplier contact classification: Primary, Emergency, Sales, Finance, '
    'Technical, Operations, Logistics, Legal, Escalation.';

-- ---------------------------------------------------------------------------
-- 1.8 Document Types
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.document_types (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    is_expirable             BOOLEAN      NOT NULL DEFAULT FALSE,
    requires_renewal         BOOLEAN      NOT NULL DEFAULT FALSE,
    is_mandatory_for_approval BOOLEAN     NOT NULL DEFAULT FALSE,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order            INT          NOT NULL DEFAULT 1,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_document_types_code UNIQUE (code)
);

COMMENT ON TABLE  supplier.document_types                          IS
    '[LOOKUP] Supplier document classification: GSTCertificate, PANCopy, BusinessLicense, '
    'TradeLicense, ISOCertificate, Agreement, Contract, NDA, Insurance, BankGuarantee, Other.';
COMMENT ON COLUMN supplier.document_types.is_expirable              IS
    'TRUE for documents with an expiry date (licenses, insurance, certifications).';
COMMENT ON COLUMN supplier.document_types.is_mandatory_for_approval IS
    'TRUE for documents required before supplier can be approved for procurement.';

-- ---------------------------------------------------------------------------
-- 1.9 Risk Ratings
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.risk_ratings (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(20)  NOT NULL,
    name           VARCHAR(50)  NOT NULL,
    description    TEXT,
    risk_level     INT          NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_risk_ratings_code  UNIQUE (code),
    CONSTRAINT chk_risk_ratings_level CHECK (risk_level BETWEEN 1 AND 5)
);

COMMENT ON TABLE  supplier.risk_ratings            IS
    '[LOOKUP] Supplier risk classification: Unrated(0), Low(1), Medium(2), High(3), VeryHigh(4), Critical(5).';
COMMENT ON COLUMN supplier.risk_ratings.risk_level IS
    'Numeric risk level 1 (lowest risk) to 5 (critical risk). Used for procurement controls and finance exposure limits.';

-- ---------------------------------------------------------------------------
-- 1.10 KYC Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.kyc_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_kyc_statuses_code UNIQUE (code)
);

COMMENT ON TABLE supplier.kyc_statuses IS
    '[LOOKUP] KYC verification status: Pending, InProgress, Verified, Rejected, Expired, Exempted, Waived.';

-- ---------------------------------------------------------------------------
-- 1.11 Approval Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.approval_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_approved    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_approval_statuses_code UNIQUE (code)
);

COMMENT ON TABLE supplier.approval_statuses IS
    '[LOOKUP] Supplier approval workflow status: Draft, PendingApproval, Approved, Rejected, Suspended, Withdrawn, Expired.';

-- ---------------------------------------------------------------------------
-- 1.12 Compliance Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.compliance_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_compliance_statuses_code UNIQUE (code)
);

COMMENT ON TABLE supplier.compliance_statuses IS
    '[LOOKUP] Supplier regulatory compliance state: Compliant, PendingReview, NonCompliant, Exempt, ConditionalApproval, UnderInvestigation.';

-- ---------------------------------------------------------------------------
-- 1.13 Review Frequencies
-- ---------------------------------------------------------------------------
CREATE TABLE supplier.review_frequencies (
    id                 UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code               VARCHAR(30) NOT NULL,
    name               VARCHAR(50) NOT NULL,
    interval_days      INT         NOT NULL,
    is_active          BOOLEAN     NOT NULL DEFAULT TRUE,
    display_order      INT         NOT NULL DEFAULT 1,

    created_at_utc     TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_review_frequencies_code        UNIQUE (code),
    CONSTRAINT chk_review_frequencies_interval   CHECK (interval_days > 0)
);

COMMENT ON TABLE  supplier.review_frequencies              IS
    '[LOOKUP] Supplier performance review interval: Monthly(30), Quarterly(90), '
    'HalfYearly(180), Annually(365), OnDemand(-1 handled via application logic).';
COMMENT ON COLUMN supplier.review_frequencies.interval_days IS
    'Number of calendar days between performance reviews. Drives next_review_date calculation.';

-- =============================================================================
-- SECTION 2 — SUPPLIER MASTER (Core Registry Table)
-- =============================================================================

CREATE TABLE supplier.suppliers (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id                   UUID          NOT NULL,

    -- Identity
    supplier_code                VARCHAR(50)   NOT NULL,
    legal_name                   VARCHAR(300)  NOT NULL,
    display_name                 VARCHAR(200)  NOT NULL,
    short_name                   VARCHAR(100),
    trade_name                   VARCHAR(200),

    -- Classification
    supplier_type_id             UUID          NOT NULL,
    supplier_category_id         UUID          NOT NULL,
    supplier_group_id            UUID,

    -- Status & Lifecycle
    supplier_status_id           UUID          NOT NULL,
    is_active                    BOOLEAN       NOT NULL DEFAULT TRUE,
    is_preferred                 BOOLEAN       NOT NULL DEFAULT FALSE,
    is_strategic                 BOOLEAN       NOT NULL DEFAULT FALSE,
    is_approved                  BOOLEAN       NOT NULL DEFAULT FALSE,
    is_blocked                   BOOLEAN       NOT NULL DEFAULT FALSE,
    is_blacklisted               BOOLEAN       NOT NULL DEFAULT FALSE,
    is_foreign_supplier          BOOLEAN       NOT NULL DEFAULT FALSE,
    blacklist_reason             TEXT,
    blacklist_date               DATE,
    blacklisted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Financial
    payment_terms_id             UUID,
    default_currency_code        VARCHAR(10)   NOT NULL DEFAULT 'INR',
    credit_limit                 NUMERIC(18,2),
    credit_limit_currency        VARCHAR(10)   DEFAULT 'INR',
    annual_turnover              NUMERIC(18,2),
    annual_turnover_currency     VARCHAR(10),

    -- Tax & Registration
    business_registration_number VARCHAR(100),
    gst_number                   VARCHAR(20),
    pan_number                   VARCHAR(20),
    tan_number                   VARCHAR(20),
    tin_number                   VARCHAR(50),
    vat_number                   VARCHAR(50),
    import_export_code           VARCHAR(30),

    -- Geographic
    country_id                   UUID          NOT NULL,
    state_id                     UUID,

    -- Contact & Web
    primary_email                VARCHAR(300),
    primary_phone                VARCHAR(30),
    website                      VARCHAR(500),

    -- Relationship — Parent Supplier (self-referencing)
    parent_supplier_id           UUID,

    -- Dates
    registration_date            DATE,
    approved_date                DATE,
    contract_start_date          DATE,
    contract_end_date            DATE,

    -- Internal Notes
    remarks                      TEXT,
    internal_notes               TEXT,

    row_version                  INT           NOT NULL DEFAULT 1,
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted                   BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc               TIMESTAMPTZ,
    deleted_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Foreign Keys
    CONSTRAINT fk_suppliers_company        FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_suppliers_type           FOREIGN KEY (supplier_type_id)
        REFERENCES supplier.supplier_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_suppliers_category       FOREIGN KEY (supplier_category_id)
        REFERENCES supplier.supplier_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_suppliers_group          FOREIGN KEY (supplier_group_id)
        REFERENCES supplier.supplier_groups(id) ON DELETE SET NULL,
    CONSTRAINT fk_suppliers_status         FOREIGN KEY (supplier_status_id)
        REFERENCES supplier.supplier_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_suppliers_payment_terms  FOREIGN KEY (payment_terms_id)
        REFERENCES supplier.payment_terms(id) ON DELETE SET NULL,
    CONSTRAINT fk_suppliers_country        FOREIGN KEY (country_id)
        REFERENCES organization.countries(id) ON DELETE RESTRICT,
    CONSTRAINT fk_suppliers_state          FOREIGN KEY (state_id)
        REFERENCES organization.states(id) ON DELETE SET NULL,
    CONSTRAINT fk_suppliers_parent         FOREIGN KEY (parent_supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE SET NULL,

    -- Business Uniqueness
    CONSTRAINT uq_suppliers_code           UNIQUE (company_id, supplier_code),
    CONSTRAINT uq_suppliers_gst            UNIQUE (company_id, gst_number),

    -- Integrity
    CONSTRAINT chk_suppliers_no_self        CHECK (id <> parent_supplier_id),
    CONSTRAINT chk_suppliers_credit_limit   CHECK (credit_limit IS NULL OR credit_limit >= 0),
    CONSTRAINT chk_suppliers_blacklist      CHECK (
        is_blacklisted = FALSE OR blacklist_date IS NOT NULL
    ),
    CONSTRAINT chk_suppliers_contract_dates CHECK (
        contract_start_date IS NULL OR contract_end_date IS NULL OR
        contract_end_date >= contract_start_date
    ),
    CONSTRAINT chk_suppliers_gst_format     CHECK (
        gst_number IS NULL OR
        gst_number ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    ),
    CONSTRAINT chk_suppliers_pan_format     CHECK (
        pan_number IS NULL OR pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
    ),
    CONSTRAINT chk_suppliers_code_notempty  CHECK (length(trim(supplier_code)) > 0),
    CONSTRAINT chk_suppliers_name_notempty  CHECK (length(trim(legal_name)) > 0)
);

COMMENT ON TABLE  supplier.suppliers IS
    '[REGISTRY — PERMANENT] Core supplier master registry. Each row is the permanent identity record '
    'for one supplier entity. Supplier records are never hard-deleted — they are soft-deleted with '
    'full audit. Self-referencing parent_supplier_id supports corporate hierarchies. '
    'is_blacklisted requires blacklist_date (enforced by CHECK constraint). '
    'GST format validated by regex for Indian GST (15-character GSTIN).';
COMMENT ON COLUMN supplier.suppliers.supplier_code           IS 'Immutable business key per company. Assigned at creation, never changed.';
COMMENT ON COLUMN supplier.suppliers.legal_name              IS 'Registered legal name exactly as in business registration documents.';
COMMENT ON COLUMN supplier.suppliers.is_preferred            IS 'TRUE for preferred suppliers who get first opportunity in procurement sourcing.';
COMMENT ON COLUMN supplier.suppliers.is_strategic            IS 'TRUE for strategic suppliers with long-term partnership agreements.';
COMMENT ON COLUMN supplier.suppliers.is_blocked              IS 'TRUE for temporarily blocked suppliers. Blocks procurement without full blacklisting.';
COMMENT ON COLUMN supplier.suppliers.is_blacklisted          IS 'TRUE for permanently blacklisted suppliers. Requires blacklist_date. Blocks all procurement and payment.';
COMMENT ON COLUMN supplier.suppliers.is_foreign_supplier     IS 'TRUE for suppliers outside the company country. Triggers foreign exchange and customs workflows.';
COMMENT ON COLUMN supplier.suppliers.parent_supplier_id      IS 'Self-referencing FK for corporate group hierarchy. NULL for standalone/parent suppliers. Anti-self CHECK enforced.';
COMMENT ON COLUMN supplier.suppliers.credit_limit            IS 'Maximum outstanding payable allowed to this supplier. Enforced by Finance module. NULL = no limit.';
COMMENT ON COLUMN supplier.suppliers.gst_number              IS '15-character Indian GSTIN. Regex validated: chk_suppliers_gst_format. Unique per company.';
COMMENT ON COLUMN supplier.suppliers.pan_number              IS '10-character Indian PAN. Regex validated: chk_suppliers_pan_format.';
COMMENT ON COLUMN supplier.suppliers.row_version             IS 'Optimistic concurrency token. All updates must check and increment.';

-- =============================================================================
-- SECTION 3 — SUPPLIER CONTACTS
-- =============================================================================

CREATE TABLE supplier.supplier_contacts (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id              UUID          NOT NULL,
    contact_type_id          UUID          NOT NULL,

    -- Identity
    first_name               VARCHAR(100)  NOT NULL,
    last_name                VARCHAR(100),
    full_name                VARCHAR(200)  GENERATED ALWAYS AS (
        CASE WHEN last_name IS NOT NULL
             THEN trim(first_name || ' ' || last_name)
             ELSE trim(first_name)
        END
    ) STORED,
    designation              VARCHAR(150),
    department               VARCHAR(150),
    gender                   VARCHAR(20),

    -- Contact Details
    mobile                   VARCHAR(30),
    phone                    VARCHAR(30),
    email                    VARCHAR(300),
    whatsapp                 VARCHAR(30),
    linkedin_url             VARCHAR(500),

    -- Flags
    is_primary               BOOLEAN       NOT NULL DEFAULT FALSE,
    is_emergency             BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,

    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_contacts_supplier FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
    CONSTRAINT fk_sup_contacts_type     FOREIGN KEY (contact_type_id)
        REFERENCES supplier.contact_types(id) ON DELETE RESTRICT,

    CONSTRAINT chk_sup_contacts_first_name  CHECK (length(trim(first_name)) > 0),
    CONSTRAINT chk_sup_contacts_has_contact CHECK (
        mobile IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL
    )
);

COMMENT ON TABLE  supplier.supplier_contacts IS
    '[FOUNDATION] Multiple contacts per supplier. Supports primary, emergency, and functional contacts '
    '(Finance, Sales, Technical, Logistics). full_name is a GENERATED column from first_name + last_name. '
    'At least one of mobile, email, or phone must be provided (chk_sup_contacts_has_contact).';
COMMENT ON COLUMN supplier.supplier_contacts.is_primary   IS 'Exactly one primary contact recommended per supplier. Enforced by application layer (not DB constraint to allow flexible transitions).';
COMMENT ON COLUMN supplier.supplier_contacts.is_emergency IS 'TRUE for emergency/escalation contacts. Used for critical supply chain alerts.';
COMMENT ON COLUMN supplier.supplier_contacts.full_name    IS '[GENERATED] Concatenation of first_name + last_name. Read-only.';

-- =============================================================================
-- SECTION 4 — SUPPLIER ADDRESSES
-- =============================================================================

CREATE TABLE supplier.supplier_addresses (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id              UUID          NOT NULL,
    address_type_id          UUID          NOT NULL,

    -- Address Lines
    address_line_1           VARCHAR(300)  NOT NULL,
    address_line_2           VARCHAR(300),
    address_line_3           VARCHAR(300),

    -- Geographic
    country_id               UUID          NOT NULL,
    state_id                 UUID,
    district                 VARCHAR(150),
    city                     VARCHAR(150)  NOT NULL,
    postal_code              VARCHAR(20),

    -- Geolocation
    latitude                 NUMERIC(10,7),
    longitude                NUMERIC(10,7),
    geofence_radius_meters   INT,

    -- Metadata
    is_primary               BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,
    contact_person_name      VARCHAR(200),
    contact_phone            VARCHAR(30),

    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_addr_supplier FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
    CONSTRAINT fk_sup_addr_type     FOREIGN KEY (address_type_id)
        REFERENCES supplier.address_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sup_addr_country  FOREIGN KEY (country_id)
        REFERENCES organization.countries(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sup_addr_state    FOREIGN KEY (state_id)
        REFERENCES organization.states(id) ON DELETE SET NULL,

    CONSTRAINT chk_sup_addr_lat     CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
    CONSTRAINT chk_sup_addr_lon     CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_sup_addr_geofence CHECK (geofence_radius_meters IS NULL OR geofence_radius_meters > 0),
    CONSTRAINT chk_sup_addr_line1   CHECK (length(trim(address_line_1)) > 0),
    CONSTRAINT chk_sup_addr_city    CHECK (length(trim(city)) > 0)
);

COMMENT ON TABLE  supplier.supplier_addresses IS
    '[FOUNDATION] Unlimited addresses per supplier. Supports Billing, Shipping, HeadOffice, '
    'Branch, Warehouse, Factory, Registered address types. Geolocation-ready for logistics '
    'and delivery verification. Latitude/longitude range validated by CHECK constraints.';
COMMENT ON COLUMN supplier.supplier_addresses.latitude   IS 'Decimal degrees. BETWEEN -90 and 90. Used for logistics geofencing.';
COMMENT ON COLUMN supplier.supplier_addresses.longitude  IS 'Decimal degrees. BETWEEN -180 and 180.';
COMMENT ON COLUMN supplier.supplier_addresses.is_primary IS 'Primary address for official correspondence and billing by default.';

-- =============================================================================
-- SECTION 5 — SUPPLIER BANK ACCOUNTS
-- =============================================================================

CREATE TABLE supplier.supplier_bank_accounts (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id              UUID          NOT NULL,

    -- Bank Details
    bank_name                VARCHAR(200)  NOT NULL,
    bank_branch              VARCHAR(200),
    account_holder_name      VARCHAR(300)  NOT NULL,
    account_number           VARCHAR(50)   NOT NULL,
    account_type             VARCHAR(50),

    -- Routing Codes
    ifsc_code                VARCHAR(20),
    swift_code               VARCHAR(20),
    iban                     VARCHAR(50),
    routing_number           VARCHAR(30),
    sort_code                VARCHAR(20),

    -- Currency
    currency_code            VARCHAR(10)   NOT NULL DEFAULT 'INR',

    -- Verification
    is_verified              BOOLEAN       NOT NULL DEFAULT FALSE,
    verified_by_user_id      UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    verified_at_utc          TIMESTAMPTZ,
    verification_reference   VARCHAR(100),

    -- Flags
    is_primary               BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,

    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_bank_supplier FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,

    CONSTRAINT uq_sup_bank_account  UNIQUE (supplier_id, account_number, ifsc_code),

    CONSTRAINT chk_sup_bank_ifsc    CHECK (
        ifsc_code IS NULL OR ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'
    ),
    CONSTRAINT chk_sup_bank_swift   CHECK (
        swift_code IS NULL OR length(swift_code) BETWEEN 8 AND 11
    ),
    CONSTRAINT chk_sup_bank_holder  CHECK (length(trim(account_holder_name)) > 0),
    CONSTRAINT chk_sup_bank_number  CHECK (length(trim(account_number)) > 0)
);

COMMENT ON TABLE  supplier.supplier_bank_accounts IS
    '[FOUNDATION] Multiple bank accounts per supplier. Supports domestic (IFSC) and '
    'international (SWIFT/IBAN) banking. IFSC and SWIFT formats validated by regex. '
    'is_verified flag requires verification by an authorized user before Finance module '
    'processes payments against the account.';
COMMENT ON COLUMN supplier.supplier_bank_accounts.ifsc_code         IS '11-character Indian IFSC code. Regex validated: ^[A-Z]{4}0[A-Z0-9]{6}$.';
COMMENT ON COLUMN supplier.supplier_bank_accounts.swift_code        IS '8 or 11 character SWIFT/BIC code for international transfers.';
COMMENT ON COLUMN supplier.supplier_bank_accounts.is_verified       IS 'TRUE after bank account is verified via penny drop or document verification. Finance module gates payment on this flag.';
COMMENT ON COLUMN supplier.supplier_bank_accounts.is_primary        IS 'Primary account used for payment by default. Finance module uses this as the default payee account.';

-- =============================================================================
-- SECTION 6 — SUPPLIER TAX PROFILES
-- =============================================================================

CREATE TABLE supplier.supplier_tax_profiles (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id                  UUID          NOT NULL,

    -- Indian Taxes
    gst_registration_type        VARCHAR(50),
    gst_registration_date        DATE,
    gst_expiry_date              DATE,
    is_gst_registered            BOOLEAN       NOT NULL DEFAULT FALSE,
    is_gst_composition           BOOLEAN       NOT NULL DEFAULT FALSE,
    is_gst_exempt                BOOLEAN       NOT NULL DEFAULT FALSE,
    gst_exemption_reason         TEXT,

    pan_registration_date        DATE,
    tan_number                   VARCHAR(20),
    tan_registration_date        DATE,

    -- International Taxes
    vat_registration_date        DATE,
    vat_expiry_date              DATE,
    tin_registration_date        DATE,
    is_tax_exempt                BOOLEAN       NOT NULL DEFAULT FALSE,
    tax_exemption_certificate    VARCHAR(100),
    tax_exemption_valid_from     DATE,
    tax_exemption_valid_to       DATE,

    -- Withholding Tax
    tds_applicable               BOOLEAN       NOT NULL DEFAULT FALSE,
    tds_section                  VARCHAR(20),
    tds_rate_pct                 NUMERIC(5,2),

    -- Reverse Charge Mechanism
    rcm_applicable               BOOLEAN       NOT NULL DEFAULT FALSE,

    -- Filing Frequencies
    gst_return_frequency         VARCHAR(20),

    remarks                      TEXT,

    row_version                  INT           NOT NULL DEFAULT 1,
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_tax_supplier  FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
    CONSTRAINT uq_sup_tax_supplier   UNIQUE (supplier_id),

    CONSTRAINT chk_sup_tax_gst_dates CHECK (
        gst_registration_date IS NULL OR gst_expiry_date IS NULL OR
        gst_expiry_date > gst_registration_date
    ),
    CONSTRAINT chk_sup_tax_vat_dates CHECK (
        vat_registration_date IS NULL OR vat_expiry_date IS NULL OR
        vat_expiry_date > vat_registration_date
    ),
    CONSTRAINT chk_sup_tax_exemption_dates CHECK (
        tax_exemption_valid_from IS NULL OR tax_exemption_valid_to IS NULL OR
        tax_exemption_valid_to >= tax_exemption_valid_from
    ),
    CONSTRAINT chk_sup_tax_tds_rate CHECK (
        tds_rate_pct IS NULL OR tds_rate_pct BETWEEN 0 AND 100
    )
);

COMMENT ON TABLE  supplier.supplier_tax_profiles IS
    '[FOUNDATION — 1:1 with suppliers] Complete tax configuration per supplier. '
    'Supports Indian taxation (GST, PAN, TAN, TDS, RCM) and international tax frameworks '
    '(VAT, TIN, tax exemptions). One row per supplier enforced by UNIQUE constraint. '
    'Finance module reads this table for tax computation on purchase invoices.';
COMMENT ON COLUMN supplier.supplier_tax_profiles.is_gst_composition IS
    'TRUE for suppliers on GST Composition scheme. Affects input tax credit eligibility.';
COMMENT ON COLUMN supplier.supplier_tax_profiles.rcm_applicable      IS
    'TRUE for suppliers where Reverse Charge Mechanism applies. Finance module switches payee for GST.';
COMMENT ON COLUMN supplier.supplier_tax_profiles.tds_rate_pct        IS
    'TDS deduction rate percentage for this supplier. 0–100. Applied by Finance on invoice payment.';

-- =============================================================================
-- SECTION 7 — SUPPLIER DOCUMENTS
-- =============================================================================

CREATE TABLE supplier.supplier_documents (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id              UUID          NOT NULL,
    document_type_id         UUID          NOT NULL,

    -- Document Identity
    document_number          VARCHAR(200),
    document_name            VARCHAR(300)  NOT NULL,
    issuing_authority        VARCHAR(300),
    issuing_country_id       UUID,

    -- Validity
    issue_date               DATE,
    expiry_date              DATE,
    is_expired               BOOLEAN       NOT NULL GENERATED ALWAYS AS (
        expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE
    ) STORED,
    renewal_reminder_days    INT           NOT NULL DEFAULT 30,

    -- File Reference (metadata only — actual file stored in external document store)
    file_reference           VARCHAR(500),
    file_mime_type           VARCHAR(100),
    file_size_bytes          BIGINT,
    storage_bucket           VARCHAR(200),

    -- Verification
    is_verified              BOOLEAN       NOT NULL DEFAULT FALSE,
    verified_by_user_id      UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    verified_at_utc          TIMESTAMPTZ,

    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,
    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_docs_supplier  FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
    CONSTRAINT fk_sup_docs_type      FOREIGN KEY (document_type_id)
        REFERENCES supplier.document_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sup_docs_country   FOREIGN KEY (issuing_country_id)
        REFERENCES organization.countries(id) ON DELETE SET NULL,

    CONSTRAINT chk_sup_docs_dates    CHECK (
        issue_date IS NULL OR expiry_date IS NULL OR expiry_date >= issue_date
    ),
    CONSTRAINT chk_sup_docs_reminder CHECK (renewal_reminder_days >= 0),
    CONSTRAINT chk_sup_docs_name     CHECK (length(trim(document_name)) > 0)
);

COMMENT ON TABLE  supplier.supplier_documents IS
    '[FOUNDATION] Supplier document metadata registry. Stores document metadata only — '
    'actual binary files are stored in an external document management system (S3, SharePoint). '
    'file_reference stores the external storage path/key. '
    'is_expired is a GENERATED column — automatically TRUE when expiry_date < CURRENT_DATE. '
    'renewal_reminder_days drives notification scheduling in the future notification module.';
COMMENT ON COLUMN supplier.supplier_documents.is_expired          IS
    '[GENERATED] Automatically TRUE when expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE. Never set manually.';
COMMENT ON COLUMN supplier.supplier_documents.file_reference       IS
    'External storage path/key (e.g. S3 object key or SharePoint document URL). '
    'Actual file management is handled by the Document Management module.';
COMMENT ON COLUMN supplier.supplier_documents.renewal_reminder_days IS
    'Days before expiry to trigger renewal reminder. Default 30 days.';

-- =============================================================================
-- SECTION 8 — SUPPLIER COMPLIANCE
-- =============================================================================

CREATE TABLE supplier.supplier_compliance (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id                  UUID          NOT NULL,
    approval_status_id           UUID          NOT NULL,
    compliance_status_id         UUID          NOT NULL,
    kyc_status_id                UUID          NOT NULL,
    risk_rating_id               UUID,

    -- Approval
    approved_by_user_id          UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    approved_at_utc              TIMESTAMPTZ,
    approval_remarks             TEXT,
    approval_expiry_date         DATE,

    -- KYC
    kyc_completed_date           DATE,
    kyc_expiry_date              DATE,
    kyc_reviewer_user_id         UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    kyc_remarks                  TEXT,

    -- Verification
    is_verified                  BOOLEAN       NOT NULL DEFAULT FALSE,
    verified_by_user_id          UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    verified_at_utc              TIMESTAMPTZ,

    -- Compliance Review
    last_review_date             DATE,
    next_review_date             DATE,
    review_frequency_id          UUID,
    reviewing_employee_id        UUID,          -- forward ref: employee.employees(id)
    compliance_notes             TEXT,

    -- Risk
    risk_assessment_date         DATE,
    risk_notes                   TEXT,

    row_version                  INT           NOT NULL DEFAULT 1,
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_comp_supplier     FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
    CONSTRAINT fk_sup_comp_approval     FOREIGN KEY (approval_status_id)
        REFERENCES supplier.approval_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sup_comp_compliance   FOREIGN KEY (compliance_status_id)
        REFERENCES supplier.compliance_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sup_comp_kyc          FOREIGN KEY (kyc_status_id)
        REFERENCES supplier.kyc_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sup_comp_risk         FOREIGN KEY (risk_rating_id)
        REFERENCES supplier.risk_ratings(id) ON DELETE SET NULL,
    CONSTRAINT fk_sup_comp_review_freq  FOREIGN KEY (review_frequency_id)
        REFERENCES supplier.review_frequencies(id) ON DELETE SET NULL,

    CONSTRAINT uq_sup_comp_supplier     UNIQUE (supplier_id),

    CONSTRAINT chk_sup_comp_review_dates CHECK (
        last_review_date IS NULL OR next_review_date IS NULL OR
        next_review_date > last_review_date
    ),
    CONSTRAINT chk_sup_comp_kyc_dates CHECK (
        kyc_completed_date IS NULL OR kyc_expiry_date IS NULL OR
        kyc_expiry_date > kyc_completed_date
    )
);

COMMENT ON TABLE  supplier.supplier_compliance IS
    '[FOUNDATION — 1:1 with suppliers] Supplier compliance, KYC, approval, and risk profile. '
    'One row per supplier enforced by UNIQUE constraint. '
    'Approval module reads approval_status_id to gate procurement. '
    'Finance module reads kyc_status_id and risk_rating_id for payment exposure controls. '
    'reviewing_employee_id is a forward reference to employee.employees(id) — FK added when Employee module is integrated.';
COMMENT ON COLUMN supplier.supplier_compliance.reviewing_employee_id IS
    'Forward reference UUID for employee.employees(id). No FK constraint until Employee module integrates with supplier schema.';
COMMENT ON COLUMN supplier.supplier_compliance.approval_expiry_date  IS
    'Date by which supplier approval expires and must be renewed. Used for periodic re-validation.';

-- =============================================================================
-- SECTION 9 — SUPPLIER PERFORMANCE PROFILES
-- =============================================================================

CREATE TABLE supplier.supplier_performance_profiles (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id                  UUID          NOT NULL,
    review_frequency_id          UUID,

    -- Ratings (1.00–5.00 scale)
    quality_rating               NUMERIC(4,2),
    delivery_rating              NUMERIC(4,2),
    service_rating               NUMERIC(4,2),
    price_rating                 NUMERIC(4,2),
    overall_rating               NUMERIC(4,2),

    -- Operational Metrics (updated by Procurement/Quality modules)
    on_time_delivery_pct         NUMERIC(5,2),
    defect_rate_pct              NUMERIC(5,2),
    fill_rate_pct                NUMERIC(5,2),
    return_rate_pct              NUMERIC(5,2),
    lead_time_days_avg           NUMERIC(8,2),

    -- Scoring
    preferred_supplier_score     NUMERIC(8,4),
    last_evaluation_date         DATE,
    next_evaluation_date         DATE,

    -- Historical Snapshot
    rating_12m_avg               NUMERIC(4,2),
    rating_24m_avg               NUMERIC(4,2),
    total_orders                 INT           NOT NULL DEFAULT 0,
    total_order_value            NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_returns                INT           NOT NULL DEFAULT 0,

    remarks                      TEXT,

    row_version                  INT           NOT NULL DEFAULT 1,
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_perf_supplier    FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
    CONSTRAINT fk_sup_perf_review_freq FOREIGN KEY (review_frequency_id)
        REFERENCES supplier.review_frequencies(id) ON DELETE SET NULL,

    CONSTRAINT uq_sup_perf_supplier    UNIQUE (supplier_id),

    -- Rating range constraints
    CONSTRAINT chk_sup_perf_quality   CHECK (quality_rating  IS NULL OR quality_rating  BETWEEN 1 AND 5),
    CONSTRAINT chk_sup_perf_delivery  CHECK (delivery_rating IS NULL OR delivery_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_sup_perf_service   CHECK (service_rating  IS NULL OR service_rating  BETWEEN 1 AND 5),
    CONSTRAINT chk_sup_perf_price     CHECK (price_rating    IS NULL OR price_rating    BETWEEN 1 AND 5),
    CONSTRAINT chk_sup_perf_overall   CHECK (overall_rating  IS NULL OR overall_rating  BETWEEN 1 AND 5),
    CONSTRAINT chk_sup_perf_otd       CHECK (on_time_delivery_pct IS NULL OR on_time_delivery_pct BETWEEN 0 AND 100),
    CONSTRAINT chk_sup_perf_defect    CHECK (defect_rate_pct      IS NULL OR defect_rate_pct      BETWEEN 0 AND 100),
    CONSTRAINT chk_sup_perf_fill      CHECK (fill_rate_pct        IS NULL OR fill_rate_pct        BETWEEN 0 AND 100),
    CONSTRAINT chk_sup_perf_return    CHECK (return_rate_pct      IS NULL OR return_rate_pct      BETWEEN 0 AND 100),
    CONSTRAINT chk_sup_perf_eval_dates CHECK (
        last_evaluation_date IS NULL OR next_evaluation_date IS NULL OR
        next_evaluation_date > last_evaluation_date
    ),
    CONSTRAINT chk_sup_perf_total_orders CHECK (total_orders  >= 0),
    CONSTRAINT chk_sup_perf_total_value  CHECK (total_order_value >= 0)
);

COMMENT ON TABLE  supplier.supplier_performance_profiles IS
    '[HYBRID: FOUNDATION config + OPERATIONAL snapshot] Supplier performance rating profile. '
    'FOUNDATION config columns: review_frequency_id, next_evaluation_date. '
    'OPERATIONAL snapshot columns: all rating fields, metric percentages, totals. '
    'Updated by Procurement (order counts, fill rate) and Quality modules (defect rate, returns). '
    'All ratings on 1.00–5.00 scale enforced by CHECK constraints. '
    'One row per supplier enforced by UNIQUE constraint.';
COMMENT ON COLUMN supplier.supplier_performance_profiles.on_time_delivery_pct IS
    '[OPERATIONAL] % of purchase orders delivered on or before promised date. Updated by Procurement GRN module.';
COMMENT ON COLUMN supplier.supplier_performance_profiles.defect_rate_pct       IS
    '[OPERATIONAL] % of received goods with quality defects. Updated by Quality Inspection module.';
COMMENT ON COLUMN supplier.supplier_performance_profiles.preferred_supplier_score IS
    '[OPERATIONAL] Composite weighted score used by sourcing algorithm for preferred supplier selection.';

-- =============================================================================
-- SECTION 10 — SUPPLIER RELATIONSHIPS (Corporate Hierarchy & Linkages)
-- =============================================================================

CREATE TABLE supplier.supplier_relationships (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id              UUID          NOT NULL,
    related_supplier_id      UUID          NOT NULL,
    relationship_type        VARCHAR(50)   NOT NULL,

    effective_from           DATE          NOT NULL DEFAULT CURRENT_DATE,
    effective_to             DATE,

    equity_stake_pct         NUMERIC(5,2),
    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_rel_supplier         FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
    CONSTRAINT fk_sup_rel_related          FOREIGN KEY (related_supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,

    CONSTRAINT uq_sup_rel_unique           UNIQUE (supplier_id, related_supplier_id, relationship_type),
    CONSTRAINT chk_sup_rel_no_self         CHECK (supplier_id <> related_supplier_id),
    CONSTRAINT chk_sup_rel_type            CHECK (relationship_type IN (
        'Subsidiary', 'HoldingCompany', 'SisterCompany', 'JointVenture',
        'Distributor', 'ManufacturingPartner', 'MergedFrom', 'SpunOff', 'Acquired', 'Related'
    )),
    CONSTRAINT chk_sup_rel_dates           CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    ),
    CONSTRAINT chk_sup_rel_equity          CHECK (
        equity_stake_pct IS NULL OR equity_stake_pct BETWEEN 0 AND 100
    )
);

COMMENT ON TABLE  supplier.supplier_relationships IS
    '[FOUNDATION] Supplier-to-supplier relationship registry. Supports corporate hierarchy '
    '(Subsidiary, HoldingCompany, SisterCompany), partnership structures (JointVenture, '
    'ManufacturingPartner, Distributor), and M&A history (MergedFrom, SpunOff, Acquired). '
    'Anti-self CHECK enforced. relationship_type restricted to controlled vocabulary.';
COMMENT ON COLUMN supplier.supplier_relationships.relationship_type  IS
    'Controlled relationship type: Subsidiary, HoldingCompany, SisterCompany, JointVenture, '
    'Distributor, ManufacturingPartner, MergedFrom, SpunOff, Acquired, Related.';
COMMENT ON COLUMN supplier.supplier_relationships.equity_stake_pct   IS
    'Equity ownership percentage (for Subsidiary, JointVenture relationships). 0–100.';

-- =============================================================================
-- SECTION 11 — SUPPLIER CERTIFICATIONS
-- =============================================================================

CREATE TABLE supplier.supplier_certifications (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id              UUID          NOT NULL,

    certification_name       VARCHAR(200)  NOT NULL,
    certification_code       VARCHAR(100),
    certifying_body          VARCHAR(200),
    certificate_number       VARCHAR(150),
    scope                    TEXT,

    issue_date               DATE,
    expiry_date              DATE,
    is_expired               BOOLEAN       NOT NULL GENERATED ALWAYS AS (
        expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE
    ) STORED,
    renewal_reminder_days    INT           NOT NULL DEFAULT 60,

    -- File Reference
    file_reference           VARCHAR(500),

    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,
    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_cert_supplier  FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,

    CONSTRAINT chk_sup_cert_dates    CHECK (
        issue_date IS NULL OR expiry_date IS NULL OR expiry_date >= issue_date
    ),
    CONSTRAINT chk_sup_cert_reminder CHECK (renewal_reminder_days >= 0),
    CONSTRAINT chk_sup_cert_name     CHECK (length(trim(certification_name)) > 0)
);

COMMENT ON TABLE  supplier.supplier_certifications IS
    '[FOUNDATION] Supplier quality and compliance certifications: ISO 9001, ISO 22000, '
    'HACCP, FSSAI, HALAL, Organic, BRC, GMP, etc. is_expired is a GENERATED column. '
    'Separate from supplier_documents — certifications have structured scoring '
    'and affect quality_rating in performance profiles.';

-- =============================================================================
-- SECTION 12 — SUPPLIER PRODUCT CATEGORY APPROVALS
-- =============================================================================

CREATE TABLE supplier.supplier_product_category_approvals (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id              UUID          NOT NULL,
    product_category_id      UUID          NOT NULL,

    is_approved              BOOLEAN       NOT NULL DEFAULT FALSE,
    approved_by_user_id      UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    approved_at_utc          TIMESTAMPTZ,
    approval_expiry_date     DATE,

    lead_time_days           INT,
    minimum_order_qty        NUMERIC(18,4),
    minimum_order_value      NUMERIC(18,2),
    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_sup_pca_supplier   FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
    CONSTRAINT fk_sup_pca_category   FOREIGN KEY (product_category_id)
        REFERENCES product.product_categories(id) ON DELETE RESTRICT,

    CONSTRAINT uq_sup_pca            UNIQUE (supplier_id, product_category_id),
    CONSTRAINT chk_sup_pca_lead_time CHECK (lead_time_days IS NULL OR lead_time_days > 0),
    CONSTRAINT chk_sup_pca_moq       CHECK (minimum_order_qty IS NULL OR minimum_order_qty > 0),
    CONSTRAINT chk_sup_pca_mov       CHECK (minimum_order_value IS NULL OR minimum_order_value > 0)
);

COMMENT ON TABLE  supplier.supplier_product_category_approvals IS
    '[FOUNDATION] Approved product categories per supplier. Procurement module validates '
    'that a Purchase Order line item category is approved for the selected supplier. '
    'Stores lead times and MOQ/MOV terms per category for sourcing optimization.';
COMMENT ON COLUMN supplier.supplier_product_category_approvals.lead_time_days     IS 'Average lead time in days for this supplier to deliver this product category.';
COMMENT ON COLUMN supplier.supplier_product_category_approvals.minimum_order_qty  IS 'Minimum order quantity in base UOM for this category with this supplier.';
COMMENT ON COLUMN supplier.supplier_product_category_approvals.minimum_order_value IS 'Minimum order value in default_currency_code for this category.';

-- =============================================================================
-- SECTION 13 — SUPPLIER STATUS HISTORY (Audit Trail)
-- =============================================================================

CREATE TABLE supplier.supplier_status_history (
    id                    UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id           UUID          NOT NULL,
    supplier_status_id    UUID          NOT NULL,

    effective_from        DATE          NOT NULL,
    effective_to          DATE,
    is_current            BOOLEAN       NOT NULL DEFAULT TRUE,

    changed_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    reason                TEXT,
    remarks               TEXT,

    created_at_utc        TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_sup_status_hist_supplier FOREIGN KEY (supplier_id)
        REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
    CONSTRAINT fk_sup_status_hist_status   FOREIGN KEY (supplier_status_id)
        REFERENCES supplier.supplier_statuses(id) ON DELETE RESTRICT,

    CONSTRAINT chk_sup_status_hist_dates   CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    ),

    EXCLUDE USING GIST (
        supplier_id WITH =,
        daterange(effective_from, COALESCE(effective_to, '9999-12-31'::DATE), '[)') WITH &&
    )
);

CREATE UNIQUE INDEX uix_sup_status_hist_current
    ON supplier.supplier_status_history (supplier_id)
    WHERE is_current = TRUE;

COMMENT ON TABLE  supplier.supplier_status_history IS
    '[OPERATIONAL — Append-only] Immutable audit trail of supplier status changes. '
    'Exclusion constraint prevents overlapping date ranges per supplier. '
    'Partial unique index enforces exactly one current status record per supplier.';

-- =============================================================================
-- SECTION 14 — COMPLETE INDEXING STRATEGY
-- =============================================================================

-- ── SUPPLIERS (Core — highest query load) ────────────────────────────────────
CREATE INDEX pix_suppliers_active           ON supplier.suppliers (id)
    WHERE is_deleted = FALSE;
CREATE INDEX cidx_suppliers_company_active  ON supplier.suppliers (company_id, is_active, supplier_status_id)
    WHERE is_deleted = FALSE;
CREATE INDEX idx_suppliers_company_id       ON supplier.suppliers (company_id);
CREATE INDEX idx_suppliers_type_id          ON supplier.suppliers (supplier_type_id);
CREATE INDEX idx_suppliers_category_id      ON supplier.suppliers (supplier_category_id);
CREATE INDEX idx_suppliers_group_id         ON supplier.suppliers (supplier_group_id)
    WHERE supplier_group_id IS NOT NULL;
CREATE INDEX idx_suppliers_status_id        ON supplier.suppliers (supplier_status_id);
CREATE INDEX idx_suppliers_country_id       ON supplier.suppliers (country_id);
CREATE INDEX idx_suppliers_parent_id        ON supplier.suppliers (parent_supplier_id)
    WHERE parent_supplier_id IS NOT NULL;
CREATE INDEX idx_suppliers_payment_terms_id ON supplier.suppliers (payment_terms_id)
    WHERE payment_terms_id IS NOT NULL;

-- Procurement gating: approved + active suppliers
CREATE INDEX pix_suppliers_approved_active  ON supplier.suppliers (company_id, is_approved, is_active)
    WHERE is_deleted = FALSE AND is_blocked = FALSE AND is_blacklisted = FALSE;

-- Strategic/preferred sourcing lists
CREATE INDEX pix_suppliers_preferred        ON supplier.suppliers (company_id, is_preferred)
    WHERE is_deleted = FALSE AND is_preferred = TRUE AND is_active = TRUE;
CREATE INDEX pix_suppliers_strategic        ON supplier.suppliers (company_id, is_strategic)
    WHERE is_deleted = FALSE AND is_strategic = TRUE;

-- Blocked/blacklisted safety index
CREATE INDEX pix_suppliers_blocked          ON supplier.suppliers (company_id)
    WHERE is_blocked = TRUE OR is_blacklisted = TRUE;

-- Contract expiry monitoring
CREATE INDEX idx_suppliers_contract_expiry  ON supplier.suppliers (contract_end_date ASC)
    WHERE contract_end_date IS NOT NULL AND is_deleted = FALSE;

-- Full-text search: legal_name, display_name, supplier_code
CREATE INDEX trgm_suppliers_legal_name      ON supplier.suppliers USING GIN (legal_name gin_trgm_ops);
CREATE INDEX trgm_suppliers_display_name    ON supplier.suppliers USING GIN (display_name gin_trgm_ops);
CREATE INDEX trgm_suppliers_code            ON supplier.suppliers USING GIN (supplier_code gin_trgm_ops);

-- Tax number searches
CREATE INDEX idx_suppliers_gst              ON supplier.suppliers (gst_number)
    WHERE gst_number IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_suppliers_pan              ON supplier.suppliers (pan_number)
    WHERE pan_number IS NOT NULL AND is_deleted = FALSE;

-- ── SUPPLIER CONTACTS ─────────────────────────────────────────────────────────
CREATE INDEX idx_sup_contacts_supplier_id   ON supplier.supplier_contacts (supplier_id);
CREATE INDEX idx_sup_contacts_type_id       ON supplier.supplier_contacts (contact_type_id);
CREATE INDEX pix_sup_contacts_primary       ON supplier.supplier_contacts (supplier_id)
    WHERE is_primary = TRUE AND is_deleted = FALSE;
CREATE INDEX pix_sup_contacts_emergency     ON supplier.supplier_contacts (supplier_id)
    WHERE is_emergency = TRUE AND is_deleted = FALSE;
CREATE INDEX trgm_sup_contacts_email        ON supplier.supplier_contacts USING GIN (email gin_trgm_ops)
    WHERE email IS NOT NULL;
CREATE INDEX trgm_sup_contacts_mobile       ON supplier.supplier_contacts USING GIN (mobile gin_trgm_ops)
    WHERE mobile IS NOT NULL;

-- ── SUPPLIER ADDRESSES ────────────────────────────────────────────────────────
CREATE INDEX idx_sup_addr_supplier_id       ON supplier.supplier_addresses (supplier_id);
CREATE INDEX idx_sup_addr_type_id           ON supplier.supplier_addresses (address_type_id);
CREATE INDEX idx_sup_addr_country_id        ON supplier.supplier_addresses (country_id);
CREATE INDEX pix_sup_addr_primary           ON supplier.supplier_addresses (supplier_id)
    WHERE is_primary = TRUE AND is_deleted = FALSE;

-- ── SUPPLIER BANK ACCOUNTS ────────────────────────────────────────────────────
CREATE INDEX idx_sup_bank_supplier_id       ON supplier.supplier_bank_accounts (supplier_id);
CREATE INDEX pix_sup_bank_primary           ON supplier.supplier_bank_accounts (supplier_id)
    WHERE is_primary = TRUE AND is_deleted = FALSE AND is_verified = TRUE;
CREATE INDEX pix_sup_bank_unverified        ON supplier.supplier_bank_accounts (supplier_id)
    WHERE is_verified = FALSE AND is_deleted = FALSE;

-- ── SUPPLIER TAX PROFILES ─────────────────────────────────────────────────────
CREATE INDEX idx_sup_tax_supplier_id        ON supplier.supplier_tax_profiles (supplier_id);
CREATE INDEX pix_sup_tax_exempt             ON supplier.supplier_tax_profiles (supplier_id)
    WHERE is_tax_exempt = TRUE;

-- ── SUPPLIER DOCUMENTS ────────────────────────────────────────────────────────
CREATE INDEX idx_sup_docs_supplier_id       ON supplier.supplier_documents (supplier_id);
CREATE INDEX idx_sup_docs_type_id           ON supplier.supplier_documents (document_type_id);
CREATE INDEX idx_sup_docs_expiry            ON supplier.supplier_documents (expiry_date ASC)
    WHERE expiry_date IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX pix_sup_docs_expired           ON supplier.supplier_documents (supplier_id)
    WHERE is_expired = TRUE AND is_deleted = FALSE;

-- ── SUPPLIER COMPLIANCE ───────────────────────────────────────────────────────
CREATE INDEX idx_sup_comp_supplier_id       ON supplier.supplier_compliance (supplier_id);
CREATE INDEX idx_sup_comp_approval_id       ON supplier.supplier_compliance (approval_status_id);
CREATE INDEX idx_sup_comp_kyc_id            ON supplier.supplier_compliance (kyc_status_id);
CREATE INDEX idx_sup_comp_risk_id           ON supplier.supplier_compliance (risk_rating_id)
    WHERE risk_rating_id IS NOT NULL;
CREATE INDEX idx_sup_comp_next_review       ON supplier.supplier_compliance (next_review_date ASC)
    WHERE next_review_date IS NOT NULL;

-- ── SUPPLIER PERFORMANCE ──────────────────────────────────────────────────────
CREATE INDEX idx_sup_perf_supplier_id       ON supplier.supplier_performance_profiles (supplier_id);
CREATE INDEX idx_sup_perf_overall_rating    ON supplier.supplier_performance_profiles (overall_rating DESC NULLS LAST)
    WHERE overall_rating IS NOT NULL;
CREATE INDEX idx_sup_perf_next_eval         ON supplier.supplier_performance_profiles (next_evaluation_date ASC)
    WHERE next_evaluation_date IS NOT NULL;
-- Preferred supplier sourcing sort index
CREATE INDEX cidx_sup_perf_sourcing         ON supplier.supplier_performance_profiles
    (preferred_supplier_score DESC NULLS LAST, on_time_delivery_pct DESC NULLS LAST);

-- ── SUPPLIER RELATIONSHIPS ────────────────────────────────────────────────────
CREATE INDEX idx_sup_rel_supplier_id        ON supplier.supplier_relationships (supplier_id);
CREATE INDEX idx_sup_rel_related_id         ON supplier.supplier_relationships (related_supplier_id);
CREATE INDEX idx_sup_rel_type               ON supplier.supplier_relationships (relationship_type);

-- ── SUPPLIER CERTIFICATIONS ───────────────────────────────────────────────────
CREATE INDEX idx_sup_cert_supplier_id       ON supplier.supplier_certifications (supplier_id);
CREATE INDEX idx_sup_cert_expiry            ON supplier.supplier_certifications (expiry_date ASC)
    WHERE expiry_date IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX pix_sup_cert_expired           ON supplier.supplier_certifications (supplier_id)
    WHERE is_expired = TRUE AND is_deleted = FALSE;

-- ── SUPPLIER PRODUCT CATEGORY APPROVALS ──────────────────────────────────────
CREATE INDEX idx_sup_pca_supplier_id        ON supplier.supplier_product_category_approvals (supplier_id);
CREATE INDEX idx_sup_pca_category_id        ON supplier.supplier_product_category_approvals (product_category_id);
CREATE INDEX pix_sup_pca_approved           ON supplier.supplier_product_category_approvals (product_category_id, supplier_id)
    WHERE is_approved = TRUE AND is_deleted = FALSE;

-- ── STATUS HISTORY ────────────────────────────────────────────────────────────
CREATE INDEX idx_sup_status_hist_supplier   ON supplier.supplier_status_history (supplier_id, effective_from);
CREATE INDEX idx_sup_status_hist_current    ON supplier.supplier_status_history (supplier_id)
    WHERE is_current = TRUE;

-- =============================================================================
-- SECTION 15 — ARCHITECTURAL BOUNDARY COMMENT DOCUMENTATION
-- =============================================================================
--
-- BOUNDARY KEY:
--   [LOOKUP]      Configuration lookup tables — immutable once seeded.
--   [REGISTRY]    Permanent enterprise registries — never hard-deleted.
--   [FOUNDATION]  Configuration/policy — rarely change, set by admin.
--   [HYBRID]      Foundation config + Operational snapshot columns.
--   [OPERATIONAL] Runtime volatile — created/modified/deleted by events.
-- =============================================================================

-- LOOKUP TABLES [FOUNDATION]
COMMENT ON TABLE supplier.supplier_types         IS '[LOOKUP] Supplier business model classification master. Seeded at deployment.';
COMMENT ON TABLE supplier.supplier_categories    IS '[LOOKUP] Supplier strategic classification master.';
COMMENT ON TABLE supplier.supplier_groups        IS '[LOOKUP] Company-specific commodity grouping master.';
COMMENT ON TABLE supplier.supplier_statuses      IS '[LOOKUP] Supplier lifecycle status with procurement/payment blocking flags.';
COMMENT ON TABLE supplier.payment_terms          IS '[LOOKUP] Payment terms master driving Finance module due date calculations.';
COMMENT ON TABLE supplier.address_types          IS '[LOOKUP] Address classification master.';
COMMENT ON TABLE supplier.contact_types          IS '[LOOKUP] Contact role classification master.';
COMMENT ON TABLE supplier.document_types         IS '[LOOKUP] Document type master with expiry and mandatory approval flags.';
COMMENT ON TABLE supplier.risk_ratings           IS '[LOOKUP] Risk classification master with numeric risk_level 1–5.';
COMMENT ON TABLE supplier.kyc_statuses           IS '[LOOKUP] KYC verification status master.';
COMMENT ON TABLE supplier.approval_statuses      IS '[LOOKUP] Approval workflow status master.';
COMMENT ON TABLE supplier.compliance_statuses    IS '[LOOKUP] Compliance classification master.';
COMMENT ON TABLE supplier.review_frequencies     IS '[LOOKUP] Review frequency master with interval_days for scheduling.';

-- CORE REGISTRY + FOUNDATION TABLES
COMMENT ON TABLE supplier.suppliers                          IS '[REGISTRY — PERMANENT] Core supplier master registry. Permanent records.';
COMMENT ON TABLE supplier.supplier_contacts                  IS '[FOUNDATION] Multiple contacts per supplier.';
COMMENT ON TABLE supplier.supplier_addresses                 IS '[FOUNDATION] Multiple addresses per supplier.';
COMMENT ON TABLE supplier.supplier_bank_accounts             IS '[FOUNDATION] Multiple bank accounts per supplier. Payment-gated by is_verified.';
COMMENT ON TABLE supplier.supplier_tax_profiles              IS '[FOUNDATION — 1:1] Tax configuration per supplier for Finance module.';
COMMENT ON TABLE supplier.supplier_documents                 IS '[FOUNDATION] Document metadata registry. File content in external store.';
COMMENT ON TABLE supplier.supplier_compliance                IS '[FOUNDATION — 1:1] Compliance, KYC, approval, and risk profile per supplier.';
COMMENT ON TABLE supplier.supplier_performance_profiles      IS '[HYBRID] Performance config (review schedule) + operational metrics (ratings, OTD%).';
COMMENT ON TABLE supplier.supplier_relationships             IS '[FOUNDATION] Corporate relationship graph (parent/subsidiary/JV/M&A).';
COMMENT ON TABLE supplier.supplier_certifications            IS '[FOUNDATION] Quality and compliance certification registry.';
COMMENT ON TABLE supplier.supplier_product_category_approvals IS '[FOUNDATION] Approved product categories with MOQ/MOV/lead time per supplier.';
COMMENT ON TABLE supplier.supplier_status_history            IS '[OPERATIONAL — Append-only] Immutable status change audit trail.';
