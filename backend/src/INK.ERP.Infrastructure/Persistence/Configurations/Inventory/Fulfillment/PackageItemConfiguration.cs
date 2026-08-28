using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory.Fulfillment;

public class PackageItemConfiguration : IEntityTypeConfiguration<PackageItem>
{
    public void Configure(EntityTypeBuilder<PackageItem> builder)
    {
        builder.ToTable("package_items", "inventory");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.PackageId).IsRequired();
        builder.Property(x => x.ProductId).IsRequired();
        builder.Property(x => x.PackedQuantity).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.BatchNumber).HasMaxLength(100).IsRequired(false);

        // Indexes
        builder.HasIndex(x => x.PackageId);
        builder.HasIndex(x => x.ProductId);

        // Relationships
        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
