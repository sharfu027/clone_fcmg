DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'procurement') THEN
        CREATE SCHEMA procurement;
    END IF;
END $EF$;

CREATE TABLE IF NOT EXISTS procurement.rfqs (
    "Id" uuid NOT NULL,
    "CompanyId" uuid NOT NULL,
    "RfqNumber" character varying(50) NOT NULL,
    "PurchaseRequisitionId" uuid NOT NULL,
    "PurchaseRequisitionNumber" text NOT NULL,
    "RfqDate" timestamp with time zone NOT NULL,
    "ResponseDueDate" timestamp with time zone NOT NULL,
    "DepartmentId" uuid,
    "DepartmentName" text,
    "RequestedByUserId" text NOT NULL,
    "RequestedByName" text NOT NULL,
    "BuyerUserId" text,
    "BuyerName" text,
    "CurrencyCode" text NOT NULL,
    "Status" integer NOT NULL,
    "Notes" text,
    "CancelReason" text,
    "CloseReason" text,
    "SubmittedAtUtc" timestamp with time zone,
    "SentAtUtc" timestamp with time zone,
    "ClosedAtUtc" timestamp with time zone,
    "CancelledAtUtc" timestamp with time zone,
    "CreatedAtUtc" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "LastModifiedAtUtc" timestamp with time zone,
    "LastModifiedBy" text,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "DeletedAtUtc" timestamp with time zone,
    "DeletedBy" text,
    "ConcurrencyToken" text NOT NULL DEFAULT '',
    CONSTRAINT "PK_rfqs" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS procurement.rfq_items (
    "Id" uuid NOT NULL,
    "RfqId" uuid NOT NULL,
    "ProductId" uuid NOT NULL,
    "ProductCode" text NOT NULL,
    "ProductName" text NOT NULL,
    "Uom" text NOT NULL,
    "RequestedQuantity" numeric(18,4) NOT NULL,
    "RequiredByDate" timestamp with time zone,
    "Notes" text,
    "CreatedAtUtc" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "LastModifiedAtUtc" timestamp with time zone,
    "LastModifiedBy" text,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "DeletedAtUtc" timestamp with time zone,
    "DeletedBy" text,
    "ConcurrencyToken" text NOT NULL DEFAULT '',
    CONSTRAINT "PK_rfq_items" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_rfq_items_rfqs_RfqId" FOREIGN KEY ("RfqId") REFERENCES procurement.rfqs ("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS procurement.rfq_suppliers (
    "Id" uuid NOT NULL,
    "RfqId" uuid NOT NULL,
    "SupplierId" uuid NOT NULL,
    "SupplierCode" text NOT NULL,
    "SupplierName" text NOT NULL,
    "ContactPerson" text,
    "Email" text,
    "Phone" text,
    "DeliveryStatus" integer NOT NULL,
    "SentAtUtc" timestamp with time zone,
    "CreatedAtUtc" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "LastModifiedAtUtc" timestamp with time zone,
    "LastModifiedBy" text,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "DeletedAtUtc" timestamp with time zone,
    "DeletedBy" text,
    "ConcurrencyToken" text NOT NULL DEFAULT '',
    CONSTRAINT "PK_rfq_suppliers" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_rfq_suppliers_rfqs_RfqId" FOREIGN KEY ("RfqId") REFERENCES procurement.rfqs ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_rfqs_CompanyId_RfqNumber" ON procurement.rfqs ("CompanyId", "RfqNumber");
CREATE INDEX IF NOT EXISTS "IX_rfqs_CompanyId_Status" ON procurement.rfqs ("CompanyId", "Status");
CREATE INDEX IF NOT EXISTS "IX_rfqs_PurchaseRequisitionId" ON procurement.rfqs ("PurchaseRequisitionId");
CREATE INDEX IF NOT EXISTS "IX_rfq_items_RfqId" ON procurement.rfq_items ("RfqId");
CREATE INDEX IF NOT EXISTS "IX_rfq_items_ProductId" ON procurement.rfq_items ("ProductId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_rfq_suppliers_RfqId_SupplierId" ON procurement.rfq_suppliers ("RfqId", "SupplierId");

INSERT INTO iam."__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260811130414_AddRfqModule', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;
