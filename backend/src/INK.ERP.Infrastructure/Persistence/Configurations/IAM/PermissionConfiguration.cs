using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("permissions", "iam");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();

        builder.Property(p => p.Name).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Code).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Description).HasMaxLength(250);
        builder.Property(p => p.CreatedBy).HasMaxLength(100);
        builder.Property(p => p.ModifiedBy).HasMaxLength(100);
        builder.Property(p => p.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        builder.HasQueryFilter(p => !p.IsDeleted);

        builder.HasIndex(p => p.Code).IsUnique().HasDatabaseName("uq_permissions_code");

        // Relationships
        builder.HasOne(p => p.PermissionGroup)
            .WithMany(pg => pg.Permissions)
            .HasForeignKey(p => p.PermissionGroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
