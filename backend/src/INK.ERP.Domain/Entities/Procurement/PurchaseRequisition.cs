using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Procurement;

public class PurchaseRequisition : AuditableEntity
{
    public Guid CompanyId { get; set; }
    public string RequisitionNumber { get; set; } = string.Empty;
    public string RequestedByUserId { get; set; } = string.Empty;
    public string RequestedByName { get; set; } = string.Empty;
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public Guid? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public DateTime RequestDate { get; set; } = DateTime.UtcNow;
    public DateTime RequiredByDate { get; set; }
    public RequisitionPriority Priority { get; set; } = RequisitionPriority.Normal;
    public RequisitionStatus Status { get; set; } = RequisitionStatus.Draft;
    public string Purpose { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public decimal EstimatedTotalAmount { get; set; }
    public string CurrencyCode { get; set; } = "INR";

    public DateTime? SubmittedAtUtc { get; set; }
    public DateTime? ApprovedAtUtc { get; set; }
    public DateTime? RejectedAtUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public Department? Department { get; set; }
    public Warehouse? Warehouse { get; set; }
    public ICollection<PurchaseRequisitionItem> Items { get; set; } = new List<PurchaseRequisitionItem>();
    public ICollection<PurchaseRequisitionStatusHistory> StatusHistories { get; set; } = new List<PurchaseRequisitionStatusHistory>();
}
