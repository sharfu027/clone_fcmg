using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Pricing;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;
using INK.ERP.Domain.Entities.Sales;
using INK.ERP.Domain.Entities.SFA;

namespace INK.ERP.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Identity Table Renaming for enterprise schema alignment
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims", "iam");
        builder.Ignore<IdentityUserRole<Guid>>();
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins", "iam");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims", "iam");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens", "iam");

        builder.Entity<INK.ERP.Infrastructure.Persistence.Outbox.OutboxMessage>(entity =>
        {
            entity.ToTable("outbox_messages", "iam");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Content).IsRequired();
            entity.Property(e => e.OccurredOnUtc).IsRequired();
        });

        // Admin Company Assignment Configuration (Multi-Tenant Scoping)
        builder.Entity<AdminCompanyAssignment>(entity =>
        {
            entity.ToTable("admin_company_assignments", "iam");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.AdminUserId, e.IsActive })
                .IsUnique()
                .HasFilter("\"IsActive\" = true");
            entity.HasIndex(e => new { e.CompanyId, e.IsActive });
            entity.HasOne(e => e.AdminUser)
                .WithMany()
                .HasForeignKey(e => e.AdminUserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Company)
                .WithMany()
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<INK.ERP.Domain.Entities.Warehouse>(entity => { entity.ToTable("warehouses", "warehouse"); });

        // Procurement Purchase Requisition Configuration
        builder.Entity<INK.ERP.Domain.Entities.Procurement.PurchaseRequisition>(entity =>
        {
            entity.ToTable("purchase_requisitions", "procurement");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RequisitionNumber).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => new { e.CompanyId, e.RequisitionNumber }).IsUnique();
            entity.HasIndex(e => new { e.CompanyId, e.Status });
            entity.HasIndex(e => new { e.CompanyId, e.RequestedByUserId });
            entity.Property(e => e.EstimatedTotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.ConcurrencyToken).IsConcurrencyToken(false);
            entity.HasMany(e => e.Items).WithOne(i => i.PurchaseRequisition).HasForeignKey(i => i.PurchaseRequisitionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(e => e.StatusHistories).WithOne(h => h.PurchaseRequisition).HasForeignKey(h => h.PurchaseRequisitionId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<INK.ERP.Domain.Entities.Procurement.PurchaseRequisitionItem>(entity =>
        {
            entity.ToTable("purchase_requisition_items", "procurement");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RequestedQuantity).HasPrecision(18, 4);
            entity.Property(e => e.EstimatedUnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.EstimatedLineTotal).HasPrecision(18, 2);
            entity.Property(e => e.ConcurrencyToken).IsConcurrencyToken(false);
        });

        builder.Entity<INK.ERP.Domain.Entities.Procurement.PurchaseRequisitionStatusHistory>(entity =>
        {
            entity.ToTable("purchase_requisition_status_histories", "procurement");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ConcurrencyToken).IsConcurrencyToken(false);
        });

        // Procurement RFQ Configuration
        builder.Entity<INK.ERP.Domain.Entities.Procurement.Rfq>(entity =>
        {
            entity.ToTable("rfqs", "procurement");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RfqNumber).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => new { e.CompanyId, e.RfqNumber }).IsUnique();
            entity.HasIndex(e => new { e.CompanyId, e.Status });
            entity.HasIndex(e => e.PurchaseRequisitionId);
            entity.Property(e => e.ConcurrencyToken).IsConcurrencyToken(false);
            // ModifiedBy is a backing field; LastModifiedBy is the persisted column (already in DB).
            entity.Ignore(e => e.ModifiedBy);
            entity.HasMany(e => e.Items).WithOne(i => i.Rfq).HasForeignKey(i => i.RfqId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(e => e.Suppliers).WithOne(s => s.Rfq).HasForeignKey(s => s.RfqId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<INK.ERP.Domain.Entities.Procurement.RfqItem>(entity =>
        {
            entity.ToTable("rfq_items", "procurement");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RequestedQuantity).HasPrecision(18, 4);
            entity.Property(e => e.ConcurrencyToken).IsConcurrencyToken(false);
            entity.Ignore(e => e.ModifiedBy);
            entity.HasIndex(e => e.RfqId);
            entity.HasIndex(e => e.ProductId);
        });

        builder.Entity<INK.ERP.Domain.Entities.Procurement.RfqSupplier>(entity =>
        {
            entity.ToTable("rfq_suppliers", "procurement");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.RfqId, e.SupplierId }).IsUnique();
            entity.Property(e => e.ConcurrencyToken).IsConcurrencyToken(false);
            entity.Ignore(e => e.ModifiedBy);
        });

        // Apply all configurations from the assembly (runs all IEntityTypeConfiguration classes)
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public DbSet<INK.ERP.Infrastructure.Persistence.Outbox.OutboxMessage> OutboxMessages => Set<INK.ERP.Infrastructure.Persistence.Outbox.OutboxMessage>();
    public DbSet<InventoryLocation> InventoryLocations => Set<InventoryLocation>();
    public DbSet<InventoryBalance> InventoryBalances => Set<InventoryBalance>();
    public DbSet<InventoryStockPolicy> InventoryStockPolicies => Set<InventoryStockPolicy>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
    public DbSet<InventoryReservation> InventoryReservations => Set<InventoryReservation>();
    public DbSet<INK.ERP.Domain.Entities.Warehouse> Warehouses => Set<INK.ERP.Domain.Entities.Warehouse>();
    public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
    public DbSet<SalesOrderItem> SalesOrderItems => Set<SalesOrderItem>();
    public DbSet<StockTransfer> StockTransfers => Set<StockTransfer>();
    public DbSet<StockTransferLine> StockTransferLines => Set<StockTransferLine>();

    // Fulfillment DB Sets
    public DbSet<PickTask> PickTasks => Set<PickTask>();
    public DbSet<PickTaskLine> PickTaskLines => Set<PickTaskLine>();
    public DbSet<PackTask> PackTasks => Set<PackTask>();
    public DbSet<Package> Packages => Set<Package>();
    public DbSet<PackageItem> PackageItems => Set<PackageItem>();
    public DbSet<Dispatch> Dispatches => Set<Dispatch>();
    public DbSet<DispatchLine> DispatchLines => Set<DispatchLine>();

    // SFA DB Sets
    public DbSet<SalesBeat> SalesBeats => Set<SalesBeat>();
    public DbSet<SalesBeatCustomer> SalesBeatCustomers => Set<SalesBeatCustomer>();
    public DbSet<SalesRepCustomerAssignment> SalesRepCustomerAssignments => Set<SalesRepCustomerAssignment>();
    public DbSet<SalesVisit> SalesVisits => Set<SalesVisit>();

    // Procurement DB Sets
    public DbSet<INK.ERP.Domain.Entities.Procurement.PurchaseRequisition> PurchaseRequisitions => Set<INK.ERP.Domain.Entities.Procurement.PurchaseRequisition>();
    public DbSet<INK.ERP.Domain.Entities.Procurement.PurchaseRequisitionItem> PurchaseRequisitionItems => Set<INK.ERP.Domain.Entities.Procurement.PurchaseRequisitionItem>();
    public DbSet<INK.ERP.Domain.Entities.Procurement.PurchaseRequisitionStatusHistory> PurchaseRequisitionStatusHistories => Set<INK.ERP.Domain.Entities.Procurement.PurchaseRequisitionStatusHistory>();
    public DbSet<INK.ERP.Domain.Entities.Procurement.Rfq> Rfqs => Set<INK.ERP.Domain.Entities.Procurement.Rfq>();
    public DbSet<INK.ERP.Domain.Entities.Procurement.RfqItem> RfqItems => Set<INK.ERP.Domain.Entities.Procurement.RfqItem>();
    public DbSet<INK.ERP.Domain.Entities.Procurement.RfqSupplier> RfqSuppliers => Set<INK.ERP.Domain.Entities.Procurement.RfqSupplier>();

    // Pricing DB Sets
    public DbSet<PriceList> PriceLists => Set<PriceList>();
    public DbSet<PriceListItem> PriceListItems => Set<PriceListItem>();
    public DbSet<CustomerPrice> CustomerPrices => Set<CustomerPrice>();
    public DbSet<DiscountRule> DiscountRules => Set<DiscountRule>();
    public DbSet<INK.ERP.Domain.Entities.Pricing.Currency> Currencies => Set<INK.ERP.Domain.Entities.Pricing.Currency>();
    public DbSet<ExchangeRate> ExchangeRates => Set<ExchangeRate>();
    // Master Data DB Sets
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Designation> Designations => Set<Designation>();
    public DbSet<EmployeeRole> EmployeeRoles => Set<EmployeeRole>();
    public DbSet<UnitOfMeasure> UnitsOfMeasure => Set<UnitOfMeasure>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Employee> Employees => Set<Employee>();

    // IAM DB Sets
    public DbSet<PermissionGroup> PermissionGroups => Set<PermissionGroup>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> IAMUserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<AdminCompanyAssignment> AdminCompanyAssignments => Set<AdminCompanyAssignment>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<LoginHistory> LoginHistories => Set<LoginHistory>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<UserPreference> UserPreferences => Set<UserPreference>();
    public DbSet<SecurityAuditLog> SecurityAuditLogs => Set<SecurityAuditLog>();

    // Enterprise Security DB Sets
    public DbSet<FaceProfile> FaceProfiles => Set<FaceProfile>();
    public DbSet<FaceTemplate> FaceTemplates => Set<FaceTemplate>();
    public DbSet<FaceVerificationLog> FaceVerificationLogs => Set<FaceVerificationLog>();
    public DbSet<FaceEnrollmentLog> FaceEnrollmentLogs => Set<FaceEnrollmentLog>();
    public DbSet<SecurityPolicy> SecurityPolicies => Set<SecurityPolicy>();
    public DbSet<UserSecurityPolicy> UserSecurityPolicies => Set<UserSecurityPolicy>();
    public DbSet<RegisteredDevice> RegisteredDevices => Set<RegisteredDevice>();
    public DbSet<SecurityIncident> SecurityIncidents => Set<SecurityIncident>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateAuditFields()
    {
        var entries = ChangeTracker.Entries<AuditableEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = DateTime.UtcNow;
                if (string.IsNullOrEmpty(entry.Entity.CreatedBy))
                {
                    entry.Entity.CreatedBy = "System";
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.LastModifiedAtUtc = DateTime.UtcNow;
                if (string.IsNullOrEmpty(entry.Entity.LastModifiedBy))
                {
                    entry.Entity.LastModifiedBy = "System";
                }
            }
            else if (entry.State == EntityState.Deleted)
            {
                // Child detail entities should be deleted directly when cleared from parent collection
                if (entry.Entity is INK.ERP.Domain.Entities.Procurement.PurchaseRequisitionItem ||
                    entry.Entity is INK.ERP.Domain.Entities.Procurement.PurchaseRequisitionStatusHistory ||
                    entry.Entity is INK.ERP.Domain.Entities.Procurement.RfqItem ||
                    entry.Entity is INK.ERP.Domain.Entities.Procurement.RfqSupplier)
                {
                    continue;
                }

                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.DeletedAtUtc = DateTime.UtcNow;
            }
        }
    }
}
