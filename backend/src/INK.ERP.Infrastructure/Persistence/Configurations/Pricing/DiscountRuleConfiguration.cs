using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Infrastructure.Persistence.Configurations.Pricing;

public class DiscountRuleConfiguration : IEntityTypeConfiguration<DiscountRule>
{
    public void Configure(EntityTypeBuilder<DiscountRule> builder)
    {
        builder.ToTable("discount_rules", "pricing");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.CompanyId)
            .IsRequired();

        builder.Property(d => d.RuleCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(d => d.RuleName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(d => d.Description)
            .HasMaxLength(1000);

        builder.Property(d => d.DiscountMethod)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(d => d.DiscountValue)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(d => d.Scope)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(d => d.MaximumDiscountAmount)
            .HasColumnType("decimal(18,2)");

        builder.Property(d => d.EffectiveFrom)
            .IsRequired();

        builder.Property(d => d.Priority)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(d => d.Status)
            .IsRequired()
            .HasConversion<int>()
            .HasDefaultValue(DiscountRuleStatus.Draft);

        builder.Property(d => d.IsActive)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(d => d.ActivatedBy).HasMaxLength(100);
        builder.Property(d => d.DeactivatedBy).HasMaxLength(100);
        builder.Property(d => d.ArchivedBy).HasMaxLength(100);

        builder.HasOne(d => d.Customer)
            .WithMany()
            .HasForeignKey(d => d.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Product)
            .WithMany()
            .HasForeignKey(d => d.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.PriceList)
            .WithMany()
            .HasForeignKey(d => d.PriceListId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(d => !d.IsDeleted);

        builder.HasIndex(d => new { d.CompanyId, d.Scope, d.Status });
        builder.HasIndex(d => d.Status);
    }
}
