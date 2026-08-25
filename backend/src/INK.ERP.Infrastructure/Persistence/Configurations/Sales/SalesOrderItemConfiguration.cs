using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Sales;

public class SalesOrderItemConfiguration : IEntityTypeConfiguration<SalesOrderItem>
{
    public void Configure(EntityTypeBuilder<SalesOrderItem> builder)
    {
        builder.ToTable("sales_order_items", "sales");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.SalesOrderId).IsRequired();
        builder.Property(x => x.ProductId).IsRequired();

        builder.Property(x => x.Quantity).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.UnitPrice).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.DiscountAmount).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.TaxAmount).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.LineTotal).HasPrecision(18, 4).IsRequired();

        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.LastModifiedAtUtc).IsRequired(false);

        // Indexes
        builder.HasIndex(x => x.SalesOrderId);
        builder.HasIndex(x => x.ProductId);

        // Foreign Keys
        builder.HasOne(x => x.SalesOrder)
            .WithMany(o => o.Items)
            .HasForeignKey(x => x.SalesOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
