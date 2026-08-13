namespace INK.ERP.Application.Features.Pricing.Currency.DTOs;

public sealed record CurrencyDto(
    Guid Id,
    string Code,
    string Name,
    string Symbol,
    int DecimalPlaces,
    bool IsBaseCurrency,
    string Status,
    string? CreatedBy,
    DateTime CreatedAtUtc,
    string? ModifiedBy,
    DateTime? LastModifiedAtUtc
);

public sealed record ExchangeRateDto(
    Guid Id,
    string FromCurrencyCode,
    string ToCurrencyCode,
    decimal Rate,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    string Status,
    string Source,
    string? CreatedBy,
    DateTime CreatedAtUtc,
    string? ModifiedBy,
    DateTime? LastModifiedAtUtc
);

public sealed record CurrencyDashboardDto(
    string BaseCurrencyCode,
    int ActiveCurrenciesCount,
    int ActiveExchangeRatesCount,
    decimal? LatestUsdToInrRate,
    decimal? LatestEurToInrRate,
    decimal? LatestAedToInrRate
);
