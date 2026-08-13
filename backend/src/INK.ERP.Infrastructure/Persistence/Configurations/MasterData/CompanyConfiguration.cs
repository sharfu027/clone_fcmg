using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Enums.MasterData;

namespace INK.ERP.Infrastructure.Persistence.Configurations.MasterData;

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("companies", "organization");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.TenantId)
            .IsRequired(false);

        builder.Property(c => c.Code)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.LegalName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.TradeName)
            .HasMaxLength(150);

        builder.Property(c => c.TaxRegistrationNumber)
            .IsRequired()
            .HasMaxLength(15);

        builder.Property(c => c.PanNumber)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(c => c.CinNumber)
            .HasMaxLength(21);

        builder.Property(c => c.Email)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Phone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.Website)
            .HasMaxLength(150);

        builder.Property(c => c.LogoUrl)
            .HasMaxLength(255);

        builder.Property(c => c.CurrencyId)
            .IsRequired(false);

        builder.Property(c => c.CurrencyCode)
            .IsRequired()
            .HasMaxLength(3)
            .HasDefaultValue("INR");

        builder.Property(c => c.FinancialYearStartMonth)
            .IsRequired()
            .HasDefaultValue(4);

        builder.Property(c => c.TimeZoneId)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("Asia/Kolkata");

        builder.Property(c => c.Status)
            .HasConversion<int>()
            .IsRequired()
            .HasDefaultValue(CompanyStatus.Active);

        builder.Property(c => c.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(c => c.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.OwnsOne(c => c.Address, address =>
        {
            address.Property<Guid?>("CountryId").HasColumnName("country_id").IsRequired(false);
            address.Property(a => a.AddressLine1).HasColumnName("address_line1").HasMaxLength(150).IsRequired();
            address.Property(a => a.AddressLine2).HasColumnName("address_line2").HasMaxLength(150);
            address.Property(a => a.City).HasColumnName("city").HasMaxLength(50).IsRequired();
            address.Property(a => a.State).HasColumnName("state").HasMaxLength(50).IsRequired();
            address.Property(a => a.PostalCode).HasColumnName("postal_code").HasMaxLength(15).IsRequired();
            address.Property(a => a.Country).HasColumnName("country").HasMaxLength(50).IsRequired();
        });

        // EF Core Concurrency Token via RowVersion
        builder.Property(c => c.RowVersion).IsRowVersion();

        // Query Filter for Soft Delete
        builder.HasQueryFilter(c => !c.IsDeleted);

        // Filtered Unique Indexes
        builder.HasIndex(c => c.Code)
            .IsUnique()
            ;

        builder.HasIndex(c => c.TaxRegistrationNumber)
            .IsUnique()
            ;

        builder.HasIndex(c => c.Status);
        builder.HasIndex(c => c.TenantId);
    }
}
