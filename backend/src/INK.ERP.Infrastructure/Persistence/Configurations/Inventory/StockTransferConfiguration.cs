using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory;

public class StockTransferConfiguration : IEntityTypeConfiguration<StockTransfer>
{
    public void Configure(EntityTypeBuilder<StockTransfer> builder)
    {
        builder.ToTable("stock_transfers", "inventory");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CompanyId).IsRequired();

        builder.Property(x => x.TransferNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.SourceLocationId).IsRequired();
        builder.Property(x => x.DestinationLocationId).IsRequired();
        builder.Property(x => x.SalesOrderId).IsRequired(false);

        builder.Property(x => x.Status)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.RequestedByEmployeeId).IsRequired();
        builder.Property(x => x.ApprovedByEmployeeId).IsRequired(false);
        builder.Property(x => x.DispatchedAtUtc).IsRequired(false);
        builder.Property(x => x.ReceivedAtUtc).IsRequired(false);
        builder.Property(x => x.Notes).HasMaxLength(1000).IsRequired(false);
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.LastModifiedAtUtc).IsRequired(false);

        // Unique transfer number per company
        builder.HasIndex(x => new { x.CompanyId, x.TransferNumber }).IsUnique();

        // Performance indexes
        builder.HasIndex(x => x.CompanyId);
        builder.HasIndex(x => x.SourceLocationId);
        builder.HasIndex(x => x.DestinationLocationId);
        builder.HasIndex(x => x.SalesOrderId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.RequestedByEmployeeId);
        builder.HasIndex(x => new { x.CompanyId, x.Status });
        builder.HasIndex(x => x.CreatedAtUtc);

        // Foreign Keys
        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SourceLocation)
            .WithMany()
            .HasForeignKey(x => x.SourceLocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.DestinationLocation)
            .WithMany()
            .HasForeignKey(x => x.DestinationLocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SalesOrder)
            .WithMany()
            .HasForeignKey(x => x.SalesOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.RequestedByEmployee)
            .WithMany()
            .HasForeignKey(x => x.RequestedByEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ApprovedByEmployee)
            .WithMany()
            .HasForeignKey(x => x.ApprovedByEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Child lines — cascade delete intentional (transfer owns lines)
        builder.HasMany(x => x.Lines)
            .WithOne(l => l.StockTransfer)
            .HasForeignKey(l => l.StockTransferId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
