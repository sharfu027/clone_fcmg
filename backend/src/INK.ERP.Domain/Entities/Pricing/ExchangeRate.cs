using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.Pricing;

public enum ExchangeRateStatus
{
    Draft = 0,
    Active = 1,
    Expired = 2,
    Archived = 3
}

public enum RateSource
{
    Manual = 0,
    Imported = 1
}

public sealed class ExchangeRate : AuditableEntity
{
    public string FromCurrencyCode { get; private set; } = string.Empty;
    public string ToCurrencyCode { get; private set; } = string.Empty;
    public decimal Rate { get; private set; }
    public DateTime EffectiveFrom { get; private set; }
    public DateTime? EffectiveTo { get; private set; }
    public ExchangeRateStatus Status { get; private set; } = ExchangeRateStatus.Draft;
    public RateSource Source { get; private set; } = RateSource.Manual;

    private ExchangeRate() { }

    public ExchangeRate(string fromCode, string toCode, decimal rate, DateTime effectiveFrom, DateTime? effectiveTo, RateSource source = RateSource.Manual)
    {
        FromCurrencyCode = fromCode.ToUpperInvariant().Trim();
        ToCurrencyCode = toCode.ToUpperInvariant().Trim();
        Rate = rate;
        EffectiveFrom = effectiveFrom;
        EffectiveTo = effectiveTo;
        Source = source;
        Status = ExchangeRateStatus.Draft;
    }

    public void Update(decimal rate, DateTime effectiveFrom, DateTime? effectiveTo)
    {
        Rate = rate;
        EffectiveFrom = effectiveFrom;
        EffectiveTo = effectiveTo;
        LastModifiedAtUtc = DateTime.UtcNow;
    }

    public void Activate() { Status = ExchangeRateStatus.Active; LastModifiedAtUtc = DateTime.UtcNow; }
    public void Archive() { Status = ExchangeRateStatus.Archived; LastModifiedAtUtc = DateTime.UtcNow; }
    public void Expire() { Status = ExchangeRateStatus.Expired; LastModifiedAtUtc = DateTime.UtcNow; }
}
