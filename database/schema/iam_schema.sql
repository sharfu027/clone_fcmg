-- =============================================================================
-- INK FMCG ENTERPRISE ERP — IAM MODULE REFACTORED DDL SCHEMA (v16.3)
-- Target Engine: PostgreSQL 16+
-- Schema: iam
-- Primary Key Strategy: Native UUID v7 Function Generator (iam.uuid_generate_v7())
-- Concurrency Strategy: row_version (INT Optimistic Concurrency)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS iam;

-- -----------------------------------------------------------------------------
-- 0. NATIVE POSTGRESQL UUID v7 GENERATOR FUNCTION
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION iam.uuid_generate_v7()
RETURNS UUID AS $$
DECLARE
    v_time DOUBLE PRECISION;
    v_epoch_ms BIGINT;
    v_time_hex VARCHAR(12);
    v_bytes BYTEA;
    v_guid_str VARCHAR(36);
BEGIN
    -- Extract microsecond timestamp and convert to millisecond epoch
    v_time := extract(epoch from clock_timestamp());
    v_epoch_ms := floor(v_time * 1000);
    
    -- Format timestamp to hex string (12 chars = 48 bits)
    v_time_hex := lpad(to_hex(v_epoch_ms), 12, '0');
    
    -- Generate 10 random bytes
    v_bytes := gen_random_bytes(10);
    
    -- Construct UUID v7 string representation
    v_guid_str := 
        substr(v_time_hex, 1, 8) || '-' ||
        substr(v_time_hex, 9, 4) || '-' ||
        '7' || encode(substr(v_bytes, 1, 2), 'hex') || '-' ||
        to_hex((encode(substr(v_bytes, 3, 1), 'hex')::int & 63) | 128) || encode(substr(v_bytes, 4, 1), 'hex') || '-' ||
        encode(substr(v_bytes, 5, 6), 'hex');

    RETURN v_guid_str::UUID;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- -----------------------------------------------------------------------------
-- DOMAIN ENUM TYPES
-- -----------------------------------------------------------------------------

CREATE TYPE iam.policy_requirement_level AS ENUM (
    'Required',
    'Optional',
    'Disabled'
);

CREATE TYPE iam.user_account_status AS ENUM (
    'Enabled',
    'Disabled',
    'Locked',
    'Suspended',
    'Archived',
    'PendingPasswordReset',
    'PendingActivation'
);

CREATE TYPE iam.mfa_channel_type AS ENUM (
    'Face',
    'OTP',
    'Password',
    'Passkey',
    'AuthenticatorApp',
    'EmailOTP',
    'SMSOTP'
);

CREATE TYPE iam.role_scope_type AS ENUM (
    'Global',
    'Company',
    'Branch',
    'Warehouse',
    'Territory',
    'Region',
    'Custom'
);

CREATE TYPE iam.login_status_type AS ENUM (
    'Success',
    'FailedInvalidPassword',
    'FailedUserNotFound',
    'AccountLocked',
    'AccountDisabled',
    'FaceVerificationFailed',
    'GpsVerificationFailed',
    'OtpFailed',
    'MfaFailed',
    'ExpiredToken'
);

CREATE TYPE iam.account_lock_event_type AS ENUM (
    'ManualLock',
    'AutoLockFailedAttempts',
    'Unlock'
);

CREATE TYPE iam.api_client_type AS ENUM (
    'SystemIntegration',
    'MobileApp',
    'PowerBI',
    'ScannerTerminal',
    'PartnerAPI',
    'Webhook'
);

-- -----------------------------------------------------------------------------
-- 1. AUTHENTICATION POLICIES
-- -----------------------------------------------------------------------------
CREATE TABLE iam.authentication_policies (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    policy_code VARCHAR(50) NOT NULL,
    policy_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_global_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID,

    CONSTRAINT uq_auth_policies_code UNIQUE (policy_code)
);

-- -----------------------------------------------------------------------------
-- 2. PASSWORD POLICIES
-- -----------------------------------------------------------------------------
CREATE TABLE iam.password_policies (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    authentication_policy_id UUID NOT NULL,
    min_length INT NOT NULL DEFAULT 10,
    require_uppercase BOOLEAN NOT NULL DEFAULT TRUE,
    require_lowercase BOOLEAN NOT NULL DEFAULT TRUE,
    require_number BOOLEAN NOT NULL DEFAULT TRUE,
    require_special_char BOOLEAN NOT NULL DEFAULT TRUE,
    password_history_count INT NOT NULL DEFAULT 5,
    password_expiry_days INT NOT NULL DEFAULT 90,
    max_failed_attempts INT NOT NULL DEFAULT 3,
    account_lock_duration_minutes INT NOT NULL DEFAULT 30,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_password_policies_auth_policy FOREIGN KEY (authentication_policy_id)
        REFERENCES iam.authentication_policies(id) ON DELETE CASCADE,
    CONSTRAINT uq_password_policies_auth_policy UNIQUE (authentication_policy_id),
    CONSTRAINT chk_password_min_length CHECK (min_length >= 8)
);

-- -----------------------------------------------------------------------------
-- 3. MFA POLICIES
-- -----------------------------------------------------------------------------
CREATE TABLE iam.mfa_policies (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    authentication_policy_id UUID NOT NULL,
    mfa_mode iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    supported_methods VARCHAR(255) NOT NULL DEFAULT 'Face,OTP,AuthenticatorApp',

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_mfa_policies_auth_policy FOREIGN KEY (authentication_policy_id)
        REFERENCES iam.authentication_policies(id) ON DELETE CASCADE,
    CONSTRAINT uq_mfa_policies_auth_policy UNIQUE (authentication_policy_id)
);

-- -----------------------------------------------------------------------------
-- 4. GPS POLICIES
-- -----------------------------------------------------------------------------
CREATE TABLE iam.gps_policies (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    authentication_policy_id UUID NOT NULL,
    login_gps iam.policy_requirement_level NOT NULL DEFAULT 'Disabled',
    attendance_gps iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    visit_gps iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    warehouse_gps iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    delivery_gps iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    collections_gps iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    allowed_radius_meters INT NOT NULL DEFAULT 500,
    gps_accuracy_meters INT NOT NULL DEFAULT 20,
    mock_location_detection iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    background_tracking iam.policy_requirement_level NOT NULL DEFAULT 'Optional',

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_gps_policies_auth_policy FOREIGN KEY (authentication_policy_id)
        REFERENCES iam.authentication_policies(id) ON DELETE CASCADE,
    CONSTRAINT uq_gps_policies_auth_policy UNIQUE (authentication_policy_id)
);

-- -----------------------------------------------------------------------------
-- 5. FACE POLICIES
-- -----------------------------------------------------------------------------
CREATE TABLE iam.face_policies (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    authentication_policy_id UUID NOT NULL,
    login_face iam.policy_requirement_level NOT NULL DEFAULT 'Disabled',
    attendance_face iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    visit_face iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    warehouse_face iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    transaction_face iam.policy_requirement_level NOT NULL DEFAULT 'Optional',
    manager_approval_face iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    inventory_audit_face iam.policy_requirement_level NOT NULL DEFAULT 'Required',

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_face_policies_auth_policy FOREIGN KEY (authentication_policy_id)
        REFERENCES iam.authentication_policies(id) ON DELETE CASCADE,
    CONSTRAINT uq_face_policies_auth_policy UNIQUE (authentication_policy_id)
);

-- -----------------------------------------------------------------------------
-- 6. DEVICE POLICIES
-- -----------------------------------------------------------------------------
CREATE TABLE iam.device_policies (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    authentication_policy_id UUID NOT NULL,
    max_devices INT NOT NULL DEFAULT 2,
    trusted_devices_only iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    root_detection iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    jailbreak_detection iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    emulator_detection iam.policy_requirement_level NOT NULL DEFAULT 'Required',
    offline_login_allowed iam.policy_requirement_level NOT NULL DEFAULT 'Optional',
    device_registration_required iam.policy_requirement_level NOT NULL DEFAULT 'Required',

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_device_policies_auth_policy FOREIGN KEY (authentication_policy_id)
        REFERENCES iam.authentication_policies(id) ON DELETE CASCADE,
    CONSTRAINT uq_device_policies_auth_policy UNIQUE (authentication_policy_id)
);

-- -----------------------------------------------------------------------------
-- 7. SESSION POLICIES
-- -----------------------------------------------------------------------------
CREATE TABLE iam.session_policies (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    authentication_policy_id UUID NOT NULL,
    session_timeout_minutes INT NOT NULL DEFAULT 30,
    idle_timeout_minutes INT NOT NULL DEFAULT 15,
    force_logout_on_password_change BOOLEAN NOT NULL DEFAULT TRUE,
    allow_concurrent_sessions BOOLEAN NOT NULL DEFAULT FALSE,
    remember_device_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    auto_logout_on_inactivity BOOLEAN NOT NULL DEFAULT TRUE,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_session_policies_auth_policy FOREIGN KEY (authentication_policy_id)
        REFERENCES iam.authentication_policies(id) ON DELETE CASCADE,
    CONSTRAINT uq_session_policies_auth_policy UNIQUE (authentication_policy_id)
);

-- -----------------------------------------------------------------------------
-- 8. SECURITY PROFILES
-- -----------------------------------------------------------------------------
CREATE TABLE iam.security_profiles (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    profile_code VARCHAR(50) NOT NULL,
    profile_name VARCHAR(100) NOT NULL,
    description TEXT,
    authentication_policy_id UUID NOT NULL,
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID,

    CONSTRAINT uq_security_profiles_code UNIQUE (profile_code),
    CONSTRAINT fk_security_profiles_auth_policy FOREIGN KEY (authentication_policy_id)
        REFERENCES iam.authentication_policies(id)
);

-- -----------------------------------------------------------------------------
-- 9. USERS (DECOUPLED AUTHENTICATION IDENTITY ONLY)
-- -----------------------------------------------------------------------------
CREATE TABLE iam.users (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    user_code VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255),
    status iam.user_account_status NOT NULL DEFAULT 'PendingActivation',
    use_global_policy BOOLEAN NOT NULL DEFAULT TRUE,
    is_mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_count INT NOT NULL DEFAULT 0,
    last_login_at_utc TIMESTAMPTZ,
    password_changed_at_utc TIMESTAMPTZ,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID,

    CONSTRAINT uq_users_code UNIQUE (user_code),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- -----------------------------------------------------------------------------
-- AUDIT REFERENCE FOREIGN KEYS FOR IAM.USERS
-- -----------------------------------------------------------------------------
ALTER TABLE iam.authentication_policies
    ADD CONSTRAINT fk_auth_policies_created_by FOREIGN KEY (created_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_auth_policies_modified_by FOREIGN KEY (last_modified_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_auth_policies_deleted_by FOREIGN KEY (deleted_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;

ALTER TABLE iam.security_profiles
    ADD CONSTRAINT fk_security_profiles_created_by FOREIGN KEY (created_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_security_profiles_modified_by FOREIGN KEY (last_modified_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_security_profiles_deleted_by FOREIGN KEY (deleted_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;

ALTER TABLE iam.users
    ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_users_modified_by FOREIGN KEY (last_modified_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 10. ROLES (SCOPED ENTERPRISE ROLES)
-- -----------------------------------------------------------------------------
CREATE TABLE iam.roles (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    role_code VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    scope_type iam.role_scope_type NOT NULL DEFAULT 'Global',
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_roles_code UNIQUE (role_code)
);

-- -----------------------------------------------------------------------------
-- 11. PERMISSIONS (CANONICAL CODE PERMISSIONS)
-- -----------------------------------------------------------------------------
CREATE TABLE iam.permissions (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    permission_code VARCHAR(100) NOT NULL, -- Canonical Code e.g. iam.policy.manage, inventory.stock.read
    module_name VARCHAR(50) NOT NULL,     -- Descriptive metadata
    feature_name VARCHAR(50) NOT NULL,    -- Descriptive metadata
    action_key VARCHAR(50) NOT NULL,      -- Descriptive metadata
    description TEXT,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_permissions_code UNIQUE (permission_code)
);

-- -----------------------------------------------------------------------------
-- 12. ROLE_PERMISSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE iam.role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    granted_by_user_id UUID,

    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id)
        REFERENCES iam.roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id)
        REFERENCES iam.permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_granted_by FOREIGN KEY (granted_by_user_id)
        REFERENCES iam.users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 13. USER_ROLES (SCOPED USER-ROLE ASSIGNMENT)
-- -----------------------------------------------------------------------------
CREATE TABLE iam.user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    scope_type iam.role_scope_type NOT NULL DEFAULT 'Global',
    scope_value_id UUID, -- References Company ID, Branch ID, Warehouse ID depending on scope_type
    assigned_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    assigned_by_user_id UUID,

    PRIMARY KEY (user_id, role_id, scope_type, scope_value_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id)
        REFERENCES iam.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id)
        REFERENCES iam.roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by_user_id)
        REFERENCES iam.users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 14. USER_SECURITY_PROFILES
-- -----------------------------------------------------------------------------
CREATE TABLE iam.user_security_profiles (
    user_id UUID NOT NULL,
    security_profile_id UUID NOT NULL,
    assigned_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    assigned_by_user_id UUID,

    PRIMARY KEY (user_id, security_profile_id),
    CONSTRAINT fk_user_sec_profiles_user FOREIGN KEY (user_id)
        REFERENCES iam.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_sec_profiles_profile FOREIGN KEY (security_profile_id)
        REFERENCES iam.security_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_sec_profiles_assigned_by FOREIGN KEY (assigned_by_user_id)
        REFERENCES iam.users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 15. EMPLOYEE OVERRIDES
-- -----------------------------------------------------------------------------
CREATE TABLE iam.employee_overrides (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    user_id UUID NOT NULL,
    login_face iam.policy_requirement_level,
    attendance_face iam.policy_requirement_level,
    visit_face iam.policy_requirement_level,
    warehouse_face iam.policy_requirement_level,
    login_gps iam.policy_requirement_level,
    attendance_gps iam.policy_requirement_level,
    visit_gps iam.policy_requirement_level,
    warehouse_gps iam.policy_requirement_level,
    otp iam.policy_requirement_level,
    mfa iam.policy_requirement_level,
    password_expiry_days INT,
    session_timeout_minutes INT,
    max_devices INT,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_employee_overrides_user FOREIGN KEY (user_id)
        REFERENCES iam.users(id) ON DELETE CASCADE,
    CONSTRAINT uq_employee_overrides_user UNIQUE (user_id)
);

-- -----------------------------------------------------------------------------
-- 16. PASSWORD HISTORY (NON-REUSE COMPLIANCE)
-- -----------------------------------------------------------------------------
CREATE TABLE iam.password_history (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    user_id UUID NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255),
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID,

    CONSTRAINT fk_password_history_user FOREIGN KEY (user_id)
        REFERENCES iam.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_password_history_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES iam.users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 17. ACCOUNT LOCK EVENTS
-- -----------------------------------------------------------------------------
CREATE TABLE iam.account_lock_events (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    user_id UUID NOT NULL,
    event_type iam.account_lock_event_type NOT NULL,
    reason TEXT NOT NULL,
    performed_by_user_id UUID,
    event_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_account_lock_events_user FOREIGN KEY (user_id)
        REFERENCES iam.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_account_lock_events_performed_by FOREIGN KEY (performed_by_user_id)
        REFERENCES iam.users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 18. API CLIENTS (SEPARATED PROGRAMMATIC INTEGRATIONS)
-- -----------------------------------------------------------------------------
CREATE TABLE iam.api_clients (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    client_id_code VARCHAR(50) NOT NULL,
    client_name VARCHAR(100) NOT NULL,
    client_type iam.api_client_type NOT NULL DEFAULT 'SystemIntegration',
    client_secret_hash VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at_utc TIMESTAMPTZ,

    -- Optimistic Concurrency
    row_version INT NOT NULL DEFAULT 1,

    -- Audit Metadata
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID,
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc TIMESTAMPTZ,
    deleted_by_user_id UUID,

    CONSTRAINT uq_api_clients_code UNIQUE (client_id_code),
    CONSTRAINT fk_api_clients_created_by FOREIGN KEY (created_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_api_clients_modified_by FOREIGN KEY (last_modified_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_api_clients_deleted_by FOREIGN KEY (deleted_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 19. API KEYS (LINKED TO API CLIENTS)
-- -----------------------------------------------------------------------------
CREATE TABLE iam.api_keys (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    api_client_id UUID NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL,
    permissions_json JSONB,
    expires_at_utc TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID,

    CONSTRAINT fk_api_keys_client FOREIGN KEY (api_client_id)
        REFERENCES iam.api_clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_api_keys_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES iam.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_api_keys_hash UNIQUE (api_key_hash)
);

-- -----------------------------------------------------------------------------
-- 20. DEVICES
-- -----------------------------------------------------------------------------
CREATE TABLE iam.devices (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    user_id UUID NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    os_version VARCHAR(50) NOT NULL,
    is_trusted BOOLEAN NOT NULL DEFAULT TRUE,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    registered_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_used_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_devices_user FOREIGN KEY (user_id)
        REFERENCES iam.users(id) ON DELETE CASCADE,
    CONSTRAINT uq_devices_fingerprint UNIQUE (user_id, device_fingerprint)
);

-- -----------------------------------------------------------------------------
-- 21. REFRESH TOKENS (OAUTH2 ROTATION ENHANCED)
-- -----------------------------------------------------------------------------
CREATE TABLE iam.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    user_id UUID NOT NULL,
    family_id UUID NOT NULL DEFAULT iam.uuid_generate_v7(),
    token_hash VARCHAR(255) NOT NULL,
    device_id UUID,
    rotated_from_token_id UUID,
    expires_at_utc TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at_utc TIMESTAMPTZ,
    revoked_reason VARCHAR(255),
    revoked_by_user_id UUID,
    rotation_timestamp_at_utc TIMESTAMPTZ,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES iam.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_refresh_tokens_device FOREIGN KEY (device_id)
        REFERENCES iam.devices(id) ON DELETE SET NULL,
    CONSTRAINT fk_refresh_tokens_parent FOREIGN KEY (rotated_from_token_id)
        REFERENCES iam.refresh_tokens(id) ON DELETE SET NULL,
    CONSTRAINT fk_refresh_tokens_revoked_by FOREIGN KEY (revoked_by_user_id)
        REFERENCES iam.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash)
);

-- -----------------------------------------------------------------------------
-- 22. USER SESSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE iam.user_sessions (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    user_id UUID NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    device_id UUID,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    login_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_activity_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    terminated_at_utc TIMESTAMPTZ,

    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id)
        REFERENCES iam.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_sessions_device FOREIGN KEY (device_id)
        REFERENCES iam.devices(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_sessions_token UNIQUE (session_token)
);

-- -----------------------------------------------------------------------------
-- 23. LOGIN HISTORY (ENUM STATUS ENFORCED)
-- -----------------------------------------------------------------------------
CREATE TABLE iam.login_history (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    user_id UUID,
    username_attempted VARCHAR(100) NOT NULL,
    login_status iam.login_status_type NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    face_match_confidence NUMERIC(5,2),
    gps_latitude NUMERIC(10,7),
    gps_longitude NUMERIC(10,7),
    attempted_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_login_history_user FOREIGN KEY (user_id)
        REFERENCES iam.users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 24. AUDIT EVENTS
-- -----------------------------------------------------------------------------
CREATE TABLE iam.audit_events (
    id UUID PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID,
    performed_by_user_id UUID,
    ip_address VARCHAR(45),
    before_state JSONB,
    after_state JSONB,
    event_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_audit_events_user FOREIGN KEY (user_id)
        REFERENCES iam.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_events_performed_by FOREIGN KEY (performed_by_user_id)
        REFERENCES iam.users(id) ON DELETE SET NULL
);

-- =============================================================================
-- INDEXING STRATEGY
-- =============================================================================

-- Partial Indexes for Soft Delete & Active State
CREATE INDEX pix_users_active ON iam.users (id) WHERE is_deleted = FALSE;
CREATE INDEX pix_users_email ON iam.users (email) WHERE is_deleted = FALSE;
CREATE INDEX pix_users_username ON iam.users (username) WHERE is_deleted = FALSE;
CREATE INDEX pix_security_profiles_active ON iam.security_profiles (id) WHERE is_deleted = FALSE;
CREATE INDEX pix_auth_policies_active ON iam.authentication_policies (id) WHERE is_deleted = FALSE;
CREATE INDEX pix_api_clients_active ON iam.api_clients (id) WHERE is_deleted = FALSE;

-- Performance B-Tree Indexes for Foreign Key Lookup & Scoping
CREATE INDEX idx_user_roles_user_id ON iam.user_roles (user_id);
CREATE INDEX idx_user_roles_scope ON iam.user_roles (scope_type, scope_value_id);
CREATE INDEX idx_role_permissions_role_id ON iam.role_permissions (role_id);
CREATE INDEX idx_user_sec_profiles_user_id ON iam.user_security_profiles (user_id);
CREATE INDEX idx_password_history_user_id ON iam.password_history (user_id, created_at_utc DESC);
CREATE INDEX idx_account_lock_events_user_id ON iam.account_lock_events (user_id);
CREATE INDEX idx_devices_user_id ON iam.devices (user_id);
CREATE INDEX idx_api_keys_client_id ON iam.api_keys (api_client_id);
CREATE INDEX idx_refresh_tokens_user_id ON iam.refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_family ON iam.refresh_tokens (family_id);
CREATE INDEX idx_user_sessions_user_id ON iam.user_sessions (user_id);
CREATE INDEX idx_login_history_user_id ON iam.login_history (user_id);
CREATE INDEX idx_login_history_timestamp ON iam.login_history (attempted_at_utc DESC);
CREATE INDEX idx_audit_events_user_id ON iam.audit_events (user_id);
CREATE INDEX idx_audit_events_timestamp ON iam.audit_events (event_at_utc DESC);
