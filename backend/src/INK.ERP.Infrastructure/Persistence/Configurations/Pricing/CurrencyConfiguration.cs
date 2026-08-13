using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Pricing;

public class CurrencyConfiguration : IEntityTypeConfiguration<Currency>
{
    public void Configure(EntityTypeBuilder<Currency> builder)
    {
        builder.ToTable("currencies", "pricing");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Code).IsRequired().HasMaxLength(10);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Symbol).IsRequired().HasMaxLength(10);
        builder.Property(c => c.DecimalPlaces).IsRequired().HasDefaultValue(2);
        builder.Property(c => c.IsBaseCurrency).IsRequired().HasDefaultValue(false);
        builder.Property(c => c.Status).IsRequired().HasConversion<int>().HasDefaultValue(CurrencyStatus.Active);
        builder.Property(c => c.ConcurrencyToken).IsConcurrencyToken().HasMaxLength(64);
        builder.HasQueryFilter(c => !c.IsDeleted);
        builder.HasIndex(c => c.Code).IsUnique().HasFilter("\"IsDeleted\" = false");
    }
}
