using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory;

public class InventoryStockPolicyConfiguration : IEntityTypeConfiguration<InventoryStockPolicy>
{
    public void Configure(EntityTypeBuilder<InventoryStockPolicy> builder)
    {
        builder.ToTable("inventory_stock_policies", "inventory");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CompanyId)
            .IsRequired();

        builder.Property(x => x.InventoryLocationId)
            .IsRequired();

        builder.Property(x => x.ProductId)
            .IsRequired();

        builder.Property(x => x.MinStockQuantity)
            .HasPrecision(18, 4)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(x => x.ReorderPoint)
            .HasPrecision(18, 4)
            .IsRequired(false);

        builder.Property(x => x.ReorderQuantity)
            .HasPrecision(18, 4)
            .IsRequired(false);

        builder.Property(x => x.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

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

        // Unique Index: Exactly one stock policy per Company + Location + Product
        builder.HasIndex(x => new { x.CompanyId, x.InventoryLocationId, x.ProductId })
            .IsUnique();
    }
}
