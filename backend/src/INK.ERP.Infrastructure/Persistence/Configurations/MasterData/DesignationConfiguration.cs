using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Infrastructure.Persistence.Configurations.MasterData;

public class DesignationConfiguration : IEntityTypeConfiguration<Designation>
{
    public void Configure(EntityTypeBuilder<Designation> builder)
    {
        builder.ToTable("designations", "organization");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Code)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(d => d.Title)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(d => d.Level)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(d => d.ApprovalLimit)
            .HasColumnType("decimal(18,2)");

        builder.HasOne(d => d.Company)
            .WithMany()
            .HasForeignKey(d => d.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => new { d.CompanyId, d.Code })
            .IsUnique()
            ;
    }
}
