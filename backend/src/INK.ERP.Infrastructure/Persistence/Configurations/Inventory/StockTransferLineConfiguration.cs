using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory;

public class StockTransferLineConfiguration : IEntityTypeConfiguration<StockTransferLine>
{
    public void Configure(EntityTypeBuilder<StockTransferLine> builder)
    {
        builder.ToTable("stock_transfer_lines", "inventory");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.StockTransferId).IsRequired();
        builder.Property(x => x.ProductId).IsRequired();

        builder.Property(x => x.RequestedQuantity).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.ApprovedQuantity).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.DispatchedQuantity).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.ReceivedQuantity).HasPrecision(18, 4).IsRequired();

        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.LastModifiedAtUtc).IsRequired(false);

        // Indexes
        builder.HasIndex(x => x.StockTransferId);
        builder.HasIndex(x => x.ProductId);
        builder.HasIndex(x => new { x.StockTransferId, x.ProductId });

        // Foreign Keys
        builder.HasOne(x => x.StockTransfer)
            .WithMany(t => t.Lines)
            .HasForeignKey(x => x.StockTransferId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
