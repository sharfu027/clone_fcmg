-- =============================================================================
-- INK FMCG ENTERPRISE ERP — WAREHOUSE OPERATIONS (WMS) SCHEMAS (v2.0 REFINED)
-- File Name      : wms_schema.sql
-- Target Database: PostgreSQL 16+
-- Schema Owner   : wms
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS wms;

-- =============================================================================
-- SECTION 1 — LOOKUP TABLES
-- =============================================================================

-- 1.1 Warehouse Task Statuses
CREATE TABLE wms.warehouse_task_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_wms_task_statuses_code UNIQUE (code),
    CONSTRAINT chk_wms_task_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE wms.warehouse_task_statuses IS 
    '[LOOKUP] Lifecycle status of a WMS task: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED, HOLD.';

-- 1.2 Warehouse Task Types
CREATE TABLE wms.warehouse_task_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_wms_task_types_code UNIQUE (code),
    CONSTRAINT chk_wms_task_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE wms.warehouse_task_types IS 
    '[LOOKUP] Classifies execution tasks: RECEIVING, PUTAWAY, PICKING, PACKING, REPLENISHMENT, CYCLE_COUNT, TRANSFER, ADJUSTMENT.';

-- 1.3 Task Priorities
CREATE TABLE wms.task_priorities (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    priority_level INT          NOT NULL CHECK (priority_level BETWEEN 1 AND 5),
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_task_priorities_code UNIQUE (code),
    CONSTRAINT chk_task_priorities_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE wms.task_priorities IS 
    '[LOOKUP] Priority weights for task schedules: LOW (1), MEDIUM (2), HIGH (3), URGENT (4), IMMEDIATE (5).';

-- 1.4 Pick Statuses
CREATE TABLE wms.pick_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_pick_statuses_code UNIQUE (code),
    CONSTRAINT chk_pick_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE wms.pick_statuses IS 
    '[LOOKUP] Picking statuses: PENDING, IN_PROGRESS, PICKED, EXCEPTION, CANCELLED.';

-- 1.5 Pack Statuses
CREATE TABLE wms.pack_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_pack_statuses_code UNIQUE (code),
    CONSTRAINT chk_pack_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE wms.pack_statuses IS 
    '[LOOKUP] Packaging line statuses: PENDING, IN_PROGRESS, PACKED, VERIFIED, EXCEPTION.';

-- 1.6 Put-away Statuses
CREATE TABLE wms.putaway_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_putaway_statuses_code UNIQUE (code),
    CONSTRAINT chk_putaway_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE wms.putaway_statuses IS 
    '[LOOKUP] Putaway task execution statuses: PENDING, IN_PROGRESS, PUTAWAY, OVERRIDDEN, EXCEPTION.';

-- 1.7 Count Statuses
CREATE TABLE wms.count_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_count_statuses_code UNIQUE (code),
    CONSTRAINT chk_count_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE wms.count_statuses IS 
    '[LOOKUP] Cycle count task states: PLANNED, IN_PROGRESS, COUNTED, RECOUNT_REQUIRED, APPROVED, REJECTED.';

-- 1.8 Adjustment Reasons
CREATE TABLE wms.adjustment_reasons (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_adjustment_reasons_code UNIQUE (code),
    CONSTRAINT chk_adjustment_reasons_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE wms.adjustment_reasons IS 
    '[LOOKUP] Inventory correction classifications: DAMAGE, SHRINKAGE, LOST, FOUND_STOCKED, MEASUREMENT_CORRECTION.';

-- 1.9 Dock Statuses
CREATE TABLE wms.dock_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_dock_statuses_code UNIQUE (code),
    CONSTRAINT chk_dock_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE wms.dock_statuses IS 
    '[LOOKUP] Physical loading dock status: FREE, SCHEDULED, OCCUPIED, BLOCKED.';

-- 1.10 Replenishment Statuses
CREATE TABLE wms.replenishment_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_replenishment_statuses_code UNIQUE (code),
    CONSTRAINT chk_replenishment_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE wms.replenishment_statuses IS 
    '[LOOKUP] Internal restocking request status: REQUESTED, ASSIGNED, IN_PROGRESS, COMPLETED, EXPIRED.';

-- =============================================================================
-- SECTION 2 — WAREHOUSE TASK ENGINE
-- =============================================================================

-- 2.1 Task Queue
CREATE TABLE wms.warehouse_tasks (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id           UUID          NOT NULL REFERENCES warehouse.warehouses(id),
    task_type_id           UUID          NOT NULL REFERENCES wms.warehouse_task_types(id),
    task_status_id         UUID          NOT NULL REFERENCES wms.warehouse_task_statuses(id),
    priority_id            UUID          NOT NULL REFERENCES wms.task_priorities(id),
    
    assigned_employee_id   UUID          REFERENCES employee.employees(id) ON DELETE SET NULL,
    started_at_utc         TIMESTAMPTZ,
    completed_at_utc       TIMESTAMPTZ,
    
    -- References to source documents (polymorphic hooks)
    source_document_type   VARCHAR(50),  -- e.g. PO, SALES_ORDER, TRANSFER_ORDER, COUNT_PLAN
    source_document_line_id UUID,        -- references line keys
    
    notes                  TEXT,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,
    is_deleted             BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc         TIMESTAMPTZ,
    deleted_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE wms.warehouse_tasks IS 
    '[OPERATIONAL] Central WMS task registry governing queue processing, assignments, and timestamps.';

-- 2.2 Task Dependencies (For directed sequences)
CREATE TABLE wms.task_dependencies (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    predecessor_task_id    UUID         NOT NULL REFERENCES wms.warehouse_tasks(id) ON DELETE CASCADE,
    successor_task_id      UUID         NOT NULL REFERENCES wms.warehouse_tasks(id) ON DELETE CASCADE,
    dependency_type        VARCHAR(50)  NOT NULL DEFAULT 'FINISH_TO_START', -- FINISH_TO_START
    created_at_utc         TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_task_dependency UNIQUE (predecessor_task_id, successor_task_id),
    CONSTRAINT chk_task_dep_self CHECK (predecessor_task_id <> successor_task_id)
);

COMMENT ON TABLE wms.task_dependencies IS 
    '[FOUNDATION] Directed acyclic graph links specifying task execution order constraints.';

-- =============================================================================
-- SECTION 3 — GOODS RECEIPT EXECUTION
-- =============================================================================

-- 3.1 Receiving Sessions
CREATE TABLE wms.receiving_sessions (
    id                      UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id            UUID          NOT NULL REFERENCES warehouse.warehouses(id),
    receiving_appointment_id UUID         REFERENCES procurement.receiving_appointments(id) ON DELETE SET NULL,
    dock_location_id        UUID          NOT NULL REFERENCES warehouse.storage_locations(id), -- Dock location
    
    session_start_time      TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    session_end_time        TIMESTAMPTZ,
    vehicle_plate_number    VARCHAR(50),
    driver_name             VARCHAR(150),
    seal_number             VARCHAR(100),
    seal_condition_ok       BOOLEAN       NOT NULL DEFAULT TRUE,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_recv_session_times CHECK (session_end_time IS NULL OR session_end_time >= session_start_time)
);

COMMENT ON TABLE wms.receiving_sessions IS 
    '[OPERATIONAL] Receiving gate events checking vehicle credentials, seal integrity, and schedules.';

-- 3.2 Receiving Tasks Details
CREATE TABLE wms.receiving_tasks (
    id                  UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    receiving_session_id UUID         NOT NULL REFERENCES wms.receiving_sessions(id) ON DELETE CASCADE,
    warehouse_task_id   UUID          NOT NULL REFERENCES wms.warehouse_tasks(id) ON DELETE CASCADE,
    product_id          UUID          NOT NULL REFERENCES product.products(id),
    
    expected_quantity   NUMERIC(18,4) NOT NULL,
    received_quantity   NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    damaged_quantity    NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    
    temp_holding_bin_id UUID          NOT NULL REFERENCES warehouse.storage_locations(id), -- Stage location
    lot_number          VARCHAR(100),
    expiry_date         DATE,

    CONSTRAINT chk_recv_task_expected CHECK (expected_quantity >= 0.0000),
    CONSTRAINT chk_recv_task_received CHECK (received_quantity >= 0.0000),
    CONSTRAINT chk_recv_task_damaged CHECK (damaged_quantity >= 0.0000 AND damaged_quantity <= received_quantity)
);

COMMENT ON TABLE wms.receiving_tasks IS 
    '[OPERATIONAL] Line items checked in, allocating batch lots, expiry tracking, and temporary staging bins.';

-- 3.3 Receiving Exceptions
CREATE TABLE wms.receiving_exceptions (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    receiving_task_id  UUID          NOT NULL REFERENCES wms.receiving_tasks(id) ON DELETE CASCADE,
    exception_type     VARCHAR(50)   NOT NULL, -- SHORTAGE, OVERAGE, DAMAGE, EXPIRED, MISMATCH
    reported_quantity  NUMERIC(18,4) NOT NULL,
    notes              TEXT          NOT NULL,
    action_taken       TEXT,
    
    created_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    processed_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_recv_exception_qty CHECK (reported_quantity > 0.0000)
);

COMMENT ON TABLE wms.receiving_exceptions IS 
    '[OPERATIONAL] Log audit records tracking receiving discrepancies (shortages, overages, breaks).';

-- =============================================================================
-- SECTION 4 — PUT-AWAY OPERATIONS
-- =============================================================================

CREATE TABLE wms.putaway_tasks (
    id                  UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_task_id   UUID          NOT NULL REFERENCES wms.warehouse_tasks(id) ON DELETE CASCADE,
    putaway_status_id   UUID          NOT NULL REFERENCES wms.putaway_statuses(id),
    
    inventory_item_id   UUID          NOT NULL REFERENCES inventory.inventory_items(id),
    quantity            NUMERIC(18,4) NOT NULL,
    
    source_bin_id       UUID          NOT NULL REFERENCES warehouse.storage_locations(id), -- Staging location
    suggested_bin_id    UUID          NOT NULL REFERENCES warehouse.storage_locations(id), -- System logic directed location
    destination_bin_id  UUID          REFERENCES warehouse.storage_locations(id),          -- Actual putaway location
    
    is_override         BOOLEAN       NOT NULL DEFAULT FALSE,
    override_reason     TEXT,

    -- Auditing
    created_at_utc      TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_putaway_qty CHECK (quantity > 0.0000),
    CONSTRAINT chk_putaway_override CHECK (is_override = FALSE OR (is_override = TRUE AND override_reason IS NOT NULL AND length(trim(override_reason)) > 0))
);

COMMENT ON TABLE wms.putaway_tasks IS 
    '[OPERATIONAL] Putaway executions moving stock from receipt docks into storage, supporting manual overrides.';

-- =============================================================================
-- SECTION 5 — BIN LOCKING & CAPACITY MONITORING
-- =============================================================================

-- 5.1 Bin Locks (Locks locations during cycle counts or operations)
CREATE TABLE wms.bin_locks (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    storage_location_id  UUID          NOT NULL REFERENCES warehouse.storage_locations(id) ON DELETE CASCADE,
    lock_type            VARCHAR(50)   NOT NULL, -- INBOUND_LOCK, OUTBOUND_LOCK, FULL_FREEZE, SYSTEM_RESERVED
    reason               TEXT          NOT NULL,
    is_active            BOOLEAN       NOT NULL DEFAULT TRUE,
    
    locked_at_utc        TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    locked_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    released_at_utc      TIMESTAMPTZ,
    released_by_user_id  UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_bin_lock_times CHECK (released_at_utc IS NULL OR released_at_utc >= locked_at_utc),
    CONSTRAINT chk_bin_lock_type CHECK (lock_type IN ('INBOUND_LOCK', 'OUTBOUND_LOCK', 'FULL_FREEZE', 'SYSTEM_RESERVED'))
);

COMMENT ON TABLE wms.bin_locks IS 
    '[OPERATIONAL] System locks disabling allocations to specific bins during audits.';

-- 5.2 Bin Capacity Monitoring (Dynamic volume/weight checkpoints)
CREATE TABLE wms.bin_capacity_monitoring (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    storage_location_id  UUID          NOT NULL REFERENCES warehouse.storage_locations(id) ON DELETE CASCADE,
    
    max_weight_kg        NUMERIC(12,4) NOT NULL,
    current_weight_kg    NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
    remaining_weight_kg  NUMERIC(12,4) GENERATED ALWAYS AS (max_weight_kg - current_weight_kg) STORED,
    
    max_volume_cbm       NUMERIC(12,4) NOT NULL,
    current_volume_cbm   NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
    remaining_volume_cbm NUMERIC(12,4) GENERATED ALWAYS AS (max_volume_cbm - current_volume_cbm) STORED,
    
    last_measured_at_utc TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_bin_capacity UNIQUE (storage_location_id),
    CONSTRAINT chk_bin_weight CHECK (max_weight_kg >= 0.0000 AND current_weight_kg >= 0.0000),
    CONSTRAINT chk_bin_volume CHECK (max_volume_cbm >= 0.0000 AND current_volume_cbm >= 0.0000)
);

COMMENT ON TABLE wms.bin_capacity_monitoring IS 
    '[FOUNDATION] Space utilization parameters recalculating volume footprints per bin.';

-- =============================================================================
-- SECTION 6 — PICKING OPERATIONS
-- =============================================================================

-- 6.1 Pick Waves
CREATE TABLE wms.pick_waves (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id           UUID          NOT NULL REFERENCES warehouse.warehouses(id),
    wave_number            VARCHAR(50)   NOT NULL,
    is_released            BOOLEAN       NOT NULL DEFAULT FALSE,
    released_at_utc        TIMESTAMPTZ,
    
    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_pick_wave_num UNIQUE (wave_number)
);

COMMENT ON TABLE wms.pick_waves IS 
    '[OPERATIONAL] Groupings of sales orders consolidated to run optimized picking runs.';

-- 6.2 Pick Batches (Multi order collections)
CREATE TABLE wms.pick_batches (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    pick_wave_id           UUID          NOT NULL REFERENCES wms.pick_waves(id) ON DELETE CASCADE,
    batch_number           VARCHAR(50)   NOT NULL,
    zone_id                UUID          REFERENCES warehouse.warehouse_operational_areas(id) ON DELETE SET NULL, -- Zone pick link
    
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    
    CONSTRAINT uq_pick_batch_num UNIQUE (batch_number)
);

COMMENT ON TABLE wms.pick_batches IS 
    '[OPERATIONAL] Consolidated sets of picking tasks grouped for cluster/zone picker routing.';

-- 6.3 Picking Tasks Details
CREATE TABLE wms.pick_tasks (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    pick_batch_id          UUID          NOT NULL REFERENCES wms.pick_batches(id) ON DELETE CASCADE,
    warehouse_task_id      UUID          NOT NULL REFERENCES wms.warehouse_tasks(id) ON DELETE CASCADE,
    pick_status_id         UUID          NOT NULL REFERENCES wms.pick_statuses(id),
    
    inventory_item_id      UUID          NOT NULL REFERENCES inventory.inventory_items(id),
    quantity_requested     NUMERIC(18,4) NOT NULL,
    quantity_picked        NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    
    source_bin_id          UUID          NOT NULL REFERENCES warehouse.storage_locations(id),
    staging_bin_id         UUID          REFERENCES warehouse.storage_locations(id), -- dispatch staging bin

    -- Auditing
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_pick_task_requested CHECK (quantity_requested > 0.0000),
    CONSTRAINT chk_pick_task_picked CHECK (quantity_picked >= 0.0000 AND quantity_picked <= quantity_requested)
);

COMMENT ON TABLE wms.pick_tasks IS 
    '[OPERATIONAL] Picking task executions tracking requested and picked quantities per storage bin.';

-- 6.4 Picking Exceptions
CREATE TABLE wms.pick_exceptions (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    pick_task_id       UUID          NOT NULL REFERENCES wms.pick_tasks(id) ON DELETE CASCADE,
    exception_code     VARCHAR(50)   NOT NULL, -- SHORT_PICK, BIN_EMPTY, DAMAGED_STOCK, WRONG_LOT
    reported_quantity  NUMERIC(18,4) NOT NULL,
    notes              TEXT          NOT NULL,
    action_taken       TEXT,
    
    created_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    processed_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_pick_exception_qty CHECK (reported_quantity > 0.0000)
);

COMMENT ON TABLE wms.pick_exceptions IS 
    '[OPERATIONAL] Logs picking execution errors (short pick, missing lot, empty bin).';

-- =============================================================================
-- SECTION 7 — PACKING OPERATIONS
-- =============================================================================

-- 7.1 Packaging Materials (Boxes, Pallets, Wraps)
CREATE TABLE wms.packaging_materials (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    material_code      VARCHAR(50)   NOT NULL,
    material_name      VARCHAR(100)  NOT NULL,
    tare_weight_kg     NUMERIC(10,4) NOT NULL,
    max_weight_kg      NUMERIC(10,4) NOT NULL,
    outer_volume_cbm   NUMERIC(10,4) NOT NULL,
    is_active          BOOLEAN       NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_pkg_material_code UNIQUE (material_code),
    CONSTRAINT chk_pkg_material_weight CHECK (tare_weight_kg >= 0.0000 AND max_weight_kg > tare_weight_kg),
    CONSTRAINT chk_pkg_material_vol CHECK (outer_volume_cbm >= 0.0000)
);

COMMENT ON TABLE wms.packaging_materials IS 
    '[FOUNDATION] Specifications of storage shipping cases, pallets, and packaging box weights.';

-- 7.2 Packing Sessions
CREATE TABLE wms.packing_sessions (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id           UUID          NOT NULL REFERENCES warehouse.warehouses(id),
    pack_status_id         UUID          NOT NULL REFERENCES wms.pack_statuses(id),
    
    packing_table_bin_id   UUID          NOT NULL REFERENCES warehouse.storage_locations(id), -- packing station
    packaging_material_id  UUID          NOT NULL REFERENCES wms.packaging_materials(id),
    
    measured_weight_kg     NUMERIC(10,4),
    measured_volume_cbm    NUMERIC(10,4),
    verification_passed    BOOLEAN       NOT NULL DEFAULT FALSE,
    verified_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_pack_session_weight CHECK (measured_weight_kg IS NULL OR measured_weight_kg >= 0.0000),
    CONSTRAINT chk_pack_session_vol CHECK (measured_volume_cbm IS NULL OR measured_volume_cbm >= 0.0000)
);

COMMENT ON TABLE wms.packing_sessions IS 
    '[OPERATIONAL] Packing checkpoints validating total carton weights/volumes before logistics handover.';

-- 7.3 Packing Session Lines
CREATE TABLE wms.packing_lines (
    id                  UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    packing_session_id  UUID          NOT NULL REFERENCES wms.packing_sessions(id) ON DELETE CASCADE,
    pick_task_id        UUID          NOT NULL REFERENCES wms.pick_tasks(id) ON DELETE CASCADE,
    quantity_packed     NUMERIC(18,4) NOT NULL,

    CONSTRAINT chk_packing_line_qty CHECK (quantity_packed > 0.0000)
);

COMMENT ON TABLE wms.packing_lines IS 
    '[OPERATIONAL] Details of item units packed into a specific carton shipment box.';

-- =============================================================================
-- SECTION 8 — REPLENISHMENT OPERATIONS
-- =============================================================================

CREATE TABLE wms.replenishment_tasks (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_task_id      UUID          NOT NULL REFERENCES wms.warehouse_tasks(id) ON DELETE CASCADE,
    replenishment_status_id UUID         NOT NULL REFERENCES wms.replenishment_statuses(id),
    
    product_id             UUID          NOT NULL REFERENCES product.products(id),
    quantity_requested     NUMERIC(18,4) NOT NULL,
    quantity_moved         NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    
    source_bin_id          UUID          NOT NULL REFERENCES warehouse.storage_locations(id), -- reserve bin
    destination_bin_id     UUID          NOT NULL REFERENCES warehouse.storage_locations(id), -- forward active picking bin

    -- Auditing
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_replenish_requested CHECK (quantity_requested > 0.0000),
    CONSTRAINT chk_replenish_moved CHECK (quantity_moved >= 0.0000 AND quantity_moved <= quantity_requested)
);

COMMENT ON TABLE wms.replenishment_tasks IS 
    '[OPERATIONAL] Internal transfer tasks restocking forward active picking zones from bulk storage reserve.';

-- =============================================================================
-- SECTION 9 — CYCLE COUNTING
-- =============================================================================

-- 9.1 Count Plans
CREATE TABLE wms.cycle_count_plans (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id           UUID         NOT NULL REFERENCES warehouse.warehouses(id),
    plan_name              VARCHAR(150) NOT NULL,
    scheduled_date         DATE         NOT NULL,
    abc_classification_id  UUID,        -- dynamic target priority
    is_active              BOOLEAN      NOT NULL DEFAULT TRUE,

    -- Concurrency and Auditing
    row_version            INT          NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE wms.cycle_count_plans IS 
    '[FOUNDATION] Count plan headers scheduling recurring shelf validations.';

-- 9.2 Cycle Count Tasks
CREATE TABLE wms.cycle_count_tasks (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    cycle_count_plan_id    UUID         NOT NULL REFERENCES wms.cycle_count_plans(id) ON DELETE CASCADE,
    warehouse_task_id      UUID         NOT NULL REFERENCES wms.warehouse_tasks(id) ON DELETE CASCADE,
    count_status_id        UUID         NOT NULL REFERENCES wms.count_statuses(id),
    
    storage_location_id    UUID         NOT NULL REFERENCES warehouse.storage_locations(id),
    blind_count_required   BOOLEAN      NOT NULL DEFAULT TRUE,
    
    -- Auditing
    created_at_utc         TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc   TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE wms.cycle_count_tasks IS 
    '[OPERATIONAL] Audit checks dispatched per warehouse bin locations.';

-- 9.3 Count Results & Variances
CREATE TABLE wms.cycle_count_results (
    id                    UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    cycle_count_task_id   UUID          NOT NULL REFERENCES wms.cycle_count_tasks(id) ON DELETE CASCADE,
    inventory_item_id     UUID          NOT NULL REFERENCES inventory.inventory_items(id),
    
    system_quantity       NUMERIC(18,4) NOT NULL,
    counted_quantity      NUMERIC(18,4) NOT NULL,
    variance_quantity     NUMERIC(18,4) GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
    
    variance_reason_id    UUID          REFERENCES wms.adjustment_reasons(id),
    is_approved           BOOLEAN,      -- workflow approval decisions (NULL = pending, TRUE = approved, FALSE = rejected)
    approved_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    approved_at_utc       TIMESTAMPTZ,

    created_at_utc        TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_count_system CHECK (system_quantity >= 0.0000),
    CONSTRAINT chk_count_actual CHECK (counted_quantity >= 0.0000)
);

COMMENT ON TABLE wms.cycle_count_results IS 
    '[OPERATIONAL] Physical audit outcomes tracking discrepancies against systemic calculations.';

-- =============================================================================
-- SECTION 10 — STOCK ADJUSTMENTS
-- =============================================================================

CREATE TABLE wms.stock_adjustments (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id           UUID          NOT NULL REFERENCES warehouse.warehouses(id),
    inventory_item_id      UUID          NOT NULL REFERENCES inventory.inventory_items(id),
    storage_location_id    UUID          NOT NULL REFERENCES warehouse.storage_locations(id),
    
    adjustment_reason_id   UUID          NOT NULL REFERENCES wms.adjustment_reasons(id),
    quantity               NUMERIC(18,4) NOT NULL, -- negative for shrinkage/loss, positive for found
    approved_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    
    -- Sync flags to inventory ledger
    inventory_transaction_id UUID,        -- hook linked to inventory traceability
    notes                  TEXT,

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_adjustment_qty CHECK (quantity <> 0.0000)
);

COMMENT ON TABLE wms.stock_adjustments IS 
    '[OPERATIONAL] Authorized corrections to balances (scrap damages, shrink losses).';

-- =============================================================================
-- SECTION 11 — DOCK & DISPATCH PREPARATION
-- =============================================================================

-- 11.1 Loading Dispatch tasks
CREATE TABLE wms.dispatch_loading_tasks (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_task_id      UUID          NOT NULL REFERENCES wms.warehouse_tasks(id) ON DELETE CASCADE,
    dock_location_id       UUID          NOT NULL REFERENCES warehouse.storage_locations(id),
    
    packing_session_id     UUID          NOT NULL REFERENCES wms.packing_sessions(id), -- carton/pallet
    vehicle_plate_number   VARCHAR(50),
    loading_sequence_order INT           NOT NULL DEFAULT 1,
    
    is_verified            BOOLEAN       NOT NULL DEFAULT FALSE,
    verified_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    verified_at_utc        TIMESTAMPTZ,

    -- Auditing
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_loading_seq CHECK (loading_sequence_order >= 1)
);

COMMENT ON TABLE wms.dispatch_loading_tasks IS 
    '[OPERATIONAL] Loading task executions mapping shipping carton scan verification to vehicles.';

-- =============================================================================
-- SECTION 12 — AUDITING & TIMELINES (v2.0 ADDITIONS)
-- =============================================================================

-- 12.1 Warehouse Event Timeline (Master Execution Log)
CREATE TABLE wms.warehouse_event_timeline (
    id                  UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id        UUID         NOT NULL REFERENCES warehouse.warehouses(id) ON DELETE CASCADE,
    event_type          VARCHAR(100) NOT NULL, -- RECEIVE_START, RECEIVE_END, UNLOAD_END, QUALITY_START, QUALITY_END, PUTAWAY_START, PUTAWAY_END, PICK_START, PICK_END, PACK_START, PACK_END, LOAD_START, LOAD_END, DISPATCH_RELEASE, TASK_CANCEL, TASK_REASSIGN
    source_document_type VARCHAR(50)  NOT NULL, -- PO, SO, COUNT, TRANSFER
    source_document_id  UUID         NOT NULL,
    event_timestamp     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    employee_id         UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,
    payload             JSONB,

    created_at_utc      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE wms.warehouse_event_timeline IS 
    '[HISTORY] Compiled chronological master timeline for executive warehouse dashboard metrics.';

-- 12.2 Equipment Assignment History
CREATE TABLE wms.equipment_assignment_history (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    equipment_id         UUID         NOT NULL REFERENCES warehouse.warehouse_equipment(id) ON DELETE CASCADE,
    operator_employee_id UUID         NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    assigned_at_utc      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    released_at_utc      TIMESTAMPTZ,
    assignment_reason    TEXT         NOT NULL,

    -- Concurrency and Auditing
    row_version          INT          NOT NULL DEFAULT 1,
    created_at_utc       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_equip_assign_dates CHECK (released_at_utc IS NULL OR released_at_utc >= assigned_at_utc)
);

COMMENT ON TABLE wms.equipment_assignment_history IS 
    '[HISTORY] Audit log mapping equipment usage and operators.';

-- 12.3 Labor Assignment History
CREATE TABLE wms.labor_assignment_history (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID         NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    warehouse_task_id      UUID         NOT NULL REFERENCES wms.warehouse_tasks(id) ON DELETE CASCADE,
    assigned_at_utc        TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    completed_at_utc       TIMESTAMPTZ,
    reassignment_reason    TEXT,
    supervisor_employee_id UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,

    CONSTRAINT chk_labor_assign_dates CHECK (completed_at_utc IS NULL OR completed_at_utc >= assigned_at_utc)
);

COMMENT ON TABLE wms.labor_assignment_history IS 
    '[HISTORY] Timeline log tracking worker task performance and supervisor oversight.';

-- 12.4 Dock Occupancy History
CREATE TABLE wms.dock_occupancy_history (
    id                    UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    dock_location_id      UUID         NOT NULL REFERENCES warehouse.storage_locations(id) ON DELETE CASCADE,
    receiving_session_id  UUID         REFERENCES wms.receiving_sessions(id) ON DELETE SET NULL,
    vehicle_plate_number  VARCHAR(50)  NOT NULL,
    
    arrival_time          TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    docked_at_utc         TIMESTAMPTZ,
    unload_start_at_utc   TIMESTAMPTZ,
    unload_end_at_utc     TIMESTAMPTZ,
    load_start_at_utc     TIMESTAMPTZ,
    load_end_at_utc       TIMESTAMPTZ,
    departure_time        TIMESTAMPTZ,
    
    delay_reason          TEXT,

    CONSTRAINT chk_dock_occupancy_dates CHECK (departure_time IS NULL OR departure_time >= arrival_time)
);

COMMENT ON TABLE wms.dock_occupancy_history IS 
    '[HISTORY] Detailed metrics tracking dock utilization and delay bottlenecks.';

-- 12.5 Warehouse Exception Registry (Unified exceptions mapping)
CREATE TABLE wms.warehouse_exception_registry (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id           UUID         NOT NULL REFERENCES warehouse.warehouses(id) ON DELETE CASCADE,
    exception_category     VARCHAR(50)  NOT NULL, -- RECEIVING, PUTAWAY, PICKING, PACKING, LOADING, CYCLE_COUNT, DAMAGE, SAFETY
    severity               VARCHAR(20)  NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    reported_at_utc        TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    reported_by_employee_id UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,
    description            TEXT         NOT NULL,
    resolution             TEXT,
    resolved_at_utc        TIMESTAMPTZ,
    owner_employee_id      UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,

    CONSTRAINT chk_exception_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_exception_category CHECK (exception_category IN ('RECEIVING', 'PUTAWAY', 'PICKING', 'PACKING', 'LOADING', 'CYCLE_COUNT', 'DAMAGE', 'SAFETY')),
    CONSTRAINT chk_exception_dates CHECK (resolved_at_utc IS NULL OR resolved_at_utc >= reported_at_utc)
);

COMMENT ON TABLE wms.warehouse_exception_registry IS 
    '[OPERATIONAL] Unified repository logging execution anomalies and safety events.';

-- 12.6 Task Lifecycle history (Transition timeline)
CREATE TABLE wms.task_lifecycle_history (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_task_id      UUID         NOT NULL REFERENCES wms.warehouse_tasks(id) ON DELETE CASCADE,
    task_status_id         UUID         NOT NULL REFERENCES wms.warehouse_task_statuses(id) ON DELETE CASCADE,
    effective_from         TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    effective_to           TIMESTAMPTZ,
    comments               TEXT,
    changed_by_user_id     UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_task_lifecycle_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE wms.task_lifecycle_history IS 
    '[HISTORY] Chronological logs of changes made to WMS queue execution statuses.';

-- 12.7 SLA Monitoring
CREATE TABLE wms.sla_monitoring (
    id                      UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_task_id       UUID         NOT NULL REFERENCES wms.warehouse_tasks(id) ON DELETE CASCADE,
    sla_type                VARCHAR(50)  NOT NULL, -- RECEIVING, PUTAWAY, PICKING, PACKING, LOADING
    target_duration_minutes INT          NOT NULL,
    actual_duration_minutes INT,
    is_breached             BOOLEAN      GENERATED ALWAYS AS (actual_duration_minutes > target_duration_minutes) STORED,
    breach_reason           TEXT,
    created_at_utc          TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_sla_target CHECK (target_duration_minutes > 0),
    CONSTRAINT chk_sla_actual CHECK (actual_duration_minutes IS NULL OR actual_duration_minutes >= 0),
    CONSTRAINT chk_sla_type CHECK (sla_type IN ('RECEIVING', 'PUTAWAY', 'PICKING', 'PACKING', 'LOADING'))
);

COMMENT ON TABLE wms.sla_monitoring IS 
    '[OPERATIONAL] Task execution duration monitors mapping targets against breaches.';

-- 12.8 Capacity Daily snapshots (Historical utilization tracking)
CREATE TABLE wms.daily_capacity_snapshots (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    snapshot_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
    warehouse_id         UUID          NOT NULL REFERENCES warehouse.warehouses(id) ON DELETE CASCADE,
    zone_id              UUID          REFERENCES warehouse.warehouse_operational_areas(id) ON DELETE CASCADE,
    storage_location_id  UUID          REFERENCES warehouse.storage_locations(id) ON DELETE CASCADE, -- bin reference
    
    max_capacity_kg      NUMERIC(12,4) NOT NULL,
    utilized_capacity_kg  NUMERIC(12,4) NOT NULL,
    utilization_pct      NUMERIC(5,2)  GENERATED ALWAYS AS (ROUND((utilized_capacity_kg / max_capacity_kg) * 100.00, 2)) STORED,
    created_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_daily_capacity_snap UNIQUE (snapshot_date, warehouse_id, zone_id, storage_location_id),
    CONSTRAINT chk_cap_snap_max CHECK (max_capacity_kg > 0.0000),
    CONSTRAINT chk_cap_snap_util CHECK (utilized_capacity_kg >= 0.0000)
);

COMMENT ON TABLE wms.daily_capacity_snapshots IS 
    '[HISTORY] Snapshots of storage capacities at Bin, Zone, and Warehouse levels.';

-- 12.9 Dispatch Verification (Outbound checklist gating)
CREATE TABLE wms.dispatch_verification (
    id                            UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    dispatch_loading_task_id      UUID         NOT NULL REFERENCES wms.dispatch_loading_tasks(id) ON DELETE CASCADE,
    seal_number                   VARCHAR(100) NOT NULL,
    
    vehicle_inspection_passed     BOOLEAN      NOT NULL DEFAULT FALSE,
    vehicle_inspection_notes      TEXT,
    final_verification_passed     BOOLEAN      NOT NULL DEFAULT FALSE,
    
    verifier_employee_id          UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,
    photo_reference_hook          VARCHAR(255),
    
    departure_approved            BOOLEAN      NOT NULL DEFAULT FALSE,
    departure_approved_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    departure_approved_at_utc     TIMESTAMPTZ,

    created_at_utc                TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_dispatch_ver_task UNIQUE (dispatch_loading_task_id)
);

COMMENT ON TABLE wms.dispatch_verification IS 
    '[OPERATIONAL] Dispatch checklist registers verifying vehicle safety, final pallet check, verifiers, and approvals.';

-- 12.10 Warehouse KPIs Analytics Snapshot
CREATE TABLE wms.warehouse_kpis_snapshot (
    id                    UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    recorded_date         DATE          NOT NULL DEFAULT CURRENT_DATE,
    warehouse_id          UUID          NOT NULL REFERENCES warehouse.warehouses(id) ON DELETE CASCADE,
    
    receiving_kpi_score   NUMERIC(5,2),
    putaway_kpi_score     NUMERIC(5,2),
    picking_kpi_score     NUMERIC(5,2),
    packing_kpi_score     NUMERIC(5,2),
    loading_kpi_score     NUMERIC(5,2),
    
    calculation_version   INT           NOT NULL DEFAULT 1,
    aggregation_period    VARCHAR(50)   NOT NULL DEFAULT 'DAILY', -- DAILY, WEEKLY, MONTHLY
    calculation_source    VARCHAR(100)  NOT NULL DEFAULT 'SYSTEM_BATCH',
    execution_timestamp   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    created_at_utc        TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_wms_kpi_snapshot UNIQUE (recorded_date, warehouse_id, calculation_version),
    CONSTRAINT chk_wms_kpi_calc_ver CHECK (calculation_version >= 1),
    CONSTRAINT chk_wms_kpi_period CHECK (aggregation_period IN ('DAILY', 'WEEKLY', 'MONTHLY'))
);

COMMENT ON TABLE wms.warehouse_kpis_snapshot IS 
    '[HISTORY] Aggregated daily warehouse scores auditing operational metrics.';

-- =============================================================================
-- SECTION 13 — INDEX STRATEGY (B-TREE FOREIGNS & COMPOSITE COVERING)
-- =============================================================================

-- 13.1 B-Tree Indexes on all Foreign Keys
CREATE INDEX idx_tasks_warehouse_fk            ON wms.warehouse_tasks (warehouse_id);
CREATE INDEX idx_tasks_type_fk                 ON wms.warehouse_tasks (task_type_id);
CREATE INDEX idx_tasks_status_fk               ON wms.warehouse_tasks (task_status_id);
CREATE INDEX idx_tasks_priority_fk             ON wms.warehouse_tasks (priority_id);
CREATE INDEX idx_tasks_employee_fk             ON wms.warehouse_tasks (assigned_employee_id);

CREATE INDEX idx_dep_predecessor_fk            ON wms.task_dependencies (predecessor_task_id);
CREATE INDEX idx_dep_successor_fk              ON wms.task_dependencies (successor_task_id);

CREATE INDEX idx_recv_sess_warehouse_fk        ON wms.receiving_sessions (warehouse_id);
CREATE INDEX idx_recv_sess_appt_fk             ON wms.receiving_sessions (receiving_appointment_id);
CREATE INDEX idx_recv_sess_dock_fk             ON wms.receiving_sessions (dock_location_id);

CREATE INDEX idx_recv_task_sess_fk             ON wms.receiving_tasks (receiving_session_id);
CREATE INDEX idx_recv_task_wtask_fk            ON wms.receiving_tasks (warehouse_task_id);
CREATE INDEX idx_recv_task_product_fk          ON wms.receiving_tasks (product_id);
CREATE INDEX idx_recv_task_bin_fk              ON wms.receiving_tasks (temp_holding_bin_id);

CREATE INDEX idx_recv_excep_task_fk            ON wms.receiving_exceptions (receiving_task_id);

CREATE INDEX idx_putaway_task_fk               ON wms.putaway_tasks (warehouse_task_id);
CREATE INDEX idx_putaway_status_fk             ON wms.putaway_tasks (putaway_status_id);
CREATE INDEX idx_putaway_item_fk               ON wms.putaway_tasks (inventory_item_id);
CREATE INDEX idx_putaway_source_bin_fk         ON wms.putaway_tasks (source_bin_id);
CREATE INDEX idx_putaway_sugg_bin_fk           ON wms.putaway_tasks (suggested_bin_id);
CREATE INDEX idx_putaway_dest_bin_fk           ON wms.putaway_tasks (destination_bin_id);

CREATE INDEX idx_bin_lock_loc_fk               ON wms.bin_locks (storage_location_id);
CREATE INDEX idx_bin_lock_user_fk              ON wms.bin_locks (locked_by_user_id);
CREATE INDEX idx_bin_lock_rel_user_fk          ON wms.bin_locks (released_by_user_id);

CREATE INDEX idx_bin_cap_loc_fk                ON wms.bin_capacity_monitoring (storage_location_id);

CREATE INDEX idx_pick_wave_warehouse_fk        ON wms.pick_waves (warehouse_id);

CREATE INDEX idx_pick_batch_wave_fk            ON wms.pick_batches (pick_wave_id);
CREATE INDEX idx_pick_batch_zone_fk            ON wms.pick_batches (zone_id);

CREATE INDEX idx_pick_task_batch_fk            ON wms.pick_tasks (pick_batch_id);
CREATE INDEX idx_pick_task_wtask_fk            ON wms.pick_tasks (warehouse_task_id);
CREATE INDEX idx_pick_task_status_fk           ON wms.pick_tasks (pick_status_id);
CREATE INDEX idx_pick_task_item_fk             ON wms.pick_tasks (inventory_item_id);
CREATE INDEX idx_pick_task_source_bin_fk       ON wms.pick_tasks (source_bin_id);
CREATE INDEX idx_pick_task_staging_bin_fk      ON wms.pick_tasks (staging_bin_id);

CREATE INDEX idx_pick_excep_task_fk            ON wms.pick_exceptions (pick_task_id);

CREATE INDEX idx_pack_sess_warehouse_fk        ON wms.packing_sessions (warehouse_id);
CREATE INDEX idx_pack_sess_status_fk           ON wms.packing_sessions (pack_status_id);
CREATE INDEX idx_pack_sess_table_fk            ON wms.packing_sessions (packing_table_bin_id);
CREATE INDEX idx_pack_sess_material_fk         ON wms.packing_sessions (packaging_material_id);
CREATE INDEX idx_pack_sess_user_fk             ON wms.packing_sessions (verified_by_user_id);

CREATE INDEX idx_pack_lines_sess_fk            ON wms.packing_lines (packing_session_id);
CREATE INDEX idx_pack_lines_task_fk            ON wms.packing_lines (pick_task_id);

CREATE INDEX idx_replenish_wtask_fk            ON wms.replenishment_tasks (warehouse_task_id);
CREATE INDEX idx_replenish_status_fk           ON wms.replenishment_tasks (replenishment_status_id);
CREATE INDEX idx_replenish_product_fk          ON wms.replenishment_tasks (product_id);
CREATE INDEX idx_replenish_source_bin_fk       ON wms.replenishment_tasks (source_bin_id);
CREATE INDEX idx_replenish_dest_bin_fk         ON wms.replenishment_tasks (destination_bin_id);

CREATE INDEX idx_count_plan_warehouse_fk       ON wms.cycle_count_plans (warehouse_id);

CREATE INDEX idx_count_task_plan_fk            ON wms.cycle_count_tasks (cycle_count_plan_id);
CREATE INDEX idx_count_task_wtask_fk           ON wms.cycle_count_tasks (warehouse_task_id);
CREATE INDEX idx_count_task_status_fk          ON wms.cycle_count_tasks (count_status_id);
CREATE INDEX idx_count_task_loc_fk             ON wms.cycle_count_tasks (storage_location_id);

CREATE INDEX idx_count_res_task_fk             ON wms.cycle_count_results (cycle_count_task_id);
CREATE INDEX idx_count_res_item_fk             ON wms.cycle_count_results (inventory_item_id);
CREATE INDEX idx_count_res_reason_fk           ON wms.cycle_count_results (variance_reason_id);
CREATE INDEX idx_count_res_user_fk             ON wms.cycle_count_results (approved_by_user_id);

CREATE INDEX idx_adjust_warehouse_fk           ON wms.stock_adjustments (warehouse_id);
CREATE INDEX idx_adjust_item_fk                ON wms.stock_adjustments (inventory_item_id);
CREATE INDEX idx_adjust_loc_fk                 ON wms.stock_adjustments (storage_location_id);
CREATE INDEX idx_adjust_reason_fk              ON wms.stock_adjustments (adjustment_reason_id);
CREATE INDEX idx_adjust_user_fk                ON wms.stock_adjustments (approved_by_user_id);

CREATE INDEX idx_dispatch_wtask_fk             ON wms.dispatch_loading_tasks (warehouse_task_id);
CREATE INDEX idx_dispatch_dock_fk              ON wms.dispatch_loading_tasks (dock_location_id);
CREATE INDEX idx_dispatch_pack_fk              ON wms.dispatch_loading_tasks (packing_session_id);
CREATE INDEX idx_dispatch_user_fk              ON wms.dispatch_loading_tasks (verified_by_user_id);

-- v2.0 Indexes
CREATE INDEX idx_timeline_warehouse_fk         ON wms.warehouse_event_timeline (warehouse_id);
CREATE INDEX idx_timeline_employee_fk          ON wms.warehouse_event_timeline (employee_id);

CREATE INDEX idx_equip_hist_equip_fk           ON wms.equipment_assignment_history (equipment_id);
CREATE INDEX idx_equip_hist_employee_fk        ON wms.equipment_assignment_history (operator_employee_id);

CREATE INDEX idx_labor_hist_employee_fk        ON wms.labor_assignment_history (employee_id);
CREATE INDEX idx_labor_hist_task_fk            ON wms.labor_assignment_history (warehouse_task_id);
CREATE INDEX idx_labor_hist_super_fk           ON wms.labor_assignment_history (supervisor_employee_id);

CREATE INDEX idx_dock_hist_dock_fk             ON wms.dock_occupancy_history (dock_location_id);
CREATE INDEX idx_dock_hist_session_fk          ON wms.dock_occupancy_history (receiving_session_id);

CREATE INDEX idx_excep_reg_warehouse_fk        ON wms.warehouse_exception_registry (warehouse_id);
CREATE INDEX idx_excep_reg_reporter_fk         ON wms.warehouse_exception_registry (reported_by_employee_id);
CREATE INDEX idx_excep_reg_owner_fk            ON wms.warehouse_exception_registry (owner_employee_id);

CREATE INDEX idx_lifecycle_hist_task_fk        ON wms.task_lifecycle_history (warehouse_task_id);
CREATE INDEX idx_lifecycle_hist_status_fk      ON wms.task_lifecycle_history (task_status_id);
CREATE INDEX idx_lifecycle_hist_user_fk        ON wms.task_lifecycle_history (changed_by_user_id);

CREATE INDEX idx_sla_task_fk                   ON wms.sla_monitoring (warehouse_task_id);

CREATE INDEX idx_cap_snap_warehouse_fk         ON wms.daily_capacity_snapshots (warehouse_id);
CREATE INDEX idx_cap_snap_zone_fk              ON wms.daily_capacity_snapshots (zone_id);
CREATE INDEX idx_cap_snap_loc_fk               ON wms.daily_capacity_snapshots (storage_location_id);

CREATE INDEX idx_dispatch_ver_task_fk          ON wms.dispatch_verification (dispatch_loading_task_id);
CREATE INDEX idx_dispatch_ver_verifier_fk      ON wms.dispatch_verification (verifier_employee_id);
CREATE INDEX idx_dispatch_ver_user_fk          ON wms.dispatch_verification (departure_approved_by_user_id);

CREATE INDEX idx_wms_kpi_warehouse_fk          ON wms.warehouse_kpis_snapshot (warehouse_id);

-- 13.2 Composite Indexes (Covering filter queries)
CREATE INDEX idx_tasks_queue_comp              ON wms.warehouse_tasks (warehouse_id, task_status_id, priority_id);
CREATE INDEX idx_putaway_override_comp         ON wms.putaway_tasks (source_bin_id, is_override);
CREATE INDEX idx_count_variance_comp           ON wms.cycle_count_results (cycle_count_task_id, is_approved);
CREATE INDEX idx_capacity_daily_comp           ON wms.daily_capacity_snapshots (snapshot_date, warehouse_id, zone_id);

-- 13.3 Partial Indexes (Optimizing active/hot records)
CREATE INDEX idx_tasks_active_in_progress      ON wms.warehouse_tasks (warehouse_id) WHERE task_status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80e1'; -- references active IN_PROGRESS ID
CREATE INDEX idx_bin_locks_active              ON wms.bin_locks (storage_location_id) WHERE is_active = TRUE;
CREATE INDEX idx_pick_wave_unreleased          ON wms.pick_waves (warehouse_id) WHERE is_released = FALSE;
CREATE INDEX idx_recv_exception_pending        ON wms.receiving_exceptions (receiving_task_id) WHERE action_taken IS NULL;
CREATE INDEX idx_bin_remaining_weight_low      ON wms.bin_capacity_monitoring (storage_location_id) WHERE remaining_weight_kg < 50.0000;
CREATE INDEX idx_sla_breached_tasks            ON wms.sla_monitoring (warehouse_task_id) WHERE is_breached = TRUE;
CREATE INDEX idx_exceptions_unresolved         ON wms.warehouse_exception_registry (warehouse_id) WHERE resolved_at_utc IS NULL;
