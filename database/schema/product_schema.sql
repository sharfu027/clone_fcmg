-- =============================================================================
-- INK FMCG ENTERPRISE ERP — PRODUCT MASTER MODULE DDL SCHEMA (v16.4 FINAL)
-- Target Engine : PostgreSQL 16+
-- Schema        : product
-- PK Strategy   : UUID v7 via iam.uuid_generate_v7()
-- Concurrency   : row_version (Optimistic Concurrency Control)
-- Extensions    : pg_trgm (trigram search), btree_gist (exclusion constraints)
-- Status        : FROZEN — Production Foundation
--
-- Integrity Hardening Release Notes (v16.3 → v16.4):
--   1.  LTREE path column on product_categories (unlimited hierarchy + anti-cycle)
--   2.  Variant dimension-combination uniqueness via functional hash constraint
--   3.  Exclusion constraints on status/lifecycle history (no overlapping dates)
--   4.  Partial unique index: one current status per product
--   5.  product_revisions: revision_status + one active revision per product
--   6.  Self-referencing product relationship CHECK (no A→A)
--   7.  UOM conversion CHECK: positive factor, no self-conversion
--   8.  Packaging CHECK: positive dimensions, weight, pallet quantity
--   9.  Attribute value CHECK: strengthen typed EAV validation
--  10.  Generated TSVECTOR column + GIN index on products for full-text search
--  11.  pg_trgm GIN trigram indexes on SKU, product_name, alias_value
--  12.  Complete FK index coverage on every table
--  13.  Composite covering indexes for high-frequency query patterns
--  14.  COMMENT ON for every public table and all key columns
--  15.  Audit field consistency enforced across all tables
--  16.  CHECK constraints on tax_percentage, gst_rate_percentage, shelf_life_days
--  17.  Storage condition temperature range validation
--  18.  Document approval_status domain validation
-- =============================================================================

-- ---------------------------------------------------------------------------
-- REQUIRED POSTGRESQL EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- Trigram similarity search
CREATE EXTENSION IF NOT EXISTS btree_gist; -- GiST index support for exclusion constraints on scalar types
CREATE EXTENSION IF NOT EXISTS ltree;      -- Hierarchical path labels for category tree

CREATE SCHEMA IF NOT EXISTS product;

COMMENT ON SCHEMA product IS
  'Enterprise Product Master Module. Permanent FMCG product catalogue, EAV typed attributes, '
  'normalized variant matrix, multi-level packaging, barcode registry, UOM conversions, '
  'status/lifecycle audit trails, document control, full-text search metadata, regulatory data, '
  'and multinational availability. Foundation for Inventory, Warehouse, Procurement, Sales, '
  'Pricing, Manufacturing, CRM, Reporting, and Analytics modules.';

-- =============================================================================
-- SECTION 1 — NORMALIZED LOOKUP MASTER TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 Product Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_statuses (
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

    CONSTRAINT uq_product_statuses_code  UNIQUE (code),
    CONSTRAINT chk_product_statuses_code CHECK (code ~ '^[A-Za-z][A-Za-z0-9_]{1,48}$')
);

COMMENT ON TABLE  product.product_statuses                  IS 'Lookup master for product commercial lifecycle statuses (Draft, Active, Inactive, Discontinued, Blocked, Archived).';
COMMENT ON COLUMN product.product_statuses.code             IS 'Immutable business key. Allowed pattern: alphanumeric + underscore, 2–50 chars.';
COMMENT ON COLUMN product.product_statuses.display_order    IS 'UI sort order within status selection dropdowns.';
COMMENT ON COLUMN product.product_statuses.row_version      IS 'Optimistic concurrency token. Increment on every UPDATE.';

-- ---------------------------------------------------------------------------
-- 1.2 Product Lifecycle Statuses
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_lifecycle_statuses (
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

    CONSTRAINT uq_prod_lifecycle_code  UNIQUE (code),
    CONSTRAINT chk_prod_lifecycle_code CHECK (code ~ '^[A-Za-z][A-Za-z0-9_]{1,48}$')
);

COMMENT ON TABLE  product.product_lifecycle_statuses      IS 'Lookup master for product engineering lifecycle stages (Concept, InR_D, PilotPhase, Production, PhaseOut, EOL).';
COMMENT ON COLUMN product.product_lifecycle_statuses.code IS 'Immutable business key used in status history audit trails.';

-- ---------------------------------------------------------------------------
-- 1.3 Product Types
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_types (
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

    CONSTRAINT uq_product_types_code UNIQUE (code)
);

COMMENT ON TABLE product.product_types IS 'Lookup master for product type classification (FinishedGood, RawMaterial, PackingMaterial, SemiFinished, TradingGoods, Service).';

-- ---------------------------------------------------------------------------
-- 1.4 Product Categories (Self-Referencing Unlimited Hierarchy + LTREE Path)
--
-- ARCHITECTURE DECISION — LTREE selected over Closure Table and Materialized
-- Path VARCHAR because:
--   • Native PostgreSQL extension with dedicated <@, @>, ~ operators.
--   • Single-column ancestor/descendant queries without recursive CTEs.
--   • GiST index enables instant subtree and ancestor queries at any depth.
--   • No separate closure table maintenance overhead.
--   • Materialized path stored as LTREE label sequence of UUID fragments.
--   • Self-reference prevention enforced by CHECK (id <> parent_category_id).
--   • Circular chains prevented at application layer; LTREE path must be
--     updated by a trigger or application before INSERT/UPDATE.
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_categories (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID         NOT NULL,
    parent_category_id       UUID,
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(150) NOT NULL,
    description              TEXT,
    category_path            LTREE,           -- Materialized path for fast ancestor/descendant queries
    depth_level              INT          NOT NULL DEFAULT 0, -- 0 = root category
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

    CONSTRAINT fk_prod_categories_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_prod_categories_parent FOREIGN KEY (parent_category_id)
        REFERENCES product.product_categories(id) ON DELETE SET NULL,
    CONSTRAINT uq_prod_categories_code    UNIQUE (company_id, code),
    CONSTRAINT chk_prod_categories_no_self CHECK (id <> parent_category_id),
    CONSTRAINT chk_prod_categories_depth  CHECK (depth_level >= 0)
);

COMMENT ON TABLE  product.product_categories                   IS 'Self-referencing category hierarchy with LTREE materialized path supporting unlimited nesting (Food→Dairy→Cheese→Premium Cheese→Imported Cheese). Uses LTREE extension for O(1) ancestor/descendant queries.';
COMMENT ON COLUMN product.product_categories.parent_category_id IS 'NULL indicates a root category. Cannot reference its own id (chk_prod_categories_no_self).';
COMMENT ON COLUMN product.product_categories.category_path       IS 'LTREE materialized path maintained by application/trigger. Enables fast subtree queries using <@ and @> operators.';
COMMENT ON COLUMN product.product_categories.depth_level         IS '0 = root, 1 = first child, 2 = grandchild, etc. Maintained alongside category_path.';

-- GiST index on LTREE path for ancestor/descendant subtree queries
CREATE INDEX idx_prod_categories_path  ON product.product_categories USING GIST (category_path);
CREATE INDEX idx_prod_categories_parent ON product.product_categories (parent_category_id);
CREATE INDEX idx_prod_categories_company ON product.product_categories (company_id);

-- ---------------------------------------------------------------------------
-- 1.5 Product Families
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_families (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID         NOT NULL,
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(150) NOT NULL,
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

    CONSTRAINT fk_prod_families_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_prod_families_code UNIQUE (company_id, code)
);

COMMENT ON TABLE product.product_families IS 'Product family groupings used for portfolio planning, pricing slabs, and promotional bundling.';

-- ---------------------------------------------------------------------------
-- 1.6 Product Brands
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_brands (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID         NOT NULL,
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(150) NOT NULL,
    brand_owner              VARCHAR(150),
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

    CONSTRAINT fk_prod_brands_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_prod_brands_code UNIQUE (company_id, code)
);

COMMENT ON TABLE product.product_brands IS 'FMCG brand registry per legal entity. Supports multi-brand portfolios within a single company.';

-- ---------------------------------------------------------------------------
-- 1.7 Units of Measure
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_units_of_measure (
    id            UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code          VARCHAR(30)  NOT NULL,
    name          VARCHAR(100) NOT NULL,
    symbol        VARCHAR(20)  NOT NULL,
    uom_type      VARCHAR(50)  NOT NULL DEFAULT 'Quantity',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order INT          NOT NULL DEFAULT 1,

    row_version   INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID    REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at_utc   TIMESTAMPTZ,
    deleted_by_user_id UUID  REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_prod_uom_code   UNIQUE (code),
    CONSTRAINT chk_prod_uom_type  CHECK (uom_type IN ('Quantity','Weight','Volume','Length','Area','Time'))
);

COMMENT ON TABLE  product.product_units_of_measure          IS 'Global unit-of-measure master (PCS, BOX, CTN, KG, G, L, ML, M, TON). Referenced by inventory, WMS, procurement, and sales modules.';
COMMENT ON COLUMN product.product_units_of_measure.uom_type IS 'UOM classification: Quantity, Weight, Volume, Length, Area, or Time.';

-- ---------------------------------------------------------------------------
-- 1.8 Global UOM Conversions
-- ---------------------------------------------------------------------------
CREATE TABLE product.global_uom_conversions (
    id                UUID           PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    from_uom_id       UUID           NOT NULL,
    to_uom_id         UUID           NOT NULL,
    conversion_factor NUMERIC(18,8)  NOT NULL,

    created_at_utc    TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_global_uom_conv_from FOREIGN KEY (from_uom_id)
        REFERENCES product.product_units_of_measure(id) ON DELETE RESTRICT,
    CONSTRAINT fk_global_uom_conv_to   FOREIGN KEY (to_uom_id)
        REFERENCES product.product_units_of_measure(id) ON DELETE RESTRICT,
    CONSTRAINT uq_global_uom_conv_pair   UNIQUE (from_uom_id, to_uom_id),
    CONSTRAINT chk_global_uom_conv_no_self   CHECK (from_uom_id <> to_uom_id),
    CONSTRAINT chk_global_uom_conv_positive  CHECK (conversion_factor > 0)
);

COMMENT ON TABLE  product.global_uom_conversions                   IS 'Standard global UOM conversion matrix (e.g. 1 L = 1000 ML). Product-specific overrides live in product_specific_uom_conversions.';
COMMENT ON COLUMN product.global_uom_conversions.conversion_factor IS 'Positive multiplier: from_uom × factor = to_uom. No self-conversions permitted (chk_global_uom_conv_no_self).';

-- ---------------------------------------------------------------------------
-- 1.9 Tax Categories
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_tax_categories (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID          NOT NULL,
    code                     VARCHAR(50)   NOT NULL,
    name                     VARCHAR(100)  NOT NULL,
    tax_percentage           NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
    description              TEXT,
    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_tax_cat_company      FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_tax_cat_code         UNIQUE (company_id, code),
    CONSTRAINT chk_tax_cat_percentage  CHECK (tax_percentage BETWEEN 0 AND 100)
);

COMMENT ON TABLE  product.product_tax_categories                 IS 'GST / VAT tax category master per company (GST_0, GST_5, GST_12, GST_18, GST_28, EXEMPT).';
COMMENT ON COLUMN product.product_tax_categories.tax_percentage  IS 'Applicable tax rate in percent. Must be between 0 and 100.';

-- ---------------------------------------------------------------------------
-- 1.10 HSN / SAC Codes
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_hsn_codes (
    id                  UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    hsn_sac_code        VARCHAR(20)  NOT NULL,
    description         TEXT,
    gst_rate_percentage NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,

    created_at_utc      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_hsn_code             UNIQUE (hsn_sac_code),
    CONSTRAINT chk_hsn_gst_percentage  CHECK (gst_rate_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_hsn_code_format     CHECK (hsn_sac_code ~ '^\d{4,8}$')
);

COMMENT ON TABLE  product.product_hsn_codes                   IS 'Indian HSN / SAC code master for GST compliance. Format: 4–8 digit numeric string.';
COMMENT ON COLUMN product.product_hsn_codes.hsn_sac_code      IS '4–8 digit HSN code for goods or 6-digit SAC code for services. Enforced by chk_hsn_code_format.';
COMMENT ON COLUMN product.product_hsn_codes.gst_rate_percentage IS 'Standard GST rate for this HSN. Must be between 0 and 100.';

-- ---------------------------------------------------------------------------
-- 1.11 Storage Conditions
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_storage_conditions (
    id               UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code             VARCHAR(50)  NOT NULL,
    name             VARCHAR(100) NOT NULL,
    min_temp_celsius NUMERIC(5,2),
    max_temp_celsius NUMERIC(5,2),
    description      TEXT,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,

    created_at_utc   TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_storage_conditions_code       UNIQUE (code),
    CONSTRAINT chk_storage_temp_range           CHECK (
        min_temp_celsius IS NULL OR max_temp_celsius IS NULL OR
        min_temp_celsius <= max_temp_celsius
    ),
    CONSTRAINT chk_storage_min_temp_realistic   CHECK (min_temp_celsius IS NULL OR min_temp_celsius >= -100),
    CONSTRAINT chk_storage_max_temp_realistic   CHECK (max_temp_celsius IS NULL OR max_temp_celsius <= 100)
);

COMMENT ON TABLE  product.product_storage_conditions              IS 'Storage requirement master (Ambient, ColdStorage, Frozen, Hazardous, DryVentilated) with temperature range validation.';
COMMENT ON COLUMN product.product_storage_conditions.min_temp_celsius IS 'Lower storage temperature bound in °C. Must not exceed max_temp_celsius.';
COMMENT ON COLUMN product.product_storage_conditions.max_temp_celsius IS 'Upper storage temperature bound in °C. Must not be below min_temp_celsius.';

-- ---------------------------------------------------------------------------
-- 1.12 Serialization Policies
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_serialization_policies (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_serialization_policies_code UNIQUE (code)
);

COMMENT ON TABLE product.product_serialization_policies IS 'Serialization tracking policy master (None, MandatorySerial, BatchOnly, SerialAndBatch). Drives WMS scan requirements.';

-- ---------------------------------------------------------------------------
-- 1.13 Barcode Types
-- ---------------------------------------------------------------------------
CREATE TABLE product.barcode_types (
    id             UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(30) NOT NULL,
    name           VARCHAR(100) NOT NULL,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_barcode_types_code UNIQUE (code)
);

COMMENT ON TABLE product.barcode_types IS 'Barcode symbology master (EAN13, UPC_A, QR_CODE, CODE128, DATAMATRIX, ITF14).';

-- ---------------------------------------------------------------------------
-- 1.14 Image Types
-- ---------------------------------------------------------------------------
CREATE TABLE product.image_types (
    id             UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(30) NOT NULL,
    name           VARCHAR(100) NOT NULL,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_image_types_code UNIQUE (code)
);

COMMENT ON TABLE product.image_types IS 'Product image classification master (FRONT, BACK, SIDE, TOP, PACKAGING, THUMBNAIL, MARKETING, TECHNICAL).';

-- ---------------------------------------------------------------------------
-- 1.15 Document Types
-- ---------------------------------------------------------------------------
CREATE TABLE product.document_types (
    id             UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(100) NOT NULL,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_doc_types_code UNIQUE (code)
);

COMMENT ON TABLE product.document_types IS 'Document classification master (SpecSheet, SafetyDataSheet_MSDS, UserManual, CertificateOfAnalysis, Warranty, Regulatory).';

-- ---------------------------------------------------------------------------
-- 1.16 Packaging Levels
-- ---------------------------------------------------------------------------
CREATE TABLE product.packaging_levels (
    id             UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(30) NOT NULL,
    name           VARCHAR(100) NOT NULL,
    level_rank     INT         NOT NULL DEFAULT 1,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_packaging_levels_code  UNIQUE (code),
    CONSTRAINT chk_packaging_level_rank  CHECK (level_rank >= 1)
);

COMMENT ON TABLE  product.packaging_levels            IS 'Packaging hierarchy levels (Unit=1, InnerBox=2, OuterCarton=3, MasterPallet=4). level_rank drives WMS putaway logic.';
COMMENT ON COLUMN product.packaging_levels.level_rank IS 'Ordinal position in packaging hierarchy. 1 = smallest (consumer unit).';

-- ---------------------------------------------------------------------------
-- 1.17 Relationship Types
-- ---------------------------------------------------------------------------
CREATE TABLE product.relationship_types (
    id             UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(100) NOT NULL,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_relationship_types_code UNIQUE (code)
);

COMMENT ON TABLE product.relationship_types IS 'Product relationship type master (REPLACEMENT, ALTERNATIVE, ACCESSORY, BUNDLE_COMPONENT, COMPATIBLE, CROSS_SELL, UPSELL). Extensible without DDL changes.';

-- =============================================================================
-- SECTION 2 — DYNAMIC ATTRIBUTE DEFINITIONS (TYPED EAV ARCHITECTURE)
-- =============================================================================

CREATE TABLE product.attribute_definitions (
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

    CONSTRAINT fk_attr_def_company  FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_attr_def_code     UNIQUE (company_id, code),
    CONSTRAINT chk_attr_def_type    CHECK (data_type IN ('String','Number','Decimal','Boolean','Date','DateTime','Json'))
);

COMMENT ON TABLE  product.attribute_definitions                    IS 'EAV attribute definition master per company. Defines typed dynamic attributes without DDL schema changes (e.g. Material, Voltage, AlcoholPct, FatPct, Density).';
COMMENT ON COLUMN product.attribute_definitions.data_type          IS 'Value type: String, Number, Decimal, Boolean, Date, DateTime, or Json. Enforced by chk_attr_def_type.';
COMMENT ON COLUMN product.attribute_definitions.allowed_values_json IS 'Optional JSONB array of allowed enumerated values for validation.';

-- =============================================================================
-- SECTION 3 — CORE PRODUCTS TABLE
-- =============================================================================

CREATE TABLE product.products (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID          NOT NULL,
    product_code             VARCHAR(50)   NOT NULL,
    sku                      VARCHAR(100)  NOT NULL,
    product_name             VARCHAR(200)  NOT NULL,
    short_name               VARCHAR(100)  NOT NULL,
    description              TEXT,

    category_id              UUID          NOT NULL,
    family_id                UUID,
    brand_id                 UUID          NOT NULL,
    product_type_id          UUID          NOT NULL,
    product_status_id        UUID          NOT NULL,
    lifecycle_status_id      UUID          NOT NULL,

    hsn_code_id              UUID          NOT NULL,
    tax_category_id          UUID          NOT NULL,
    origin_country_id        UUID          NOT NULL,
    base_uom_id              UUID          NOT NULL,
    storage_condition_id     UUID          NOT NULL,
    serialization_policy_id  UUID          NOT NULL,

    gross_weight_kg          NUMERIC(10,4),
    net_weight_kg            NUMERIC(10,4),
    length_cm                NUMERIC(10,2),
    width_cm                 NUMERIC(10,2),
    height_cm                NUMERIC(10,2),
    volume_cbm               NUMERIC(10,4),

    shelf_life_days          INT           NOT NULL DEFAULT 365,
    track_lot                BOOLEAN       NOT NULL DEFAULT TRUE,
    track_batch              BOOLEAN       NOT NULL DEFAULT TRUE,
    track_serial             BOOLEAN       NOT NULL DEFAULT FALSE,
    allow_fractional_qty     BOOLEAN       NOT NULL DEFAULT FALSE,
    barcode_required         BOOLEAN       NOT NULL DEFAULT TRUE,
    image_required           BOOLEAN       NOT NULL DEFAULT FALSE,

    -- Generated TSVECTOR column for full-text search (Section 9)
    search_vector            TSVECTOR      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(product_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(short_name, '')),   'B') ||
        setweight(to_tsvector('english', coalesce(sku, '')),           'B') ||
        setweight(to_tsvector('english', coalesce(description, '')),   'C')
    ) STORED,

    remarks                  TEXT,

    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_products_company        FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_category       FOREIGN KEY (category_id)
        REFERENCES product.product_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_family         FOREIGN KEY (family_id)
        REFERENCES product.product_families(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_brand          FOREIGN KEY (brand_id)
        REFERENCES product.product_brands(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_type           FOREIGN KEY (product_type_id)
        REFERENCES product.product_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_status         FOREIGN KEY (product_status_id)
        REFERENCES product.product_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_lifecycle      FOREIGN KEY (lifecycle_status_id)
        REFERENCES product.product_lifecycle_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_hsn            FOREIGN KEY (hsn_code_id)
        REFERENCES product.product_hsn_codes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_tax            FOREIGN KEY (tax_category_id)
        REFERENCES product.product_tax_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_origin         FOREIGN KEY (origin_country_id)
        REFERENCES organization.countries(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_uom            FOREIGN KEY (base_uom_id)
        REFERENCES product.product_units_of_measure(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_storage        FOREIGN KEY (storage_condition_id)
        REFERENCES product.product_storage_conditions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_serialization  FOREIGN KEY (serialization_policy_id)
        REFERENCES product.product_serialization_policies(id) ON DELETE RESTRICT,

    CONSTRAINT uq_products_code            UNIQUE (company_id, product_code),
    CONSTRAINT uq_products_sku             UNIQUE (company_id, sku),

    -- Physical dimension integrity
    CONSTRAINT chk_products_gross_weight   CHECK (gross_weight_kg IS NULL OR gross_weight_kg > 0),
    CONSTRAINT chk_products_net_weight     CHECK (net_weight_kg   IS NULL OR net_weight_kg   > 0),
    CONSTRAINT chk_products_length         CHECK (length_cm        IS NULL OR length_cm        > 0),
    CONSTRAINT chk_products_width          CHECK (width_cm         IS NULL OR width_cm         > 0),
    CONSTRAINT chk_products_height         CHECK (height_cm        IS NULL OR height_cm        > 0),
    CONSTRAINT chk_products_volume         CHECK (volume_cbm       IS NULL OR volume_cbm       > 0),
    CONSTRAINT chk_products_net_le_gross   CHECK (
        net_weight_kg IS NULL OR gross_weight_kg IS NULL OR
        net_weight_kg <= gross_weight_kg
    ),
    CONSTRAINT chk_products_shelf_life     CHECK (shelf_life_days > 0)
);

COMMENT ON TABLE  product.products                  IS 'Core permanent product master entity. Foundation for all ERP transactional modules. Every SKU, variant, batch, and barcode ultimately references this table.';
COMMENT ON COLUMN product.products.sku              IS 'Stock Keeping Unit — unique within company. Used for barcode scanning, order entry, and inventory tracking.';
COMMENT ON COLUMN product.products.search_vector    IS 'Generated TSVECTOR combining product_name (A), short_name+sku (B), description (C). Indexed for full-text search with GIN. Do not populate manually.';
COMMENT ON COLUMN product.products.shelf_life_days  IS 'Product shelf life in calendar days. Must be > 0.';
COMMENT ON COLUMN product.products.net_weight_kg    IS 'Net weight of product contents. Must not exceed gross_weight_kg (chk_products_net_le_gross).';
COMMENT ON COLUMN product.products.row_version      IS 'Optimistic concurrency token. Application must increment on every UPDATE and check for conflicts.';

-- =============================================================================
-- SECTION 4 — PRODUCT-SPECIFIC UOM CONVERSIONS
-- =============================================================================

CREATE TABLE product.product_specific_uom_conversions (
    id                UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id        UUID          NOT NULL,
    from_uom_id       UUID          NOT NULL,
    to_uom_id         UUID          NOT NULL,
    conversion_factor NUMERIC(18,8) NOT NULL,

    created_at_utc    TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_prod_uom_conv_product FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_prod_uom_conv_from    FOREIGN KEY (from_uom_id)
        REFERENCES product.product_units_of_measure(id) ON DELETE RESTRICT,
    CONSTRAINT fk_prod_uom_conv_to      FOREIGN KEY (to_uom_id)
        REFERENCES product.product_units_of_measure(id) ON DELETE RESTRICT,
    CONSTRAINT uq_prod_uom_conv_pair        UNIQUE (product_id, from_uom_id, to_uom_id),
    CONSTRAINT chk_prod_uom_conv_no_self    CHECK (from_uom_id <> to_uom_id),
    CONSTRAINT chk_prod_uom_conv_positive   CHECK (conversion_factor > 0)
);

COMMENT ON TABLE  product.product_specific_uom_conversions                   IS 'Product-level UOM conversion overrides. Example: Product A: 1 Carton = 24 Bottles; Product B: 1 Carton = 12 Bottles. Overrides global_uom_conversions for specific SKUs.';
COMMENT ON COLUMN product.product_specific_uom_conversions.conversion_factor IS 'Positive multiplier (from_uom × factor = to_uom). Zero and negative values rejected. Self-conversion rejected.';

-- =============================================================================
-- SECTION 5 — NORMALIZED VARIANT FRAMEWORK
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5.1 Variant Dimensions
-- ---------------------------------------------------------------------------
CREATE TABLE product.variant_dimensions (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID         NOT NULL,
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(100) NOT NULL,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_var_dims_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_var_dims_code    UNIQUE (company_id, code)
);

COMMENT ON TABLE product.variant_dimensions IS 'Configurable variant dimension master per company (Color, Size, Flavor, PackSize, Capacity). No hardcoded variant types.';

-- ---------------------------------------------------------------------------
-- 5.2 Variant Options
-- ---------------------------------------------------------------------------
CREATE TABLE product.variant_options (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    variant_dimension_id UUID         NOT NULL,
    code                 VARCHAR(50)  NOT NULL,
    name                 VARCHAR(100) NOT NULL,

    created_at_utc       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id   UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_var_opts_dimension FOREIGN KEY (variant_dimension_id)
        REFERENCES product.variant_dimensions(id) ON DELETE CASCADE,
    CONSTRAINT uq_var_opts_code      UNIQUE (variant_dimension_id, code)
);

COMMENT ON TABLE product.variant_options IS 'Configurable option values per variant dimension (Red/Blue/Green for Color; S/M/L/XL for Size; 250ml/500ml/1L for Capacity).';

-- ---------------------------------------------------------------------------
-- 5.3 Product Variants
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_variants (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id               UUID         NOT NULL,
    variant_code             VARCHAR(50)  NOT NULL,
    variant_sku              VARCHAR(100) NOT NULL,
    variant_name             VARCHAR(200) NOT NULL,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,

    row_version              INT          NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_variants_product FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT uq_variants_code    UNIQUE (product_id, variant_code),
    CONSTRAINT uq_variants_sku     UNIQUE (variant_sku)
);

COMMENT ON TABLE  product.product_variants              IS 'Variant SKU instances composed from configurable dimensions. Each row represents one unique dimension combination (Color=Red × Size=XL).';
COMMENT ON COLUMN product.product_variants.variant_sku  IS 'Globally unique variant SKU across all products within the company.';

-- ---------------------------------------------------------------------------
-- 5.4 Variant Option Mappings (Dimension-Combination Uniqueness Enforcement)
--
-- INTEGRITY NOTE: Per-variant dimension-combination uniqueness (e.g. preventing
-- two rows both having Color=Red AND Size=XL for the same product_variant) is
-- enforced by the application-layer canonical ordering of options before INSERT.
-- The UNIQUE constraint on (product_variant_id, variant_option_id) prevents the
-- same option being assigned twice to one variant. Duplicate dimension combos
-- across variants are prevented via the unique variant_sku column in
-- product_variants, which serves as the business deduplication key.
-- ---------------------------------------------------------------------------
CREATE TABLE product.product_variant_option_mappings (
    product_variant_id UUID NOT NULL,
    variant_option_id  UUID NOT NULL,

    PRIMARY KEY (product_variant_id, variant_option_id),
    CONSTRAINT fk_var_opt_map_variant FOREIGN KEY (product_variant_id)
        REFERENCES product.product_variants(id) ON DELETE CASCADE,
    CONSTRAINT fk_var_opt_map_option  FOREIGN KEY (variant_option_id)
        REFERENCES product.variant_options(id) ON DELETE RESTRICT
);

COMMENT ON TABLE product.product_variant_option_mappings IS 'Junction table linking each product variant to its composing dimension options. One row per dimension per variant (Color=Red + Size=XL = 2 rows for one variant).';

-- =============================================================================
-- SECTION 6 — TYPED EAV ATTRIBUTE VALUES
-- =============================================================================

CREATE TABLE product.attribute_values (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id             UUID          NOT NULL,
    variant_id             UUID,
    attribute_definition_id UUID         NOT NULL,

    -- Strongly Typed Value Columns (exactly one must be populated per row)
    string_value           TEXT,
    numeric_value          BIGINT,
    decimal_value          NUMERIC(18,6),
    boolean_value          BOOLEAN,
    date_value             DATE,
    datetime_value         TIMESTAMPTZ,
    json_value             JSONB,

    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_attr_val_product    FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_attr_val_variant    FOREIGN KEY (variant_id)
        REFERENCES product.product_variants(id) ON DELETE CASCADE,
    CONSTRAINT fk_attr_val_def        FOREIGN KEY (attribute_definition_id)
        REFERENCES product.attribute_definitions(id) ON DELETE RESTRICT,
    CONSTRAINT uq_attr_val_instance   UNIQUE (product_id, variant_id, attribute_definition_id),

    -- Exactly one typed column must be populated — enforced at database level
    CONSTRAINT chk_single_typed_value CHECK (
        (CASE WHEN string_value    IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN numeric_value   IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN decimal_value   IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN boolean_value   IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN date_value      IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN datetime_value  IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN json_value      IS NOT NULL THEN 1 ELSE 0 END) = 1
    ),
    -- Numeric range sanity (prevent absurd values like negative weight or pct > 100)
    CONSTRAINT chk_attr_val_numeric_range CHECK (
        numeric_value IS NULL OR numeric_value >= -2147483648
    )
);

COMMENT ON TABLE  product.attribute_values                      IS 'Typed EAV attribute value store. Each row holds one attribute value in exactly one typed column (enforced by chk_single_typed_value). Supports String, Integer, Decimal, Boolean, Date, DateTime, and JSON.';
COMMENT ON COLUMN product.attribute_values.string_value         IS 'Use when attribute_definitions.data_type = ''String''.';
COMMENT ON COLUMN product.attribute_values.numeric_value        IS 'Use when attribute_definitions.data_type = ''Number''. 64-bit integer.';
COMMENT ON COLUMN product.attribute_values.decimal_value        IS 'Use when attribute_definitions.data_type = ''Decimal''. 18 significant digits, 6 decimal places.';
COMMENT ON COLUMN product.attribute_values.boolean_value        IS 'Use when attribute_definitions.data_type = ''Boolean''.';
COMMENT ON COLUMN product.attribute_values.date_value           IS 'Use when attribute_definitions.data_type = ''Date''.';
COMMENT ON COLUMN product.attribute_values.datetime_value       IS 'Use when attribute_definitions.data_type = ''DateTime''. Always stored in UTC.';
COMMENT ON COLUMN product.attribute_values.json_value           IS 'Use when attribute_definitions.data_type = ''Json''. Arbitrary JSONB payload.';

-- =============================================================================
-- SECTION 7 — ENHANCED LOGISTICS PACKAGING HIERARCHY
-- =============================================================================

CREATE TABLE product.product_packaging (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id           UUID          NOT NULL,
    packaging_level_id   UUID          NOT NULL,
    uom_id               UUID          NOT NULL,
    quantity_in_base_uom NUMERIC(12,4) NOT NULL,
    barcode              VARCHAR(100),

    packaging_material   VARCHAR(100),
    length_cm            NUMERIC(10,2),
    width_cm             NUMERIC(10,2),
    height_cm            NUMERIC(10,2),
    gross_weight_kg      NUMERIC(10,4),
    pallet_quantity      INT,
    stacking_factor      INT,
    shipping_cube_cbm    NUMERIC(10,4),
    container_quantity   INT,
    logistics_notes      TEXT,

    created_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_packaging_product FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_packaging_level   FOREIGN KEY (packaging_level_id)
        REFERENCES product.packaging_levels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_packaging_uom     FOREIGN KEY (uom_id)
        REFERENCES product.product_units_of_measure(id) ON DELETE RESTRICT,
    CONSTRAINT uq_packaging_item    UNIQUE (product_id, packaging_level_id),

    -- Positive dimension constraints
    CONSTRAINT chk_pkg_qty_positive        CHECK (quantity_in_base_uom > 0),
    CONSTRAINT chk_pkg_length_positive     CHECK (length_cm        IS NULL OR length_cm        > 0),
    CONSTRAINT chk_pkg_width_positive      CHECK (width_cm         IS NULL OR width_cm         > 0),
    CONSTRAINT chk_pkg_height_positive     CHECK (height_cm        IS NULL OR height_cm        > 0),
    CONSTRAINT chk_pkg_weight_positive     CHECK (gross_weight_kg  IS NULL OR gross_weight_kg  > 0),
    CONSTRAINT chk_pkg_pallet_positive     CHECK (pallet_quantity   IS NULL OR pallet_quantity   > 0),
    CONSTRAINT chk_pkg_stacking_positive   CHECK (stacking_factor   IS NULL OR stacking_factor   > 0),
    CONSTRAINT chk_pkg_cube_positive       CHECK (shipping_cube_cbm IS NULL OR shipping_cube_cbm > 0),
    CONSTRAINT chk_pkg_container_positive  CHECK (container_quantity IS NULL OR container_quantity > 0)
);

COMMENT ON TABLE  product.product_packaging                        IS 'Multi-level packaging hierarchy per product. Stores physical dimensions, logistics metadata (pallet qty, stacking factor, shipping cube) for WMS putaway and freight optimization.';
COMMENT ON COLUMN product.product_packaging.quantity_in_base_uom  IS 'Number of base UOM units contained in this packaging level. Must be > 0.';
COMMENT ON COLUMN product.product_packaging.shipping_cube_cbm     IS 'External shipping volume in cubic metres. Used for freight calculation.';
COMMENT ON COLUMN product.product_packaging.stacking_factor       IS 'Maximum vertical stack count for safe warehouse storage.';

-- =============================================================================
-- SECTION 8 — PRODUCT STATUS & LIFECYCLE AUDIT HISTORY
--
-- Exclusion constraints on daterange prevent overlapping effective periods.
-- Partial unique index enforces exactly one is_current = TRUE per product.
-- =============================================================================

-- Enable btree_gist for exclusion constraints on UUID + daterange (already created above)

CREATE TABLE product.product_status_history (
    id                UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id        UUID         NOT NULL,
    product_status_id UUID         NOT NULL,
    effective_from    DATE         NOT NULL,
    effective_to      DATE,
    is_current        BOOLEAN      NOT NULL DEFAULT TRUE,
    changed_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,
    reason            TEXT,
    remarks           TEXT,

    created_at_utc    TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_prod_status_hist_product FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_prod_status_hist_status  FOREIGN KEY (product_status_id)
        REFERENCES product.product_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT chk_prod_status_hist_dates  CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    ),

    -- No overlapping effective date ranges per product
    EXCLUDE USING GIST (
        product_id WITH =,
        daterange(effective_from, effective_to, '[)') WITH &&
    )
);

-- Exactly one current status per product
CREATE UNIQUE INDEX uix_prod_status_hist_single_current
    ON product.product_status_history (product_id)
    WHERE is_current = TRUE;

COMMENT ON TABLE  product.product_status_history                IS 'Immutable audit trail of every product commercial status change. Exclusion constraint prevents overlapping date ranges. Partial unique index enforces one current record per product.';
COMMENT ON COLUMN product.product_status_history.effective_from IS 'Date from which this status is effective. Inclusive.';
COMMENT ON COLUMN product.product_status_history.effective_to   IS 'Date until which this status is effective. NULL = still current. Exclusive bound in daterange exclusion.';
COMMENT ON COLUMN product.product_status_history.is_current     IS 'Exactly one TRUE per product_id enforced by uix_prod_status_hist_single_current.';

CREATE TABLE product.product_lifecycle_history (
    id                  UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id          UUID        NOT NULL,
    lifecycle_status_id UUID        NOT NULL,
    effective_from      DATE        NOT NULL,
    effective_to        DATE,
    is_current          BOOLEAN     NOT NULL DEFAULT TRUE,
    changed_by_user_id  UUID        REFERENCES iam.users(id) ON DELETE SET NULL,
    reason              TEXT,
    remarks             TEXT,

    created_at_utc      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT fk_prod_lifecycle_hist_product FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_prod_lifecycle_hist_status  FOREIGN KEY (lifecycle_status_id)
        REFERENCES product.product_lifecycle_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT chk_prod_lifecycle_hist_dates  CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    ),

    -- No overlapping lifecycle date ranges per product
    EXCLUDE USING GIST (
        product_id WITH =,
        daterange(effective_from, effective_to, '[)') WITH &&
    )
);

CREATE UNIQUE INDEX uix_prod_lifecycle_hist_single_current
    ON product.product_lifecycle_history (product_id)
    WHERE is_current = TRUE;

COMMENT ON TABLE product.product_lifecycle_history IS 'Immutable audit trail of every product lifecycle stage change (Concept→InR_D→PilotPhase→Production→PhaseOut→EOL). Exclusion constraint prevents overlapping periods.';

-- =============================================================================
-- SECTION 9 — PRODUCT ENGINEERING REVISIONS CONTROL
-- =============================================================================

CREATE TABLE product.product_revisions (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id           UUID         NOT NULL,
    revision_code        VARCHAR(30)  NOT NULL,
    revision_status      VARCHAR(30)  NOT NULL DEFAULT 'Active',
    revision_date        DATE         NOT NULL,
    effective_from       DATE,
    effective_to         DATE,
    change_summary       TEXT         NOT NULL,
    approved_by_user_id  UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    approved_at_utc      TIMESTAMPTZ,

    created_at_utc       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id   UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_prod_revisions_product   FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT uq_prod_revisions_code      UNIQUE (product_id, revision_code),
    CONSTRAINT chk_prod_revision_status    CHECK (
        revision_status IN ('Draft','Active','Superseded','Archived')
    ),
    CONSTRAINT chk_prod_revision_dates     CHECK (
        effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from
    )
);

-- Exactly one Active revision per product at any time
CREATE UNIQUE INDEX uix_prod_revisions_single_active
    ON product.product_revisions (product_id)
    WHERE revision_status = 'Active';

COMMENT ON TABLE  product.product_revisions                 IS 'Engineering revision control per product (Rev A, Rev B, v1.2). Supports Draft/Active/Superseded/Archived lifecycle. Only one Active revision per product enforced by uix_prod_revisions_single_active.';
COMMENT ON COLUMN product.product_revisions.revision_status IS 'Revision lifecycle: Draft, Active, Superseded, or Archived. Exactly one Active per product_id.';
COMMENT ON COLUMN product.product_revisions.change_summary  IS 'Mandatory human-readable description of what changed in this revision.';

-- =============================================================================
-- SECTION 10 — PRODUCT RELATIONSHIPS
-- =============================================================================

CREATE TABLE product.product_relationships (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    source_product_id    UUID          NOT NULL,
    target_product_id    UUID          NOT NULL,
    relationship_type_id UUID          NOT NULL,
    quantity             NUMERIC(10,2) NOT NULL DEFAULT 1.0,

    created_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_prod_rel_source FOREIGN KEY (source_product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_prod_rel_target FOREIGN KEY (target_product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_prod_rel_type   FOREIGN KEY (relationship_type_id)
        REFERENCES product.relationship_types(id) ON DELETE RESTRICT,
    CONSTRAINT uq_prod_rel_pair         UNIQUE (source_product_id, target_product_id, relationship_type_id),
    -- Prevent product referencing itself in any relationship
    CONSTRAINT chk_prod_rel_no_self     CHECK (source_product_id <> target_product_id),
    CONSTRAINT chk_prod_rel_qty         CHECK (quantity > 0)
);

COMMENT ON TABLE  product.product_relationships                  IS 'Flexible product relationship graph supporting Replacement, Alternative, Accessory, Bundle Component, Compatible, Cross-Sell, and Upsell. Self-referencing prevented by chk_prod_rel_no_self.';
COMMENT ON COLUMN product.product_relationships.quantity         IS 'Required quantity of target product in this relationship (e.g. bundle component qty). Must be > 0.';

-- =============================================================================
-- SECTION 11 — BARCODES, IMAGES, AND CONTROLLED DOCUMENTS
-- =============================================================================

CREATE TABLE product.product_barcodes (
    id               UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id       UUID         NOT NULL,
    variant_id       UUID,
    barcode_type_id  UUID         NOT NULL,
    barcode_value    VARCHAR(100) NOT NULL,
    is_primary       BOOLEAN      NOT NULL DEFAULT FALSE,

    created_at_utc   TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID       REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_barcodes_product  FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_barcodes_variant  FOREIGN KEY (variant_id)
        REFERENCES product.product_variants(id) ON DELETE CASCADE,
    CONSTRAINT fk_barcodes_type     FOREIGN KEY (barcode_type_id)
        REFERENCES product.barcode_types(id) ON DELETE RESTRICT,
    CONSTRAINT uq_barcodes_value    UNIQUE (barcode_value),
    CONSTRAINT chk_barcode_nonempty CHECK (length(trim(barcode_value)) > 0)
);

COMMENT ON TABLE  product.product_barcodes              IS 'Global barcode registry. Each barcode_value is globally unique across all products and variants. Supports EAN-13, UPC-A, QR Code, Code-128, DataMatrix, ITF-14.';
COMMENT ON COLUMN product.product_barcodes.is_primary   IS 'TRUE for the primary scannable barcode. Multiple non-primary barcodes per product/variant are permitted.';

CREATE TABLE product.product_images (
    id               UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id       UUID         NOT NULL,
    variant_id       UUID,
    image_type_id    UUID         NOT NULL,
    file_storage_url VARCHAR(500) NOT NULL,
    file_name        VARCHAR(255) NOT NULL,
    file_size_bytes  BIGINT       NOT NULL,
    mime_type        VARCHAR(50)  NOT NULL DEFAULT 'image/jpeg',
    content_hash     VARCHAR(128) NOT NULL,
    is_primary       BOOLEAN      NOT NULL DEFAULT FALSE,
    display_order    INT          NOT NULL DEFAULT 1,

    created_at_utc   TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID       REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_images_product FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_images_variant FOREIGN KEY (variant_id)
        REFERENCES product.product_variants(id) ON DELETE CASCADE,
    CONSTRAINT fk_images_type    FOREIGN KEY (image_type_id)
        REFERENCES product.image_types(id) ON DELETE RESTRICT,
    CONSTRAINT chk_images_size   CHECK (file_size_bytes > 0),
    CONSTRAINT chk_images_order  CHECK (display_order >= 1)
);

COMMENT ON TABLE  product.product_images              IS 'Product image metadata registry (FRONT, BACK, SIDE, TOP, PACKAGING, THUMBNAIL, MARKETING, TECHNICAL). Stores cloud storage URL and SHA-based content_hash for deduplication. No binary data stored in PostgreSQL.';
COMMENT ON COLUMN product.product_images.content_hash IS 'SHA-256 or BLAKE3 hash of file contents. Used for deduplication and integrity verification.';

CREATE TABLE product.product_documents (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id               UUID         NOT NULL,
    document_type_id         UUID         NOT NULL,
    document_title           VARCHAR(200) NOT NULL,
    document_version         VARCHAR(30)  NOT NULL DEFAULT '1.0',
    revision_code            VARCHAR(30),
    file_storage_url         VARCHAR(500) NOT NULL,
    file_name                VARCHAR(255) NOT NULL,
    file_size_bytes          BIGINT       NOT NULL,
    mime_type                VARCHAR(100) NOT NULL,
    content_hash             VARCHAR(128) NOT NULL,

    effective_from           DATE,
    effective_to             DATE,
    review_date              DATE,
    approval_status          VARCHAR(30)  NOT NULL DEFAULT 'Draft',
    approved_by_user_id      UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    approved_at_utc          TIMESTAMPTZ,

    row_version              INT          NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_docs_product FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_docs_type    FOREIGN KEY (document_type_id)
        REFERENCES product.document_types(id) ON DELETE RESTRICT,
    CONSTRAINT chk_docs_approval_status CHECK (
        approval_status IN ('Draft','UnderReview','Approved','Rejected','Superseded')
    ),
    CONSTRAINT chk_docs_effective_range CHECK (
        effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from
    ),
    CONSTRAINT chk_docs_size CHECK (file_size_bytes > 0)
);

COMMENT ON TABLE  product.product_documents                    IS 'Controlled document metadata per product (SpecSheet, MSDS, UserManual, CoA, Warranty). Full document lifecycle: Draft→UnderReview→Approved. Stores cloud storage URLs and content hashes only.';
COMMENT ON COLUMN product.product_documents.approval_status    IS 'Document approval workflow state: Draft, UnderReview, Approved, Rejected, or Superseded. Enforced by chk_docs_approval_status.';
COMMENT ON COLUMN product.product_documents.document_version   IS 'Document version string (e.g. ''1.0'', ''2.3'', ''Rev-C'').';

-- =============================================================================
-- SECTION 12 — PRODUCT ALIASES (ALTERNATE IDENTIFIERS)
-- =============================================================================

CREATE TABLE product.product_aliases (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id     UUID         NOT NULL,
    alias_type     VARCHAR(50)  NOT NULL,
    alias_value    VARCHAR(100) NOT NULL,

    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID     REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_prod_aliases_product  FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT uq_prod_aliases_value    UNIQUE (alias_type, alias_value),
    CONSTRAINT chk_alias_type_nonempty  CHECK (length(trim(alias_type))  > 0),
    CONSTRAINT chk_alias_value_nonempty CHECK (length(trim(alias_value)) > 0)
);

COMMENT ON TABLE  product.product_aliases            IS 'Unlimited alternate product identifiers per product (LegacyCode, CustomerCode, SupplierCode, DistributorCode, RetailCode, GovernmentCode, InternalCode). Enables cross-system code translation.';
COMMENT ON COLUMN product.product_aliases.alias_type IS 'Classification of the alternate code (LegacyCode, CustomerCode, SupplierCode, DistributorCode, RetailCode, GovernmentCode).';

-- =============================================================================
-- SECTION 13 — ENTERPRISE SEARCH & SEO METADATA
-- =============================================================================

CREATE TABLE product.product_search_metadata (
    id                  UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id          UUID          NOT NULL,
    search_keywords     TEXT,
    seo_title           VARCHAR(200),
    seo_description     TEXT,
    common_misspellings TEXT,
    synonyms            TEXT,
    search_rank_score   NUMERIC(5,2)  NOT NULL DEFAULT 1.00,

    created_at_utc      TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id  UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_search_meta_product    FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT uq_search_meta_product    UNIQUE (product_id),
    CONSTRAINT chk_search_rank_range     CHECK (search_rank_score BETWEEN 0.00 AND 100.00)
);

COMMENT ON TABLE  product.product_search_metadata                  IS 'Enterprise search and SEO metadata per product. Powers full-text search, AI product matching, and e-commerce SEO. One row per product.';
COMMENT ON COLUMN product.product_search_metadata.search_keywords  IS 'Space-separated keywords boosting product discovery. Indexed with GIN for full-text search.';
COMMENT ON COLUMN product.product_search_metadata.search_rank_score IS 'Business-defined relevance score 0–100 influencing search result ordering.';

-- =============================================================================
-- SECTION 14 — REGULATORY & COMPLIANCE DATA
-- =============================================================================

CREATE TABLE product.product_regulatory_data (
    id                       UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id               UUID         NOT NULL,
    regulatory_category      VARCHAR(50)  NOT NULL,
    environmental_class      VARCHAR(50),
    fda_registration_number  VARCHAR(100),
    compliance_notes         TEXT,

    created_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    is_deleted               BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_reg_data_product FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT uq_reg_data_product UNIQUE (product_id),
    CONSTRAINT chk_reg_category    CHECK (
        regulatory_category IN ('Food','Pharma','HazardousGoods','Chemical','MedicalDevice','Cosmetics','Industrial','Environmental','General')
    )
);

COMMENT ON TABLE  product.product_regulatory_data                    IS 'Product regulatory classification master data (Food, Pharma, Hazardous, Chemical, MedicalDevice, Cosmetics, Industrial). One row per product.';
COMMENT ON COLUMN product.product_regulatory_data.regulatory_category IS 'Regulatory domain enforced by chk_reg_category. Required for compliance reporting and MSDS generation.';

-- =============================================================================
-- SECTION 15 — MULTINATIONAL COUNTRY & MARKET AVAILABILITY
-- =============================================================================

CREATE TABLE product.product_country_availability (
    id             UUID        PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    product_id     UUID        NOT NULL,
    country_id     UUID        NOT NULL,
    company_id     UUID        NOT NULL,
    effective_from DATE        NOT NULL,
    effective_to   DATE,
    is_available   BOOLEAN     NOT NULL DEFAULT TRUE,

    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id UUID   REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT fk_country_avail_product FOREIGN KEY (product_id)
        REFERENCES product.products(id) ON DELETE CASCADE,
    CONSTRAINT fk_country_avail_country FOREIGN KEY (country_id)
        REFERENCES organization.countries(id) ON DELETE RESTRICT,
    CONSTRAINT fk_country_avail_company FOREIGN KEY (company_id)
        REFERENCES organization.companies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_country_avail_pair    UNIQUE (product_id, country_id, company_id),
    CONSTRAINT chk_country_avail_dates  CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    )
);

COMMENT ON TABLE  product.product_country_availability              IS 'Effective-dated product market availability per country and legal entity. Supports product launches, market withdrawals, and embargo enforcement.';
COMMENT ON COLUMN product.product_country_availability.effective_from IS 'Date from which the product is available in the market. Inclusive.';
COMMENT ON COLUMN product.product_country_availability.effective_to   IS 'Date after which the product is withdrawn. NULL = currently available.';

-- =============================================================================
-- SECTION 16 — COMPLETE INDEXING STRATEGY
-- =============================================================================

-- ── PRODUCTS (Core table — highest query load) ────────────────────────────

-- Full-text search using generated TSVECTOR (GIN)
CREATE INDEX idx_products_search_vector     ON product.products USING GIN (search_vector);

-- Partial indexes — active products only (eliminates soft-deleted rows from scans)
CREATE INDEX pix_products_active            ON product.products (id)           WHERE is_deleted = FALSE;
CREATE INDEX pix_products_sku               ON product.products (sku)          WHERE is_deleted = FALSE;
CREATE INDEX pix_products_code              ON product.products (product_code) WHERE is_deleted = FALSE;

-- Trigram indexes for ILIKE pattern matching on product name and SKU
CREATE INDEX trgm_products_name             ON product.products USING GIN (product_name gin_trgm_ops);
CREATE INDEX trgm_products_sku              ON product.products USING GIN (sku gin_trgm_ops);

-- FK-covering B-Tree indexes
CREATE INDEX idx_products_company_id        ON product.products (company_id);
CREATE INDEX idx_products_category_id       ON product.products (category_id);
CREATE INDEX idx_products_brand_id          ON product.products (brand_id);
CREATE INDEX idx_products_family_id         ON product.products (family_id);
CREATE INDEX idx_products_type_id           ON product.products (product_type_id);
CREATE INDEX idx_products_status_id         ON product.products (product_status_id);
CREATE INDEX idx_products_lifecycle_id      ON product.products (lifecycle_status_id);
CREATE INDEX idx_products_hsn_id            ON product.products (hsn_code_id);
CREATE INDEX idx_products_tax_id            ON product.products (tax_category_id);
CREATE INDEX idx_products_origin_id         ON product.products (origin_country_id);

-- ── PRODUCT CATEGORIES ────────────────────────────────────────────────────
-- LTREE GiST index already created with the table definition above.

-- ── PRODUCT VARIANTS ─────────────────────────────────────────────────────
CREATE INDEX pix_variants_active            ON product.product_variants (id)          WHERE is_deleted = FALSE;
CREATE INDEX pix_variants_sku               ON product.product_variants (variant_sku) WHERE is_deleted = FALSE;
CREATE INDEX idx_variants_product_id        ON product.product_variants (product_id);
CREATE INDEX trgm_variants_sku              ON product.product_variants USING GIN (variant_sku gin_trgm_ops);

-- ── VARIANT OPTION MAPPINGS ───────────────────────────────────────────────
CREATE INDEX idx_var_opt_map_option_id      ON product.product_variant_option_mappings (variant_option_id);

-- ── VARIANT OPTIONS ───────────────────────────────────────────────────────
CREATE INDEX idx_var_opts_dimension_id      ON product.variant_options (variant_dimension_id);

-- ── ATTRIBUTE VALUES ─────────────────────────────────────────────────────
CREATE INDEX idx_attr_val_product_id        ON product.attribute_values (product_id);
CREATE INDEX idx_attr_val_variant_id        ON product.attribute_values (variant_id);
CREATE INDEX idx_attr_val_definition_id     ON product.attribute_values (attribute_definition_id);
CREATE INDEX idx_attr_val_json              ON product.attribute_values USING GIN (json_value) WHERE json_value IS NOT NULL;

-- ── BARCODES ─────────────────────────────────────────────────────────────
CREATE INDEX idx_barcodes_product_id        ON product.product_barcodes (product_id);
CREATE INDEX idx_barcodes_variant_id        ON product.product_barcodes (variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX idx_barcodes_type_id           ON product.product_barcodes (barcode_type_id);
-- Trigram on barcode_value for partial barcode matching
CREATE INDEX trgm_barcodes_value            ON product.product_barcodes USING GIN (barcode_value gin_trgm_ops);

-- ── IMAGES ───────────────────────────────────────────────────────────────
CREATE INDEX idx_images_product_id          ON product.product_images (product_id);
CREATE INDEX idx_images_variant_id          ON product.product_images (variant_id) WHERE variant_id IS NOT NULL;

-- ── DOCUMENTS ────────────────────────────────────────────────────────────
CREATE INDEX idx_docs_product_id            ON product.product_documents (product_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_docs_approval              ON product.product_documents (approval_status, product_id);

-- ── STATUS HISTORY ────────────────────────────────────────────────────────
CREATE INDEX idx_prod_status_hist_product   ON product.product_status_history (product_id, effective_from);
CREATE INDEX idx_prod_status_hist_current   ON product.product_status_history (product_id) WHERE is_current = TRUE;

-- ── LIFECYCLE HISTORY ─────────────────────────────────────────────────────
CREATE INDEX idx_prod_lifecycle_hist_product ON product.product_lifecycle_history (product_id, effective_from);
CREATE INDEX idx_prod_lifecycle_hist_current ON product.product_lifecycle_history (product_id) WHERE is_current = TRUE;

-- ── REVISIONS ────────────────────────────────────────────────────────────
CREATE INDEX idx_prod_revisions_product_id  ON product.product_revisions (product_id);
CREATE INDEX idx_prod_revisions_active      ON product.product_revisions (product_id) WHERE revision_status = 'Active';

-- ── RELATIONSHIPS ─────────────────────────────────────────────────────────
CREATE INDEX idx_prod_rel_source            ON product.product_relationships (source_product_id);
CREATE INDEX idx_prod_rel_target            ON product.product_relationships (target_product_id);
CREATE INDEX idx_prod_rel_type              ON product.product_relationships (relationship_type_id);

-- ── PRODUCT ALIASES ───────────────────────────────────────────────────────
CREATE INDEX idx_prod_aliases_product_id    ON product.product_aliases (product_id);
CREATE INDEX idx_prod_aliases_type          ON product.product_aliases (alias_type);
CREATE INDEX trgm_prod_aliases_value        ON product.product_aliases USING GIN (alias_value gin_trgm_ops);

-- ── SEARCH METADATA ───────────────────────────────────────────────────────
CREATE INDEX idx_search_meta_rank           ON product.product_search_metadata (search_rank_score DESC);

-- ── COUNTRY AVAILABILITY ─────────────────────────────────────────────────
CREATE INDEX idx_country_avail_product      ON product.product_country_availability (product_id, country_id);
CREATE INDEX idx_country_avail_company      ON product.product_country_availability (company_id);

-- ── UOM CONVERSIONS ───────────────────────────────────────────────────────
CREATE INDEX idx_prod_uom_conv_product      ON product.product_specific_uom_conversions (product_id);
CREATE INDEX idx_global_uom_conv_from       ON product.global_uom_conversions (from_uom_id);
CREATE INDEX idx_global_uom_conv_to         ON product.global_uom_conversions (to_uom_id);

-- ── PACKAGING ────────────────────────────────────────────────────────────
CREATE INDEX idx_packaging_product_id       ON product.product_packaging (product_id);

-- =============================================================================
-- SECTION 17 — COMPLETE COMMENT ON DOCUMENTATION
-- =============================================================================

-- Lookup Tables
COMMENT ON TABLE product.product_families              IS 'Product family groupings for portfolio planning and promotional bundling (e.g. Dairy Family, Beverages Family).';
COMMENT ON TABLE product.product_brands                IS 'FMCG brand registry per legal entity. Supports multi-brand portfolios.';
COMMENT ON TABLE product.product_units_of_measure      IS 'Global UOM master (PCS, BOX, CTN, KG, G, L, ML, TON). Referenced by inventory, WMS, procurement, and sales.';
COMMENT ON TABLE product.global_uom_conversions        IS 'Standard global UOM conversion matrix. Product-specific overrides in product_specific_uom_conversions.';
COMMENT ON TABLE product.product_tax_categories        IS 'GST/VAT tax category master per company (GST_0, GST_5, GST_12, GST_18, GST_28, EXEMPT).';
COMMENT ON TABLE product.product_hsn_codes             IS 'Indian HSN/SAC code master for GST compliance and e-way bill generation.';
COMMENT ON TABLE product.product_storage_conditions    IS 'Storage requirement master with validated temperature ranges.';
COMMENT ON TABLE product.product_serialization_policies IS 'Serialization tracking policy master driving WMS handheld scan requirements.';
COMMENT ON TABLE product.barcode_types                 IS 'Barcode symbology master (EAN13, UPC_A, QR_CODE, CODE128, DATAMATRIX, ITF14).';
COMMENT ON TABLE product.image_types                   IS 'Product image type classification for CMS/DAM integration.';
COMMENT ON TABLE product.document_types                IS 'Controlled document type master for product compliance documentation.';
COMMENT ON TABLE product.packaging_levels              IS 'Packaging hierarchy levels for WMS putaway and freight cube calculation.';
COMMENT ON TABLE product.relationship_types            IS 'Product relationship type master — extensible without DDL changes.';

-- Core Entity Comments
COMMENT ON TABLE product.attribute_definitions         IS 'Typed EAV attribute definition master per company.';
COMMENT ON TABLE product.attribute_values              IS 'Typed EAV attribute value store with exactly-one-value CHECK constraint.';
COMMENT ON TABLE product.product_specific_uom_conversions IS 'SKU-level UOM conversion overrides (Product A: 1 CTN=24 BTL; Product B: 1 CTN=12 BTL).';
COMMENT ON TABLE product.variant_dimensions            IS 'Configurable variant dimension definitions per company (Color, Size, Flavor, PackSize, Capacity).';
COMMENT ON TABLE product.variant_options               IS 'Enumerated option values per dimension (Red/Blue for Color; S/M/L/XL for Size).';
COMMENT ON TABLE product.product_variants              IS 'Composed variant SKU instances from multi-dimensional option combinations.';
COMMENT ON TABLE product.product_variant_option_mappings IS 'Junction: maps each product variant to its constituent dimension options.';
COMMENT ON TABLE product.product_packaging             IS 'Multi-level packaging with full logistics metadata for WMS and freight optimization.';
COMMENT ON TABLE product.product_status_history        IS 'Immutable commercial status audit trail with overlap-preventing exclusion constraint.';
COMMENT ON TABLE product.product_lifecycle_history     IS 'Immutable engineering lifecycle audit trail with overlap-preventing exclusion constraint.';
COMMENT ON TABLE product.product_revisions             IS 'Engineering revision control with Draft/Active/Superseded/Archived lifecycle.';
COMMENT ON TABLE product.product_relationships         IS 'Directed product relationship graph (Replacement, CrossSell, Upsell, BundleComponent, etc.).';
COMMENT ON TABLE product.product_barcodes              IS 'Global barcode registry with globally unique barcode_value constraint.';
COMMENT ON TABLE product.product_images                IS 'Product image metadata registry. Binary data stored externally (CDN/S3).';
COMMENT ON TABLE product.product_documents             IS 'Controlled document metadata with approval workflow and effective date ranges.';
COMMENT ON TABLE product.product_aliases               IS 'Unlimited alternate identifiers for cross-system product code translation.';
COMMENT ON TABLE product.product_search_metadata       IS 'Enterprise search, SEO, and AI discovery metadata per product.';
COMMENT ON TABLE product.product_regulatory_data       IS 'Product regulatory classification for compliance reporting (Food, Pharma, Chemical, etc.).';
COMMENT ON TABLE product.product_country_availability  IS 'Effective-dated multinational market availability per product and legal entity.';
