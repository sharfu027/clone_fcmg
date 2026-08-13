namespace INK.ERP.Domain.Entities.Procurement;

public enum RequisitionStatus
{
    Draft = 0,
    PendingApproval = 1,
    Approved = 2,
    Rejected = 3,
    Cancelled = 4,
    Converted = 5,
    Closed = 6
}
