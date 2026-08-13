using System;
using System.Text.Json.Serialization;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Pricing;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CustomerPriceStatus
{
    Draft = 0,
    Active = 1,
    Inactive = 2,
    Archived = 3,
    Expired = 4
}

public sealed class CustomerPrice : AuditableEntity
{
    public Guid CompanyId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid PriceListId { get; set; }
    public Guid ProductId { get; set; }

    public decimal BasePrice { get; set; }
    public decimal CustomerPriceValue { get; set; }
    public decimal MinAllowedPrice { get; set; }
    public string CurrencyCode { get; set; } = "INR";

    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public CustomerPriceStatus Status { get; set; } = CustomerPriceStatus.Draft;
    public bool IsActive { get; set; } = false;

    // Additional audit fields
    public string? ActivatedBy { get; set; }
    public DateTime? ActivatedAtUtc { get; set; }
    public string? DeactivatedBy { get; set; }
    public DateTime? DeactivatedAtUtc { get; set; }
    public string? ArchivedBy { get; set; }
    public DateTime? ArchivedAtUtc { get; set; }

    // Navigation properties
    public INK.ERP.Domain.Entities.MasterData.Customer? Customer { get; set; }
    public PriceList? PriceList { get; set; }
    public INK.ERP.Domain.Entities.MasterData.Product? Product { get; set; }
}
