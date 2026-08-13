using INK.ERP.Domain.Common;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Domain.Entities.MasterData;

public sealed class Customer : BaseEntity
{
    public Guid CompanyId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string LegalName { get; set; } = string.Empty;
    public string? TradeName { get; set; }
    public string CustomerType { get; set; } = "Retailer";
    public string? Gstin { get; set; }
    public string? Pan { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public Address Address { get; set; } = new();
    public decimal CreditLimit { get; set; } = 50000.00m;
    public int CreditDays { get; set; } = 30;
    public Guid? RouteId { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Property
    public Company? Company { get; set; }
}
