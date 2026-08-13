using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.Procurement;

public class PurchaseRequisitionStatusHistory : AuditableEntity
{
    public Guid PurchaseRequisitionId { get; set; }
    public RequisitionStatus FromStatus { get; set; }
    public RequisitionStatus ToStatus { get; set; }
    public string ChangedByUserId { get; set; } = string.Empty;
    public string ChangedByName { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public PurchaseRequisition? PurchaseRequisition { get; set; }
}
