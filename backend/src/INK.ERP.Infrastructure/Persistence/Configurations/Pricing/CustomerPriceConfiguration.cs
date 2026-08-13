using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Pricing;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Pricing;

public class CustomerPriceConfiguration : IEntityTypeConfiguration<CustomerPrice>
{
    public void Configure(EntityTypeBuilder<CustomerPrice> builder)
    {
        builder.ToTable("customer_prices", "pricing");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.CompanyId)
            .IsRequired();

        builder.Property(c => c.CustomerId)
            .IsRequired();

        builder.Property(c => c.PriceListId)
            .IsRequired();

        builder.Property(c => c.ProductId)
            .IsRequired();

        builder.Property(c => c.BasePrice)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(c => c.CustomerPriceValue)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(c => c.MinAllowedPrice)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(c => c.CurrencyCode)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("INR");

        builder.Property(c => c.EffectiveFrom)
            .IsRequired();

        builder.Property(c => c.EffectiveTo);

        builder.Property(c => c.Status)
            .IsRequired()
            .HasConversion<int>()
            .HasDefaultValue(CustomerPriceStatus.Draft);

        builder.Property(c => c.IsActive)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(c => c.ActivatedBy).HasMaxLength(100);
        builder.Property(c => c.DeactivatedBy).HasMaxLength(100);
        builder.Property(c => c.ArchivedBy).HasMaxLength(100);

        builder.HasOne(c => c.Customer)
            .WithMany()
            .HasForeignKey(c => c.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.PriceList)
            .WithMany()
            .HasForeignKey(c => c.PriceListId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Product)
            .WithMany()
            .HasForeignKey(c => c.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(c => !c.IsDeleted);

        builder.HasIndex(c => new { c.CompanyId, c.CustomerId, c.ProductId, c.Status });
        builder.HasIndex(c => new { c.CompanyId, c.PriceListId });
        builder.HasIndex(c => c.Status);
    }
}
