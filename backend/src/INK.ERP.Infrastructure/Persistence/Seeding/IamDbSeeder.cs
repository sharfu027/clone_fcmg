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

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""DeletedAtUtc"" timestamp with time zone NULL;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;

                ALTER TABLE procurement.purchase_requisition_status_histories 
                ADD COLUMN IF NOT EXISTS ""ConcurrencyToken"" character varying(200) NULL DEFAULT gen_random_uuid()::text;

                UPDATE procurement.purchase_requisitions SET ""ConcurrencyToken"" = gen_random_uuid()::text WHERE ""ConcurrencyToken"" IS NULL OR ""ConcurrencyToken"" = '';
                UPDATE procurement.purchase_requisition_items SET ""ConcurrencyToken"" = gen_random_uuid()::text WHERE ""ConcurrencyToken"" IS NULL OR ""ConcurrencyToken"" = '';
                UPDATE procurement.purchase_requisition_status_histories SET ""ConcurrencyToken"" = gen_random_uuid()::text WHERE ""ConcurrencyToken"" IS NULL OR ""ConcurrencyToken"" = '';
            ");
            logger.LogInformation("Ensured PostgreSQL procurement.purchase_requisition_items & status_histories schema columns exist.");
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

        // 1. Seed Roles (13 Production Default Roles including Super Administrator)
        var defaultRoles = new (string Code, string Name, string Description, int Priority, bool IsSystem)[]
        {
            ("SUPER_ADMIN", "Super Administrator", "Super Administrator with complete system clearance and full multi-admin management", 0, true),
            ("ADMIN", "Administrator", "Sub-Admin with configurable module permissions assigned by Super Admin", 1, true),
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
            if (!await roleManager.RoleExistsAsync(r.Name))
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
            ("SALES", "sales:view", "View Sales", "View sales orders and customer invoices", 19),
            ("PROCUREMENT", "procurement:view", "View Procurement", "View purchase orders and supplier catalog", 20),
            ("FINANCE", "finance:view", "View Financial Statements", "View general ledger, balance sheet, P&L", 21),
            ("IAM", "security:user_management", "User Management", "Manage user accounts, locking, and status", 22),
            ("IAM", "security:role_management", "Role Management", "Create, edit, clone, and assign roles & permissions", 23),
            ("REPORTS", "reports:view", "View Reports", "View analytical and operational reports", 24),
            ("BI", "dashboard:view_dashboard", "View Dashboard", "Access main ERP dashboard overview", 25),
            ("USER_MGMT", "IAM.Users.Read", "Read Users", "Read user profile data", 26),
            ("USER_MGMT", "IAM.Users.Create", "Create Users", "Create new user profiles", 27),
            ("USER_MGMT", "IAM.Users.Update", "Update Users", "Update user profile data", 28),
            ("USER_MGMT", "IAM.Users.Delete", "Delete Users", "Soft delete user profiles", 29)
        };

        var allPermissionIds = new List<Guid>();

        foreach (var p in corePermissions)
        {
            var existingPerm = await context.Permissions.FirstOrDefaultAsync(perm => perm.Code == p.Code);
            if (existingPerm == null)
            {
                var groupGuid = groupDict[p.GroupCode];
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
        var adminRole = await roleManager.FindByNameAsync("Administrator");
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

        // 5. Seed First Administrator User
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
                LastName = "Administrator",
                DisplayName = "System Administrator",
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
                logger.LogInformation("Seeded Default Administrator Account: {Email}", adminEmail);
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
            logger.LogInformation("Updated Default Administrator Account password and status: {Email}", adminEmail);
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
