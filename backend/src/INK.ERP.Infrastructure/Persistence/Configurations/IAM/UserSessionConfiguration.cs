using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.ToTable("user_sessions", "iam");

        builder.HasKey(us => us.Id);
        builder.Property(us => us.Id).ValueGeneratedNever();

        builder.Property(us => us.JwtId).HasMaxLength(250).IsRequired();
        builder.Property(us => us.Device).HasMaxLength(100).IsRequired();
        builder.Property(us => us.Browser).HasMaxLength(100).IsRequired();
        builder.Property(us => us.OperatingSystem).HasMaxLength(100).IsRequired();
        builder.Property(us => us.IpAddress).HasMaxLength(50).IsRequired();
        builder.Property(us => us.Location).HasMaxLength(250);

        builder.Property(us => us.CreatedBy).HasMaxLength(100);
        builder.Property(us => us.ModifiedBy).HasMaxLength(100);
        builder.Property(us => us.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        builder.HasQueryFilter(us => !us.IsDeleted);

        builder.HasIndex(us => us.JwtId).HasDatabaseName("idx_user_sessions_jwt_id");
        builder.HasIndex(us => us.UserId).HasDatabaseName("idx_user_sessions_user_id");

        // Relationships
        builder.HasOne(us => us.User)
            .WithMany()
            .HasForeignKey(us => us.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
