using System;
using System.Collections.Generic;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Events;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Domain.Entities.Pricing;

public enum PriceListStatus
{
    Draft = 0,
    Published = 1,
    Archived = 2,
    Expired = 3
}

public sealed class PriceList : AuditableEntity
{
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public PriceListStatus Status { get; set; } = PriceListStatus.Draft;
    public int Version { get; set; } = 1; // default version
    public string? Description { get; set; }

    // Navigation
    public ICollection<PriceListItem> Items { get; set; } = new List<PriceListItem>();
}

public sealed class PriceListItem : AuditableEntity
{
    public Guid PriceListId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Price { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public DateTime EffectiveDate { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public PriceList? PriceList { get; set; }
}
