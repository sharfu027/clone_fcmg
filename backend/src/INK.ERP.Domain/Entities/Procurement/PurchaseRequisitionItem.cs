using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Procurement;

public class PurchaseRequisitionItem : AuditableEntity
{
    public Guid PurchaseRequisitionId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Uom { get; set; } = string.Empty;
    public decimal RequestedQuantity { get; set; }
    public decimal EstimatedUnitPrice { get; set; }
    public decimal EstimatedLineTotal { get; set; }
    public string? Notes { get; set; }

    // Navigation Properties
    public PurchaseRequisition? PurchaseRequisition { get; set; }
    public Product? Product { get; set; }
}
