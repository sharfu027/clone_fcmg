using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory;

public class InventoryTransactionConfiguration : IEntityTypeConfiguration<InventoryTransaction>
{
    public void Configure(EntityTypeBuilder<InventoryTransaction> builder)
    {
        builder.ToTable("inventory_transactions", "inventory");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CompanyId)
            .IsRequired();

        builder.Property(x => x.InventoryLocationId)
            .IsRequired();

        builder.Property(x => x.ProductId)
            .IsRequired();

        builder.Property(x => x.TransactionType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.Quantity)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(x => x.BalanceAfter)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(x => x.ReferenceDocumentType)
            .HasMaxLength(50);

        builder.Property(x => x.ReferenceDocumentId)
            .IsRequired(false);

        builder.Property(x => x.ReferenceDocumentNumber)
            .HasMaxLength(100);

        builder.Property(x => x.BatchNumber)
            .HasMaxLength(100);

        builder.Property(x => x.ExpiryDate)
            .HasColumnType("date")
            .IsRequired(false);

        builder.Property(x => x.PerformedByEmployeeId)
            .IsRequired(false);

        builder.Property(x => x.Notes)
            .HasMaxLength(500);

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

        builder.HasOne(x => x.PerformedByEmployee)
            .WithMany()
            .HasForeignKey(x => x.PerformedByEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.CompanyId);
        builder.HasIndex(x => x.InventoryLocationId);
        builder.HasIndex(x => x.ProductId);
        builder.HasIndex(x => x.CreatedAtUtc);
        builder.HasIndex(x => new { x.ReferenceDocumentType, x.ReferenceDocumentId });
        builder.HasIndex(x => new { x.CompanyId, x.ProductId });
        builder.HasIndex(x => new { x.CompanyId, x.InventoryLocationId });
    }
}
