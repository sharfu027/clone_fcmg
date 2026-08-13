using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace INK.ERP.Infrastructure.Migrations;

/// <inheritdoc />
public partial class AddPurchaseRequisitions : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "procurement");

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
                ConcurrencyToken = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_purchase_requisitions", x => x.Id);
                table.ForeignKey(
                    name: "FK_purchase_requisitions_companies_CompanyId",
                    column: x => x.CompanyId,
                    principalSchema: "masterdata",
                    principalTable: "companies",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
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
                Notes = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_purchase_requisition_items", x => x.Id);
                table.ForeignKey(
                    name: "FK_purchase_requisition_items_purchase_requisitions_PurchaseR~",
                    column: x => x.PurchaseRequisitionId,
                    principalSchema: "procurement",
                    principalTable: "purchase_requisitions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_purchase_requisition_items_products_ProductId",
                    column: x => x.ProductId,
                    principalSchema: "masterdata",
                    principalTable: "products",
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
                TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
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
            name: "IX_purchase_requisitions_CompanyId_RequisitionNumber",
            schema: "procurement",
            table: "purchase_requisitions",
            columns: new[] { "CompanyId", "RequisitionNumber" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_purchase_requisitions_CompanyId_RequestedByUserId",
            schema: "procurement",
            table: "purchase_requisitions",
            columns: new[] { "CompanyId", "RequestedByUserId" });

        migrationBuilder.CreateIndex(
            name: "IX_purchase_requisitions_CompanyId_Status",
            schema: "procurement",
            table: "purchase_requisitions",
            columns: new[] { "CompanyId", "Status" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "purchase_requisition_items",
            schema: "procurement");

        migrationBuilder.DropTable(
            name: "purchase_requisition_status_histories",
            schema: "procurement");

        migrationBuilder.DropTable(
            name: "purchase_requisitions",
            schema: "procurement");
    }
}
