using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class PermissionGroupConfiguration : IEntityTypeConfiguration<PermissionGroup>
{
    public void Configure(EntityTypeBuilder<PermissionGroup> builder)
    {
        builder.ToTable("permission_groups", "iam");

        builder.HasKey(pg => pg.Id);
        builder.Property(pg => pg.Id).ValueGeneratedNever();

        builder.Property(pg => pg.Name).HasMaxLength(100).IsRequired();
        builder.Property(pg => pg.Code).HasMaxLength(100).IsRequired();
        builder.Property(pg => pg.Description).HasMaxLength(250);
        builder.Property(pg => pg.CreatedBy).HasMaxLength(100);
        builder.Property(pg => pg.ModifiedBy).HasMaxLength(100);
        builder.Property(pg => pg.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        builder.HasQueryFilter(pg => !pg.IsDeleted);

        builder.HasIndex(pg => pg.Code).IsUnique().HasDatabaseName("uq_permission_groups_code");
    }
}
