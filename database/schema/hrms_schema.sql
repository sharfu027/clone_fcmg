-- =============================================================================
-- INK FMCG ENTERPRISE ERP — ENTERPRISE HRMS SCHEMA DDL (v2.0 REFINED)
-- File Name      : hrms_schema.sql
-- Target Database: PostgreSQL 17+
-- Schema Owner   : hrms
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS hrms;

-- =============================================================================
-- SECTION 1 — LOOKUP TABLES
-- =============================================================================

-- 1.1 Job Grades
CREATE TABLE hrms.job_grades (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_job_grades_code UNIQUE (code),
    CONSTRAINT chk_job_grades_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.job_grades IS '[LOOKUP] Pay scale designations and rankings: G1, G2, M1, M2, E1, E2.';

-- 1.2 Attendance Statuses
CREATE TABLE hrms.attendance_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_attendance_statuses_code UNIQUE (code),
    CONSTRAINT chk_attendance_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.attendance_statuses IS '[LOOKUP] Operational states for workdays: PRESENT, ABSENT, HALF_DAY, ON_LEAVE, HOLIDAY.';

-- 1.3 Attendance Exception Types
CREATE TABLE hrms.attendance_exception_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_attendance_ex_types_code UNIQUE (code),
    CONSTRAINT chk_attendance_ex_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.attendance_exception_types IS '[LOOKUP] Discrepancies logged: LATE_IN, EARLY_OUT, MISSED_OUT_PUNCH, OVERTIME_UNAPPROVED.';

-- 1.4 Leave Types
CREATE TABLE hrms.leave_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_leave_types_code UNIQUE (code),
    CONSTRAINT chk_leave_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.leave_types IS '[LOOKUP] Legal time-off allowances: CASUAL_LEAVE, SICK_LEAVE, EARNED_LEAVE, LOP.';

-- 1.5 Leave Statuses
CREATE TABLE hrms.leave_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_leave_statuses_code UNIQUE (code),
    CONSTRAINT chk_leave_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.leave_statuses IS '[LOOKUP] Workflow approval states: DRAFT, SUBMITTED, APPROVED, REJECTED, CANCELLED.';

-- 1.6 Shift Types
CREATE TABLE hrms.shift_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_shift_types_code UNIQUE (code),
    CONSTRAINT chk_shift_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.shift_types IS '[LOOKUP] Work shifts: MORNING, AFTERNOON, NIGHT, GENERAL, FLEXI.';

-- 1.7 Payroll Statuses
CREATE TABLE hrms.payroll_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_payroll_statuses_code UNIQUE (code),
    CONSTRAINT chk_payroll_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.payroll_statuses IS '[LOOKUP] Payroll cycle states: DRAFT, CALCULATED, VERIFIED, LOCKED, PAID.';

-- 1.8 Salary Component Types
CREATE TABLE hrms.salary_component_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_sal_comp_types_code UNIQUE (code),
    CONSTRAINT chk_sal_comp_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.salary_component_types IS '[LOOKUP] Element classifications: EARNING, DEDUCTION, REIMBURSEMENT, TAX.';

-- 1.9 Performance Ratings
CREATE TABLE hrms.performance_ratings (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    score          INT          NOT NULL,
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_perf_ratings_code UNIQUE (code),
    CONSTRAINT chk_perf_ratings_score CHECK (score BETWEEN 1 AND 5),
    CONSTRAINT chk_perf_ratings_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.performance_ratings IS '[LOOKUP] Appraisal calibration values: 1_POOR to 5_OUTSTANDING.';

-- 1.10 Goal Statuses
CREATE TABLE hrms.goal_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_goal_statuses_code UNIQUE (code),
    CONSTRAINT chk_goal_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.goal_statuses IS '[LOOKUP] Objective progression states: NOT_STARTED, IN_PROGRESS, ACHIEVED, MISSED, CANCELLED.';

-- 1.11 Recruitment Statuses
CREATE TABLE hrms.recruitment_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_rec_statuses_code UNIQUE (code),
    CONSTRAINT chk_rec_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.recruitment_statuses IS '[LOOKUP] Requisition stage codes: OPEN, ON_HOLD, CLOSED, CANCELLED.';

-- 1.12 Candidate Statuses
CREATE TABLE hrms.candidate_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_candidate_statuses_code UNIQUE (code),
    CONSTRAINT chk_candidate_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.candidate_statuses IS '[LOOKUP] Application pipelines: APPLIED, INTERVIEWING, OFFERED, REJECTED, JOINED.';

-- 1.13 Interview Statuses
CREATE TABLE hrms.interview_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_interview_statuses_code UNIQUE (code),
    CONSTRAINT chk_interview_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.interview_statuses IS '[LOOKUP] Evaluation schedule states: SCHEDULED, COMPLETED, NO_SHOW, CANCELLED.';

-- 1.14 Training Statuses
CREATE TABLE hrms.training_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_training_statuses_code UNIQUE (code),
    CONSTRAINT chk_training_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.training_statuses IS '[LOOKUP] Session progression states: PLANNED, ONGOING, COMPLETED, CANCELLED.';

-- 1.15 Certification Statuses
CREATE TABLE hrms.certification_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_cert_statuses_code UNIQUE (code),
    CONSTRAINT chk_cert_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.certification_statuses IS '[LOOKUP] Credentials conditions: ACTIVE, EXPIRED, REVOKED.';

-- 1.16 Asset Statuses
CREATE TABLE hrms.asset_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_asset_statuses_code UNIQUE (code),
    CONSTRAINT chk_asset_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.asset_statuses IS '[LOOKUP] Device inventory conditions: AVAILABLE, ALLOCATED, UNDER_REPAIR, DAMAGED, LOST.';

-- 1.17 Document Types
CREATE TABLE hrms.document_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_document_types_code UNIQUE (code),
    CONSTRAINT chk_document_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.document_types IS '[LOOKUP] Personal document classifications: PASSPORT, VISA, KYC_PAN, KYC_AADHAAR, NDA.';

-- 1.18 Expense Statuses
CREATE TABLE hrms.expense_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_expense_statuses_code UNIQUE (code),
    CONSTRAINT chk_expense_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.expense_statuses IS '[LOOKUP] Self-service claim states: DRAFT, SUBMITTED, APPROVED, REJECTED, REIMBURSED.';

-- 1.19 Travel Statuses
CREATE TABLE hrms.travel_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_travel_statuses_code UNIQUE (code),
    CONSTRAINT chk_travel_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.travel_statuses IS '[LOOKUP] Corporate trip status codes: PLANNED, APPROVED, COMPLETED, CANCELLED.';

-- =============================================================================
-- SECTION 2 — CORE HR
-- =============================================================================

-- 2.1 Employment Records
CREATE TABLE hrms.employment_records (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    job_grade_id           UUID          NOT NULL REFERENCES hrms.job_grades(id),
    probation_months       INT           NOT NULL DEFAULT 0,
    probation_end_date     DATE,
    confirmation_date      DATE,
    retirement_date        DATE,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    is_deleted             BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_emp_record UNIQUE (employee_id),
    CONSTRAINT chk_probation_months CHECK (probation_months >= 0)
);

COMMENT ON TABLE hrms.employment_records IS '[OPERATIONAL] Employee job classifications, grades, and structural probation logs.';

-- 2.2 Job Changes (Transfers, Promotions, Demotions)
CREATE TABLE hrms.job_changes (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    change_type            VARCHAR(50)   NOT NULL, -- PROMOTION, DEMOTION, TRANSFER
    previous_grade_id      UUID          REFERENCES hrms.job_grades(id),
    new_grade_id           UUID          NOT NULL REFERENCES hrms.job_grades(id),
    previous_dept_id       UUID          REFERENCES organization.departments(id),
    new_dept_id            UUID          NOT NULL REFERENCES organization.departments(id),
    previous_desig_id      UUID          REFERENCES organization.designations(id),
    new_desig_id           UUID          NOT NULL REFERENCES organization.designations(id),
    effective_date         DATE          NOT NULL,
    approved_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_job_change_type CHECK (change_type IN ('PROMOTION', 'DEMOTION', 'TRANSFER'))
);

COMMENT ON TABLE hrms.job_changes IS '[OPERATIONAL] Historic log of employee promotions, transfers, and grade modifications.';

-- 2.3 Exit & Separation Records
CREATE TABLE hrms.exit_records (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    separation_type        VARCHAR(50)   NOT NULL, -- RESIGNATION, TERMINATION, RETIREMENT
    notice_date            DATE          NOT NULL,
    relieving_date         DATE,
    exit_interview_conducted BOOLEAN     NOT NULL DEFAULT FALSE,
    exit_interview_notes   TEXT,
    fnf_settlement_ref     VARCHAR(100), -- Final Settlement Reference code

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_exit_employee UNIQUE (employee_id),
    CONSTRAINT chk_sep_type CHECK (separation_type IN ('RESIGNATION', 'TERMINATION', 'RETIREMENT'))
);

COMMENT ON TABLE hrms.exit_records IS '[OPERATIONAL] Offboarding records tracking separations, settlement details, and exits.';

-- 2.4 Employment Lifecycle History (v2.0 addition)
CREATE TABLE hrms.employment_lifecycle_history (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employment_record_id UUID         NOT NULL REFERENCES hrms.employment_records(id) ON DELETE CASCADE,
    previous_state       VARCHAR(100),
    new_state            VARCHAR(100) NOT NULL,
    effective_date       DATE         NOT NULL,
    approved_by_user_id  UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    change_reason        TEXT,
    event_timestamp      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE hrms.employment_lifecycle_history IS '[HISTORY] Immutable audit logging for all employee status shifts and department swaps.';

-- =============================================================================
-- SECTION 3 — ATTENDANCE MANAGEMENT
-- =============================================================================

-- 3.1 Shift Definitions
CREATE TABLE hrms.shift_definitions (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    shift_type_id          UUID          NOT NULL REFERENCES hrms.shift_types(id),
    shift_name             VARCHAR(100)  NOT NULL,
    start_time             TIME          NOT NULL,
    end_time               TIME          NOT NULL,
    late_tolerance_minutes INT           NOT NULL DEFAULT 15,
    half_day_hours         NUMERIC(4,2)  NOT NULL DEFAULT 4.00,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_shift_tolerance CHECK (late_tolerance_minutes >= 0),
    CONSTRAINT chk_shift_half_day CHECK (half_day_hours >= 0.00)
);

COMMENT ON TABLE hrms.shift_definitions IS '[FOUNDATION] Shift schedules with grace allowances and duration constraints.';

-- 3.2 Shift Assignments & Rotations
CREATE TABLE hrms.shift_assignments (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    shift_definition_id    UUID          NOT NULL REFERENCES hrms.shift_definitions(id),
    effective_from_date    DATE          NOT NULL,
    effective_to_date      DATE,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_shift_assign_dates CHECK (effective_to_date IS NULL OR effective_to_date >= effective_from_date)
);

COMMENT ON TABLE hrms.shift_assignments IS '[OPERATIONAL] Shift rotation maps linking employee IDs to definitions.';

-- 3.3 Attendance Records (Punch Logs)
CREATE TABLE hrms.attendance_records (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    work_date              DATE          NOT NULL,
    punch_in_time          TIMESTAMPTZ,
    punch_out_time         TIMESTAMPTZ,
    attendance_status_id   UUID          NOT NULL REFERENCES hrms.attendance_statuses(id),
    
    -- Telematics & Biometrics Hooks
    face_verified_in       BOOLEAN       NOT NULL DEFAULT FALSE,
    face_verified_out      BOOLEAN       NOT NULL DEFAULT FALSE,
    gps_in_latitude        NUMERIC(9,6),
    gps_in_longitude       NUMERIC(9,6),
    gps_out_latitude       NUMERIC(9,6),
    gps_out_longitude      NUMERIC(9,6),
    device_identifier      VARCHAR(100),

    CONSTRAINT uq_employee_work_date UNIQUE (employee_id, work_date),
    CONSTRAINT chk_punch_order CHECK (punch_out_time IS NULL OR punch_out_time >= punch_in_time)
);

COMMENT ON TABLE hrms.attendance_records IS '[OPERATIONAL] Daily employee attendance logs with GPS coordinates and Face ID verifications.';

-- 3.4 Break Logs
CREATE TABLE hrms.break_logs (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    attendance_record_id   UUID          NOT NULL REFERENCES hrms.attendance_records(id) ON DELETE CASCADE,
    break_start_time       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    break_end_time         TIMESTAMPTZ,

    CONSTRAINT chk_break_times CHECK (break_end_time IS NULL OR break_end_time >= break_start_time)
);

COMMENT ON TABLE hrms.break_logs IS '[OPERATIONAL] Timestamps tracking employee breaks within a shift.';

-- 3.5 Attendance Corrections & Regularizations
CREATE TABLE hrms.attendance_corrections (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    attendance_record_id   UUID          NOT NULL REFERENCES hrms.attendance_records(id) ON DELETE CASCADE,
    requested_punch_in     TIMESTAMPTZ,
    requested_punch_out    TIMESTAMPTZ,
    reason                 TEXT          NOT NULL,
    approved_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    approved_at_utc        TIMESTAMPTZ
);

COMMENT ON TABLE hrms.attendance_corrections IS '[OPERATIONAL] Regularization workflows correcting missed punches.';

-- 3.6 Attendance Correction History (v2.0 addition)
CREATE TABLE hrms.attendance_correction_history (
    id                        UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    attendance_correction_id  UUID         NOT NULL REFERENCES hrms.attendance_corrections(id) ON DELETE CASCADE,
    original_punch_in         TIMESTAMPTZ,
    original_punch_out        TIMESTAMPTZ,
    corrected_punch_in         TIMESTAMPTZ,
    corrected_punch_out        TIMESTAMPTZ,
    requested_by_user_id      UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    approved_by_user_id        UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    correction_reason         TEXT,
    approval_timestamp        TIMESTAMPTZ,
    correction_source         VARCHAR(100) NOT NULL DEFAULT 'MANUAL'
);

COMMENT ON TABLE hrms.attendance_correction_history IS '[HISTORY] Audit trail of all attendance regularizations and punch updates.';

-- =============================================================================
-- SECTION 4 — LEAVE MANAGEMENT
-- =============================================================================

-- 4.1 Leave Policies & Allocation Rules
CREATE TABLE hrms.leave_policies (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    leave_type_id          UUID          NOT NULL REFERENCES hrms.leave_types(id),
    policy_name            VARCHAR(150)  NOT NULL,
    annual_allowance       INT           NOT NULL,
    carry_forward_limit    INT           NOT NULL DEFAULT 0,
    encashable             BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active              BOOLEAN       NOT NULL DEFAULT TRUE,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_annual_allowance CHECK (annual_allowance >= 0),
    CONSTRAINT chk_carry_forward CHECK (carry_forward_limit >= 0)
);

COMMENT ON TABLE hrms.leave_policies IS '[FOUNDATION] Annual leave allowances, balances, and carry-forward limits.';

-- 4.2 Leave Balances
CREATE TABLE hrms.leave_balances (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    leave_type_id          UUID          NOT NULL REFERENCES hrms.leave_types(id),
    calendar_year          INT           NOT NULL,
    allocated_days         INT           NOT NULL,
    availed_days           NUMERIC(4,1)  NOT NULL DEFAULT 0.0,
    balance_days           NUMERIC(4,1)  GENERATED ALWAYS AS (allocated_days - availed_days) STORED,

    CONSTRAINT uq_employee_leave_year UNIQUE (employee_id, leave_type_id, calendar_year),
    CONSTRAINT chk_allocated_days CHECK (allocated_days >= 0),
    CONSTRAINT chk_availed_days CHECK (availed_days >= 0.0)
);

COMMENT ON TABLE hrms.leave_balances IS '[OPERATIONAL] Current available balance counters per employee, leave type, and calendar year.';

-- 4.3 Leave Requests
CREATE TABLE hrms.leave_requests (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    leave_type_id          UUID          NOT NULL REFERENCES hrms.leave_types(id),
    leave_status_id        UUID          NOT NULL REFERENCES hrms.leave_statuses(id),
    start_date             DATE          NOT NULL,
    end_date               DATE          NOT NULL,
    is_half_day            BOOLEAN       NOT NULL DEFAULT FALSE,
    reason                 TEXT          NOT NULL,
    approved_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

COMMENT ON TABLE hrms.leave_requests IS '[OPERATIONAL] Leave requests with dates and approval states.';

-- 4.4 Leave Balance History (v2.0 addition)
CREATE TABLE hrms.leave_balance_history (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    leave_balance_id     UUID          NOT NULL REFERENCES hrms.leave_balances(id) ON DELETE CASCADE,
    transaction_type     VARCHAR(50)   NOT NULL, -- ACCRUAL, USAGE, CARRY_FORWARD, EXPIRY, ENCASHMENT, MANUAL_ADJUSTMENT
    delta_days           NUMERIC(4,1)  NOT NULL,
    running_balance_days NUMERIC(4,1)  NOT NULL,
    event_timestamp      TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    remarks              TEXT,

    CONSTRAINT chk_leave_bal_hist_type CHECK (transaction_type IN ('ACCRUAL', 'USAGE', 'CARRY_FORWARD', 'EXPIRY', 'ENCASHMENT', 'MANUAL_ADJUSTMENT'))
);

COMMENT ON TABLE hrms.leave_balance_history IS '[HISTORY] Transaction registry auditing leave encashments and accruals.';

-- =============================================================================
-- SECTION 5 — PAYROLL FOUNDATION
-- =============================================================================

-- 5.1 Payroll Groups & Pay Grades
CREATE TABLE hrms.payroll_groups (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                   VARCHAR(50)   NOT NULL,
    name                   VARCHAR(100)  NOT NULL,
    currency_code          VARCHAR(3)    NOT NULL DEFAULT 'INR',
    is_active              BOOLEAN       NOT NULL DEFAULT TRUE,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_payroll_groups_code UNIQUE (code),
    CONSTRAINT chk_pay_group_code CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.payroll_groups IS '[FOUNDATION] Frequency groups segregating employees: WEEKLY, MONTHLY, DIRECTORS.';

-- 5.2 Salary Components
CREATE TABLE hrms.salary_components (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                   VARCHAR(50)   NOT NULL,
    name                   VARCHAR(100)  NOT NULL,
    component_type_id      UUID          NOT NULL REFERENCES hrms.salary_component_types(id),
    is_taxable             BOOLEAN       NOT NULL DEFAULT TRUE,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_salary_components_code UNIQUE (code),
    CONSTRAINT chk_sal_comp_code CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.salary_components IS '[FOUNDATION] Salary elements: BASIC, HRA, PF_DEDUCTION, MEDICAL_REIMBURSEMENT.';

-- 5.3 Salary Structures
CREATE TABLE hrms.salary_structures (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    payroll_group_id       UUID          NOT NULL REFERENCES hrms.payroll_groups(id),
    effective_from_date    DATE          NOT NULL,
    effective_to_date      DATE,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_sal_structure_dates CHECK (effective_to_date IS NULL OR effective_to_date >= effective_from_date)
);

COMMENT ON TABLE hrms.salary_structures IS '[OPERATIONAL] Employee structures mapping to specific payroll groups.';

-- 5.4 Salary Structure Lines (Component Amounts)
CREATE TABLE hrms.salary_structure_lines (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    salary_structure_id    UUID          NOT NULL REFERENCES hrms.salary_structures(id) ON DELETE CASCADE,
    salary_component_id    UUID          NOT NULL REFERENCES hrms.salary_components(id),
    amount                 NUMERIC(18,4) NOT NULL DEFAULT 0.0000,

    CONSTRAINT uq_structure_component UNIQUE (salary_structure_id, salary_component_id),
    CONSTRAINT chk_struct_line_amount CHECK (amount >= 0.0000)
);

COMMENT ON TABLE hrms.salary_structure_lines IS '[OPERATIONAL] Base monetary assignments mapped per component.';

-- 5.5 Payroll Runs & Payslips
CREATE TABLE hrms.payroll_runs (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    payroll_group_id       UUID          NOT NULL REFERENCES hrms.payroll_groups(id),
    payroll_status_id      UUID          NOT NULL REFERENCES hrms.payroll_statuses(id),
    period_start_date      DATE          NOT NULL,
    period_end_date        DATE          NOT NULL,
    run_execution_time     TIMESTAMPTZ,
    total_net_payout       NUMERIC(18,4) NOT NULL DEFAULT 0.0000,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_payroll_period CHECK (period_end_date >= period_start_date),
    CONSTRAINT chk_payroll_payout CHECK (total_net_payout >= 0.0000)
);

COMMENT ON TABLE hrms.payroll_runs IS '[OPERATIONAL] Batch processing headers for monthly calculations.';

CREATE TABLE hrms.employee_payslips (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    payroll_run_id         UUID          NOT NULL REFERENCES hrms.payroll_runs(id) ON DELETE CASCADE,
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    gross_earnings         NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    total_deductions       NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    net_payout             NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    payslip_status         VARCHAR(50)   NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, PAID

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_run_employee UNIQUE (payroll_run_id, employee_id),
    CONSTRAINT chk_net_calc CHECK (net_payout = (gross_earnings - total_deductions)),
    CONSTRAINT chk_gross CHECK (gross_earnings >= 0.0000),
    CONSTRAINT chk_deduct CHECK (total_deductions >= 0.0000)
);

COMMENT ON TABLE hrms.employee_payslips IS '[OPERATIONAL] Employee payslip items tracking earnings, deductions, and nets.';

-- 5.6 Salary Revision History (v2.0 addition)
CREATE TABLE hrms.salary_revision_history (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id                  UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    previous_salary_structure_id UUID          REFERENCES hrms.salary_structures(id) ON DELETE SET NULL,
    new_salary_structure_id      UUID          NOT NULL REFERENCES hrms.salary_structures(id) ON DELETE CASCADE,
    component_changes            JSONB,
    effective_date               DATE          NOT NULL,
    revision_reason              TEXT,
    approved_by_user_id          UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    payroll_version              INT           NOT NULL DEFAULT 1
);

COMMENT ON TABLE hrms.salary_revision_history IS '[HISTORY] Auditing salary component increases and revisions.';

-- 5.7 Payroll Run History (v2.0 addition)
CREATE TABLE hrms.payroll_run_history (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    payroll_run_id           UUID          NOT NULL REFERENCES hrms.payroll_runs(id) ON DELETE CASCADE,
    payroll_version          INT           NOT NULL DEFAULT 1,
    period_start_date        DATE          NOT NULL,
    period_end_date          DATE          NOT NULL,
    execution_timestamp      TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    approved_by_user_id      UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    lock_status              VARCHAR(50)   NOT NULL, -- LOCKED, UNLOCKED
    is_recalculation         BOOLEAN       NOT NULL DEFAULT FALSE,
    generated_payslips_count INT           NOT NULL DEFAULT 0,
    failure_details          TEXT
);

COMMENT ON TABLE hrms.payroll_run_history IS '[HISTORY] Record tracking recalculation triggers, versions, and verification runs.';

-- =============================================================================
-- SECTION 6 — PERFORMANCE MANAGEMENT
-- =============================================================================

-- 6.1 Review Cycles
CREATE TABLE hrms.review_cycles (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    cycle_name             VARCHAR(150)  NOT NULL,
    start_date             DATE          NOT NULL,
    end_date               DATE          NOT NULL,
    is_active              BOOLEAN       NOT NULL DEFAULT TRUE,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_cycle_dates CHECK (end_date >= start_date)
);

COMMENT ON TABLE hrms.review_cycles IS '[FOUNDATION] Performance calendar cycles: Q1, Annual 2026.';

-- 6.2 Goal Settings
CREATE TABLE hrms.goals (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    review_cycle_id        UUID          NOT NULL REFERENCES hrms.review_cycles(id),
    goal_status_id         UUID          NOT NULL REFERENCES hrms.goal_statuses(id),
    title                  VARCHAR(255)  NOT NULL,
    description            TEXT,
    weightage_pct          INT           NOT NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_goal_weight CHECK (weightage_pct BETWEEN 0 AND 100)
);

COMMENT ON TABLE hrms.goals IS '[OPERATIONAL] Employee targets linked to appraisal weight percentages.';

-- 6.3 Appraisals & Ratings
CREATE TABLE hrms.appraisals (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    review_cycle_id        UUID          NOT NULL REFERENCES hrms.review_cycles(id),
    manager_rating_id      UUID          REFERENCES hrms.performance_ratings(id),
    calibrated_rating_id   UUID          REFERENCES hrms.performance_ratings(id),
    feedback_notes         TEXT,
    pip_initiated          BOOLEAN       NOT NULL DEFAULT FALSE,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_employee_cycle UNIQUE (employee_id, review_cycle_id)
);

COMMENT ON TABLE hrms.appraisals IS '[OPERATIONAL] Reviews tracking manager inputs, calibrations, and PIP indicators.';

-- 6.4 Performance Review History (v2.0 addition)
CREATE TABLE hrms.performance_review_history (
    id                        UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    appraisal_id              UUID         NOT NULL REFERENCES hrms.appraisals(id) ON DELETE CASCADE,
    reviewer_employee_id      UUID         NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    previous_rating_id        UUID         REFERENCES hrms.performance_ratings(id) ON DELETE SET NULL,
    final_rating_id           UUID         NOT NULL REFERENCES hrms.performance_ratings(id) ON DELETE CASCADE,
    calibration_result        TEXT,
    improvement_plan_details  TEXT,
    promotion_recommendation  BOOLEAN      NOT NULL DEFAULT FALSE,
    completion_timestamp      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE hrms.performance_review_history IS '[HISTORY] Logs tracing reviewer switches, score updates, and PIP milestones.';

-- =============================================================================
-- SECTION 7 — RECRUITMENT
-- =============================================================================

-- 7.1 Job Requisitions & Openings
CREATE TABLE hrms.job_requisitions (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    requisition_number     VARCHAR(50)   NOT NULL,
    department_id          UUID          NOT NULL REFERENCES organization.departments(id),
    designation_id         UUID          NOT NULL REFERENCES organization.designations(id),
    requested_vacancies    INT           NOT NULL,
    budgeted_salary_max    NUMERIC(18,4) NOT NULL,
    status_id              UUID          NOT NULL REFERENCES hrms.recruitment_statuses(id),

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_req_number UNIQUE (requisition_number),
    CONSTRAINT chk_vacancies CHECK (requested_vacancies > 0),
    CONSTRAINT chk_req_salary CHECK (budgeted_salary_max >= 0.0000)
);

COMMENT ON TABLE hrms.job_requisitions IS '[OPERATIONAL] Vacancy requisition requests tracking departments and salaries.';

-- 7.2 Candidate Registrations
CREATE TABLE hrms.candidates (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    first_name             VARCHAR(100)  NOT NULL,
    last_name              VARCHAR(100)  NOT NULL,
    email                  VARCHAR(255)  NOT NULL,
    phone                  VARCHAR(50)   NOT NULL,
    candidate_status_id    UUID          NOT NULL REFERENCES hrms.candidate_statuses(id),
    resume_document_hook   VARCHAR(255),

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_candidate_email UNIQUE (email)
);

COMMENT ON TABLE hrms.candidates IS '[OPERATIONAL] Candidate pool profiles linking resumes and contact numbers.';

-- 7.3 Candidate Applications
CREATE TABLE hrms.candidate_applications (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    job_requisition_id     UUID          NOT NULL REFERENCES hrms.job_requisitions(id) ON DELETE CASCADE,
    candidate_id           UUID          NOT NULL REFERENCES hrms.candidates(id) ON DELETE CASCADE,
    application_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
    current_round          INT           NOT NULL DEFAULT 1,

    CONSTRAINT uq_requisition_candidate UNIQUE (job_requisition_id, candidate_id)
);

COMMENT ON TABLE hrms.candidate_applications IS '[OPERATIONAL] Track applications linking requisitions to candidates.';

-- 7.4 Interview Schedules
CREATE TABLE hrms.interview_schedules (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    application_id         UUID          NOT NULL REFERENCES hrms.candidate_applications(id) ON DELETE CASCADE,
    interview_round        INT           NOT NULL,
    interviewer_employee_id UUID         NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    scheduled_time         TIMESTAMPTZ   NOT NULL,
    status_id              UUID          NOT NULL REFERENCES hrms.interview_statuses(id),
    feedback_score         INT           CHECK (feedback_score BETWEEN 1 AND 5),
    feedback_notes         TEXT
);

COMMENT ON TABLE hrms.interview_schedules IS '[OPERATIONAL] Interview timeline logs recording candidate scores.';

-- 7.5 Recruitment Pipeline History (v2.0 addition)
CREATE TABLE hrms.recruitment_pipeline_history (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    application_id       UUID         NOT NULL REFERENCES hrms.candidate_applications(id) ON DELETE CASCADE,
    stage                VARCHAR(50)  NOT NULL, -- RECEIVED, SCREENING, INTERVIEW, OFFER, ACCEPTED, REJECTED, WITHDRAWN, JOINED
    event_timestamp      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    changed_by_user_id   UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    comments             TEXT,

    CONSTRAINT chk_rec_pipe_stage CHECK (stage IN ('RECEIVED', 'SCREENING', 'INTERVIEW', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'JOINED'))
);

COMMENT ON TABLE hrms.recruitment_pipeline_history IS '[HISTORY] Stage log tracking candidate evaluations from screen to hire.';

-- =============================================================================
-- SECTION 8 — LEARNING & TRAINING
-- =============================================================================

-- 8.1 Training Programs
CREATE TABLE hrms.training_programs (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    program_name           VARCHAR(150)  NOT NULL,
    description            TEXT,
    duration_hours         INT           NOT NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_train_duration CHECK (duration_hours > 0)
);

COMMENT ON TABLE hrms.training_programs IS '[FOUNDATION] Catalog definitions for training programs.';

-- 8.2 Training Sessions & Enrollments
CREATE TABLE hrms.training_sessions (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    training_program_id    UUID          NOT NULL REFERENCES hrms.training_programs(id) ON DELETE CASCADE,
    session_code           VARCHAR(50)   NOT NULL,
    start_date             DATE          NOT NULL,
    end_date               DATE          NOT NULL,
    status_id              UUID          NOT NULL REFERENCES hrms.training_statuses(id),

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_session_code UNIQUE (session_code),
    CONSTRAINT chk_session_dates CHECK (end_date >= start_date)
);

COMMENT ON TABLE hrms.training_sessions IS '[OPERATIONAL] Realized training events scheduled by coordinators.';

CREATE TABLE hrms.training_enrollments (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    training_session_id    UUID          NOT NULL REFERENCES hrms.training_sessions(id) ON DELETE CASCADE,
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    is_completed           BOOLEAN       NOT NULL DEFAULT FALSE,
    certificate_url        VARCHAR(255),
    expiry_date            DATE,

    CONSTRAINT uq_session_employee UNIQUE (training_session_id, employee_id)
);

COMMENT ON TABLE hrms.training_enrollments IS '[OPERATIONAL] Student registrations mapping employee training tracks.';

-- 8.3 Training Completion History (v2.0 addition)
CREATE TABLE hrms.training_completion_history (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    enrollment_id          UUID         NOT NULL REFERENCES hrms.training_enrollments(id) ON DELETE CASCADE,
    stage                  VARCHAR(50)  NOT NULL, -- ENROLLED, ATTENDED, ASSESSED, COMPLETED, CERTIFIED, RENEWED, EXPIRED
    score_achieved         INT,
    certificate_reference  VARCHAR(255),
    event_timestamp        TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_train_comp_stage CHECK (stage IN ('ENROLLED', 'ATTENDED', 'ASSESSED', 'COMPLETED', 'CERTIFIED', 'RENEWED', 'EXPIRED'))
);

COMMENT ON TABLE hrms.training_completion_history IS '[HISTORY] Timeline tracking training milestones, renewals, and credentials.';

-- =============================================================================
-- SECTION 9 — EMPLOYEE ASSETS
-- =============================================================================

-- 9.1 Asset Category Master
CREATE TABLE hrms.asset_categories (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_asset_categories_code UNIQUE (code),
    CONSTRAINT chk_asset_cat_code CHECK (code = upper(code))
);

COMMENT ON TABLE hrms.asset_categories IS '[FOUNDATION] Inventory groups: LAPTOP, MOBILE_DEVICE, VEHICLE.';

-- 9.2 Asset Inventories
CREATE TABLE hrms.asset_inventories (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    asset_category_id      UUID          NOT NULL REFERENCES hrms.asset_categories(id),
    asset_tag              VARCHAR(50)   NOT NULL,
    serial_number          VARCHAR(100)  NOT NULL,
    model_name             VARCHAR(150)  NOT NULL,
    status_id              UUID          NOT NULL REFERENCES hrms.asset_statuses(id),

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_asset_tag UNIQUE (asset_tag)
);

COMMENT ON TABLE hrms.asset_inventories IS '[OPERATIONAL] Serialized list of devices and hardware.';

-- 9.3 Asset Allocations & Assignment History
CREATE TABLE hrms.asset_allocations (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    asset_inventory_id     UUID          NOT NULL REFERENCES hrms.asset_inventories(id) ON DELETE CASCADE,
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    allocated_at           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    returned_at            TIMESTAMPTZ,
    damage_reported        BOOLEAN       NOT NULL DEFAULT FALSE,
    damage_notes           TEXT,

    CONSTRAINT chk_alloc_return CHECK (returned_at IS NULL OR returned_at >= allocated_at)
);

COMMENT ON TABLE hrms.asset_allocations IS '[OPERATIONAL] Device handovers tracking release dates and return flags.';

-- 9.4 Asset Assignment History (v2.0 addition)
CREATE TABLE hrms.asset_assignment_history (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    asset_inventory_id       UUID         NOT NULL REFERENCES hrms.asset_inventories(id) ON DELETE CASCADE,
    responsible_employee_id  UUID         NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    assignment_event         VARCHAR(50)  NOT NULL, -- ASSIGNMENT, TRANSFER, REPAIR, RETURN, REPLACEMENT, LOSS, DISPOSAL
    event_timestamp          TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    remarks                  TEXT,

    CONSTRAINT chk_asset_assign_event CHECK (assignment_event IN ('ASSIGNMENT', 'TRANSFER', 'REPAIR', 'RETURN', 'REPLACEMENT', 'LOSS', 'DISPOSAL'))
);

COMMENT ON TABLE hrms.asset_assignment_history IS '[HISTORY] Hardware custody trail tracking asset swaps and losses.';

-- =============================================================================
-- SECTION 10 — EMPLOYEE DOCUMENTS
-- =============================================================================

CREATE TABLE hrms.employee_documents (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    document_type_id       UUID          NOT NULL REFERENCES hrms.document_types(id),
    document_number        VARCHAR(100)  NOT NULL,
    expiry_date            DATE,
    document_version       INT           NOT NULL DEFAULT 1,
    file_reference_hook    VARCHAR(255)  NOT NULL, -- Link to secure DMS blob storage
    is_verified            BOOLEAN       NOT NULL DEFAULT FALSE,
    verified_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_doc_ver CHECK (document_version >= 1)
);

COMMENT ON TABLE hrms.employee_documents IS '[OPERATIONAL] Versioned files tracking visa, credentials, and passport expiry dates.';

-- 10.2 Employee Document History (v2.0 addition)
CREATE TABLE hrms.employee_document_history (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_document_id UUID         NOT NULL REFERENCES hrms.employee_documents(id) ON DELETE CASCADE,
    action_type          VARCHAR(50)  NOT NULL, -- UPLOAD, REPLACEMENT, VERSION_UPGRADE, EXPIRY, RENEWAL, ARCHIVE, VERIFICATION
    document_version     INT          NOT NULL,
    file_reference_hook  VARCHAR(255) NOT NULL,
    event_timestamp      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    performed_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_emp_doc_hist_action CHECK (action_type IN ('UPLOAD', 'REPLACEMENT', 'VERSION_UPGRADE', 'EXPIRY', 'RENEWAL', 'ARCHIVE', 'VERIFICATION'))
);

COMMENT ON TABLE hrms.employee_document_history IS '[HISTORY] Verification trail tracking document modifications and updates.';

-- =============================================================================
-- SECTION 11 — EMPLOYEE SELF SERVICE (ESS)
-- =============================================================================

-- 11.1 Expense Reimbursement Claims
CREATE TABLE hrms.expense_claims (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    claim_date             DATE          NOT NULL DEFAULT CURRENT_DATE,
    amount                 NUMERIC(18,4) NOT NULL,
    status_id              UUID          NOT NULL REFERENCES hrms.expense_statuses(id),
    approved_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    settled_in_payslip_id  UUID          REFERENCES hrms.employee_payslips(id) ON DELETE SET NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_expense_amount CHECK (amount > 0.0000)
);

COMMENT ON TABLE hrms.expense_claims IS '[OPERATIONAL] Employee reimbursement requests processed through payroll cycles.';

-- 11.2 Business Travel Requests
CREATE TABLE hrms.travel_requests (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    departure_date         DATE          NOT NULL,
    return_date            DATE          NOT NULL,
    purpose                TEXT          NOT NULL,
    status_id              UUID          NOT NULL REFERENCES hrms.travel_statuses(id),
    approved_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_travel_dates CHECK (return_date >= departure_date)
);

COMMENT ON TABLE hrms.travel_requests IS '[OPERATIONAL] Corporate travel applications.';

-- =============================================================================
-- SECTION 12 — HR ANALYTICS & TIMELINES (v2.0 REFINED)
-- =============================================================================

-- 12.1 HR Metric Snapshots
CREATE TABLE hrms.hrms_snapshots (
    id                      UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    recorded_date           DATE          NOT NULL DEFAULT CURRENT_DATE,
    
    total_headcount         INT           NOT NULL DEFAULT 0,
    attrition_rate_pct      NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
    average_performance_score NUMERIC(3,2),
    active_job_openings     INT           NOT NULL DEFAULT 0,
    total_payroll_cost      NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    
    calculation_version     INT           NOT NULL DEFAULT 1,
    aggregation_period      VARCHAR(50)   NOT NULL DEFAULT 'DAILY', -- DAILY, WEEKLY, MONTHLY
    calculation_source      VARCHAR(100)  NOT NULL DEFAULT 'SYSTEM_BATCH',
    execution_timestamp     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    created_at_utc          TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_hrms_snapshot UNIQUE (recorded_date, calculation_version),
    CONSTRAINT chk_hrms_snap_calc_ver CHECK (calculation_version >= 1),
    CONSTRAINT chk_hrms_snap_period CHECK (aggregation_period IN ('DAILY', 'WEEKLY', 'MONTHLY'))
);

COMMENT ON TABLE hrms.hrms_snapshots IS '[HISTORY] daily logs tracking headcounts, attrition percentages, and payroll costs.';

-- 12.2 HRMS SLA Monitoring (v2.0 addition)
CREATE TABLE hrms.hrms_sla_monitoring (
    id                      UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sla_type                VARCHAR(50)  NOT NULL, -- LEAVE_APPROVAL, ATTENDANCE_CORRECTION, RECRUITMENT, PAYROLL, ASSET_RETURN, DOCUMENT_VERIFICATION, TRAINING_COMPLETION
    source_document_id      UUID         NOT NULL,
    target_duration_minutes INT          NOT NULL,
    actual_duration_minutes INT,
    is_breached             BOOLEAN      GENERATED ALWAYS AS (actual_duration_minutes > target_duration_minutes) STORED,
    breach_reason           TEXT,
    created_at_utc          TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_hrms_sla_target CHECK (target_duration_minutes > 0),
    CONSTRAINT chk_hrms_sla_actual CHECK (actual_duration_minutes IS NULL OR actual_duration_minutes >= 0),
    CONSTRAINT chk_hrms_sla_type CHECK (sla_type IN ('LEAVE_APPROVAL', 'ATTENDANCE_CORRECTION', 'RECRUITMENT', 'PAYROLL', 'ASSET_RETURN', 'DOCUMENT_VERIFICATION', 'TRAINING_COMPLETION'))
);

COMMENT ON TABLE hrms.hrms_sla_monitoring IS '[OPERATIONAL] Workflow SLA trackers flagging approval delays.';

-- 12.3 HRMS Audit Event Timeline (v2.0 addition)
CREATE TABLE hrms.hrms_audit_event_timeline (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    event_type           VARCHAR(100) NOT NULL, -- EMPLOYMENT_CHANGES, ATTENDANCE_CORRECTIONS, LEAVE_APPROVAL, PAYROLL_APPROVAL, SALARY_REVISION, PERFORMANCE_REVIEW, RECRUITMENT_EVENTS, TRAINING_COMPLETION, ASSET_ASSIGNMENT, DOCUMENT_UPDATES, ESS_REQUESTS
    source_document_type VARCHAR(50)  NOT NULL,
    source_document_id   UUID         NOT NULL,
    event_timestamp      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    performed_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    payload              JSONB,

    created_at_utc       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE hrms.hrms_audit_event_timeline IS '[HISTORY] Immutable master audit timeline recording employee promotions and payroll locks.';

-- =============================================================================
-- SECTION 13 — INDEX STRATEGY (B-TREE FOREIGNS & COMPOSITE COVERING)
-- =============================================================================

-- 13.1 B-Tree Indexes on all Foreign Keys
CREATE INDEX idx_job_grades_fk                 ON hrms.job_grades (id);

CREATE INDEX idx_employment_employee_fk        ON hrms.employment_records (employee_id);
CREATE INDEX idx_employment_grade_fk           ON hrms.employment_records (job_grade_id);

CREATE INDEX idx_job_change_employee_fk        ON hrms.job_changes (employee_id);
CREATE INDEX idx_job_change_prev_grade_fk      ON hrms.job_changes (previous_grade_id);
CREATE INDEX idx_job_change_new_grade_fk       ON hrms.job_changes (new_grade_id);
CREATE INDEX idx_job_change_prev_dept_fk       ON hrms.job_changes (previous_dept_id);
CREATE INDEX idx_job_change_new_dept_fk        ON hrms.job_changes (new_dept_id);
CREATE INDEX idx_job_change_prev_desig_fk      ON hrms.job_changes (previous_desig_id);
CREATE INDEX idx_job_change_new_desig_fk       ON hrms.job_changes (new_desig_id);
CREATE INDEX idx_job_change_user_fk            ON hrms.job_changes (approved_by_user_id);

CREATE INDEX idx_exit_employee_fk              ON hrms.exit_records (employee_id);

CREATE INDEX idx_shift_def_type_fk             ON hrms.shift_definitions (shift_type_id);

CREATE INDEX idx_shift_assign_employee_fk      ON hrms.shift_assignments (employee_id);
CREATE INDEX idx_shift_assign_def_fk           ON hrms.shift_assignments (shift_definition_id);

CREATE INDEX idx_attendance_employee_fk        ON hrms.attendance_records (employee_id);
CREATE INDEX idx_attendance_status_fk          ON hrms.attendance_records (attendance_status_id);

CREATE INDEX idx_break_attendance_fk           ON hrms.break_logs (attendance_record_id);

CREATE INDEX idx_correct_attendance_fk         ON hrms.attendance_corrections (attendance_record_id);
CREATE INDEX idx_correct_user_fk               ON hrms.attendance_corrections (approved_by_user_id);

CREATE INDEX idx_leave_pol_type_fk             ON hrms.leave_policies (leave_type_id);

CREATE INDEX idx_leave_bal_employee_fk         ON hrms.leave_balances (employee_id);
CREATE INDEX idx_leave_bal_type_fk             ON hrms.leave_balances (leave_type_id);

CREATE INDEX idx_leave_req_employee_fk         ON hrms.leave_requests (employee_id);
CREATE INDEX idx_leave_req_type_fk             ON hrms.leave_requests (leave_type_id);
CREATE INDEX idx_leave_req_status_fk           ON hrms.leave_requests (leave_status_id);
CREATE INDEX idx_leave_req_user_fk             ON hrms.leave_requests (approved_by_user_id);

CREATE INDEX idx_salary_comp_type_fk           ON hrms.salary_components (component_type_id);

CREATE INDEX idx_sal_struct_employee_fk        ON hrms.salary_structures (employee_id);
CREATE INDEX idx_sal_struct_group_fk           ON hrms.salary_structures (payroll_group_id);

CREATE INDEX idx_struct_line_struct_fk         ON hrms.salary_structure_lines (salary_structure_id);
CREATE INDEX idx_struct_line_comp_fk           ON hrms.salary_structure_lines (salary_component_id);

CREATE INDEX idx_payroll_run_group_fk          ON hrms.payroll_runs (payroll_group_id);
CREATE INDEX idx_payroll_run_status_fk         ON hrms.payroll_runs (payroll_status_id);

CREATE INDEX idx_payslip_run_fk                ON hrms.employee_payslips (payroll_run_id);
CREATE INDEX idx_payslip_employee_fk           ON hrms.employee_payslips (employee_id);

CREATE INDEX idx_goal_employee_fk              ON hrms.goals (employee_id);
CREATE INDEX idx_goal_cycle_fk                 ON hrms.goals (review_cycle_id);
CREATE INDEX idx_goal_status_fk                ON hrms.goals (goal_status_id);

CREATE INDEX idx_appraisal_employee_fk         ON hrms.appraisals (employee_id);
CREATE INDEX idx_appraisal_cycle_fk            ON hrms.appraisals (review_cycle_id);
CREATE INDEX idx_appraisal_mgr_rating_fk       ON hrms.appraisals (manager_rating_id);
CREATE INDEX idx_appraisal_calib_rating_fk     ON hrms.appraisals (calibrated_rating_id);

CREATE INDEX idx_job_req_dept_fk               ON hrms.job_requisitions (department_id);
CREATE INDEX idx_job_req_desig_fk              ON hrms.job_requisitions (designation_id);
CREATE INDEX idx_job_req_status_fk             ON hrms.job_requisitions (status_id);

CREATE INDEX idx_candidate_status_fk           ON hrms.candidates (candidate_status_id);

CREATE INDEX idx_app_requisition_fk            ON hrms.candidate_applications (job_requisition_id);
CREATE INDEX idx_app_candidate_fk              ON hrms.candidate_applications (candidate_id);

CREATE INDEX idx_interview_app_fk              ON hrms.interview_schedules (application_id);
CREATE INDEX idx_interview_emp_fk              ON hrms.interview_schedules (interviewer_employee_id);
CREATE INDEX idx_interview_status_fk           ON hrms.interview_schedules (status_id);

CREATE INDEX idx_session_program_fk            ON hrms.training_sessions (training_program_id);
CREATE INDEX idx_session_status_fk             ON hrms.training_sessions (status_id);

CREATE INDEX idx_enroll_session_fk             ON hrms.training_enrollments (training_session_id);
CREATE INDEX idx_enroll_employee_fk            ON hrms.training_enrollments (employee_id);

CREATE INDEX idx_asset_inv_category_fk         ON hrms.asset_inventories (asset_category_id);
CREATE INDEX idx_asset_inv_status_fk           ON hrms.asset_inventories (status_id);

CREATE INDEX idx_alloc_asset_fk                ON hrms.asset_allocations (asset_inventory_id);
CREATE INDEX idx_alloc_employee_fk             ON hrms.asset_allocations (employee_id);

CREATE INDEX idx_document_employee_fk          ON hrms.employee_documents (employee_id);
CREATE INDEX idx_document_type_fk              ON hrms.employee_documents (document_type_id);
CREATE INDEX idx_document_user_fk              ON hrms.employee_documents (verified_by_user_id);

CREATE INDEX idx_expense_employee_fk           ON hrms.expense_claims (employee_id);
CREATE INDEX idx_expense_status_fk             ON hrms.expense_claims (status_id);
CREATE INDEX idx_expense_user_fk               ON hrms.expense_claims (approved_by_user_id);
CREATE INDEX idx_expense_payslip_fk            ON hrms.expense_claims (settled_in_payslip_id);

CREATE INDEX idx_travel_employee_fk            ON hrms.travel_requests (employee_id);
CREATE INDEX idx_travel_status_fk              ON hrms.travel_requests (status_id);
CREATE INDEX idx_travel_user_fk                ON hrms.travel_requests (approved_by_user_id);

CREATE INDEX idx_sla_monitor_source_fk         ON hrms.hrms_sla_monitoring (source_document_id);

CREATE INDEX idx_haudit_user_fk                ON hrms.hrms_audit_event_timeline (performed_by_user_id);

-- v2.0 indexes
CREATE INDEX idx_emp_lh_rec_fk                 ON hrms.employment_lifecycle_history (employment_record_id);
CREATE INDEX idx_emp_lh_user_fk                ON hrms.employment_lifecycle_history (approved_by_user_id);

CREATE INDEX idx_sal_rev_emp_fk                ON hrms.salary_revision_history (employee_id);
CREATE INDEX idx_sal_rev_prev_fk               ON hrms.salary_revision_history (previous_salary_structure_id);
CREATE INDEX idx_sal_rev_new_fk                ON hrms.salary_revision_history (new_salary_structure_id);
CREATE INDEX idx_sal_rev_user_fk               ON hrms.salary_revision_history (approved_by_user_id);

CREATE INDEX idx_leave_bh_bal_fk               ON hrms.leave_balance_history (leave_balance_id);

CREATE INDEX idx_att_ch_corr_fk                ON hrms.attendance_correction_history (attendance_correction_id);
CREATE INDEX idx_att_ch_req_fk                 ON hrms.attendance_correction_history (requested_by_user_id);
CREATE INDEX idx_att_ch_app_fk                 ON hrms.attendance_correction_history (approved_by_user_id);

CREATE INDEX idx_pay_rh_run_fk                 ON hrms.payroll_run_history (payroll_run_id);
CREATE INDEX idx_pay_rh_user_fk                ON hrms.payroll_run_history (approved_by_user_id);

CREATE INDEX idx_perf_rh_app_fk                ON hrms.performance_review_history (appraisal_id);
CREATE INDEX idx_perf_rh_rev_fk                ON hrms.performance_review_history (reviewer_employee_id);
CREATE INDEX idx_perf_rh_prev_fk               ON hrms.performance_review_history (previous_rating_id);
CREATE INDEX idx_perf_rh_final_fk              ON hrms.performance_review_history (final_rating_id);

CREATE INDEX idx_rec_ph_app_fk                 ON hrms.recruitment_pipeline_history (application_id);
CREATE INDEX idx_rec_ph_user_fk                ON hrms.recruitment_pipeline_history (changed_by_user_id);

CREATE INDEX idx_train_ch_enroll_fk            ON hrms.training_completion_history (enrollment_id);

CREATE INDEX idx_asset_ah_inv_fk               ON hrms.asset_assignment_history (asset_inventory_id);
CREATE INDEX idx_asset_ah_emp_fk               ON hrms.asset_assignment_history (responsible_employee_id);

CREATE INDEX idx_emp_dh_doc_fk                 ON hrms.employee_document_history (employee_document_id);
CREATE INDEX idx_emp_dh_user_fk                ON hrms.employee_document_history (performed_by_user_id);

-- 13.2 Composite Indexes (Optimizing daily punch schedules & performance evaluation loops)
CREATE INDEX idx_attendance_date_emp           ON hrms.attendance_records (work_date, employee_id);
CREATE INDEX idx_salary_structure_comp         ON hrms.salary_structures (employee_id, effective_from_date);
CREATE INDEX idx_goals_evaluation_comp         ON hrms.goals (employee_id, review_cycle_id, goal_status_id);

-- 13.3 Partial Indexes (Optimizing active/hot records)
CREATE INDEX idx_attendance_unapproved_corr    ON hrms.attendance_corrections (attendance_record_id) WHERE approved_by_user_id IS NULL;
CREATE INDEX idx_leave_requests_pending        ON hrms.leave_requests (id) WHERE leave_status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80e1'; -- references SUBMITTED status ID
CREATE INDEX idx_claims_unsettled              ON hrms.expense_claims (id) WHERE settled_in_payslip_id IS NULL;
CREATE INDEX idx_sla_breached_hrms             ON hrms.hrms_sla_monitoring (source_document_id) WHERE is_breached = TRUE;
CREATE INDEX idx_documents_expired             ON hrms.employee_documents (id) WHERE expiry_date < CURRENT_DATE;
CREATE INDEX idx_assets_allocated_run          ON hrms.asset_inventories (id) WHERE status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80ea'; -- references ALLOCATED asset status ID
CREATE INDEX idx_training_incomplete_run       ON hrms.training_enrollments (id) WHERE is_completed = FALSE;
CREATE INDEX idx_recruitment_open_run          ON hrms.job_requisitions (id) WHERE status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80eb'; -- references OPEN status ID
CREATE INDEX idx_ess_travel_pending_run        ON hrms.travel_requests (id) WHERE status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80fa'; -- references PLANNED status ID
