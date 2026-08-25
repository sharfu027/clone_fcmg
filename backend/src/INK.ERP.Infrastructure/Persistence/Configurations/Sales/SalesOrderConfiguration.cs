using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Sales;

public class SalesOrderConfiguration : IEntityTypeConfiguration<SalesOrder>
{
    public void Configure(EntityTypeBuilder<SalesOrder> builder)
    {
        builder.ToTable("sales_orders", "sales");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CompanyId).IsRequired();
        builder.Property(x => x.CustomerId).IsRequired();
        builder.Property(x => x.SalesEmployeeId).IsRequired(false);
        builder.Property(x => x.InventoryLocationId).IsRequired(false);

        builder.Property(x => x.OrderNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.OrderStatus)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.OrderDateUtc).IsRequired();

        builder.Property(x => x.Subtotal).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.DiscountAmount).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.TaxAmount).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.TotalAmount).HasPrecision(18, 4).IsRequired();

        builder.Property(x => x.Notes).HasMaxLength(1000).IsRequired(false);
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.LastModifiedAtUtc).IsRequired(false);

        // Unique order number per company
        builder.HasIndex(x => new { x.CompanyId, x.OrderNumber }).IsUnique();

        // Performance indexes
        builder.HasIndex(x => x.CompanyId);
        builder.HasIndex(x => x.CustomerId);
        builder.HasIndex(x => x.SalesEmployeeId);
        builder.HasIndex(x => x.OrderStatus);
        builder.HasIndex(x => x.OrderDateUtc);

        // Foreign Keys
        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Customer)
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SalesEmployee)
            .WithMany()
            .HasForeignKey(x => x.SalesEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.InventoryLocation)
            .WithMany()
            .HasForeignKey(x => x.InventoryLocationId)
            .OnDelete(DeleteBehavior.Restrict);

        // Child lines — cascade delete is intentional (order owns its lines)
        builder.HasMany(x => x.Items)
            .WithOne(i => i.SalesOrder)
            .HasForeignKey(i => i.SalesOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
