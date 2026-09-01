using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory;

public class InventoryBalanceConfiguration : IEntityTypeConfiguration<InventoryBalance>
{
    public void Configure(EntityTypeBuilder<InventoryBalance> builder)
    {
        builder.ToTable("inventory_balances", "inventory");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CompanyId)
            .IsRequired();

        builder.Property(x => x.InventoryLocationId)
            .IsRequired();

        builder.Property(x => x.ProductId)
            .IsRequired();

        builder.Property(x => x.BatchNumber)
            .HasMaxLength(100)
            .IsRequired(false);

        builder.Property(x => x.ExpiryDate)
            .HasColumnType("date")
            .IsRequired(false);

        builder.Property(x => x.OnHandQuantity)
            .HasPrecision(18, 4)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(x => x.ReservedQuantity)
            .HasPrecision(18, 4)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(x => x.AllocatedQuantity)
            .HasPrecision(18, 4)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(x => x.MinStockQuantity)
            .HasPrecision(18, 4)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(x => x.LastMovementAtUtc)
            .IsRequired(false);

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(x => x.LastModifiedAtUtc)
            .IsRequired(false);

        // Foreign Key Relationships
        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.InventoryLocation)
            .WithMany()
            .HasForeignKey(x => x.InventoryLocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.CompanyId);
        builder.HasIndex(x => x.InventoryLocationId);
        builder.HasIndex(x => x.ProductId);
        builder.HasIndex(x => new { x.CompanyId, x.ProductId });
        builder.HasIndex(x => new { x.CompanyId, x.InventoryLocationId });

        // Partial Unique Indexes:
        // 1. Non-batch-tracked stock: Exactly one record per Product per Location where BatchNumber IS NULL
        builder.HasIndex(x => new { x.CompanyId, x.InventoryLocationId, x.ProductId })
            .HasFilter("\"BatchNumber\" IS NULL")
            .IsUnique();

        // 2. Batch-tracked stock: Exactly one record per Product per Location per Batch where BatchNumber IS NOT NULL
        builder.HasIndex(x => new { x.CompanyId, x.InventoryLocationId, x.ProductId, x.BatchNumber })
            .HasFilter("\"BatchNumber\" IS NOT NULL")
            .IsUnique();
    }
}
