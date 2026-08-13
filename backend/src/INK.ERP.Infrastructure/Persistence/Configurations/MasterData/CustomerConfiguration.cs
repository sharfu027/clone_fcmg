using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Infrastructure.Persistence.Configurations.MasterData;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers", "customer");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Code)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.LegalName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.TradeName)
            .HasMaxLength(150);

        builder.Property(c => c.CustomerType)
            .IsRequired()
            .HasMaxLength(30)
            .HasDefaultValue("Retailer");

        builder.Property(c => c.Gstin)
            .HasMaxLength(30);

        builder.Property(c => c.Pan)
            .HasMaxLength(20);

        builder.Property(c => c.Email)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Phone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.CreditLimit)
            .IsRequired()
            .HasColumnType("decimal(18,2)")
            .HasDefaultValue(50000.00m);

        builder.Property(c => c.CreditDays)
            .IsRequired()
            .HasDefaultValue(30);

        builder.OwnsOne(c => c.Address, address =>
        {
            address.Property(a => a.AddressLine1).HasColumnName("address_line1").HasMaxLength(150).IsRequired();
            address.Property(a => a.AddressLine2).HasColumnName("address_line2").HasMaxLength(150);
            address.Property(a => a.City).HasColumnName("city").HasMaxLength(50).IsRequired();
            address.Property(a => a.State).HasColumnName("state").HasMaxLength(50).IsRequired();
            address.Property(a => a.PostalCode).HasColumnName("postal_code").HasMaxLength(15).IsRequired();
            address.Property(a => a.Country).HasColumnName("country").HasMaxLength(50).IsRequired();
        });

        builder.HasOne(c => c.Company)
            .WithMany()
            .HasForeignKey(c => c.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => new { c.CompanyId, c.Code })
            .IsUnique()
            ;
    }
}
