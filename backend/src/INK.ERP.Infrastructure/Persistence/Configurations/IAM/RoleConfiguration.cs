using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Common;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class RoleConfiguration : IEntityTypeConfiguration<ApplicationRole>
{
    public void Configure(EntityTypeBuilder<ApplicationRole> builder)
    {
        builder.ToTable("roles", "iam");

        builder.Property(r => r.Code).HasMaxLength(100).IsRequired();
        builder.Property(r => r.Description).HasMaxLength(250);
        builder.Property(r => r.CreatedBy).HasMaxLength(100);
        builder.Property(r => r.ModifiedBy).HasMaxLength(100);
        builder.Property(r => r.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        builder.HasQueryFilter(r => !r.IsDeleted);

        builder.HasIndex(r => r.Code).IsUnique().HasDatabaseName("uq_roles_code");
        builder.HasIndex(r => r.NormalizedName).HasDatabaseName("idx_roles_normalized_name");
    }
}
