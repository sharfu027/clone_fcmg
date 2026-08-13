-- =============================================================================
-- INK FMCG ENTERPRISE ERP — ENTERPRISE REPORTING & ANALYTICS SCHEMAS (v2.0 REFINED)
-- File Name      : reports_schema.sql
-- Target Database: PostgreSQL 17+
-- Schema Owner   : reports / bi
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS reports;
CREATE SCHEMA IF NOT EXISTS bi;

-- =============================================================================
-- SECTION 1 — LOOKUP TABLES
-- =============================================================================

-- 1.1 KPI Categories
CREATE TABLE reports.kpi_categories (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_kpi_categories_code UNIQUE (code),
    CONSTRAINT chk_kpi_categories_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE reports.kpi_categories IS '[LOOKUP] Functional KPI groups: FINANCE, SALES, PROCUREMENT, INVENTORY, LOGISTICS.';

-- 1.2 Widget Types
CREATE TABLE reports.widget_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_widget_types_code UNIQUE (code),
    CONSTRAINT chk_widget_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE reports.widget_types IS '[LOOKUP] Visual widget blocks: BAR_CHART, LINE_CHART, STAT_CARD, DATA_GRID.';

-- 1.3 Report Formats
CREATE TABLE reports.report_formats (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_report_formats_code UNIQUE (code),
    CONSTRAINT chk_report_formats_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE reports.report_formats IS '[LOOKUP] Document export extensions: PDF, XLSX, CSV, JSON.';

-- 1.4 Forecast Algorithms
CREATE TABLE reports.forecast_algorithms (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_forecast_algorithms_code UNIQUE (code),
    CONSTRAINT chk_forecast_algorithms_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE reports.forecast_algorithms IS '[LOOKUP] AI and statistical calculation frameworks: ARIMA, PROPHET, LSTM.';

-- =============================================================================
-- SECTION 2 — KPI DEFINITIONS & TARGETS
-- =============================================================================

CREATE TABLE reports.kpi_definitions (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    kpi_code               VARCHAR(50)   NOT NULL,
    kpi_name               VARCHAR(150)  NOT NULL,
    category_id            UUID          NOT NULL REFERENCES reports.kpi_categories(id),
    formula_sql            TEXT          NOT NULL,
    owner_employee_id      UUID          REFERENCES employee.employees(id) ON DELETE SET NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    is_deleted             BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_kpi_code UNIQUE (kpi_code),
    CONSTRAINT chk_kpi_code_upper CHECK (kpi_code = upper(kpi_code))
);

COMMENT ON TABLE reports.kpi_definitions IS '[FOUNDATION] Definitions of organizational key indicators and target metrics.';

CREATE TABLE reports.kpi_targets (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    kpi_id                 UUID          NOT NULL REFERENCES reports.kpi_definitions(id) ON DELETE CASCADE,
    fiscal_year            INT           NOT NULL,
    target_value           NUMERIC(18,4) NOT NULL,
    warning_threshold      NUMERIC(18,4) NOT NULL,
    critical_threshold     NUMERIC(18,4) NOT NULL,

    CONSTRAINT uq_kpi_target_year UNIQUE (kpi_id, fiscal_year),
    CONSTRAINT chk_target_thresholds CHECK (warning_threshold <= target_value AND critical_threshold <= warning_threshold)
);

COMMENT ON TABLE reports.kpi_targets IS '[OPERATIONAL] Year targets and warning thresholds mapped per KPI.';

-- =============================================================================
-- SECTION 3 — DASHBOARDS & LAYOUTS
-- =============================================================================

CREATE TABLE reports.dashboards (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    title                  VARCHAR(150)  NOT NULL,
    owner_employee_id      UUID          REFERENCES employee.employees(id) ON DELETE SET NULL,
    is_public              BOOLEAN       NOT NULL DEFAULT TRUE,
    company_id             UUID          REFERENCES organization.companies(id) ON DELETE SET NULL,
    branch_id              UUID          REFERENCES organization.branches(id) ON DELETE SET NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    is_deleted             BOOLEAN       NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE reports.dashboards IS '[OPERATIONAL] Dashboard layouts configured for branches and managers.';

CREATE TABLE reports.dashboard_widgets (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    dashboard_id           UUID          NOT NULL REFERENCES reports.dashboards(id) ON DELETE CASCADE,
    widget_title           VARCHAR(150)  NOT NULL,
    widget_type_id         UUID          NOT NULL REFERENCES reports.widget_types(id),
    
    -- Layout Pos coordinates
    position_x             INT           NOT NULL,
    position_y             INT           NOT NULL,
    position_w             INT           NOT NULL,
    position_h             INT           NOT NULL,
    query_config_json      JSONB         NOT NULL,

    CONSTRAINT chk_widget_layout CHECK (position_x >= 0 AND position_y >= 0 AND position_w > 0 AND position_h > 0)
);

COMMENT ON TABLE reports.dashboard_widgets IS '[OPERATIONAL] Grid alignment positions and configurations for UI widgets.';

-- =============================================================================
-- SECTION 4 — REPORTS & SUBSCRIPTIONS
-- =============================================================================

CREATE TABLE reports.report_definitions (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    report_code            VARCHAR(50)   NOT NULL,
    report_name            VARCHAR(150)  NOT NULL,
    query_template_sql     TEXT          NOT NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    is_deleted             BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_report_code UNIQUE (report_code),
    CONSTRAINT chk_report_code_upper CHECK (report_code = upper(report_code))
);

COMMENT ON TABLE reports.report_definitions IS '[FOUNDATION] Standard queries and report formats.';

CREATE TABLE reports.report_schedules (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    report_id              UUID          NOT NULL REFERENCES reports.report_definitions(id) ON DELETE CASCADE,
    cron_expression        VARCHAR(100)  NOT NULL,
    report_format_id       UUID          NOT NULL REFERENCES reports.report_formats(id),
    recipient_email_list   TEXT          NOT NULL,
    is_active              BOOLEAN       NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE reports.report_schedules IS '[OPERATIONAL] Automations scheduled to compile and email reports.';

CREATE TABLE reports.report_execution_history (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    report_id              UUID          NOT NULL REFERENCES reports.report_definitions(id) ON DELETE CASCADE,
    executed_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    executed_at_utc        TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    execution_duration_ms  INT           NOT NULL,
    status                 VARCHAR(50)   NOT NULL, -- SUCCESS, FAILED
    output_reference_hook  VARCHAR(255),
    failure_message        TEXT,

    CONSTRAINT chk_exec_duration CHECK (execution_duration_ms >= 0)
);

COMMENT ON TABLE reports.report_execution_history IS '[HISTORY] Audit trail of all completed report compilations.';

-- =============================================================================
-- SECTION 5 — DATA WAREHOUSE DIMENSIONS (bi SCHEMA)
-- =============================================================================

-- 5.1 Date Dimension (Pre-populated calendar lookup)
CREATE TABLE bi.dim_date (
    date_key               INT           PRIMARY KEY, -- Format YYYYMMDD
    full_date              DATE          NOT NULL,
    day_name               VARCHAR(15)   NOT NULL,
    day_of_month           INT           NOT NULL,
    day_of_week            INT           NOT NULL,
    calendar_month_name    VARCHAR(15)   NOT NULL,
    calendar_month_number  INT           NOT NULL,
    calendar_quarter       INT           NOT NULL,
    calendar_year          INT           NOT NULL,
    fiscal_year            INT           NOT NULL,
    fiscal_quarter         INT           NOT NULL,
    fiscal_period          INT           NOT NULL,
    is_weekend             BOOLEAN       NOT NULL DEFAULT FALSE,
    is_holiday             BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_dim_date UNIQUE (full_date),
    CONSTRAINT chk_day_of_month CHECK (day_of_month BETWEEN 1 AND 31),
    CONSTRAINT chk_day_of_week CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT chk_calendar_month CHECK (calendar_month_number BETWEEN 1 AND 12),
    CONSTRAINT chk_calendar_quarter CHECK (calendar_quarter BETWEEN 1 AND 4),
    CONSTRAINT chk_fiscal_quarter CHECK (fiscal_quarter BETWEEN 1 AND 4),
    CONSTRAINT chk_fiscal_period CHECK (fiscal_period BETWEEN 1 AND 13)
);

COMMENT ON TABLE bi.dim_date IS '[DIMENSION] Pre-populated date dimension for historical reporting.';

-- 5.2 Organization Dimension (Consolidated structure)
CREATE TABLE bi.dim_organization (
    organization_key       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id             UUID          NOT NULL REFERENCES organization.companies(id),
    company_name           VARCHAR(150)  NOT NULL,
    branch_id              UUID          NOT NULL REFERENCES organization.branches(id),
    branch_name            VARCHAR(150)  NOT NULL,
    department_id          UUID          NOT NULL REFERENCES organization.departments(id),
    department_name        VARCHAR(150)  NOT NULL,

    CONSTRAINT uq_dim_org UNIQUE (company_id, branch_id, department_id)
);

COMMENT ON TABLE bi.dim_organization IS '[DIMENSION] Consolidated corporate structures mapping branches and departments.';

-- 5.3 Product Dimension
CREATE TABLE bi.dim_product (
    product_key            UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id             UUID          NOT NULL REFERENCES product.products(id),
    product_code           VARCHAR(100)  NOT NULL,
    product_name           VARCHAR(255)  NOT NULL,
    category_name          VARCHAR(150)  NOT NULL,
    brand_name             VARCHAR(150)  NOT NULL,
    sku_unit               VARCHAR(50)   NOT NULL
);

COMMENT ON TABLE bi.dim_product IS '[DIMENSION] Product classification dimensions.';

-- 5.4 Customer Dimension
CREATE TABLE bi.dim_customer (
    customer_key           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id            UUID          NOT NULL REFERENCES customer.customers(id),
    customer_code          VARCHAR(100)  NOT NULL,
    customer_name          VARCHAR(255)  NOT NULL,
    segment_category       VARCHAR(50),
    region_name            VARCHAR(150)
);

COMMENT ON TABLE bi.dim_customer IS '[DIMENSION] Customer segment dimensions.';

-- 5.5 Supplier Dimension
CREATE TABLE bi.dim_supplier (
    supplier_key           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    supplier_id            UUID          NOT NULL REFERENCES supplier.suppliers(id),
    supplier_code          VARCHAR(100)  NOT NULL,
    supplier_name          VARCHAR(255)  NOT NULL,
    compliance_status      VARCHAR(100)
);

COMMENT ON TABLE bi.dim_supplier IS '[DIMENSION] Supplier details.';

-- =============================================================================
-- SECTION 6 — DATA WAREHOUSE FACTS (bi SCHEMA)
-- =============================================================================

-- 6.1 Sales Order Fact Table
CREATE TABLE bi.fact_sales_orders (
    id                     UUID          DEFAULT iam.uuid_generate_v7(),
    date_key               INT           NOT NULL REFERENCES bi.dim_date(date_key),
    organization_key       UUID          NOT NULL REFERENCES bi.dim_organization(organization_key),
    product_key            UUID          NOT NULL REFERENCES bi.dim_product(product_key),
    customer_key           UUID          NOT NULL REFERENCES bi.dim_customer(customer_key),
    sales_order_id         UUID          NOT NULL,
    quantity_ordered       NUMERIC(18,4) NOT NULL,
    gross_amount           NUMERIC(18,4) NOT NULL,
    discount_amount        NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    tax_amount             NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    net_amount             NUMERIC(18,4) NOT NULL,

    -- v2.0 Snapshot Extensions
    snapshot_version       INT           NOT NULL DEFAULT 1,
    aggregation_period     VARCHAR(50)   NOT NULL DEFAULT 'DAILY',
    calculation_version    INT           NOT NULL DEFAULT 1,
    source_system_version  VARCHAR(50)   NOT NULL DEFAULT 'v1.0',
    execution_timestamp    TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_sales_qty CHECK (quantity_ordered > 0.0000),
    CONSTRAINT chk_sales_gross CHECK (gross_amount >= 0.0000),
    CONSTRAINT chk_sales_net CHECK (net_amount = (gross_amount - discount_amount + tax_amount))
) PARTITION BY RANGE (date_key);

COMMENT ON TABLE bi.fact_sales_orders IS '[FACT] Transaction log tracking sales orders and quantities.';

-- 6.2 Procurement Fact Table
CREATE TABLE bi.fact_procurement_purchases (
    id                     UUID          DEFAULT iam.uuid_generate_v7(),
    date_key               INT           NOT NULL REFERENCES bi.dim_date(date_key),
    organization_key       UUID          NOT NULL REFERENCES bi.dim_organization(organization_key),
    product_key            UUID          NOT NULL REFERENCES bi.dim_product(product_key),
    supplier_key           UUID          NOT NULL REFERENCES bi.dim_supplier(supplier_key),
    purchase_order_id      UUID          NOT NULL,
    quantity_ordered       NUMERIC(18,4) NOT NULL,
    net_amount             NUMERIC(18,4) NOT NULL,

    -- v2.0 Snapshot Extensions
    snapshot_version       INT           NOT NULL DEFAULT 1,
    aggregation_period     VARCHAR(50)   NOT NULL DEFAULT 'DAILY',
    calculation_version    INT           NOT NULL DEFAULT 1,
    source_system_version  VARCHAR(50)   NOT NULL DEFAULT 'v1.0',
    execution_timestamp    TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_proc_qty CHECK (quantity_ordered > 0.0000),
    CONSTRAINT chk_proc_net CHECK (net_amount >= 0.0000)
) PARTITION BY RANGE (date_key);

COMMENT ON TABLE bi.fact_procurement_purchases IS '[FACT] Purchase requisition and order ledger transactions.';

-- 6.3 Daily Inventory Snapshots (Aggregate Table)
CREATE TABLE bi.fact_daily_inventory_snapshots (
    id                     UUID          DEFAULT iam.uuid_generate_v7(),
    date_key               INT           NOT NULL REFERENCES bi.dim_date(date_key),
    product_key            UUID          NOT NULL REFERENCES bi.dim_product(product_key),
    stock_on_hand          NUMERIC(18,4) NOT NULL,
    valuation_amount       NUMERIC(18,4) NOT NULL,

    -- v2.0 Snapshot Extensions
    snapshot_version       INT           NOT NULL DEFAULT 1,
    aggregation_period     VARCHAR(50)   NOT NULL DEFAULT 'DAILY',
    calculation_version    INT           NOT NULL DEFAULT 1,
    source_system_version  VARCHAR(50)   NOT NULL DEFAULT 'v1.0',
    execution_timestamp    TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_snap_stock CHECK (stock_on_hand >= 0.0000),
    CONSTRAINT chk_snap_val CHECK (valuation_amount >= 0.0000)
) PARTITION BY RANGE (date_key);

COMMENT ON TABLE bi.fact_daily_inventory_snapshots IS '[FACT/SNAPSHOT] Daily stock level snapshot records.';

-- =============================================================================
-- SECTION 7 — FORECASTING
-- =============================================================================

CREATE TABLE bi.forecast_models (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    model_name             VARCHAR(150)  NOT NULL,
    algorithm_id           UUID          NOT NULL REFERENCES reports.forecast_algorithms(id),
    target_kpi_id          UUID          NOT NULL REFERENCES reports.kpi_definitions(id),
    training_parameters    JSONB         NOT NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE bi.forecast_models IS '[FOUNDATION] Model configurations mapping KPIs to training parameters.';

CREATE TABLE bi.forecast_runs (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    model_id               UUID          NOT NULL REFERENCES bi.forecast_models(id) ON DELETE CASCADE,
    execution_time         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    variance_pct           NUMERIC(5,2),
    run_status             VARCHAR(50)   NOT NULL -- SUCCESS, FAILED
);

COMMENT ON TABLE bi.forecast_runs IS '[OPERATIONAL] Execution log tracking forecast runs and variances.';

CREATE TABLE bi.forecast_results (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    run_id                 UUID          NOT NULL REFERENCES bi.forecast_runs(id) ON DELETE CASCADE,
    forecast_date          DATE          NOT NULL,
    predicted_value        NUMERIC(18,4) NOT NULL,
    confidence_interval_min NUMERIC(18,4) NOT NULL,
    confidence_interval_max NUMERIC(18,4) NOT NULL,

    CONSTRAINT chk_forecast_confidence CHECK (confidence_interval_max >= confidence_interval_min)
);

COMMENT ON TABLE bi.forecast_results IS '[HISTORY] Predicted KPI data values generated by forecasting runs.';

-- =============================================================================
-- SECTION 8 — BENCHMARKING & AUDITS
-- =============================================================================

CREATE TABLE bi.benchmarks (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    benchmark_name         VARCHAR(150)  NOT NULL,
    kpi_id                 UUID          NOT NULL REFERENCES reports.kpi_definitions(id) ON DELETE CASCADE,
    benchmark_value        NUMERIC(18,4) NOT NULL,
    industry_average       NUMERIC(18,4),
    target_period          VARCHAR(50)   NOT NULL, -- Q1_2026, YEAR_2026

    CONSTRAINT uq_kpi_period UNIQUE (kpi_id, target_period)
);

COMMENT ON TABLE bi.benchmarks IS '[FOUNDATION] Target comparison rules mapping company scores to industry averages.';

CREATE TABLE bi.audit_risk_indicators (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    indicator_name         VARCHAR(150)  NOT NULL,
    threshold_value        NUMERIC(18,4) NOT NULL,
    alert_severity         VARCHAR(50)   NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    trigger_rules          JSONB         NOT NULL
);

COMMENT ON TABLE bi.audit_risk_indicators IS '[FOUNDATION] Flag controls and rules checking compliance thresholds.';

-- =============================================================================
-- SECTION 9 — AI ANALYTICS FOUNDATION
-- =============================================================================

CREATE TABLE bi.ai_model_registry (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    model_code             VARCHAR(50)   NOT NULL,
    model_version          VARCHAR(50)   NOT NULL,
    performance_score      NUMERIC(5,4),
    registry_metadata      JSONB         NOT NULL,

    -- v2.0 AI Metadata
    feature_version           VARCHAR(50)  NOT NULL DEFAULT 'v1.0',
    training_dataset_version  VARCHAR(50)  NOT NULL DEFAULT 'v1.0',
    inference_dataset_version VARCHAR(50)  NOT NULL DEFAULT 'v1.0',
    feature_refresh_timestamp TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    model_compatibility       VARCHAR(100),
    deprecation_status        VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT uq_ai_model UNIQUE (model_code, model_version),
    CONSTRAINT chk_ai_score CHECK (performance_score BETWEEN 0.0000 AND 1.0000)
);

COMMENT ON TABLE bi.ai_model_registry IS '[FOUNDATION] AI model catalog tracking score calibrations.';

CREATE TABLE bi.ai_prediction_history (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    model_registry_id      UUID          NOT NULL REFERENCES bi.ai_model_registry(id) ON DELETE CASCADE,
    input_features         JSONB         NOT NULL,
    predicted_output       JSONB         NOT NULL,
    actual_output          JSONB,
    prediction_time        TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE bi.ai_prediction_history IS '[HISTORY] Execution logs and inputs mapped to predictions.';

-- =============================================================================
-- SECTION 10 — DATA QUALITY (v2.0 REFINED)
-- =============================================================================

CREATE TABLE bi.data_quality_runs (
    id                      UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    execution_date          DATE          NOT NULL DEFAULT CURRENT_DATE,
    refresh_status          VARCHAR(50)   NOT NULL, -- COMPLETED, FAILED, RUNNING
    records_processed       INT           NOT NULL DEFAULT 0,
    records_failed          INT           NOT NULL DEFAULT 0,
    quality_score_pct       NUMERIC(5,2)  NOT NULL DEFAULT 100.00,
    failure_details         TEXT,

    -- v2.0 Quality Metrics
    completeness_score      NUMERIC(5,2)  NOT NULL DEFAULT 100.00,
    accuracy_score          NUMERIC(5,2)  NOT NULL DEFAULT 100.00,
    consistency_score       NUMERIC(5,2)  NOT NULL DEFAULT 100.00,
    timeliness_score        NUMERIC(5,2)  NOT NULL DEFAULT 100.00,
    validity_score          NUMERIC(5,2)  NOT NULL DEFAULT 100.00,
    duplicate_rate_pct      NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
    missing_values_count    INT           NOT NULL DEFAULT 0,
    overall_quality_score   NUMERIC(5,2)  NOT NULL DEFAULT 100.00,

    CONSTRAINT chk_dq_processed CHECK (records_processed >= 0),
    CONSTRAINT chk_dq_failed CHECK (records_failed >= 0),
    CONSTRAINT chk_dq_score CHECK (quality_score_pct BETWEEN 0.00 AND 100.00)
);

COMMENT ON TABLE bi.data_quality_runs IS '[HISTORY] Historical quality checks auditing data completeness and validity scores.';

-- =============================================================================
-- SECTION 11 — REFINEMENT TRACKING TABLES (v2.0 ADDITIONS)
-- =============================================================================

-- 11.1 Data Refresh History
CREATE TABLE bi.refresh_history (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    refresh_batch_number VARCHAR(100) NOT NULL,
    dataset_name         VARCHAR(150) NOT NULL,
    refresh_type         VARCHAR(50)  NOT NULL, -- INCREMENTAL, FULL
    started_at_utc       TIMESTAMPTZ  NOT NULL,
    completed_at_utc     TIMESTAMPTZ,
    duration_ms          INT,
    status               VARCHAR(50)  NOT NULL, -- RUNNING, COMPLETED, FAILED
    rows_read            INT          NOT NULL DEFAULT 0,
    rows_inserted        INT          NOT NULL DEFAULT 0,
    rows_updated        INT          NOT NULL DEFAULT 0,
    rows_failed          INT          NOT NULL DEFAULT 0,
    failure_reason       TEXT,
    trigger_source       VARCHAR(100) NOT NULL DEFAULT 'SCHEDULED'
);

COMMENT ON TABLE bi.refresh_history IS '[HISTORY] ETL execution log tracing source row read counts and insert deltas.';

-- 11.2 Fact Load History
CREATE TABLE bi.fact_load_history (
    id                UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    fact_table_name   VARCHAR(100) NOT NULL,
    source_module     VARCHAR(100) NOT NULL,
    batch_number      VARCHAR(100) NOT NULL,
    load_type         VARCHAR(50)  NOT NULL, -- FULL, INCREMENTAL
    rows_inserted     INT          NOT NULL DEFAULT 0,
    rows_updated      INT          NOT NULL DEFAULT 0,
    rows_rejected     INT          NOT NULL DEFAULT 0,
    execution_time    TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    validation_result TEXT
);

COMMENT ON TABLE bi.fact_load_history IS '[HISTORY] Load status summaries for dimension mappings.';

-- 11.3 KPI Calculation History
CREATE TABLE reports.kpi_calculation_history (
    id                    UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    kpi_id                UUID          NOT NULL REFERENCES reports.kpi_definitions(id) ON DELETE CASCADE,
    formula_version       INT           NOT NULL DEFAULT 1,
    threshold_version     INT           NOT NULL DEFAULT 1,
    calculated_value      NUMERIC(18,4) NOT NULL,
    target_value          NUMERIC(18,4) NOT NULL,
    status                VARCHAR(50)   NOT NULL, -- GREEN, YELLOW, RED
    calculation_timestamp TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE reports.kpi_calculation_history IS '[HISTORY] Snapshot record log auditing computed metrics.';

-- 11.4 Report Execution Metrics
CREATE TABLE reports.report_execution_metrics (
    id                  UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    report_id           UUID         NOT NULL REFERENCES reports.report_definitions(id) ON DELETE CASCADE,
    user_id             UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    runtime_ms          INT          NOT NULL,
    dataset_size_bytes  BIGINT       NOT NULL,
    export_format       VARCHAR(50)  NOT NULL,
    execution_status    VARCHAR(50)  NOT NULL, -- SUCCESS, FAILED
    error_details       TEXT,
    execution_timestamp TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE reports.report_execution_metrics IS '[HISTORY] Operational metadata logging user report downloads.';

-- 11.5 Dashboard Usage History
CREATE TABLE reports.dashboard_usage_history (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    dashboard_id         UUID         NOT NULL REFERENCES reports.dashboards(id) ON DELETE CASCADE,
    widget_id            UUID         REFERENCES reports.dashboard_widgets(id) ON DELETE SET NULL,
    user_id              UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    open_timestamp       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    refresh_timestamp    TIMESTAMPTZ,
    execution_duration_ms INT,
    device_type          VARCHAR(100) NOT NULL DEFAULT 'DESKTOP'
);

COMMENT ON TABLE reports.dashboard_usage_history IS '[HISTORY] UI interaction audits tracking open durations.';

-- 11.6 Data Lineage Registry
CREATE TABLE bi.data_lineage_registry (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    source_module          VARCHAR(100) NOT NULL,
    source_table_name      VARCHAR(100) NOT NULL,
    target_fact_name       VARCHAR(100),
    target_dimension_name  VARCHAR(100),
    transformation_version VARCHAR(50)  NOT NULL DEFAULT 'v1.0',
    refresh_batch_number   VARCHAR(100),
    owner_employee_id      UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,
    last_refresh_timestamp TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE bi.data_lineage_registry IS '[FOUNDATION] Governance registry mapping table lineages.';

-- 11.7 Forecast Execution History
CREATE TABLE bi.forecast_execution_history (
    id                    UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    forecast_model_id     UUID          NOT NULL REFERENCES bi.forecast_models(id) ON DELETE CASCADE,
    model_version         VARCHAR(50)   NOT NULL DEFAULT 'v1.0',
    parameters            JSONB         NOT NULL,
    forecast_horizon_days INT           NOT NULL,
    execution_timestamp   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    accuracy_metric       VARCHAR(100),
    variance_pct          NUMERIC(5,2),
    confidence_score      NUMERIC(5,4)
);

COMMENT ON TABLE bi.forecast_execution_history IS '[HISTORY] Logs of analytical predictions and scoring validations.';

-- 11.8 Analytics SLA Monitoring
CREATE TABLE bi.analytics_sla_monitoring (
    id                      UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sla_type                VARCHAR(50)  NOT NULL, -- REFRESH_SLA, REPORT_EXECUTION_SLA, DASHBOARD_REFRESH_SLA, FORECAST_SLA, AI_INFERENCE_SLA, DQ_SLA
    source_document_id      UUID         NOT NULL,
    target_duration_minutes INT          NOT NULL,
    actual_duration_minutes INT,
    is_breached             BOOLEAN      GENERATED ALWAYS AS (actual_duration_minutes > target_duration_minutes) STORED,
    breach_reason           TEXT,
    created_at_utc          TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_bi_sla_target CHECK (target_duration_minutes > 0),
    CONSTRAINT chk_bi_sla_actual CHECK (actual_duration_minutes IS NULL OR actual_duration_minutes >= 0),
    CONSTRAINT chk_bi_sla_type CHECK (sla_type IN ('REFRESH_SLA', 'REPORT_EXECUTION_SLA', 'DASHBOARD_REFRESH_SLA', 'FORECAST_SLA', 'AI_INFERENCE_SLA', 'DQ_SLA'))
);

COMMENT ON TABLE bi.analytics_sla_monitoring IS '[OPERATIONAL] SLA timers auditing latency parameters.';

-- 11.9 Analytics Audit Event Timeline
CREATE TABLE bi.analytics_audit_event_timeline (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    event_type           VARCHAR(100) NOT NULL, -- REFRESH_EVENTS, REPORT_EXECUTIONS, KPI_CALCULATIONS, FORECAST_RUNS, DASHBOARD_CHANGES, DATA_QUALITY_FAILURES, AI_MODEL_EXECUTIONS
    source_document_type VARCHAR(50)  NOT NULL,
    source_document_id   UUID         NOT NULL,
    event_timestamp      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    performed_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    payload              JSONB,

    created_at_utc       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE bi.analytics_audit_event_timeline IS '[HISTORY] Immutable log of metric refreshes and dashboard structural changes.';

-- =============================================================================
-- SECTION 12 — INDEX STRATEGY (B-TREE FOREIGNS & COMPOSITE COVERING)
-- =============================================================================

-- 12.1 B-Tree Indexes on all Foreign Keys
CREATE INDEX idx_kpi_def_cat_fk                ON reports.kpi_definitions (category_id);
CREATE INDEX idx_kpi_def_emp_fk                ON reports.kpi_definitions (owner_employee_id);

CREATE INDEX idx_kpi_target_kpi_fk             ON reports.kpi_targets (kpi_id);

CREATE INDEX idx_dashboard_emp_fk              ON reports.dashboards (owner_employee_id);
CREATE INDEX idx_dashboard_company_fk          ON reports.dashboards (company_id);
CREATE INDEX idx_dashboard_branch_fk           ON reports.dashboards (branch_id);

CREATE INDEX idx_widget_dashboard_fk           ON reports.dashboard_widgets (dashboard_id);
CREATE INDEX idx_widget_type_fk                ON reports.dashboard_widgets (widget_type_id);

CREATE INDEX idx_schedule_report_fk            ON reports.report_schedules (report_id);
CREATE INDEX idx_schedule_format_fk            ON reports.report_schedules (report_format_id);

CREATE INDEX idx_history_report_fk             ON reports.report_execution_history (report_id);
CREATE INDEX idx_history_user_fk               ON reports.report_execution_history (executed_by_user_id);

CREATE INDEX idx_dim_org_company_fk            ON bi.dim_organization (company_id);
CREATE INDEX idx_dim_org_branch_fk             ON bi.dim_organization (branch_id);
CREATE INDEX idx_dim_org_dept_fk               ON bi.dim_organization (department_id);

CREATE INDEX idx_dim_prod_id_fk                ON bi.dim_product (product_id);

CREATE INDEX idx_dim_cust_id_fk                ON bi.dim_customer (customer_id);

CREATE INDEX idx_dim_supp_id_fk                ON bi.dim_supplier (supplier_id);

CREATE INDEX idx_fore_model_alg_fk             ON bi.forecast_models (algorithm_id);
CREATE INDEX idx_fore_model_kpi_fk             ON bi.forecast_models (target_kpi_id);

CREATE INDEX idx_fore_run_model_fk             ON bi.forecast_runs (model_id);

CREATE INDEX idx_fore_res_run_fk               ON bi.forecast_results (run_id);

CREATE INDEX idx_benchmark_kpi_fk              ON bi.benchmarks (kpi_id);

CREATE INDEX idx_prediction_registry_fk        ON bi.ai_prediction_history (model_registry_id);

-- v2.0 Index extensions
CREATE INDEX idx_kpi_ch_kpi_fk                 ON reports.kpi_calculation_history (kpi_id);

CREATE INDEX idx_rep_em_report_fk              ON reports.report_execution_metrics (report_id);
CREATE INDEX idx_rep_em_user_fk                ON reports.report_execution_metrics (user_id);

CREATE INDEX idx_dash_uh_dash_fk               ON reports.dashboard_usage_history (dashboard_id);
CREATE INDEX idx_dash_uh_user_fk               ON reports.dashboard_usage_history (user_id);

CREATE INDEX idx_lineage_owner_fk              ON bi.data_lineage_registry (owner_employee_id);

CREATE INDEX idx_fore_eh_model_fk              ON bi.forecast_execution_history (forecast_model_id);

CREATE INDEX idx_sla_monitor_fk                ON bi.analytics_sla_monitoring (source_document_id);

CREATE INDEX idx_aaudit_user_fk                ON bi.analytics_audit_event_timeline (performed_by_user_id);

-- 12.2 Composite Indexes (Covering common dimensional warehouse queries)
CREATE INDEX idx_fact_sales_covering           ON bi.fact_sales_orders (date_key, organization_key, customer_key);
CREATE INDEX idx_fact_proc_covering            ON bi.fact_procurement_purchases (date_key, organization_key, supplier_key);
CREATE INDEX idx_fact_inv_covering             ON bi.fact_daily_inventory_snapshots (date_key, product_key);

-- 12.3 Partial Indexes (Optimizing active/hot records)
CREATE INDEX idx_report_schedules_active       ON reports.report_schedules (id) WHERE is_active = TRUE;
CREATE INDEX idx_dq_runs_failed                ON bi.data_quality_runs (id) WHERE refresh_status = 'FAILED';
CREATE INDEX idx_forecast_runs_variance        ON bi.forecast_runs (id) WHERE variance_pct > 15.00;
CREATE INDEX idx_refresh_failed                ON bi.refresh_history (id) WHERE status = 'FAILED';
CREATE INDEX idx_report_jobs_pending           ON reports.report_execution_history (id) WHERE status = 'RUNNING';
CREATE INDEX idx_ai_predictions_deviated       ON bi.ai_prediction_history (id) WHERE actual_output IS NULL;
CREATE INDEX idx_dq_scores_low                 ON bi.data_quality_runs (id) WHERE quality_score_pct < 95.00;
