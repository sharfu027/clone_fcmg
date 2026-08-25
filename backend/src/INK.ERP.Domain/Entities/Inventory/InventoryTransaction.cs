using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Inventory;

public static class InventoryTransactionTypes
{
    public const string OpeningBalance = "OpeningBalance";
    public const string GoodsReceipt = "GoodsReceipt";
    public const string GoodsIssue = "GoodsIssue";
    public const string AdjustmentIncrease = "AdjustmentIncrease";
    public const string AdjustmentDecrease = "AdjustmentDecrease";
    public const string TransferIn = "TransferIn";
    public const string TransferOut = "TransferOut";

    public static readonly string[] All =
    [
        OpeningBalance,
        GoodsReceipt,
        GoodsIssue,
        AdjustmentIncrease,
        AdjustmentDecrease,
        TransferIn,
        TransferOut
    ];

    public static bool IsValid(string? type) =>
        !string.IsNullOrWhiteSpace(type) && Array.Exists(All, t => t.Equals(type.Trim(), StringComparison.OrdinalIgnoreCase));

    public static decimal GetSignedFactor(string type)
    {
        return type.Trim() switch
        {
            OpeningBalance => 1m,
            GoodsReceipt => 1m,
            AdjustmentIncrease => 1m,
            TransferIn => 1m,
            GoodsIssue => -1m,
            AdjustmentDecrease => -1m,
            TransferOut => -1m,
            _ => throw new ArgumentException($"Invalid transaction type: '{type}'")
        };
    }
}

public sealed class InventoryTransaction : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Guid InventoryLocationId { get; set; }
    public Guid ProductId { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? ReferenceDocumentType { get; set; }
    public Guid? ReferenceDocumentId { get; set; }
    public string? ReferenceDocumentNumber { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public Guid? PerformedByEmployeeId { get; set; }
    public string? Notes { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public InventoryLocation? InventoryLocation { get; set; }
    public INK.ERP.Domain.Entities.MasterData.Product? Product { get; set; }
    public Employee? PerformedByEmployee { get; set; }
}
