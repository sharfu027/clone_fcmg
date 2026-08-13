using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class UserPreferenceConfiguration : IEntityTypeConfiguration<UserPreference>
{
    public void Configure(EntityTypeBuilder<UserPreference> builder)
    {
        builder.ToTable("user_preferences", "iam");

        builder.HasKey(up => up.Id);
        builder.Property(up => up.Id).ValueGeneratedNever();

        builder.Property(up => up.Theme).HasMaxLength(50).HasDefaultValue("Light");
        builder.Property(up => up.Language).HasMaxLength(10).HasDefaultValue("en");
        builder.Property(up => up.TimeZone).HasMaxLength(50).HasDefaultValue("UTC");
        builder.Property(up => up.DateFormat).HasMaxLength(50).HasDefaultValue("yyyy-MM-dd");
        builder.Property(up => up.NumberFormat).HasMaxLength(50).HasDefaultValue("en-US");
        builder.Property(up => up.NotificationPreferences).HasMaxLength(1000).IsRequired();

        builder.Property(up => up.CreatedBy).HasMaxLength(100);
        builder.Property(up => up.ModifiedBy).HasMaxLength(100);
        builder.Property(up => up.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        builder.HasQueryFilter(up => !up.IsDeleted);

        builder.HasIndex(up => up.UserId).IsUnique().HasDatabaseName("idx_user_preferences_user_id");

        // Relationships
        builder.HasOne(up => up.User)
            .WithOne()
            .HasForeignKey<UserPreference>(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
