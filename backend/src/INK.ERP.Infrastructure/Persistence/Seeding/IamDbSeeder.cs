using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Seeding;

public static class IamDbSeeder
{
    public static async Task SeedAsync(AppDbContext context, UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager, ILogger logger)
    {
        logger.LogInformation("Starting IAM Database Seeding...");

        // 0. Ensure security_audit_logs columns exist in PostgreSQL
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""UserId"" uuid NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""Username"" character varying(100) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""EmployeeId"" character varying(100) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""EventType"" character varying(100) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""Module"" character varying(100) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""Description"" character varying(1000) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""Success"" boolean NOT NULL DEFAULT TRUE;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""FailureReason"" character varying(1000) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""Device"" character varying(250) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""Browser"" character varying(250) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""OperatingSystem"" character varying(250) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""Location"" character varying(250) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""Endpoint"" character varying(250) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""HttpMethod"" character varying(20) NULL;
                ALTER TABLE iam.security_audit_logs ADD COLUMN IF NOT EXISTS ""ProcessingTimeMs"" bigint NULL;
            ");
            logger.LogInformation("Updated PostgreSQL table iam.security_audit_logs schema.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Column migration for security_audit_logs skipped or handled.");
        }

        // 0.4. Ensure procurement.purchase_requisition_items columns exist in PostgreSQL
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE SCHEMA IF NOT EXISTS procurement;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW();

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""CreatedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""LastModifiedAtUtc"" timestamp with time zone NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""ModifiedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""LastModifiedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""DeletedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""DeletedAtUtc"" timestamp with time zone NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW();

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""CreatedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""LastModifiedAtUtc"" timestamp with time zone NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""ModifiedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""LastModifiedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""DeletedBy"" character varying(100) NULL;

                CREATE SCHEMA IF NOT EXISTS warehouse;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW();

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""CreatedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""LastModifiedAtUtc"" timestamp with time zone NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""ModifiedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""LastModifiedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""DeletedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""DeletedAtUtc"" timestamp with time zone NULL;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;

                ALTER TABLE procurement.purchase_requisition_items 
                ADD COLUMN IF NOT EXISTS ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW();

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""CreatedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""LastModifiedAtUtc"" timestamp with time zone NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""ModifiedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""LastModifiedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""DeletedBy"" character varying(100) NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""DeletedAtUtc"" timestamp with time zone NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;

                ALTER TABLE warehouse.warehouses ADD COLUMN IF NOT EXISTS ""Status"" character varying(30) NOT NULL DEFAULT 'Active';
                ALTER TABLE warehouse.warehouses ADD COLUMN IF NOT EXISTS ""PalletCapacity"" integer NULL;
                ALTER TABLE warehouse.warehouses ADD COLUMN IF NOT EXISTS ""CartonCapacity"" integer NULL;
                ALTER TABLE warehouse.warehouses ADD COLUMN IF NOT EXISTS ""ContactNumber"" character varying(30) NULL;
                ALTER TABLE warehouse.warehouses ADD COLUMN IF NOT EXISTS ""Email"" character varying(100) NULL;
                ALTER TABLE warehouse.warehouses ADD COLUMN IF NOT EXISTS ""Latitude"" double precision NULL;
                ALTER TABLE warehouse.warehouses ADD COLUMN IF NOT EXISTS ""Longitude"" double precision NULL;
                ALTER TABLE warehouse.warehouses ADD COLUMN IF NOT EXISTS ""Remarks"" character varying(500) NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text;

                ALTER TABLE iam.face_profiles ADD COLUMN IF NOT EXISTS ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text;
                ALTER TABLE iam.face_profiles ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;
                ALTER TABLE iam.face_profiles ADD COLUMN IF NOT EXISTS ""IsActive"" boolean NOT NULL DEFAULT TRUE;

                ALTER TABLE iam.face_templates ADD COLUMN IF NOT EXISTS ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text;
                ALTER TABLE iam.face_templates ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;
                ALTER TABLE iam.face_templates ADD COLUMN IF NOT EXISTS ""IsActive"" boolean NOT NULL DEFAULT TRUE;

                UPDATE procurement.purchase_requisitions SET ""ConcurrencyToken"" = gen_random_uuid()::text WHERE ""ConcurrencyToken"" IS NULL OR ""ConcurrencyToken"" = '';
                UPDATE procurement.purchase_requisition_items SET ""ConcurrencyToken"" = gen_random_uuid()::text WHERE ""ConcurrencyToken"" IS NULL OR ""ConcurrencyToken"" = '';
                UPDATE procurement.purchase_requisition_status_histories SET ""ConcurrencyToken"" = gen_random_uuid()::text WHERE ""ConcurrencyToken"" IS NULL OR ""ConcurrencyToken"" = '';
                UPDATE iam.face_profiles SET ""ConcurrencyToken"" = gen_random_uuid()::text WHERE ""ConcurrencyToken"" IS NULL OR ""ConcurrencyToken"" = '';
                UPDATE iam.face_templates SET ""ConcurrencyToken"" = gen_random_uuid()::text WHERE ""ConcurrencyToken"" IS NULL OR ""ConcurrencyToken"" = '';
            ");
            logger.LogInformation("Ensured PostgreSQL procurement & IAM face security schema columns exist.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Column migration for procurement.purchase_requisition_items skipped or handled.");
        }

        // 0.5. Ensure pricing.customer_prices table exists in PostgreSQL
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE SCHEMA IF NOT EXISTS pricing;

                CREATE TABLE IF NOT EXISTS pricing.customer_prices (
                    ""Id"" uuid NOT NULL,
                    ""CompanyId"" uuid NOT NULL,
                    ""CustomerId"" uuid NOT NULL,
                    ""PriceListId"" uuid NOT NULL,
                    ""ProductId"" uuid NOT NULL,
                    ""BasePrice"" numeric(18,2) NOT NULL,
                    ""CustomerPriceValue"" numeric(18,2) NOT NULL,
                    ""MinAllowedPrice"" numeric(18,2) NOT NULL,
                    ""CurrencyCode"" character varying(10) NOT NULL DEFAULT 'INR',
                    ""EffectiveFrom"" timestamp with time zone NOT NULL,
                    ""EffectiveTo"" timestamp with time zone NULL,
                    ""Status"" integer NOT NULL DEFAULT 0,
                    ""IsActive"" boolean NOT NULL DEFAULT FALSE,
                    ""ActivatedBy"" character varying(100) NULL,
                    ""ActivatedAtUtc"" timestamp with time zone NULL,
                    ""DeactivatedBy"" character varying(100) NULL,
                    ""DeactivatedAtUtc"" timestamp with time zone NULL,
                    ""ArchivedBy"" character varying(100) NULL,
                    ""ArchivedAtUtc"" timestamp with time zone NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL,
                    ""CreatedBy"" character varying(100) NULL,
                    ""ModifiedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""IsDeleted"" boolean NOT NULL DEFAULT FALSE,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    CONSTRAINT ""PK_customer_prices"" PRIMARY KEY (""Id"")
                );

                ALTER TABLE pricing.customer_prices ADD COLUMN IF NOT EXISTS ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text;
                ALTER TABLE pricing.customer_prices ADD COLUMN IF NOT EXISTS ""ModifiedBy"" character varying(100) NULL;

                CREATE INDEX IF NOT EXISTS ""IX_customer_prices_CompanyId_CustomerId_ProductId_Status"" 
                ON pricing.customer_prices (""CompanyId"", ""CustomerId"", ""ProductId"", ""Status"");
            ");
            logger.LogInformation("Ensured PostgreSQL table pricing.customer_prices exists.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Table creation for pricing.customer_prices skipped or handled.");
        }

        try
        {
            context.Database.ExecuteSqlRaw(@"
                CREATE SCHEMA IF NOT EXISTS pricing;

                CREATE TABLE IF NOT EXISTS pricing.discount_rules (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""CompanyId"" uuid NOT NULL,
                    ""RuleCode"" character varying(50) NOT NULL,
                    ""RuleName"" character varying(200) NOT NULL,
                    ""Description"" character varying(1000) NULL,
                    ""DiscountMethod"" integer NOT NULL DEFAULT 0,
                    ""DiscountValue"" numeric(18,2) NOT NULL,
                    ""Scope"" integer NOT NULL DEFAULT 6,
                    ""CustomerId"" uuid NULL,
                    ""ProductId"" uuid NULL,
                    ""CategoryId"" uuid NULL,
                    ""PriceListId"" uuid NULL,
                    ""MinimumQuantity"" integer NULL,
                    ""MaximumQuantity"" integer NULL,
                    ""MaximumDiscountAmount"" numeric(18,2) NULL,
                    ""EffectiveFrom"" timestamp with time zone NOT NULL,
                    ""EffectiveTo"" timestamp with time zone NULL,
                    ""Priority"" integer NOT NULL DEFAULT 1,
                    ""Status"" integer NOT NULL DEFAULT 0,
                    ""IsActive"" boolean NOT NULL DEFAULT false,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL,
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""ActivatedBy"" character varying(100) NULL,
                    ""ActivatedAtUtc"" timestamp with time zone NULL,
                    ""DeactivatedBy"" character varying(100) NULL,
                    ""DeactivatedAtUtc"" timestamp with time zone NULL,
                    ""ArchivedBy"" character varying(100) NULL,
                    ""ArchivedAtUtc"" timestamp with time zone NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE INDEX IF NOT EXISTS ""IX_discount_rules_CompanyId_Scope_Status"" 
                ON pricing.discount_rules (""CompanyId"", ""Scope"", ""Status"");
            ");
            logger.LogInformation("Ensured PostgreSQL table pricing.discount_rules exists.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Table creation for pricing.discount_rules skipped or handled.");
        }

        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE SCHEMA IF NOT EXISTS pricing;

                CREATE TABLE IF NOT EXISTS pricing.currencies (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""Code"" character varying(10) NOT NULL,
                    ""Name"" character varying(100) NOT NULL,
                    ""Symbol"" character varying(10) NOT NULL,
                    ""DecimalPlaces"" integer NOT NULL DEFAULT 2,
                    ""IsBaseCurrency"" boolean NOT NULL DEFAULT false,
                    ""Status"" integer NOT NULL DEFAULT 0,
                    ""IsActive"" boolean NOT NULL DEFAULT true,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL,
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""ActivatedBy"" character varying(100) NULL,
                    ""ActivatedAtUtc"" timestamp with time zone NULL,
                    ""DeactivatedBy"" character varying(100) NULL,
                    ""DeactivatedAtUtc"" timestamp with time zone NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_currencies_Code"" ON pricing.currencies (""Code"") WHERE ""IsDeleted"" = false;

                CREATE TABLE IF NOT EXISTS pricing.exchange_rates (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""FromCurrencyCode"" character varying(10) NOT NULL,
                    ""ToCurrencyCode"" character varying(10) NOT NULL,
                    ""Rate"" numeric(18,8) NOT NULL,
                    ""EffectiveFrom"" timestamp with time zone NOT NULL,
                    ""EffectiveTo"" timestamp with time zone NULL,
                    ""Status"" integer NOT NULL DEFAULT 1,
                    ""Source"" integer NOT NULL DEFAULT 0,
                    ""IsActive"" boolean NOT NULL DEFAULT true,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL,
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""ActivatedBy"" character varying(100) NULL,
                    ""ActivatedAtUtc"" timestamp with time zone NULL,
                    ""ArchivedBy"" character varying(100) NULL,
                    ""ArchivedAtUtc"" timestamp with time zone NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE INDEX IF NOT EXISTS ""IX_exchange_rates_From_To_EffectiveFrom"" ON pricing.exchange_rates (""FromCurrencyCode"", ""ToCurrencyCode"", ""EffectiveFrom"");
            ");

            await context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO pricing.currencies (""Id"", ""Code"", ""Name"", ""Symbol"", ""DecimalPlaces"", ""IsBaseCurrency"", ""Status"", ""IsActive"", ""CreatedAtUtc"", ""CreatedBy"", ""IsDeleted"")
                VALUES 
                    (gen_random_uuid(), 'INR', 'Indian Rupee', '₹', 2, true, 0, true, NOW(), 'System', false),
                    (gen_random_uuid(), 'USD', 'US Dollar', '$', 2, false, 0, true, NOW(), 'System', false),
                    (gen_random_uuid(), 'EUR', 'Euro', '€', 2, false, 0, true, NOW(), 'System', false),
                    (gen_random_uuid(), 'AED', 'UAE Dirham', 'AED', 2, false, 0, true, NOW(), 'System', false)
                ON CONFLICT (""Code"") WHERE (""IsDeleted"" = false) DO NOTHING;

                INSERT INTO pricing.exchange_rates (""Id"", ""FromCurrencyCode"", ""ToCurrencyCode"", ""Rate"", ""EffectiveFrom"", ""Status"", ""Source"", ""IsActive"", ""CreatedAtUtc"", ""CreatedBy"", ""IsDeleted"")
                SELECT gen_random_uuid(), 'USD', 'INR', 86.50000000, NOW(), 1, 0, true, NOW(), 'System', false
                WHERE NOT EXISTS (SELECT 1 FROM pricing.exchange_rates WHERE ""FromCurrencyCode"" = 'USD' AND ""ToCurrencyCode"" = 'INR');

                INSERT INTO pricing.exchange_rates (""Id"", ""FromCurrencyCode"", ""ToCurrencyCode"", ""Rate"", ""EffectiveFrom"", ""Status"", ""Source"", ""IsActive"", ""CreatedAtUtc"", ""CreatedBy"", ""IsDeleted"")
                SELECT gen_random_uuid(), 'EUR', 'INR', 92.10000000, NOW(), 1, 0, true, NOW(), 'System', false
                WHERE NOT EXISTS (SELECT 1 FROM pricing.exchange_rates WHERE ""FromCurrencyCode"" = 'EUR' AND ""ToCurrencyCode"" = 'INR');

                INSERT INTO pricing.exchange_rates (""Id"", ""FromCurrencyCode"", ""ToCurrencyCode"", ""Rate"", ""EffectiveFrom"", ""Status"", ""Source"", ""IsActive"", ""CreatedAtUtc"", ""CreatedBy"", ""IsDeleted"")
                SELECT gen_random_uuid(), 'AED', 'INR', 23.55000000, NOW(), 1, 0, true, NOW(), 'System', false
                WHERE NOT EXISTS (SELECT 1 FROM pricing.exchange_rates WHERE ""FromCurrencyCode"" = 'AED' AND ""ToCurrencyCode"" = 'INR');
            ");
            logger.LogInformation("Ensured PostgreSQL tables pricing.currencies and pricing.exchange_rates exist and seeded default values.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Table creation or seeding for pricing.currencies / pricing.exchange_rates skipped or handled.");
        }

        // 0.8. Ensure PostgreSQL inventory and fulfillment tables exist
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE SCHEMA IF NOT EXISTS inventory;

                CREATE TABLE IF NOT EXISTS inventory.inventory_locations (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""CompanyId"" uuid NOT NULL,
                    ""WarehouseId"" uuid NULL,
                    ""BranchId"" uuid NULL,
                    ""DepartmentId"" uuid NULL,
                    ""Code"" character varying(50) NOT NULL,
                    ""Name"" character varying(100) NOT NULL,
                    ""LocationType"" character varying(30) NOT NULL DEFAULT 'Storage',
                    ""Aisle"" character varying(20) NULL,
                    ""Rack"" character varying(20) NULL,
                    ""Shelf"" character varying(20) NULL,
                    ""Bin"" character varying(20) NULL,
                    ""CapacityVolume"" numeric(18,4) NULL,
                    ""CapacityWeight"" numeric(18,4) NULL,
                    ""IsActive"" boolean NOT NULL DEFAULT true,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL
                );

                CREATE TABLE IF NOT EXISTS inventory.inventory_balances (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""CompanyId"" uuid NOT NULL,
                    ""InventoryLocationId"" uuid NOT NULL,
                    ""ProductId"" uuid NOT NULL,
                    ""BatchNumber"" character varying(100) NULL,
                    ""ExpiryDate"" date NULL,
                    ""OnHandQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""AllocatedQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""AvailableQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""ReservedQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""LastMovementAtUtc"" timestamp with time zone NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL
                );

                ALTER TABLE inventory.inventory_balances ADD COLUMN IF NOT EXISTS ""BatchNumber"" character varying(100) NULL;
                ALTER TABLE inventory.inventory_balances ADD COLUMN IF NOT EXISTS ""ExpiryDate"" date NULL;

                DO $$
                DECLARE
                    idx RECORD;
                BEGIN
                    FOR idx IN (
                        SELECT indexname 
                        FROM pg_indexes 
                        WHERE schemaname = 'inventory' 
                          AND tablename = 'inventory_balances' 
                          AND indexname NOT IN ('inventory_balances_pkey', 'IX_inventory_balances_non_batch', 'IX_inventory_balances_batch')
                          AND indexdef LIKE '%UNIQUE%'
                    ) LOOP
                        EXECUTE 'DROP INDEX IF EXISTS inventory.' || quote_ident(idx.indexname);
                    END LOOP;
                END $$;

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_inventory_balances_non_batch""
                ON inventory.inventory_balances (""CompanyId"", ""InventoryLocationId"", ""ProductId"")
                WHERE ""BatchNumber"" IS NULL;

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_inventory_balances_batch""
                ON inventory.inventory_balances (""CompanyId"", ""InventoryLocationId"", ""ProductId"", ""BatchNumber"")
                WHERE ""BatchNumber"" IS NOT NULL;

                ALTER TABLE inventory.inventory_balances ADD COLUMN IF NOT EXISTS ""MinStockQuantity"" numeric(18,4) NOT NULL DEFAULT 0;

                CREATE TABLE IF NOT EXISTS inventory.inventory_stock_policies (
                    ""Id"" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                    ""CompanyId"" uuid NOT NULL,
                    ""InventoryLocationId"" uuid NOT NULL,
                    ""ProductId"" uuid NOT NULL,
                    ""MinStockQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""ReorderPoint"" numeric(18,4) NULL,
                    ""ReorderQuantity"" numeric(18,4) NULL,
                    ""IsActive"" boolean NOT NULL DEFAULT TRUE,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_inventory_stock_policies_unique""
                ON inventory.inventory_stock_policies (""CompanyId"", ""InventoryLocationId"", ""ProductId"");

                CREATE TABLE IF NOT EXISTS inventory.stock_transfers (
                    ""Id"" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                    ""CompanyId"" uuid NOT NULL,
                    ""TransferNumber"" character varying(50) NOT NULL,
                    ""SourceLocationId"" uuid NOT NULL,
                    ""DestinationLocationId"" uuid NOT NULL,
                    ""SalesOrderId"" uuid NULL,
                    ""Status"" character varying(30) NOT NULL DEFAULT 'Requested',
                    ""RequestedByEmployeeId"" uuid NOT NULL,
                    ""ApprovedByEmployeeId"" uuid NULL,
                    ""DispatchedAtUtc"" timestamp with time zone NULL,
                    ""ReceivedAtUtc"" timestamp with time zone NULL,
                    ""Notes"" character varying(1000) NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL
                );

                CREATE TABLE IF NOT EXISTS inventory.stock_transfer_lines (
                    ""Id"" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                    ""StockTransferId"" uuid NOT NULL,
                    ""ProductId"" uuid NOT NULL,
                    ""RequestedQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""ApprovedQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""DispatchedQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""ReceivedQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL
                );

                CREATE TABLE IF NOT EXISTS inventory.inventory_transactions (
                    ""Id"" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                    ""CompanyId"" uuid NOT NULL,
                    ""InventoryLocationId"" uuid NOT NULL,
                    ""ProductId"" uuid NOT NULL,
                    ""TransactionType"" character varying(50) NOT NULL,
                    ""Quantity"" numeric(18,4) NOT NULL,
                    ""BalanceAfter"" numeric(18,4) NOT NULL,
                    ""ReferenceDocumentType"" character varying(50) NULL,
                    ""ReferenceDocumentId"" uuid NULL,
                    ""ReferenceDocumentNumber"" character varying(100) NULL,
                    ""BatchNumber"" character varying(100) NULL,
                    ""ExpiryDate"" date NULL,
                    ""PerformedByEmployeeId"" uuid NULL,
                    ""Notes"" character varying(500) NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL
                );

                ALTER TABLE inventory.inventory_transactions ADD COLUMN IF NOT EXISTS ""BatchNumber"" character varying(100) NULL;
                ALTER TABLE inventory.inventory_transactions ADD COLUMN IF NOT EXISTS ""ExpiryDate"" date NULL;

                CREATE TABLE IF NOT EXISTS inventory.inventory_reservations (
                    ""Id"" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                    ""CompanyId"" uuid NOT NULL,
                    ""SalesOrderId"" uuid NULL,
                    ""SalesOrderLineId"" uuid NULL,
                    ""InventoryLocationId"" uuid NOT NULL,
                    ""ProductId"" uuid NOT NULL,
                    ""ReservedQuantity"" numeric(18,4) NOT NULL,
                    ""Status"" character varying(30) NOT NULL DEFAULT 'Active',
                    ""ReservedAtUtc"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ""ReleasedAtUtc"" timestamp with time zone NULL,
                    ""ExpiresAtUtc"" timestamp with time zone NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL
                );

                ALTER TABLE inventory.inventory_reservations ADD COLUMN IF NOT EXISTS ""BatchNumber"" character varying(100) NULL;

                CREATE TABLE IF NOT EXISTS inventory.pick_tasks (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""CompanyId"" uuid NOT NULL,
                    ""SalesOrderId"" uuid NOT NULL,
                    ""InventoryLocationId"" uuid NOT NULL,
                    ""PickTaskNumber"" character varying(50) NOT NULL,
                    ""AssignedEmployeeId"" uuid NULL,
                    ""Status"" character varying(30) NOT NULL DEFAULT 'Pending',
                    ""StartedAtUtc"" timestamp with time zone NULL,
                    ""CompletedAtUtc"" timestamp with time zone NULL,
                    ""Notes"" character varying(1000) NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NOT NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_pick_tasks_CompanyId_PickTaskNumber"" ON inventory.pick_tasks (""CompanyId"", ""PickTaskNumber"");
                CREATE INDEX IF NOT EXISTS ""IX_pick_tasks_CompanyId_SalesOrderId"" ON inventory.pick_tasks (""CompanyId"", ""SalesOrderId"");
                CREATE INDEX IF NOT EXISTS ""IX_pick_tasks_CompanyId_InventoryLocationId"" ON inventory.pick_tasks (""CompanyId"", ""InventoryLocationId"");
                CREATE INDEX IF NOT EXISTS ""IX_pick_tasks_CompanyId_Status"" ON inventory.pick_tasks (""CompanyId"", ""Status"");

                CREATE TABLE IF NOT EXISTS inventory.pick_task_lines (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""PickTaskId"" uuid NOT NULL REFERENCES inventory.pick_tasks(""Id"") ON DELETE CASCADE,
                    ""SalesOrderLineId"" uuid NOT NULL,
                    ""ProductId"" uuid NOT NULL,
                    ""RequestedQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""AllocatedQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""PickedQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""ShortQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""Status"" character varying(30) NOT NULL DEFAULT 'Pending',
                    ""BatchNumber"" character varying(100) NULL,
                    ""ExpiryDate"" timestamp with time zone NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE INDEX IF NOT EXISTS ""IX_pick_task_lines_PickTaskId"" ON inventory.pick_task_lines (""PickTaskId"");
                CREATE INDEX IF NOT EXISTS ""IX_pick_task_lines_ProductId"" ON inventory.pick_task_lines (""ProductId"");

                CREATE TABLE IF NOT EXISTS inventory.pack_tasks (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""CompanyId"" uuid NOT NULL,
                    ""SalesOrderId"" uuid NOT NULL,
                    ""PickTaskId"" uuid NOT NULL,
                    ""PackTaskNumber"" character varying(50) NOT NULL,
                    ""AssignedEmployeeId"" uuid NULL,
                    ""Status"" character varying(30) NOT NULL DEFAULT 'Pending',
                    ""TotalPackagesCount"" integer NOT NULL DEFAULT 0,
                    ""StartedAtUtc"" timestamp with time zone NULL,
                    ""CompletedAtUtc"" timestamp with time zone NULL,
                    ""Notes"" character varying(1000) NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NOT NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_pack_tasks_CompanyId_PackTaskNumber"" ON inventory.pack_tasks (""CompanyId"", ""PackTaskNumber"");
                CREATE INDEX IF NOT EXISTS ""IX_pack_tasks_CompanyId_SalesOrderId"" ON inventory.pack_tasks (""CompanyId"", ""SalesOrderId"");
                CREATE INDEX IF NOT EXISTS ""IX_pack_tasks_CompanyId_PickTaskId"" ON inventory.pack_tasks (""CompanyId"", ""PickTaskId"");
                CREATE INDEX IF NOT EXISTS ""IX_pack_tasks_CompanyId_Status"" ON inventory.pack_tasks (""CompanyId"", ""Status"");

                CREATE TABLE IF NOT EXISTS inventory.packages (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""PackTaskId"" uuid NOT NULL REFERENCES inventory.pack_tasks(""Id"") ON DELETE CASCADE,
                    ""PackageNumber"" character varying(50) NOT NULL,
                    ""PackageType"" character varying(50) NOT NULL DEFAULT 'Carton',
                    ""GrossWeightKg"" numeric(18,2) NULL,
                    ""Length"" numeric(18,2) NULL,
                    ""Width"" numeric(18,2) NULL,
                    ""Height"" numeric(18,2) NULL,
                    ""SealNumber"" character varying(100) NULL,
                    ""Barcode"" character varying(100) NULL,
                    ""PackedByEmployeeId"" uuid NULL,
                    ""PackedAtUtc"" timestamp with time zone NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE INDEX IF NOT EXISTS ""IX_packages_PackTaskId"" ON inventory.packages (""PackTaskId"");

                CREATE TABLE IF NOT EXISTS inventory.package_items (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""PackageId"" uuid NOT NULL REFERENCES inventory.packages(""Id"") ON DELETE CASCADE,
                    ""ProductId"" uuid NOT NULL,
                    ""PackedQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""BatchNumber"" character varying(100) NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE INDEX IF NOT EXISTS ""IX_package_items_PackageId"" ON inventory.package_items (""PackageId"");
                CREATE INDEX IF NOT EXISTS ""IX_package_items_ProductId"" ON inventory.package_items (""ProductId"");

                CREATE TABLE IF NOT EXISTS inventory.dispatches (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""CompanyId"" uuid NOT NULL,
                    ""SalesOrderId"" uuid NOT NULL,
                    ""PackTaskId"" uuid NULL,
                    ""DispatchNumber"" character varying(50) NOT NULL,
                    ""DispatchStatus"" character varying(30) NOT NULL DEFAULT 'Draft',
                    ""VehicleNumber"" character varying(50) NULL,
                    ""DriverName"" character varying(100) NULL,
                    ""DriverPhone"" character varying(30) NULL,
                    ""TransporterName"" character varying(100) NULL,
                    ""WaybillNumber"" character varying(100) NULL,
                    ""DispatchedAtUtc"" timestamp with time zone NULL,
                    ""DispatchedByEmployeeId"" uuid NULL,
                    ""Notes"" character varying(1000) NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NOT NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_dispatches_CompanyId_DispatchNumber"" ON inventory.dispatches (""CompanyId"", ""DispatchNumber"");
                CREATE INDEX IF NOT EXISTS ""IX_dispatches_CompanyId_SalesOrderId"" ON inventory.dispatches (""CompanyId"", ""SalesOrderId"");
                CREATE INDEX IF NOT EXISTS ""IX_dispatches_CompanyId_DispatchStatus"" ON inventory.dispatches (""CompanyId"", ""DispatchStatus"");

                CREATE TABLE IF NOT EXISTS inventory.dispatch_lines (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""DispatchId"" uuid NOT NULL REFERENCES inventory.dispatches(""Id"") ON DELETE CASCADE,
                    ""ProductId"" uuid NOT NULL,
                    ""DispatchedQuantity"" numeric(18,4) NOT NULL DEFAULT 0,
                    ""BatchNumber"" character varying(100) NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE INDEX IF NOT EXISTS ""IX_dispatch_lines_DispatchId"" ON inventory.dispatch_lines (""DispatchId"");
                CREATE INDEX IF NOT EXISTS ""IX_dispatch_lines_ProductId"" ON inventory.dispatch_lines (""ProductId"");

                -- Customer GPS Columns
                ALTER TABLE customer.customers ADD COLUMN IF NOT EXISTS ""Latitude"" double precision NULL;
                ALTER TABLE customer.customers ADD COLUMN IF NOT EXISTS ""Longitude"" double precision NULL;

                -- Sales Order Field-Verification Audit Columns
                ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS ""CaptureLatitude"" double precision NULL;
                ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS ""CaptureLongitude"" double precision NULL;
                ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS ""CaptureAccuracyMeters"" double precision NULL;
                ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS ""DistanceToCustomerMeters"" double precision NULL;
                ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS ""IsGpsVerified"" boolean NOT NULL DEFAULT FALSE;
                ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS ""IsFaceVerified"" boolean NOT NULL DEFAULT FALSE;
                ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS ""VerifiedAtUtc"" timestamp with time zone NULL;

                -- SFA Schema and Tables
                CREATE SCHEMA IF NOT EXISTS sfa;

                CREATE TABLE IF NOT EXISTS sfa.sales_beats (
                    ""Id"" uuid PRIMARY KEY,
                    ""CompanyId"" uuid NOT NULL REFERENCES organization.companies (""Id"") ON DELETE RESTRICT,
                    ""SalesEmployeeId"" uuid NULL REFERENCES hr.employees (""Id"") ON DELETE SET NULL,
                    ""Code"" character varying(50) NOT NULL,
                    ""Name"" character varying(150) NOT NULL,
                    ""Frequency"" character varying(30) NOT NULL DEFAULT 'Daily',
                    ""IsActive"" boolean NOT NULL DEFAULT true,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE TABLE IF NOT EXISTS sfa.sales_beat_customers (
                    ""Id"" uuid PRIMARY KEY,
                    ""SalesBeatId"" uuid NOT NULL REFERENCES sfa.sales_beats (""Id"") ON DELETE CASCADE,
                    ""CustomerId"" uuid NOT NULL REFERENCES customer.customers (""Id"") ON DELETE RESTRICT,
                    ""SequenceOrder"" integer NOT NULL DEFAULT 1,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE TABLE IF NOT EXISTS sfa.sales_rep_customer_assignments (
                    ""Id"" uuid PRIMARY KEY,
                    ""CompanyId"" uuid NOT NULL REFERENCES organization.companies (""Id"") ON DELETE RESTRICT,
                    ""EmployeeId"" uuid NOT NULL REFERENCES hr.employees (""Id"") ON DELETE RESTRICT,
                    ""CustomerId"" uuid NOT NULL REFERENCES customer.customers (""Id"") ON DELETE RESTRICT,
                    ""AssignedFromUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""AssignedToUtc"" timestamp with time zone NULL,
                    ""IsActive"" boolean NOT NULL DEFAULT true,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE TABLE IF NOT EXISTS sfa.sales_visits (
                    ""Id"" uuid PRIMARY KEY,
                    ""CompanyId"" uuid NOT NULL REFERENCES organization.companies (""Id"") ON DELETE RESTRICT,
                    ""SalesEmployeeId"" uuid NOT NULL REFERENCES hr.employees (""Id"") ON DELETE RESTRICT,
                    ""CustomerId"" uuid NOT NULL REFERENCES customer.customers (""Id"") ON DELETE RESTRICT,
                    ""VisitDateUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CheckInLatitude"" double precision NOT NULL DEFAULT 0,
                    ""CheckInLongitude"" double precision NOT NULL DEFAULT 0,
                    ""DistanceToCustomerMeters"" double precision NOT NULL DEFAULT 0,
                    ""IsGpsVerified"" boolean NOT NULL DEFAULT false,
                    ""IsFaceVerified"" boolean NOT NULL DEFAULT false,
                    ""CheckInAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CheckOutAtUtc"" timestamp with time zone NULL,
                    ""Outcome"" character varying(50) NOT NULL DEFAULT 'Planned',
                    ""Notes"" character varying(500) NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE TABLE IF NOT EXISTS sfa.sales_rep_location_enrollments (
                    ""Id"" uuid PRIMARY KEY,
                    ""CompanyId"" uuid NOT NULL REFERENCES organization.companies (""Id"") ON DELETE RESTRICT,
                    ""EmployeeId"" uuid NOT NULL REFERENCES hr.employees (""Id"") ON DELETE CASCADE,
                    ""UserId"" uuid NULL,
                    ""LocationName"" character varying(200) NOT NULL,
                    ""Latitude"" double precision NOT NULL,
                    ""Longitude"" double precision NOT NULL,
                    ""AllowedRadiusMeters"" double precision NOT NULL DEFAULT 50.0,
                    ""IsActive"" boolean NOT NULL DEFAULT true,
                    ""EnrolledAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""EnrolledByUserId"" uuid NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""CreatedBy"" character varying(100) NULL,
                    ""LastModifiedAtUtc"" timestamp with time zone NULL,
                    ""LastModifiedBy"" character varying(100) NULL,
                    ""DeletedAtUtc"" timestamp with time zone NULL,
                    ""DeletedBy"" character varying(100) NULL,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text,
                    ""ModifiedBy"" character varying(100) NULL
                );

                CREATE INDEX IF NOT EXISTS ""IX_sales_beats_CompanyId"" ON sfa.sales_beats (""CompanyId"");
                CREATE INDEX IF NOT EXISTS ""IX_sales_beats_SalesEmployeeId"" ON sfa.sales_beats (""SalesEmployeeId"");
                CREATE INDEX IF NOT EXISTS ""IX_sales_beat_customers_SalesBeatId"" ON sfa.sales_beat_customers (""SalesBeatId"");
                CREATE INDEX IF NOT EXISTS ""IX_sales_rep_customer_assignments_EmployeeId"" ON sfa.sales_rep_customer_assignments (""EmployeeId"");
                CREATE INDEX IF NOT EXISTS ""IX_sales_rep_customer_assignments_CustomerId"" ON sfa.sales_rep_customer_assignments (""CustomerId"");
                CREATE INDEX IF NOT EXISTS ""IX_sales_visits_CompanyId"" ON sfa.sales_visits (""CompanyId"");
                CREATE INDEX IF NOT EXISTS ""IX_sales_visits_SalesEmployeeId"" ON sfa.sales_visits (""SalesEmployeeId"");
                CREATE INDEX IF NOT EXISTS ""IX_sales_visits_CustomerId"" ON sfa.sales_visits (""CustomerId"");
                CREATE INDEX IF NOT EXISTS ""IX_sales_rep_location_enrollments_EmployeeId"" ON sfa.sales_rep_location_enrollments (""EmployeeId"");
                CREATE INDEX IF NOT EXISTS ""IX_sales_rep_location_enrollments_CompanyId"" ON sfa.sales_rep_location_enrollments (""CompanyId"");
            ");
            logger.LogInformation("Ensured PostgreSQL fulfillment, customer coordinates, sales, and SFA tables exist.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Table creation or column addition skipped or handled.");
        }

        // 1. Seed Roles (13 Production Default Roles including Super Admin)
        var defaultRoles = new (string Code, string Name, string Description, int Priority, bool IsSystem)[]
        {
            ("SUPER_ADMIN", "Super Admin", "Super Admin with complete system clearance and full multi-admin management", 0, true),
            ("ADMIN", "Admin", "Sub-Admin with configurable module permissions assigned by Super Admin", 1, true),
            ("SALES_MANAGER", "Sales Manager", "Manages sales operations, approvals, and reps", 2, true),
            ("SALES_REP", "Sales Representative", "Sales order processing and customer relations", 3, false),
            ("PURCHASE_MANAGER", "Purchase Manager", "Procurement, vendor management, and purchase approvals", 4, false),
            ("WAREHOUSE_MANAGER", "Warehouse Manager", "Warehouse inventory and dispatch logistics", 5, false),
            ("INVENTORY_MANAGER", "Inventory Manager", "Stock auditing, adjustments, and catalog management", 6, false),
            ("ACCOUNTANT", "Accountant", "Finance ledgers, vouchers, and invoicing", 7, false),
            ("HR_MANAGER", "HR Manager", "Human capital, employee onboarding, and access control", 8, false),
            ("SUPERVISOR", "Supervisor", "Shift supervisor with operational approval rights", 9, false),
            ("DRIVER", "Driver", "Delivery logistics, route verification, and proof of delivery", 10, false),
            ("DISTRIBUTOR_PORTAL", "Distributor Portal User", "External distributor portal access for order placement", 11, false),
            ("CUSTOMER_PORTAL", "Customer Portal User", "External customer portal access for self-service", 12, false)
        };

        foreach (var r in defaultRoles)
        {
            if (!await roleManager.RoleExistsAsync(r.Name) && !await context.Roles.AnyAsync(existing => existing.NormalizedName == r.Name.ToUpperInvariant() || existing.Code == r.Code))
            {
                try
                {
                    var role = new ApplicationRole
                    {
                        Id = Guid.NewGuid(),
                        Name = r.Name,
                        NormalizedName = r.Name.ToUpperInvariant(),
                        Code = r.Code,
                        Description = r.Description,
                        Priority = r.Priority,
                        IsSystem = r.IsSystem,
                        IsActive = true,
                        CreatedAtUtc = DateTime.UtcNow
                    };
                    await roleManager.CreateAsync(role);
                    logger.LogInformation("Seeded Role: {RoleName}", r.Name);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Role {RoleName} already created or handled.", r.Name);
                }
            }
        }

        // 2. Seed Core Permission Groups / Modules for all 17 FMCG Modules
        var coreGroups = new (string Code, string Name, string Description, int DisplayOrder)[]
        {
            ("ROOT", "Root System", "Super Admin root clearance and full control", 0),
            ("IAM", "Authentication & Security Center", "Global security policies, MFA, biometrics, security profiles", 1),
            ("USER_MGMT", "User Management", "Operational employee accounts, status lifecycle, and roster", 2),
            ("MASTERS", "Master Data Engine", "Companies, branches, departments, customers, suppliers, products", 3),
            ("PRICING", "Pricing & Promotions", "Price lists, discount rules, customer-specific pricing", 4),
            ("PROCUREMENT", "Procurement & Sourcing", "PRs, RFQs, POs, GRN receiving, 3-way invoice matching", 5),
            ("WMS", "Warehouse Management", "Putaway, picking waves, packing staging, stock transfers", 6),
            ("INVENTORY", "Inventory Control", "Stock levels, FEFO expiry tracking, cycle counting", 7),
            ("SFA", "Sales Force Automation", "Beat planning, GPS visits, live order booking, DCR", 8),
            ("O2C", "Order-to-Cash", "Quotations, sales orders, GST invoicing, delivery notes", 9),
            ("RETURNS", "Returns Management", "RMA authorization, QC staging, RTV vendor returns", 10),
            ("FINANCE", "Finance & AR/AP", "Accounts receivable, accounts payable, ledger", 11),
            ("WORKFLOW", "Approval Workflow", "Workflow designer, approval matrix, delegation rules", 12),
            ("HRMS", "HRMS Portal", "Employee roster, attendance logs, leave management", 13),
            ("CRM", "CRM & Customer Service", "Customer 360, complaints, service tickets", 14),
            ("LOGISTICS", "Logistics & Delivery", "Fleet management, route optimization, proof of delivery", 15),
            ("REPORTS", "Reports & Document Engine", "Query builder, document renderer, exports", 16),
            ("BI", "Executive BI & Analytics", "Executive dashboards, sales/financial analytics", 17)
        };

        var groupDict = new Dictionary<string, Guid>();

        foreach (var g in coreGroups)
        {
            var existingGroup = await context.PermissionGroups.FirstOrDefaultAsync(pg => pg.Code == g.Code);
            if (existingGroup == null)
            {
                var group = new PermissionGroup
                {
                    Id = Guid.NewGuid(),
                    Code = g.Code,
                    Name = g.Name,
                    Description = g.Description,
                    DisplayOrder = g.DisplayOrder,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                };
                context.PermissionGroups.Add(group);
                await context.SaveChangesAsync();
                groupDict[g.Code] = group.Id;
                logger.LogInformation("Seeded Permission Group: {GroupName}", g.Name);
            }
            else
            {
                groupDict[g.Code] = existingGroup.Id;
            }
        }

        // 3. Seed Canonical 17 FMCG Module Permissions + Root Clearance
        var corePermissions = new (string GroupCode, string Code, string Name, string Description, int DisplayOrder)[]
        {
            ("ROOT", "manage:all", "Full Root System Clearance", "Complete unrestricted access across all system modules", 0),
            ("IAM", "iam:manage", "IAM & Security Center", "Manage global security policies, MFA, biometrics, security profiles", 1),
            ("USER_MGMT", "admin:manage_users", "Operational User Management", "Manage operational employee user accounts and roster", 2),
            ("MASTERS", "masters:manage", "Master Data Engine", "Manage companies, branches, departments, customers, suppliers, products", 3),
            ("PRICING", "pricing:manage", "Pricing & Promotions", "Manage price lists, volume discounts, customer pricing, and taxes", 4),
            ("PROCUREMENT", "procurement:manage", "Procurement & Sourcing", "Manage purchase requisitions, RFQs, purchase orders, and GRN", 5),
            ("WMS", "wms:manage", "Warehouse Management", "Manage warehouse putaway, picking waves, packing, and transfers", 6),
            ("INVENTORY", "inventory:manage", "Inventory Control", "Manage stock levels, FEFO expiry tracking, and cycle counting", 7),
            ("SFA", "sfa:manage", "Sales Force Automation", "Manage beat planning, GPS store visits, live orders, and collections", 8),
            ("O2C", "o2c:manage", "Order-to-Cash", "Manage quotations, sales orders, delivery notes, and tax invoices", 9),
            ("RETURNS", "returns:manage", "Returns Management", "Manage RMA authorizations, damage inspection, and vendor returns", 10),
            ("FINANCE", "finance:manage", "Finance & AR/AP", "Manage accounts receivable, accounts payable, and general ledger", 11),
            ("WORKFLOW", "workflow:manage", "Approval Workflow", "Manage workflow designer, approval matrix, and delegations", 12),
            ("HRMS", "hrms:manage", "HRMS Portal", "Manage employee roster, attendance tracking, and leave approvals", 13),
            ("CRM", "crm:manage", "CRM & Customer Service", "Manage Customer 360, complaints, and service tickets", 14),
            ("LOGISTICS", "logistics:manage", "Logistics & Delivery", "Manage fleet vehicles, route optimization, and proof of delivery", 15),
            ("REPORTS", "reports:manage", "Reports & Documents", "Manage query builder, document renderer, and export scheduling", 16),
            ("BI", "bi:manage", "Executive BI & Analytics", "Access executive BI dashboards and financial charts", 17),
            // Action-level permission aliases
            ("INVENTORY", "inventory:view", "View Inventory", "View stock levels and warehouse data", 18),
            ("O2C", "sales:view", "View Sales", "View sales orders and customer invoices", 19),
            ("PROCUREMENT", "procurement:view", "View Procurement", "View purchase orders and supplier catalog", 20),
            ("FINANCE", "finance:view", "View Financial Statements", "View general ledger, balance sheet, P&L", 21),
            ("IAM", "security:user_management", "User Management", "Manage user accounts, locking, and status", 22),
            ("IAM", "security:role_management", "Role Management", "Create, edit, clone, and assign roles & permissions", 23),
            ("REPORTS", "reports:view", "View Reports", "View analytical and operational reports", 24),
            ("USER_MGMT", "IAM.Users.Read", "Read Users", "Read user profile data", 26),
            ("USER_MGMT", "IAM.Users.Create", "Create Users", "Create new user profiles", 27),
            ("USER_MGMT", "IAM.Users.Update", "Update Users", "Update user profile data", 28),
            ("USER_MGMT", "IAM.Users.Delete", "Delete Users", "Soft delete user profiles", 29),
            ("INVENTORY", "inventory:pick", "Order Picking", "Create, assign, and verify stock picking tasks", 30),
            ("INVENTORY", "inventory:pack", "Order Packing", "Create and verify packaging for picked orders", 31),
            ("INVENTORY", "inventory:dispatch", "Order Dispatch", "Prepare shipments, confirm dispatches, and issue goods", 32),
            ("INVENTORY", "inventory:transfer:request", "Request Stock Transfer", "Create stock transfer requests for destination locations", 33),
            ("INVENTORY", "inventory:transfer:approve", "Approve Stock Transfer", "Approve transfer requests for source supply locations", 34),
            ("INVENTORY", "inventory:transfer:dispatch", "Dispatch Stock Transfer", "Dispatch stock from source supply locations", 35),
            ("INVENTORY", "inventory:transfer:receive", "Receive Stock Transfer", "Receive stock at destination locations", 36),
            ("O2C", "sales:create", "Create Sales Order", "Create and draft sales orders", 37),
            ("O2C", "sales:submit", "Submit Sales Order", "Submit sales orders and reserve inventory", 38),
            ("O2C", "sales:cancel", "Cancel Sales Order", "Cancel sales orders and release inventory reservations", 39),
            ("O2C", "sales:field-order", "Field Sales Order Capture", "Capture field sales orders with GPS and biometric face verification", 40),
            ("SFA", "sfa:visit", "Record Store Visit", "Record geofenced store visits and GPS check-ins", 41),
            ("SFA", "sfa:beat:manage", "Manage Sales Beats", "Create and assign sales beats and customer sequences", 42),
            ("SFA", "sales_team:view", "View Sales Team", "View company sales representatives and their assigned customers", 43),
            ("SFA", "sales_team:manage", "Manage Sales Team", "Create, edit, reset password, and assign customers to sales reps", 44),
            ("SFA", "sfa:view", "View Field Sales Activity", "View assigned store visits and field activities", 45),
            ("MASTERS", "masters:customer:view", "View Assigned Customers", "View assigned customer stores and registries", 46),
            ("MASTERS", "masters:product:view", "View Product Catalog", "View available products and units of measure", 47),
            ("PRICING", "pricing:resolve", "Resolve Customer Pricing", "Resolve customer-specific pricing and volume discounts", 48),
            ("SFA", "sfa:collections:view", "View Field Collections", "View representative field payment collections", 49)
        };

        var allPermissionIds = new List<Guid>();

        foreach (var p in corePermissions)
        {
            var existingPerm = await context.Permissions.FirstOrDefaultAsync(perm => perm.Code == p.Code);
            if (existingPerm == null)
            {
                if (!groupDict.TryGetValue(p.GroupCode, out var groupGuid))
                {
                    groupGuid = groupDict.Values.FirstOrDefault();
                }
                var perm = new Permission
                {
                    Id = Guid.NewGuid(),
                    Code = p.Code,
                    Name = p.Name,
                    Description = p.Description,
                    PermissionGroupId = groupGuid,
                    DisplayOrder = p.DisplayOrder,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                };
                context.Permissions.Add(perm);
                await context.SaveChangesAsync();
                allPermissionIds.Add(perm.Id);
                logger.LogInformation("Seeded Permission: {PermissionCode}", p.Code);
            }
            else
            {
                allPermissionIds.Add(existingPerm.Id);
            }
        }

        // 4. Link All Permissions to ADMIN Role
        var adminRole = await roleManager.FindByNameAsync("Admin");
        if (adminRole != null)
        {
            foreach (var permId in allPermissionIds)
            {
                var exists = await context.RolePermissions.AnyAsync(rp => rp.RoleId == adminRole.Id && rp.PermissionId == permId);
                if (!exists)
                {
                    context.RolePermissions.Add(new RolePermission
                    {
                        Id = Guid.NewGuid(),
                        RoleId = adminRole.Id,
                        PermissionId = permId,
                        CreatedAtUtc = DateTime.UtcNow
                    });
                }
            }
            await context.SaveChangesAsync();
        }

        // 4.1. Link Least-Privilege Granular Permissions to SALES_REP Role
        var salesRepRole = await roleManager.FindByNameAsync("Sales Representative") 
            ?? await context.Roles.FirstOrDefaultAsync(r => r.Code == "SALES_REP" || r.NormalizedName == "SALES REPRESENTATIVE");
        if (salesRepRole != null)
        {
            var salesRepPermissionCodes = new[]
            {
                "read:dashboard",
                "sales:view",
                "sales:create",
                "sales:submit",
                "sales:field-order",
                "sfa:visit",
                "sfa:view",
                "masters:customer:view",
                "masters:customer",
                "masters:product:view",
                "masters:product",
                "pricing:resolve",
                "sfa:collections:view"
            };

            var salesRepPermissions = await context.Permissions
                .Where(p => salesRepPermissionCodes.Contains(p.Code) && !p.IsDeleted)
                .ToListAsync();

            foreach (var perm in salesRepPermissions)
            {
                var exists = await context.RolePermissions.AnyAsync(rp => rp.RoleId == salesRepRole.Id && rp.PermissionId == perm.Id && !rp.IsDeleted);
                if (!exists)
                {
                    context.RolePermissions.Add(new RolePermission
                    {
                        Id = Guid.NewGuid(),
                        RoleId = salesRepRole.Id,
                        PermissionId = perm.Id,
                        CreatedAtUtc = DateTime.UtcNow
                    });
                }
            }
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded and synchronized least-privilege RolePermissions for SALES_REP role.");
        }

        // 5. Seed Super Admin User
        const string superAdminEmail = "superadmin@inkerp.com";
        const string superAdminUsername = "superadmin";

        var superAdminRole = await roleManager.FindByNameAsync("Super Admin");
        var superAdminUser = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.NormalizedUserName == superAdminUsername.ToUpperInvariant() || u.NormalizedEmail == superAdminEmail.ToUpperInvariant());
        if (superAdminUser == null)
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = superAdminUsername,
                NormalizedUserName = superAdminUsername.ToUpperInvariant(),
                Email = superAdminEmail,
                NormalizedEmail = superAdminEmail.ToUpperInvariant(),
                EmailConfirmed = true,
                FirstName = "Super",
                LastName = "Admin",
                DisplayName = "Super Admin",
                IsActive = true,
                IsLocked = false,
                IsDeleted = false,
                CreatedAtUtc = DateTime.UtcNow
            };

            var createResult = await userManager.CreateAsync(user, "SuperAdminPassword123!");
            if (createResult.Succeeded)
            {
                user.PasswordHash = "HASHED:SuperAdminPassword123!";
                user.IsActive = true;
                user.IsLocked = false;
                user.IsDeleted = false;
                await userManager.UpdateAsync(user);
                superAdminUser = user;
                logger.LogInformation("Seeded Default Super Admin Account: {Email}", superAdminEmail);
            }
            else
            {
                logger.LogError("Failed to create default SuperAdmin user: {Errors}", string.Join(", ", createResult.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            superAdminUser.PasswordHash = "HASHED:SuperAdminPassword123!";
            superAdminUser.IsActive = true;
            superAdminUser.IsLocked = false;
            superAdminUser.IsDeleted = false;
            superAdminUser.AccessFailedCount = 0;
            superAdminUser.LockoutEnd = null;
            context.Users.Update(superAdminUser);
            await context.SaveChangesAsync();
            logger.LogInformation("Updated Default Super Admin Account password and status: {Email}", superAdminEmail);
        }

        if (superAdminUser != null && superAdminRole != null)
        {
            var roleExists = await context.IAMUserRoles.AnyAsync(ur => ur.UserId == superAdminUser.Id && ur.RoleId == superAdminRole.Id && !ur.IsDeleted);
            if (!roleExists)
            {
                context.IAMUserRoles.Add(new UserRole
                {
                    Id = Guid.NewGuid(),
                    UserId = superAdminUser.Id,
                    RoleId = superAdminRole.Id,
                    CreatedAtUtc = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }

        // 6. Seed First Admin User
        const string adminEmail = "admin@inkerp.com";
        const string adminUsername = "admin";

        var adminUser = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.NormalizedUserName == adminUsername.ToUpperInvariant() || u.NormalizedEmail == adminEmail.ToUpperInvariant());
        if (adminUser == null)
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = adminUsername,
                NormalizedUserName = adminUsername.ToUpperInvariant(),
                Email = adminEmail,
                NormalizedEmail = adminEmail.ToUpperInvariant(),
                EmailConfirmed = true,
                FirstName = "System",
                LastName = "Admin",
                DisplayName = "System Admin",
                IsActive = true,
                IsLocked = false,
                IsDeleted = false,
                CreatedAtUtc = DateTime.UtcNow
            };

            var createResult = await userManager.CreateAsync(user, "AdminPassword123!");
            if (createResult.Succeeded)
            {
                user.PasswordHash = "HASHED:AdminPassword123!";
                user.IsActive = true;
                user.IsLocked = false;
                user.IsDeleted = false;
                await userManager.UpdateAsync(user);
                adminUser = user;
                logger.LogInformation("Seeded Default Admin Account: {Email}", adminEmail);
            }
            else
            {
                logger.LogError("Failed to create default Admin user: {Errors}", string.Join(", ", createResult.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            adminUser.PasswordHash = "HASHED:AdminPassword123!";
            adminUser.IsActive = true;
            adminUser.IsLocked = false;
            adminUser.IsDeleted = false;
            adminUser.AccessFailedCount = 0;
            adminUser.LockoutEnd = null;
            context.Users.Update(adminUser);
            await context.SaveChangesAsync();
            logger.LogInformation("Updated Default Admin Account password and status: {Email}", adminEmail);
        }

        if (adminUser != null && adminRole != null)
        {
            var roleExists = await context.IAMUserRoles.AnyAsync(ur => ur.UserId == adminUser.Id && ur.RoleId == adminRole.Id && !ur.IsDeleted);
            if (!roleExists)
            {
                context.IAMUserRoles.Add(new UserRole
                {
                    Id = Guid.NewGuid(),
                    UserId = adminUser.Id,
                    RoleId = adminRole.Id,
                    CreatedAtUtc = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }

        logger.LogInformation("IAM Database Seeding Completed Successfully.");
    }
}
