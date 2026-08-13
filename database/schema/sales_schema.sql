-- =============================================================================
-- INK FMCG ENTERPRISE ERP — SALES MANAGEMENT SCHEMAS (v2.0 REFINED)
-- File Name      : sales_schema.sql
-- Target Database: PostgreSQL 16+
-- Schema Owner   : sales
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS sales;

-- =============================================================================
-- SECTION 1 — LOOKUP TABLES
-- =============================================================================

-- 1.1 Quotation Statuses
CREATE TABLE sales.quotation_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_quotation_statuses_code UNIQUE (code),
    CONSTRAINT chk_quotation_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.quotation_statuses IS 
    '[LOOKUP] Lifecycle status of a sales quote: DRAFT, SUBMITTED, APPROVED, EXPIRED, CONVERTED, REJECTED.';

-- 1.2 Sales Order Statuses
CREATE TABLE sales.sales_order_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_sales_order_statuses_code UNIQUE (code),
    CONSTRAINT chk_sales_order_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.sales_order_statuses IS 
    '[LOOKUP] Lifecycle status of a sales order: DRAFT, SUBMITTED, PENDING_APPROVAL, APPROVED, RELEASED, ALLOCATED, PARTIALLY_ALLOCATED, PICKING, PACKED, DISPATCHED, DELIVERED, CLOSED, CANCELLED, REJECTED, EXPIRED.';

-- 1.3 Sales Order Types
CREATE TABLE sales.sales_order_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_sales_order_types_code UNIQUE (code),
    CONSTRAINT chk_sales_order_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.sales_order_types IS 
    '[LOOKUP] Types of sales orders: STANDARD_ORDER, RUSH_ORDER, STAGE_DELIVERY, BACKORDER, EXPORT_ORDER, CONSIGMENT.';

-- 1.4 Priority Levels
CREATE TABLE sales.priority_levels (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_priority_levels_code UNIQUE (code),
    CONSTRAINT chk_priority_levels_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.priority_levels IS 
    '[LOOKUP] Fulfillment priorities: LOW, MEDIUM, HIGH, URGENT.';

-- 1.5 Sales Channels
CREATE TABLE sales.sales_channels (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_sales_channels_code UNIQUE (code),
    CONSTRAINT chk_sales_channels_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.sales_channels IS 
    '[LOOKUP] Sales route classifications: RETAIL_BEAT, MODERN_TRADE, DISTRIBUTOR_DIRECT, WHOLESALE, B2B_PORTAL.';

-- 1.6 Sales Sources
CREATE TABLE sales.sales_sources (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_sales_sources_code UNIQUE (code),
    CONSTRAINT chk_sales_sources_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.sales_sources IS 
    '[LOOKUP] System source of order booking: TELE_SALES, FIELD_REPS_APP, WEB_PORTAL, EDI, SYSTEM_AUTO.';

-- 1.7 Allocation Statuses
CREATE TABLE sales.allocation_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_allocation_statuses_code UNIQUE (code),
    CONSTRAINT chk_allocation_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.allocation_statuses IS 
    '[LOOKUP] Inventory allocation status: UNALLOCATED, PARTIALLY_ALLOCATED, FULLY_ALLOCATED, RELEASED.';

-- 1.8 Fulfillment Statuses
CREATE TABLE sales.fulfillment_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_fulfillment_statuses_code UNIQUE (code),
    CONSTRAINT chk_fulfillment_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.fulfillment_statuses IS 
    '[LOOKUP] Line level fulfillment tracking: PENDING, IN_ALLOCATION, ALLOCATED, PARTIALLY_SHIPPED, SHIPPED, RETURNED, CANCELLED.';

-- 1.9 Shipment Statuses
CREATE TABLE sales.shipment_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_shipment_statuses_code UNIQUE (code),
    CONSTRAINT chk_shipment_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.shipment_statuses IS 
    '[LOOKUP] Dispatch shipment statuses: PLANNING, STAGED, DISPATCHED, EN_ROUTE, DELIVERED, DELAYED, EXCEPTION.';

-- 1.10 Promotion Types
CREATE TABLE sales.promotion_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_promotion_types_code UNIQUE (code),
    CONSTRAINT chk_promotion_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.promotion_types IS 
    '[LOOKUP] Promotion execution methods: PERCENT_DISCOUNT, AMOUNT_DISCOUNT, FREE_GOODS_BUNDLE, MULTI_BUY_DISCOUNT.';

-- 1.11 Return Statuses
CREATE TABLE sales.return_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_return_statuses_code UNIQUE (code),
    CONSTRAINT chk_return_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.return_statuses IS 
    '[LOOKUP] Return request lifecycle status: REQUESTED, APPROVED, RECEIVED, INSPECTED, COMPLETED, REJECTED.';

-- 1.12 Return Reasons
CREATE TABLE sales.return_reasons (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_return_reasons_code UNIQUE (code),
    CONSTRAINT chk_return_reasons_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE sales.return_reasons IS 
    '[LOOKUP] Reasons for product returns: EXPIRED_PRODUCT, DAMAGED_DELIVERY, SHORT_DELIVERY, WRONG_PRODUCT, COMMERCIAL_AGREEMENT.';

-- =============================================================================
-- SECTION 2 — SALES QUOTATIONS
-- =============================================================================

-- 2.1 Quotation Headers
CREATE TABLE sales.sales_quotations (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id             UUID          NOT NULL REFERENCES organization.companies(id),
    customer_id            UUID          NOT NULL REFERENCES customer.customers(id),
    quotation_number       VARCHAR(50)   NOT NULL,
    quotation_status_id    UUID          NOT NULL REFERENCES sales.quotation_statuses(id),
    
    valid_from             DATE          NOT NULL DEFAULT CURRENT_DATE,
    valid_to               DATE          NOT NULL,
    payment_terms_id       UUID          NOT NULL REFERENCES supplier.payment_terms(id),
    currency_code          VARCHAR(3)    NOT NULL DEFAULT 'INR',
    
    total_amount           NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    discount_amount        NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    tax_amount             NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    net_amount             NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    
    remarks                TEXT,
    converted_to_order_id  UUID, -- references sales.sales_orders(id) added after schema compilation

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,
    is_deleted             BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc         TIMESTAMPTZ,
    deleted_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_quotation_number UNIQUE (quotation_number),
    CONSTRAINT chk_quote_dates CHECK (valid_to >= valid_from),
    CONSTRAINT chk_quote_currency CHECK (length(currency_code) = 3),
    CONSTRAINT chk_quote_totals CHECK (total_amount >= 0.0000 AND discount_amount >= 0.0000 AND tax_amount >= 0.0000 AND net_amount >= 0.0000)
);

COMMENT ON TABLE sales.sales_quotations IS 
    '[OPERATIONAL] Sales Quote headers hosting customer negotiation parameters.';

-- 2.2 Quotation Lines
CREATE TABLE sales.sales_quotation_lines (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    quotation_id       UUID          NOT NULL REFERENCES sales.sales_quotations(id) ON DELETE CASCADE,
    product_id         UUID          NOT NULL REFERENCES product.products(id),
    quantity           NUMERIC(18,4) NOT NULL,
    unit_price         NUMERIC(18,4) NOT NULL,
    discount_pct       NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
    discount_amount    NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    tax_pct            NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
    tax_amount         NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    line_total         NUMERIC(18,4) NOT NULL,

    -- Auditing
    created_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_quote_line_qty CHECK (quantity > 0.0000),
    CONSTRAINT chk_quote_line_price CHECK (unit_price >= 0.0000),
    CONSTRAINT chk_quote_line_disc CHECK (discount_pct >= 0.00 AND discount_pct <= 100.00),
    CONSTRAINT chk_quote_line_tax CHECK (tax_pct >= 0.00 AND tax_pct <= 100.00)
);

COMMENT ON TABLE sales.sales_quotation_lines IS 
    '[OPERATIONAL] Items and quantities negotiated on sales quotations.';

-- =============================================================================
-- SECTION 3 — SALES ORDERS
-- =============================================================================

-- 3.1 Sales Order Headers
CREATE TABLE sales.sales_orders (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID          NOT NULL REFERENCES organization.companies(id),
    customer_id              UUID          NOT NULL REFERENCES customer.customers(id),
    customer_site_id         UUID          NOT NULL REFERENCES customer.customer_sites(id),
    
    order_number             VARCHAR(50)   NOT NULL,
    order_status_id          UUID          NOT NULL REFERENCES sales.sales_order_statuses(id),
    order_type_id            UUID          NOT NULL REFERENCES sales.sales_order_types(id),
    priority_level_id        UUID          NOT NULL REFERENCES sales.priority_levels(id),
    sales_channel_id         UUID          NOT NULL REFERENCES sales.sales_channels(id),
    sales_source_id          UUID          NOT NULL REFERENCES sales.sales_sources(id),
    
    requested_delivery_date  DATE          NOT NULL,
    committed_delivery_date  DATE,
    payment_terms_id         UUID          NOT NULL REFERENCES supplier.payment_terms(id),
    currency_code            VARCHAR(3)    NOT NULL DEFAULT 'INR',
    
    is_credit_hold           BOOLEAN       NOT NULL DEFAULT FALSE,
    is_order_hold            BOOLEAN       NOT NULL DEFAULT FALSE,
    hold_reason              TEXT,
    
    total_amount             NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    discount_amount          NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    tax_amount               NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    net_amount               NUMERIC(18,4) NOT NULL DEFAULT 0.0000,

    -- Concurrency and Auditing
    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_order_number UNIQUE (order_number),
    CONSTRAINT chk_order_currency CHECK (length(currency_code) = 3),
    CONSTRAINT chk_order_totals CHECK (total_amount >= 0.0000 AND discount_amount >= 0.0000 AND tax_amount >= 0.0000 AND net_amount >= 0.0000),
    CONSTRAINT chk_order_hold_rule CHECK (is_order_hold = FALSE OR (is_order_hold = TRUE AND hold_reason IS NOT NULL AND length(trim(hold_reason)) > 0))
);

ALTER TABLE sales.sales_quotations ADD CONSTRAINT fk_quote_converted_order FOREIGN KEY (converted_to_order_id) REFERENCES sales.sales_orders(id) ON DELETE SET NULL;

COMMENT ON TABLE sales.sales_orders IS 
    '[OPERATIONAL] Sales Order header records hosting buyer parameters and fulfillment controls.';

-- 3.2 Sales Order Lines
CREATE TABLE sales.sales_order_lines (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_order_id         UUID          NOT NULL REFERENCES sales.sales_orders(id) ON DELETE CASCADE,
    product_id             UUID          NOT NULL REFERENCES product.products(id),
    
    quantity_ordered       NUMERIC(18,4) NOT NULL,
    quantity_allocated     NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    quantity_backordered   NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    quantity_shipped       NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    quantity_returned      NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    
    unit_price             NUMERIC(18,4) NOT NULL,
    discount_pct           NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
    discount_amount        NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    tax_pct                NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
    tax_amount             NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    line_total             NUMERIC(18,4) NOT NULL,
    
    fulfillment_status_id  UUID          NOT NULL REFERENCES sales.fulfillment_statuses(id),

    -- Auditing
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_order_line_qty CHECK (quantity_ordered > 0.0000),
    CONSTRAINT chk_order_line_allocated CHECK (quantity_allocated >= 0.0000 AND quantity_allocated <= quantity_ordered),
    CONSTRAINT chk_order_line_back CHECK (quantity_backordered >= 0.0000 AND quantity_backordered <= quantity_ordered),
    CONSTRAINT chk_order_line_ship CHECK (quantity_shipped >= 0.0000 AND quantity_shipped <= quantity_ordered),
    CONSTRAINT chk_order_line_ret CHECK (quantity_returned >= 0.0000 AND quantity_returned <= quantity_shipped),
    CONSTRAINT chk_order_line_price CHECK (unit_price >= 0.0000),
    CONSTRAINT chk_order_line_disc CHECK (discount_pct >= 0.00 AND discount_pct <= 100.00),
    CONSTRAINT chk_order_line_tax CHECK (tax_pct >= 0.00 AND tax_pct <= 100.00)
);

COMMENT ON TABLE sales.sales_order_lines IS 
    '[OPERATIONAL] Order details lines tracking ordered, allocated, backordered, and shipped quantities.';

-- 3.3 Sales Order Revision History (Versioning)
CREATE TABLE sales.sales_order_revisions (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_order_id       UUID          NOT NULL REFERENCES sales.sales_orders(id) ON DELETE CASCADE,
    revision_number      INT           NOT NULL,
    revision_date        TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    revised_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    snapshot_payload     JSONB         NOT NULL, -- Full JSON representation of order & lines
    reason               TEXT,

    CONSTRAINT uq_order_revision UNIQUE (sales_order_id, revision_number),
    CONSTRAINT chk_order_rev_num CHECK (revision_number >= 1)
);

COMMENT ON TABLE sales.sales_order_revisions IS 
    '[HISTORY] Immutable snapshot revisions archiving order modifications over time.';

-- =============================================================================
-- SECTION 4 — ORDER ALLOCATION & RESERVATIONS (REFINED)
-- =============================================================================

-- 4.1 Order Allocations
CREATE TABLE sales.order_allocations (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_order_line_id    UUID          NOT NULL REFERENCES sales.sales_order_lines(id) ON DELETE CASCADE,
    warehouse_id           UUID          NOT NULL REFERENCES warehouse.warehouses(id),
    allocated_quantity     NUMERIC(18,4) NOT NULL,
    allocation_status_id   UUID          NOT NULL REFERENCES sales.allocation_statuses(id),
    
    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_allocation_qty CHECK (allocated_quantity > 0.0000)
);

COMMENT ON TABLE sales.order_allocations IS 
    '[OPERATIONAL] Active inventory reservations mapping sales order lines to specific shipping warehouses.';

-- 4.2 Allocation Event History
CREATE TABLE sales.order_allocation_history (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_order_line_id    UUID          NOT NULL REFERENCES sales.sales_order_lines(id) ON DELETE CASCADE,
    warehouse_id           UUID          NOT NULL REFERENCES warehouse.warehouses(id),
    event_type             VARCHAR(50)   NOT NULL, -- ALLOCATE, DEALLOCATE, PARTIAL_ALLOCATION
    quantity               NUMERIC(18,4) NOT NULL,
    processed_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    notes                  TEXT,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_alloc_hist_qty CHECK (quantity <> 0.0000),
    CONSTRAINT chk_alloc_hist_type CHECK (event_type IN ('ALLOCATE', 'DEALLOCATE', 'PARTIAL_ALLOCATION'))
);

COMMENT ON TABLE sales.order_allocation_history IS 
    '[HISTORY] Detailed audit logs tracking reservation allocations, releases, and backorder splits.';

-- 4.3 Sales Inventory Reservations (Unified tracking)
CREATE TABLE sales.sales_inventory_reservations (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_order_line_id    UUID          NOT NULL REFERENCES sales.sales_order_lines(id) ON DELETE CASCADE,
    warehouse_id           UUID          NOT NULL REFERENCES warehouse.warehouses(id),
    requested_quantity     NUMERIC(18,4) NOT NULL,
    reserved_quantity      NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    status                 VARCHAR(50)   NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, RESERVED, RELEASED, EXPIRED, CONSUMED, CANCELLED

    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_sales_reserve_qty CHECK (requested_quantity > 0.0000),
    CONSTRAINT chk_sales_reserve_bound CHECK (reserved_quantity >= 0.0000 AND reserved_quantity <= requested_quantity),
    CONSTRAINT chk_sales_reserve_status CHECK (status IN ('REQUESTED', 'RESERVED', 'RELEASED', 'EXPIRED', 'CONSUMED', 'CANCELLED'))
);

COMMENT ON TABLE sales.sales_inventory_reservations IS 
    '[OPERATIONAL] Active system locks requesting or holding specific product batches for sales lines.';

-- 4.4 Sales Reservation History
CREATE TABLE sales.sales_reservation_history (
    id                  UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    reservation_id      UUID          NOT NULL REFERENCES sales.sales_inventory_reservations(id) ON DELETE CASCADE,
    event_timestamp     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    event_status        VARCHAR(50)   NOT NULL,
    quantity            NUMERIC(18,4) NOT NULL,
    processed_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    notes               TEXT,

    CONSTRAINT chk_sales_res_hist_status CHECK (event_status IN ('REQUESTED', 'RESERVED', 'RELEASED', 'EXPIRED', 'CONSUMED', 'CANCELLED'))
);

COMMENT ON TABLE sales.sales_reservation_history IS 
    '[HISTORY] Logs tracing lifecycle state shifts of inventory reservation requests.';

-- =============================================================================
-- SECTION 5 — DELIVERY & FULFILLMENT TIMELINES
-- =============================================================================

-- 5.1 Delivery Schedules
CREATE TABLE sales.delivery_schedules (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_order_id           UUID          NOT NULL REFERENCES sales.sales_orders(id) ON DELETE CASCADE,
    customer_site_id         UUID          NOT NULL REFERENCES customer.customer_sites(id),
    
    requested_delivery_date  DATE          NOT NULL,
    delivery_window_start    TIME          NOT NULL,
    delivery_window_end      TIME          NOT NULL,
    
    carrier_id               UUID          NOT NULL REFERENCES supplier.suppliers(id), -- Carrier mapped as 3PL vendor
    shipment_status_id       UUID          NOT NULL REFERENCES sales.shipment_statuses(id),
    dispatch_priority        INT           NOT NULL DEFAULT 1,
    
    is_delivery_hold         BOOLEAN       NOT NULL DEFAULT FALSE,
    delivery_hold_reason     TEXT,

    -- Concurrency and Auditing
    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_delivery_window CHECK (delivery_window_end > delivery_window_start),
    CONSTRAINT chk_delivery_hold CHECK (is_delivery_hold = FALSE OR (is_delivery_hold = TRUE AND delivery_hold_reason IS NOT NULL AND length(trim(delivery_hold_reason)) > 0))
);

COMMENT ON TABLE sales.delivery_schedules IS 
    '[OPERATIONAL] Delivery dispatch schedules coordinating arrival windows, priorities, holds, and 3PL carriers.';

-- 5.2 Delivery Schedule Lines
CREATE TABLE sales.delivery_schedule_lines (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    delivery_schedule_id UUID          NOT NULL REFERENCES sales.delivery_schedules(id) ON DELETE CASCADE,
    sales_order_line_id  UUID          NOT NULL REFERENCES sales.sales_order_lines(id) ON DELETE CASCADE,
    allocated_quantity   NUMERIC(18,4) NOT NULL,
    shipped_quantity     NUMERIC(18,4) NOT NULL DEFAULT 0.0000,

    CONSTRAINT chk_sched_line_alloc CHECK (allocated_quantity > 0.0000),
    CONSTRAINT chk_sched_line_ship CHECK (shipped_quantity >= 0.0000 AND shipped_quantity <= allocated_quantity)
);

COMMENT ON TABLE sales.delivery_schedule_lines IS 
    '[OPERATIONAL] Line items scheduled for shipping in a specific delivery run.';

-- 5.3 Fulfillment Event History
CREATE TABLE sales.fulfillment_event_history (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_order_id       UUID          NOT NULL REFERENCES sales.sales_orders(id) ON DELETE CASCADE,
    sales_order_line_id  UUID          REFERENCES sales.sales_order_lines(id) ON DELETE CASCADE,
    event_type           VARCHAR(100)  NOT NULL, -- PICK_START, PICK_END, PACKED, LOADED, DEPARTED, ARRIVED, DELIVERED, FAIL, REFUSED, PARTIAL
    event_timestamp      TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    employee_id          UUID          REFERENCES employee.employees(id) ON DELETE SET NULL,
    warehouse_id         UUID          REFERENCES warehouse.warehouses(id) ON DELETE SET NULL,
    comments             TEXT,

    -- Concurrency and Auditing
    created_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE sales.fulfillment_event_history IS 
    '[HISTORY] Detailed warehouse timelines mapping dispatch milestones (picking, packing, refusal states).';

-- =============================================================================
-- SECTION 6 — PRICING & DISCOUNTS SNAPSHOTS
-- =============================================================================

CREATE TABLE sales.order_line_pricing_snapshots (
    id                        UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_order_line_id       UUID          NOT NULL REFERENCES sales.sales_order_lines(id) ON DELETE CASCADE,
    
    base_product_price        NUMERIC(18,4) NOT NULL,
    customer_group_price      NUMERIC(18,4) NOT NULL,
    promotion_discount_amount NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    manual_override_amount    NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    manual_override_reason    TEXT,
    
    price_source              VARCHAR(100)  NOT NULL, -- DYNAMIC_ENGINE, PROMOTION_GRID, CONTRACT, MANUAL_OVERRIDE
    calculated_tax_amount     NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    
    -- Refinement: Pricing Decision Trace
    pricing_rule_priority     INT           NOT NULL DEFAULT 1,
    selection_rationale       TEXT,
    applied_promotion_id      UUID,         -- references sales.promotions(id) added after table compilation
    applied_contract_id       UUID,         -- references sales.sales_contracts(id) added after table compilation

    created_at_utc            TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_price_base CHECK (base_product_price >= 0.0000),
    CONSTRAINT chk_price_cust CHECK (customer_group_price >= 0.0000),
    CONSTRAINT chk_price_promo CHECK (promotion_discount_amount >= 0.0000),
    CONSTRAINT chk_price_override CHECK (manual_override_amount >= 0.0000),
    CONSTRAINT chk_price_override_reason CHECK (manual_override_amount = 0.0000 OR (manual_override_amount > 0.0000 AND manual_override_reason IS NOT NULL AND length(trim(manual_override_reason)) > 0)),
    CONSTRAINT chk_price_tax CHECK (calculated_tax_amount >= 0.0000)
);

COMMENT ON TABLE sales.order_line_pricing_snapshots IS 
    '[OPERATIONAL] Auditable snapshots details of commercial pricing engines inputs and overrides.';

-- =============================================================================
-- SECTION 7 — SALES CONTRACTS
-- =============================================================================

-- 7.1 Contract Headers
CREATE TABLE sales.sales_contracts (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id           UUID          NOT NULL REFERENCES organization.companies(id),
    customer_id          UUID          NOT NULL REFERENCES customer.customers(id),
    contract_number      VARCHAR(50)   NOT NULL,
    
    valid_from           DATE          NOT NULL,
    valid_to             DATE          NOT NULL,
    contract_amount      NUMERIC(18,4) NOT NULL,
    consumed_amount      NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    remaining_amount     NUMERIC(18,4) GENERATED ALWAYS AS (contract_amount - consumed_amount) STORED,
    
    is_renewal_ready     BOOLEAN       NOT NULL DEFAULT FALSE,

    -- Concurrency and Auditing
    row_version          INT           NOT NULL DEFAULT 1,
    created_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    is_deleted           BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc       TIMESTAMPTZ,
    deleted_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_sales_contract_number UNIQUE (contract_number),
    CONSTRAINT chk_sales_contract_dates CHECK (valid_to >= valid_from),
    CONSTRAINT chk_sales_contract_amt CHECK (contract_amount >= 0.0000),
    CONSTRAINT chk_sales_contract_consumed CHECK (consumed_amount >= 0.0000)
);

COMMENT ON TABLE sales.sales_contracts IS 
    '[FOUNDATION] Long term customer commercial agreements tracking quantity and financial limits.';

-- 7.2 Contract Lines
CREATE TABLE sales.sales_contract_lines (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_contract_id  UUID          NOT NULL REFERENCES sales.sales_contracts(id) ON DELETE CASCADE,
    product_id         UUID          NOT NULL REFERENCES product.products(id),
    
    contract_quantity  NUMERIC(18,4) NOT NULL,
    consumed_quantity  NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    remaining_quantity NUMERIC(18,4) GENERATED ALWAYS AS (contract_quantity - consumed_quantity) STORED,
    unit_price         NUMERIC(18,4) NOT NULL,

    CONSTRAINT chk_contract_line_qty CHECK (contract_quantity > 0.0000),
    CONSTRAINT chk_contract_line_consumed CHECK (consumed_quantity >= 0.0000),
    CONSTRAINT chk_contract_line_price CHECK (unit_price >= 0.0000)
);

ALTER TABLE sales.order_line_pricing_snapshots ADD CONSTRAINT fk_price_snap_contract FOREIGN KEY (applied_contract_id) REFERENCES sales.sales_contracts(id) ON DELETE SET NULL;

COMMENT ON TABLE sales.sales_contract_lines IS 
    '[FOUNDATION] Approved products, prices, and quantities covered under commercial contracts.';

-- =============================================================================
-- SECTION 8 — SALES RETURNS FOUNDATION
-- =============================================================================

-- 8.1 Returns Header
CREATE TABLE sales.sales_returns (
    id                       UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id               UUID          NOT NULL REFERENCES organization.companies(id),
    customer_id              UUID          NOT NULL REFERENCES customer.customers(id),
    return_number            VARCHAR(50)   NOT NULL,
    return_status_id         UUID          NOT NULL REFERENCES sales.return_statuses(id),
    original_sales_order_id  UUID          REFERENCES sales.sales_orders(id) ON DELETE SET NULL,
    
    refund_amount            NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    replacement_order_id     UUID          REFERENCES sales.sales_orders(id) ON DELETE SET NULL,

    -- Concurrency and Auditing
    row_version              INT           NOT NULL DEFAULT 1,
    created_at_utc           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    is_deleted               BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc           TIMESTAMPTZ,
    deleted_by_user_id       UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_return_number UNIQUE (return_number),
    CONSTRAINT chk_return_refund CHECK (refund_amount >= 0.0000)
);

COMMENT ON TABLE sales.sales_returns IS 
    '[OPERATIONAL] Sales return request headers coordinating replacements, credits, and originals.';

-- 8.2 Returns Lines
CREATE TABLE sales.sales_return_lines (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_return_id      UUID          NOT NULL REFERENCES sales.sales_returns(id) ON DELETE CASCADE,
    sales_order_line_id  UUID          REFERENCES sales.sales_order_lines(id) ON DELETE SET NULL,
    product_id           UUID          NOT NULL REFERENCES product.products(id),
    
    quantity_returned    NUMERIC(18,4) NOT NULL,
    return_reason_id     UUID          NOT NULL REFERENCES sales.return_reasons(id),
    inspection_status_id UUID          NOT NULL REFERENCES customer.compliance_statuses(id), -- PENDING, VERIFIED, FAILED
    disposition_code     VARCHAR(50)   NOT NULL, -- RESTOCK_SALABLE, WRITE_OFF_SCRAP, SUPPLIER_RETURN
    refund_line_hook_id  UUID, -- hook for AR invoice credit note creation

    CONSTRAINT chk_return_line_qty CHECK (quantity_returned > 0.0000),
    CONSTRAINT chk_return_line_disp CHECK (disposition_code IN ('RESTOCK_SALABLE', 'WRITE_OFF_SCRAP', 'SUPPLIER_RETURN'))
);

COMMENT ON TABLE sales.sales_return_lines IS 
    '[OPERATIONAL] Sales return items auditing inspections, return reasons, and warehouse scrap dispositions.';

-- =============================================================================
-- SECTION 9 — SALES PROMOTIONS
-- =============================================================================

-- 9.1 Promotion Campaigns
CREATE TABLE sales.promotion_campaigns (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    campaign_code        VARCHAR(50)  NOT NULL,
    campaign_name        VARCHAR(150) NOT NULL,
    start_date           DATE         NOT NULL,
    end_date             DATE         NOT NULL,
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    campaign_version     INT          NOT NULL DEFAULT 1,

    -- Auditing
    created_at_utc       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id   UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_campaign_code UNIQUE (campaign_code),
    CONSTRAINT chk_campaign_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_campaign_version CHECK (campaign_version >= 1)
);

COMMENT ON TABLE sales.promotion_campaigns IS 
    '[FOUNDATION] Strategic campaigns grouping multiple commercial discount grids.';

-- 9.2 Promotions Grid
CREATE TABLE sales.promotions (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    campaign_id          UUID          NOT NULL REFERENCES sales.promotion_campaigns(id) ON DELETE CASCADE,
    promotion_code       VARCHAR(50)   NOT NULL,
    promotion_name       VARCHAR(150)  NOT NULL,
    promotion_type_id    UUID          NOT NULL REFERENCES sales.promotion_types(id),
    
    discount_pct         NUMERIC(5,2),
    discount_amount      NUMERIC(18,4),
    is_active            BOOLEAN       NOT NULL DEFAULT TRUE,
    promotion_version    INT           NOT NULL DEFAULT 1,

    -- Auditing
    created_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_promotion_code UNIQUE (promotion_code),
    CONSTRAINT chk_promo_discount_pct CHECK (discount_pct IS NULL OR (discount_pct >= 0.00 AND discount_pct <= 100.00)),
    CONSTRAINT chk_promo_discount_amt CHECK (discount_amount IS NULL OR discount_amount >= 0.0000),
    CONSTRAINT chk_promo_version CHECK (promotion_version >= 1)
);

ALTER TABLE sales.order_line_pricing_snapshots ADD CONSTRAINT fk_price_snap_promo FOREIGN KEY (applied_promotion_id) REFERENCES sales.promotions(id) ON DELETE SET NULL;

COMMENT ON TABLE sales.promotions IS 
    '[FOUNDATION] Specific discount structures like BOGO, multi-buy breaks, and percent cuts.';

-- 9.3 Promotion Customer Eligibility Mapping
CREATE TABLE sales.promotion_customer_eligibility (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    promotion_id         UUID         NOT NULL REFERENCES sales.promotions(id) ON DELETE CASCADE,
    customer_id          UUID         REFERENCES customer.customers(id) ON DELETE CASCADE,
    customer_category_id UUID         REFERENCES customer.customer_categories(id) ON DELETE CASCADE,
    customer_segment_id  UUID         REFERENCES customer.customer_segments(id) ON DELETE CASCADE,
    created_at_utc       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    -- Eligibility check: At least one target group must be mapped
    CONSTRAINT chk_promo_eligibility_target CHECK (customer_id IS NOT NULL OR customer_category_id IS NOT NULL OR customer_segment_id IS NOT NULL)
);

COMMENT ON TABLE sales.promotion_customer_eligibility IS 
    '[FOUNDATION] Eligibility matrix mapping campaigns to customer categories or specific accounts.';

-- 9.4 Promotion Product Rules
CREATE TABLE sales.promotion_product_rules (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    promotion_id         UUID          NOT NULL REFERENCES sales.promotions(id) ON DELETE CASCADE,
    product_id           UUID          REFERENCES product.products(id) ON DELETE CASCADE,
    product_category_id  UUID,         -- links product categories
    minimum_quantity     NUMERIC(18,4) NOT NULL DEFAULT 1.0000,
    rule_version         INT           NOT NULL DEFAULT 1,

    CONSTRAINT chk_promo_rule_qty CHECK (minimum_quantity > 0.0000),
    CONSTRAINT chk_promo_rule_target CHECK (product_id IS NOT NULL OR product_category_id IS NOT NULL),
    CONSTRAINT chk_promo_rule_ver CHECK (rule_version >= 1)
);

COMMENT ON TABLE sales.promotion_product_rules IS 
    '[FOUNDATION] Product mapping rules mapping item quantity thresholds for discount grids.';

-- 9.5 Promotion Application History
CREATE TABLE sales.promotion_application_history (
    id                      UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_order_line_id     UUID          NOT NULL REFERENCES sales.sales_order_lines(id) ON DELETE CASCADE,
    campaign_id             UUID          REFERENCES sales.promotion_campaigns(id) ON DELETE SET NULL,
    campaign_version        INT           NOT NULL,
    promotion_id            UUID          REFERENCES sales.promotions(id) ON DELETE SET NULL,
    promotion_version       INT           NOT NULL,
    rule_version            INT           NOT NULL,
    applied_discount_amount NUMERIC(18,4) NOT NULL,
    approved_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    effective_from          DATE          NOT NULL,
    effective_to            DATE,

    created_at_utc          TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_promo_hist_amt CHECK (applied_discount_amount >= 0.0000),
    CONSTRAINT chk_promo_hist_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE sales.promotion_application_history IS 
    '[HISTORY] Immutable audit trail of exactly which promotion logic version was applied to an order line.';

-- =============================================================================
-- SECTION 10 — SALES CONFIGURATIONS & PREFERENCES (NEW v2.0)
-- =============================================================================

-- 10.1 Sales Channel Configuration
CREATE TABLE sales.sales_channel_configurations (
    id                          UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_channel_id            UUID         NOT NULL REFERENCES sales.sales_channels(id) ON DELETE CASCADE,
    approval_workflow_required  BOOLEAN      NOT NULL DEFAULT FALSE,
    default_warehouse_id        UUID         REFERENCES warehouse.warehouses(id) ON DELETE SET NULL,
    pricing_strategy            VARCHAR(100) NOT NULL DEFAULT 'STANDARD',
    credit_policy               VARCHAR(100) NOT NULL DEFAULT 'STRICT',
    reservation_strategy        VARCHAR(100) NOT NULL DEFAULT 'FIFO',
    fulfillment_strategy        VARCHAR(100) NOT NULL DEFAULT 'FULL',

    -- Concurrency and Auditing
    row_version                 INT          NOT NULL DEFAULT 1,
    created_at_utc              TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id          UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc        TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id    UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_channel_config UNIQUE (sales_channel_id)
);

COMMENT ON TABLE sales.sales_channel_configurations IS 
    '[FOUNDATION] Configuration parameters linking pricing, workflows, and credit policies to specific sales routes.';

-- 10.2 Customer Fulfillment Preferences
CREATE TABLE sales.customer_order_preferences (
    id                              UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    customer_id                     UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    preferred_warehouse_id          UUID         REFERENCES warehouse.warehouses(id) ON DELETE SET NULL,
    preferred_carrier_id            UUID         REFERENCES supplier.suppliers(id) ON DELETE SET NULL,
    preferred_delivery_window_start TIME,
    preferred_delivery_window_end   TIME,
    packaging_preference            VARCHAR(100),
    special_instructions            TEXT,

    -- Concurrency and Auditing
    row_version                     INT          NOT NULL DEFAULT 1,
    created_at_utc                  TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id              UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc            TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id        UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_customer_pref UNIQUE (customer_id),
    CONSTRAINT chk_pref_delivery_window CHECK (preferred_delivery_window_end IS NULL OR preferred_delivery_window_start IS NULL OR preferred_delivery_window_end > preferred_delivery_window_start)
);

COMMENT ON TABLE sales.customer_order_preferences IS 
    '[FOUNDATION] Reusable customer fulfillment defaults governing carrier routes, packaging, and warehouses.';

-- =============================================================================
-- SECTION 11 — WORKFLOWS & CHRONOLOGICAL HISTORY
-- =============================================================================

-- 11.1 Approval Requests Envelope
CREATE TABLE sales.approval_requests (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    document_type        VARCHAR(50)  NOT NULL, -- QUOTATION, SALES_ORDER, RETURN, CONTRACT
    document_id          UUID         NOT NULL,
    approval_status_id   UUID         NOT NULL REFERENCES customer.compliance_statuses(id),
    requested_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    -- Auditing
    created_at_utc       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id   UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_approval_doc_type CHECK (document_type IN ('QUOTATION', 'SALES_ORDER', 'RETURN', 'CONTRACT'))
);

COMMENT ON TABLE sales.approval_requests IS 
    '[FOUNDATION] Workflow approval headers gating quotes or orders exceeding margin guidelines.';

-- 11.2 Approval Decisions
CREATE TABLE sales.approval_decisions (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    approval_request_id  UUID         NOT NULL REFERENCES sales.approval_requests(id) ON DELETE CASCADE,
    approver_employee_id UUID         NOT NULL REFERENCES employee.employees(id),
    decision_status_id   UUID         NOT NULL REFERENCES customer.compliance_statuses(id),
    comments             TEXT,
    decided_at_utc       TIMESTAMPTZ,

    CONSTRAINT uq_approval_decisions UNIQUE (approval_request_id, approver_employee_id)
);

COMMENT ON TABLE sales.approval_decisions IS 
    '[FOUNDATION] Operational workflow reviews logged by designated credit or sales controllers.';

-- 11.3 Approval Delegations
CREATE TABLE sales.approval_delegations (
    id                            UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    original_approver_employee_id UUID         NOT NULL REFERENCES employee.employees(id),
    delegate_approver_employee_id UUID         NOT NULL REFERENCES employee.employees(id),
    start_date                    DATE         NOT NULL,
    end_date                      DATE         NOT NULL,
    is_active                     BOOLEAN      NOT NULL DEFAULT TRUE,

    created_at_utc                TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_delegation_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_delegation_self CHECK (original_approver_employee_id <> delegate_approver_employee_id)
);

COMMENT ON TABLE sales.approval_delegations IS 
    '[FOUNDATION] Delegation mappings routing workflows when approval owners are absent.';

-- 11.4 Approval Escalations
CREATE TABLE sales.approval_escalations (
    id                         UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    approval_request_id        UUID         NOT NULL REFERENCES sales.approval_requests(id) ON DELETE CASCADE,
    escalated_from_approver_id UUID         NOT NULL REFERENCES employee.employees(id),
    escalated_to_approver_id   UUID         NOT NULL REFERENCES employee.employees(id),
    escalated_at_utc           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    reason                     TEXT,

    CONSTRAINT chk_escalation_self CHECK (escalated_from_approver_id <> escalated_to_approver_id)
);

COMMENT ON TABLE sales.approval_escalations IS 
    '[FOUNDATION] Workflow escalations routing requests to higher management tiers upon SLA expiry.';

-- 11.5 Order Status / Lifecycle History (Transition timeline)
CREATE TABLE sales.sales_order_lifecycle_history (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_order_id         UUID         NOT NULL REFERENCES sales.sales_orders(id) ON DELETE CASCADE,
    sales_order_status_id  UUID         NOT NULL REFERENCES sales.sales_order_statuses(id),
    effective_from         TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    effective_to           TIMESTAMPTZ,
    reason                 TEXT,
    changed_by_user_id     UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_order_lifecycle_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE sales.sales_order_lifecycle_history IS 
    '[HISTORY] Detailed transition ledger recording order status shifts (picking -> packing -> dispatched).';

-- 11.6 Sales Order Holds History
CREATE TABLE sales.sales_order_hold_history (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    sales_order_id         UUID         NOT NULL REFERENCES sales.sales_orders(id) ON DELETE CASCADE,
    hold_type              VARCHAR(50)  NOT NULL, -- CREDIT_HOLD, ORDER_HOLD, DELIVERY_HOLD, CUSTOMER_HOLD
    reason                 TEXT         NOT NULL,
    applied_by_user_id     UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    released_by_user_id    UUID         REFERENCES iam.users(id) ON DELETE SET NULL,
    start_time             TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    end_time               TIMESTAMPTZ,
    comments               TEXT,

    CONSTRAINT chk_order_hold_dates CHECK (end_time IS NULL OR end_time >= start_time),
    CONSTRAINT chk_order_hold_type CHECK (hold_type IN ('CREDIT_HOLD', 'ORDER_HOLD', 'DELIVERY_HOLD', 'CUSTOMER_HOLD'))
);

COMMENT ON TABLE sales.sales_order_hold_history IS 
    '[HISTORY] Detailed log auditing order credit holds and release approvals.';

-- 11.7 Generic Sales Event Chronology Timeline
CREATE TABLE sales.sales_event_timeline (
    id                  UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    company_id          UUID         NOT NULL REFERENCES organization.companies(id) ON DELETE CASCADE,
    customer_id         UUID         NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    event_type          VARCHAR(100) NOT NULL, -- QUOTE_CREATE, QUOTE_APPROVE, ORDER_CREATE, ORDER_RELEASE, ALLOC_COMPLETE, SHIP_CREATE, DELIV_COMPLETE, RETURN_CREATE, RETURN_CLOSE
    document_type       VARCHAR(50)  NOT NULL, -- QUOTATION, SALES_ORDER, SHIPMENT, RETURN
    document_id         UUID         NOT NULL,
    event_timestamp     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    processed_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,
    payload             JSONB,

    CONSTRAINT chk_sales_evt_timeline_doc CHECK (document_type IN ('QUOTATION', 'SALES_ORDER', 'SHIPMENT', 'RETURN'))
);

COMMENT ON TABLE sales.sales_event_timeline IS 
    '[HISTORY] Compiled chronological master timeline for executive sales dashboard metrics.';

-- =============================================================================
-- SECTION 12 — SALES ANALYTICS FOUNDATION
-- =============================================================================

CREATE TABLE sales.sales_kpis_snapshot (
    id                    UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    recorded_date         DATE          NOT NULL DEFAULT CURRENT_DATE,
    territory_id          UUID          NOT NULL REFERENCES organization.territories(id),
    sales_channel_id      UUID          NOT NULL REFERENCES sales.sales_channels(id),
    
    total_orders_count    INT           NOT NULL DEFAULT 0,
    revenue_amount        NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    cost_amount           NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    margin_amount         NUMERIC(18,4) GENERATED ALWAYS AS (revenue_amount - cost_amount) STORED,
    
    fill_rate_pct         NUMERIC(5,2),
    cancellation_rate_pct NUMERIC(5,2),
    conversion_rate_pct   NUMERIC(5,2),
    
    -- Refinement: Versioning & Execution Audit
    calculation_version   INT           NOT NULL DEFAULT 1,
    aggregation_period    VARCHAR(50)   NOT NULL DEFAULT 'DAILY', -- DAILY, WEEKLY, MONTHLY
    calculation_source    VARCHAR(100)  NOT NULL DEFAULT 'SYSTEM_BATCH',
    execution_timestamp   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    created_at_utc        TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_sales_kpi_snapshot UNIQUE (recorded_date, territory_id, sales_channel_id, calculation_version),
    CONSTRAINT chk_kpi_orders CHECK (total_orders_count >= 0),
    CONSTRAINT chk_kpi_rev CHECK (revenue_amount >= 0.0000),
    CONSTRAINT chk_kpi_cost CHECK (cost_amount >= 0.0000),
    CONSTRAINT chk_kpi_fill CHECK (fill_rate_pct IS NULL OR (fill_rate_pct >= 0.00 AND fill_rate_pct <= 100.00)),
    CONSTRAINT chk_kpi_cancel CHECK (cancellation_rate_pct IS NULL OR (cancellation_rate_pct >= 0.00 AND cancellation_rate_pct <= 100.00)),
    CONSTRAINT chk_kpi_convert CHECK (conversion_rate_pct IS NULL OR (conversion_rate_pct >= 0.00 AND conversion_rate_pct <= 100.00)),
    CONSTRAINT chk_kpi_calc_ver CHECK (calculation_version >= 1),
    CONSTRAINT chk_kpi_period CHECK (aggregation_period IN ('DAILY', 'WEEKLY', 'MONTHLY'))
);

COMMENT ON TABLE sales.sales_kpis_snapshot IS 
    '[HISTORY] Compiled historical sales analytics tracking channel performance metrics.';

-- =============================================================================
-- SECTION 13 — INDEX STRATEGY (B-TREE FOREIGNS & COMPOSITE COVERING)
-- =============================================================================

-- 13.1 B-Tree Indexes on all Foreign Keys
CREATE INDEX idx_quote_company_fk             ON sales.sales_quotations (company_id);
CREATE INDEX idx_quote_customer_fk            ON sales.sales_quotations (customer_id);
CREATE INDEX idx_quote_status_fk              ON sales.sales_quotations (quotation_status_id);
CREATE INDEX idx_quote_pay_terms_fk           ON sales.sales_quotations (payment_terms_id);
CREATE INDEX idx_quote_order_fk               ON sales.sales_quotations (converted_to_order_id);

CREATE INDEX idx_quote_line_parent_fk         ON sales.sales_quotation_lines (quotation_id);
CREATE INDEX idx_quote_line_product_fk        ON sales.sales_quotation_lines (product_id);

CREATE INDEX idx_order_company_fk             ON sales.sales_orders (company_id);
CREATE INDEX idx_order_customer_fk            ON sales.sales_orders (customer_id);
CREATE INDEX idx_order_site_fk                ON sales.sales_orders (customer_site_id);
CREATE INDEX idx_order_status_fk              ON sales.sales_orders (order_status_id);
CREATE INDEX idx_order_type_fk                ON sales.sales_orders (order_type_id);
CREATE INDEX idx_order_priority_fk            ON sales.sales_orders (priority_level_id);
CREATE INDEX idx_order_channel_fk             ON sales.sales_orders (sales_channel_id);
CREATE INDEX idx_order_source_fk              ON sales.sales_orders (sales_source_id);
CREATE INDEX idx_order_pay_terms_fk           ON sales.sales_orders (payment_terms_id);

CREATE INDEX idx_order_line_parent_fk         ON sales.sales_order_lines (sales_order_id);
CREATE INDEX idx_order_line_product_fk        ON sales.sales_order_lines (product_id);
CREATE INDEX idx_order_line_full_status_fk    ON sales.sales_order_lines (fulfillment_status_id);

CREATE INDEX idx_order_revision_parent_fk     ON sales.sales_order_revisions (sales_order_id);
CREATE INDEX idx_order_revision_user_fk       ON sales.sales_order_revisions (revised_by_user_id);

CREATE INDEX idx_alloc_order_line_fk          ON sales.order_allocations (sales_order_line_id);
CREATE INDEX idx_alloc_warehouse_fk           ON sales.order_allocations (warehouse_id);
CREATE INDEX idx_alloc_status_fk              ON sales.order_allocations (allocation_status_id);

CREATE INDEX idx_alloc_hist_line_fk           ON sales.order_allocation_history (sales_order_line_id);
CREATE INDEX idx_alloc_hist_warehouse_fk      ON sales.order_allocation_history (warehouse_id);
CREATE INDEX idx_alloc_hist_user_fk           ON sales.order_allocation_history (processed_by_user_id);

CREATE INDEX idx_sales_res_line_fk            ON sales.sales_inventory_reservations (sales_order_line_id);
CREATE INDEX idx_sales_res_warehouse_fk       ON sales.sales_inventory_reservations (warehouse_id);
CREATE INDEX idx_sales_res_user_fk            ON sales.sales_inventory_reservations (created_by_user_id);

CREATE INDEX idx_sales_res_hist_parent_fk     ON sales.sales_reservation_history (reservation_id);
CREATE INDEX idx_sales_res_hist_user_fk       ON sales.sales_reservation_history (processed_by_user_id);

CREATE INDEX idx_deliv_sched_order_fk         ON sales.delivery_schedules (sales_order_id);
CREATE INDEX idx_deliv_sched_site_fk          ON sales.delivery_schedules (customer_site_id);
CREATE INDEX idx_deliv_sched_carrier_fk       ON sales.delivery_schedules (carrier_id);
CREATE INDEX idx_deliv_sched_status_fk        ON sales.delivery_schedules (shipment_status_id);

CREATE INDEX idx_deliv_line_sched_fk          ON sales.delivery_schedule_lines (delivery_schedule_id);
CREATE INDEX INDEX idx_deliv_line_order_line_fk ON sales.delivery_schedule_lines (sales_order_line_id);

CREATE INDEX idx_fulfillment_hist_order_fk    ON sales.fulfillment_event_history (sales_order_id);
CREATE INDEX idx_fulfillment_hist_line_fk     ON sales.fulfillment_event_history (sales_order_line_id);
CREATE INDEX idx_fulfillment_hist_employee_fk ON sales.fulfillment_event_history (employee_id);
CREATE INDEX idx_fulfillment_hist_warehouse_fk ON sales.fulfillment_event_history (warehouse_id);

CREATE INDEX idx_price_snap_line_fk           ON sales.order_line_pricing_snapshots (sales_order_line_id);
CREATE INDEX idx_price_snap_promo_fk          ON sales.order_line_pricing_snapshots (applied_promotion_id);
CREATE INDEX idx_price_snap_contract_fk       ON sales.order_line_pricing_snapshots (applied_contract_id);

CREATE INDEX idx_contract_company_fk          ON sales.sales_contracts (company_id);
CREATE INDEX idx_contract_customer_fk         ON sales.sales_contracts (customer_id);

CREATE INDEX idx_contract_line_parent_fk      ON sales.sales_contract_lines (sales_contract_id);
CREATE INDEX idx_contract_line_product_fk     ON sales.sales_contract_lines (product_id);

CREATE INDEX idx_return_company_fk            ON sales.sales_returns (company_id);
CREATE INDEX idx_return_customer_fk           ON sales.sales_returns (customer_id);
CREATE INDEX idx_return_status_fk             ON sales.sales_returns (return_status_id);
CREATE INDEX idx_return_order_fk              ON sales.sales_returns (original_sales_order_id);
CREATE INDEX idx_return_replacement_fk        ON sales.sales_returns (replacement_order_id);

CREATE INDEX idx_return_line_parent_fk        ON sales.sales_return_lines (sales_return_id);
CREATE INDEX idx_return_line_order_line_fk    ON sales.sales_return_lines (sales_order_line_id);
CREATE INDEX idx_return_line_product_fk       ON sales.sales_return_lines (product_id);
CREATE INDEX idx_return_line_reason_fk        ON sales.sales_return_lines (return_reason_id);
CREATE INDEX idx_return_line_inspec_fk        ON sales.sales_return_lines (inspection_status_id);

CREATE INDEX idx_campaign_user_fk             ON sales.promotion_campaigns (created_by_user_id);

CREATE INDEX idx_promo_campaign_fk            ON sales.promotions (campaign_id);
CREATE INDEX idx_promo_type_fk                ON sales.promotions (promotion_type_id);
CREATE INDEX idx_promo_user_fk                ON sales.promotions (created_by_user_id);

CREATE INDEX idx_eligibility_promo_fk         ON sales.promotion_customer_eligibility (promotion_id);
CREATE INDEX idx_eligibility_customer_fk      ON sales.promotion_customer_eligibility (customer_id);
CREATE INDEX idx_eligibility_category_fk      ON sales.promotion_customer_eligibility (customer_category_id);
CREATE INDEX idx_eligibility_segment_fk       ON sales.promotion_customer_eligibility (customer_segment_id);

CREATE INDEX idx_promo_rule_promo_fk          ON sales.promotion_product_rules (promotion_id);
CREATE INDEX idx_promo_rule_product_fk         ON sales.promotion_product_rules (product_id);

CREATE INDEX idx_promo_app_hist_line_fk       ON sales.promotion_application_history (sales_order_line_id);
CREATE INDEX idx_promo_app_hist_campaign_fk   ON sales.promotion_application_history (campaign_id);
CREATE INDEX idx_promo_app_hist_promo_fk      ON sales.promotion_application_history (promotion_id);
CREATE INDEX idx_promo_app_hist_user_fk       ON sales.promotion_application_history (approved_by_user_id);

CREATE INDEX idx_channel_config_channel_fk    ON sales.sales_channel_configurations (sales_channel_id);
CREATE INDEX idx_channel_config_warehouse_fk  ON sales.sales_channel_configurations (default_warehouse_id);
CREATE INDEX idx_channel_config_user_fk       ON sales.sales_channel_configurations (created_by_user_id);

CREATE INDEX idx_cust_pref_customer_fk        ON sales.customer_order_preferences (customer_id);
CREATE INDEX idx_cust_pref_warehouse_fk       ON sales.customer_order_preferences (preferred_warehouse_id);
CREATE INDEX idx_cust_pref_carrier_fk         ON sales.customer_order_preferences (preferred_carrier_id);
CREATE INDEX idx_cust_pref_user_fk            ON sales.customer_order_preferences (created_by_user_id);

CREATE INDEX idx_approval_status_fk           ON sales.approval_requests (approval_status_id);
CREATE INDEX idx_approval_user_fk             ON sales.approval_requests (created_by_user_id);

CREATE INDEX idx_decision_request_fk          ON sales.approval_decisions (approval_request_id);
CREATE INDEX idx_decision_employee_fk         ON sales.approval_decisions (approver_employee_id);
CREATE INDEX idx_decision_status_fk           ON sales.approval_decisions (decision_status_id);

CREATE INDEX idx_delegation_original_fk       ON sales.approval_delegations (original_approver_employee_id);
CREATE INDEX idx_delegation_delegate_fk       ON sales.approval_delegations (delegate_approver_employee_id);

CREATE INDEX idx_escalation_request_fk        ON sales.approval_escalations (approval_request_id);
CREATE INDEX idx_escalation_from_fk           ON sales.approval_escalations (escalated_from_approver_id);
CREATE INDEX idx_escalation_to_fk             ON sales.approval_escalations (escalated_to_approver_id);

CREATE INDEX idx_lifecycle_hist_order_fk      ON sales.sales_order_lifecycle_history (sales_order_id);
CREATE INDEX idx_lifecycle_hist_status_fk     ON sales.sales_order_lifecycle_history (sales_order_status_id);
CREATE INDEX idx_lifecycle_hist_user_fk       ON sales.sales_order_lifecycle_history (changed_by_user_id);

CREATE INDEX idx_order_hold_hist_order_fk     ON sales.sales_order_hold_history (sales_order_id);
CREATE INDEX idx_order_hold_hist_applied_fk   ON sales.sales_order_hold_history (applied_by_user_id);
CREATE INDEX idx_order_hold_hist_released_fk  ON sales.sales_order_hold_history (released_by_user_id);

CREATE INDEX idx_timeline_company_fk          ON sales.sales_event_timeline (company_id);
CREATE INDEX idx_timeline_customer_fk         ON sales.sales_event_timeline (customer_id);
CREATE INDEX idx_timeline_user_fk             ON sales.sales_event_timeline (processed_by_user_id);

CREATE INDEX idx_kpi_territory_fk             ON sales.sales_kpis_snapshot (territory_id);
CREATE INDEX idx_kpi_channel_fk               ON sales.sales_kpis_snapshot (sales_channel_id);

-- 13.2 Composite Indexes (Covering filter queries)
CREATE INDEX idx_order_status_type_comp       ON sales.sales_orders (order_status_id, order_type_id);
CREATE INDEX idx_order_line_full_qty_comp     ON sales.sales_order_lines (sales_order_id, fulfillment_status_id, quantity_ordered);
CREATE INDEX idx_eligibility_group_comp       ON sales.promotion_customer_eligibility (promotion_id, customer_category_id, customer_segment_id);
CREATE INDEX idx_quote_customer_status_comp   ON sales.sales_quotations (customer_id, quotation_status_id);

-- 13.3 Partial Indexes (Optimizing active/hot records)
CREATE INDEX idx_order_credit_holds           ON sales.sales_orders (customer_id) WHERE is_credit_hold = TRUE AND is_deleted = FALSE;
CREATE INDEX idx_order_order_holds            ON sales.sales_orders (customer_id) WHERE is_order_hold = TRUE AND is_deleted = FALSE;
CREATE INDEX idx_deliv_sched_holds            ON sales.delivery_schedules (sales_order_id) WHERE is_delivery_hold = TRUE AND is_deleted = FALSE;
CREATE INDEX idx_promo_active_campaign        ON sales.promotions (campaign_id) WHERE is_active = TRUE;
CREATE INDEX idx_delegation_active_today      ON sales.approval_delegations (original_approver_employee_id) WHERE is_active = TRUE AND end_date >= CURRENT_DATE;
CREATE INDEX idx_order_backordered_lines      ON sales.sales_order_lines (product_id) WHERE quantity_backordered > 0.0000;
CREATE INDEX idx_res_active_locks             ON sales.sales_inventory_reservations (sales_order_line_id) WHERE status = 'RESERVED';
CREATE INDEX idx_timeline_recent_events       ON sales.sales_event_timeline (event_timestamp) WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days';
