using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace INK.ERP.Infrastructure.Migrations;

/// <inheritdoc />
public partial class AddProductionOtpEntity : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "user_otps",
            schema: "iam",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ChallengeId = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                OtpHash = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                AttemptCount = table.Column<int>(type: "integer", nullable: false),
                ResendCount = table.Column<int>(type: "integer", nullable: false),
                IsUsed = table.Column<bool>(type: "boolean", nullable: false),
                IsInvalidated = table.Column<bool>(type: "boolean", nullable: false),
                GeneratedByIp = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                UsedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                ModifiedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                DeletedBy = table.Column<string>(type: "text", nullable: true),
                DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                ConcurrencyToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_user_otps", x => x.Id);
                table.ForeignKey(
                    name: "FK_user_otps_users_UserId",
                    column: x => x.UserId,
                    principalSchema: "iam",
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "idx_user_otps_challenge_id",
            schema: "iam",
            table: "user_otps",
            column: "ChallengeId");

        migrationBuilder.CreateIndex(
            name: "idx_user_otps_expires_at",
            schema: "iam",
            table: "user_otps",
            column: "ExpiresAtUtc");

        migrationBuilder.CreateIndex(
            name: "idx_user_otps_is_used",
            schema: "iam",
            table: "user_otps",
            column: "IsUsed");

        migrationBuilder.CreateIndex(
            name: "idx_user_otps_user_id",
            schema: "iam",
            table: "user_otps",
            column: "UserId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "user_otps",
            schema: "iam");
    }
}
