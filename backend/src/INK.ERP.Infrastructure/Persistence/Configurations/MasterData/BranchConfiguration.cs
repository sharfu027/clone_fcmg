using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Infrastructure.Persistence.Configurations.MasterData;

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("branches", "organization");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Code)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(b => b.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(b => b.Gstin)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(b => b.Email)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(b => b.Phone)
            .IsRequired()
            .HasMaxLength(20);

        builder.OwnsOne(b => b.Address, address =>
        {
            address.Property(a => a.AddressLine1).HasColumnName("address_line1").HasMaxLength(150).IsRequired();
            address.Property(a => a.AddressLine2).HasColumnName("address_line2").HasMaxLength(150);
            address.Property(a => a.City).HasColumnName("city").HasMaxLength(50).IsRequired();
            address.Property(a => a.State).HasColumnName("state").HasMaxLength(50).IsRequired();
            address.Property(a => a.PostalCode).HasColumnName("postal_code").HasMaxLength(15).IsRequired();
            address.Property(a => a.Country).HasColumnName("country").HasMaxLength(50).IsRequired();
        });

        builder.HasOne(b => b.Company)
            .WithMany()
            .HasForeignKey(b => b.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(b => new { b.CompanyId, b.Code })
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");
    }
}
