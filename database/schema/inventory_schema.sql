-- =============================================================================
-- INK FMCG ENTERPRISE ERP — INVENTORY MASTER MODULE DDL SCHEMA (v16.4 FINAL)
-- Target Engine  : PostgreSQL 16+
-- Schema         : inventory
-- PK Strategy    : UUID v7 via iam.uuid_generate_v7()
-- Concurrency    : row_version (Optimistic Concurrency Control)
-- Extensions     : pg_trgm, btree_gist, ltree (inherited)
-- Frozen Deps    : iam v1.0, organization v1.0, employee v1.0,
--                  product v1.0, warehouse v1.0
-- Status         : PRODUCTION FOUNDATION
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS inventory;

COMMENT ON SCHEMA inventory IS
  'Enterprise Inventory Master Module — Architectural Boundary: FOUNDATION + OPERATIONS. '
  'FOUNDATION tables (permanent configuration and registries): inventory_types, inventory_statuses, '
  'ownership_types, quality_statuses, batch_statuses, lot_statuses, serial_number_statuses, '
  'stock_policies, valuation_methods, abc_classifications, reservation_types, compliance_statuses, '
  'batches (registry), lots (registry), serial_numbers (registry), inventory_items (authoritative balance), '
  'inventory_cost_profiles (cost config + operational snapshot), inventory_attribute_definitions, '
  'reservation_rules, cycle_count_configs, inventory_traceability (structural linkage), inventory_compliance. '
  'OPERATIONS tables (runtime, demand-driven): inventory_reservations, inventory_attribute_values, '
  'inventory_status_history. '
  'Permanent foundation for Procurement, Sales, Warehouse Operations, Manufacturing, Returns, '
  'Finance, Planning, Reporting, and Analytics modules.';

-- =============================================================================
-- SECTION 1 — NORMALIZED LOOKUP MASTER TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 Inventory Types
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.inventory_types (
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

    CONSTRAINT uq_inventory_types_code  UNIQUE (code),
    CONSTRAINT chk_inventory_types_code CHECK (length(trim(code)) > 0)
);

COMMENT ON TABLE  inventory.inventory_types       IS 'Configurable inventory type master (Owned, Consignment, CustomerOwned, VendorOwned, SampleStock, PromotionalStock, Returnable, NonReturnable, Virtual).';
COMMENT ON COLUMN inventory.inventory_types.code  IS 'Immutable business key. No spaces or special characters.';

-- ---------------------------------------------------------------------------
-- 1.2 Inventory Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.inventory_statuses (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    blocks_picking           BOOLEAN      NOT NULL DEFAULT FALSE,
    blocks_receiving         BOOLEAN      NOT NULL DEFAULT FALSE,
    requires_approval        BOOLEAN      NOT NULL DEFAULT FALSE,
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

    CONSTRAINT uq_inventory_statuses_code UNIQUE (code)
);

COMMENT ON TABLE  inventory.inventory_statuses                  IS 'Lookup master for inventory item statuses (Available, Reserved, Allocated, Blocked, QualityHold, Inspection, Damaged, Expired, Quarantine, Returned, InTransit).';
COMMENT ON COLUMN inventory.inventory_statuses.blocks_picking   IS 'TRUE for statuses that prevent this inventory from being allocated to sales orders (QualityHold, Blocked, Quarantine, Damaged).';
COMMENT ON COLUMN inventory.inventory_statuses.blocks_receiving IS 'TRUE for statuses that block receiving further stock against this inventory item.';

-- ---------------------------------------------------------------------------
-- 1.3 Ownership Types
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.ownership_types (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    is_third_party           BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order            INT          NOT NULL DEFAULT 1,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_ownership_types_code UNIQUE (code)
);

COMMENT ON TABLE  inventory.ownership_types                IS 'Inventory ownership classification master (CompanyOwned, CustomerOwned, VendorOwned, ThirdParty, Consignment). Drives financial valuation and reporting.';
COMMENT ON COLUMN inventory.ownership_types.is_third_party IS 'TRUE for externally-owned inventory stored on premises (Consignment, CustomerOwned, VendorOwned).';

-- ---------------------------------------------------------------------------
-- 1.4 Quality Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.quality_statuses (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    is_usable                BOOLEAN      NOT NULL DEFAULT TRUE,
    requires_qa_clearance    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order            INT          NOT NULL DEFAULT 1,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_quality_statuses_code UNIQUE (code)
);

COMMENT ON TABLE  inventory.quality_statuses                     IS 'QC status master for inventory (Approved, PendingInspection, Rejected, Hold, Released). Controls whether inventory is usable for order fulfillment.';
COMMENT ON COLUMN inventory.quality_statuses.is_usable           IS 'FALSE for Rejected, Hold statuses that prevent inventory from being picked.';
COMMENT ON COLUMN inventory.quality_statuses.requires_qa_clearance IS 'TRUE for statuses that need QA department sign-off before becoming usable.';

-- ---------------------------------------------------------------------------
-- 1.5 Batch Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.batch_statuses (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    description              TEXT,
    allows_consumption       BOOLEAN      NOT NULL DEFAULT TRUE,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order            INT          NOT NULL DEFAULT 1,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_batch_statuses_code UNIQUE (code)
);

COMMENT ON TABLE  inventory.batch_statuses                   IS 'Batch lifecycle status master (Active, Quarantine, Hold, Expired, Recalled, Closed). Drives FEFO picking and regulatory recall management.';
COMMENT ON COLUMN inventory.batch_statuses.allows_consumption IS 'FALSE for Quarantine, Hold, Expired, Recalled batches — blocks dispatch even if quantity is available.';

-- ---------------------------------------------------------------------------
-- 1.6 Lot Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.lot_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_lot_statuses_code UNIQUE (code)
);

COMMENT ON TABLE inventory.lot_statuses IS 'Lot lifecycle status master (Active, Split, Merged, Closed, Archived). Supports lot traceability and lineage tracking.';

-- ---------------------------------------------------------------------------
-- 1.7 Serial Number Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.serial_number_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_available   BOOLEAN      NOT NULL DEFAULT TRUE,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_serial_number_statuses_code UNIQUE (code)
);

COMMENT ON TABLE  inventory.serial_number_statuses             IS 'Serial number lifecycle status master (Active, InUse, Sold, Returned, Defective, UnderRepair, Scrapped, Lost, Stolen).';
COMMENT ON COLUMN inventory.serial_number_statuses.is_available IS 'FALSE for statuses that indicate the serial is not available for fresh allocation (Sold, Scrapped, Lost).';

-- ---------------------------------------------------------------------------
-- 1.8 Stock Policies
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.stock_policies (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_stock_policies_code UNIQUE (code)
);

COMMENT ON TABLE inventory.stock_policies IS 'Inventory consumption and valuation strategy master (FIFO, FEFO, LIFO, MovingAverage, WeightedAverage, StandardCost, SpecificIdentification).';

-- ---------------------------------------------------------------------------
-- 1.9 Valuation Methods
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.valuation_methods (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_valuation_methods_code UNIQUE (code)
);

COMMENT ON TABLE inventory.valuation_methods IS 'Financial inventory valuation method master (StandardCost, MovingAverage, WeightedAverage, FIFO, LIFO, SpecificIdentification). Links to Finance module.';

-- ---------------------------------------------------------------------------
-- 1.10 ABC Classifications
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.abc_classifications (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code                     VARCHAR(10)   NOT NULL,
    name                     VARCHAR(50)   NOT NULL,
    description              TEXT,
    default_count_frequency_days INT        NOT NULL DEFAULT 30,
    default_tolerance_pct    NUMERIC(5,2)  NOT NULL DEFAULT 2.00,
    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,
    display_order            INT           NOT NULL DEFAULT 1,

    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_abc_classifications_code         UNIQUE (code),
    CONSTRAINT chk_abc_count_frequency             CHECK (default_count_frequency_days > 0),
    CONSTRAINT chk_abc_tolerance                   CHECK (default_tolerance_pct BETWEEN 0 AND 100)
);

COMMENT ON TABLE  inventory.abc_classifications                        IS 'ABC cycle count classification master. A = high-value/high-velocity (monthly), B = medium (quarterly), C = low-value (annually). Default frequencies and tolerances configurable per classification.';
COMMENT ON COLUMN inventory.abc_classifications.default_tolerance_pct  IS 'Acceptable count variance percentage. Counts within tolerance are auto-approved. Range 0–100.';

-- ---------------------------------------------------------------------------
-- 1.11 Reservation Types
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.reservation_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_reservation_types_code UNIQUE (code)
);

COMMENT ON TABLE inventory.reservation_types IS 'Inventory reservation origin type master (SalesOrder, PurchaseReturn, ManufacturingOrder, TransferOrder, QualityHold, Manual, Cycle Count).';

-- ---------------------------------------------------------------------------
-- 1.12 Compliance Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE inventory.compliance_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_compliance_statuses_code UNIQUE (code)
);

COMMENT ON TABLE inventory.compliance_statuses IS 'Inventory regulatory compliance status master (Compliant, PendingReview, NonCompliant, Exempt, ConditionalRelease).';

-- =============================================================================
-- SECTION 2 — BATCH MASTER
-- =============================================================================

CREATE TABLE inventory.batches (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID          NOT NULL,
    product_id               UUID          NOT NULL,
    batch_status_id          UUID          NOT NULL,

    -- Batch Identification
    batch_number             VARCHAR(100)  NOT NULL,
    supplier_batch_number    VARCHAR(100),
    internal_batch_number    VARCHAR(100),

    -- Dates
    manufacture_date         DATE,
    expiry_date              DATE,
    retest_date              DATE,
    best_before_date         DATE,
    shelf_life_days          INT,

    -- Production Details
    production_line          VARCHAR(100),
    production_shift         VARCHAR(50),
    origin_country_id        UUID,

    -- Supplier Linkage (forward reference — FK added when Procurement is implemented)
    supplier_id              UUID,           -- References future procurement.suppliers(id)
    supplier_name            VARCHAR(200),   -- Denormalized for standalone batch display
    purchase_order_reference VARCHAR(100),   -- GRN/PO cross-reference

    -- Quantity Tracking (refreshed by inventory jobs)
    original_qty             NUMERIC(18,6)  NOT NULL DEFAULT 0,
    remaining_qty            NUMERIC(18,6)  NOT NULL DEFAULT 0,
    base_uom_id              UUID           NOT NULL,

    -- Quality
    certificate_of_analysis  VARCHAR(200),
    quality_notes            TEXT,

    remarks                  TEXT,

    row_version              INT            NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID           REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID           REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN        NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID           REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_batches_company     FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_batches_product     FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_batches_status      FOREIGN KEY (batch_status_id)
        REFERENCES inventory.batch_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_batches_origin      FOREIGN KEY (origin_country_id)
        REFERENCES organization.countries(id) ON DELETE SET NULL,
    CONSTRAINT fk_batches_uom         FOREIGN KEY (base_uom_id)
        REFERENCES product.product_units_of_measure(id) ON DELETE RESTRICT,

    CONSTRAINT uq_batches_number      UNIQUE (company_id, product_id, batch_number),

    -- Date integrity
    CONSTRAINT chk_batch_expiry_after_manufacture CHECK (
        manufacture_date IS NULL OR expiry_date IS NULL OR
        expiry_date >= manufacture_date
    ),
    CONSTRAINT chk_batch_retest_before_expiry CHECK (
        retest_date IS NULL OR expiry_date IS NULL OR
        retest_date <= expiry_date
    ),
    CONSTRAINT chk_batch_shelf_life           CHECK (shelf_life_days IS NULL OR shelf_life_days > 0),
    CONSTRAINT chk_batch_original_qty         CHECK (original_qty >= 0),
    CONSTRAINT chk_batch_remaining_qty        CHECK (remaining_qty >= 0),
    CONSTRAINT chk_batch_qty_consistency      CHECK (remaining_qty <= original_qty)
);

COMMENT ON TABLE  inventory.batches IS
  '[ARCHITECTURAL BOUNDARY: FOUNDATION — Permanent Enterprise Batch Registry] '
  'A batch is a manufacturing or procurement event that creates a traceable quantity of product. '
  'Batches are PERMANENT — they are never deleted even after all inventory is consumed. '
  'They exist as the regulatory record for: FEFO picking, QC holds, expiry alerts, supplier CoA, '
  'government recall management, and financial audit tracing. '
  'A batch created for a GRN in 2024 must still be queryable in 2034 for recall investigations. '
  'remaining_qty is the only operational column — updated by stock movement jobs. All other '
  'columns are immutable configuration set at batch creation time.';
COMMENT ON COLUMN inventory.batches.batch_number          IS 'Primary batch identifier as received from manufacturer or assigned internally. Immutable after creation.';
COMMENT ON COLUMN inventory.batches.supplier_batch_number IS 'Supplier-assigned batch/lot number from CoA or delivery documents. Immutable after creation.';
COMMENT ON COLUMN inventory.batches.retest_date           IS 'Date by which the batch must be re-tested for continued usability. Must be <= expiry_date.';
COMMENT ON COLUMN inventory.batches.remaining_qty         IS '[OPERATIONAL — maintained by stock_movement jobs] Current remaining unconsumed quantity. Must not exceed original_qty. Zero does not mean the batch is deleted — batch record is permanent.';
COMMENT ON COLUMN inventory.batches.supplier_id           IS 'Forward reference UUID for future procurement.suppliers(id). Not enforced by FK until Procurement module is implemented.';

-- =============================================================================
-- SECTION 3 — LOT MASTER
-- =============================================================================

CREATE TABLE inventory.lots (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID          NOT NULL,
    product_id               UUID          NOT NULL,
    batch_id                 UUID,
    lot_status_id            UUID          NOT NULL,
    parent_lot_id            UUID,          -- Self-referencing for split/merge lineage

    -- Lot Identification
    lot_number               VARCHAR(100)  NOT NULL,
    lot_type                 VARCHAR(30)   NOT NULL DEFAULT 'Original',

    -- Traceability
    split_from_lot_id        UUID,          -- Source lot if this is a split
    merged_into_lot_id       UUID,          -- Destination lot if this was merged

    -- Quantity
    original_qty             NUMERIC(18,6) NOT NULL DEFAULT 0,
    current_qty              NUMERIC(18,6) NOT NULL DEFAULT 0,
    base_uom_id              UUID          NOT NULL,

    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_lots_company      FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lots_product      FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lots_batch        FOREIGN KEY (batch_id)
        REFERENCES inventory.batches(id) ON DELETE SET NULL,
    CONSTRAINT fk_lots_status       FOREIGN KEY (lot_status_id)
        REFERENCES inventory.lot_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lots_parent       FOREIGN KEY (parent_lot_id)
        REFERENCES inventory.lots(id) ON DELETE SET NULL,
    CONSTRAINT fk_lots_split_from   FOREIGN KEY (split_from_lot_id)
        REFERENCES inventory.lots(id) ON DELETE SET NULL,
    CONSTRAINT fk_lots_merged_into  FOREIGN KEY (merged_into_lot_id)
        REFERENCES inventory.lots(id) ON DELETE SET NULL,
    CONSTRAINT fk_lots_uom          FOREIGN KEY (base_uom_id)
        REFERENCES product.product_units_of_measure(id) ON DELETE RESTRICT,

    CONSTRAINT uq_lots_number       UNIQUE (company_id, product_id, lot_number),
    CONSTRAINT chk_lots_no_self     CHECK (id <> parent_lot_id),
    CONSTRAINT chk_lots_type        CHECK (lot_type IN ('Original','Split','Merged','Adjusted')),
    CONSTRAINT chk_lots_original_qty CHECK (original_qty >= 0),
    CONSTRAINT chk_lots_current_qty  CHECK (current_qty  >= 0),
    CONSTRAINT chk_lots_qty_consistency CHECK (current_qty <= original_qty)
);

COMMENT ON TABLE  inventory.lots IS
  '[ARCHITECTURAL BOUNDARY: FOUNDATION — Permanent Enterprise Lot Registry] '
  'Lots are subdivisions of batches used for granular traceability within FMCG supply chains. '
  'Like batches, lots are PERMANENT registries — a lot record persists permanently for regulatory '
  'and traceability purposes even after its inventory is fully consumed or written off. '
  'Lot lineage (split_from_lot_id, merged_into_lot_id, parent_lot_id) forms a permanent directed '
  'graph that enables complete forward and backward traceability for regulatory investigations. '
  'current_qty is the only operational column — maintained by stock movement jobs.';
COMMENT ON COLUMN inventory.lots.lot_type           IS 'Lot classification: Original (first creation), Split (derived from split operation), Merged (absorbed from merge), Adjusted (correction). Enforced by chk_lots_type.';
COMMENT ON COLUMN inventory.lots.split_from_lot_id  IS 'Permanent lineage reference: the source lot from which this lot was created during a split operation. Immutable after creation.';
COMMENT ON COLUMN inventory.lots.merged_into_lot_id IS 'Permanent lineage reference: the destination lot into which this lot was absorbed during a merge. Immutable after creation.';

-- =============================================================================
-- SECTION 4 — SERIAL NUMBER MASTER
-- =============================================================================

CREATE TABLE inventory.serial_numbers (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID          NOT NULL,
    product_id               UUID          NOT NULL,
    batch_id                 UUID,
    serial_number_status_id  UUID          NOT NULL,

    -- Serial Identification
    serial_number            VARCHAR(200)  NOT NULL,
    manufacturer_serial      VARCHAR(200),
    internal_serial          VARCHAR(200),
    imei                     VARCHAR(20),
    mac_address              VARCHAR(50),

    -- Warranty & Lifecycle
    warranty_start_date      DATE,
    warranty_end_date        DATE,
    activation_date          DATE,
    sold_date                DATE,
    return_date              DATE,
    scrapped_date            DATE,

    -- Supplier & Customer Linkage (forward references)
    supplier_id              UUID,           -- future procurement.suppliers(id)
    customer_id              UUID,           -- future crm.customers(id)

    remarks                  TEXT,

    row_version              INT            NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID           REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID           REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN        NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID           REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_serials_company  FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_serials_product  FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_serials_batch    FOREIGN KEY (batch_id)
        REFERENCES inventory.batches(id) ON DELETE SET NULL,
    CONSTRAINT fk_serials_status   FOREIGN KEY (serial_number_status_id)
        REFERENCES inventory.serial_number_statuses(id) ON DELETE RESTRICT,

    CONSTRAINT uq_serials_number   UNIQUE (company_id, product_id, serial_number),

    -- Date integrity
    CONSTRAINT chk_serial_warranty_range    CHECK (
        warranty_start_date IS NULL OR warranty_end_date IS NULL OR
        warranty_end_date >= warranty_start_date
    ),
    CONSTRAINT chk_serial_activation_range  CHECK (
        warranty_start_date IS NULL OR activation_date IS NULL OR
        activation_date >= warranty_start_date
    ),
    CONSTRAINT chk_serial_imei_format       CHECK (
        imei IS NULL OR (length(imei) BETWEEN 15 AND 17 AND imei ~ '^\d+$')
    )
);

COMMENT ON TABLE  inventory.serial_numbers IS
  '[ARCHITECTURAL BOUNDARY: FOUNDATION — Permanent Enterprise Serial Number Registry] '
  'Each row is the permanent identity record for one individually serialized unit. '
  'Serial numbers are PERMANENT — they are never deleted, even after the unit is sold, scrapped, '
  'or returned. They exist as the authoritative product passport for: warranty claims, regulatory '
  'compliance, theft reporting, insurance, and after-sales service. '
  'The current serial_number_status_id is the only operationally updated column (by Sales/Returns). '
  'All other columns — manufacturer serial, IMEI, warranty dates — are immutable configuration '
  'set at the time of receipt from the supplier.';
COMMENT ON COLUMN inventory.serial_numbers.imei           IS 'IMEI number for mobile/electronic devices. Must be 15–17 numeric digits (chk_serial_imei_format). Immutable after creation.';
COMMENT ON COLUMN inventory.serial_numbers.supplier_id    IS 'Forward reference UUID for future procurement.suppliers(id). No FK constraint until Procurement module is implemented.';
COMMENT ON COLUMN inventory.serial_numbers.customer_id    IS 'Forward reference UUID for future crm.customers(id). No FK constraint until CRM module is implemented.';

-- =============================================================================
-- SECTION 5 — INVENTORY ITEMS (CORE MASTER TABLE)
--
-- ARCHITECTURE DECISION:
--   inventory_items is the central balance table. It stores the CURRENT
--   balance of each unique combination of (product, variant, warehouse,
--   location, batch, lot, serial, ownership, inventory_type).
--   It is NOT a transaction log — transactions will be recorded in a
--   separate stock_movements table when the Procurement/Sales modules
--   are implemented. This design ensures the master is never restructured.
-- =============================================================================

CREATE TABLE inventory.inventory_items (
    id                       UUID           PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID           NOT NULL,

    -- Inventory Classification
    inventory_code           VARCHAR(50)    NOT NULL,
    inventory_type_id        UUID           NOT NULL,
    inventory_status_id      UUID           NOT NULL,
    ownership_type_id        UUID           NOT NULL,
    quality_status_id        UUID           NOT NULL,
    stock_policy_id          UUID,

    -- Product References
    product_id               UUID           NOT NULL,
    product_variant_id       UUID,           -- References product.product_variants(id)

    -- Warehouse References
    warehouse_id             UUID           NOT NULL,
    storage_location_id      UUID,           -- References warehouse.storage_locations(id)

    -- Traceability References
    batch_id                 UUID,           -- References inventory.batches(id)
    lot_id                   UUID,           -- References inventory.lots(id)
    serial_number_id         UUID,           -- References inventory.serial_numbers(id) (NULL for batch/lot items)

    -- Quantities (all in base UOM)
    base_uom_id              UUID           NOT NULL,
    qty_on_hand              NUMERIC(18,6)  NOT NULL DEFAULT 0,
    qty_reserved             NUMERIC(18,6)  NOT NULL DEFAULT 0,
    qty_allocated            NUMERIC(18,6)  NOT NULL DEFAULT 0,
    qty_in_transit           NUMERIC(18,6)  NOT NULL DEFAULT 0,
    qty_damaged              NUMERIC(18,6)  NOT NULL DEFAULT 0,
    qty_quarantine           NUMERIC(18,6)  NOT NULL DEFAULT 0,

    -- Computed Available Quantity
    qty_available            NUMERIC(18,6)  GENERATED ALWAYS AS (
        GREATEST(0, qty_on_hand - qty_reserved - qty_allocated - qty_quarantine - qty_damaged)
    ) STORED,

    -- Physical Attributes
    weight_kg                NUMERIC(15,4),
    volume_cbm               NUMERIC(15,6),

    -- Expiry for FEFO (denormalized from batch for performance on picking queries)
    expiry_date              DATE,
    manufacture_date         DATE,

    -- Condition
    condition_notes          TEXT,
    is_returnable            BOOLEAN        NOT NULL DEFAULT TRUE,

    remarks                  TEXT,

    row_version              INT            NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID           REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID           REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN        NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID           REFERENCES iam.users(id) ON DELETE SET NULL,

    -- Foreign Keys
    CONSTRAINT fk_inv_items_company      FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_items_type         FOREIGN KEY (inventory_type_id)
        REFERENCES inventory.inventory_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_items_status       FOREIGN KEY (inventory_status_id)
        REFERENCES inventory.inventory_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_items_ownership    FOREIGN KEY (ownership_type_id)
        REFERENCES inventory.ownership_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_items_quality      FOREIGN KEY (quality_status_id)
        REFERENCES inventory.quality_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_items_policy       FOREIGN KEY (stock_policy_id)
        REFERENCES inventory.stock_policies(id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_items_product      FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_items_warehouse    FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_items_location     FOREIGN KEY (storage_location_id)
        REFERENCES warehouse.storage_locations(id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_items_batch        FOREIGN KEY (batch_id)
        REFERENCES inventory.batches(id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_items_lot          FOREIGN KEY (lot_id)
        REFERENCES inventory.lots(id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_items_serial       FOREIGN KEY (serial_number_id)
        REFERENCES inventory.serial_numbers(id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_items_uom          FOREIGN KEY (base_uom_id)
        REFERENCES product.product_units_of_measure(id) ON DELETE RESTRICT,

    -- Business uniqueness: one row per business identity combination
    CONSTRAINT uq_inv_items_identity     UNIQUE (
        company_id, product_id, warehouse_id,
        inventory_type_id, ownership_type_id,
        batch_id, lot_id, serial_number_id
    ),
    CONSTRAINT uq_inv_items_code         UNIQUE (company_id, inventory_code),

    -- Quantity integrity
    CONSTRAINT chk_inv_items_qty_on_hand    CHECK (qty_on_hand    >= 0),
    CONSTRAINT chk_inv_items_qty_reserved   CHECK (qty_reserved   >= 0),
    CONSTRAINT chk_inv_items_qty_allocated  CHECK (qty_allocated  >= 0),
    CONSTRAINT chk_inv_items_qty_transit    CHECK (qty_in_transit >= 0),
    CONSTRAINT chk_inv_items_qty_damaged    CHECK (qty_damaged    >= 0),
    CONSTRAINT chk_inv_items_qty_quarantine CHECK (qty_quarantine >= 0),
    CONSTRAINT chk_inv_items_reserved_le_onhand CHECK (
        (qty_reserved + qty_allocated) <= qty_on_hand
    ),
    CONSTRAINT chk_inv_items_weight      CHECK (weight_kg  IS NULL OR weight_kg  >= 0),
    CONSTRAINT chk_inv_items_volume      CHECK (volume_cbm IS NULL OR volume_cbm >= 0),
    -- Expiry must be after manufacture
    CONSTRAINT chk_inv_items_dates       CHECK (
        manufacture_date IS NULL OR expiry_date IS NULL OR
        expiry_date >= manufacture_date
    )
);

COMMENT ON TABLE  inventory.inventory_items IS
  '[ARCHITECTURAL BOUNDARY: FOUNDATION — Authoritative Inventory Balance Table] '
  'inventory_items is the single authoritative source of current stock balances in the ERP. '
  'Each row represents the net current on-hand position for one unique dimensional identity: '
  '(company × product × variant × warehouse × location × batch × lot × serial × ownership × inventory_type). '
  'RESPONSIBILITY: Holds current state (balance sheet), NOT historical events (journal). '
  'The companion immutable ledger — stock_movements — will be implemented in the Procurement/Sales module '
  'and will record every debit and credit that produced the current balance. '
  'All modules (Procurement, Sales, WMS, Manufacturing) read from inventory_items for available quantity '
  'and write to stock_movements for transactions. Quantity columns are updated atomically by those modules. '
  'qty_available is a GENERATED column — always consistent without application effort.';
COMMENT ON COLUMN inventory.inventory_items.inventory_code     IS 'Unique business key per company for this inventory item. Used on all WMS screens and transaction documents.';
COMMENT ON COLUMN inventory.inventory_items.qty_available      IS '[GENERATED — READ ONLY] MAX(0, qty_on_hand - qty_reserved - qty_allocated - qty_quarantine - qty_damaged). Always consistent. Never set manually.  Reflects truly allocatable stock.';
COMMENT ON COLUMN inventory.inventory_items.qty_on_hand        IS '[OPERATIONAL] Physical quantity confirmed present in warehouse. Updated atomically by Procurement (GRN) and Sales (Dispatch) stock_movement jobs. Always >= 0.';
COMMENT ON COLUMN inventory.inventory_items.qty_reserved       IS '[OPERATIONAL] Soft-reserved quantity for unfulfilled demand (sales order demand acknowledged but not yet physically picked). Updated by Sales/Planning module. Must be <= qty_on_hand.';
COMMENT ON COLUMN inventory.inventory_items.qty_allocated      IS '[OPERATIONAL] Hard-allocated quantity — picking task created and assigned to a warehouse operator. Updated by WMS picking module. Must be <= qty_reserved at time of allocation.';
COMMENT ON COLUMN inventory.inventory_items.qty_in_transit     IS '[OPERATIONAL] Quantity physically in motion between warehouses (loaded on vehicle, not yet received at destination). Updated by Logistics/Transfer module.';
COMMENT ON COLUMN inventory.inventory_items.qty_damaged        IS '[OPERATIONAL] Quantity recorded as damaged and excluded from available stock. Updated by WMS damage recording.';
COMMENT ON COLUMN inventory.inventory_items.qty_quarantine     IS '[OPERATIONAL] Quantity under QC quarantine hold. Excluded from available stock. Updated by Quality module.';
COMMENT ON COLUMN inventory.inventory_items.expiry_date        IS '[FOUNDATION — Denormalized] Copied from batches.expiry_date at inventory receipt time. Retained on this table to avoid FK joins during FEFO picking queries over millions of rows. Kept in sync with batch record by application/trigger.';
COMMENT ON COLUMN inventory.inventory_items.serial_number_id   IS 'Only populated for serial-tracked products. Implies qty_on_hand is 0 (not present) or 1 (physically present) for serialized inventory.';
COMMENT ON COLUMN inventory.inventory_items.row_version        IS 'Optimistic concurrency token. ALL stock balance update statements MUST check this value and increment it. Mismatch = concurrent modification conflict.';

-- =============================================================================
-- SECTION 6 — INVENTORY COST PROFILES
-- =============================================================================

CREATE TABLE inventory.inventory_cost_profiles (
    id                       UUID           PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    inventory_item_id        UUID           NOT NULL,
    valuation_method_id      UUID           NOT NULL,

    -- Currency
    currency_code            VARCHAR(10)    NOT NULL DEFAULT 'INR',

    -- Cost Fields
    standard_cost            NUMERIC(18,6),
    average_cost             NUMERIC(18,6),
    replacement_cost         NUMERIC(18,6),
    last_purchase_cost       NUMERIC(18,6),
    landed_cost              NUMERIC(18,6),

    -- Cost Validity
    effective_from           DATE           NOT NULL DEFAULT CURRENT_DATE,
    effective_to             DATE,

    -- Future Finance Integration
    gl_account_code          VARCHAR(50),    -- General Ledger account (forward reference)
    cost_center_id           UUID,           -- References organization.cost_centers(id)

    last_cost_updated_at_utc TIMESTAMPTZ,

    row_version              INT            NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID           REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID           REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_cost_profile_item       FOREIGN KEY (inventory_item_id)
        REFERENCES inventory.inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_cost_profile_method     FOREIGN KEY (valuation_method_id)
        REFERENCES inventory.valuation_methods(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cost_profile_cost_center FOREIGN KEY (cost_center_id)
        REFERENCES organization.cost_centers(id) ON DELETE SET NULL,

    CONSTRAINT uq_cost_profile_item       UNIQUE (inventory_item_id, effective_from),

    CONSTRAINT chk_cost_standard    CHECK (standard_cost      IS NULL OR standard_cost      >= 0),
    CONSTRAINT chk_cost_average     CHECK (average_cost       IS NULL OR average_cost       >= 0),
    CONSTRAINT chk_cost_replacement CHECK (replacement_cost   IS NULL OR replacement_cost   >= 0),
    CONSTRAINT chk_cost_last_purch  CHECK (last_purchase_cost IS NULL OR last_purchase_cost >= 0),
    CONSTRAINT chk_cost_landed      CHECK (landed_cost        IS NULL OR landed_cost        >= 0),
    CONSTRAINT chk_cost_date_range  CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    )
);

COMMENT ON TABLE  inventory.inventory_cost_profiles IS
  '[ARCHITECTURAL BOUNDARY: FOUNDATION (config) + OPERATIONAL SNAPSHOT (dynamic values)] '
  'This table serves a dual purpose by design: '
  '(1) FOUNDATION CONFIG columns — valuation_method_id, currency_code, gl_account_code, '
  'cost_center_id, effective_from, effective_to. These are set by Finance/Costing teams and '
  'change infrequently. They define HOW the inventory item is valued. '
  '(2) OPERATIONAL SNAPSHOT columns — standard_cost, average_cost, replacement_cost, '
  'last_purchase_cost, landed_cost. These are recomputed by operational events: '
  'average_cost and last_purchase_cost update on every GRN; replacement_cost updates on '
  'price list changes. They represent the CURRENT cost state derived from transactions. '
  'The Finance module will read valuation_method_id + currency_code to determine which cost '
  'columns to apply for COGS, inventory valuation reports, and margin analysis. '
  'A future cost_snapshots table (Finance module) will hold the full point-in-time cost history.';
COMMENT ON COLUMN inventory.inventory_cost_profiles.standard_cost     IS '[FOUNDATION CONFIG] Predetermined cost set by Finance team for standard costing. Rarely changes outside annual cost roll.';
COMMENT ON COLUMN inventory.inventory_cost_profiles.average_cost      IS '[OPERATIONAL SNAPSHOT] Moving weighted average cost. Recomputed by Procurement module on every GRN receipt using the running WAC formula.';
COMMENT ON COLUMN inventory.inventory_cost_profiles.replacement_cost  IS '[OPERATIONAL SNAPSHOT] Current market replacement cost. Updated by Procurement/Pricing on vendor price changes.';
COMMENT ON COLUMN inventory.inventory_cost_profiles.last_purchase_cost IS '[OPERATIONAL SNAPSHOT] Cost from the most recent purchase order receipt. Updated by Procurement GRN module.';
COMMENT ON COLUMN inventory.inventory_cost_profiles.landed_cost       IS '[OPERATIONAL SNAPSHOT] Total landed cost: purchase price + freight + customs + handling. Recomputed by Procurement after all landed cost components are captured.';
COMMENT ON COLUMN inventory.inventory_cost_profiles.gl_account_code   IS '[FOUNDATION CONFIG] General Ledger account code (forward reference string). Enforced as FK by Finance module when implemented.';

-- =============================================================================
-- SECTION 7 — INVENTORY ATTRIBUTE DEFINITIONS & VALUES (TYPED EAV)
-- =============================================================================

CREATE TABLE inventory.inventory_attribute_definitions (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID         NOT NULL,
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    data_type                VARCHAR(30)  NOT NULL DEFAULT 'String',
    allowed_values_json      JSONB,
    unit_of_measure          VARCHAR(30),
    is_mandatory             BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,

    row_version              INT          NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_inv_attr_def_company  FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_inv_attr_def_code     UNIQUE (company_id, code),
    CONSTRAINT chk_inv_attr_def_type    CHECK (
        data_type IN ('String','Number','Decimal','Boolean','Date','DateTime','Json')
    )
);

COMMENT ON TABLE  inventory.inventory_attribute_definitions           IS 'Typed EAV attribute definition master for inventory items. Extends inventory master data without DDL changes (e.g. HazardClass, CustomsCode, ShelfTemperature, HumidityClass).';
COMMENT ON COLUMN inventory.inventory_attribute_definitions.data_type IS 'Value type: String, Number, Decimal, Boolean, Date, DateTime, or Json.';

CREATE TABLE inventory.inventory_attribute_values (
    id                            UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    inventory_item_id             UUID          NOT NULL,
    attribute_definition_id       UUID          NOT NULL,

    -- Strongly Typed Value Columns (exactly one must be populated)
    string_value                  TEXT,
    numeric_value                 BIGINT,
    decimal_value                 NUMERIC(18,6),
    boolean_value                 BOOLEAN,
    date_value                    DATE,
    datetime_value                TIMESTAMPTZ,
    json_value                    JSONB,

    created_at_utc                TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id            UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_inv_attr_val_item FOREIGN KEY (inventory_item_id)
        REFERENCES inventory.inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_attr_val_def  FOREIGN KEY (attribute_definition_id)
        REFERENCES inventory.inventory_attribute_definitions(id) ON DELETE RESTRICT,
    CONSTRAINT uq_inv_attr_val      UNIQUE (inventory_item_id, attribute_definition_id),

    -- Exactly one typed column must be populated
    CONSTRAINT chk_inv_attr_single_value CHECK (
        (CASE WHEN string_value   IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN numeric_value  IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN decimal_value  IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN boolean_value  IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN date_value     IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN datetime_value IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN json_value     IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

COMMENT ON TABLE inventory.inventory_attribute_values IS 'Typed EAV value store for inventory items. Exactly one typed column populated per row — enforced by chk_inv_attr_single_value. Mirrors the product attribute EAV pattern.';

-- =============================================================================
-- SECTION 8 — RESERVATION RULES & INVENTORY RESERVATIONS
-- =============================================================================

CREATE TABLE inventory.reservation_rules (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID          NOT NULL,
    warehouse_id             UUID,
    reservation_type_id      UUID          NOT NULL,

    rule_name                VARCHAR(150)  NOT NULL,
    priority                 INT           NOT NULL DEFAULT 10,
    expiry_hours             INT,
    approval_required        BOOLEAN       NOT NULL DEFAULT FALSE,
    auto_reservation_enabled BOOLEAN       NOT NULL DEFAULT FALSE,
    allow_partial_reservation BOOLEAN      NOT NULL DEFAULT TRUE,
    max_reservation_qty      NUMERIC(18,6),

    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_res_rules_company    FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_res_rules_warehouse  FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE SET NULL,
    CONSTRAINT fk_res_rules_type       FOREIGN KEY (reservation_type_id)
        REFERENCES inventory.reservation_types(id) ON DELETE RESTRICT,

    CONSTRAINT chk_res_rules_priority   CHECK (priority >= 1),
    CONSTRAINT chk_res_rules_expiry     CHECK (expiry_hours IS NULL OR expiry_hours > 0),
    CONSTRAINT chk_res_rules_max_qty    CHECK (max_reservation_qty IS NULL OR max_reservation_qty > 0)
);

COMMENT ON TABLE  inventory.reservation_rules IS
  '[ARCHITECTURAL BOUNDARY: FOUNDATION — Reservation Policy Configuration] '
  'reservation_rules defines the business POLICIES governing how reservations behave. '
  'These are configuration rows set by the operations/planning team and change infrequently. '
  'They answer questions like: How long does a Sales Order reservation live before auto-expiry? '
  'Does a Manufacturing Order reservation require approval? Can the system auto-reserve? '
  'reservation_rules belongs in Foundation because it is policy, not a runtime event. '
  'The runtime reservation instances (inventory_reservations) reference these rules for governance.';
COMMENT ON COLUMN inventory.reservation_rules.priority              IS 'Lower number = higher priority. Resolves conflicts when multiple policies apply to the same inventory item simultaneously.';
COMMENT ON COLUMN inventory.reservation_rules.expiry_hours          IS 'Maximum hours an unfulfilled reservation remains active before auto-expiry. NULL = no expiry limit.';

-- Active inventory reservations master
CREATE TABLE inventory.inventory_reservations (
    id                       UUID           PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    inventory_item_id        UUID           NOT NULL,
    reservation_type_id      UUID           NOT NULL,
    reservation_rule_id      UUID,

    reserved_qty             NUMERIC(18,6)  NOT NULL,
    allocated_qty            NUMERIC(18,6)  NOT NULL DEFAULT 0,

    -- Cross-module forward references (no FK constraint until modules implemented)
    source_document_type     VARCHAR(50),    -- SalesOrder, PurchaseReturn, ManufacturingOrder
    source_document_id       UUID,           -- References the source module document
    source_document_line_id  UUID,

    reservation_date         DATE           NOT NULL DEFAULT CURRENT_DATE,
    expiry_date              DATE,
    is_approved              BOOLEAN        NOT NULL DEFAULT FALSE,
    approved_by_user_id      UUID           REFERENCES iam.users(id) ON DELETE SET NULL,
    approved_at_utc          TIMESTAMPTZ,

    row_version              INT            NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID           REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID           REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN        NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID           REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_inv_res_item        FOREIGN KEY (inventory_item_id)
        REFERENCES inventory.inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_res_type        FOREIGN KEY (reservation_type_id)
        REFERENCES inventory.reservation_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_res_rule        FOREIGN KEY (reservation_rule_id)
        REFERENCES inventory.reservation_rules(id) ON DELETE SET NULL,

    CONSTRAINT chk_inv_res_reserved_qty  CHECK (reserved_qty   > 0),
    CONSTRAINT chk_inv_res_allocated_qty CHECK (allocated_qty  >= 0),
    CONSTRAINT chk_inv_res_alloc_le_res  CHECK (allocated_qty  <= reserved_qty),
    CONSTRAINT chk_inv_res_expiry        CHECK (
        expiry_date IS NULL OR expiry_date >= reservation_date
    )
);

COMMENT ON TABLE  inventory.inventory_reservations IS
  '[ARCHITECTURAL BOUNDARY: OPERATIONAL — Runtime Demand-Supply Linkage] '
  'inventory_reservations records live demand commitments against available stock. '
  'Each row is created by a demand event (Sales Order, Manufacturing Order, Transfer, Manual) '
  'and destroyed or fulfilled by supply events (Dispatch, Production, Cancellation). '
  'This table is classified OPERATIONAL because its rows are volatile — they are created, '
  'modified, and deleted as orders progress through their lifecycle. '
  'It is co-located in the inventory schema (rather than Sales/Manufacturing schemas) because '
  'it references inventory_items directly and must be governed by inventory policies '
  '(reservation_rules). When Sales and Manufacturing modules are implemented, they will OWN '
  'the creation and deletion of rows in this table, but the table physically resides here '
  'to maintain referential integrity with inventory_items and reservation_rules. '
  'Invariant: reserved_qty > 0 always; allocated_qty <= reserved_qty always.';
COMMENT ON COLUMN inventory.inventory_reservations.source_document_id IS 'Forward reference UUID to the originating demand document. FK constraint enforced by respective module (Sales, Manufacturing, etc.) when implemented.';

-- =============================================================================
-- SECTION 9 — CYCLE COUNT CONFIGURATION
-- =============================================================================

CREATE TABLE inventory.cycle_count_configs (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID          NOT NULL,
    warehouse_id             UUID          NOT NULL,
    product_id               UUID,
    product_category_id      UUID,
    abc_classification_id    UUID          NOT NULL,

    count_frequency_days     INT           NOT NULL DEFAULT 30,
    tolerance_pct            NUMERIC(5,2)  NOT NULL DEFAULT 2.00,
    last_count_date          DATE,
    next_count_date          DATE,
    auto_scheduling_enabled  BOOLEAN       NOT NULL DEFAULT FALSE,
    requires_double_count    BOOLEAN       NOT NULL DEFAULT FALSE,
    responsible_employee_id  UUID,          -- forward reference to employee.employees(id)

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_cc_config_company      FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cc_config_warehouse    FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cc_config_product      FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_cc_config_category     FOREIGN KEY (product_category_id)
        REFERENCES product.product_categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_cc_config_abc          FOREIGN KEY (abc_classification_id)
        REFERENCES inventory.abc_classifications(id) ON DELETE RESTRICT,

    CONSTRAINT chk_cc_frequency    CHECK (count_frequency_days > 0),
    CONSTRAINT chk_cc_tolerance    CHECK (tolerance_pct BETWEEN 0 AND 100),
    CONSTRAINT chk_cc_next_date    CHECK (
        last_count_date IS NULL OR next_count_date IS NULL OR
        next_count_date > last_count_date
    )
);

COMMENT ON TABLE  inventory.cycle_count_configs                       IS 'Configurable cycle count schedules per warehouse and product/category. Supports ABC classification-driven frequency, tolerance percentage, and double-count requirements for high-value items.';
COMMENT ON COLUMN inventory.cycle_count_configs.tolerance_pct         IS 'Acceptable variance % between system qty and physical count. Counts within tolerance auto-approved.';
COMMENT ON COLUMN inventory.cycle_count_configs.responsible_employee_id IS 'Forward reference UUID for employee.employees(id). Populated once Employee module is integrated.';

-- =============================================================================
-- SECTION 10 — TRACEABILITY MASTER
-- =============================================================================

CREATE TABLE inventory.inventory_traceability (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID          NOT NULL,

    -- Core inventory item
    inventory_item_id        UUID          NOT NULL,

    -- Traceability Dimensions
    product_id               UUID          NOT NULL,
    product_variant_id       UUID,
    batch_id                 UUID,
    lot_id                   UUID,
    serial_number_id         UUID,

    -- Location
    warehouse_id             UUID          NOT NULL,
    storage_location_id      UUID,

    -- External Entity References (forward references — no FK until modules implemented)
    supplier_id              UUID,           -- procurement.suppliers(id)
    supplier_name            VARCHAR(200),
    customer_id              UUID,           -- crm.customers(id)
    customer_name            VARCHAR(200),
    manufacturing_order_id   UUID,           -- manufacturing.orders(id)

    -- Origin Event
    origin_document_type     VARCHAR(50),    -- GRN, ProductionReceipt, StockAdjustment
    origin_document_id       UUID,
    origin_document_date     DATE,

    -- Traceability Metadata
    traceability_notes       TEXT,

    created_at_utc           TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID           REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_trace_company     FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trace_item        FOREIGN KEY (inventory_item_id)
        REFERENCES inventory.inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_trace_product     FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trace_batch       FOREIGN KEY (batch_id)
        REFERENCES inventory.batches(id) ON DELETE SET NULL,
    CONSTRAINT fk_trace_lot         FOREIGN KEY (lot_id)
        REFERENCES inventory.lots(id) ON DELETE SET NULL,
    CONSTRAINT fk_trace_serial      FOREIGN KEY (serial_number_id)
        REFERENCES inventory.serial_numbers(id) ON DELETE SET NULL,
    CONSTRAINT fk_trace_warehouse   FOREIGN KEY (warehouse_id)
        REFERENCES warehouse.warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trace_location    FOREIGN KEY (storage_location_id)
        REFERENCES warehouse.storage_locations(id) ON DELETE SET NULL
);

COMMENT ON TABLE  inventory.inventory_traceability IS
  '[ARCHITECTURAL BOUNDARY: FOUNDATION — Structural Traceability Linkage Registry] '
  'inventory_traceability records the STRUCTURAL relationships between inventory dimensions: '
  'which product → which batch → which lot → which serial → which warehouse → which location '
  '→ which supplier → which customer → which manufacturing order. '
  'This is NOT an event log and NOT a transaction history. '
  'DISTINCTION from Operations: '
  '  Foundation (this table): ''Batch B001 originated from Supplier S01 and is stored in WH-HYD Bin A02'' '
  '  Operations (future traceability_events): ''Batch B001 was moved from Bin A02 to Bin B15 at 14:30 UTC'' '
  'The structural linkage rows in this table are semi-permanent. They are created at receipt '
  'and updated on significant structural changes (warehouse transfer, location reassignment). '
  'They enable complete forward traceability (batch → all customers who received it) and backward '
  'traceability (customer complaint → originating supplier batch) for regulatory recall compliance. '
  'Future stock_movements (Procurement/Sales module) will provide the full event timeline.';
COMMENT ON COLUMN inventory.inventory_traceability.supplier_id         IS 'Forward reference UUID for procurement.suppliers(id). FK enforced when Procurement module is implemented. Denormalized supplier_name stored for standalone display.';
COMMENT ON COLUMN inventory.inventory_traceability.manufacturing_order_id IS 'Forward reference UUID for manufacturing.orders(id). FK enforced when Manufacturing module is implemented.';

-- =============================================================================
-- SECTION 11 — INVENTORY COMPLIANCE
-- =============================================================================

CREATE TABLE inventory.inventory_compliance (
    id                        UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    inventory_item_id         UUID          NOT NULL,
    compliance_status_id      UUID          NOT NULL,

    -- Customs
    customs_status            VARCHAR(50),
    customs_declaration_no    VARCHAR(100),
    customs_cleared_date      DATE,

    -- Regulatory
    regulatory_status         VARCHAR(50),
    regulatory_reference      VARCHAR(100),

    -- Certificates
    quality_certificate_no    VARCHAR(100),
    quality_certificate_date  DATE,
    inspection_certificate_no VARCHAR(100),
    inspection_date           DATE,
    inspection_expiry_date    DATE,
    inspection_authority      VARCHAR(150),

    compliance_notes          TEXT,

    row_version               INT           NOT NULL DEFAULT 1,
    created_at_utc            TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id        UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc      TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id  UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted                BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc            TIMESTAMPTZ,
    deleted_by_user_id        UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_inv_comp_item    FOREIGN KEY (inventory_item_id)
        REFERENCES inventory.inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_comp_status  FOREIGN KEY (compliance_status_id)
        REFERENCES inventory.compliance_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT uq_inv_comp_item    UNIQUE (inventory_item_id),
    CONSTRAINT chk_inv_comp_insp_dates CHECK (
        inspection_date IS NULL OR inspection_expiry_date IS NULL OR
        inspection_expiry_date >= inspection_date
    )
);

COMMENT ON TABLE  inventory.inventory_compliance                      IS 'Regulatory and customs compliance master per inventory item. Tracks customs clearance, quality certificates, inspection certificates, and compliance status. One row per inventory item.';
COMMENT ON COLUMN inventory.inventory_compliance.customs_status       IS 'Customs clearance status code (Cleared, Pending, Detained, Bonded, Exempt).';
COMMENT ON COLUMN inventory.inventory_compliance.inspection_expiry_date IS 'Date by which inspection certificate expires. Must be >= inspection_date.';

-- =============================================================================
-- SECTION 12 — INVENTORY STATUS HISTORY (AUDIT TRAIL)
-- =============================================================================

CREATE TABLE inventory.inventory_status_history (
    id                    UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    inventory_item_id     UUID          NOT NULL,
    inventory_status_id   UUID          NOT NULL,
    quality_status_id     UUID,

    effective_from        DATE          NOT NULL,
    effective_to          DATE,
    is_current            BOOLEAN       NOT NULL DEFAULT TRUE,
    changed_by_user_id    UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    reason                TEXT,
    remarks               TEXT,

    created_at_utc        TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_inv_status_hist_item    FOREIGN KEY (inventory_item_id)
        REFERENCES inventory.inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_status_hist_status  FOREIGN KEY (inventory_status_id)
        REFERENCES inventory.inventory_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_status_hist_quality FOREIGN KEY (quality_status_id)
        REFERENCES inventory.quality_statuses(id) ON DELETE SET NULL,
    CONSTRAINT chk_inv_status_hist_dates  CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    ),

    EXCLUDE USING GIST (
        inventory_item_id WITH =,
        daterange(effective_from, COALESCE(effective_to, '9999-12-31'::DATE), '[)') WITH &&
    )
);

CREATE UNIQUE INDEX uix_inv_status_hist_current
    ON inventory.inventory_status_history (inventory_item_id)
    WHERE is_current = TRUE;

COMMENT ON TABLE  inventory.inventory_status_history             IS 'Immutable audit trail of inventory item status changes. Exclusion constraint prevents overlapping date ranges. Partial unique index enforces one current record per inventory item.';
COMMENT ON COLUMN inventory.inventory_status_history.is_current  IS 'Exactly one TRUE per inventory_item_id enforced by uix_inv_status_hist_current.';

-- =============================================================================
-- SECTION 13 — COMPLETE INDEXING STRATEGY
-- =============================================================================

-- ── INVENTORY ITEMS (Core — highest query load) ───────────────────────────────

-- Partial index for active, non-deleted items
CREATE INDEX pix_inv_items_active         ON inventory.inventory_items (id)
    WHERE is_deleted = FALSE;

-- FEFO picking index — expiring soonest first for a product in a warehouse
CREATE INDEX cidx_inv_items_fefo          ON inventory.inventory_items
    (warehouse_id, product_id, expiry_date ASC, qty_available DESC)
    WHERE is_deleted = FALSE;

-- Available stock query — most common WMS lookup
CREATE INDEX cidx_inv_items_available     ON inventory.inventory_items
    (warehouse_id, product_id, inventory_status_id)
    WHERE is_deleted = FALSE AND qty_on_hand > 0;

-- Storage location stock breakdown
CREATE INDEX idx_inv_items_location       ON inventory.inventory_items (storage_location_id)
    WHERE storage_location_id IS NOT NULL AND is_deleted = FALSE;

-- FK indexes
CREATE INDEX idx_inv_items_company_id     ON inventory.inventory_items (company_id);
CREATE INDEX idx_inv_items_product_id     ON inventory.inventory_items (product_id);
CREATE INDEX idx_inv_items_variant_id     ON inventory.inventory_items (product_variant_id)
    WHERE product_variant_id IS NOT NULL;
CREATE INDEX idx_inv_items_warehouse_id   ON inventory.inventory_items (warehouse_id);
CREATE INDEX idx_inv_items_batch_id       ON inventory.inventory_items (batch_id)
    WHERE batch_id IS NOT NULL;
CREATE INDEX idx_inv_items_lot_id         ON inventory.inventory_items (lot_id)
    WHERE lot_id IS NOT NULL;
CREATE INDEX idx_inv_items_serial_id      ON inventory.inventory_items (serial_number_id)
    WHERE serial_number_id IS NOT NULL;
CREATE INDEX idx_inv_items_status_id      ON inventory.inventory_items (inventory_status_id);
CREATE INDEX idx_inv_items_quality_id     ON inventory.inventory_items (quality_status_id);
CREATE INDEX idx_inv_items_ownership_id   ON inventory.inventory_items (ownership_type_id);
CREATE INDEX idx_inv_items_type_id        ON inventory.inventory_items (inventory_type_id);

-- ── BATCHES ──────────────────────────────────────────────────────────────────
CREATE INDEX pix_batches_active           ON inventory.batches (id) WHERE is_deleted = FALSE;
CREATE INDEX idx_batches_company_product  ON inventory.batches (company_id, product_id);
CREATE INDEX idx_batches_status_id        ON inventory.batches (batch_status_id);
CREATE INDEX idx_batches_expiry_date      ON inventory.batches (expiry_date ASC)
    WHERE expiry_date IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX trgm_batches_number          ON inventory.batches USING GIN (batch_number gin_trgm_ops);

-- ── LOTS ──────────────────────────────────────────────────────────────────────
CREATE INDEX pix_lots_active              ON inventory.lots (id) WHERE is_deleted = FALSE;
CREATE INDEX idx_lots_company_product     ON inventory.lots (company_id, product_id);
CREATE INDEX idx_lots_batch_id            ON inventory.lots (batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_lots_parent_id           ON inventory.lots (parent_lot_id) WHERE parent_lot_id IS NOT NULL;
CREATE INDEX idx_lots_status_id           ON inventory.lots (lot_status_id);
CREATE INDEX trgm_lots_number             ON inventory.lots USING GIN (lot_number gin_trgm_ops);

-- ── SERIAL NUMBERS ────────────────────────────────────────────────────────────
CREATE INDEX pix_serials_active           ON inventory.serial_numbers (id) WHERE is_deleted = FALSE;
CREATE INDEX idx_serials_company_product  ON inventory.serial_numbers (company_id, product_id);
CREATE INDEX idx_serials_batch_id         ON inventory.serial_numbers (batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_serials_status_id        ON inventory.serial_numbers (serial_number_status_id);
CREATE INDEX idx_serials_warranty_expiry  ON inventory.serial_numbers (warranty_end_date ASC)
    WHERE warranty_end_date IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX trgm_serials_number          ON inventory.serial_numbers USING GIN (serial_number gin_trgm_ops);
CREATE INDEX trgm_serials_imei            ON inventory.serial_numbers USING GIN (imei gin_trgm_ops)
    WHERE imei IS NOT NULL;

-- ── INVENTORY RESERVATIONS ────────────────────────────────────────────────────
CREATE INDEX pix_inv_res_active           ON inventory.inventory_reservations (inventory_item_id)
    WHERE is_deleted = FALSE;
CREATE INDEX idx_inv_res_item_id          ON inventory.inventory_reservations (inventory_item_id);
CREATE INDEX idx_inv_res_type_id          ON inventory.inventory_reservations (reservation_type_id);
CREATE INDEX idx_inv_res_source_doc       ON inventory.inventory_reservations (source_document_id)
    WHERE source_document_id IS NOT NULL;
CREATE INDEX idx_inv_res_expiry           ON inventory.inventory_reservations (expiry_date ASC)
    WHERE expiry_date IS NOT NULL AND is_deleted = FALSE;

-- ── COST PROFILES ─────────────────────────────────────────────────────────────
CREATE INDEX idx_cost_profile_item_id     ON inventory.inventory_cost_profiles (inventory_item_id);
CREATE INDEX idx_cost_profile_method_id   ON inventory.inventory_cost_profiles (valuation_method_id);

-- ── ATTRIBUTE VALUES ──────────────────────────────────────────────────────────
CREATE INDEX idx_inv_attr_val_item_id     ON inventory.inventory_attribute_values (inventory_item_id);
CREATE INDEX idx_inv_attr_val_def_id      ON inventory.inventory_attribute_values (attribute_definition_id);
CREATE INDEX idx_inv_attr_val_json        ON inventory.inventory_attribute_values USING GIN (json_value)
    WHERE json_value IS NOT NULL;

-- ── TRACEABILITY ──────────────────────────────────────────────────────────────
CREATE INDEX idx_trace_item_id            ON inventory.inventory_traceability (inventory_item_id);
CREATE INDEX idx_trace_product_id         ON inventory.inventory_traceability (product_id);
CREATE INDEX idx_trace_batch_id           ON inventory.inventory_traceability (batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_trace_lot_id             ON inventory.inventory_traceability (lot_id) WHERE lot_id IS NOT NULL;
CREATE INDEX idx_trace_serial_id          ON inventory.inventory_traceability (serial_number_id) WHERE serial_number_id IS NOT NULL;
CREATE INDEX idx_trace_warehouse_id       ON inventory.inventory_traceability (warehouse_id);
CREATE INDEX idx_trace_supplier_id        ON inventory.inventory_traceability (supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_trace_customer_id        ON inventory.inventory_traceability (customer_id) WHERE customer_id IS NOT NULL;

-- ── CYCLE COUNT CONFIGS ───────────────────────────────────────────────────────
CREATE INDEX idx_cc_config_warehouse_id   ON inventory.cycle_count_configs (warehouse_id);
CREATE INDEX idx_cc_config_product_id     ON inventory.cycle_count_configs (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_cc_config_abc_id         ON inventory.cycle_count_configs (abc_classification_id);
CREATE INDEX idx_cc_config_next_count     ON inventory.cycle_count_configs (next_count_date ASC)
    WHERE next_count_date IS NOT NULL AND is_deleted = FALSE;

-- ── STATUS HISTORY ────────────────────────────────────────────────────────────
CREATE INDEX idx_inv_status_hist_item_id  ON inventory.inventory_status_history (inventory_item_id, effective_from);
CREATE INDEX idx_inv_status_hist_current  ON inventory.inventory_status_history (inventory_item_id)
    WHERE is_current = TRUE;

-- ── COMPLIANCE ────────────────────────────────────────────────────────────────
CREATE INDEX idx_inv_comp_item_id         ON inventory.inventory_compliance (inventory_item_id);
CREATE INDEX idx_inv_comp_status_id       ON inventory.inventory_compliance (compliance_status_id);
CREATE INDEX idx_inv_comp_insp_expiry     ON inventory.inventory_compliance (inspection_expiry_date ASC)
    WHERE inspection_expiry_date IS NOT NULL AND is_deleted = FALSE;

-- =============================================================================
-- SECTION 14 — ARCHITECTURAL BOUNDARY COMMENT DOCUMENTATION
-- =============================================================================
--
-- BOUNDARY KEY:
--   [LOOKUP]      Configuration lookup tables — immutable once seeded.
--   [REGISTRY]    Permanent enterprise registries — never deleted, outlive transactions.
--   [FOUNDATION]  Configuration and policy tables — rarely change, set by business admin.
--   [BALANCE]     Authoritative current-state balance — updated atomically by Operations.
--   [OPERATIONAL] Runtime volatile tables — created/modified/deleted by module events.
--   [HYBRID]      Dual-purpose: FOUNDATION config columns + OPERATIONAL snapshot columns.
-- =============================================================================

-- LOOKUP TABLES [FOUNDATION]
COMMENT ON TABLE inventory.inventory_types         IS '[LOOKUP] Configurable inventory type classification. Seeded at deployment. No hardcoded ENUMs.';
COMMENT ON TABLE inventory.inventory_statuses      IS '[LOOKUP] Inventory status master with blocking flag metadata. Seeded at deployment.';
COMMENT ON TABLE inventory.ownership_types         IS '[LOOKUP] Inventory ownership classification for financial valuation routing.';
COMMENT ON TABLE inventory.quality_statuses        IS '[LOOKUP] QC quality gate status master controlling inventory usability.';
COMMENT ON TABLE inventory.batch_statuses          IS '[LOOKUP] Batch lifecycle status for FEFO gating and regulatory recall management.';
COMMENT ON TABLE inventory.lot_statuses            IS '[LOOKUP] Lot lifecycle status for traceability lineage governance.';
COMMENT ON TABLE inventory.serial_number_statuses  IS '[LOOKUP] Serial number custody status for individual unit tracking.';
COMMENT ON TABLE inventory.stock_policies          IS '[LOOKUP] Inventory consumption strategy definitions (FIFO, FEFO, LIFO, etc.).';
COMMENT ON TABLE inventory.valuation_methods       IS '[LOOKUP] Financial inventory valuation method definitions. Links to Finance module.';
COMMENT ON TABLE inventory.abc_classifications     IS '[LOOKUP] ABC cycle count frequency and tolerance configuration per class.';
COMMENT ON TABLE inventory.reservation_types       IS '[LOOKUP] Reservation origin classification (SalesOrder, MO, Transfer, etc.).';
COMMENT ON TABLE inventory.compliance_statuses     IS '[LOOKUP] Regulatory compliance state classification.';

-- ENTERPRISE REGISTRIES [FOUNDATION — PERMANENT]
COMMENT ON TABLE inventory.batches          IS '[REGISTRY — PERMANENT] Batch identity records. Exist permanently for FEFO, QC, recall, and audit — even after inventory is fully consumed.';
COMMENT ON TABLE inventory.lots             IS '[REGISTRY — PERMANENT] Lot identity and lineage records. Permanent traceability graph nodes for split/merge history.';
COMMENT ON TABLE inventory.serial_numbers   IS '[REGISTRY — PERMANENT] Individual serialized unit identity records. Permanent product passports for warranty, compliance, and after-sales.';

-- CORE INVENTORY [BALANCE + HYBRID]
COMMENT ON TABLE inventory.inventory_items               IS '[BALANCE — AUTHORITATIVE] Authoritative current inventory balance table. Read by all modules for available quantity. Updated atomically by Procurement/Sales/WMS stock_movement jobs.';
COMMENT ON TABLE inventory.inventory_cost_profiles       IS '[HYBRID: FOUNDATION config + OPERATIONAL snapshot] Cost policy config (valuation_method, currency, GL account) plus operational cost snapshots (average_cost, last_purchase_cost) updated by Procurement.';
COMMENT ON TABLE inventory.inventory_attribute_definitions IS '[FOUNDATION] Typed EAV attribute schema definitions per company. Changed by configuration admin only.';
COMMENT ON TABLE inventory.inventory_attribute_values    IS '[OPERATIONAL] EAV attribute value instances per inventory item. Created/updated when inventory items are created or modified.';

-- POLICY & SCHEDULING [FOUNDATION]
COMMENT ON TABLE inventory.reservation_rules             IS '[FOUNDATION] Reservation policy configuration per company/warehouse/reservation_type. Set by operations team.';
COMMENT ON TABLE inventory.cycle_count_configs           IS '[FOUNDATION] ABC-driven cycle count scheduling configuration per warehouse and product/category.';

-- RUNTIME OPERATIONS [OPERATIONAL]
COMMENT ON TABLE inventory.inventory_reservations        IS '[OPERATIONAL] Live demand-to-supply reservation linkages. Rows created by Sales/MO/Transfer modules; deleted on fulfillment or cancellation. Governed by reservation_rules.';
COMMENT ON TABLE inventory.inventory_status_history      IS '[OPERATIONAL] Immutable status change audit log. Append-only. Exclusion constraint prevents overlapping periods.';

-- STRUCTURAL RELATIONSHIPS [FOUNDATION]
COMMENT ON TABLE inventory.inventory_traceability        IS '[FOUNDATION — Structural Linkage] Semi-permanent linkage registry: product→batch→lot→serial→warehouse→location→supplier→customer→MO. NOT a transaction log. Enables forward/backward regulatory recall tracing.';
COMMENT ON TABLE inventory.inventory_compliance          IS '[FOUNDATION] Regulatory and customs compliance classification per inventory item. Changed infrequently by compliance team.';
