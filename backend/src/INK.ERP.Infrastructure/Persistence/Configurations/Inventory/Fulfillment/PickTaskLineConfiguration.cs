using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory.Fulfillment;

public class PickTaskLineConfiguration : IEntityTypeConfiguration<PickTaskLine>
{
    public void Configure(EntityTypeBuilder<PickTaskLine> builder)
    {
        builder.ToTable("pick_task_lines", "inventory");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.PickTaskId).IsRequired();
        builder.Property(x => x.SalesOrderLineId).IsRequired();
        builder.Property(x => x.ProductId).IsRequired();

        builder.Property(x => x.RequestedQuantity).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.AllocatedQuantity).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.PickedQuantity).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.ShortQuantity).HasPrecision(18, 4).IsRequired();

        builder.Property(x => x.Status).HasMaxLength(30).IsRequired();
        builder.Property(x => x.BatchNumber).HasMaxLength(100).IsRequired(false);
        builder.Property(x => x.ExpiryDate).IsRequired(false);

        // Indexes
        builder.HasIndex(x => x.PickTaskId);
        builder.HasIndex(x => x.SalesOrderLineId);
        builder.HasIndex(x => x.ProductId);

        // Relationships
        builder.HasOne(x => x.SalesOrderLine)
            .WithMany()
            .HasForeignKey(x => x.SalesOrderLineId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
