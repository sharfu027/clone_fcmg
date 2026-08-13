using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("role_permissions", "iam");

        builder.HasKey(rp => rp.Id);
        builder.Property(rp => rp.Id).ValueGeneratedNever();

        builder.Property(rp => rp.CreatedBy).HasMaxLength(100);
        builder.Property(rp => rp.ModifiedBy).HasMaxLength(100);
        builder.Property(rp => rp.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        builder.HasQueryFilter(rp => !rp.IsDeleted);

        builder.HasIndex(rp => new { rp.RoleId, rp.PermissionId }).IsUnique().HasDatabaseName("uq_role_permissions_composite");

        // Relationships
        builder.HasOne(rp => rp.Role)
            .WithMany()
            .HasForeignKey(rp => rp.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(rp => rp.Permission)
            .WithMany(p => p.RolePermissions)
            .HasForeignKey(rp => rp.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
