using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory.Fulfillment;

public class PickTaskConfiguration : IEntityTypeConfiguration<PickTask>
{
    public void Configure(EntityTypeBuilder<PickTask> builder)
    {
        builder.ToTable("pick_tasks", "inventory");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CompanyId).IsRequired();
        builder.Property(x => x.SalesOrderId).IsRequired();
        builder.Property(x => x.InventoryLocationId).IsRequired();
        builder.Property(x => x.PickTaskNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.AssignedEmployeeId).IsRequired(false);
        builder.Property(x => x.Status).HasMaxLength(30).IsRequired();
        builder.Property(x => x.StartedAtUtc).IsRequired(false);
        builder.Property(x => x.CompletedAtUtc).IsRequired(false);
        builder.Property(x => x.Notes).HasMaxLength(1000).IsRequired(false);
        builder.Property(x => x.ConcurrencyToken).HasMaxLength(200).IsRequired();

        // Indexes
        builder.HasIndex(x => new { x.CompanyId, x.PickTaskNumber }).IsUnique();
        builder.HasIndex(x => new { x.CompanyId, x.SalesOrderId });
        builder.HasIndex(x => new { x.CompanyId, x.InventoryLocationId });
        builder.HasIndex(x => new { x.CompanyId, x.AssignedEmployeeId });
        builder.HasIndex(x => new { x.CompanyId, x.Status });
        builder.HasIndex(x => x.CreatedAtUtc);

        // Relationships
        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SalesOrder)
            .WithMany()
            .HasForeignKey(x => x.SalesOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.InventoryLocation)
            .WithMany()
            .HasForeignKey(x => x.InventoryLocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.AssignedEmployee)
            .WithMany()
            .HasForeignKey(x => x.AssignedEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Lines)
            .WithOne(l => l.PickTask)
            .HasForeignKey(l => l.PickTaskId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
