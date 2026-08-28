using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory.Fulfillment;

public class DispatchLineConfiguration : IEntityTypeConfiguration<DispatchLine>
{
    public void Configure(EntityTypeBuilder<DispatchLine> builder)
    {
        builder.ToTable("dispatch_lines", "inventory");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.DispatchId).IsRequired();
        builder.Property(x => x.ProductId).IsRequired();
        builder.Property(x => x.DispatchedQuantity).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.BatchNumber).HasMaxLength(100).IsRequired(false);

        // Indexes
        builder.HasIndex(x => x.DispatchId);
        builder.HasIndex(x => x.ProductId);

        // Relationships
        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
