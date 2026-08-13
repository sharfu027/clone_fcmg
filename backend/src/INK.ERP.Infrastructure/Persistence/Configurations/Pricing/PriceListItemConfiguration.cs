using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Pricing;

public class PriceListItemConfiguration : IEntityTypeConfiguration<PriceListItem>
{
    public void Configure(EntityTypeBuilder<PriceListItem> builder)
    {
        builder.ToTable("price_list_items", "pricing");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.PriceListId)
            .IsRequired();

        builder.Property(i => i.ProductId)
            .IsRequired();

        builder.Property(i => i.Price)
            .IsRequired()
            .HasColumnType("decimal(18,4)");

        builder.Property(i => i.CurrencyCode)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("INR");

        builder.Property(i => i.EffectiveDate)
            .IsRequired();

        builder.Property(i => i.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(i => i.ConcurrencyToken)
            .IsConcurrencyToken()
            .HasMaxLength(64);

        builder.HasQueryFilter(i => !i.IsDeleted);

        builder.HasIndex(i => new { i.PriceListId, i.ProductId })
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");
    }
}
