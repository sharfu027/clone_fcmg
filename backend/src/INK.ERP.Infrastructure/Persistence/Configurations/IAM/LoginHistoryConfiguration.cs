using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class LoginHistoryConfiguration : IEntityTypeConfiguration<LoginHistory>
{
    public void Configure(EntityTypeBuilder<LoginHistory> builder)
    {
        builder.ToTable("login_histories", "iam");

        builder.HasKey(lh => lh.Id);
        builder.Property(lh => lh.Id).ValueGeneratedNever();

        builder.Property(lh => lh.Username).HasMaxLength(100).IsRequired();
        builder.Property(lh => lh.Reason).HasMaxLength(250).IsRequired();
        builder.Property(lh => lh.Browser).HasMaxLength(500).IsRequired();
        builder.Property(lh => lh.Device).HasMaxLength(100).IsRequired();
        builder.Property(lh => lh.OS).HasMaxLength(100).IsRequired();
        builder.Property(lh => lh.IP).HasMaxLength(50).IsRequired();
        builder.Property(lh => lh.Country).HasMaxLength(100).IsRequired();
        
        // Precision for Latitude/Longitude decimal coordinates
        builder.Property(lh => lh.Latitude).HasPrecision(9, 6);
        builder.Property(lh => lh.Longitude).HasPrecision(9, 6);

        builder.Property(lh => lh.CreatedBy).HasMaxLength(100);
        builder.Property(lh => lh.ModifiedBy).HasMaxLength(100);
        builder.Property(lh => lh.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        builder.HasQueryFilter(lh => !lh.IsDeleted);

        builder.HasIndex(lh => lh.UserId).HasDatabaseName("idx_login_histories_user_id");
        builder.HasIndex(lh => lh.Username).HasDatabaseName("idx_login_histories_username");

        // Relationships
        builder.HasOne(lh => lh.User)
            .WithMany()
            .HasForeignKey(lh => lh.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
