-- =============================================================================
-- INK FMCG ENTERPRISE ERP — REFACTORED ORGANIZATION MODULE DDL SCHEMA (v16.3)
-- Target Engine: PostgreSQL 16+
-- Schema: organization
-- Primary Key Strategy: UUID v7 (iam.uuid_generate_v7())
-- Concurrency Strategy: row_version (INT Optimistic Concurrency)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS organization;

-- -----------------------------------------------------------------------------
-- DOMAIN ENUM TYPES
-- -----------------------------------------------------------------------------

CREATE TYPE organization.day_of_week_type AS ENUM (
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
);

-- -----------------------------------------------------------------------------
-- 1. ORGANIZATIONS (TOP HOLDING ENTERPRISE GROUP)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.organizations (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    tax_identifier VARCHAR(50),
    website_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_organizations_code UNIQUE (code)
);

-- -----------------------------------------------------------------------------
-- 2. BUSINESS UNITS (STRATEGIC BUSINESS UNITS / DIVISIONS)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.business_units (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    organization_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    division_head_title VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_business_units_organization FOREIGN KEY (organization_id)
        REFERENCES organization.organizations(id) ON DELETE RESTRICT,
    CONSTRAINT uq_business_units_code UNIQUE (organization_id, code)
);

-- -----------------------------------------------------------------------------
-- 3. COUNTRIES (MULTINATIONAL GEOGRAPHIC MASTER)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.countries (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(10) NOT NULL,
    iso3_code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    phone_prefix VARCHAR(10) NOT NULL DEFAULT '+91',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_countries_code UNIQUE (code),
    CONSTRAINT uq_countries_iso3 UNIQUE (iso3_code)
);

-- -----------------------------------------------------------------------------
-- 4. STATES / PROVINCES (MULTINATIONAL STATE MASTER)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.states (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    country_id UUID NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    state_type VARCHAR(50) NOT NULL DEFAULT 'State', -- State, UnionTerritory, Province
    gst_state_code VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_states_country FOREIGN KEY (country_id)
        REFERENCES organization.countries(id) ON DELETE RESTRICT,
    CONSTRAINT uq_states_code UNIQUE (country_id, code)
);

-- -----------------------------------------------------------------------------
-- 5. COMPANIES (LEGAL REGISTERED OPERATING ENTITIES)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.companies (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    business_unit_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Normalized Legal Identifiers
    gstin VARCHAR(20),
    pan VARCHAR(20),
    cin VARCHAR(30),
    tan VARCHAR(20),

    -- Structured Address Fields
    address_line_1 VARCHAR(200) NOT NULL,
    address_line_2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    state_id UUID NOT NULL,
    country_id UUID NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    contact_email VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_companies_business_unit FOREIGN KEY (business_unit_id)
        REFERENCES organization.business_units(id) ON DELETE RESTRICT,
    CONSTRAINT fk_companies_state FOREIGN KEY (state_id)
        REFERENCES organization.states(id) ON DELETE RESTRICT,
    CONSTRAINT fk_companies_country FOREIGN KEY (country_id)
        REFERENCES organization.countries(id) ON DELETE RESTRICT,
    CONSTRAINT uq_companies_code UNIQUE (code),
    CONSTRAINT uq_companies_gstin UNIQUE (gstin),
    CONSTRAINT uq_companies_pan UNIQUE (pan),
    CONSTRAINT uq_companies_cin UNIQUE (cin)
);

-- -----------------------------------------------------------------------------
-- 6. REGIONS (GEOGRAPHIC OPERATING ZONES)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.regions (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    state_id UUID,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_regions_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_regions_state FOREIGN KEY (state_id)
        REFERENCES organization.states(id) ON DELETE SET NULL,
    CONSTRAINT uq_regions_code UNIQUE (company_id, code)
);

-- -----------------------------------------------------------------------------
-- 7. TERRITORIES (SALES & FIELD OPERATING AREAS)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.territories (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    region_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    headquarters_city VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_territories_region FOREIGN KEY (region_id)
        REFERENCES organization.regions(id) ON DELETE RESTRICT,
    CONSTRAINT uq_territories_code UNIQUE (region_id, code)
);

-- -----------------------------------------------------------------------------
-- 8. BRANCH TYPES (NORMALIZED BRANCH CLASSIFICATION MASTER)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.branch_types (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(50) NOT NULL, -- HEAD_OFFICE, REGIONAL_OFFICE, SALES_OFFICE, WAREHOUSE, DISTRIBUTION_CENTER, FACTORY, CORPORATE_OFFICE
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_branch_types_code UNIQUE (code)
);

-- -----------------------------------------------------------------------------
-- 9. HOLIDAY CALENDARS (REUSABLE CALENDARS SUBSYSTEM)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.holiday_calendars (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    calendar_year INT NOT NULL DEFAULT 2026,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_holiday_calendars_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_holiday_calendars_code UNIQUE (company_id, code, calendar_year)
);

CREATE TABLE organization.holiday_calendar_events (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    holiday_calendar_id UUID NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_holiday_events_calendar FOREIGN KEY (holiday_calendar_id)
        REFERENCES organization.holiday_calendars(id) ON DELETE CASCADE,
    CONSTRAINT uq_holiday_events_date UNIQUE (holiday_calendar_id, holiday_date)
);

-- -----------------------------------------------------------------------------
-- 10. WORK CALENDARS (REUSABLE SHIFT & WORKWEEK SUBSYSTEM)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.work_calendars (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_work_calendars_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_work_calendars_code UNIQUE (company_id, code)
);

CREATE TABLE organization.work_calendar_shifts (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    work_calendar_id UUID NOT NULL,
    day_of_week organization.day_of_week_type NOT NULL,
    shift_code VARCHAR(30) NOT NULL DEFAULT 'DAY_SHIFT',
    shift_name VARCHAR(100) NOT NULL DEFAULT 'Standard Day Shift',
    is_working_day BOOLEAN NOT NULL DEFAULT TRUE,
    shift_start_time TIME NOT NULL DEFAULT '09:00:00',
    shift_end_time TIME NOT NULL DEFAULT '18:00:00',

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_work_shifts_calendar FOREIGN KEY (work_calendar_id)
        REFERENCES organization.work_calendars(id) ON DELETE CASCADE,
    CONSTRAINT uq_work_shifts_day UNIQUE (work_calendar_id, day_of_week, shift_code)
);

-- -----------------------------------------------------------------------------
-- 11. BRANCHES (PHYSICAL DEPOTS & OPERATING BRANCHES)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.branches (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    territory_id UUID,
    branch_type_id UUID NOT NULL,
    holiday_calendar_id UUID,
    work_calendar_id UUID,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    
    -- Normalized Legal Identifiers
    gstin VARCHAR(20),
    pan VARCHAR(20),
    tan VARCHAR(20),

    -- Structured Address Fields
    address_line_1 VARCHAR(200) NOT NULL,
    address_line_2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    state_id UUID NOT NULL,
    country_id UUID NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_branches_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_branches_territory FOREIGN KEY (territory_id)
        REFERENCES organization.territories(id) ON DELETE SET NULL,
    CONSTRAINT fk_branches_type FOREIGN KEY (branch_type_id)
        REFERENCES organization.branch_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_branches_holiday_cal FOREIGN KEY (holiday_calendar_id)
        REFERENCES organization.holiday_calendars(id) ON DELETE SET NULL,
    CONSTRAINT fk_branches_work_cal FOREIGN KEY (work_calendar_id)
        REFERENCES organization.work_calendars(id) ON DELETE SET NULL,
    CONSTRAINT fk_branches_state FOREIGN KEY (state_id)
        REFERENCES organization.states(id) ON DELETE RESTRICT,
    CONSTRAINT fk_branches_country FOREIGN KEY (country_id)
        REFERENCES organization.countries(id) ON DELETE RESTRICT,
    CONSTRAINT uq_branches_code UNIQUE (company_id, code)
);

-- -----------------------------------------------------------------------------
-- 12. DEPARTMENTS (FUNCTIONAL OPERATING DEPARTMENTS)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.departments (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    parent_department_id UUID,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_departments_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_departments_parent FOREIGN KEY (parent_department_id)
        REFERENCES organization.departments(id) ON DELETE SET NULL,
    CONSTRAINT uq_departments_code UNIQUE (company_id, code)
);

-- -----------------------------------------------------------------------------
-- 13. DESIGNATIONS (JOB ROLES & HIERARCHICAL RANKS)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.designations (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    department_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    rank_level INT NOT NULL DEFAULT 10,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_designations_department FOREIGN KEY (department_id)
        REFERENCES organization.departments(id) ON DELETE RESTRICT,
    CONSTRAINT uq_designations_code UNIQUE (department_id, code),
    CONSTRAINT chk_designations_rank CHECK (rank_level >= 1)
);

-- -----------------------------------------------------------------------------
-- 14. COST CENTERS (FINANCIAL ACCOUNTING & COST ALLOCATION UNITS)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.cost_centers (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    branch_id UUID,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    budget_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_cost_centers_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cost_centers_branch FOREIGN KEY (branch_id)
        REFERENCES organization.branches(id) ON DELETE SET NULL,
    CONSTRAINT uq_cost_centers_code UNIQUE (company_id, code)
);

-- -----------------------------------------------------------------------------
-- 15. REPORTING LEVELS (CONFIGURABLE HIERARCHY MASTER)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.reporting_levels (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL, -- MD, CEO, PRESIDENT, VP, NATIONAL_HEAD, CLUSTER_HEAD, REGIONAL_HEAD, AREA_MANAGER, BRANCH_MANAGER, SUPERVISOR
    level_title VARCHAR(150) NOT NULL,
    hierarchy_rank INT NOT NULL DEFAULT 10,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_reporting_levels_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_reporting_levels_code UNIQUE (company_id, code)
);

-- -----------------------------------------------------------------------------
-- 16. REPORTING STRUCTURES (DECOUPLED HIERARCHY TEMPLATES MATRIX)
-- -----------------------------------------------------------------------------
CREATE TABLE organization.reporting_structures (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    parent_reporting_node_id UUID,
    designation_id UUID NOT NULL,
    reporting_level_id UUID NOT NULL,
    node_title VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_reporting_structures_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reporting_structures_parent FOREIGN KEY (parent_reporting_node_id)
        REFERENCES organization.reporting_structures(id) ON DELETE SET NULL,
    CONSTRAINT fk_reporting_structures_designation FOREIGN KEY (designation_id)
        REFERENCES organization.designations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reporting_structures_level FOREIGN KEY (reporting_level_id)
        REFERENCES organization.reporting_levels(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 17. NORMALIZED CONFIGURATION TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE organization.organization_localization_settings (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    locale_code VARCHAR(20) NOT NULL DEFAULT 'en-IN',
    date_format VARCHAR(30) NOT NULL DEFAULT 'DD/MM/YYYY',
    number_format VARCHAR(30) NOT NULL DEFAULT 'en-IN',

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_loc_settings_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE CASCADE,
    CONSTRAINT uq_loc_settings_company UNIQUE (company_id)
);

CREATE TABLE organization.organization_financial_settings (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    financial_year_start_month INT NOT NULL DEFAULT 4, -- April
    base_currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    decimal_precision INT NOT NULL DEFAULT 2,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_fin_settings_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE CASCADE,
    CONSTRAINT uq_fin_settings_company UNIQUE (company_id),
    CONSTRAINT chk_fy_start_month CHECK (financial_year_start_month BETWEEN 1 AND 12)
);

CREATE TABLE organization.organization_tax_settings (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    gst_composition_scheme BOOLEAN NOT NULL DEFAULT FALSE,
    e_invoicing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    e_way_bill_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_hsn_code VARCHAR(20),

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_tax_settings_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE CASCADE,
    CONSTRAINT uq_tax_settings_company UNIQUE (company_id)
);

CREATE TABLE organization.organization_calendar_settings (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    default_holiday_calendar_id UUID,
    default_work_calendar_id UUID,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_cal_settings_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_cal_settings_holiday_cal FOREIGN KEY (default_holiday_calendar_id)
        REFERENCES organization.holiday_calendars(id) ON DELETE SET NULL,
    CONSTRAINT fk_cal_settings_work_cal FOREIGN KEY (default_work_calendar_id)
        REFERENCES organization.work_calendars(id) ON DELETE SET NULL,
    CONSTRAINT uq_cal_settings_company UNIQUE (company_id)
);

CREATE TABLE organization.organization_feature_settings (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id UUID NOT NULL,
    feature_flags_json JSONB,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_feat_settings_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE CASCADE,
    CONSTRAINT uq_feat_settings_company UNIQUE (company_id)
);

-- =============================================================================
-- INDEXING STRATEGY
-- =============================================================================

-- Partial Indexes for Soft Delete & Active Master Records
CREATE INDEX pix_organizations_active ON organization.organizations (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_business_units_active ON organization.business_units (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_countries_active ON organization.countries (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_states_active ON organization.states (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_companies_active ON organization.companies (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_regions_active ON organization.regions (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_territories_active ON organization.territories (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_branch_types_active ON organization.branch_types (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_branches_active ON organization.branches (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_departments_active ON organization.departments (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_designations_active ON organization.designations (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_cost_centers_active ON organization.cost_centers (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_reporting_levels_active ON organization.reporting_levels (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_holiday_calendars_active ON organization.holiday_calendars (id) WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX pix_work_calendars_active ON organization.work_calendars (id) WHERE is_deleted = FALSE AND is_active = TRUE;

-- Performance B-Tree Indexes for Hierarchy & FK Lookups
CREATE INDEX idx_business_units_org_id ON organization.business_units (organization_id);
CREATE INDEX idx_states_country_id ON organization.states (country_id);
CREATE INDEX idx_companies_bu_id ON organization.companies (business_unit_id);
CREATE INDEX idx_companies_state_id ON organization.companies (state_id);
CREATE INDEX idx_companies_country_id ON organization.companies (country_id);
CREATE INDEX idx_regions_company_id ON organization.regions (company_id);
CREATE INDEX idx_regions_state_id ON organization.regions (state_id);
CREATE INDEX idx_territories_region_id ON organization.territories (region_id);
CREATE INDEX idx_branches_company_id ON organization.branches (company_id);
CREATE INDEX idx_branches_territory_id ON organization.branches (territory_id);
CREATE INDEX idx_branches_type_id ON organization.branches (branch_type_id);
CREATE INDEX idx_branches_state_id ON organization.branches (state_id);
CREATE INDEX idx_branches_country_id ON organization.branches (country_id);
CREATE INDEX idx_departments_company_id ON organization.departments (company_id);
CREATE INDEX idx_departments_parent_id ON organization.departments (parent_department_id);
CREATE INDEX idx_designations_dept_id ON organization.designations (department_id);
CREATE INDEX idx_cost_centers_company_id ON organization.cost_centers (company_id);
CREATE INDEX idx_reporting_levels_company_id ON organization.reporting_levels (company_id);
CREATE INDEX idx_reporting_structures_company_id ON organization.reporting_structures (company_id);
CREATE INDEX idx_reporting_structures_parent_id ON organization.reporting_structures (parent_reporting_node_id);
CREATE INDEX idx_holiday_events_cal_id ON organization.holiday_calendar_events (holiday_calendar_id);
CREATE INDEX idx_work_shifts_cal_id ON organization.work_calendar_shifts (work_calendar_id);
