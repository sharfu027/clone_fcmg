using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Infrastructure.Persistence.Configurations.MasterData;

public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> builder)
    {
        builder.ToTable("suppliers", "supplier");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Code)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(s => s.LegalName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(s => s.TradeName)
            .HasMaxLength(150);

        builder.Property(s => s.SupplierType)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("Distributor");

        builder.Property(s => s.Gstin)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(s => s.Pan)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(s => s.Email)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Phone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(s => s.PaymentTermsDays)
            .IsRequired()
            .HasDefaultValue(30);

        builder.Property(s => s.CreditLimit)
            .HasColumnType("decimal(18,2)");

        builder.OwnsOne(s => s.Address, address =>
        {
            address.Property(a => a.AddressLine1).HasColumnName("address_line1").HasMaxLength(150).IsRequired();
            address.Property(a => a.AddressLine2).HasColumnName("address_line2").HasMaxLength(150);
            address.Property(a => a.City).HasColumnName("city").HasMaxLength(50).IsRequired();
            address.Property(a => a.State).HasColumnName("state").HasMaxLength(50).IsRequired();
            address.Property(a => a.PostalCode).HasColumnName("postal_code").HasMaxLength(15).IsRequired();
            address.Property(a => a.Country).HasColumnName("country").HasMaxLength(50).IsRequired();
        });

        builder.HasOne(s => s.Company)
            .WithMany()
            .HasForeignKey(s => s.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => new { s.CompanyId, s.Code })
            .IsUnique()
            ;

        builder.HasIndex(s => new { s.CompanyId, s.Gstin })
            .IsUnique()
            ;
    }
}
