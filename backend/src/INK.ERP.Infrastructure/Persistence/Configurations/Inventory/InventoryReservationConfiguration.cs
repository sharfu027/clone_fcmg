using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory;

public class InventoryReservationConfiguration : IEntityTypeConfiguration<InventoryReservation>
{
    public void Configure(EntityTypeBuilder<InventoryReservation> builder)
    {
        builder.ToTable("inventory_reservations", "inventory");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CompanyId)
            .IsRequired();

        builder.Property(x => x.SalesOrderId)
            .IsRequired(false);

        builder.Property(x => x.SalesOrderLineId)
            .IsRequired(false);

        builder.Property(x => x.InventoryLocationId)
            .IsRequired();

        builder.Property(x => x.ProductId)
            .IsRequired();

        builder.Property(x => x.ReservedQuantity)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.ReservedAtUtc)
            .IsRequired();

        builder.Property(x => x.ReleasedAtUtc)
            .IsRequired(false);

        builder.Property(x => x.ExpiresAtUtc)
            .IsRequired(false);

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(x => x.LastModifiedAtUtc)
            .IsRequired(false);

        // Foreign Key Relationships (Strict RESTRICT, no cascade delete)
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
        builder.HasIndex(x => x.SalesOrderId);
        builder.HasIndex(x => x.SalesOrderLineId);
        builder.HasIndex(x => x.InventoryLocationId);
        builder.HasIndex(x => x.ProductId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.ReservedAtUtc);
        builder.HasIndex(x => new { x.CompanyId, x.Status });
        builder.HasIndex(x => new { x.CompanyId, x.InventoryLocationId });
        builder.HasIndex(x => new { x.CompanyId, x.ProductId });
    }
}
