using System;
using System.Collections.Generic;
using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.Procurement;

public class Rfq : AuditableEntity
{
    public Guid CompanyId { get; set; }
    public string RfqNumber { get; set; } = string.Empty;
    public Guid PurchaseRequisitionId { get; set; }
    public string PurchaseRequisitionNumber { get; set; } = string.Empty;
    public DateTime RfqDate { get; set; } = DateTime.UtcNow;
    public DateTime ResponseDueDate { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string RequestedByUserId { get; set; } = string.Empty;
    public string RequestedByName { get; set; } = string.Empty;
    public string? BuyerUserId { get; set; }
    public string? BuyerName { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public RfqStatus Status { get; set; } = RfqStatus.Draft;
    public string? Notes { get; set; }
    public string? CancelReason { get; set; }
    public string? CloseReason { get; set; }
    public DateTime? SubmittedAtUtc { get; set; }
    public DateTime? SentAtUtc { get; set; }
    public DateTime? ClosedAtUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }

    public virtual ICollection<RfqItem> Items { get; set; } = new List<RfqItem>();
    public virtual ICollection<RfqSupplier> Suppliers { get; set; } = new List<RfqSupplier>();
}
