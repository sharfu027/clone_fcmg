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
            .HasMaxLength(30)
            .HasDefaultValue("CentralDepot");

        builder.OwnsOne(w => w.Address, address =>
        {
            address.Property(a => a.AddressLine1).HasColumnName("address_line1").HasMaxLength(150).IsRequired();
            address.Property(a => a.AddressLine2).HasColumnName("address_line2").HasMaxLength(150);
            address.Property(a => a.City).HasColumnName("city").HasMaxLength(50).IsRequired();
            address.Property(a => a.State).HasColumnName("state").HasMaxLength(50).IsRequired();
            address.Property(a => a.PostalCode).HasColumnName("postal_code").HasMaxLength(15).IsRequired();
            address.Property(a => a.Country).HasColumnName("country").HasMaxLength(50).IsRequired();
        });

        builder.HasIndex(w => new { w.CompanyId, w.Code })
            .IsUnique()
            ;
    }
}
