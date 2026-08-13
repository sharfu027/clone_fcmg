-- =============================================================================
-- INK FMCG ENTERPRISE ERP — CUSTOMER RELATIONSHIP MANAGEMENT (CRM) SCHEMAS (v2.0 REFINED)
-- File Name      : crm_schema.sql
-- Target Database: PostgreSQL 16+
-- Schema Owner   : crm
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS crm;

-- =============================================================================
-- SECTION 1 — LOOKUP TABLES
-- =============================================================================

-- 1.1 Lead Sources
CREATE TABLE crm.lead_sources (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_lead_sources_code UNIQUE (code),
    CONSTRAINT chk_lead_sources_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.lead_sources IS 
    '[LOOKUP] Channels through which leads arrive: WEBSITE, REFERRAL, TRADE_SHOW, COLD_CALL.';

-- 1.2 Lead Statuses
CREATE TABLE crm.lead_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_lead_statuses_code UNIQUE (code),
    CONSTRAINT chk_lead_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.lead_statuses IS 
    '[LOOKUP] Lifecycle status of a lead: NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED.';

-- 1.3 Opportunity Stages
CREATE TABLE crm.opportunity_stages (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_opportunity_stages_code UNIQUE (code),
    CONSTRAINT chk_opportunity_stages_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.opportunity_stages IS 
    '[LOOKUP] Sales funnel stages: PROSPECTING, QUALIFICATION, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST.';

-- 1.4 Win/Loss Reasons
CREATE TABLE crm.win_loss_reasons (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_win_loss_reasons_code UNIQUE (code),
    CONSTRAINT chk_win_loss_reasons_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.win_loss_reasons IS 
    '[LOOKUP] Root causes for won/lost deals: PRICE, COMPETITOR_BRAND, SERVICE_LEVELS, NO_BUDGET.';

-- 1.5 Activity Types
CREATE TABLE crm.activity_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_activity_types_code UNIQUE (code),
    CONSTRAINT chk_activity_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.activity_types IS 
    '[LOOKUP] Activity categories: TASK, CALL, MEETING, EMAIL, CUSTOMER_VISIT.';

-- 1.6 Activity Statuses
CREATE TABLE crm.activity_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_activity_statuses_code UNIQUE (code),
    CONSTRAINT chk_activity_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.activity_statuses IS 
    '[LOOKUP] Schedule states for activities: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED.';

-- 1.7 Activity Outcomes
CREATE TABLE crm.activity_outcomes (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_activity_outcomes_code UNIQUE (code),
    CONSTRAINT chk_activity_outcomes_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.activity_outcomes IS 
    '[LOOKUP] Outcomes of activities: SALE_CONNECTED, NOT_INTERESTED, MEETING_RESCHEDULED.';

-- 1.8 Communication Channels
CREATE TABLE crm.communication_channels (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_comm_channels_code UNIQUE (code),
    CONSTRAINT chk_comm_channels_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.communication_channels IS 
    '[LOOKUP] Interaction formats: PHONE, EMAIL, SMS, WHATSAPP, PORTAL_MESSAGE, CHATBOT, VIDEO_MEETING, IN_PERSON_VISIT, VOICE_NOTE.';

-- 1.9 Quotation Statuses
CREATE TABLE crm.quotation_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_quotation_statuses_code UNIQUE (code),
    CONSTRAINT chk_quotation_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.quotation_statuses IS 
    '[LOOKUP] Review states for quotes: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED.';

-- 1.10 Campaign Statuses
CREATE TABLE crm.campaign_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_campaign_statuses_code UNIQUE (code),
    CONSTRAINT chk_campaign_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.campaign_statuses IS 
    '[LOOKUP] Progress states for marketing campaigns: PLANNED, ACTIVE, COMPLETED, CANCELLED.';

-- 1.11 Campaign Types
CREATE TABLE crm.campaign_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_campaign_types_code UNIQUE (code),
    CONSTRAINT chk_campaign_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.campaign_types IS 
    '[LOOKUP] Channels for campaigns: EMAIL, DIGITAL, EVENT, TELEMARKETING.';

-- 1.12 Case Priorities
CREATE TABLE crm.case_priorities (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_case_priorities_code UNIQUE (code),
    CONSTRAINT chk_case_priorities_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.case_priorities IS 
    '[LOOKUP] SLA priority weights: LOW, MEDIUM, HIGH, URGENT.';

-- 1.13 Case Statuses
CREATE TABLE crm.case_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_case_statuses_code UNIQUE (code),
    CONSTRAINT chk_case_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE crm.case_statuses IS 
    '[LOOKUP] Lifecycle status of support tickets: NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED.';

-- =============================================================================
-- SECTION 2 — LEAD MANAGEMENT
-- =============================================================================

CREATE TABLE crm.leads (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    first_name             VARCHAR(100),
    last_name              VARCHAR(100),
    company_name           VARCHAR(150),
    email                  VARCHAR(255),
    phone                  VARCHAR(50),
    lead_source_id         UUID          NOT NULL REFERENCES crm.lead_sources(id),
    lead_status_id         UUID          NOT NULL REFERENCES crm.lead_statuses(id),
    lead_score             INT           NOT NULL DEFAULT 0,
    
    assigned_employee_id   UUID          REFERENCES employee.employees(id) ON DELETE SET NULL,
    converted_customer_id  UUID          REFERENCES customer.customers(id) ON DELETE SET NULL, -- Target Master link
    conversion_date        DATE,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    is_deleted             BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT chk_lead_score CHECK (lead_score >= 0),
    CONSTRAINT chk_lead_conversion CHECK (
        (converted_customer_id IS NULL AND conversion_date IS NULL) OR 
        (converted_customer_id IS NOT NULL AND conversion_date IS NOT NULL)
    )
);

COMMENT ON TABLE crm.leads IS 
    '[OPERATIONAL] Lead capture table tracking source channels, qualification parameters, and conversions.';

-- =============================================================================
-- SECTION 3 — OPPORTUNITY PIPELINE
-- =============================================================================

CREATE TABLE crm.opportunities (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    opportunity_name       VARCHAR(150)  NOT NULL,
    customer_id            UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    stage_id               UUID          NOT NULL REFERENCES crm.opportunity_stages(id),
    probability_pct        NUMERIC(5,2)  NOT NULL CHECK (probability_pct BETWEEN 0.00 AND 100.00),
    forecast_amount        NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    expected_close_date    DATE          NOT NULL,
    
    assigned_employee_id   UUID          REFERENCES employee.employees(id) ON DELETE SET NULL,
    win_loss_reason_id     UUID          REFERENCES crm.win_loss_reasons(id) ON DELETE SET NULL,
    competitor_name        VARCHAR(150),

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    is_deleted             BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT chk_opp_forecast CHECK (forecast_amount >= 0.0000)
);

COMMENT ON TABLE crm.opportunities IS 
    '[OPERATIONAL] Sales pipeline deals tracking values, probabilities, and competitor bids.';

-- =============================================================================
-- SECTION 4 — ACTIVITIES & INTERACTION TIMELINES
-- =============================================================================

-- 4.1 Activity Management
CREATE TABLE crm.activities (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    activity_type_id       UUID          NOT NULL REFERENCES crm.activity_types(id),
    activity_status_id     UUID          NOT NULL REFERENCES crm.activity_statuses(id),
    subject                VARCHAR(255)  NOT NULL,
    description            TEXT,
    
    scheduled_start        TIMESTAMPTZ   NOT NULL,
    scheduled_end          TIMESTAMPTZ,
    
    assigned_employee_id   UUID          REFERENCES employee.employees(id) ON DELETE SET NULL,
    outcome_id             UUID          REFERENCES crm.activity_outcomes(id) ON DELETE SET NULL,
    
    lead_id                UUID          REFERENCES crm.leads(id) ON DELETE CASCADE,
    opportunity_id         UUID          REFERENCES crm.opportunities(id) ON DELETE CASCADE,
    customer_id            UUID          REFERENCES customer.customers(id) ON DELETE CASCADE,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_activity_times CHECK (scheduled_end IS NULL OR scheduled_end >= scheduled_start)
);

COMMENT ON TABLE crm.activities IS 
    '[OPERATIONAL] Tasks, calls, and meetings linked to leads, opportunities, or customers.';

-- 4.2 Customer Interaction Timeline (Extended with voice notes & attachments)
CREATE TABLE crm.customer_interactions (
    id                        UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id               UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    employee_id               UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,
    channel_id                UUID         NOT NULL REFERENCES crm.communication_channels(id),
    interaction_time          TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    notes                     TEXT         NOT NULL,
    attachment_reference_hook VARCHAR(255), -- Link to DMS
    voice_note_reference_hook VARCHAR(255)  -- Link to voice clip
);

COMMENT ON TABLE crm.customer_interactions IS 
    '[HISTORY] Compiled chronological communication log tracking emails, visits, chats, and voice notes.';

-- =============================================================================
-- SECTION 5 — CUSTOMER SERVICE & COMPLAINTS
-- =============================================================================

CREATE TABLE crm.service_cases (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    case_number            VARCHAR(50)   NOT NULL,
    customer_id            UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    priority_id            UUID          NOT NULL REFERENCES crm.case_priorities(id),
    status_id              UUID          NOT NULL REFERENCES crm.case_statuses(id),
    
    subject                VARCHAR(255)  NOT NULL,
    description            TEXT          NOT NULL,
    
    reported_at_utc        TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    sla_due_time           TIMESTAMPTZ   NOT NULL,
    
    assigned_employee_id   UUID          REFERENCES employee.employees(id) ON DELETE SET NULL,
    resolved_at_utc        TIMESTAMPTZ,
    resolution_details     TEXT,
    csat_score             INT,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_case_number UNIQUE (case_number),
    CONSTRAINT chk_csat CHECK (csat_score IS NULL OR (csat_score BETWEEN 1 AND 5)),
    CONSTRAINT chk_case_dates CHECK (resolved_at_utc IS NULL OR resolved_at_utc >= reported_at_utc)
);

COMMENT ON TABLE crm.service_cases IS 
    '[OPERATIONAL] Support tickets and customer complaints tracking resolution SLAs and CSAT scores.';

-- =============================================================================
-- SECTION 6 — VERSIONED QUOTATIONS
-- =============================================================================

-- 6.1 Quotation Headers
CREATE TABLE crm.quotations (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    quotation_number       VARCHAR(50)   NOT NULL,
    opportunity_id         UUID          REFERENCES crm.opportunities(id) ON DELETE SET NULL,
    customer_id            UUID          NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    version_number         INT           NOT NULL DEFAULT 1,
    expiry_date            DATE          NOT NULL,
    status_id              UUID          NOT NULL REFERENCES crm.quotation_statuses(id),
    total_amount           NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    
    approved_by_employee_id UUID          REFERENCES employee.employees(id) ON DELETE SET NULL,
    approved_at_utc        TIMESTAMPTZ,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_quotation_version UNIQUE (quotation_number, version_number),
    CONSTRAINT chk_quote_version CHECK (version_number >= 1),
    CONSTRAINT chk_quote_amount CHECK (total_amount >= 0.0000)
);

COMMENT ON TABLE crm.quotations IS 
    '[OPERATIONAL] Quotations containing pricing and expiry terms.';

-- 6.2 Quotation Line Items
CREATE TABLE crm.quotation_lines (
    id                  UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    quotation_id        UUID          NOT NULL REFERENCES crm.quotations(id) ON DELETE CASCADE,
    product_id          UUID          NOT NULL REFERENCES product.products(id),
    quantity            NUMERIC(18,4) NOT NULL,
    unit_price          NUMERIC(18,4) NOT NULL,
    line_total          NUMERIC(18,4) NOT NULL,

    CONSTRAINT chk_quote_line_qty CHECK (quantity > 0.0000),
    CONSTRAINT chk_quote_line_price CHECK (unit_price >= 0.0000)
);

COMMENT ON TABLE crm.quotation_lines IS 
    '[OPERATIONAL] Item lines mapped to quotation versions.';

-- =============================================================================
-- SECTION 7 — CAMPAIGNS & ROI
-- =============================================================================

-- 7.1 Campaigns
CREATE TABLE crm.campaigns (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    campaign_name          VARCHAR(150)  NOT NULL,
    campaign_type_id       UUID          NOT NULL REFERENCES crm.campaign_types(id),
    campaign_status_id     UUID          NOT NULL REFERENCES crm.campaign_statuses(id),
    
    start_date             DATE          NOT NULL,
    end_date               DATE          NOT NULL,
    budgeted_cost          NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
    actual_cost            NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
    expected_revenue       NUMERIC(18,4) NOT NULL DEFAULT 0.0000,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_campaign_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_campaign_budget CHECK (budgeted_cost >= 0.0000),
    CONSTRAINT chk_campaign_actual CHECK (actual_cost >= 0.0000),
    CONSTRAINT chk_campaign_rev CHECK (expected_revenue >= 0.0000)
);

COMMENT ON TABLE crm.campaigns IS 
    '[OPERATIONAL] Marketing campaign definitions tracking costs and revenue forecasts.';

-- 7.2 Campaign Members (Segment Target Group)
CREATE TABLE crm.campaign_members (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    campaign_id        UUID          NOT NULL REFERENCES crm.campaigns(id) ON DELETE CASCADE,
    lead_id            UUID          REFERENCES crm.leads(id) ON DELETE CASCADE,
    customer_id        UUID          REFERENCES customer.customers(id) ON DELETE CASCADE,
    response_status    VARCHAR(50),  -- RESPONDED, INTERESTED, NOT_INTERESTED

    CONSTRAINT uq_campaign_member UNIQUE (campaign_id, lead_id, customer_id),
    CONSTRAINT chk_member_excl CHECK (
        (lead_id IS NOT NULL AND customer_id IS NULL) OR 
        (customer_id IS NOT NULL AND lead_id IS NULL)
    )
);

COMMENT ON TABLE crm.campaign_members IS 
    '[OPERATIONAL] Target lists linking campaign headers to either leads or customers.';

-- =============================================================================
-- SECTION 8 — CUSTOMER INTELLIGENCE & MARKETING CONSENT
-- =============================================================================

CREATE TABLE crm.customer_intelligence (
    id                        UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id               UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    segmentation_category     VARCHAR(50), -- A_CLASS, B_CLASS, C_CLASS
    buying_interests          JSONB,       -- List of product categories of interest
    communication_preferences VARCHAR(100), -- EMAIL, PHONE, SMS
    marketing_consent_granted  BOOLEAN      NOT NULL DEFAULT FALSE,
    interaction_score         INT          NOT NULL DEFAULT 0,

    CONSTRAINT uq_cust_intel UNIQUE (customer_id),
    CONSTRAINT chk_cust_intel_score CHECK (interaction_score >= 0)
);

COMMENT ON TABLE crm.customer_intelligence IS 
    '[FOUNDATION] Customer profiles, buying interests, and marketing opt-ins.';

-- =============================================================================
-- SECTION 9 — ANALYTICS SNAPSHOTS (REFINED)
-- =============================================================================

CREATE TABLE crm.crm_snapshots (
    id                      UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    recorded_date           DATE          NOT NULL DEFAULT CURRENT_DATE,
    
    total_open_leads        INT           NOT NULL DEFAULT 0,
    pipeline_amount         NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    won_opportunities_count  INT           NOT NULL DEFAULT 0,
    closed_cases_count      INT           NOT NULL DEFAULT 0,
    campaign_roi_pct        NUMERIC(5,2),
    
    calculation_version     INT           NOT NULL DEFAULT 1,
    aggregation_period      VARCHAR(50)   NOT NULL DEFAULT 'DAILY', -- DAILY, WEEKLY, MONTHLY
    calculation_source      VARCHAR(100)  NOT NULL DEFAULT 'SYSTEM_BATCH',
    execution_timestamp     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    created_at_utc          TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_crm_snapshot UNIQUE (recorded_date, calculation_version),
    CONSTRAINT chk_crm_snap_calc_ver CHECK (calculation_version >= 1),
    CONSTRAINT chk_crm_snap_period CHECK (aggregation_period IN ('DAILY', 'WEEKLY', 'MONTHLY'))
);

COMMENT ON TABLE crm.crm_snapshots IS 
    '[HISTORY] Daily logs tracking pipeline values, active cases, and ROI metrics.';

-- =============================================================================
-- SECTION 10 — TIMELINES & ASSIGNMENT AUDITING (v2.0 ADDITIONS)
-- =============================================================================

-- 10.1 Opportunity Stage Transitions (Immutable Lifecycle history)
CREATE TABLE crm.opportunity_lifecycle_history (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    opportunity_id       UUID         NOT NULL REFERENCES crm.opportunities(id) ON DELETE CASCADE,
    stage_id             UUID         NOT NULL REFERENCES crm.opportunity_stages(id) ON DELETE CASCADE,
    effective_from       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    effective_to         TIMESTAMPTZ,
    changed_by_user_id   UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    comments             TEXT,

    CONSTRAINT chk_opp_lifecycle_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE crm.opportunity_lifecycle_history IS 
    '[HISTORY] Transition details auditing pipeline velocity and stage times.';

-- 10.2 Lead Assignment History
CREATE TABLE crm.lead_assignment_history (
    id                         UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    lead_id                    UUID         NOT NULL REFERENCES crm.leads(id) ON DELETE CASCADE,
    previous_owner_employee_id UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,
    new_owner_employee_id      UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,
    assignment_reason          TEXT,
    assignment_timestamp       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    approved_by_user_id        UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    assignment_source          VARCHAR(100) NOT NULL DEFAULT 'MANUAL' -- MANUAL, AI_ROUTING, ROUND_ROBIN
);

COMMENT ON TABLE crm.lead_assignment_history IS 
    '[HISTORY] Detailed audits mapping lead delegations, ownership swaps, and routing triggers.';

-- 10.3 Campaign Performance & ROI History
CREATE TABLE crm.campaign_performance_history (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    campaign_id            UUID          NOT NULL REFERENCES crm.campaigns(id) ON DELETE CASCADE,
    snapshot_date          DATE          NOT NULL DEFAULT CURRENT_DATE,
    
    budgeted_cost          NUMERIC(12,4) NOT NULL,
    actual_cost            NUMERIC(12,4) NOT NULL,
    response_count         INT           NOT NULL DEFAULT 0,
    conversion_rate_pct    NUMERIC(5,2),
    roi_pct                NUMERIC(5,2),
    
    calculation_timestamp  TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_camp_perf_cost CHECK (budgeted_cost >= 0.0000 AND actual_cost >= 0.0000),
    CONSTRAINT chk_camp_perf_responses CHECK (response_count >= 0)
);

COMMENT ON TABLE crm.campaign_performance_history IS 
    '[HISTORY] Performance metrics tracking cost revisions and returns on investment.';

-- 10.4 Quotation Approval History (Multi-level approvals)
CREATE TABLE crm.quotation_approval_history (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    quotation_id           UUID         NOT NULL REFERENCES crm.quotations(id) ON DELETE CASCADE,
    approval_level         INT          NOT NULL,
    approver_employee_id   UUID         NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    decision               VARCHAR(20)  NOT NULL, -- APPROVED, REJECTED, DELEGATED
    comments               TEXT,
    decision_timestamp     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    workflow_stage         VARCHAR(50)  NOT NULL,

    CONSTRAINT chk_qapprove_level CHECK (approval_level >= 1),
    CONSTRAINT chk_qapprove_decision CHECK (decision IN ('APPROVED', 'REJECTED', 'DELEGATED'))
);

COMMENT ON TABLE crm.quotation_approval_history IS 
    '[HISTORY] Quotation workflow logs tracking supervisor approvals.';

-- 10.5 Service Case Lifecycle History (Escalations)
CREATE TABLE crm.service_case_lifecycle_history (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    service_case_id        UUID         NOT NULL REFERENCES crm.service_cases(id) ON DELETE CASCADE,
    status_id              UUID         NOT NULL REFERENCES crm.case_statuses(id) ON DELETE CASCADE,
    effective_from         TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    effective_to           TIMESTAMPTZ,
    comments               TEXT,
    changed_by_user_id     UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_case_lifecycle_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE crm.service_case_lifecycle_history IS 
    '[HISTORY] Detailed transition timeline tracking case reviews and escalations.';

-- 10.6 Customer Satisfaction History (CSAT surveys)
CREATE TABLE crm.customer_satisfaction_history (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id            UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    service_case_id        UUID         REFERENCES crm.service_cases(id) ON DELETE SET NULL,
    survey_name            VARCHAR(150) NOT NULL,
    rating                 INT          NOT NULL,
    feedback               TEXT,
    response_date          DATE         NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT chk_csat_hist CHECK (rating BETWEEN 1 AND 5)
);

COMMENT ON TABLE crm.customer_satisfaction_history IS 
    '[HISTORY] Survey result records tracking customer feedback and ticket metrics.';

-- 10.7 CRM Audit Event Timeline
CREATE TABLE crm.crm_audit_event_timeline (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    event_type           VARCHAR(100) NOT NULL, -- LEAD_CREATED, OPPORTUNITY_UPDATED, QUOTATION_APPROVED, CAMPAIGN_LAUNCHED, CAMPAIGN_CLOSED, COMPLAINT_ESCALATED, SERVICE_CASE_CLOSED, PREFERENCE_UPDATED, CONSENT_UPDATED
    source_document_type VARCHAR(50)  NOT NULL, -- LEAD, OPPORTUNITY, QUOTATION, CAMPAIGN, CASE, INTELLIGENCE
    source_document_id   UUID         NOT NULL,
    event_timestamp      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    performed_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    payload              JSONB,

    created_at_utc       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE crm.crm_audit_event_timeline IS 
    '[HISTORY] Immutable master audit timeline logging lead conversions and consent approvals.';

-- 10.8 CRM SLA Monitoring
CREATE TABLE crm.crm_sla_monitoring (
    id                      UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sla_type                VARCHAR(50)  NOT NULL, -- LEAD_RESPONSE, OPP_FOLLOWUP, QUOTE_APPROVAL, COMPLAINT_RESOLUTION, SERVICE_REQUEST
    source_document_id      UUID         NOT NULL,
    target_duration_minutes INT          NOT NULL,
    actual_duration_minutes INT,
    is_breached             BOOLEAN      GENERATED ALWAYS AS (actual_duration_minutes > target_duration_minutes) STORED,
    breach_reason           TEXT,
    created_at_utc          TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_crm_sla_target CHECK (target_duration_minutes > 0),
    CONSTRAINT chk_crm_sla_actual CHECK (actual_duration_minutes IS NULL OR actual_duration_minutes >= 0),
    CONSTRAINT chk_crm_sla_type CHECK (sla_type IN ('LEAD_RESPONSE', 'OPP_FOLLOWUP', 'QUOTE_APPROVAL', 'COMPLAINT_RESOLUTION', 'SERVICE_REQUEST'))
);

COMMENT ON TABLE crm.crm_sla_monitoring IS 
    '[OPERATIONAL] Timers checking response delays against target SLA rules.';

-- =============================================================================
-- SECTION 11 — INDEX STRATEGY (B-TREE FOREIGNS & COMPOSITE COVERING)
-- =============================================================================

-- 11.1 B-Tree Indexes on all Foreign Keys
CREATE INDEX idx_lead_source_fk                ON crm.leads (lead_source_id);
CREATE INDEX idx_lead_status_fk                ON crm.leads (lead_status_id);
CREATE INDEX idx_lead_employee_fk              ON crm.leads (assigned_employee_id);
CREATE INDEX idx_lead_customer_fk              ON crm.leads (converted_customer_id);

CREATE INDEX idx_opportunity_customer_fk       ON crm.opportunities (customer_id);
CREATE INDEX idx_opportunity_stage_fk          ON crm.opportunities (stage_id);
CREATE INDEX idx_opportunity_employee_fk        ON crm.opportunities (assigned_employee_id);
CREATE INDEX idx_opportunity_reason_fk         ON crm.opportunities (win_loss_reason_id);

CREATE INDEX idx_activity_type_fk              ON crm.activities (activity_type_id);
CREATE INDEX idx_activity_status_fk            ON crm.activities (activity_status_id);
CREATE INDEX idx_activity_employee_fk          ON crm.activities (assigned_employee_id);
CREATE INDEX idx_activity_outcome_fk           ON crm.activities (outcome_id);
CREATE INDEX idx_activity_lead_fk              ON crm.activities (lead_id);
CREATE INDEX idx_activity_opportunity_fk       ON crm.activities (opportunity_id);
CREATE INDEX idx_activity_customer_fk          ON crm.activities (customer_id);

CREATE INDEX idx_interact_customer_fk          ON crm.customer_interactions (customer_id);
CREATE INDEX idx_interact_employee_fk          ON crm.customer_interactions (employee_id);
CREATE INDEX idx_interact_channel_fk           ON crm.customer_interactions (channel_id);

CREATE INDEX idx_case_customer_fk              ON crm.service_cases (customer_id);
CREATE INDEX idx_case_priority_fk              ON crm.service_cases (priority_id);
CREATE INDEX idx_case_status_fk                ON crm.service_cases (status_id);
CREATE INDEX idx_case_employee_fk              ON crm.service_cases (assigned_employee_id);

CREATE INDEX idx_quotation_opportunity_fk       ON crm.quotations (opportunity_id);
CREATE INDEX idx_quotation_customer_fk          ON crm.quotations (customer_id);
CREATE INDEX idx_quotation_status_fk            ON crm.quotations (status_id);
CREATE INDEX idx_quotation_employee_fk          ON crm.quotations (approved_by_employee_id);

CREATE INDEX idx_quoteline_quote_fk            ON crm.quotation_lines (quotation_id);
CREATE INDEX idx_quoteline_product_fk          ON crm.quotation_lines (product_id);

CREATE INDEX idx_campaign_type_fk              ON crm.campaigns (campaign_type_id);
CREATE INDEX idx_campaign_status_fk            ON crm.campaigns (campaign_status_id);

CREATE INDEX idx_member_campaign_fk            ON crm.campaign_members (campaign_id);
CREATE INDEX idx_member_lead_fk                ON crm.campaign_members (lead_id);
CREATE INDEX idx_member_customer_fk            ON crm.campaign_members (customer_id);

CREATE INDEX idx_intel_customer_fk             ON crm.customer_intelligence (customer_id);

-- v2.0 Indexes
CREATE INDEX idx_opp_lh_opp_fk                 ON crm.opportunity_lifecycle_history (opportunity_id);
CREATE INDEX idx_opp_lh_stage_fk               ON crm.opportunity_lifecycle_history (stage_id);
CREATE INDEX idx_opp_lh_user_fk                ON crm.opportunity_lifecycle_history (changed_by_user_id);

CREATE INDEX idx_lead_ah_lead_fk               ON crm.lead_assignment_history (lead_id);
CREATE INDEX idx_lead_ah_prev_fk               ON crm.lead_assignment_history (previous_owner_employee_id);
CREATE INDEX idx_lead_ah_new_fk                ON crm.lead_assignment_history (new_owner_employee_id);
CREATE INDEX idx_lead_ah_user_fk               ON crm.lead_assignment_history (approved_by_user_id);

CREATE INDEX idx_camp_ph_campaign_fk           ON crm.campaign_performance_history (campaign_id);

CREATE INDEX idx_qapprove_h_quote_fk           ON crm.quotation_approval_history (quotation_id);
CREATE INDEX idx_qapprove_h_emp_fk             ON crm.quotation_approval_history (approver_employee_id);

CREATE INDEX idx_case_lh_case_fk               ON crm.service_case_lifecycle_history (service_case_id);
CREATE INDEX idx_case_lh_status_fk             ON crm.service_case_lifecycle_history (status_id);
CREATE INDEX idx_case_lh_user_fk               ON crm.service_case_lifecycle_history (changed_by_user_id);

CREATE INDEX idx_csat_h_customer_fk            ON crm.customer_satisfaction_history (customer_id);
CREATE INDEX idx_csat_h_case_fk                ON crm.customer_satisfaction_history (service_case_id);

CREATE INDEX idx_caudit_user_fk                ON crm.crm_audit_event_timeline (performed_by_user_id);

CREATE INDEX idx_sla_monitor_fk                ON crm.crm_sla_monitoring (source_document_id);

-- 11.2 Composite Indexes (Covering common CRM pipeline queries)
CREATE INDEX idx_opportunity_pipeline_comp     ON crm.opportunities (stage_id, expected_close_date, forecast_amount);
CREATE INDEX idx_activities_schedule_comp      ON crm.activities (assigned_employee_id, scheduled_start, activity_status_id);
CREATE INDEX idx_cases_sla_comp                ON crm.service_cases (status_id, priority_id, sla_due_time);

-- 11.3 Partial Indexes (Optimizing active/hot records)
CREATE INDEX idx_leads_active                 ON crm.leads (id) WHERE lead_status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80e6'; -- references NEW status ID
CREATE INDEX idx_opportunities_open            ON crm.opportunities (id) WHERE stage_id NOT IN ('c1251910-1849-43c2-bf72-4d2cf99a80e7', 'c1251910-1849-43c2-bf72-4d2cf99a80e8'); -- references WON/LOST IDs
CREATE INDEX idx_cases_open                    ON crm.service_cases (id) WHERE status_id != 'c1251910-1849-43c2-bf72-4d2cf99a80e9'; -- references CLOSED status ID
CREATE INDEX idx_quotes_active                 ON crm.quotations (id) WHERE status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80fa'; -- references SENT status ID
CREATE INDEX idx_sla_breached_crm              ON crm.crm_sla_monitoring (source_document_id) WHERE is_breached = TRUE;
CREATE INDEX idx_csat_low_ratings              ON crm.customer_satisfaction_history (customer_id) WHERE rating <= 2;
CREATE INDEX idx_campaign_active_runs          ON crm.campaigns (id) WHERE campaign_status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80fb'; -- references ACTIVE campaign status ID
