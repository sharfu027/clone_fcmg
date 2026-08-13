-- =============================================================================
-- INK FMCG ENTERPRISE ERP — WAREHOUSE MASTER MODULE DDL SCHEMA (v16.4 FINAL)
-- Target Engine  : PostgreSQL 16+
-- Schema         : warehouse
-- PK Strategy    : UUID v7 via iam.uuid_generate_v7()
-- Concurrency    : row_version (Optimistic Concurrency Control)
-- Extensions     : pg_trgm, btree_gist, ltree (inherited from product schema)
-- Frozen Deps    : iam v1.0, organization v1.0, employee v1.0, product v1.0
-- Status         : PRODUCTION FOUNDATION — Inventory, Procurement, Sales, Logistics
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS warehouse;

COMMENT ON SCHEMA warehouse IS
  'Enterprise Warehouse Master Module. Permanent master data for warehouses, storage '
  'hierarchy (Building→Floor→Zone→Aisle→Rack→Shelf→Bin→Slot), operational areas, '
  'equipment registry, safety compliance, capacity management, business rules, and '
  'temperature zone management. Foundation for Inventory, Procurement, Sales, '
  'Transfers, Returns, Manufacturing, and Logistics modules.';

-- =============================================================================
-- SECTION 1 — NORMALIZED LOOKUP MASTER TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 Warehouse Types
-- ---------------------------------------------------------------------------
CREATE TABLE warehouse.warehouse_types (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
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

    CONSTRAINT uq_warehouse_types_code  UNIQUE (code),
    CONSTRAINT chk_warehouse_types_code CHECK (length(trim(code)) > 0)
);

COMMENT ON TABLE  warehouse.warehouse_types             IS 'Configurable warehouse type master (DistributionCenter, RegionalWarehouse, LocalWarehouse, ColdStorage, TransitWarehouse, FulfillmentCenter, ManufacturingWarehouse, ReturnsWarehouse, CrossDock, VirtualWarehouse).';
COMMENT ON COLUMN warehouse.warehouse_types.code        IS 'Immutable business key. Alphanumeric + underscore, no spaces.';
COMMENT ON COLUMN warehouse.warehouse_types.display_order IS 'UI sort order in warehouse type selection lists.';

-- ---------------------------------------------------------------------------
-- 1.2 Warehouse Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE warehouse.warehouse_statuses (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
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

    CONSTRAINT uq_warehouse_statuses_code  UNIQUE (code),
    CONSTRAINT chk_warehouse_statuses_code CHECK (length(trim(code)) > 0)
);

COMMENT ON TABLE warehouse.warehouse_statuses IS 'Lookup master for warehouse operational statuses (Draft, Active, Inactive, Maintenance, Closed, Archived).';

-- ---------------------------------------------------------------------------
-- 1.3 Storage Location Types
-- ---------------------------------------------------------------------------
CREATE TABLE warehouse.storage_location_types (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order            INT          NOT NULL DEFAULT 1,
    allow_mixed_sku          BOOLEAN      NOT NULL DEFAULT TRUE,
    allow_mixed_batch        BOOLEAN      NOT NULL DEFAULT TRUE,
    allow_mixed_serial       BOOLEAN      NOT NULL DEFAULT TRUE,
    require_inspection       BOOLEAN      NOT NULL DEFAULT FALSE,

    row_version              INT          NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_storage_location_types_code UNIQUE (code)
);

COMMENT ON TABLE  warehouse.storage_location_types                    IS 'Configurable storage location type master (Receiving, QualityInspection, AvailableStock, ReserveStorage, BulkStorage, PickingArea, PackingArea, Dispatch, Returns, Quarantine, DamagedGoods, HazardousStorage, ColdStorage, FrozenStorage, CrossDock, Virtual).';
COMMENT ON COLUMN warehouse.storage_location_types.allow_mixed_sku    IS 'Whether this location type permits multiple different SKUs stored together.';
COMMENT ON COLUMN warehouse.storage_location_types.require_inspection  IS 'Whether inventory placed in this location type requires QC inspection before use.';

-- ---------------------------------------------------------------------------
-- 1.4 Temperature Zones
-- ---------------------------------------------------------------------------
CREATE TABLE warehouse.temperature_zones (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)   NOT NULL,
    name                     VARCHAR(100)  NOT NULL,
    description              TEXT,
    min_temp_celsius         NUMERIC(6,2),
    max_temp_celsius         NUMERIC(6,2),
    monitoring_required      BOOLEAN       NOT NULL DEFAULT FALSE,
    alert_threshold_celsius  NUMERIC(6,2),
    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,
    display_order            INT           NOT NULL DEFAULT 1,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_temperature_zones_code         UNIQUE (code),
    CONSTRAINT chk_temp_zone_range               CHECK (
        min_temp_celsius IS NULL OR max_temp_celsius IS NULL OR
        min_temp_celsius <= max_temp_celsius
    ),
    CONSTRAINT chk_temp_zone_min_realistic       CHECK (min_temp_celsius IS NULL OR min_temp_celsius >= -100),
    CONSTRAINT chk_temp_zone_max_realistic       CHECK (max_temp_celsius IS NULL OR max_temp_celsius <= 100),
    CONSTRAINT chk_temp_zone_alert_realistic     CHECK (alert_threshold_celsius IS NULL OR
        (alert_threshold_celsius >= -100 AND alert_threshold_celsius <= 100))
);

COMMENT ON TABLE  warehouse.temperature_zones                       IS 'Storage temperature zone master (Ambient, Cold 2–8°C, Frozen −18°C, UltraCold −80°C, Controlled, Hazardous). Referenced by storage locations and product storage condition matching.';
COMMENT ON COLUMN warehouse.temperature_zones.min_temp_celsius      IS 'Lower operational temperature bound in °C. NULL = unrestricted lower bound.';
COMMENT ON COLUMN warehouse.temperature_zones.max_temp_celsius      IS 'Upper operational temperature bound in °C. NULL = unrestricted upper bound.';
COMMENT ON COLUMN warehouse.temperature_zones.monitoring_required   IS 'TRUE for zones requiring continuous temperature telemetry (IoT/sensor integration).';
COMMENT ON COLUMN warehouse.temperature_zones.alert_threshold_celsius IS 'Temperature deviation threshold (°C) that triggers an alert event.';

-- ---------------------------------------------------------------------------
-- 1.5 Storage Policies
-- ---------------------------------------------------------------------------
CREATE TABLE warehouse.storage_policies (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
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

    CONSTRAINT uq_storage_policies_code UNIQUE (code)
);

COMMENT ON TABLE warehouse.storage_policies IS 'Lookup master for inventory management and picking strategies (FIFO, FEFO, LIFO, BatchPicking, SerialPicking, ZonePicking, WavePicking, ClusterPicking).';

-- ---------------------------------------------------------------------------
-- 1.6 Operational Area Types
-- ---------------------------------------------------------------------------
CREATE TABLE warehouse.operational_area_types (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
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

    CONSTRAINT uq_operational_area_types_code UNIQUE (code)
);

COMMENT ON TABLE warehouse.operational_area_types IS 'Configurable warehouse operational area type master (Receiving, Inspection, Packing, Dispatch, Returns, Repair, Quarantine, CrossDock, Quality, Administration, ChargingStation, StagingArea).';

-- ---------------------------------------------------------------------------
-- 1.7 Equipment Types
-- ---------------------------------------------------------------------------
CREATE TABLE warehouse.equipment_types (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    requires_certification   BOOLEAN      NOT NULL DEFAULT FALSE,
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

    CONSTRAINT uq_equipment_types_code UNIQUE (code)
);

COMMENT ON TABLE  warehouse.equipment_types                          IS 'Warehouse equipment type master (Forklift, ReachTruck, HandPallet, Conveyor, AGV, ASRS, Crane, MobileScanner, RFIDReader).';
COMMENT ON COLUMN warehouse.equipment_types.requires_certification   IS 'TRUE for equipment types requiring operator licensing/certification (e.g. Forklift, Crane).';

-- ---------------------------------------------------------------------------
-- 1.8 Equipment Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE warehouse.equipment_statuses (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order            INT          NOT NULL DEFAULT 1,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_equipment_statuses_code UNIQUE (code)
);

COMMENT ON TABLE warehouse.equipment_statuses IS 'Equipment operational status master (Active, InMaintenance, OutOfService, Retired, Reserved).';

-- ---------------------------------------------------------------------------
-- 1.9 Storage Location Levels (Hierarchy Level Master)
-- ---------------------------------------------------------------------------
CREATE TABLE warehouse.storage_location_levels (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(30)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    level_rank               INT          NOT NULL,
    description              TEXT,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_storage_location_levels_code UNIQUE (code),
    CONSTRAINT uq_storage_location_levels_rank UNIQUE (level_rank),
    CONSTRAINT chk_storage_location_levels_rank CHECK (level_rank BETWEEN 1 AND 9)
);

COMMENT ON TABLE  warehouse.storage_location_levels            IS 'Hierarchy level master defining each tier of the storage structure. Rank 1=Warehouse, 2=Building, 3=Floor, 4=Zone, 5=Aisle, 6=Rack, 7=Shelf, 8=Bin, 9=Slot.';
COMMENT ON COLUMN warehouse.storage_location_levels.level_rank IS 'Position in hierarchy. 1 = top (Warehouse), 9 = leaf (Slot). Must be unique and between 1 and 9.';

-- =============================================================================
-- SECTION 2 — WAREHOUSE MASTER
-- =============================================================================

CREATE TABLE warehouse.warehouses (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),

    -- Organization Linkage
    company_id               UUID          NOT NULL,
    business_unit_id         UUID,
    branch_id                UUID,

    -- Identity
    warehouse_code           VARCHAR(30)   NOT NULL,
    warehouse_name           VARCHAR(200)  NOT NULL,
    short_name               VARCHAR(50)   NOT NULL,
    description              TEXT,

    -- Classification
    warehouse_type_id        UUID          NOT NULL,
    warehouse_status_id      UUID          NOT NULL,
    default_storage_policy_id UUID,

    -- Operational Flags
    is_primary               BOOLEAN       NOT NULL DEFAULT FALSE,
    is_default               BOOLEAN       NOT NULL DEFAULT FALSE,
    is_virtual               BOOLEAN       NOT NULL DEFAULT FALSE,
    is_bonded                BOOLEAN       NOT NULL DEFAULT FALSE, -- Bonded customs warehouse
    is_cold_chain            BOOLEAN       NOT NULL DEFAULT FALSE,

    -- Localization
    timezone                 VARCHAR(100)  NOT NULL DEFAULT 'UTC',
    currency_code            VARCHAR(10)   NOT NULL DEFAULT 'INR',
    language_code            VARCHAR(10)   NOT NULL DEFAULT 'en',

    -- Physical Address
    address_line1            VARCHAR(200),
    address_line2            VARCHAR(200),
    city                     VARCHAR(100),
    state_id                 UUID,
    country_id               UUID          NOT NULL,
    postal_code              VARCHAR(20),

    -- Geo Coordinates
    latitude                 NUMERIC(10,7),
    longitude                NUMERIC(10,7),
    geo_fence_radius_meters  INT,

    -- Contact
    phone                    VARCHAR(30),
    email                    VARCHAR(200),
    manager_employee_id      UUID,          -- References employee.employees(id) — future join

    -- Operational Capacity Summary (denormalized summary — detail in warehouse_capacity)
    total_area_sqm           NUMERIC(12,2),
    usable_area_sqm          NUMERIC(12,2),

    -- Regulatory
    gst_registration_number  VARCHAR(30),
    customs_bonded_number    VARCHAR(50),
    fssai_license_number     VARCHAR(30),

    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_warehouses_company      FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouses_bu           FOREIGN KEY (business_unit_id)
        REFERENCES organization.business_units(id) ON DELETE SET NULL,
    CONSTRAINT fk_warehouses_branch       FOREIGN KEY (branch_id)
        REFERENCES organization.branches(id) ON DELETE SET NULL,
    CONSTRAINT fk_warehouses_type         FOREIGN KEY (warehouse_type_id)
        REFERENCES warehouse.warehouse_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouses_status       FOREIGN KEY (warehouse_status_id)
        REFERENCES warehouse.warehouse_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouses_policy       FOREIGN KEY (default_storage_policy_id)
        REFERENCES warehouse.storage_policies(id) ON DELETE SET NULL,
    CONSTRAINT fk_warehouses_state        FOREIGN KEY (state_id)
        REFERENCES organization.states(id) ON DELETE SET NULL,
    CONSTRAINT fk_warehouses_country      FOREIGN KEY (country_id)
        REFERENCES organization.countries(id) ON DELETE RESTRICT,

    CONSTRAINT uq_warehouses_code         UNIQUE (company_id, warehouse_code),

    -- Physical validation
    CONSTRAINT chk_warehouses_geo_lat     CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
    CONSTRAINT chk_warehouses_geo_lon     CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_warehouses_geofence    CHECK (geo_fence_radius_meters IS NULL OR geo_fence_radius_meters > 0),
    CONSTRAINT chk_warehouses_total_area  CHECK (total_area_sqm  IS NULL OR total_area_sqm  > 0),
    CONSTRAINT chk_warehouses_usable_area CHECK (usable_area_sqm IS NULL OR usable_area_sqm > 0),
    CONSTRAINT chk_warehouses_area_ratio  CHECK (
        usable_area_sqm IS NULL OR total_area_sqm IS NULL OR
        usable_area_sqm <= total_area_sqm
    )
);

COMMENT ON TABLE  warehouse.warehouses                       IS 'Core warehouse master entity. Foundation for all inventory, procurement, sales, and logistics transactions. Every stock movement, purchase order receipt, sales dispatch, and transfer references a warehouse row.';
COMMENT ON COLUMN warehouse.warehouses.warehouse_code        IS 'Unique alphanumeric code per company. Used on all transaction documents (PO, SO, GRN, DN).';
COMMENT ON COLUMN warehouse.warehouses.is_primary            IS 'TRUE for the primary warehouse of a company/branch. Only one per company should be primary.';
COMMENT ON COLUMN warehouse.warehouses.is_virtual            IS 'TRUE for virtual warehouses used for in-transit or FG-in-production inventory tracking (no physical location).';
COMMENT ON COLUMN warehouse.warehouses.is_bonded             IS 'TRUE for customs bonded warehouses. Triggers additional regulatory controls.';
COMMENT ON COLUMN warehouse.warehouses.timezone              IS 'IANA timezone identifier (e.g. Asia/Kolkata). Used for operating hours and date-based reporting.';
COMMENT ON COLUMN warehouse.warehouses.geo_fence_radius_meters IS 'Geofence radius in metres for mobile app location verification during stock operations.';
COMMENT ON COLUMN warehouse.warehouses.manager_employee_id   IS 'References employee.employees(id). Populated once Employee module is integrated. Stored as UUID for forward-compatibility.';
COMMENT ON COLUMN warehouse.warehouses.latitude              IS 'GPS latitude of warehouse centroid. Range: -90 to 90.';
COMMENT ON COLUMN warehouse.warehouses.longitude             IS 'GPS longitude of warehouse centroid. Range: -180 to 180.';
COMMENT ON COLUMN warehouse.warehouses.gst_registration_number IS 'GSTIN of the warehouse site for tax compliance and e-way bill generation.';
COMMENT ON COLUMN warehouse.warehouses.row_version           IS 'Optimistic concurrency token. Application must increment on every UPDATE.';

-- =============================================================================
-- SECTION 3 — WAREHOUSE CAPACITY
-- =============================================================================

CREATE TABLE warehouse.warehouse_capacity (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id             UUID          NOT NULL,

    max_weight_kg            NUMERIC(15,2),
    max_volume_cbm           NUMERIC(15,4),
    max_pallet_positions     INT,
    max_bin_locations        INT,
    max_sku_count            INT,

    current_utilization_pct  NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
    reserved_pct             NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
    available_pct            NUMERIC(5,2)  GENERATED ALWAYS AS (
        GREATEST(0, 100.00 - current_utilization_pct - reserved_pct)
    ) STORED,

    last_calculated_at_utc   TIMESTAMPTZ,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_wh_capacity_warehouse  FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE CASCADE,
    CONSTRAINT uq_wh_capacity_warehouse  UNIQUE (warehouse_id),

    CONSTRAINT chk_wh_cap_weight         CHECK (max_weight_kg          IS NULL OR max_weight_kg          > 0),
    CONSTRAINT chk_wh_cap_volume         CHECK (max_volume_cbm         IS NULL OR max_volume_cbm         > 0),
    CONSTRAINT chk_wh_cap_pallets        CHECK (max_pallet_positions   IS NULL OR max_pallet_positions   > 0),
    CONSTRAINT chk_wh_cap_bins           CHECK (max_bin_locations      IS NULL OR max_bin_locations      > 0),
    CONSTRAINT chk_wh_cap_skus           CHECK (max_sku_count          IS NULL OR max_sku_count          > 0),
    CONSTRAINT chk_wh_cap_utilization    CHECK (current_utilization_pct BETWEEN 0 AND 100),
    CONSTRAINT chk_wh_cap_reserved       CHECK (reserved_pct            BETWEEN 0 AND 100),
    CONSTRAINT chk_wh_cap_combined       CHECK ((current_utilization_pct + reserved_pct) <= 100)
);

COMMENT ON TABLE  warehouse.warehouse_capacity                      IS 'Physical capacity master per warehouse. Available% is auto-computed (GENERATED ALWAYS AS). Regularly refreshed by inventory reconciliation jobs.';
COMMENT ON COLUMN warehouse.warehouse_capacity.available_pct        IS 'Generated column: GREATEST(0, 100 - utilization% - reserved%). Read-only; maintained by PostgreSQL.';
COMMENT ON COLUMN warehouse.warehouse_capacity.current_utilization_pct IS 'Percentage of capacity currently occupied. Updated by inventory jobs. Range: 0–100.';
COMMENT ON COLUMN warehouse.warehouse_capacity.last_calculated_at_utc IS 'Timestamp of the last capacity recalculation job. NULL = never calculated.';

-- =============================================================================
-- SECTION 4 — WAREHOUSE OPERATING HOURS
-- =============================================================================

CREATE TABLE warehouse.warehouse_operating_hours (
    id                       UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id             UUID        NOT NULL,
    day_of_week              SMALLINT    NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
    is_open                  BOOLEAN     NOT NULL DEFAULT TRUE,
    open_time                TIME,
    close_time               TIME,
    break_start_time         TIME,
    break_end_time           TIME,
    remarks                  VARCHAR(200),

    row_version              INT         NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID        REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_wh_hours_warehouse   FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE CASCADE,
    CONSTRAINT uq_wh_hours_day         UNIQUE (warehouse_id, day_of_week),
    CONSTRAINT chk_wh_hours_day        CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT chk_wh_hours_times      CHECK (
        (is_open = FALSE) OR (open_time IS NOT NULL AND close_time IS NOT NULL)
    ),
    CONSTRAINT chk_wh_hours_time_range CHECK (
        open_time IS NULL OR close_time IS NULL OR open_time < close_time
    ),
    CONSTRAINT chk_wh_hours_break      CHECK (
        break_start_time IS NULL OR break_end_time IS NULL OR
        break_start_time < break_end_time
    )
);

COMMENT ON TABLE  warehouse.warehouse_operating_hours             IS 'Weekly operating schedule per warehouse. One row per day (0=Sunday through 6=Saturday). Used for delivery scheduling, receiving windows, and SLA calculations.';
COMMENT ON COLUMN warehouse.warehouse_operating_hours.day_of_week IS 'ISO weekday: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday.';
COMMENT ON COLUMN warehouse.warehouse_operating_hours.is_open     IS 'FALSE for closed days (e.g. Sunday). open_time and close_time are ignored when FALSE.';

-- =============================================================================
-- SECTION 5 — WAREHOUSE BUSINESS RULES
-- =============================================================================

CREATE TABLE warehouse.warehouse_business_rules (
    id                           UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id                 UUID        NOT NULL,

    -- Inventory Rules
    allow_negative_inventory     BOOLEAN     NOT NULL DEFAULT FALSE,
    allow_mixed_sku              BOOLEAN     NOT NULL DEFAULT TRUE,
    allow_mixed_batch            BOOLEAN     NOT NULL DEFAULT TRUE,
    allow_mixed_serial           BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Compliance Rules
    require_barcode_scan         BOOLEAN     NOT NULL DEFAULT TRUE,
    require_rfid                 BOOLEAN     NOT NULL DEFAULT FALSE,
    require_approval_for_dispatch BOOLEAN    NOT NULL DEFAULT FALSE,
    require_quality_inspection   BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Automation Rules
    auto_allocation_enabled      BOOLEAN     NOT NULL DEFAULT FALSE,
    cycle_count_enabled          BOOLEAN     NOT NULL DEFAULT TRUE,
    auto_replenishment_enabled   BOOLEAN     NOT NULL DEFAULT FALSE,
    wave_picking_enabled         BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Picking Rules
    default_storage_policy_id   UUID,

    -- Threshold Rules
    low_stock_alert_pct          NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    overstock_alert_pct          NUMERIC(5,2) NOT NULL DEFAULT 90.00,
    cycle_count_frequency_days   INT          NOT NULL DEFAULT 30,

    row_version              INT          NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_wh_rules_warehouse  FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE CASCADE,
    CONSTRAINT fk_wh_rules_policy     FOREIGN KEY (default_storage_policy_id)
        REFERENCES warehouse.storage_policies(id) ON DELETE SET NULL,
    CONSTRAINT uq_wh_rules_warehouse  UNIQUE (warehouse_id),
    CONSTRAINT chk_wh_rules_low_stock       CHECK (low_stock_alert_pct  BETWEEN 0 AND 100),
    CONSTRAINT chk_wh_rules_overstock       CHECK (overstock_alert_pct  BETWEEN 0 AND 100),
    CONSTRAINT chk_wh_rules_stock_thresholds CHECK (low_stock_alert_pct < overstock_alert_pct),
    CONSTRAINT chk_wh_rules_cycle_freq       CHECK (cycle_count_frequency_days > 0)
);

COMMENT ON TABLE  warehouse.warehouse_business_rules                     IS 'Warehouse-level configurable business rules governing inventory management, compliance enforcement, automation flags, and alert thresholds. One row per warehouse.';
COMMENT ON COLUMN warehouse.warehouse_business_rules.allow_negative_inventory IS 'If FALSE, system blocks stock movements that would result in negative on-hand quantities.';
COMMENT ON COLUMN warehouse.warehouse_business_rules.require_barcode_scan     IS 'If TRUE, all GRN and dispatch transactions require a physical barcode scan confirmation.';
COMMENT ON COLUMN warehouse.warehouse_business_rules.cycle_count_frequency_days IS 'Number of days between mandatory cycle counts. Must be > 0.';
COMMENT ON COLUMN warehouse.warehouse_business_rules.low_stock_alert_pct      IS 'Inventory utilization percentage below which a low-stock alert is triggered. Must be < overstock_alert_pct.';

-- =============================================================================
-- SECTION 6 — STORAGE LOCATION HIERARCHY
--
-- ARCHITECTURE DECISION — Unified self-referencing table with LTREE path:
--   • One table covers all 9 hierarchy levels (Warehouse→Slot) without
--     requiring 9 separate tables with complex inter-table joins.
--   • LTREE materialized path enables O(depth) subtree queries without
--     recursive CTEs, making it suitable for millions of bin locations.
--   • location_level_id references the storage_location_levels master to
--     determine the tier (Building, Floor, Zone, Aisle, Rack, Shelf, Bin, Slot).
--   • Scalable to 10M+ storage locations per warehouse without redesign.
--   • CHECKs prevent self-reference at DB level; circular chains are
--     prevented at application layer (same pattern as product_categories).
-- =============================================================================

CREATE TABLE warehouse.storage_locations (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id             UUID          NOT NULL,
    parent_location_id       UUID,                    -- NULL = direct child of warehouse (Building level)
    location_level_id        UUID          NOT NULL,  -- References storage_location_levels
    location_type_id         UUID,                    -- References storage_location_types (relevant at Bin/Slot level)
    temperature_zone_id      UUID,

    -- Identity
    location_code            VARCHAR(50)   NOT NULL,
    location_name            VARCHAR(200)  NOT NULL,
    barcode                  VARCHAR(100),
    qr_code                  VARCHAR(200),

    -- LTREE Materialized Path for fast hierarchy traversal
    location_path            LTREE,
    -- Full human-readable path (e.g. WH-HYD/B1/F2/ZONE-A/A01/R01/S03/BIN-042)
    location_path_display    VARCHAR(500),

    -- Physical Capacity
    max_weight_kg            NUMERIC(12,4),
    max_volume_cbm           NUMERIC(12,4),
    max_pallets              INT,
    max_units                BIGINT,
    length_cm                NUMERIC(10,2),
    width_cm                 NUMERIC(10,2),
    height_cm                NUMERIC(10,2),

    -- Utilization (refreshed by inventory jobs)
    current_weight_kg        NUMERIC(12,4) NOT NULL DEFAULT 0,
    current_volume_cbm       NUMERIC(12,4) NOT NULL DEFAULT 0,
    current_pallet_count     INT           NOT NULL DEFAULT 0,
    utilization_pct          NUMERIC(5,2)  NOT NULL DEFAULT 0.00,

    -- Environmental
    min_humidity_pct         NUMERIC(5,2),
    max_humidity_pct         NUMERIC(5,2),

    -- Security & Access
    security_level           SMALLINT      NOT NULL DEFAULT 1, -- 1=Open, 2=Restricted, 3=High-Security, 4=Biometric

    -- Technology
    rfid_ready               BOOLEAN       NOT NULL DEFAULT FALSE,
    iot_sensor_id            VARCHAR(100),

    -- GPS
    latitude                 NUMERIC(10,7),
    longitude                NUMERIC(10,7),
    altitude_m               NUMERIC(8,2),

    -- Accessibility
    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,
    is_pickable              BOOLEAN       NOT NULL DEFAULT TRUE,  -- Available for order picking
    is_receivable            BOOLEAN       NOT NULL DEFAULT TRUE,  -- Available for GRN putaway
    is_reservable            BOOLEAN       NOT NULL DEFAULT TRUE,  -- Can be reserved for a specific product/batch

    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_storage_loc_warehouse   FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_storage_loc_parent      FOREIGN KEY (parent_location_id)
        REFERENCES warehouse.storage_locations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_storage_loc_level       FOREIGN KEY (location_level_id)
        REFERENCES warehouse.storage_location_levels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_storage_loc_type        FOREIGN KEY (location_type_id)
        REFERENCES warehouse.storage_location_types(id) ON DELETE SET NULL,
    CONSTRAINT fk_storage_loc_temp_zone   FOREIGN KEY (temperature_zone_id)
        REFERENCES warehouse.temperature_zones(id) ON DELETE SET NULL,

    CONSTRAINT uq_storage_loc_code        UNIQUE (warehouse_id, location_code),
    CONSTRAINT uq_storage_loc_barcode     UNIQUE (barcode),

    -- Self-reference prevention
    CONSTRAINT chk_storage_loc_no_self    CHECK (id <> parent_location_id),

    -- Dimension positivity
    CONSTRAINT chk_storage_loc_weight     CHECK (max_weight_kg  IS NULL OR max_weight_kg  > 0),
    CONSTRAINT chk_storage_loc_volume     CHECK (max_volume_cbm IS NULL OR max_volume_cbm > 0),
    CONSTRAINT chk_storage_loc_pallets    CHECK (max_pallets    IS NULL OR max_pallets    > 0),
    CONSTRAINT chk_storage_loc_units      CHECK (max_units      IS NULL OR max_units      > 0),
    CONSTRAINT chk_storage_loc_length     CHECK (length_cm      IS NULL OR length_cm      > 0),
    CONSTRAINT chk_storage_loc_width      CHECK (width_cm       IS NULL OR width_cm       > 0),
    CONSTRAINT chk_storage_loc_height     CHECK (height_cm      IS NULL OR height_cm      > 0),

    -- Current utilization cannot exceed capacity
    CONSTRAINT chk_storage_loc_curr_weight CHECK (
        max_weight_kg IS NULL OR current_weight_kg <= max_weight_kg
    ),
    CONSTRAINT chk_storage_loc_curr_vol   CHECK (
        max_volume_cbm IS NULL OR current_volume_cbm <= max_volume_cbm
    ),
    CONSTRAINT chk_storage_loc_util_pct   CHECK (utilization_pct BETWEEN 0 AND 100),
    CONSTRAINT chk_storage_loc_humidity   CHECK (
        min_humidity_pct IS NULL OR max_humidity_pct IS NULL OR
        min_humidity_pct <= max_humidity_pct
    ),
    CONSTRAINT chk_storage_loc_security   CHECK (security_level BETWEEN 1 AND 4),
    CONSTRAINT chk_storage_loc_lat        CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
    CONSTRAINT chk_storage_loc_lon        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

COMMENT ON TABLE  warehouse.storage_locations                         IS 'Unified self-referencing storage hierarchy using LTREE. Covers all 9 levels: Warehouse→Building→Floor→Zone→Aisle→Rack→Shelf→Bin→Slot. Designed to scale to tens of millions of locations without DDL changes. Parent location NULL = direct child of warehouse root.';
COMMENT ON COLUMN warehouse.storage_locations.location_path           IS 'LTREE materialized path maintained by application/trigger (e.g. WH001.B1.F2.ZA.A01.R03.S05.BIN042.SL001). Enables subtree queries without recursive CTEs.';
COMMENT ON COLUMN warehouse.storage_locations.location_path_display   IS 'Human-readable full path (e.g. WH-HYD/B1/Floor-2/Zone-A/Aisle-01/Rack-03/Shelf-5/Bin-042/Slot-001).';
COMMENT ON COLUMN warehouse.storage_locations.location_level_id       IS 'References storage_location_levels to identify tier (Building=2, Floor=3, Zone=4, Aisle=5, Rack=6, Shelf=7, Bin=8, Slot=9).';
COMMENT ON COLUMN warehouse.storage_locations.security_level          IS '1=Open access, 2=Restricted, 3=High-Security (supervisor approval), 4=Biometric. Drives mobile app access control.';
COMMENT ON COLUMN warehouse.storage_locations.is_pickable             IS 'TRUE if this location is included in wave/batch picking automation.';
COMMENT ON COLUMN warehouse.storage_locations.is_reservable           IS 'TRUE if inventory planners can reserve this location for a specific SKU, product, or batch.';
COMMENT ON COLUMN warehouse.storage_locations.rfid_ready              IS 'TRUE if this location has RFID readers installed for contactless scanning.';
COMMENT ON COLUMN warehouse.storage_locations.iot_sensor_id           IS 'External IoT sensor identifier for real-time temperature/humidity monitoring feeds.';

-- =============================================================================
-- SECTION 7 — STORAGE LOCATION PRODUCT RESTRICTIONS
--
-- Defines which product types, categories, or storage conditions are
-- permitted or restricted for a specific storage location.
-- =============================================================================

CREATE TABLE warehouse.storage_location_product_rules (
    id                       UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    storage_location_id      UUID        NOT NULL,
    rule_type                VARCHAR(30) NOT NULL DEFAULT 'ALLOW',  -- ALLOW, RESTRICT, DEDICATED
    product_id               UUID,         -- References product.products(id) — specific product
    product_category_id      UUID,         -- References product.product_categories(id) — category-level
    storage_condition_code   VARCHAR(50),  -- References product.product_storage_conditions.code
    effective_from           DATE         NOT NULL DEFAULT CURRENT_DATE,
    effective_to             DATE,
    remarks                  TEXT,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_slpr_location FOREIGN KEY (storage_location_id)
        REFERENCES warehouse.storage_locations(id) ON DELETE CASCADE,
    CONSTRAINT chk_slpr_rule_type    CHECK (rule_type IN ('ALLOW','RESTRICT','DEDICATED')),
    CONSTRAINT chk_slpr_target       CHECK (
        product_id IS NOT NULL OR
        product_category_id IS NOT NULL OR
        storage_condition_code IS NOT NULL
    ),
    CONSTRAINT chk_slpr_dates        CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    )
);

COMMENT ON TABLE  warehouse.storage_location_product_rules           IS 'Configurable product placement rules per storage location. Allows ALLOW, RESTRICT, or DEDICATED mappings at product, category, or storage condition level. Drives WMS putaway algorithm.';
COMMENT ON COLUMN warehouse.storage_location_product_rules.rule_type IS 'ALLOW = explicitly permitted; RESTRICT = explicitly blocked; DEDICATED = location reserved exclusively for this product/category.';

-- =============================================================================
-- SECTION 8 — OPERATIONAL AREAS
-- =============================================================================

CREATE TABLE warehouse.warehouse_operational_areas (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id             UUID          NOT NULL,
    operational_area_type_id UUID          NOT NULL,

    area_code                VARCHAR(30)   NOT NULL,
    area_name                VARCHAR(150)  NOT NULL,
    description              TEXT,
    floor_level              VARCHAR(20),
    area_sqm                 NUMERIC(12,2),
    max_throughput_per_day   INT,

    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,
    is_automated             BOOLEAN       NOT NULL DEFAULT FALSE,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_wh_areas_warehouse  FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE CASCADE,
    CONSTRAINT fk_wh_areas_type       FOREIGN KEY (operational_area_type_id)
        REFERENCES warehouse.operational_area_types(id) ON DELETE RESTRICT,
    CONSTRAINT uq_wh_areas_code       UNIQUE (warehouse_id, area_code),
    CONSTRAINT chk_wh_areas_sqm       CHECK (area_sqm IS NULL OR area_sqm > 0),
    CONSTRAINT chk_wh_areas_throughput CHECK (max_throughput_per_day IS NULL OR max_throughput_per_day > 0)
);

COMMENT ON TABLE  warehouse.warehouse_operational_areas                 IS 'Physical operational areas within a warehouse (Receiving Dock, Inspection Bay, Packing Area, Dispatch Bay, Returns Area, Quarantine Zone, Cross-Dock Bay, Quality Lab, Admin Office, Charging Station, Staging Area).';
COMMENT ON COLUMN warehouse.warehouse_operational_areas.is_automated   IS 'TRUE for automated areas (AGV staging, ASRS zones, conveyor endpoints).';
COMMENT ON COLUMN warehouse.warehouse_operational_areas.max_throughput_per_day IS 'Maximum order/pallet processing capacity per day. Used for scheduling and bottleneck detection.';

-- =============================================================================
-- SECTION 9 — WAREHOUSE EQUIPMENT
-- =============================================================================

CREATE TABLE warehouse.warehouse_equipment (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id             UUID          NOT NULL,
    equipment_type_id        UUID          NOT NULL,
    equipment_status_id      UUID          NOT NULL,
    assigned_area_id         UUID,

    equipment_code           VARCHAR(30)   NOT NULL,
    equipment_name           VARCHAR(150)  NOT NULL,
    serial_number            VARCHAR(100),
    model_number             VARCHAR(100),
    manufacturer             VARCHAR(150),
    purchase_date            DATE,
    warranty_expiry_date     DATE,

    -- Capacity
    max_load_capacity_kg     NUMERIC(10,2),
    max_lift_height_m        NUMERIC(6,2),

    -- Maintenance
    maintenance_frequency_days INT,
    last_maintenance_date    DATE,
    next_maintenance_date    DATE,
    maintenance_vendor       VARCHAR(150),

    -- Technology
    rfid_enabled             BOOLEAN       NOT NULL DEFAULT FALSE,
    barcode_scanner_type     VARCHAR(50),
    battery_type             VARCHAR(50),
    is_automated             BOOLEAN       NOT NULL DEFAULT FALSE,

    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_wh_equip_warehouse  FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE CASCADE,
    CONSTRAINT fk_wh_equip_type       FOREIGN KEY (equipment_type_id)
        REFERENCES warehouse.equipment_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_wh_equip_status     FOREIGN KEY (equipment_status_id)
        REFERENCES warehouse.equipment_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_wh_equip_area       FOREIGN KEY (assigned_area_id)
        REFERENCES warehouse.warehouse_operational_areas(id) ON DELETE SET NULL,
    CONSTRAINT uq_wh_equip_code       UNIQUE (warehouse_id, equipment_code),
    CONSTRAINT uq_wh_equip_serial     UNIQUE (serial_number),

    CONSTRAINT chk_wh_equip_capacity  CHECK (max_load_capacity_kg IS NULL OR max_load_capacity_kg > 0),
    CONSTRAINT chk_wh_equip_lift      CHECK (max_lift_height_m    IS NULL OR max_lift_height_m    > 0),
    CONSTRAINT chk_wh_equip_maint_freq CHECK (maintenance_frequency_days IS NULL OR maintenance_frequency_days > 0),
    CONSTRAINT chk_wh_equip_maint_dates CHECK (
        last_maintenance_date IS NULL OR next_maintenance_date IS NULL OR
        next_maintenance_date >= last_maintenance_date
    )
);

COMMENT ON TABLE  warehouse.warehouse_equipment                           IS 'Warehouse equipment registry (Forklifts, Reach Trucks, Hand Pallets, AGVs, ASRS, Cranes, Mobile Scanners, RFID Readers). Tracks maintenance schedules, capacity, and assignment.';
COMMENT ON COLUMN warehouse.warehouse_equipment.next_maintenance_date     IS 'Next scheduled preventive maintenance date. Must be >= last_maintenance_date.';
COMMENT ON COLUMN warehouse.warehouse_equipment.is_automated              IS 'TRUE for fully automated equipment (AGV, ASRS, conveyor systems) managed by WMS automation layer.';

-- =============================================================================
-- SECTION 10 — SAFETY & COMPLIANCE
-- =============================================================================

CREATE TABLE warehouse.warehouse_safety_compliance (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id             UUID          NOT NULL,

    -- Fire & Emergency
    fire_zone_designation    VARCHAR(50),
    number_of_emergency_exits INT,
    fire_suppression_type    VARCHAR(50),

    -- Hazard Classification
    hazard_class             VARCHAR(50),
    un_number                VARCHAR(20),

    -- Certifications
    safety_certification_type VARCHAR(100),
    certification_body        VARCHAR(150),
    certification_number      VARCHAR(100),
    certification_date        DATE,
    certification_expiry_date DATE,

    -- Inspection
    last_inspection_date      DATE,
    next_inspection_date      DATE,
    inspection_authority      VARCHAR(150),
    inspection_result         VARCHAR(50),

    -- Compliance
    compliance_notes          TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_wh_safety_warehouse      FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE CASCADE,
    CONSTRAINT uq_wh_safety_warehouse      UNIQUE (warehouse_id),
    CONSTRAINT chk_wh_safety_exits         CHECK (number_of_emergency_exits IS NULL OR number_of_emergency_exits >= 0),
    CONSTRAINT chk_wh_safety_cert_dates    CHECK (
        certification_date IS NULL OR certification_expiry_date IS NULL OR
        certification_expiry_date >= certification_date
    ),
    CONSTRAINT chk_wh_safety_inspect_dates CHECK (
        last_inspection_date IS NULL OR next_inspection_date IS NULL OR
        next_inspection_date >= last_inspection_date
    )
);

COMMENT ON TABLE  warehouse.warehouse_safety_compliance                      IS 'Safety and regulatory compliance master per warehouse. Tracks fire zone, hazard classification, certifications, and periodic inspection records. One row per warehouse.';
COMMENT ON COLUMN warehouse.warehouse_safety_compliance.fire_zone_designation IS 'Fire zone code as per local fire authority requirements (e.g. FZ-A, FZ-B).';
COMMENT ON COLUMN warehouse.warehouse_safety_compliance.hazard_class          IS 'UN/GHS hazard classification code for hazardous goods storage areas (e.g. Class 3 Flammable, Class 8 Corrosive).';
COMMENT ON COLUMN warehouse.warehouse_safety_compliance.certification_expiry_date IS 'Safety certification expiry. Triggers renewal alerts before expiry.';

-- =============================================================================
-- SECTION 11 — WAREHOUSE STATUS HISTORY (AUDIT TRAIL)
-- =============================================================================

CREATE TABLE warehouse.warehouse_status_history (
    id                    UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    warehouse_id          UUID        NOT NULL,
    warehouse_status_id   UUID        NOT NULL,
    effective_from        DATE        NOT NULL,
    effective_to          DATE,
    is_current            BOOLEAN     NOT NULL DEFAULT TRUE,
    changed_by_user_id    UUID        REFERENCES iam.users(id) ON DELETE SET NULL,
    reason                TEXT,
    remarks               TEXT,

    created_at_utc        TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_wh_status_hist_warehouse FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE CASCADE,
    CONSTRAINT fk_wh_status_hist_status    FOREIGN KEY (warehouse_status_id)
        REFERENCES warehouse.warehouse_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT chk_wh_status_hist_dates    CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    ),

    -- No overlapping status periods per warehouse
    EXCLUDE USING GIST (
        warehouse_id WITH =,
        daterange(effective_from, COALESCE(effective_to, '9999-12-31'::DATE), '[)') WITH &&
    )
);

-- Exactly one current status per warehouse
CREATE UNIQUE INDEX uix_wh_status_hist_single_current
    ON warehouse.warehouse_status_history (warehouse_id)
    WHERE is_current = TRUE;

COMMENT ON TABLE  warehouse.warehouse_status_history             IS 'Immutable audit trail of every warehouse status change. Exclusion constraint prevents overlapping effective date ranges. Partial unique index enforces one current record per warehouse.';
COMMENT ON COLUMN warehouse.warehouse_status_history.is_current  IS 'Exactly one TRUE per warehouse_id enforced by uix_wh_status_hist_single_current.';

-- =============================================================================
-- SECTION 12 — WAREHOUSE ZONE STORAGE POLICY MAPPINGS
--
-- Maps specific storage zones/locations to specific storage policies.
-- Enables zone-level FEFO/FIFO/LIFO overrides independent of warehouse default.
-- =============================================================================

CREATE TABLE warehouse.location_storage_policy_mappings (
    id                       UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    storage_location_id      UUID        NOT NULL,
    storage_policy_id        UUID        NOT NULL,
    priority                 INT         NOT NULL DEFAULT 1,
    effective_from           DATE        NOT NULL DEFAULT CURRENT_DATE,
    effective_to             DATE,

    created_at_utc           TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID        REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_loc_policy_location FOREIGN KEY (storage_location_id)
        REFERENCES warehouse.storage_locations(id) ON DELETE CASCADE,
    CONSTRAINT fk_loc_policy_policy   FOREIGN KEY (storage_policy_id)
        REFERENCES warehouse.storage_policies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_loc_policy_pair     UNIQUE (storage_location_id, storage_policy_id),
    CONSTRAINT chk_loc_policy_priority CHECK (priority >= 1),
    CONSTRAINT chk_loc_policy_dates    CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    )
);

COMMENT ON TABLE  warehouse.location_storage_policy_mappings        IS 'Zone/location-level storage policy assignments (FIFO, FEFO, LIFO). Overrides the warehouse default policy for specific zones. Priority column resolves conflicts when multiple policies apply.';
COMMENT ON COLUMN warehouse.location_storage_policy_mappings.priority IS 'Lower number = higher priority. Used when multiple policies are mapped to the same location.';

-- =============================================================================
-- SECTION 13 — COMPLETE INDEXING STRATEGY
-- =============================================================================

-- ── WAREHOUSES ───────────────────────────────────────────────────────────────
CREATE INDEX pix_warehouses_active         ON warehouse.warehouses (id)             WHERE is_deleted = FALSE;
CREATE INDEX idx_warehouses_company_id     ON warehouse.warehouses (company_id);
CREATE INDEX idx_warehouses_bu_id          ON warehouse.warehouses (business_unit_id);
CREATE INDEX idx_warehouses_branch_id      ON warehouse.warehouses (branch_id);
CREATE INDEX idx_warehouses_type_id        ON warehouse.warehouses (warehouse_type_id);
CREATE INDEX idx_warehouses_status_id      ON warehouse.warehouses (warehouse_status_id);
CREATE INDEX idx_warehouses_country_id     ON warehouse.warehouses (country_id);
CREATE INDEX idx_warehouses_state_id       ON warehouse.warehouses (state_id);
-- Trigram for ILIKE search on warehouse name and code
CREATE INDEX trgm_warehouses_name          ON warehouse.warehouses USING GIN (warehouse_name gin_trgm_ops);
CREATE INDEX trgm_warehouses_code          ON warehouse.warehouses USING GIN (warehouse_code gin_trgm_ops);
-- Composite for active warehouse lookup by company
CREATE INDEX cidx_warehouses_company_active ON warehouse.warehouses (company_id, warehouse_status_id) WHERE is_deleted = FALSE;

-- ── WAREHOUSE CAPACITY ───────────────────────────────────────────────────────
CREATE INDEX idx_wh_capacity_warehouse_id  ON warehouse.warehouse_capacity (warehouse_id);

-- ── OPERATING HOURS ──────────────────────────────────────────────────────────
CREATE INDEX idx_wh_hours_warehouse_id     ON warehouse.warehouse_operating_hours (warehouse_id);

-- ── BUSINESS RULES ───────────────────────────────────────────────────────────
CREATE INDEX idx_wh_rules_warehouse_id     ON warehouse.warehouse_business_rules (warehouse_id);

-- ── STORAGE LOCATIONS (Core — highest query load) ────────────────────────────
-- LTREE GiST index for ancestor/descendant hierarchy queries
CREATE INDEX idx_storage_loc_path          ON warehouse.storage_locations USING GIST (location_path);
-- Partial index for active (non-deleted, is_active) locations
CREATE INDEX pix_storage_loc_active        ON warehouse.storage_locations (id) WHERE is_deleted = FALSE AND is_active = TRUE;
-- Pickable locations only (used by WMS picking algorithms)
CREATE INDEX pix_storage_loc_pickable      ON warehouse.storage_locations (warehouse_id, location_type_id)
    WHERE is_deleted = FALSE AND is_active = TRUE AND is_pickable = TRUE;
-- FK indexes
CREATE INDEX idx_storage_loc_warehouse_id  ON warehouse.storage_locations (warehouse_id);
CREATE INDEX idx_storage_loc_parent_id     ON warehouse.storage_locations (parent_location_id) WHERE parent_location_id IS NOT NULL;
CREATE INDEX idx_storage_loc_level_id      ON warehouse.storage_locations (location_level_id);
CREATE INDEX idx_storage_loc_type_id       ON warehouse.storage_locations (location_type_id);
CREATE INDEX idx_storage_loc_temp_zone_id  ON warehouse.storage_locations (temperature_zone_id);
-- Barcode scan lookup (hot path for WMS handheld)
CREATE INDEX idx_storage_loc_barcode       ON warehouse.storage_locations (barcode) WHERE barcode IS NOT NULL;
-- Utilization monitoring
CREATE INDEX idx_storage_loc_utilization   ON warehouse.storage_locations (warehouse_id, utilization_pct DESC)
    WHERE is_deleted = FALSE AND is_active = TRUE;
-- Trigram for location code search
CREATE INDEX trgm_storage_loc_code         ON warehouse.storage_locations USING GIN (location_code gin_trgm_ops);

-- ── STORAGE LOCATION PRODUCT RULES ───────────────────────────────────────────
CREATE INDEX idx_slpr_location_id          ON warehouse.storage_location_product_rules (storage_location_id);
CREATE INDEX idx_slpr_product_id           ON warehouse.storage_location_product_rules (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_slpr_category_id          ON warehouse.storage_location_product_rules (product_category_id) WHERE product_category_id IS NOT NULL;

-- ── OPERATIONAL AREAS ────────────────────────────────────────────────────────
CREATE INDEX pix_wh_areas_active           ON warehouse.warehouse_operational_areas (warehouse_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_wh_areas_warehouse_id     ON warehouse.warehouse_operational_areas (warehouse_id);
CREATE INDEX idx_wh_areas_type_id          ON warehouse.warehouse_operational_areas (operational_area_type_id);

-- ── EQUIPMENT ────────────────────────────────────────────────────────────────
CREATE INDEX pix_wh_equip_active           ON warehouse.warehouse_equipment (warehouse_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_wh_equip_warehouse_id     ON warehouse.warehouse_equipment (warehouse_id);
CREATE INDEX idx_wh_equip_type_id          ON warehouse.warehouse_equipment (equipment_type_id);
CREATE INDEX idx_wh_equip_status_id        ON warehouse.warehouse_equipment (equipment_status_id);
CREATE INDEX idx_wh_equip_area_id          ON warehouse.warehouse_equipment (assigned_area_id) WHERE assigned_area_id IS NOT NULL;
-- Maintenance due soon
CREATE INDEX idx_wh_equip_next_maint       ON warehouse.warehouse_equipment (next_maintenance_date ASC)
    WHERE is_deleted = FALSE;

-- ── SAFETY COMPLIANCE ────────────────────────────────────────────────────────
CREATE INDEX idx_wh_safety_warehouse_id    ON warehouse.warehouse_safety_compliance (warehouse_id);
-- Certifications expiring soon
CREATE INDEX idx_wh_safety_cert_expiry     ON warehouse.warehouse_safety_compliance (certification_expiry_date ASC)
    WHERE certification_expiry_date IS NOT NULL AND is_deleted = FALSE;

-- ── STATUS HISTORY ───────────────────────────────────────────────────────────
CREATE INDEX idx_wh_status_hist_warehouse  ON warehouse.warehouse_status_history (warehouse_id, effective_from);
CREATE INDEX idx_wh_status_hist_current    ON warehouse.warehouse_status_history (warehouse_id) WHERE is_current = TRUE;

-- ── LOCATION POLICY MAPPINGS ─────────────────────────────────────────────────
CREATE INDEX idx_loc_policy_location_id    ON warehouse.location_storage_policy_mappings (storage_location_id);
CREATE INDEX idx_loc_policy_policy_id      ON warehouse.location_storage_policy_mappings (storage_policy_id);

-- =============================================================================
-- SECTION 14 — COMPLETE COMMENT ON DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE warehouse.warehouse_types                   IS 'Configurable warehouse type master for classification without hardcoded ENUMs.';
COMMENT ON TABLE warehouse.warehouse_statuses                IS 'Warehouse operational status master (Draft, Active, Inactive, Maintenance, Closed, Archived).';
COMMENT ON TABLE warehouse.storage_location_types            IS 'Storage location type master with configurable pick/mix/inspection rules per type.';
COMMENT ON TABLE warehouse.temperature_zones                 IS 'Temperature zone master with validated °C bounds and IoT monitoring flags.';
COMMENT ON TABLE warehouse.storage_policies                  IS 'Inventory management strategy master (FIFO, FEFO, LIFO, WavePicking, ClusterPicking, etc.).';
COMMENT ON TABLE warehouse.operational_area_types            IS 'Operational area type master for warehouse zone classification.';
COMMENT ON TABLE warehouse.equipment_types                   IS 'Warehouse equipment category master with certification requirement flags.';
COMMENT ON TABLE warehouse.equipment_statuses                IS 'Equipment operational status master (Active, InMaintenance, OutOfService, Retired, Reserved).';
COMMENT ON TABLE warehouse.storage_location_levels           IS 'Hierarchy level master: 1=Warehouse, 2=Building, 3=Floor, 4=Zone, 5=Aisle, 6=Rack, 7=Shelf, 8=Bin, 9=Slot.';
COMMENT ON TABLE warehouse.warehouses                        IS 'Core warehouse master entity. Foundation for all ERP transactional modules.';
COMMENT ON TABLE warehouse.warehouse_capacity                IS 'Warehouse physical capacity limits and live utilization tracking. One row per warehouse.';
COMMENT ON TABLE warehouse.warehouse_operating_hours         IS 'Weekly warehouse operating schedule. Used by logistics scheduling and SLA engines.';
COMMENT ON TABLE warehouse.warehouse_business_rules          IS 'Configurable warehouse business rules governing inventory and compliance. One row per warehouse.';
COMMENT ON TABLE warehouse.storage_locations                 IS 'Unified 9-level storage hierarchy using self-referencing LTREE design. Scalable to millions of locations.';
COMMENT ON TABLE warehouse.storage_location_product_rules    IS 'Product placement restriction/allowance rules per location for WMS putaway guidance.';
COMMENT ON TABLE warehouse.warehouse_operational_areas       IS 'Defined functional zones within a warehouse (Receiving, Dispatch, Quarantine, etc.).';
COMMENT ON TABLE warehouse.warehouse_equipment               IS 'Warehouse equipment registry with maintenance scheduling and capacity tracking.';
COMMENT ON TABLE warehouse.warehouse_safety_compliance       IS 'Safety, regulatory, and certification compliance master. One row per warehouse.';
COMMENT ON TABLE warehouse.warehouse_status_history          IS 'Immutable warehouse status audit trail with non-overlapping date range enforcement.';
COMMENT ON TABLE warehouse.location_storage_policy_mappings  IS 'Zone/location-level storage policy override mappings for granular FIFO/FEFO/LIFO control.';
