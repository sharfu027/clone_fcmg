using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.Pricing;

public enum CurrencyStatus
{
    Active = 0,
    Inactive = 1
}

public sealed class Currency : AuditableEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string Symbol { get; private set; } = string.Empty;
    public int DecimalPlaces { get; private set; } = 2;
    public bool IsBaseCurrency { get; private set; } = false;
    public CurrencyStatus Status { get; private set; } = CurrencyStatus.Active;

    private Currency() { }

    public Currency(string code, string name, string symbol, int decimalPlaces, bool isBaseCurrency = false)
    {
        Code = code.ToUpperInvariant().Trim();
        Name = name.Trim();
        Symbol = symbol.Trim();
        DecimalPlaces = decimalPlaces;
        IsBaseCurrency = isBaseCurrency;
        Status = CurrencyStatus.Active;
    }

    public void Update(string name, string symbol, int decimalPlaces)
    {
        Name = name.Trim();
        Symbol = symbol.Trim();
        DecimalPlaces = decimalPlaces;
        LastModifiedAtUtc = DateTime.UtcNow;
    }

    public void Activate() { Status = CurrencyStatus.Active; LastModifiedAtUtc = DateTime.UtcNow; }
    public void Deactivate() { Status = CurrencyStatus.Inactive; LastModifiedAtUtc = DateTime.UtcNow; }
    public void SetAsBase() { IsBaseCurrency = true; LastModifiedAtUtc = DateTime.UtcNow; }
    public void UnsetBase() { IsBaseCurrency = false; LastModifiedAtUtc = DateTime.UtcNow; }
}
