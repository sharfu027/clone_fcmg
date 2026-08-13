using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Infrastructure.Persistence.Configurations.IAM;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens", "iam");

        builder.HasKey(rt => rt.Id);
        builder.Property(rt => rt.Id).ValueGeneratedNever();

        builder.Property(rt => rt.Token).HasMaxLength(250).IsRequired();
        builder.Property(rt => rt.CreatedByIp).HasMaxLength(50).IsRequired();
        builder.Property(rt => rt.RevokedByIp).HasMaxLength(50);
        builder.Property(rt => rt.ReplacedByToken).HasMaxLength(250);
        builder.Property(rt => rt.ReasonRevoked).HasMaxLength(250);

        builder.Property(rt => rt.CreatedBy).HasMaxLength(100);
        builder.Property(rt => rt.ModifiedBy).HasMaxLength(100);
        builder.Property(rt => rt.ConcurrencyToken).HasMaxLength(100).IsConcurrencyToken();

        builder.HasQueryFilter(rt => !rt.IsDeleted);

        builder.HasIndex(rt => rt.Token).HasDatabaseName("idx_refresh_tokens_token");
        builder.HasIndex(rt => rt.UserId).HasDatabaseName("idx_refresh_tokens_user_id");

        // Relationships
        builder.HasOne(rt => rt.User)
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
