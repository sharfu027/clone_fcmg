using System;
using System.Collections.Generic;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Inventory.Fulfillment;

public sealed class Package : BaseEntity
{
    public Guid PackTaskId { get; set; }
    public string PackageNumber { get; set; } = string.Empty;
    public string PackageType { get; set; } = "Carton";
    public decimal? GrossWeightKg { get; set; }
    public decimal? Length { get; set; }
    public decimal? Width { get; set; }
    public decimal? Height { get; set; }
    public string? SealNumber { get; set; }
    public string? Barcode { get; set; }
    public Guid? PackedByEmployeeId { get; set; }
    public DateTime? PackedAtUtc { get; set; }

    // Navigation Properties
    public PackTask? PackTask { get; set; }
    public Employee? PackedByEmployee { get; set; }
    public ICollection<PackageItem> Items { get; set; } = new List<PackageItem>();
}
