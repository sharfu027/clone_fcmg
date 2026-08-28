using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory.Fulfillment;

public class PackageConfiguration : IEntityTypeConfiguration<Package>
{
    public void Configure(EntityTypeBuilder<Package> builder)
    {
        builder.ToTable("packages", "inventory");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.PackTaskId).IsRequired();
        builder.Property(x => x.PackageNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.PackageType).HasMaxLength(50).IsRequired();
        builder.Property(x => x.GrossWeightKg).HasPrecision(18, 2).IsRequired(false);
        builder.Property(x => x.Length).HasPrecision(18, 2).IsRequired(false);
        builder.Property(x => x.Width).HasPrecision(18, 2).IsRequired(false);
        builder.Property(x => x.Height).HasPrecision(18, 2).IsRequired(false);
        builder.Property(x => x.SealNumber).HasMaxLength(100).IsRequired(false);
        builder.Property(x => x.Barcode).HasMaxLength(100).IsRequired(false);
        builder.Property(x => x.PackedByEmployeeId).IsRequired(false);
        builder.Property(x => x.PackedAtUtc).IsRequired(false);

        // Indexes
        builder.HasIndex(x => x.PackTaskId);
        builder.HasIndex(x => x.PackageNumber);

        // Relationships
        builder.HasOne(x => x.PackedByEmployee)
            .WithMany()
            .HasForeignKey(x => x.PackedByEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Items)
            .WithOne(i => i.Package)
            .HasForeignKey(i => i.PackageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
