-- =============================================================================
-- INK FMCG ENTERPRISE ERP — LOGISTICS & DISTRIBUTION SCHEMAS (v2.0 REFINED)
-- File Name      : logistics_schema.sql
-- Target Database: PostgreSQL 16+
-- Schema Owner   : logistics
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS logistics;

-- =============================================================================
-- SECTION 1 — LOOKUP TABLES
-- =============================================================================

-- 1.1 Vehicle Statuses
CREATE TABLE logistics.vehicle_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 1,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_vehicle_statuses_code UNIQUE (code),
    CONSTRAINT chk_vehicle_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE logistics.vehicle_statuses IS 
    '[LOOKUP] Lifecycle status of a delivery vehicle: AVAILABLE, IN_TRIP, MAINTENANCE, OUT_OF_SERVICE.';

-- 1.2 Vehicle Types
CREATE TABLE logistics.vehicle_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_vehicle_types_code UNIQUE (code),
    CONSTRAINT chk_vehicle_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE logistics.vehicle_types IS 
    '[LOOKUP] Classifies physical vehicles: LCV_3TON, HCV_10TON, THREE_WHEELER, PALLET_TRUCK.';

-- 1.3 Vehicle Categories
CREATE TABLE logistics.vehicle_categories (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_vehicle_categories_code UNIQUE (code),
    CONSTRAINT chk_vehicle_categories_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE logistics.vehicle_categories IS 
    '[LOOKUP] Classifies ownership categories: OWNED, CONTRACT_3PL, MARKET_VEHICLE.';

-- 1.4 Fuel Types
CREATE TABLE logistics.fuel_types (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_fuel_types_code UNIQUE (code),
    CONSTRAINT chk_fuel_types_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE logistics.fuel_types IS 
    '[LOOKUP] Fuel categories: DIESEL, PETROL, CNG, ELECTRIC.';

-- 1.5 Driver Statuses
CREATE TABLE logistics.driver_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_driver_statuses_code UNIQUE (code),
    CONSTRAINT chk_driver_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE logistics.driver_statuses IS 
    '[LOOKUP] Status of drivers: AVAILABLE, IN_TRIP, LEAVE, SUSPENDED.';

-- 1.6 Route Statuses
CREATE TABLE logistics.route_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_route_statuses_code UNIQUE (code),
    CONSTRAINT chk_route_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE logistics.route_statuses IS 
    '[LOOKUP] Route mapping availability: ACTIVE, INACTIVE, SUSPENDED.';

-- 1.7 Trip Statuses
CREATE TABLE logistics.trip_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_trip_statuses_code UNIQUE (code),
    CONSTRAINT chk_trip_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE logistics.trip_statuses IS 
    '[LOOKUP] Trip dispatch status: PLANNED, DISPATCHED, IN_TRANSIT, COMPLETED, CANCELLED.';

-- 1.8 Delivery Statuses
CREATE TABLE logistics.delivery_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_delivery_statuses_code UNIQUE (code),
    CONSTRAINT chk_delivery_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE logistics.delivery_statuses IS 
    '[LOOKUP] Dispatch status of individual deliveries: LOADED, EN_ROUTE, DELIVERED, PARTIALLY_DELIVERED, FAILED.';

-- 1.9 Failure Reasons
CREATE TABLE logistics.failure_reasons (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_failure_reasons_code UNIQUE (code),
    CONSTRAINT chk_failure_reasons_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE logistics.failure_reasons IS 
    '[LOOKUP] Reasons for delivery failures: CUSTOMER_NOT_AVAILABLE, REJECTED_BY_CUSTOMER, SITE_CLOSED, NO_PARKING.';

-- 1.10 Reverse Logistics Reasons
CREATE TABLE logistics.reverse_logistics_reasons (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_rev_reasons_code UNIQUE (code),
    CONSTRAINT chk_rev_reasons_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE logistics.reverse_logistics_reasons IS 
    '[LOOKUP] Reasons for return collections: RETURN_AUTHORIZATION, DAMAGED_ON_DELIVERY, REJECTED_DELIVERY.';

-- 1.11 Maintenance Statuses
CREATE TABLE logistics.maintenance_statuses (
    id             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_maint_statuses_code UNIQUE (code),
    CONSTRAINT chk_maint_statuses_code_upper CHECK (code = upper(code))
);

COMMENT ON TABLE logistics.maintenance_statuses IS 
    '[LOOKUP] Vehicle maintenance status: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED.';

-- =============================================================================
-- SECTION 2 — FLEET REGISTRY
-- =============================================================================

CREATE TABLE logistics.vehicles (
    id                               UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    registration_number              VARCHAR(50)   NOT NULL,
    vehicle_type_id                  UUID          NOT NULL REFERENCES logistics.vehicle_types(id),
    vehicle_category_id              UUID          NOT NULL REFERENCES logistics.vehicle_categories(id),
    fuel_type_id                     UUID          NOT NULL REFERENCES logistics.fuel_types(id),
    vehicle_status_id                UUID          NOT NULL REFERENCES logistics.vehicle_statuses(id),
    
    max_load_kg                      NUMERIC(12,4) NOT NULL,
    max_volume_cbm                   NUMERIC(12,4) NOT NULL,
    
    insurance_expiry_date            DATE,
    permit_expiry_date               DATE,
    fitness_certificate_expiry_date  DATE,
    current_odometer                 NUMERIC(12,2) NOT NULL DEFAULT 0.00,

    -- Concurrency and Auditing
    row_version                      INT           NOT NULL DEFAULT 1,
    created_at_utc                   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id               UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc             TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id         UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    is_deleted                       BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc                   TIMESTAMPTZ,
    deleted_by_user_id               UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_vehicle_registration UNIQUE (registration_number),
    CONSTRAINT chk_vehicle_load CHECK (max_load_kg > 0.0000),
    CONSTRAINT chk_vehicle_volume CHECK (max_volume_cbm > 0.0000),
    CONSTRAINT chk_vehicle_odometer CHECK (current_odometer >= 0.00)
);

COMMENT ON TABLE logistics.vehicles IS 
    '[REGISTRY] Mapped fleet vehicles, loading capacities, insurance files, and odometer counters.';

-- =============================================================================
-- SECTION 3 — DRIVER REGISTRY & COMPLIANCE
-- =============================================================================

-- 3.1 Drivers
CREATE TABLE logistics.drivers (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    employee_id            UUID          NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    license_number         VARCHAR(100)  NOT NULL,
    license_type           VARCHAR(50)   NOT NULL, -- HEAVY_COMMERCIAL, LIGHT_COMMERCIAL
    license_expiry_date    DATE          NOT NULL,
    medical_validity_date  DATE,
    driver_status_id       UUID          NOT NULL REFERENCES logistics.driver_statuses(id),

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_driver_employee UNIQUE (employee_id),
    CONSTRAINT uq_driver_license UNIQUE (license_number)
);

COMMENT ON TABLE logistics.drivers IS 
    '[REGISTRY] Mapped driver accounts linked to HR personnel profiles, license validity, and medical status.';

-- 3.2 Driver Certifications
CREATE TABLE logistics.driver_certifications (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    driver_id          UUID          NOT NULL REFERENCES logistics.drivers(id) ON DELETE CASCADE,
    certification_name VARCHAR(150)  NOT NULL, -- HAZMAT_COMPLIANT, COLD_CHAIN_COMPLIANT, DEFENSIVE_DRIVING
    expiry_date        DATE          NOT NULL,

    CONSTRAINT uq_driver_cert UNIQUE (driver_id, certification_name)
);

COMMENT ON TABLE logistics.driver_certifications IS 
    '[REGISTRY] Mapped driver training certifications.';

-- =============================================================================
-- SECTION 4 — ROUTE MANAGEMENT (REFINED)
-- =============================================================================

-- 4.1 Route Headers
CREATE TABLE logistics.routes (
    id                         UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    route_code                 VARCHAR(50)   NOT NULL,
    route_name                 VARCHAR(150)  NOT NULL,
    route_status_id            UUID          NOT NULL REFERENCES logistics.route_statuses(id),
    
    estimated_distance_km      NUMERIC(8,2)  NOT NULL,
    estimated_duration_minutes INT           NOT NULL,
    route_version              INT           NOT NULL DEFAULT 1,

    -- Concurrency and Auditing
    row_version                INT           NOT NULL DEFAULT 1,
    created_at_utc             TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id         UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    is_deleted                 BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at_utc             TIMESTAMPTZ,
    deleted_by_user_id         UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_route_code UNIQUE (route_code),
    CONSTRAINT chk_route_distance CHECK (estimated_distance_km > 0.00),
    CONSTRAINT chk_route_duration CHECK (estimated_duration_minutes > 0),
    CONSTRAINT chk_route_version CHECK (route_version >= 1)
);

COMMENT ON TABLE logistics.routes IS 
    '[OPERATIONAL] Dispatch routes, estimated distance totals, and route configuration revisions.';

-- 4.2 Route Version History
CREATE TABLE logistics.route_versions (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    route_id             UUID         NOT NULL REFERENCES logistics.routes(id) ON DELETE CASCADE,
    version_number       INT          NOT NULL,
    effective_date       DATE         NOT NULL DEFAULT CURRENT_DATE,
    retired_date         DATE,
    change_reason        TEXT,
    planner_employee_id  UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,

    CONSTRAINT uq_route_version_seq UNIQUE (route_id, version_number),
    CONSTRAINT chk_route_ver_num CHECK (version_number >= 1),
    CONSTRAINT chk_route_ver_dates CHECK (retired_date IS NULL OR retired_date >= effective_date)
);

COMMENT ON TABLE logistics.route_versions IS 
    '[FOUNDATION] Historical log tracing route revisions to prevent completed trip linkages from shifting.';

-- 4.3 Route Stops
CREATE TABLE logistics.route_stops (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    route_id           UUID          NOT NULL REFERENCES logistics.routes(id) ON DELETE CASCADE,
    stop_sequence      INT           NOT NULL,
    customer_site_id   UUID          NOT NULL REFERENCES customer.customer_sites(id) ON DELETE CASCADE,
    
    latitude           NUMERIC(9,6),
    longitude          NUMERIC(9,6),

    CONSTRAINT uq_route_stop_seq UNIQUE (route_id, stop_sequence),
    CONSTRAINT chk_stop_lat CHECK (latitude IS NULL OR (latitude >= -90.000000 AND latitude <= 90.000000)),
    CONSTRAINT chk_stop_long CHECK (longitude IS NULL OR (longitude >= -180.000000 AND longitude <= 180.000000))
);

COMMENT ON TABLE logistics.route_stops IS 
    '[OPERATIONAL] Sequence stops referencing GIS drop-off points per customer site location.';

-- =============================================================================
-- SECTION 5 — TRIP MANAGEMENT & VEHICLE SCHEDULES
-- =============================================================================

-- 5.1 Trip Headers
CREATE TABLE logistics.trips (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    trip_number            VARCHAR(50)   NOT NULL,
    route_id               UUID          REFERENCES logistics.routes(id) ON DELETE SET NULL,
    route_version_id       UUID          REFERENCES logistics.route_versions(id) ON DELETE SET NULL, -- Track specific version
    vehicle_id             UUID          REFERENCES logistics.vehicles(id) ON DELETE SET NULL,
    driver_id              UUID          REFERENCES logistics.drivers(id) ON DELETE SET NULL,
    trip_status_id         UUID          NOT NULL REFERENCES logistics.trip_statuses(id),
    
    scheduled_start_time   TIMESTAMPTZ   NOT NULL,
    actual_start_time      TIMESTAMPTZ,
    actual_end_time        TIMESTAMPTZ,
    start_odometer         NUMERIC(12,2),
    end_odometer           NUMERIC(12,2),

    -- Concurrency and Auditing
    row_version            INT           NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_trip_number UNIQUE (trip_number),
    CONSTRAINT chk_trip_times CHECK (actual_end_time IS NULL OR actual_start_time IS NULL OR actual_end_time >= actual_start_time),
    CONSTRAINT chk_trip_odometers CHECK (end_odometer IS NULL OR start_odometer IS NULL OR end_odometer >= start_odometer)
);

COMMENT ON TABLE logistics.trips IS 
    '[OPERATIONAL] Dispatch trips coordinating routes, assigned vehicles, drivers, and odometer updates.';

-- 5.2 Trip Stops Execution (Real-time progress tracking)
CREATE TABLE logistics.trip_stops (
    id                     UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    trip_id                UUID          NOT NULL REFERENCES logistics.trips(id) ON DELETE CASCADE,
    stop_sequence          INT           NOT NULL,
    customer_site_id       UUID          NOT NULL REFERENCES customer.customer_sites(id) ON DELETE CASCADE,
    
    arrival_status         VARCHAR(50)   NOT NULL DEFAULT 'PENDING', -- PENDING, ARRIVED, DEPARTED, SKIPPED
    planned_arrival_time   TIMESTAMPTZ,
    actual_arrival_time    TIMESTAMPTZ,
    actual_departure_time  TIMESTAMPTZ,
    delay_reason           TEXT,

    CONSTRAINT uq_trip_stop_seq UNIQUE (trip_id, stop_sequence),
    CONSTRAINT chk_trip_stop_arrival CHECK (arrival_status IN ('PENDING', 'ARRIVED', 'DEPARTED', 'SKIPPED')),
    CONSTRAINT chk_trip_stop_times CHECK (actual_departure_time IS NULL OR actual_arrival_time IS NULL OR actual_departure_time >= actual_arrival_time)
);

COMMENT ON TABLE logistics.trip_stops IS 
    '[OPERATIONAL] Real-time tracking of dispatch vehicle stops and unloading time records.';

-- =============================================================================
-- SECTION 6 — DELIVERY EXECUTION & EXCEPTIONS
-- =============================================================================

-- 6.1 Delivery Tasks
CREATE TABLE logistics.delivery_tasks (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    trip_stop_id         UUID          NOT NULL REFERENCES logistics.trip_stops(id) ON DELETE CASCADE,
    sales_order_id       UUID          NOT NULL REFERENCES sales.sales_orders(id) ON DELETE CASCADE,
    delivery_status_id   UUID          NOT NULL REFERENCES logistics.delivery_statuses(id),

    -- Concurrency and Auditing
    row_version          INT           NOT NULL DEFAULT 1,
    created_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    last_modified_by_user_id UUID        REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT uq_delivery_task_order UNIQUE (trip_stop_id, sales_order_id)
);

COMMENT ON TABLE logistics.delivery_tasks IS 
    '[OPERATIONAL] Delivery dispatches mapping orders to specific route drops.';

-- 6.2 Delivery Attempts (Logs retry attempts)
CREATE TABLE logistics.delivery_attempts (
    id                 UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    delivery_task_id   UUID          NOT NULL REFERENCES logistics.delivery_tasks(id) ON DELETE CASCADE,
    attempt_number     INT           NOT NULL,
    attempt_time       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    outcome_status_id  UUID          NOT NULL REFERENCES logistics.delivery_statuses(id),
    failure_reason_id  UUID          REFERENCES logistics.failure_reasons(id) ON DELETE SET NULL,
    notes              TEXT,

    CONSTRAINT uq_delivery_attempt UNIQUE (delivery_task_id, attempt_number),
    CONSTRAINT chk_delivery_attempt_num CHECK (attempt_number >= 1)
);

COMMENT ON TABLE logistics.delivery_attempts IS 
    '[OPERATIONAL] Chronological delivery attempt details tracking outcomes, counts, and failures.';

-- 6.3 Unified Delivery Exception Registry
CREATE TABLE logistics.delivery_exception_registry (
    id                    UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    delivery_task_id      UUID         NOT NULL REFERENCES logistics.delivery_tasks(id) ON DELETE CASCADE,
    exception_category    VARCHAR(50)  NOT NULL, -- CUSTOMER_UNAVAILABLE, WRONG_ADDRESS, DAMAGED_GOODS, PAYMENT_ISSUE, VEHICLE_FAILURE, TRAFFIC_DELAY, WEATHER_DELAY, CUSTOMER_REFUSED, SAFETY_INCIDENT
    severity              VARCHAR(20)  NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    reported_at_utc       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    description           TEXT         NOT NULL,
    resolution            TEXT,
    resolved_at_utc       TIMESTAMPTZ,
    owner_employee_id     UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,

    CONSTRAINT chk_deliv_excep_sev CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_deliv_excep_dates CHECK (resolved_at_utc IS NULL OR resolved_at_utc >= reported_at_utc),
    CONSTRAINT chk_deliv_excep_cat CHECK (exception_category IN ('CUSTOMER_UNAVAILABLE', 'WRONG_ADDRESS', 'DAMAGED_GOODS', 'PAYMENT_ISSUE', 'VEHICLE_FAILURE', 'TRAFFIC_DELAY', 'WEATHER_DELAY', 'CUSTOMER_REFUSED', 'SAFETY_INCIDENT'))
);

COMMENT ON TABLE logistics.delivery_exception_registry IS 
    '[OPERATIONAL] Unified audit logs recording in-transit delivery anomalies, delay sources, and resolutions.';

-- =============================================================================
-- SECTION 7 — PROOF OF DELIVERY & SLA
-- =============================================================================

-- 7.1 Proof of Delivery (POD)
CREATE TABLE logistics.proof_of_delivery (
    id                    UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    delivery_task_id      UUID          NOT NULL REFERENCES logistics.delivery_tasks(id) ON DELETE CASCADE,
    recipient_name        VARCHAR(150)  NOT NULL,
    
    signature_svg         TEXT,          -- Encoded vector signature payload
    photo_reference_hook  VARCHAR(255),  -- DMS photo attachment link
    
    gps_latitude          NUMERIC(9,6)  NOT NULL,
    gps_longitude         NUMERIC(9,6)  NOT NULL,
    gps_accuracy_meters   NUMERIC(5,2),
    
    verified_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    verified_by_employee_id UUID        REFERENCES employee.employees(id) ON DELETE SET NULL,
    
    -- Dispatch Verification checks
    vehicle_inspected     BOOLEAN       NOT NULL DEFAULT FALSE,
    departure_approved    BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_proof_delivery UNIQUE (delivery_task_id),
    CONSTRAINT chk_pod_gps_lat CHECK (gps_latitude >= -90.000000 AND gps_latitude <= 90.000000),
    CONSTRAINT chk_pod_gps_long CHECK (gps_longitude >= -180.000000 AND gps_longitude <= 180.000000),
    CONSTRAINT chk_pod_gps_accuracy CHECK (gps_accuracy_meters IS NULL OR gps_accuracy_meters >= 0.00)
);

COMMENT ON TABLE logistics.proof_of_delivery IS 
    '[OPERATIONAL] Sign-offs, photos, and GPS validation auditing completed deliveries.';

-- 7.2 Delivery SLA Monitoring
CREATE TABLE logistics.delivery_sla_monitoring (
    id                    UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    delivery_task_id      UUID         NOT NULL REFERENCES logistics.delivery_tasks(id) ON DELETE CASCADE,
    planned_arrival_time  TIMESTAMPTZ  NOT NULL,
    actual_arrival_time   TIMESTAMPTZ,
    target_sla_minutes    INT          NOT NULL,
    is_breached           BOOLEAN      GENERATED ALWAYS AS (actual_arrival_time > planned_arrival_time + (target_sla_minutes * INTERVAL '1 minute')) STORED,
    delay_reason          TEXT,
    created_at_utc        TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_deliv_sla_target CHECK (target_sla_minutes > 0)
);

COMMENT ON TABLE logistics.delivery_sla_monitoring IS 
    '[OPERATIONAL] Compares planned stops arrival timings with SLA rules to log breaches.';

-- =============================================================================
-- SECTION 8 — REVERSE LOGISTICS
-- =============================================================================

CREATE TABLE logistics.reverse_logistics_tasks (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    trip_stop_id         UUID          NOT NULL REFERENCES logistics.trip_stops(id) ON DELETE CASCADE,
    sales_return_id      UUID          REFERENCES sales.sales_returns(id) ON DELETE SET NULL, -- Return Authorization
    reverse_reason_id    UUID          NOT NULL REFERENCES logistics.reverse_logistics_reasons(id),
    
    quantity_expected    NUMERIC(18,4) NOT NULL,
    quantity_collected   NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    status               VARCHAR(50)   NOT NULL DEFAULT 'PENDING', -- PENDING, COLLECTED, CANCELLED

    -- Concurrency and Auditing
    row_version          INT           NOT NULL DEFAULT 1,
    created_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,
    last_modified_at_utc   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT chk_rev_expected CHECK (quantity_expected > 0.0000),
    CONSTRAINT chk_rev_collected CHECK (quantity_collected >= 0.0000 AND quantity_collected <= quantity_expected),
    CONSTRAINT chk_rev_status CHECK (status IN ('PENDING', 'COLLECTED', 'CANCELLED'))
);

COMMENT ON TABLE logistics.reverse_logistics_tasks IS 
    '[OPERATIONAL] Outbound return collection tasks tracking collections from customer sites.';

-- =============================================================================
-- SECTION 9 — VEHICLE MAINTENANCE & FUEL ANALYTICS
-- =============================================================================

-- 9.1 Maintenance Schedules
CREATE TABLE logistics.maintenance_schedules (
    id                   UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    vehicle_id           UUID          NOT NULL REFERENCES logistics.vehicles(id) ON DELETE CASCADE,
    maintenance_type     VARCHAR(100)  NOT NULL, -- PREVENTATIVE_SERVICE, MECHANICAL_REPAIR, TYRE_CHANGE
    scheduled_date       DATE          NOT NULL,
    completed_date       DATE,
    status_id            UUID          NOT NULL REFERENCES logistics.maintenance_statuses(id),
    
    cost                 NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
    odometer_at_service  NUMERIC(12,2),

    -- Concurrency and Auditing
    row_version          INT           NOT NULL DEFAULT 1,
    created_at_utc       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id   UUID          REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_maint_cost CHECK (cost >= 0.0000),
    CONSTRAINT chk_maint_odometer CHECK (odometer_at_service IS NULL OR odometer_at_service >= 0.00),
    CONSTRAINT chk_maint_dates CHECK (completed_date IS NULL OR completed_date >= scheduled_date)
);

COMMENT ON TABLE logistics.maintenance_schedules IS 
    '[OPERATIONAL] Maintenance calendar records tracking service plans, status updates, and costs.';

-- 9.2 Fuel Logs (Refined with Analytics)
CREATE TABLE logistics.fuel_logs (
    id                           UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    vehicle_id                   UUID          NOT NULL REFERENCES logistics.vehicles(id) ON DELETE CASCADE,
    trip_id                      UUID          REFERENCES logistics.trips(id) ON DELETE SET NULL,
    log_time                     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    
    fuel_quantity_liters         NUMERIC(8,2)  NOT NULL,
    cost                         NUMERIC(10,2) NOT NULL,
    odometer_reading             NUMERIC(12,2) NOT NULL,
    receipt_photo_hook           VARCHAR(255),
    
    -- v2.0 Fuel Analytics
    fuel_efficiency_km_liter     NUMERIC(6,2),
    cost_per_km                  NUMERIC(10,4),
    idle_fuel_consumption_liters NUMERIC(6,2),
    expected_consumption_liters  NUMERIC(8,2),
    variance_liters              NUMERIC(8,2),

    CONSTRAINT chk_fuel_qty CHECK (fuel_quantity_liters > 0.00),
    CONSTRAINT chk_fuel_cost CHECK (cost >= 0.00),
    CONSTRAINT chk_fuel_odometer CHECK (odometer_reading >= 0.00)
);

COMMENT ON TABLE logistics.fuel_logs IS 
    '[OPERATIONAL] Fuel consumption receipts tracking cost details, odometer checks, efficiency, and variances.';

-- 9.3 Breakdown Events
CREATE TABLE logistics.breakdown_events (
    id                   UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    vehicle_id           UUID         NOT NULL REFERENCES logistics.vehicles(id) ON DELETE CASCADE,
    trip_id              UUID         REFERENCES logistics.trips(id) ON DELETE SET NULL,
    
    event_time           TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    location_description TEXT         NOT NULL,
    issue_description    TEXT         NOT NULL,
    resolution_details   TEXT,
    resolved_at_utc      TIMESTAMPTZ,

    CONSTRAINT chk_breakdown_dates CHECK (resolved_at_utc IS NULL OR resolved_at_utc >= event_time)
);

COMMENT ON TABLE logistics.breakdown_events IS 
    '[OPERATIONAL] Logs breakdowns, resolutions, and downtime delays.';

-- =============================================================================
-- SECTION 10 — TIMELINES & ASSIGNMENT AUDITING (v2.0 ADDITIONS)
-- =============================================================================

-- 10.1 Trip Event Timeline (Master Execution Log)
CREATE TABLE logistics.trip_event_timeline (
    id                  UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    trip_id             UUID         NOT NULL REFERENCES logistics.trips(id) ON DELETE CASCADE,
    event_type          VARCHAR(100) NOT NULL, -- TRIP_CREATE, VEHICLE_ASSIGN, DRIVER_ASSIGN, TRIP_APPROVE, TRIP_START, WH_DEPART, STOP_ARRIVE, DELIV_START, DELIV_COMP, DELIV_FAIL, REVERSE_COMP, BREAKDOWN, VEHICLE_REPLACE, DRIVER_REPLACE, TRIP_SUSPEND, TRIP_RESUME, WH_RETURN, TRIP_CLOSE
    event_timestamp     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    employee_id         UUID         REFERENCES employee.employees(id) ON DELETE SET NULL,
    payload             JSONB,

    created_at_utc      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE logistics.trip_event_timeline IS 
    '[HISTORY] Detailed transition logs tracking trip dispatches (vehicle breakages, replacements, arrival states).';

-- 10.2 Vehicle Assignment History
CREATE TABLE logistics.vehicle_assignment_history (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    trip_id                UUID         NOT NULL REFERENCES logistics.trips(id) ON DELETE CASCADE,
    original_vehicle_id    UUID         NOT NULL REFERENCES logistics.vehicles(id) ON DELETE CASCADE,
    replacement_vehicle_id UUID         REFERENCES logistics.vehicles(id) ON DELETE SET NULL,
    replacement_reason     TEXT,
    assigned_at_utc        TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    released_at_utc        TIMESTAMPTZ,
    approved_by_user_id    UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_veh_assign_dates CHECK (released_at_utc IS NULL OR released_at_utc >= assigned_at_utc)
);

COMMENT ON TABLE logistics.vehicle_assignment_history IS 
    '[HISTORY] Tracks vehicle allocations, breakdowns, and dispatch swaps.';

-- 10.3 Driver Assignment History
CREATE TABLE logistics.driver_assignment_history (
    id                             UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    trip_id                        UUID         NOT NULL REFERENCES logistics.trips(id) ON DELETE CASCADE,
    original_driver_id             UUID         NOT NULL REFERENCES logistics.drivers(id) ON DELETE CASCADE,
    replacement_driver_id          UUID         REFERENCES logistics.drivers(id) ON DELETE SET NULL,
    assigned_at_utc                TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    completed_at_utc               TIMESTAMPTZ,
    replacement_reason             TEXT,
    supervisor_approved_by_user_id UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_driver_assign_dates CHECK (completed_at_utc IS NULL OR completed_at_utc >= assigned_at_utc)
);

COMMENT ON TABLE logistics.driver_assignment_history IS 
    '[HISTORY] Tracks driver route allocations and dispatch swaps.';

-- 10.4 GPS Tracking History (Telematics Registry)
CREATE TABLE logistics.gps_tracking_history (
    id                  UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    trip_id             UUID         NOT NULL REFERENCES logistics.trips(id) ON DELETE CASCADE,
    vehicle_id          UUID         NOT NULL REFERENCES logistics.vehicles(id) ON DELETE CASCADE,
    driver_id           UUID         NOT NULL REFERENCES logistics.drivers(id) ON DELETE CASCADE,
    
    latitude            NUMERIC(9,6) NOT NULL,
    longitude           NUMERIC(9,6) NOT NULL,
    recorded_at_utc     TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    speed_kmh           NUMERIC(5,2),
    heading_degrees     INT          CHECK (heading_degrees BETWEEN 0 AND 359),
    odometer_reading    NUMERIC(12,2),
    gps_accuracy_meters NUMERIC(5,2),

    CONSTRAINT chk_gps_lat CHECK (latitude >= -90.000000 AND latitude <= 90.000000),
    CONSTRAINT chk_gps_long CHECK (longitude >= -180.000000 AND longitude <= 180.000000),
    CONSTRAINT chk_gps_speed CHECK (speed_kmh IS NULL OR speed_kmh >= 0.00),
    CONSTRAINT chk_gps_odometer CHECK (odometer_reading IS NULL OR odometer_reading >= 0.00),
    CONSTRAINT chk_gps_accuracy CHECK (gps_accuracy_meters IS NULL OR gps_accuracy_meters >= 0.00)
);

COMMENT ON TABLE logistics.gps_tracking_history IS 
    '[HISTORY] Telematics data archiving speed, heading angles, coordinates, and accuracy metrics.';

-- 10.5 Driver Compliance Audit History
CREATE TABLE logistics.driver_compliance_history (
    id                     UUID         PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    driver_id              UUID         NOT NULL REFERENCES logistics.drivers(id) ON DELETE CASCADE,
    compliance_type        VARCHAR(50)  NOT NULL, -- LICENSE_RENEWAL, MEDICAL_RENEWAL, TRAINING_COMPLETED, CERTIFICATION_ISSUED, VIOLATION_RECORDED, SUSPENSION_RECORDED
    event_date             DATE         NOT NULL DEFAULT CURRENT_DATE,
    status                 VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, PENDING, BLOCKED
    notification_sent      BOOLEAN      NOT NULL DEFAULT FALSE,
    document_reference_hook VARCHAR(255),
    description            TEXT,

    -- Concurrency and Auditing
    row_version            INT          NOT NULL DEFAULT 1,
    created_at_utc         TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    created_by_user_id     UUID         REFERENCES iam.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_driver_compliance_type CHECK (compliance_type IN ('LICENSE_RENEWAL', 'MEDICAL_RENEWAL', 'TRAINING_COMPLETED', 'CERTIFICATION_ISSUED', 'VIOLATION_RECORDED', 'SUSPENSION_RECORDED')),
    CONSTRAINT chk_driver_compliance_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'PENDING', 'BLOCKED'))
);

COMMENT ON TABLE logistics.driver_compliance_history IS 
    '[HISTORY] Compliance registers monitoring licenses, medical approvals, safety violations, and blocks.';

-- =============================================================================
-- SECTION 11 — LOGISTICS KPI SNAPSHOTS
-- =============================================================================

CREATE TABLE logistics.logistics_kpis_snapshot (
    id                        UUID          PRIMARY KEY DEFAULT iam.uuid_generate_v7(),
    recorded_date             DATE          NOT NULL DEFAULT CURRENT_DATE,
    vehicle_id                UUID          NOT NULL REFERENCES logistics.vehicles(id) ON DELETE CASCADE,
    driver_id                 UUID          NOT NULL REFERENCES logistics.drivers(id) ON DELETE CASCADE,
    
    total_trips               INT           NOT NULL DEFAULT 0,
    total_distance_km         NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_fuel_liters         NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    avg_fuel_consumption      NUMERIC(6,2),
    
    on_time_delivery_pct      NUMERIC(5,2),
    delivery_failure_rate_pct NUMERIC(5,2),
    
    calculation_version       INT           NOT NULL DEFAULT 1,
    aggregation_period        VARCHAR(50)   NOT NULL DEFAULT 'DAILY', -- DAILY, WEEKLY, MONTHLY
    calculation_source        VARCHAR(100)  NOT NULL DEFAULT 'SYSTEM_BATCH',
    execution_timestamp       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    created_at_utc            TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT uq_logistics_kpi UNIQUE (recorded_date, vehicle_id, driver_id, calculation_version),
    CONSTRAINT chk_kpi_trips CHECK (total_trips >= 0),
    CONSTRAINT chk_kpi_distance CHECK (total_distance_km >= 0.00),
    CONSTRAINT chk_kpi_fuel CHECK (total_fuel_liters >= 0.00),
    CONSTRAINT chk_kpi_ontime CHECK (on_time_delivery_pct IS NULL OR (on_time_delivery_pct >= 0.00 AND on_time_delivery_pct <= 100.00)),
    CONSTRAINT chk_kpi_failure CHECK (delivery_failure_rate_pct IS NULL OR (delivery_failure_rate_pct >= 0.00 AND delivery_failure_rate_pct <= 100.00)),
    CONSTRAINT chk_kpi_calc_ver CHECK (calculation_version >= 1),
    CONSTRAINT chk_kpi_period CHECK (aggregation_period IN ('DAILY', 'WEEKLY', 'MONTHLY'))
);

COMMENT ON TABLE logistics.logistics_kpis_snapshot IS 
    '[HISTORY] Daily logs tracking fuel efficiency, on-time delivery rates, and failures.';

-- =============================================================================
-- SECTION 12 — INDEX STRATEGY (B-TREE FOREIGNS & COMPOSITE COVERING)
-- =============================================================================

-- 12.1 B-Tree Indexes on all Foreign Keys
CREATE INDEX idx_vehicle_type_fk               ON logistics.vehicles (vehicle_type_id);
CREATE INDEX idx_vehicle_category_fk           ON logistics.vehicles (vehicle_category_id);
CREATE INDEX idx_vehicle_fuel_fk               ON logistics.vehicles (fuel_type_id);
CREATE INDEX idx_vehicle_status_fk             ON logistics.vehicles (vehicle_status_id);

CREATE INDEX idx_driver_employee_fk            ON logistics.drivers (employee_id);
CREATE INDEX idx_driver_status_fk              ON logistics.drivers (driver_status_id);

CREATE INDEX idx_cert_driver_fk                ON logistics.driver_certifications (driver_id);

CREATE INDEX idx_route_status_fk               ON logistics.routes (route_status_id);

CREATE INDEX idx_route_ver_route_fk            ON logistics.route_versions (route_id);
CREATE INDEX idx_route_ver_planner_fk          ON logistics.route_versions (planner_employee_id);

CREATE INDEX idx_stop_route_fk                 ON logistics.route_stops (route_id);
CREATE INDEX idx_stop_site_fk                  ON logistics.route_stops (customer_site_id);

CREATE INDEX idx_trip_route_fk                 ON logistics.trips (route_id);
CREATE INDEX idx_trip_route_ver_fk             ON logistics.trips (route_version_id);
CREATE INDEX idx_trip_vehicle_fk               ON logistics.trips (vehicle_id);
CREATE INDEX idx_trip_driver_fk                ON logistics.trips (driver_id);
CREATE INDEX idx_trip_status_fk                ON logistics.trips (trip_status_id);

CREATE INDEX idx_tstop_trip_fk                 ON logistics.trip_stops (trip_id);
CREATE INDEX idx_tstop_site_fk                 ON logistics.trip_stops (customer_site_id);

CREATE INDEX idx_deliv_stop_fk                 ON logistics.delivery_tasks (trip_stop_id);
CREATE INDEX idx_deliv_order_fk                ON logistics.delivery_tasks (sales_order_id);
CREATE INDEX idx_deliv_status_fk               ON logistics.delivery_tasks (delivery_status_id);

CREATE INDEX idx_attempt_task_fk               ON logistics.delivery_attempts (delivery_task_id);
CREATE INDEX idx_attempt_status_fk             ON logistics.delivery_attempts (outcome_status_id);
CREATE INDEX idx_attempt_reason_fk             ON logistics.delivery_attempts (failure_reason_id);

CREATE INDEX idx_deliv_excep_task_fk           ON logistics.delivery_exception_registry (delivery_task_id);
CREATE INDEX idx_deliv_excep_owner_fk          ON logistics.delivery_exception_registry (owner_employee_id);

CREATE INDEX idx_pod_task_fk                   ON logistics.proof_of_delivery (delivery_task_id);
CREATE INDEX idx_pod_verifier_fk               ON logistics.proof_of_delivery (verified_by_employee_id);

CREATE INDEX idx_deliv_sla_task_fk             ON logistics.delivery_sla_monitoring (delivery_task_id);

CREATE INDEX idx_reverse_stop_fk               ON logistics.reverse_logistics_tasks (trip_stop_id);
CREATE INDEX idx_reverse_return_fk             ON logistics.reverse_logistics_tasks (sales_return_id);
CREATE INDEX idx_reverse_reason_fk             ON logistics.reverse_logistics_tasks (reverse_reason_id);

CREATE INDEX idx_maint_vehicle_fk              ON logistics.maintenance_schedules (vehicle_id);
CREATE INDEX INDEX idx_maint_status_fk         ON logistics.maintenance_schedules (status_id);

CREATE INDEX idx_fuel_vehicle_fk               ON logistics.fuel_logs (vehicle_id);
CREATE INDEX idx_fuel_trip_fk                  ON logistics.fuel_logs (trip_id);

CREATE INDEX idx_break_vehicle_fk              ON logistics.breakdown_events (vehicle_id);
CREATE INDEX idx_break_trip_fk                 ON logistics.breakdown_events (trip_id);

CREATE INDEX idx_timeline_trip_fk              ON logistics.trip_event_timeline (trip_id);
CREATE INDEX idx_timeline_employee_fk          ON logistics.trip_event_timeline (employee_id);

CREATE INDEX idx_veh_assign_trip_fk            ON logistics.vehicle_assignment_history (trip_id);
CREATE INDEX idx_veh_assign_orig_fk            ON logistics.vehicle_assignment_history (original_vehicle_id);
CREATE INDEX idx_veh_assign_rep_fk             ON logistics.vehicle_assignment_history (replacement_vehicle_id);
CREATE INDEX idx_veh_assign_user_fk            ON logistics.vehicle_assignment_history (approved_by_user_id);

CREATE INDEX idx_driver_assign_trip_fk          ON logistics.driver_assignment_history (trip_id);
CREATE INDEX idx_driver_assign_orig_fk          ON logistics.driver_assignment_history (original_driver_id);
CREATE INDEX idx_driver_assign_rep_fk           ON logistics.driver_assignment_history (replacement_driver_id);
CREATE INDEX idx_driver_assign_user_fk          ON logistics.driver_assignment_history (supervisor_approved_by_user_id);

CREATE INDEX idx_gps_trip_fk                   ON logistics.gps_tracking_history (trip_id);
CREATE INDEX idx_gps_vehicle_fk                ON logistics.gps_tracking_history (vehicle_id);
CREATE INDEX idx_gps_driver_fk                 ON logistics.gps_tracking_history (driver_id);

CREATE INDEX idx_compliance_driver_fk          ON logistics.driver_compliance_history (driver_id);
CREATE INDEX idx_compliance_user_fk            ON logistics.driver_compliance_history (created_by_user_id);

CREATE INDEX idx_kpi_vehicle_fk                ON logistics.logistics_kpis_snapshot (vehicle_id);
CREATE INDEX idx_kpi_driver_fk                 ON logistics.logistics_kpis_snapshot (driver_id);

-- 12.2 Composite Indexes (Covering filter queries)
CREATE INDEX idx_trips_scheduling_comp         ON logistics.trips (trip_status_id, scheduled_start_time);
CREATE INDEX idx_route_stop_sequence_comp      ON logistics.route_stops (route_id, stop_sequence);
CREATE INDEX idx_trip_stop_execution_comp      ON logistics.trip_stops (trip_id, stop_sequence, arrival_status);

-- 12.3 Partial Indexes (Optimizing active/hot records)
CREATE INDEX idx_vehicles_available            ON logistics.vehicles (id) WHERE vehicle_status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80e2'; -- references AVAILABLE ID
CREATE INDEX idx_drivers_available             ON logistics.drivers (id) WHERE driver_status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80e3'; -- references AVAILABLE ID
CREATE INDEX idx_deliv_active_tasks            ON logistics.delivery_tasks (id) WHERE delivery_status_id = 'c1251910-1849-43c2-bf72-4d2cf99a80e4'; -- references EN_ROUTE ID
CREATE INDEX idx_reverse_pending               ON logistics.reverse_logistics_tasks (id) WHERE status = 'PENDING';
CREATE INDEX idx_maintenance_due               ON logistics.maintenance_schedules (vehicle_id) WHERE completed_date IS NULL;
CREATE INDEX idx_breakdowns_unresolved         ON logistics.breakdown_events (vehicle_id) WHERE resolved_at_utc IS NULL;
CREATE INDEX idx_gps_recent_pings              ON logistics.gps_tracking_history (recorded_at_utc) WHERE recorded_at_utc >= CURRENT_DATE - INTERVAL '1 day';
CREATE INDEX idx_sla_breached_trips            ON logistics.delivery_sla_monitoring (delivery_task_id) WHERE is_breached = TRUE;
CREATE INDEX idx_exceptions_active             ON logistics.delivery_exception_registry (delivery_task_id) WHERE resolved_at_utc IS NULL;
