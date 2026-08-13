using System;
using System.Text.Json.Serialization;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Pricing;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DiscountMethod
{
    Percentage = 0,
    FixedAmount = 1
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DiscountScope
{
    CustomerProduct = 1,
    Customer = 2,
    Product = 3,
    Category = 4,
    PriceList = 5,
    Global = 6
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DiscountRuleStatus
{
    Draft = 0,
    Active = 1,
    Inactive = 2,
    Archived = 3,
    Expired = 4
}

public sealed class DiscountRule : AuditableEntity
{
    public Guid CompanyId { get; set; }
    public string RuleCode { get; set; } = string.Empty;
    public string RuleName { get; set; } = string.Empty;
    public string? Description { get; set; }

    public DiscountMethod DiscountMethod { get; set; } = DiscountMethod.Percentage;
    public decimal DiscountValue { get; set; }
    public DiscountScope Scope { get; set; } = DiscountScope.Global;

    public Guid? CustomerId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? PriceListId { get; set; }

    public int? MinimumQuantity { get; set; }
    public int? MaximumQuantity { get; set; }
    public decimal? MaximumDiscountAmount { get; set; }

    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public int Priority { get; set; } = 1;

    public DiscountRuleStatus Status { get; set; } = DiscountRuleStatus.Draft;
    public bool IsActive { get; set; } = false;

    // Audit fields
    public string? ActivatedBy { get; set; }
    public DateTime? ActivatedAtUtc { get; set; }
    public string? DeactivatedBy { get; set; }
    public DateTime? DeactivatedAtUtc { get; set; }
    public string? ArchivedBy { get; set; }
    public DateTime? ArchivedAtUtc { get; set; }

    // Navigation properties
    public INK.ERP.Domain.Entities.MasterData.Customer? Customer { get; set; }
    public INK.ERP.Domain.Entities.MasterData.Product? Product { get; set; }
    public PriceList? PriceList { get; set; }
}
