using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Infrastructure.Persistence.Configurations.MasterData;

public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.ToTable("departments", "organization");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.CompanyId)
            .IsRequired();

        builder.Property(d => d.BranchId)
            .IsRequired(false);

        builder.Property(d => d.Code)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(d => d.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(d => d.Description)
            .HasMaxLength(250);

        builder.HasOne(d => d.Company)
            .WithMany()
            .HasForeignKey(d => d.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Branch)
            .WithMany()
            .HasForeignKey(d => d.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => new { d.CompanyId, d.Code })
            .IsUnique();
    }
}
