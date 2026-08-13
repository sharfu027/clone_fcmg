-- =============================================================================
-- INK FMCG ENTERPRISE ERP — CUSTOMER MANAGEMENT SCHEMAS (v2.0 REFINED)
-- File Name      : customer_schema.sql
-- Target Database: PostgreSQL 16+
-- Schema Owner   : customer
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS customer;

-- =============================================================================
-- SECTION 1 — LOOKUP TABLES
-- =============================================================================

-- 1.1 Customer Statuses
CREATE TABLE customer.customer_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_customer_statuses_code UNIQUE (code),
    CONSTRAINT chk_customer_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.customer_statuses IS 
    '[LOOKUP] Lifecycle status of a customer: PROSPECT, LEAD, QUALIFIED, ACTIVE, INACTIVE, SUSPENDED, BLOCKED, CLOSED.';

-- 1.2 Customer Types
CREATE TABLE customer.customer_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_customer_types_code UNIQUE (code),
    CONSTRAINT chk_customer_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.customer_types IS 
    '[LOOKUP] Classifies legal business types: RETAILER, DISTRIBUTOR, WHOLESALER, MODERN_TRADE, GENERAL_TRADE, INSTITUTION, EXPORT, CORPORATE, FRANCHISE.';

-- 1.3 Customer Categories
CREATE TABLE customer.customer_categories (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_customer_categories_code UNIQUE (code),
    CONSTRAINT chk_customer_categories_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.customer_categories IS 
    '[LOOKUP] Volume-based categorization of customers: A_CLASS, B_CLASS, C_CLASS.';

-- 1.4 Customer Segments
CREATE TABLE customer.customer_segments (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_customer_segments_code UNIQUE (code),
    CONSTRAINT chk_customer_segments_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.customer_segments IS 
    '[LOOKUP] Marketing or behavioural segments: HIGH_VALUE, REGULAR, CHURN_RISK, NEW_ONBOARD.';

-- 1.5 Customer Industries
CREATE TABLE customer.customer_industries (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_customer_industries_code UNIQUE (code),
    CONSTRAINT chk_customer_industries_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.customer_industries IS 
    '[LOOKUP] Customer business sector: FMCG_DISTRIBUTION, RETAIL_GROCERY, HOSPITALITY, PHARMACY, GOVERNMENT, EDUCATION.';

-- 1.6 Risk Levels
CREATE TABLE customer.risk_levels (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    risk_score     INT          NOT NULL CHECK (risk_score BETWEEN 1 AND 5),
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_risk_levels_code UNIQUE (code),
    CONSTRAINT chk_risk_levels_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.risk_levels IS 
    '[LOOKUP] Customer credit default risk levels: LOW (1), MEDIUM (2), HIGH (3), CRITICAL (4), BLOCK (5).';

-- 1.7 Payment Behaviours
CREATE TABLE customer.payment_behaviours (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_payment_behaviours_code UNIQUE (code),
    CONSTRAINT chk_payment_behaviours_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.payment_behaviours IS 
    '[LOOKUP] Historically calculated payment habits: EXCELLENT, REGULAR, SLOW_PAYER, CHRONIC_DEFAULT.';

-- 1.8 Collection Statuses
CREATE TABLE customer.collection_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_collection_statuses_code UNIQUE (code),
    CONSTRAINT chk_collection_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.collection_statuses IS 
    '[LOOKUP] Recovery/Collection status of overdue customer accounts: CURRENT, OVERDUE, LEGAL_NOTICE, BAD_DEBT.';

-- 1.9 Site Types
CREATE TABLE customer.site_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_site_types_code UNIQUE (code),
    CONSTRAINT chk_site_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.site_types IS 
    '[LOOKUP] Types of customer facility locations: HEAD_OFFICE, BILLING, SHIPPING, DELIVERY_POINT, WAREHOUSE_PICKUP.';

-- 1.10 Compliance Statuses
CREATE TABLE customer.compliance_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_compliance_statuses_code UNIQUE (code),
    CONSTRAINT chk_compliance_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.compliance_statuses IS 
    '[LOOKUP] Status of customer verification checks: PENDING, VERIFIED, EXPIRED, FAILED.';

-- 1.11 Document Types
CREATE TABLE customer.document_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_document_types_code UNIQUE (code),
    CONSTRAINT chk_document_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.document_types IS 
    '[LOOKUP] Types of regulatory verification papers submitted: KYC_PROOFS, GST_CERTIFICATE, PAN_CARD, BUSINESS_LICENSE, TRADE_AGREEMENT, PARTNERSHIP_DEED.';

-- 1.12 Customer Relationship Types (Graph)
CREATE TABLE customer.customer_relationship_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_customer_rel_types_code UNIQUE (code),
    CONSTRAINT chk_customer_rel_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.customer_relationship_types IS 
    '[LOOKUP] Types of relational graph links: PARENT, SUBSIDIARY, FRANCHISE, BUYING_GROUP, PARTNER, SISTER_COMPANY, SHARED_OWNERSHIP, STRATEGIC_ALLIANCE, COMPETITOR.';

-- 1.13 Contact Roles
CREATE TABLE customer.contact_roles (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_contact_roles_code UNIQUE (code),
    CONSTRAINT chk_contact_roles_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.contact_roles IS 
    '[LOOKUP] Customer contact operational duties: OWNER, FINANCE_DIRECTOR, ACCOUNTS_PAYABLE, PROCUREMENT_MANAGER, STORE_MANAGER, SALES_REPRESENTATIVE.';

-- =============================================================================
-- SECTION 2 — CUSTOMER MASTER DATA
-- =============================================================================

CREATE TABLE customer.customers (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_code                VARCHAR(50)   NOT NULL,
    legal_name                   VARCHAR(255)  NOT NULL,
    display_name                 VARCHAR(255)  NOT NULL,
    
    -- Context Linkages
    company_id                   UUID          NOT NULL REFERENCES organization.companies(id),
    customer_type_id             UUID          NOT NULL REFERENCES customer.customer_types(id),
    customer_status_id           UUID          NOT NULL REFERENCES customer.customer_statuses(id),
    customer_category_id         UUID          NOT NULL REFERENCES customer.customer_categories(id),
    customer_segment_id          UUID          NOT NULL REFERENCES customer.customer_segments(id),
    industry_id                  UUID          NOT NULL REFERENCES customer.customer_industries(id),
    
    -- Business Credentials (Snapshots of latest active records)
    business_registration_number VARCHAR(100), -- CIN or local incorporation registration
    pan_number                   VARCHAR(20),  -- Income Tax PAN (India)
    tin_number                   VARCHAR(50),  -- Tax Identification Number (International)
    
    -- Localisation Prefs
    preferred_language_code      VARCHAR(10)   NOT NULL DEFAULT 'en',
    preferred_currency_code      VARCHAR(3)    NOT NULL DEFAULT 'INR',
    timezone                     VARCHAR(50)   NOT NULL DEFAULT 'UTC',
    
    website                      VARCHAR(255),
    notes                        TEXT,
    
    -- Concurrency and Auditing
    row_version                  INT           NOT NULL DEFAULT 1,
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    is_deleted                   BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc               TIMESTAMPTZ,
    deleted_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_customers_code UNIQUE (customer_code),
    CONSTRAINT chk_customer_currency CHECK (length(preferred_currency_code) = 3)
);

COMMENT ON TABLE customer.customers IS 
    '[REGISTRY] Central customer registry master record hosting basic legal profile data.';

-- =============================================================================
-- SECTION 3 — CUSTOMER SITES LAYER
-- =============================================================================

CREATE TABLE customer.customer_sites (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                  UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    site_code                    VARCHAR(50)   NOT NULL,
    site_name                    VARCHAR(200)  NOT NULL,
    site_type_id                 UUID          NOT NULL REFERENCES customer.site_types(id),
    
    -- Operational Status
    is_active                    BOOLEAN       NOT NULL DEFAULT TRUE,
    is_primary                   BOOLEAN       NOT NULL DEFAULT FALSE,
    is_billing                   BOOLEAN       NOT NULL DEFAULT FALSE,
    is_shipping                  BOOLEAN       NOT NULL DEFAULT FALSE,
    
    -- Address
    address_line_1               VARCHAR(255)  NOT NULL,
    address_line_2               VARCHAR(255),
    city                         VARCHAR(100)  NOT NULL,
    state_id                     UUID          NOT NULL REFERENCES organization.states(id),
    country_id                   UUID          NOT NULL REFERENCES organization.countries(id),
    postal_code                  VARCHAR(20),
    
    -- GIS coordinates (for route and delivery optimization)
    latitude                     NUMERIC(9,6),
    longitude                    NUMERIC(9,6),
    gps_accuracy_meters          NUMERIC(5,2),
    
    -- Beat planning & Route reference hook
    route_id                     UUID,          -- future link to route planning module
    
    -- Site-specific regulatory data (Latest snapshot)
    tax_registration_number      VARCHAR(100), -- Site GSTIN (India) or local VAT registration
    
    operating_hours_description  TEXT,
    holiday_calendar_id          UUID          REFERENCES organization.holiday_calendars(id),
    delivery_restrictions        TEXT,

    -- Concurrency and Auditing
    row_version                  INT           NOT NULL DEFAULT 1,
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    is_deleted                   BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc               TIMESTAMPTZ,
    deleted_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_customer_sites_code UNIQUE (customer_id, site_code),
    CONSTRAINT chk_site_coords_lat CHECK (latitude IS NULL OR (latitude >= -90.000000 AND latitude <= 90.000000)),
    CONSTRAINT chk_site_coords_long CHECK (longitude IS NULL OR (longitude >= -180.000000 AND longitude <= 180.000000)),
    CONSTRAINT chk_site_gps_accuracy CHECK (gps_accuracy_meters IS NULL OR gps_accuracy_meters >= 0.00)
);

COMMENT ON TABLE customer.customer_sites IS 
    '[REGISTRY] Operational facility sites of a customer including billing, shipping, and delivery drop coordinates.';

-- =============================================================================
-- SECTION 4 — CUSTOMER CONTACTS & ROLES
-- =============================================================================

-- 4.1 Contact Header
CREATE TABLE customer.customer_contacts (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                  UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    customer_site_id             UUID          REFERENCES customer.customer_sites(id) ON DELETE SET NULL,
    
    first_name                   VARCHAR(100)  NOT NULL,
    last_name                    VARCHAR(100),
    full_name                    VARCHAR(200)  GENERATED ALWAYS AS (first_name || COALESCE(' ' || last_name, '')) STORED,
    
    -- Communication Address
    email                        VARCHAR(255),
    phone                        VARCHAR(30),
    mobile                       VARCHAR(30),
    whatsapp                     VARCHAR(30),
    
    is_primary                   BOOLEAN       NOT NULL DEFAULT FALSE,
    
    -- Auditing
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    is_deleted                   BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc               TIMESTAMPTZ,
    deleted_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE customer.customer_contacts IS 
    '[REGISTRY] Individual contact details associated with a customer or a specific site.';

-- 4.2 Contact Role Assignments
CREATE TABLE customer.contact_role_assignments (
    id                         UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_contact_id        UUID          NOT NULL REFERENCES customer.customer_contacts(id) ON DELETE CASCADE,
    role_id                    UUID          NOT NULL REFERENCES customer.contact_roles(id) ON DELETE CASCADE,
    created_at_utc             TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_contact_role_assignments UNIQUE (customer_contact_id, role_id)
);

COMMENT ON TABLE customer.contact_role_assignments IS 
    '[REGISTRY] Multi-role assignment map connecting roles (Finance, Procurement, AP) to a customer contact.';

-- =============================================================================
-- SECTION 5 — CUSTOMER CREDIT MANAGEMENT
-- =============================================================================

-- 5.1 Credit Profile (Latest active values)
CREATE TABLE customer.customer_credit_profiles (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                  UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    
    -- Financial limits
    credit_limit                 NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    available_credit             NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    is_credit_hold               BOOLEAN       NOT NULL DEFAULT FALSE,
    credit_hold_reason           TEXT,
    
    risk_rating_id               UUID          NOT NULL REFERENCES customer.risk_levels(id),
    credit_score                 INT           CHECK (credit_score BETWEEN 0 AND 1000),
    payment_behaviour_id         UUID          NOT NULL REFERENCES customer.payment_behaviours(id),
    collection_status_id         UUID          NOT NULL REFERENCES customer.collection_statuses(id),

    -- Concurrency and Auditing
    row_version                  INT           NOT NULL DEFAULT 1,
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_cust_credit_profile UNIQUE (customer_id),
    CONSTRAINT chk_cust_credit_limit CHECK (credit_limit >= 0.0000)
);

COMMENT ON TABLE customer.customer_credit_profiles IS 
    '[OPERATIONAL] Customer credit ledger details mapping limits, exposure, rating scores, and statuses.';

-- 5.2 Temporary Credit Overrides
CREATE TABLE customer.credit_temporary_overrides (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    credit_profile_id            UUID          NOT NULL REFERENCES customer.customer_credit_profiles(id) ON DELETE CASCADE,
    override_limit               NUMERIC(18,4) NOT NULL,
    start_date                   DATE          NOT NULL,
    end_date                     DATE          NOT NULL,
    approved_by_employee_id      UUID          NOT NULL REFERENCES employee.employees(id),
    reason                       TEXT          NOT NULL,
    is_active                    BOOLEAN       NOT NULL DEFAULT TRUE,

    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_credit_override_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_credit_override_limit CHECK (override_limit >= 0.0000)
);

COMMENT ON TABLE customer.credit_temporary_overrides IS 
    '[OPERATIONAL] Authorized temporarily raised credit limits for emergency sales periods.';

-- 5.3 Credit Review History
CREATE TABLE customer.credit_review_history (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    credit_profile_id            UUID          NOT NULL REFERENCES customer.customer_credit_profiles(id) ON DELETE CASCADE,
    review_date                  DATE          NOT NULL DEFAULT CURRENT_DATE,
    previous_limit               NUMERIC(18,4) NOT NULL,
    new_limit                    NUMERIC(18,4) NOT NULL,
    reviewed_by_employee_id      UUID          NOT NULL REFERENCES employee.employees(id),
    remarks                      TEXT,

    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_credit_rev_prev CHECK (previous_limit >= 0.0000),
    CONSTRAINT chk_credit_rev_new CHECK (new_limit >= 0.0000)
);

COMMENT ON TABLE customer.credit_review_history IS 
    '[HISTORY] Audit log registry recording limit modifications made by credit controllers.';

-- =============================================================================
-- SECTION 6 — PAYMENT TERMS & SETTLEMENT
-- =============================================================================

CREATE TABLE customer.customer_payment_terms (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                  UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    customer_site_id             UUID          REFERENCES customer.customer_sites(id) ON DELETE CASCADE, -- Optional Override
    
    payment_terms_id             UUID          NOT NULL REFERENCES supplier.payment_terms(id),
    currency_code                VARCHAR(3)    NOT NULL DEFAULT 'INR',
    settlement_rules             TEXT,
    
    grace_period_days            INT           NOT NULL DEFAULT 0,
    early_payment_discount_pct   NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
    late_payment_penalty_pct     NUMERIC(5,2)  NOT NULL DEFAULT 0.00,

    -- Concurrency and Auditing
    row_version                  INT           NOT NULL DEFAULT 1,
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_customer_payment_terms UNIQUE (customer_id, customer_site_id),
    CONSTRAINT chk_cust_pay_grace CHECK (grace_period_days >= 0),
    CONSTRAINT chk_cust_pay_disc CHECK (early_payment_discount_pct >= 0.00 AND early_payment_discount_pct <= 100.00),
    CONSTRAINT chk_cust_pay_pen CHECK (late_payment_penalty_pct >= 0.00 AND late_payment_penalty_pct <= 100.00)
);

COMMENT ON TABLE customer.customer_payment_terms IS 
    '[FOUNDATION] Customer specific credit terms, penalty policies, and site-level overrides.';

-- =============================================================================
-- SECTION 7 — CUSTOMER PRICING FOUNDATION
-- =============================================================================

-- 7.1 Price Groups
CREATE TABLE customer.price_groups (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_price_groups_code UNIQUE (code),
    CONSTRAINT chk_price_groups_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.price_groups IS 
    '[LOOKUP] Groups customers for customized catalog price lists: DISTRIBUTOR_PRICING, RETAIL_MRP, MODERN_TRADE_DISC.';

-- 7.2 Discount Groups
CREATE TABLE customer.discount_groups (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_discount_groups_code UNIQUE (code),
    CONSTRAINT chk_discount_groups_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE customer.discount_groups IS 
    '[LOOKUP] Groups customers for automated sales order discounts: MODERN_TRADE_KEY_ACC, REGIONAL_DISTRIB_10PCT.';

-- 7.3 Customer Pricing Profile
CREATE TABLE customer.customer_pricing_profile (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                  UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    price_group_id               UUID          NOT NULL REFERENCES customer.price_groups(id),
    discount_group_id            UUID          NOT NULL REFERENCES customer.discount_groups(id),
    is_eligible_for_promotions   BOOLEAN       NOT NULL DEFAULT TRUE,

    -- Auditing
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_customer_pricing_profile UNIQUE (customer_id)
);

COMMENT ON TABLE customer.customer_pricing_profile IS 
    '[FOUNDATION] Links customer to specific commercial price sheets and promotional discounts.';

-- =============================================================================
-- SECTION 8 — SALES TERRITORY & BEAT MAPPING
-- =============================================================================

CREATE TABLE customer.sales_territory_mappings (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                  UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    customer_site_id             UUID          REFERENCES customer.customer_sites(id) ON DELETE CASCADE, -- Override
    
    territory_id                 UUID          NOT NULL REFERENCES organization.territories(id),
    primary_salesman_employee_id UUID          NOT NULL REFERENCES employee.employees(id),
    backup_salesman_employee_id  UUID          REFERENCES employee.employees(id),
    
    -- Coverage Area GIS polygon representation
    coverage_area_polygon        GEOMETRY(Polygon, 4326),

    -- Auditing
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_sales_territory_mappings UNIQUE (customer_id, customer_site_id, territory_id)
);

COMMENT ON TABLE customer.sales_territory_mappings IS 
    '[OPERATIONAL] Mappings of customer site locations to organizational sales territories, sales reps, and beats.';

-- =============================================================================
-- SECTION 9 — HIERARCHIES & RELATIONSHIP GRAPH
-- =============================================================================

-- 9.1 Hierarchies (Hierarchical tree legacy cache)
CREATE TABLE customer.customer_hierarchies (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    parent_customer_id           UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    subsidiary_customer_id       UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    relationship_type_id         UUID          NOT NULL REFERENCES customer.customer_relationship_types(id),
    
    effective_from               DATE          NOT NULL DEFAULT CURRENT_DATE,
    effective_to                 DATE,

    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_cust_hierarchy_self CHECK (parent_customer_id <> subsidiary_customer_id),
    CONSTRAINT chk_cust_hierarchy_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE customer.customer_hierarchies IS 
    '[FOUNDATION] Self referencing tree structures allowing corporate parent companies, branches, or franchises.';

-- 9.2 Relationship Graph (Extended Graph Networks with historical trace)
CREATE TABLE customer.customer_relationships (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    source_customer_id           UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    target_customer_id           UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    relationship_type_id         UUID          NOT NULL REFERENCES customer.customer_relationship_types(id),
    
    effective_from               DATE          NOT NULL DEFAULT CURRENT_DATE,
    effective_to                 DATE,
    reason                       TEXT,

    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_cust_rel_graph_self CHECK (source_customer_id <> target_customer_id),
    CONSTRAINT chk_cust_rel_graph_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE customer.customer_relationships IS 
    '[FOUNDATION] Relational Graph network auditing horizontal alliances, sister companies, buying groups, competitors, and strategic partnerships.';

-- =============================================================================
-- SECTION 10 — ENTERPRISE CUSTOMER DOCUMENT MANAGEMENT
-- =============================================================================

-- 10.1 Document Registry (DM Envelope)
CREATE TABLE customer.document_registry (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                  UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    document_type_id             UUID          NOT NULL REFERENCES customer.document_types(id),
    document_code                VARCHAR(100)  NOT NULL, -- GSTIN, PAN, Business registration ID
    title                        VARCHAR(200)  NOT NULL,
    description                  TEXT,
    is_active                    BOOLEAN       NOT NULL DEFAULT TRUE,

    -- Concurrency and Auditing
    row_version                  INT           NOT NULL DEFAULT 1,
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_customer_doc_registry UNIQUE (customer_id, document_type_id, document_code)
);

COMMENT ON TABLE customer.document_registry IS 
    '[FOUNDATION] Customer document master registry headers mapping licenses and regulatory papers.';

-- 10.2 Document Versions
CREATE TABLE customer.document_versions (
    id                         UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    document_registry_id       UUID          NOT NULL REFERENCES customer.document_registry(id) ON DELETE CASCADE,
    version_number             INT           NOT NULL,
    
    file_name                  VARCHAR(255)  NOT NULL,
    file_path                  TEXT          NOT NULL,
    file_size_bytes            BIGINT        NOT NULL,
    file_mime_type             VARCHAR(100)  NOT NULL,
    file_hash_sha256           VARCHAR(64)   NOT NULL, -- Integrity checksum
    
    approval_status_id         UUID          NOT NULL REFERENCES customer.compliance_statuses(id),
    is_latest                  BOOLEAN       NOT NULL DEFAULT TRUE,

    created_at_utc             TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id         UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_customer_doc_versions UNIQUE (document_registry_id, version_number),
    CONSTRAINT chk_cust_doc_ver CHECK (version_number >= 1),
    CONSTRAINT chk_cust_doc_size CHECK (file_size_bytes > 0)
);

COMMENT ON TABLE customer.document_versions IS 
    '[FOUNDATION] Revision versions for customer documents tracking uploads, SHA-256 signatures, and compliance checks.';

-- =============================================================================
-- SECTION 11 — CUSTOMER COMPLIANCE & VERIFICATION
-- =============================================================================

-- 11.1 Compliance Records
CREATE TABLE customer.compliance_records (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                  UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    
    kyc_status_id                UUID          NOT NULL REFERENCES customer.compliance_statuses(id),
    tax_validation_status        VARCHAR(50)   NOT NULL DEFAULT 'PENDING', -- PENDING, VALID, INVALID
    
    is_blacklisted               BOOLEAN       NOT NULL DEFAULT FALSE,
    blacklist_reason             TEXT,
    is_sanction_matched          BOOLEAN       NOT NULL DEFAULT FALSE,
    compliance_expiry_date       DATE,

    -- Concurrency and Auditing
    row_version                  INT           NOT NULL DEFAULT 1,
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_cust_compliance_record UNIQUE (customer_id),
    CONSTRAINT chk_compliance_tax CHECK (tax_validation_status IN ('PENDING', 'VALID', 'INVALID')),
    CONSTRAINT chk_compliance_blacklist CHECK (is_blacklisted = FALSE OR (is_blacklisted = TRUE AND blacklist_reason IS NOT NULL AND length(trim(blacklist_reason)) > 0))
);

COMMENT ON TABLE customer.compliance_records IS 
    '[FOUNDATION] Tracks corporate compliance standing, KYC validation, sanctions matching, and blacklists.';

-- 11.2 Verification Audit History
CREATE TABLE customer.compliance_verification_history (
    id                         UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    verification_date          TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    verified_by_employee_id    UUID          NOT NULL REFERENCES employee.employees(id),
    
    verification_type          VARCHAR(50)   NOT NULL, -- KYC_CHECK, SANCTIONS_SCREENING, TAX_VERIFICATION
    outcome                    VARCHAR(100)  NOT NULL, -- PASSED, FAILED, ACTION_REQUIRED
    notes                      TEXT,

    created_at_utc             TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE customer.compliance_verification_history IS 
    '[HISTORY] Detailed audit logs tracking verification audits, outcomes, and verifiers.';

-- =============================================================================
-- SECTION 12 — CUSTOMER PERFORMANCE SNAPSHOTS
-- =============================================================================

CREATE TABLE customer.performance_snapshots (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                  UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    recorded_date                DATE          NOT NULL DEFAULT CURRENT_DATE,
    
    -- Snapshotted performance values
    lifetime_revenue             NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    average_order_value          NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    payment_behaviour_id         UUID          NOT NULL REFERENCES customer.payment_behaviours(id),
    order_frequency_days         NUMERIC(5,2),
    fill_rate_pct                NUMERIC(5,2),
    returns_pct                  NUMERIC(5,2),
    on_time_payment_pct          NUMERIC(5,2),
    customer_score               NUMERIC(5,2),
    customer_segment_id          UUID          NOT NULL REFERENCES customer.customer_segments(id),

    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_perf_snapshot_date UNIQUE (customer_id, recorded_date),
    CONSTRAINT chk_perf_revenue CHECK (lifetime_revenue >= 0.0000),
    CONSTRAINT chk_perf_aov CHECK (average_order_value >= 0.0000),
    CONSTRAINT chk_perf_fill CHECK (fill_rate_pct IS NULL OR (fill_rate_pct >= 0.00 AND fill_rate_pct <= 100.00)),
    CONSTRAINT chk_perf_ret CHECK (returns_pct IS NULL OR (returns_pct >= 0.00 AND returns_pct <= 100.00)),
    CONSTRAINT chk_perf_payment CHECK (on_time_payment_pct IS NULL OR (on_time_payment_pct >= 0.00 AND on_time_payment_pct <= 100.00)),
    CONSTRAINT chk_perf_score CHECK (customer_score IS NULL OR (customer_score >= 0.00 AND customer_score <= 100.00))
);

COMMENT ON TABLE customer.performance_snapshots IS 
    '[HISTORY] Compiled historical KPI logs tracking revenue, return percentage, and billing scores.';

-- =============================================================================
-- SECTION 13 — COMMUNICATION PREFERENCES
-- =============================================================================

CREATE TABLE customer.communication_preferences (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                  UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    
    -- Channel flags
    allow_email                  BOOLEAN       NOT NULL DEFAULT TRUE,
    allow_sms                    BOOLEAN       NOT NULL DEFAULT TRUE,
    allow_whatsapp               BOOLEAN       NOT NULL DEFAULT TRUE,
    allow_push                   BOOLEAN       NOT NULL DEFAULT FALSE,
    marketing_consent            BOOLEAN       NOT NULL DEFAULT FALSE,
    invoice_delivery_preference  VARCHAR(50)   NOT NULL DEFAULT 'EMAIL', -- EMAIL, SMS, WHATSAPP, PORTAL

    -- Concurrency and Auditing
    row_version                  INT           NOT NULL DEFAULT 1,
    created_at_utc               TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id           UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_cust_comm_pref UNIQUE (customer_id),
    CONSTRAINT chk_comm_pref_invoice CHECK (invoice_delivery_preference IN ('EMAIL', 'SMS', 'WHATSAPP', 'PORTAL'))
);

COMMENT ON TABLE customer.communication_preferences IS 
    '[FOUNDATION] Customer permissions managing channels for marketing and transactional invoices.';

-- =============================================================================
-- SECTION 14 — AUDITING & HISTORY REFINEMENTS (v2.0 ADDITIONS)
-- =============================================================================

-- 14.1 Customer Status/Lifecycle History
CREATE TABLE customer.customer_lifecycle_history (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id            UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    customer_status_id     UUID         NOT NULL REFERENCES customer.customer_statuses(id),
    effective_from         TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    effective_to           TIMESTAMPTZ,
    reason                 TEXT,
    changed_by_user_id     UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_lifecycle_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE customer.customer_lifecycle_history IS 
    '[HISTORY] Log record of historical customer statuses (Prospect -> Active -> Suspended).';

-- 14.2 Customer Sales Representative Assignment History (Ownership)
CREATE TABLE customer.customer_ownership_history (
    id                           UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                  UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    primary_salesman_employee_id UUID         NOT NULL REFERENCES employee.employees(id),
    backup_salesman_employee_id  UUID         REFERENCES employee.employees(id),
    effective_from               TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    effective_to                 TIMESTAMPTZ,
    assignment_reason            TEXT         NOT NULL,
    assigned_by_user_id          UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_ownership_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE customer.customer_ownership_history IS 
    '[HISTORY] Tracks changes to salesmen mappings over time for territory account audits.';

-- 14.3 Customer Merge & Split Consolidation Registry
CREATE TABLE customer.customer_merges_splits (
    id                           UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    source_customer_id           UUID         REFERENCES customer.customers(id) ON DELETE SET NULL,
    target_customer_id           UUID         REFERENCES customer.customers(id) ON DELETE SET NULL,
    event_type                   VARCHAR(50)  NOT NULL, -- MERGE, SPLIT, CONSOLIDATION, SEPARATION
    event_date                   TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    processed_by_user_id         UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    approval_document_reference  VARCHAR(255),
    description                  TEXT         NOT NULL,

    CONSTRAINT chk_merge_split_type CHECK (event_type IN ('MERGE', 'SPLIT', 'CONSOLIDATION', 'SEPARATION'))
);

COMMENT ON TABLE customer.customer_merges_splits IS 
    '[HISTORY] Traces corporate mergers, divisions, and consolidation records.';

-- 14.4 Tax Registration Versions History (Anti-overwrite protection)
CREATE TABLE customer.tax_registration_history (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id              UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    customer_site_id         UUID         REFERENCES customer.customer_sites(id) ON DELETE SET NULL,
    tax_registration_type    VARCHAR(50)  NOT NULL, -- GSTIN, VAT, TIN
    tax_registration_number  VARCHAR(100) NOT NULL,
    effective_from           DATE         NOT NULL DEFAULT CURRENT_DATE,
    effective_to             DATE,
    verification_status      VARCHAR(50)  NOT NULL DEFAULT 'PENDING', -- PENDING, VALID, INVALID
    reason_for_change        TEXT,
    changed_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_tax_hist_dates CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_tax_hist_status CHECK (verification_status IN ('PENDING', 'VALID', 'INVALID'))
);

COMMENT ON TABLE customer.tax_registration_history IS 
    '[HISTORY] Preserves historical audits of customer GST, VAT, and local tax registrations.';

-- 14.5 Customer Privacy Communication Consent History (GDPR/Compliance)
CREATE TABLE customer.communication_consent_history (
    id                  UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id         UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    channel             VARCHAR(50)  NOT NULL, -- EMAIL, SMS, WHATSAPP, PUSH
    consent_given       BOOLEAN      NOT NULL,
    consent_source      VARCHAR(100) NOT NULL, -- CUSTOMER_PORTAL, SIGNED_FORM, EMAIL_REPLY
    consent_method      VARCHAR(50)  NOT NULL, -- DOUBLE_OPT_IN, SIGNED_DOCUMENT, OPT_OUT
    policy_version      VARCHAR(50)  NOT NULL,
    recorded_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    verified_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_consent_channel CHECK (channel IN ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH'))
);

COMMENT ON TABLE customer.communication_consent_history IS 
    '[HISTORY] Immutable privacy opt-in consent registers auditing compliance scores.';

-- 14.6 Customer Credit Risk Snapshot History
CREATE TABLE customer.customer_risk_history (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id          UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    risk_rating_id       UUID         NOT NULL REFERENCES customer.risk_levels(id),
    credit_score         INT          NOT NULL CHECK (credit_score BETWEEN 0 AND 1000),
    reason               TEXT         NOT NULL,
    effective_from       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    effective_to         TIMESTAMPTZ,
    reviewer_employee_id UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,

    CONSTRAINT chk_risk_hist_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE customer.customer_risk_history IS 
    '[HISTORY] Chronological logs of changes made to credit risks, ratings, and credit scores.';

-- 14.7 External System Reference Registry
CREATE TABLE customer.external_reference_registry (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id            UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    system_name            VARCHAR(100) NOT NULL, -- SAP, ORACLE, CRM, DISTRIBUTOR_PORTAL, LEGACY_ERP
    external_reference_code VARCHAR(100) NOT NULL,
    is_active              BOOLEAN      NOT NULL DEFAULT TRUE,
    mapped_at_utc          TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_external_ref_code UNIQUE (system_name, external_reference_code)
);

COMMENT ON TABLE customer.external_reference_registry IS 
    '[FOUNDATION] Map reference links linking customer records to CRM, SAP, Oracle, and legacy systems.';

-- 14.8 Customer Blacklist History Audit Log
CREATE TABLE customer.customer_blacklist_history (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id          UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    reason               TEXT         NOT NULL,
    authority            VARCHAR(100) NOT NULL, -- INTERNAL_AUDIT, CREDIT_CONTROL, LEGAL_DEPT
    start_date           DATE         NOT NULL DEFAULT CURRENT_DATE,
    end_date             DATE,
    is_appealed          BOOLEAN      NOT NULL DEFAULT FALSE,
    appeal_details       TEXT,
    resolution           TEXT,
    reinstatement_date   DATE,
    processed_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_blacklist_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_blacklist_rein CHECK (reinstatement_date IS NULL OR reinstatement_date >= start_date)
);

COMMENT ON TABLE customer.customer_blacklist_history IS 
    '[HISTORY] Immutable audit trail of blocks, blacklists, reasons, authorities, and reinstatements.';

-- 14.9 Master Data Governance (Stewardship Registry)
CREATE TABLE customer.master_data_governance (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id              UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    data_steward_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    verification_status_id   UUID          NOT NULL REFERENCES customer.compliance_statuses(id),
    data_quality_score       NUMERIC(5,2)  NOT NULL CHECK (data_quality_score BETWEEN 0.00 AND 100.00),
    is_duplicate_reviewed    BOOLEAN       NOT NULL DEFAULT FALSE,
    last_audit_date          TIMESTAMPTZ,
    review_frequency_days    INT           NOT NULL DEFAULT 365,
    is_golden_record         BOOLEAN       NOT NULL DEFAULT FALSE,
    
    row_version              INT           NOT NULL DEFAULT 1,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_gov_customer UNIQUE (customer_id),
    CONSTRAINT chk_gov_freq CHECK (review_frequency_days > 0)
);

COMMENT ON TABLE customer.master_data_governance IS 
    '[FOUNDATION] Customer master data quality stats, stewardship reviews, duplicates, and golden flags.';

-- =============================================================================
-- SECTION 15 — INDEX STRATEGY (B-TREE FOREIGNS & COMPOSITE COVERING)
-- =============================================================================

-- 15.1 B-Tree Indexes on all Foreign Keys
CREATE INDEX idx_cust_company_fk                 ON customer.customers (company_id);
CREATE INDEX idx_cust_type_fk                    ON customer.customers (customer_type_id);
CREATE INDEX idx_cust_status_fk                  ON customer.customers (customer_status_id);
CREATE INDEX idx_cust_category_fk                ON customer.customers (customer_category_id);
CREATE INDEX idx_cust_segment_fk                 ON customer.customers (customer_segment_id);
CREATE INDEX idx_cust_industry_fk                ON customer.customers (industry_id);

CREATE INDEX idx_sites_cust_fk                   ON customer.customer_sites (customer_id);
CREATE INDEX idx_sites_type_fk                   ON customer.customer_sites (site_type_id);
CREATE INDEX idx_sites_state_fk                  ON customer.customer_sites (state_id);
CREATE INDEX idx_sites_country_fk                ON customer.customer_sites (country_id);
CREATE INDEX idx_sites_calendar_fk               ON customer.customer_sites (holiday_calendar_id);

CREATE INDEX idx_contacts_cust_fk                ON customer.customer_contacts (customer_id);
CREATE INDEX idx_contacts_site_fk                ON customer.customer_contacts (customer_site_id);

CREATE INDEX idx_role_assign_contact_fk          ON customer.contact_role_assignments (customer_contact_id);
CREATE INDEX idx_role_assign_role_fk             ON customer.contact_role_assignments (role_id);

CREATE INDEX idx_credit_cust_fk                  ON customer.customer_credit_profiles (customer_id);
CREATE INDEX idx_credit_risk_fk                  ON customer.customer_credit_profiles (risk_rating_id);
CREATE INDEX idx_credit_behaviour_fk             ON customer.customer_credit_profiles (payment_behaviour_id);
CREATE INDEX idx_credit_collection_fk            ON customer.customer_credit_profiles (collection_status_id);

CREATE INDEX idx_credit_over_profile_fk          ON customer.credit_temporary_overrides (credit_profile_id);
CREATE INDEX idx_credit_over_employee_fk          ON customer.credit_temporary_overrides (approved_by_employee_id);

CREATE INDEX idx_credit_hist_profile_fk          ON customer.credit_review_history (credit_profile_id);
CREATE INDEX idx_credit_hist_employee_fk          ON customer.credit_review_history (reviewed_by_employee_id);

CREATE INDEX idx_pay_terms_cust_fk               ON customer.customer_payment_terms (customer_id);
CREATE INDEX idx_pay_terms_site_fk               ON customer.customer_payment_terms (customer_site_id);
CREATE INDEX idx_pay_terms_lookup_fk             ON customer.customer_payment_terms (payment_terms_id);

CREATE INDEX idx_pricing_cust_fk                 ON customer.customer_pricing_profile (customer_id);
CREATE INDEX idx_pricing_group_fk                ON customer.customer_pricing_profile (price_group_id);
CREATE INDEX idx_pricing_disc_fk                 ON customer.customer_pricing_profile (discount_group_id);

CREATE INDEX idx_territory_cust_fk               ON customer.sales_territory_mappings (customer_id);
CREATE INDEX idx_territory_site_fk               ON customer.sales_territory_mappings (customer_site_id);
CREATE INDEX idx_territory_lookup_fk             ON customer.sales_territory_mappings (territory_id);
CREATE INDEX idx_territory_primary_rep_fk        ON customer.sales_territory_mappings (primary_salesman_employee_id);
CREATE INDEX idx_territory_backup_rep_fk         ON customer.sales_territory_mappings (backup_salesman_employee_id);

CREATE INDEX idx_hierarchy_parent_fk             ON customer.customer_hierarchies (parent_customer_id);
CREATE INDEX idx_hierarchy_sub_fk                ON customer.customer_hierarchies (subsidiary_customer_id);
CREATE INDEX idx_hierarchy_relation_fk           ON customer.customer_hierarchies (relationship_type_id);

CREATE INDEX idx_relationship_source_fk          ON customer.customer_relationships (source_customer_id);
CREATE INDEX idx_relationship_target_fk          ON customer.customer_relationships (target_customer_id);
CREATE INDEX idx_relationship_type_fk            ON customer.customer_relationships (relationship_type_id);

CREATE INDEX idx_doc_registry_cust_fk            ON customer.document_registry (customer_id);
CREATE INDEX idx_doc_registry_type_fk            ON customer.document_registry (document_type_id);

CREATE INDEX idx_doc_versions_registry_fk        ON customer.document_versions (document_registry_id);
CREATE INDEX idx_doc_versions_status_fk          ON customer.document_versions (approval_status_id);

CREATE INDEX idx_compliance_cust_fk              ON customer.compliance_records (customer_id);
CREATE INDEX idx_compliance_kyc_status_fk        ON customer.compliance_records (kyc_status_id);

CREATE INDEX idx_compliance_hist_cust_fk         ON customer.compliance_verification_history (customer_id);
CREATE INDEX idx_compliance_hist_employee_fk     ON customer.compliance_verification_history (verified_by_employee_id);

CREATE INDEX idx_perf_cust_fk                    ON customer.performance_snapshots (customer_id);
CREATE INDEX idx_perf_behaviour_fk               ON customer.performance_snapshots (payment_behaviour_id);
CREATE INDEX idx_perf_segment_fk                 ON customer.performance_snapshots (customer_segment_id);

CREATE INDEX idx_comm_pref_cust_fk               ON customer.communication_preferences (customer_id);

CREATE INDEX idx_lifecycle_hist_cust_fk          ON customer.customer_lifecycle_history (customer_id);
CREATE INDEX idx_lifecycle_hist_status_fk        ON customer.customer_lifecycle_history (customer_status_id);
CREATE INDEX idx_lifecycle_hist_user_fk          ON customer.customer_lifecycle_history (changed_by_user_id);

CREATE INDEX idx_ownership_hist_cust_fk          ON customer.customer_ownership_history (customer_id);
CREATE INDEX idx_ownership_hist_primary_fk       ON customer.customer_ownership_history (primary_salesman_employee_id);
CREATE INDEX idx_ownership_hist_backup_fk        ON customer.customer_ownership_history (backup_salesman_employee_id);
CREATE INDEX idx_ownership_hist_user_fk          ON customer.customer_ownership_history (assigned_by_user_id);

CREATE INDEX idx_merges_splits_source_fk         ON customer.customer_merges_splits (source_customer_id);
CREATE INDEX idx_merges_splits_target_fk         ON customer.customer_merges_splits (target_customer_id);
CREATE INDEX idx_merges_splits_user_fk           ON customer.customer_merges_splits (processed_by_user_id);

CREATE INDEX idx_tax_hist_cust_fk                ON customer.tax_registration_history (customer_id);
CREATE INDEX idx_tax_hist_site_fk                ON customer.tax_registration_history (customer_site_id);
CREATE INDEX idx_tax_hist_user_fk                ON customer.tax_registration_history (changed_by_user_id);

CREATE INDEX idx_consent_hist_cust_fk            ON customer.communication_consent_history (customer_id);
CREATE INDEX idx_consent_hist_user_fk            ON customer.communication_consent_history (verified_by_user_id);

CREATE INDEX idx_risk_hist_cust_fk               ON customer.customer_risk_history (customer_id);
CREATE INDEX idx_risk_hist_rating_fk             ON customer.customer_risk_history (risk_rating_id);
CREATE INDEX idx_risk_hist_employee_fk           ON customer.customer_risk_history (reviewer_employee_id);

CREATE INDEX idx_external_ref_cust_fk            ON customer.external_reference_registry (customer_id);

CREATE INDEX idx_blacklist_hist_cust_fk          ON customer.customer_blacklist_history (customer_id);
CREATE INDEX idx_blacklist_hist_user_fk          ON customer.customer_blacklist_history (processed_by_user_id);

CREATE INDEX idx_gov_cust_fk                     ON customer.master_data_governance (customer_id);
CREATE INDEX idx_gov_steward_fk                  ON customer.master_data_governance (data_steward_user_id);
CREATE INDEX idx_gov_status_fk                   ON customer.master_data_governance (verification_status_id);

-- 15.2 Composite Indexes (Covering filter queries)
CREATE INDEX idx_cust_status_category_comp       ON customer.customers (customer_status_id, customer_category_id);
CREATE INDEX idx_sites_shipping_active_comp      ON customer.customer_sites (customer_id, is_shipping, is_active);
CREATE INDEX idx_doc_registry_type_code_comp     ON customer.document_registry (customer_id, document_type_id, document_code);
CREATE INDEX idx_relationship_nodes_comp         ON customer.customer_relationships (source_customer_id, target_customer_id, relationship_type_id);

-- 15.3 Partial Indexes (Optimizing active/hot records)
CREATE INDEX idx_sites_primary_active            ON customer.customer_sites (customer_id) WHERE is_primary = TRUE AND is_active = TRUE;
CREATE INDEX idx_contacts_primary_active         ON customer.customer_contacts (customer_id) WHERE is_primary = TRUE AND is_deleted = FALSE;
CREATE INDEX idx_credit_hold_active              ON customer.customer_credit_profiles (customer_id) WHERE is_credit_hold = TRUE;
CREATE INDEX idx_doc_versions_latest             ON customer.document_versions (document_registry_id) WHERE is_latest = TRUE;
CREATE INDEX idx_credit_override_active          ON customer.credit_temporary_overrides (credit_profile_id) WHERE is_active = TRUE AND end_date >= CURRENT_DATE;
CREATE INDEX idx_gov_golden_record               ON customer.master_data_governance (customer_id) WHERE is_golden_record = TRUE;
