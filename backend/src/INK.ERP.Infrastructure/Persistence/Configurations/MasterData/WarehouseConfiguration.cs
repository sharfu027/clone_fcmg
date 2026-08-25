using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities;

namespace INK.ERP.Infrastructure.Persistence.Configurations.MasterData;

public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> builder)
    {
        builder.ToTable("warehouses", "warehouse");

        builder.HasKey(w => w.Id);

        builder.Property(w => w.Code)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(w => w.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(w => w.WarehouseType)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("Central Warehouse");

        builder.Property(w => w.Status)
            .IsRequired()
            .HasMaxLength(30)
            .HasDefaultValue("Active");

        builder.Property(w => w.PalletCapacity);
        builder.Property(w => w.CartonCapacity);
        builder.Property(w => w.ContactNumber).HasMaxLength(30);
        builder.Property(w => w.Email).HasMaxLength(100);
        builder.Property(w => w.Latitude);
        builder.Property(w => w.Longitude);
        builder.Property(w => w.Remarks).HasMaxLength(500);

        builder.OwnsOne(w => w.Address, address =>
        {
            address.Property(a => a.AddressLine1).HasColumnName("address_line1").HasMaxLength(150).IsRequired();
            address.Property(a => a.AddressLine2).HasColumnName("address_line2").HasMaxLength(150);
            address.Property(a => a.City).HasColumnName("city").HasMaxLength(50).IsRequired();
            address.Property(a => a.State).HasColumnName("state").HasMaxLength(50).IsRequired();
            address.Property(a => a.PostalCode).HasColumnName("postal_code").HasMaxLength(15).IsRequired();
            address.Property(a => a.Country).HasColumnName("country").HasMaxLength(50).IsRequired();
        });

        builder.Property(w => w.CompanyId)
            .IsRequired();

        builder.Property(w => w.BranchId)
            .IsRequired(false);

        builder.HasOne(w => w.Company)
            .WithMany()
            .HasForeignKey(w => w.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(w => w.Branch)
            .WithMany()
            .HasForeignKey(w => w.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(w => w.ManagerEmployeeId)
            .IsRequired(false);

        builder.HasOne(w => w.ManagerEmployee)
            .WithMany()
            .HasForeignKey(w => w.ManagerEmployeeId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(w => new { w.CompanyId, w.Code })
            .IsUnique();
    }
}
