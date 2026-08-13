using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Common;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class UserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("users", "iam");

        builder.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.LastName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.DisplayName).HasMaxLength(150).IsRequired();
        builder.Property(u => u.PreferredLanguage).HasMaxLength(10).HasDefaultValue("en");
        builder.Property(u => u.TimeZone).HasMaxLength(50).HasDefaultValue("UTC");
        builder.Property(u => u.ProfileImageUrl).HasMaxLength(500);

        builder.Property(u => u.CreatedBy).HasMaxLength(100);
        builder.Property(u => u.ModifiedBy).HasMaxLength(100);
        builder.Property(u => u.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        // Soft Delete filter
        builder.HasQueryFilter(u => !u.IsDeleted);

        // Indexes
        builder.HasIndex(u => u.NormalizedUserName).HasDatabaseName("idx_users_normalized_username");
        builder.HasIndex(u => u.NormalizedEmail).HasDatabaseName("idx_users_normalized_email");
        builder.HasIndex(u => u.EmployeeId).HasDatabaseName("idx_users_employee_id");
    }
}
