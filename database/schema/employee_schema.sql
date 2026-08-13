-- =============================================================================
-- INK FMCG ENTERPRISE ERP — REFACTORED EMPLOYEE MASTER MODULE DDL SCHEMA (v16.3)
-- Target Engine: PostgreSQL 16+
-- Schema: employee
-- Primary Key Strategy: UUID v7 (iam.uuid_generate_v7())
-- Concurrency Strategy: row_version (INT Optimistic Concurrency)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS employee;

-- -----------------------------------------------------------------------------
-- IMMUTABLE BIOLOGICAL ENUM TYPES
-- -----------------------------------------------------------------------------

CREATE TYPE employee.gender_type AS ENUM (
    'Male',
    'Female',
    'NonBinary',
    'PreferNotToSay'
);

CREATE TYPE employee.marital_status_type AS ENUM (
    'Single',
    'Married',
    'Divorced',
    'Widowed'
);

-- -----------------------------------------------------------------------------
-- 1. NORMALIZED LOOKUP MASTER TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE employee.employee_statuses (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(50) NOT NULL, -- Active, Probational, NoticePeriod, Resigned, Terminated, Suspended, Retired, OnLeave
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_employee_statuses_code UNIQUE (code)
);

CREATE TABLE employee.employment_types (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(50) NOT NULL, -- Permanent, Contract, Trainee, Consultant, PartTime, Intern
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_employment_types_code UNIQUE (code)
);

CREATE TABLE employee.employee_categories (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(50) NOT NULL, -- WhiteCollar, BlueCollar, Executive, Management, Technical, FieldSales
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_employee_categories_code UNIQUE (code)
);

CREATE TABLE employee.address_types (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(50) NOT NULL, -- Permanent, Current, Communication, Emergency
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_address_types_code UNIQUE (code)
);

CREATE TABLE employee.identity_document_types (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(50) NOT NULL, -- Passport, Aadhaar, PAN, DrivingLicense, VoterID, WorkPermit, Visa, NationalID
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_identity_doc_types_code UNIQUE (code)
);

CREATE TABLE employee.document_verification_statuses (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(50) NOT NULL, -- Pending, Verified, Rejected, Expired
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_doc_ver_statuses_code UNIQUE (code)
);

CREATE TABLE employee.document_categories (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(50) NOT NULL, -- Resume, OfferLetter, JoiningLetter, NDA, IDCard, Certificate, RelievingLetter
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_document_categories_code UNIQUE (code)
);

CREATE TABLE employee.relationship_types (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(50) NOT NULL, -- Spouse, Father, Mother, Sibling, Child, Guardian, Friend, Other
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_relationship_types_code UNIQUE (code)
);

CREATE TABLE employee.bank_account_types (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code VARCHAR(50) NOT NULL, -- Savings, Current, Salary, Joint
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_bank_account_types_code UNIQUE (code)
);

-- -----------------------------------------------------------------------------
-- 2. EMPLOYEES (CORE PERMANENT EMPLOYEE MASTER)
-- -----------------------------------------------------------------------------
CREATE TABLE employee.employees (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    business_unit_id UUID NOT NULL,
    primary_branch_id UUID NOT NULL,
    primary_department_id UUID NOT NULL,
    primary_designation_id UUID NOT NULL,
    primary_cost_center_id UUID NOT NULL,
    primary_reporting_structure_id UUID,

    employment_type_id UUID NOT NULL,
    employee_category_id UUID NOT NULL,
    employee_status_id UUID NOT NULL,

    employee_code VARCHAR(50) NOT NULL,
    employee_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,

    joining_date DATE NOT NULL,
    confirmation_date DATE,
    resignation_date DATE,
    relieving_date DATE,

    birth_date DATE NOT NULL,
    gender employee.gender_type NOT NULL,
    marital_status employee.marital_status_type NOT NULL DEFAULT 'Single',

    official_email VARCHAR(150) NOT NULL,
    personal_email VARCHAR(150),
    official_mobile VARCHAR(20) NOT NULL,
    personal_mobile VARCHAR(20),

    blood_group VARCHAR(10),
    nationality VARCHAR(50) NOT NULL DEFAULT 'Indian',
    remarks TEXT,

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

    CONSTRAINT fk_employees_user FOREIGN KEY (user_id)
        REFERENCES iam.users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_bu FOREIGN KEY (business_unit_id)
        REFERENCES organization.business_units(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_branch FOREIGN KEY (primary_branch_id)
        REFERENCES organization.branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_dept FOREIGN KEY (primary_department_id)
        REFERENCES organization.departments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_desig FOREIGN KEY (primary_designation_id)
        REFERENCES organization.designations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_cost_center FOREIGN KEY (primary_cost_center_id)
        REFERENCES organization.cost_centers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_rep_struct FOREIGN KEY (primary_reporting_structure_id)
        REFERENCES organization.reporting_structures(id) ON DELETE SET NULL,

    CONSTRAINT fk_employees_emp_type FOREIGN KEY (employment_type_id)
        REFERENCES employee.employment_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_emp_cat FOREIGN KEY (employee_category_id)
        REFERENCES employee.employee_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_emp_status FOREIGN KEY (employee_status_id)
        REFERENCES employee.employee_statuses(id) ON DELETE RESTRICT,

    CONSTRAINT uq_employees_user UNIQUE (user_id),
    CONSTRAINT uq_employees_code UNIQUE (employee_code),
    CONSTRAINT uq_employees_number UNIQUE (company_id, employee_number),
    CONSTRAINT uq_employees_official_email UNIQUE (official_email),
    CONSTRAINT uq_employees_official_mobile UNIQUE (official_mobile)
);

-- -----------------------------------------------------------------------------
-- 3. EMPLOYMENT HISTORY (TRANSFERS, REJOINING, PROMOTIONS)
-- -----------------------------------------------------------------------------
CREATE TABLE employee.employee_employment_history (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- InitialHiring, Rejoining, Transfer, ContractConversion, Promotion, ReEmployment
    effective_from DATE NOT NULL,
    effective_to DATE,
    reason TEXT,
    remarks TEXT,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_hist_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 4. EMPLOYEE STATUS HISTORY (STATUS AUDIT TRAIL)
-- -----------------------------------------------------------------------------
CREATE TABLE employee.employee_status_history (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    employee_status_id UUID NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    reason TEXT,
    remarks TEXT,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_status_hist_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_status_hist_status FOREIGN KEY (employee_status_id)
        REFERENCES employee.employee_statuses(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 5. EMPLOYEE ADDRESSES
-- -----------------------------------------------------------------------------
CREATE TABLE employee.employee_addresses (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    address_type_id UUID NOT NULL,
    address_line_1 VARCHAR(200) NOT NULL,
    address_line_2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    state_id UUID NOT NULL,
    country_id UUID NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_addresses_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_addresses_type FOREIGN KEY (address_type_id)
        REFERENCES employee.address_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_emp_addresses_state FOREIGN KEY (state_id)
        REFERENCES organization.states(id) ON DELETE RESTRICT,
    CONSTRAINT fk_emp_addresses_country FOREIGN KEY (country_id)
        REFERENCES organization.countries(id) ON DELETE RESTRICT,
    CONSTRAINT uq_emp_addresses_type UNIQUE (employee_id, address_type_id)
);

-- -----------------------------------------------------------------------------
-- 6. EMPLOYEE CONTACTS
-- -----------------------------------------------------------------------------
CREATE TABLE employee.employee_contacts (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    contact_label VARCHAR(50) NOT NULL,
    contact_value VARCHAR(150) NOT NULL,
    is_preferred BOOLEAN NOT NULL DEFAULT FALSE,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_contacts_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT uq_emp_contacts_value UNIQUE (employee_id, contact_label, contact_value)
);

-- -----------------------------------------------------------------------------
-- 7. EMPLOYEE EMERGENCY CONTACTS
-- -----------------------------------------------------------------------------
CREATE TABLE employee.employee_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    relationship_type_id UUID NOT NULL,
    contact_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    alt_phone_number VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    is_primary_emergency BOOLEAN NOT NULL DEFAULT FALSE,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_emergency_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_emergency_rel FOREIGN KEY (relationship_type_id)
        REFERENCES employee.relationship_types(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 8. EMPLOYEE IDENTITY DOCUMENTS (MULTINATIONAL ENHANCED)
-- -----------------------------------------------------------------------------
CREATE TABLE employee.employee_identity_documents (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    identity_document_type_id UUID NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    issuing_country_id UUID NOT NULL,
    issuing_state_id UUID,
    issuing_authority VARCHAR(150),
    issue_date DATE,
    expiry_date DATE,
    verification_status_id UUID NOT NULL,
    verification_expiry DATE,
    verification_notes TEXT,
    verified_at_utc TIMESTAMPTZ,
    verified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_identity_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_identity_type FOREIGN KEY (identity_document_type_id)
        REFERENCES employee.identity_document_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_emp_identity_country FOREIGN KEY (issuing_country_id)
        REFERENCES organization.countries(id) ON DELETE RESTRICT,
    CONSTRAINT fk_emp_identity_state FOREIGN KEY (issuing_state_id)
        REFERENCES organization.states(id) ON DELETE SET NULL,
    CONSTRAINT fk_emp_identity_status FOREIGN KEY (verification_status_id)
        REFERENCES employee.document_verification_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT uq_emp_identity_doc UNIQUE (employee_id, identity_document_type_id, document_number)
);

-- -----------------------------------------------------------------------------
-- 9. EMPLOYEE BANK ACCOUNTS (INTERNATIONAL ENHANCED)
-- -----------------------------------------------------------------------------
CREATE TABLE employee.employee_bank_accounts (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    bank_account_type_id UUID NOT NULL,
    bank_name VARCHAR(150) NOT NULL,
    branch_name VARCHAR(150) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    swift_code VARCHAR(20),
    iban VARCHAR(50),
    micr_code VARCHAR(20),
    upi_id VARCHAR(100),
    account_holder_name VARCHAR(150) NOT NULL,
    is_primary_salary_account BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_bank_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_bank_type FOREIGN KEY (bank_account_type_id)
        REFERENCES employee.bank_account_types(id) ON DELETE RESTRICT,
    CONSTRAINT uq_emp_bank_acc UNIQUE (bank_name, account_number, ifsc_code)
);

-- -----------------------------------------------------------------------------
-- 10. HISTORICAL ASSIGNMENT TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE employee.employee_reporting_assignments (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    manager_employee_id UUID NOT NULL,
    reporting_structure_id UUID NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    remarks TEXT,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_rep_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_rep_manager FOREIGN KEY (manager_employee_id)
        REFERENCES employee.employees(id) ON DELETE RESTRICT,
    CONSTRAINT fk_emp_rep_structure FOREIGN KEY (reporting_structure_id)
        REFERENCES organization.reporting_structures(id) ON DELETE RESTRICT
);

CREATE TABLE employee.employee_branch_assignments (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_branch_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_branch_branch FOREIGN KEY (branch_id)
        REFERENCES organization.branches(id) ON DELETE RESTRICT
);

CREATE TABLE employee.employee_department_assignments (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    department_id UUID NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_dept_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_dept_dept FOREIGN KEY (department_id)
        REFERENCES organization.departments(id) ON DELETE RESTRICT
);

CREATE TABLE employee.employee_cost_center_assignments (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    cost_center_id UUID NOT NULL,
    allocation_percentage NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_cost_center_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_cost_center_center FOREIGN KEY (cost_center_id)
        REFERENCES organization.cost_centers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_allocation_pct CHECK (allocation_percentage > 0 AND allocation_percentage <= 100.00)
);

CREATE TABLE employee.employee_designation_assignments (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    designation_id UUID NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_desig_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_desig_desig FOREIGN KEY (designation_id)
        REFERENCES organization.designations(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 11. PROFILE PHOTOS & DOCUMENTS (METADATA STORAGE)
-- -----------------------------------------------------------------------------
CREATE TABLE employee.employee_profile_photos (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    file_storage_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
    content_hash VARCHAR(128) NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_photo_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE
);

CREATE TABLE employee.employee_documents (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    document_category_id UUID NOT NULL,
    document_title VARCHAR(200) NOT NULL,
    file_storage_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    content_hash VARCHAR(128) NOT NULL,
    expiry_date DATE,

    row_version INT NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_docs_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_docs_cat FOREIGN KEY (document_category_id)
        REFERENCES employee.document_categories(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 12. SKILLS & PROFESSIONAL PROFILE MASTERS
-- -----------------------------------------------------------------------------
CREATE TABLE employee.employee_skills (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(50) NOT NULL DEFAULT 'Intermediate', -- Beginner, Intermediate, Advanced, Expert
    years_of_experience NUMERIC(4,1) NOT NULL DEFAULT 1.0,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_skills_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT uq_emp_skills_name UNIQUE (employee_id, skill_name)
);

CREATE TABLE employee.employee_certifications (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    certification_name VARCHAR(150) NOT NULL,
    issuing_organization VARCHAR(150) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    credential_id VARCHAR(100),

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_emp_cert_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE
);

CREATE TABLE employee.employee_languages (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    language_name VARCHAR(50) NOT NULL,
    can_read BOOLEAN NOT NULL DEFAULT TRUE,
    can_write BOOLEAN NOT NULL DEFAULT TRUE,
    can_speak BOOLEAN NOT NULL DEFAULT TRUE,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_emp_lang_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE,
    CONSTRAINT uq_emp_lang_name UNIQUE (employee_id, language_name)
);

CREATE TABLE employee.employee_licenses (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    license_type VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    issuing_authority VARCHAR(150),
    expiry_date DATE,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_emp_licenses_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE
);

CREATE TABLE employee.employee_professional_memberships (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id UUID NOT NULL,
    organization_name VARCHAR(150) NOT NULL,
    membership_number VARCHAR(100),
    joined_date DATE,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_emp_memberships_employee FOREIGN KEY (employee_id)
        REFERENCES employee.employees(id) ON DELETE CASCADE
);

-- =============================================================================
-- POSTGRESQL SCHEMA COMMENTS (DOCUMENTATION)
-- =============================================================================

COMMENT ON SCHEMA employee IS 'Enterprise Employee Master Module Schema storing permanent HR identity, historical assignments, profile metadata, skills, and banking profiles.';
COMMENT ON TABLE employee.employees IS 'Core permanent employee master entity linking IAM authentication identity to organization structure.';
COMMENT ON TABLE employee.employee_employment_history IS 'Historical log of employment events (hiring, rejoining, transfers, promotions, re-employment).';
COMMENT ON TABLE employee.employee_status_history IS 'Historical audit log of employee status transitions over time.';
COMMENT ON TABLE employee.employee_reporting_assignments IS 'Historical manager reporting hierarchy assignments with effective date ranges.';
COMMENT ON TABLE employee.employee_branch_assignments IS 'Historical branch depot assignments with effective date ranges.';
COMMENT ON TABLE employee.employee_department_assignments IS 'Historical department assignments with effective date ranges.';
COMMENT ON TABLE employee.employee_cost_center_assignments IS 'Historical financial cost center allocations with percentage splits.';
COMMENT ON TABLE employee.employee_designation_assignments IS 'Historical job designation and rank assignments with effective date ranges.';

-- =============================================================================
-- INDEXING STRATEGY
-- =============================================================================

-- Partial Indexes for Soft Delete & Active Employee Records
CREATE INDEX pix_employees_active ON employee.employees (id) WHERE is_deleted = FALSE;
CREATE INDEX pix_employees_code ON employee.employees (employee_code) WHERE is_deleted = FALSE;
CREATE INDEX pix_employees_email ON employee.employees (official_email) WHERE is_deleted = FALSE;
CREATE INDEX pix_employees_mobile ON employee.employees (official_mobile) WHERE is_deleted = FALSE;
CREATE INDEX pix_emp_docs_active ON employee.employee_documents (id) WHERE is_deleted = FALSE;

-- Historical Assignment Indexes (Current Active Flags)
CREATE INDEX idx_emp_rep_current ON employee.employee_reporting_assignments (employee_id) WHERE is_current = TRUE;
CREATE INDEX idx_emp_branch_current ON employee.employee_branch_assignments (employee_id) WHERE is_current = TRUE;
CREATE INDEX idx_emp_dept_current ON employee.employee_department_assignments (employee_id) WHERE is_current = TRUE;
CREATE INDEX idx_emp_cost_center_current ON employee.employee_cost_center_assignments (employee_id) WHERE is_current = TRUE;
CREATE INDEX idx_emp_desig_current ON employee.employee_designation_assignments (employee_id) WHERE is_current = TRUE;
CREATE INDEX idx_emp_photo_current ON employee.employee_profile_photos (employee_id) WHERE is_current = TRUE;

-- Performance B-Tree Indexes for Foreign Key Lookups
CREATE INDEX idx_employees_user_id ON employee.employees (user_id);
CREATE INDEX idx_employees_company_id ON employee.employees (company_id);
CREATE INDEX idx_employees_branch_id ON employee.employees (primary_branch_id);
CREATE INDEX idx_employees_dept_id ON employee.employees (primary_department_id);
CREATE INDEX idx_employees_desig_id ON employee.employees (primary_designation_id);
CREATE INDEX idx_employees_cost_center_id ON employee.employees (primary_cost_center_id);
CREATE INDEX idx_emp_addresses_emp_id ON employee.employee_addresses (employee_id);
CREATE INDEX idx_emp_contacts_emp_id ON employee.employee_contacts (employee_id);
CREATE INDEX idx_emp_identity_emp_id ON employee.employee_identity_documents (employee_id);
CREATE INDEX idx_emp_bank_emp_id ON employee.employee_bank_accounts (employee_id);
