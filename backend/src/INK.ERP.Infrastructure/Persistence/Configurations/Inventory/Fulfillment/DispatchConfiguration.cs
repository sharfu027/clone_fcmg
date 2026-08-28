using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Inventory.Fulfillment;

public class DispatchConfiguration : IEntityTypeConfiguration<Dispatch>
{
    public void Configure(EntityTypeBuilder<Dispatch> builder)
    {
        builder.ToTable("dispatches", "inventory");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CompanyId).IsRequired();
        builder.Property(x => x.SalesOrderId).IsRequired();
        builder.Property(x => x.PackTaskId).IsRequired(false);
        builder.Property(x => x.DispatchNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.DispatchStatus).HasMaxLength(30).IsRequired();

        builder.Property(x => x.VehicleNumber).HasMaxLength(50).IsRequired(false);
        builder.Property(x => x.DriverName).HasMaxLength(100).IsRequired(false);
        builder.Property(x => x.DriverPhone).HasMaxLength(30).IsRequired(false);
        builder.Property(x => x.TransporterName).HasMaxLength(100).IsRequired(false);
        builder.Property(x => x.WaybillNumber).HasMaxLength(100).IsRequired(false);

        builder.Property(x => x.DispatchedAtUtc).IsRequired(false);
        builder.Property(x => x.DispatchedByEmployeeId).IsRequired(false);
        builder.Property(x => x.Notes).HasMaxLength(1000).IsRequired(false);
        builder.Property(x => x.ConcurrencyToken).HasMaxLength(200).IsRequired();

        // Indexes
        builder.HasIndex(x => new { x.CompanyId, x.DispatchNumber }).IsUnique();
        builder.HasIndex(x => new { x.CompanyId, x.SalesOrderId });
        builder.HasIndex(x => new { x.CompanyId, x.PackTaskId });
        builder.HasIndex(x => new { x.CompanyId, x.DispatchStatus });
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

        builder.HasOne(x => x.PackTask)
            .WithMany()
            .HasForeignKey(x => x.PackTaskId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.DispatchedByEmployee)
            .WithMany()
            .HasForeignKey(x => x.DispatchedByEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Lines)
            .WithOne(l => l.Dispatch)
            .HasForeignKey(l => l.DispatchId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
