using INK.ERP.Domain.Common;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Domain.Entities.MasterData;

public sealed class Supplier : BaseEntity
{
    public Guid CompanyId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string LegalName { get; set; } = string.Empty;
    public string? TradeName { get; set; }
    public string Gstin { get; set; } = string.Empty;
    public string Pan { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public Address Address { get; set; } = new();
    public int PaymentTermsDays { get; set; } = 30;
    public decimal? CreditLimit { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Property
    public Company? Company { get; set; }
}
