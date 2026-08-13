using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Pricing;

public class ExchangeRateConfiguration : IEntityTypeConfiguration<ExchangeRate>
{
    public void Configure(EntityTypeBuilder<ExchangeRate> builder)
    {
        builder.ToTable("exchange_rates", "pricing");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.FromCurrencyCode).IsRequired().HasMaxLength(10);
        builder.Property(e => e.ToCurrencyCode).IsRequired().HasMaxLength(10);
        builder.Property(e => e.Rate).IsRequired().HasPrecision(18, 8);
        builder.Property(e => e.EffectiveFrom).IsRequired();
        builder.Property(e => e.EffectiveTo);
        builder.Property(e => e.Status).IsRequired().HasConversion<int>().HasDefaultValue(ExchangeRateStatus.Draft);
        builder.Property(e => e.Source).IsRequired().HasConversion<int>().HasDefaultValue(RateSource.Manual);
        builder.Property(e => e.ConcurrencyToken).IsConcurrencyToken().HasMaxLength(64);
        builder.HasQueryFilter(e => !e.IsDeleted);
        builder.HasIndex(e => new { e.FromCurrencyCode, e.ToCurrencyCode, e.EffectiveFrom });
    }
}
