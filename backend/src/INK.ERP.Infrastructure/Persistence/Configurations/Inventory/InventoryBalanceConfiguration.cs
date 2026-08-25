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

        // Unique Constraint: One balance per Product per Location in a Company
        builder.HasIndex(x => new { x.CompanyId, x.InventoryLocationId, x.ProductId }).IsUnique();
    }
}
