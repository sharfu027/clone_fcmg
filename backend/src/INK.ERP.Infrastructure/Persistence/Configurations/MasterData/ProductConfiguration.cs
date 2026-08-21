using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Infrastructure.Persistence.Configurations.MasterData;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products", "product");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Code)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(p => p.Sku)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(p => p.Barcode)
            .HasMaxLength(50);

        builder.Property(p => p.HsnCode)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("1006");

        builder.Property(p => p.GstRatePercent)
            .IsRequired()
            .HasColumnType("decimal(5,2)")
            .HasDefaultValue(5.0m);

        builder.Property(p => p.Mrp)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(p => p.BasePrice)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(p => p.MinOrderQty)
            .IsRequired()
            .HasColumnType("decimal(12,4)")
            .HasDefaultValue(1.0m);

        builder.HasOne(p => p.Company)
            .WithMany()
            .HasForeignKey(p => p.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Brand)
            .WithMany()
            .HasForeignKey(p => p.BrandId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.BaseUom)
            .WithMany()
            .HasForeignKey(p => p.BaseUomId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => new { p.CompanyId, p.Code })
            .IsUnique()
            ;

        builder.HasIndex(p => new { p.CompanyId, p.Sku })
            .IsUnique()
            ;
    }
}
