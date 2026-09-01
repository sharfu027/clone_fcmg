using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace INK.ERP.Infrastructure.Migrations;
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "organization");

            migrationBuilder.EnsureSchema(
                name: "product");

            migrationBuilder.EnsureSchema(
                name: "customer");

            migrationBuilder.EnsureSchema(
                name: "iam");

            migrationBuilder.EnsureSchema(
                name: "hr");

            migrationBuilder.EnsureSchema(
                name: "pricing");

            migrationBuilder.EnsureSchema(
                name: "sales");

            migrationBuilder.EnsureSchema(
                name: "supplier");

            migrationBuilder.EnsureSchema(
                name: "warehouse");

            migrationBuilder.CreateTable(
                name: "companies",
                schema: "organization",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: true),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    LegalName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    TradeName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    TaxRegistrationNumber = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    PanNumber = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CinNumber = table.Column<string>(type: "character varying(21)", maxLength: 21, nullable: true),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Website = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    LogoUrl = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    CurrencyId = table.Column<Guid>(type: "uuid", nullable: true),
                    CurrencyCode = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false, defaultValue: "INR"),
                    FinancialYearStartMonth = table.Column<int>(type: "integer", nullable: false, defaultValue: 4),
                    TimeZoneId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Asia/Kolkata"),
                    address_line1 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    address_line2 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    city = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    state = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    postal_code = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    country = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    country_id = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_companies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "face_profiles",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ActiveTemplateVersion = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    ModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_face_profiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "outbox_messages",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    OccurredOnUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedOnUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Error = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outbox_messages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "permission_groups",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("PK_permission_groups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "price_lists",
                schema: "pricing",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    ModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_price_lists", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "registered_devices",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    fingerprint_hash = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    client_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    device_model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    operating_system = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ApprovedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ApprovedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastHeartbeatUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastIpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RejectionOrRevocationReason = table.Column<string>(type: "text", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    ModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_registered_devices", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    IsSystem = table.Column<bool>(type: "boolean", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ModifiedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "sales_orders",
                schema: "sales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    SalesEmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    InventoryLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    OrderNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OrderStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Draft"),
                    OrderDateUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Subtotal = table.Column<decimal>(type: "numeric(18,4)", nullable: false, defaultValue: 0m),
                    DiscountAmount = table.Column<decimal>(type: "numeric(18,4)", nullable: false, defaultValue: 0m),
                    TaxAmount = table.Column<decimal>(type: "numeric(18,4)", nullable: false, defaultValue: 0m),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,4)", nullable: false, defaultValue: 0m),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CaptureLatitude = table.Column<double>(type: "double precision", nullable: true),
                    CaptureLongitude = table.Column<double>(type: "double precision", nullable: true),
                    CaptureAccuracyMeters = table.Column<double>(type: "double precision", nullable: true),
                    DistanceToCustomerMeters = table.Column<double>(type: "double precision", nullable: true),
                    IsGpsVerified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsFaceVerified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    VerifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sales_orders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "security_audit_logs",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PerformedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CorrelationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RequestId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OldValues = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    NewValues = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
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
                    table.PrimaryKey("PK_security_audit_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "security_incidents",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsResolved = table.Column<bool>(type: "boolean", nullable: false),
                    IsEscalated = table.Column<bool>(type: "boolean", nullable: false),
                    ResolutionNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ResolvedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    ModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_security_incidents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "security_policies",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    FaceMode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MinFaceConfidenceScore = table.Column<float>(type: "real", nullable: false),
                    GpsMode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MaxAllowedGpsRadiusMeters = table.Column<double>(type: "double precision", nullable: false),
                    PasswordMinLength = table.Column<int>(type: "integer", nullable: false),
                    PasswordRequireSpecialChar = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutThresholdAttempts = table.Column<int>(type: "integer", nullable: false),
                    AttendanceMode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RequireDeviceRegistration = table.Column<bool>(type: "boolean", nullable: false),
                    MaxDevicesPerUser = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    ModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_security_policies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "user_security_policies",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FaceModeOverride = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    GpsModeOverride = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    MaxAllowedGpsRadiusMetersOverride = table.Column<double>(type: "double precision", nullable: true),
                    AttendanceModeOverride = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RequireDeviceRegistrationOverride = table.Column<bool>(type: "boolean", nullable: true),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    ModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_security_policies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    DisplayName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsLocked = table.Column<bool>(type: "boolean", nullable: false),
                    LastLoginUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastPasswordChangedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RequirePasswordChange = table.Column<bool>(type: "boolean", nullable: false),
                    PreferredLanguage = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "en"),
                    TimeZone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "UTC"),
                    ProfileImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ModifiedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "warehouses",
                schema: "warehouse",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "CentralDepot"),
                    ManagerEmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    address_line1 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    address_line2 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    city = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    state = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    postal_code = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    country = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CapacitySqFt = table.Column<double>(type: "double precision", nullable: true),
                    IsTemperatureControlled = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "branches",
                schema: "organization",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Gstin = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    address_line1 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    address_line2 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    city = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    state = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    postal_code = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    country = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsHeadquarters = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    ModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "text", nullable: false),
                    ManagerEmployeeId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_branches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_branches_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "organization",
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "brands",
                schema: "product",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ManufacturerName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    OriginCountry = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_brands", x => x.Id);
                    table.ForeignKey(
                        name: "FK_brands_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "organization",
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "categories",
                schema: "product",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ParentCategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    GstTaxRatePercent = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 5.0m),
                    HsnCodeDefault = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "1006"),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_categories_categories_ParentCategoryId",
                        column: x => x.ParentCategoryId,
                        principalSchema: "product",
                        principalTable: "categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_categories_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "organization",
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "customers",
                schema: "customer",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    LegalName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    TradeName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CustomerType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Retailer"),
                    Gstin = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Pan = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    address_line1 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    address_line2 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    city = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    state = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    postal_code = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    country = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreditLimit = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 50000.00m),
                    CreditDays = table.Column<int>(type: "integer", nullable: false, defaultValue: 30),
                    RouteId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_customers_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "organization",
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "designations",
                schema: "organization",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    ApprovalLimit = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_designations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_designations_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "organization",
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "suppliers",
                schema: "supplier",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    LegalName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    TradeName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Gstin = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Pan = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    address_line1 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    address_line2 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    city = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    state = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    postal_code = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    country = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PaymentTermsDays = table.Column<int>(type: "integer", nullable: false, defaultValue: 30),
                    CreditLimit = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suppliers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_suppliers_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "organization",
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "units_of_measure",
                schema: "product",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BaseUnitCode = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    ConversionFactor = table.Column<decimal>(type: "numeric(12,4)", nullable: false, defaultValue: 1.0m),
                    IsFractionalAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_units_of_measure", x => x.Id);
                    table.ForeignKey(
                        name: "FK_units_of_measure_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "organization",
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "face_enrollment_logs",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateVersion = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FaceProfileId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_face_enrollment_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_face_enrollment_logs_face_profiles_FaceProfileId",
                        column: x => x.FaceProfileId,
                        principalSchema: "iam",
                        principalTable: "face_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "face_templates",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    VectorData = table.Column<string>(type: "text", nullable: false),
                    AlgorithmVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    QualityScore = table.Column<float>(type: "real", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ArchivedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FaceProfileId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    ModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_face_templates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_face_templates_face_profiles_FaceProfileId",
                        column: x => x.FaceProfileId,
                        principalSchema: "iam",
                        principalTable: "face_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "face_verification_logs",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MatchScore = table.Column<float>(type: "real", nullable: false),
                    IsSuccessful = table.Column<bool>(type: "boolean", nullable: false),
                    DeviceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FaceProfileId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_face_verification_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_face_verification_logs_face_profiles_FaceProfileId",
                        column: x => x.FaceProfileId,
                        principalSchema: "iam",
                        principalTable: "face_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "permissions",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    PermissionGroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("PK_permissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_permissions_permission_groups_PermissionGroupId",
                        column: x => x.PermissionGroupId,
                        principalSchema: "iam",
                        principalTable: "permission_groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "price_list_items",
                schema: "pricing",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PriceListId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "INR"),
                    EffectiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    ModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_price_list_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_price_list_items_price_lists_PriceListId",
                        column: x => x.PriceListId,
                        principalSchema: "pricing",
                        principalTable: "price_lists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "role_claims",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_claims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_role_claims_roles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "iam",
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "email_verification_tokens",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Expiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VerifiedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_email_verification_tokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_email_verification_tokens_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "iam",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "login_histories",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Successful = table.Column<bool>(type: "boolean", nullable: false),
                    IsSuccessful = table.Column<bool>(type: "boolean", nullable: false),
                    Failed = table.Column<bool>(type: "boolean", nullable: false),
                    Reason = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    FailureReason = table.Column<string>(type: "text", nullable: true),
                    Browser = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Device = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OS = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OperatingSystem = table.Column<string>(type: "text", nullable: false),
                    IP = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: false),
                    Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Latitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    Longitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
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
                    table.PrimaryKey("PK_login_histories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_login_histories_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "iam",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "password_reset_tokens",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Expiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_password_reset_tokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_password_reset_tokens_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "iam",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FamilyId = table.Column<string>(type: "text", nullable: true),
                    ExpiresUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByIp = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RevokedByIp = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ReplacedByToken = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    ReasonRevoked = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
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
                    table.PrimaryKey("PK_refresh_tokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "iam",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_claims",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_claims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_claims_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "iam",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_logins",
                schema: "iam",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_logins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_user_logins_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "iam",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_preferences",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Theme = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Light"),
                    Language = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "en"),
                    TimeZone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "UTC"),
                    DateFormat = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "yyyy-MM-dd"),
                    NumberFormat = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "en-US"),
                    NotificationPreferences = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
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
                    table.PrimaryKey("PK_user_preferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_preferences_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "iam",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
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
                    table.PrimaryKey("PK_user_roles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_roles_roles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "iam",
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_roles_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "iam",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_sessions",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    JwtId = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    RefreshTokenId = table.Column<Guid>(type: "uuid", nullable: true),
                    Device = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Browser = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OperatingSystem = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Location = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    StartedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastActivityUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_user_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_sessions_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "iam",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_tokens",
                schema: "iam",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_tokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_user_tokens_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "iam",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "departments",
                schema: "organization",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: true),
                    ManagerEmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_departments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_departments_branches_BranchId",
                        column: x => x.BranchId,
                        principalSchema: "organization",
                        principalTable: "branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_departments_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "organization",
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "products",
                schema: "product",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    BrandId = table.Column<Guid>(type: "uuid", nullable: false),
                    BaseUomId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Sku = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Barcode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    HsnCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "1006"),
                    GstRatePercent = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 5.0m),
                    Mrp = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    BasePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MinOrderQty = table.Column<decimal>(type: "numeric(12,4)", nullable: false, defaultValue: 1.0m),
                    ShelfLifeDays = table.Column<int>(type: "integer", nullable: true),
                    IsBatchTracked = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_products_brands_BrandId",
                        column: x => x.BrandId,
                        principalSchema: "product",
                        principalTable: "brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_products_categories_CategoryId",
                        column: x => x.CategoryId,
                        principalSchema: "product",
                        principalTable: "categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_products_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "organization",
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_products_units_of_measure_BaseUomId",
                        column: x => x.BaseUomId,
                        principalSchema: "product",
                        principalTable: "units_of_measure",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "role_permissions",
                schema: "iam",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    PermissionId = table.Column<Guid>(type: "uuid", nullable: false),
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
                    table.PrimaryKey("PK_role_permissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_role_permissions_permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalSchema: "iam",
                        principalTable: "permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_role_permissions_roles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "iam",
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "employees",
                schema: "hr",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: true),
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    DesignationId = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeRoleId = table.Column<Guid>(type: "uuid", nullable: true),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: true),
                    EmployeeCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    JoiningDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Salary = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_employees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_employees_branches_BranchId",
                        column: x => x.BranchId,
                        principalSchema: "organization",
                        principalTable: "branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_employees_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "organization",
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_employees_departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalSchema: "organization",
                        principalTable: "departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_employees_designations_DesignationId",
                        column: x => x.DesignationId,
                        principalSchema: "organization",
                        principalTable: "designations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_branches_CompanyId_Code",
                schema: "organization",
                table: "branches",
                columns: new[] { "CompanyId", "Code" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_brands_CompanyId_Code",
                schema: "product",
                table: "brands",
                columns: new[] { "CompanyId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_categories_CompanyId_Code",
                schema: "product",
                table: "categories",
                columns: new[] { "CompanyId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_categories_ParentCategoryId",
                schema: "product",
                table: "categories",
                column: "ParentCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_companies_Code",
                schema: "organization",
                table: "companies",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_companies_Status",
                schema: "organization",
                table: "companies",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_companies_TaxRegistrationNumber",
                schema: "organization",
                table: "companies",
                column: "TaxRegistrationNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_companies_TenantId",
                schema: "organization",
                table: "companies",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_customers_CompanyId_Code",
                schema: "customer",
                table: "customers",
                columns: new[] { "CompanyId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_departments_BranchId_Code",
                schema: "organization",
                table: "departments",
                columns: new[] { "BranchId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_designations_CompanyId_Code",
                schema: "organization",
                table: "designations",
                columns: new[] { "CompanyId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_email_verification_tokens_token",
                schema: "iam",
                table: "email_verification_tokens",
                column: "Token");

            migrationBuilder.CreateIndex(
                name: "idx_email_verification_tokens_user_id",
                schema: "iam",
                table: "email_verification_tokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_employees_BranchId",
                schema: "hr",
                table: "employees",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_employees_CompanyId_EmployeeCode",
                schema: "hr",
                table: "employees",
                columns: new[] { "CompanyId", "EmployeeCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_employees_DepartmentId",
                schema: "hr",
                table: "employees",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_employees_DesignationId",
                schema: "hr",
                table: "employees",
                column: "DesignationId");

            migrationBuilder.CreateIndex(
                name: "IX_employees_Email",
                schema: "hr",
                table: "employees",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_face_enrollment_logs_FaceProfileId",
                schema: "iam",
                table: "face_enrollment_logs",
                column: "FaceProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_face_profiles_UserId",
                schema: "iam",
                table: "face_profiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_face_templates_FaceProfileId",
                schema: "iam",
                table: "face_templates",
                column: "FaceProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_face_templates_Version",
                schema: "iam",
                table: "face_templates",
                column: "Version");

            migrationBuilder.CreateIndex(
                name: "IX_face_verification_logs_CreatedAtUtc",
                schema: "iam",
                table: "face_verification_logs",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_face_verification_logs_FaceProfileId",
                schema: "iam",
                table: "face_verification_logs",
                column: "FaceProfileId");

            migrationBuilder.CreateIndex(
                name: "idx_login_histories_user_id",
                schema: "iam",
                table: "login_histories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "idx_login_histories_username",
                schema: "iam",
                table: "login_histories",
                column: "Username");

            migrationBuilder.CreateIndex(
                name: "idx_password_reset_tokens_token",
                schema: "iam",
                table: "password_reset_tokens",
                column: "Token");

            migrationBuilder.CreateIndex(
                name: "idx_password_reset_tokens_user_id",
                schema: "iam",
                table: "password_reset_tokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "uq_permission_groups_code",
                schema: "iam",
                table: "permission_groups",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_permissions_PermissionGroupId",
                schema: "iam",
                table: "permissions",
                column: "PermissionGroupId");

            migrationBuilder.CreateIndex(
                name: "uq_permissions_code",
                schema: "iam",
                table: "permissions",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_price_list_items_PriceListId_ProductId",
                schema: "pricing",
                table: "price_list_items",
                columns: new[] { "PriceListId", "ProductId" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_price_lists_CompanyId_Name",
                schema: "pricing",
                table: "price_lists",
                columns: new[] { "CompanyId", "Name" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_price_lists_Status",
                schema: "pricing",
                table: "price_lists",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_products_BaseUomId",
                schema: "product",
                table: "products",
                column: "BaseUomId");

            migrationBuilder.CreateIndex(
                name: "IX_products_BrandId",
                schema: "product",
                table: "products",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_products_CategoryId",
                schema: "product",
                table: "products",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_products_CompanyId_Code",
                schema: "product",
                table: "products",
                columns: new[] { "CompanyId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_products_CompanyId_Sku",
                schema: "product",
                table: "products",
                columns: new[] { "CompanyId", "Sku" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_refresh_tokens_token",
                schema: "iam",
                table: "refresh_tokens",
                column: "Token");

            migrationBuilder.CreateIndex(
                name: "idx_refresh_tokens_user_id",
                schema: "iam",
                table: "refresh_tokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_registered_devices_UserId",
                schema: "iam",
                table: "registered_devices",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_role_claims_RoleId",
                schema: "iam",
                table: "role_claims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_PermissionId",
                schema: "iam",
                table: "role_permissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "uq_role_permissions_composite",
                schema: "iam",
                table: "role_permissions",
                columns: new[] { "RoleId", "PermissionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_roles_normalized_name",
                schema: "iam",
                table: "roles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_roles_code",
                schema: "iam",
                table: "roles",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_security_audit_logs_correlation_id",
                schema: "iam",
                table: "security_audit_logs",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "idx_security_audit_logs_entity_id",
                schema: "iam",
                table: "security_audit_logs",
                column: "EntityId");

            migrationBuilder.CreateIndex(
                name: "idx_security_audit_logs_performed_by",
                schema: "iam",
                table: "security_audit_logs",
                column: "PerformedBy");

            migrationBuilder.CreateIndex(
                name: "IX_security_incidents_IsResolved",
                schema: "iam",
                table: "security_incidents",
                column: "IsResolved");

            migrationBuilder.CreateIndex(
                name: "IX_security_incidents_Severity",
                schema: "iam",
                table: "security_incidents",
                column: "Severity");

            migrationBuilder.CreateIndex(
                name: "IX_security_incidents_UserId",
                schema: "iam",
                table: "security_incidents",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_CompanyId_Code",
                schema: "supplier",
                table: "suppliers",
                columns: new[] { "CompanyId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_CompanyId_Gstin",
                schema: "supplier",
                table: "suppliers",
                columns: new[] { "CompanyId", "Gstin" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_units_of_measure_CompanyId_Code",
                schema: "product",
                table: "units_of_measure",
                columns: new[] { "CompanyId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_claims_UserId",
                schema: "iam",
                table: "user_claims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_logins_UserId",
                schema: "iam",
                table: "user_logins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "idx_user_preferences_user_id",
                schema: "iam",
                table: "user_preferences",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_RoleId",
                schema: "iam",
                table: "user_roles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "uq_user_roles_composite",
                schema: "iam",
                table: "user_roles",
                columns: new[] { "UserId", "RoleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_security_policies_UserId",
                schema: "iam",
                table: "user_security_policies",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_user_sessions_jwt_id",
                schema: "iam",
                table: "user_sessions",
                column: "JwtId");

            migrationBuilder.CreateIndex(
                name: "idx_user_sessions_user_id",
                schema: "iam",
                table: "user_sessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "idx_users_employee_id",
                schema: "iam",
                table: "users",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_users_normalized_email",
                schema: "iam",
                table: "users",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "idx_users_normalized_username",
                schema: "iam",
                table: "users",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_warehouses_CompanyId_Code",
                schema: "warehouse",
                table: "warehouses",
                columns: new[] { "CompanyId", "Code" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "customers",
                schema: "customer");

            migrationBuilder.DropTable(
                name: "email_verification_tokens",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "employees",
                schema: "hr");

            migrationBuilder.DropTable(
                name: "face_enrollment_logs",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "face_templates",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "face_verification_logs",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "login_histories",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "outbox_messages",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "password_reset_tokens",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "price_list_items",
                schema: "pricing");

            migrationBuilder.DropTable(
                name: "products",
                schema: "product");

            migrationBuilder.DropTable(
                name: "refresh_tokens",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "registered_devices",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "role_claims",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "role_permissions",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "sales_orders",
                schema: "sales");

            migrationBuilder.DropTable(
                name: "security_audit_logs",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "security_incidents",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "security_policies",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "suppliers",
                schema: "supplier");

            migrationBuilder.DropTable(
                name: "user_claims",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "user_logins",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "user_preferences",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "user_roles",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "user_security_policies",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "user_sessions",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "user_tokens",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "warehouses",
                schema: "warehouse");

            migrationBuilder.DropTable(
                name: "departments",
                schema: "organization");

            migrationBuilder.DropTable(
                name: "designations",
                schema: "organization");

            migrationBuilder.DropTable(
                name: "face_profiles",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "price_lists",
                schema: "pricing");

            migrationBuilder.DropTable(
                name: "brands",
                schema: "product");

            migrationBuilder.DropTable(
                name: "categories",
                schema: "product");

            migrationBuilder.DropTable(
                name: "units_of_measure",
                schema: "product");

            migrationBuilder.DropTable(
                name: "permissions",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "roles",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "users",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "branches",
                schema: "organization");

            migrationBuilder.DropTable(
                name: "permission_groups",
                schema: "iam");

            migrationBuilder.DropTable(
                name: "companies",
                schema: "organization");
        }
    }
