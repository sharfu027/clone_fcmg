using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace INK.ERP.Infrastructure.Migrations;

/// <inheritdoc />
    public partial class AddRfqModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_security_audit_logs_correlation_id",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropIndex(
                name: "idx_security_audit_logs_entity_id",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.EnsureSchema(
                name: "procurement");

            migrationBuilder.AddColumn<string>(
                name: "Browser",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Device",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeId",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Endpoint",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EventType",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FailureReason",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HttpMethod",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Module",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OperatingSystem",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ProcessingTimeMs",
                schema: "iam",
                table: "security_audit_logs",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Success",
                schema: "iam",
                table: "security_audit_logs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                schema: "iam",
                table: "security_audit_logs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Username",
                schema: "iam",
                table: "security_audit_logs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "FaceProfileId",
                schema: "iam",
                table: "face_verification_logs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ConcurrencyToken",
                schema: "iam",
                table: "face_templates",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "ConcurrencyToken",
                schema: "iam",
                table: "face_profiles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateTable(
                name: "currencies",
                schema: "pricing",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Symbol = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DecimalPlaces = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    IsBaseCurrency = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
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
                    table.PrimaryKey("PK_currencies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "customer_prices",
                schema: "pricing",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    PriceListId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    BasePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CustomerPriceValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MinAllowedPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "INR"),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ActivatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ActivatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeactivatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DeactivatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ArchivedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ArchivedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_customer_prices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_customer_prices_customers_CustomerId",
                        column: x => x.CustomerId,
                        principalSchema: "customer",
                        principalTable: "customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_customer_prices_price_lists_PriceListId",
                        column: x => x.PriceListId,
                        principalSchema: "pricing",
                        principalTable: "price_lists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_customer_prices_products_ProductId",
                        column: x => x.ProductId,
                        principalSchema: "product",
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "discount_rules",
                schema: "pricing",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    RuleCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RuleName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DiscountMethod = table.Column<int>(type: "integer", nullable: false),
                    DiscountValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Scope = table.Column<int>(type: "integer", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    PriceListId = table.Column<Guid>(type: "uuid", nullable: true),
                    MinimumQuantity = table.Column<int>(type: "integer", nullable: true),
                    MaximumQuantity = table.Column<int>(type: "integer", nullable: true),
                    MaximumDiscountAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Priority = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ActivatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ActivatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeactivatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DeactivatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ArchivedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ArchivedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_discount_rules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_discount_rules_customers_CustomerId",
                        column: x => x.CustomerId,
                        principalSchema: "customer",
                        principalTable: "customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_discount_rules_price_lists_PriceListId",
                        column: x => x.PriceListId,
                        principalSchema: "pricing",
                        principalTable: "price_lists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_discount_rules_products_ProductId",
                        column: x => x.ProductId,
                        principalSchema: "product",
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "exchange_rates",
                schema: "pricing",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FromCurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    ToCurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Rate = table.Column<decimal>(type: "numeric(18,8)", precision: 18, scale: 8, nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Source = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
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
                    table.PrimaryKey("PK_exchange_rates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Product",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Product", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "purchase_requisitions",
                schema: "procurement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequisitionNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RequestedByUserId = table.Column<string>(type: "text", nullable: false),
                    RequestedByName = table.Column<string>(type: "text", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    DepartmentName = table.Column<string>(type: "text", nullable: true),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: true),
                    WarehouseName = table.Column<string>(type: "text", nullable: true),
                    RequestDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RequiredByDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Purpose = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    EstimatedTotalAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrencyCode = table.Column<string>(type: "text", nullable: false),
                    SubmittedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ApprovedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RejectedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_purchase_requisitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_purchase_requisitions_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "organization",
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_purchase_requisitions_departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalSchema: "organization",
                        principalTable: "departments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_purchase_requisitions_warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalSchema: "warehouse",
                        principalTable: "warehouses",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "rfqs",
                schema: "procurement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    RfqNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PurchaseRequisitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    PurchaseRequisitionNumber = table.Column<string>(type: "text", nullable: false),
                    RfqDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResponseDueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    DepartmentName = table.Column<string>(type: "text", nullable: true),
                    RequestedByUserId = table.Column<string>(type: "text", nullable: false),
                    RequestedByName = table.Column<string>(type: "text", nullable: false),
                    BuyerUserId = table.Column<string>(type: "text", nullable: true),
                    BuyerName = table.Column<string>(type: "text", nullable: true),
                    CurrencyCode = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CancelReason = table.Column<string>(type: "text", nullable: true),
                    CloseReason = table.Column<string>(type: "text", nullable: true),
                    SubmittedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SentAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClosedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_rfqs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "purchase_requisition_items",
                schema: "procurement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PurchaseRequisitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductCode = table.Column<string>(type: "text", nullable: false),
                    ProductName = table.Column<string>(type: "text", nullable: false),
                    Uom = table.Column<string>(type: "text", nullable: false),
                    RequestedQuantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    EstimatedUnitPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    EstimatedLineTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("PK_purchase_requisition_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_purchase_requisition_items_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_purchase_requisition_items_purchase_requisitions_PurchaseRe~",
                        column: x => x.PurchaseRequisitionId,
                        principalSchema: "procurement",
                        principalTable: "purchase_requisitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "purchase_requisition_status_histories",
                schema: "procurement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PurchaseRequisitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromStatus = table.Column<int>(type: "integer", nullable: false),
                    ToStatus = table.Column<int>(type: "integer", nullable: false),
                    ChangedByUserId = table.Column<string>(type: "text", nullable: false),
                    ChangedByName = table.Column<string>(type: "text", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_purchase_requisition_status_histories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_purchase_requisition_status_histories_purchase_requisitions~",
                        column: x => x.PurchaseRequisitionId,
                        principalSchema: "procurement",
                        principalTable: "purchase_requisitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "rfq_items",
                schema: "procurement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RfqId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductCode = table.Column<string>(type: "text", nullable: false),
                    ProductName = table.Column<string>(type: "text", nullable: false),
                    Uom = table.Column<string>(type: "text", nullable: false),
                    RequestedQuantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    RequiredByDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("PK_rfq_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_rfq_items_rfqs_RfqId",
                        column: x => x.RfqId,
                        principalSchema: "procurement",
                        principalTable: "rfqs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "rfq_suppliers",
                schema: "procurement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RfqId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierCode = table.Column<string>(type: "text", nullable: false),
                    SupplierName = table.Column<string>(type: "text", nullable: false),
                    ContactPerson = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    DeliveryStatus = table.Column<int>(type: "integer", nullable: false),
                    SentAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_rfq_suppliers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_rfq_suppliers_rfqs_RfqId",
                        column: x => x.RfqId,
                        principalSchema: "procurement",
                        principalTable: "rfqs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_security_audit_logs_category",
                schema: "iam",
                table: "security_audit_logs",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "idx_security_audit_logs_event_type",
                schema: "iam",
                table: "security_audit_logs",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "idx_security_audit_logs_timestamp",
                schema: "iam",
                table: "security_audit_logs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_currencies_Code",
                schema: "pricing",
                table: "currencies",
                column: "Code",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_customer_prices_CompanyId_CustomerId_ProductId_Status",
                schema: "pricing",
                table: "customer_prices",
                columns: new[] { "CompanyId", "CustomerId", "ProductId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_customer_prices_CompanyId_PriceListId",
                schema: "pricing",
                table: "customer_prices",
                columns: new[] { "CompanyId", "PriceListId" });

            migrationBuilder.CreateIndex(
                name: "IX_customer_prices_CustomerId",
                schema: "pricing",
                table: "customer_prices",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_customer_prices_PriceListId",
                schema: "pricing",
                table: "customer_prices",
                column: "PriceListId");

            migrationBuilder.CreateIndex(
                name: "IX_customer_prices_ProductId",
                schema: "pricing",
                table: "customer_prices",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_customer_prices_Status",
                schema: "pricing",
                table: "customer_prices",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_discount_rules_CompanyId_Scope_Status",
                schema: "pricing",
                table: "discount_rules",
                columns: new[] { "CompanyId", "Scope", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_discount_rules_CustomerId",
                schema: "pricing",
                table: "discount_rules",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_discount_rules_PriceListId",
                schema: "pricing",
                table: "discount_rules",
                column: "PriceListId");

            migrationBuilder.CreateIndex(
                name: "IX_discount_rules_ProductId",
                schema: "pricing",
                table: "discount_rules",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_discount_rules_Status",
                schema: "pricing",
                table: "discount_rules",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_exchange_rates_FromCurrencyCode_ToCurrencyCode_EffectiveFrom",
                schema: "pricing",
                table: "exchange_rates",
                columns: new[] { "FromCurrencyCode", "ToCurrencyCode", "EffectiveFrom" });

            migrationBuilder.CreateIndex(
                name: "IX_purchase_requisition_items_ProductId",
                schema: "procurement",
                table: "purchase_requisition_items",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_requisition_items_PurchaseRequisitionId",
                schema: "procurement",
                table: "purchase_requisition_items",
                column: "PurchaseRequisitionId");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_requisition_status_histories_PurchaseRequisitionId",
                schema: "procurement",
                table: "purchase_requisition_status_histories",
                column: "PurchaseRequisitionId");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_requisitions_CompanyId_RequestedByUserId",
                schema: "procurement",
                table: "purchase_requisitions",
                columns: new[] { "CompanyId", "RequestedByUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_purchase_requisitions_CompanyId_RequisitionNumber",
                schema: "procurement",
                table: "purchase_requisitions",
                columns: new[] { "CompanyId", "RequisitionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchase_requisitions_CompanyId_Status",
                schema: "procurement",
                table: "purchase_requisitions",
                columns: new[] { "CompanyId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_purchase_requisitions_DepartmentId",
                schema: "procurement",
                table: "purchase_requisitions",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_requisitions_WarehouseId",
                schema: "procurement",
                table: "purchase_requisitions",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_rfq_items_ProductId",
                schema: "procurement",
                table: "rfq_items",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_rfq_items_RfqId",
                schema: "procurement",
                table: "rfq_items",
                column: "RfqId");

            migrationBuilder.CreateIndex(
                name: "IX_rfq_suppliers_RfqId_SupplierId",
                schema: "procurement",
                table: "rfq_suppliers",
                columns: new[] { "RfqId", "SupplierId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rfqs_CompanyId_RfqNumber",
                schema: "procurement",
                table: "rfqs",
                columns: new[] { "CompanyId", "RfqNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rfqs_CompanyId_Status",
                schema: "procurement",
                table: "rfqs",
                columns: new[] { "CompanyId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_rfqs_PurchaseRequisitionId",
                schema: "procurement",
                table: "rfqs",
                column: "PurchaseRequisitionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "currencies",
                schema: "pricing");

            migrationBuilder.DropTable(
                name: "customer_prices",
                schema: "pricing");

            migrationBuilder.DropTable(
                name: "discount_rules",
                schema: "pricing");

            migrationBuilder.DropTable(
                name: "exchange_rates",
                schema: "pricing");

            migrationBuilder.DropTable(
                name: "purchase_requisition_items",
                schema: "procurement");

            migrationBuilder.DropTable(
                name: "purchase_requisition_status_histories",
                schema: "procurement");

            migrationBuilder.DropTable(
                name: "rfq_items",
                schema: "procurement");

            migrationBuilder.DropTable(
                name: "rfq_suppliers",
                schema: "procurement");

            migrationBuilder.DropTable(
                name: "Product");

            migrationBuilder.DropTable(
                name: "purchase_requisitions",
                schema: "procurement");

            migrationBuilder.DropTable(
                name: "rfqs",
                schema: "procurement");

            migrationBuilder.DropIndex(
                name: "idx_security_audit_logs_category",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropIndex(
                name: "idx_security_audit_logs_event_type",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropIndex(
                name: "idx_security_audit_logs_timestamp",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "Browser",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "Description",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "Device",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "EmployeeId",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "Endpoint",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "EventType",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "FailureReason",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "HttpMethod",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "Location",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "Module",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "OperatingSystem",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "ProcessingTimeMs",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "Success",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "UserId",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "Username",
                schema: "iam",
                table: "security_audit_logs");

            migrationBuilder.AlterColumn<Guid>(
                name: "FaceProfileId",
                schema: "iam",
                table: "face_verification_logs",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "ConcurrencyToken",
                schema: "iam",
                table: "face_templates",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "ConcurrencyToken",
                schema: "iam",
                table: "face_profiles",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

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
        }
    }
