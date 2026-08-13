using System.Linq;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Pricing;
using INK.ERP.Application.Features.Pricing.Currency.DTOs;

namespace INK.ERP.Application.Features.Pricing.Currency.Queries;

// ── Get All Currencies ────────────────────────────────────────────────────────
public sealed record GetCurrenciesQuery : IQuery<Result<IReadOnlyList<CurrencyDto>>>;

public sealed class GetCurrenciesQueryHandler : IRequestHandler<GetCurrenciesQuery, Result<IReadOnlyList<CurrencyDto>>>
{
    private readonly IUnitOfWork _uow;
    public GetCurrenciesQueryHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<IReadOnlyList<CurrencyDto>>> Handle(GetCurrenciesQuery request, CancellationToken ct)
    {
        var repo = _uow.Repository<INK.ERP.Domain.Entities.Pricing.Currency>();
        var all = await repo.GetAllAsync(ct);
        var dtos = all.OrderBy(c => c.Code).Select(c => new CurrencyDto(
            c.Id, c.Code, c.Name, c.Symbol, c.DecimalPlaces, c.IsBaseCurrency,
            c.Status.ToString(), c.CreatedBy, c.CreatedAtUtc, c.ModifiedBy, c.LastModifiedAtUtc)).ToList();
        return Result.Success<IReadOnlyList<CurrencyDto>>(dtos);
    }
}

// ── Get All Exchange Rates ────────────────────────────────────────────────────
public sealed record GetExchangeRatesQuery : IQuery<Result<IReadOnlyList<ExchangeRateDto>>>;

public sealed class GetExchangeRatesQueryHandler : IRequestHandler<GetExchangeRatesQuery, Result<IReadOnlyList<ExchangeRateDto>>>
{
    private readonly IUnitOfWork _uow;
    public GetExchangeRatesQueryHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<IReadOnlyList<ExchangeRateDto>>> Handle(GetExchangeRatesQuery request, CancellationToken ct)
    {
        var repo = _uow.Repository<ExchangeRate>();
        var all = await repo.GetAllAsync(ct);
        var dtos = all.OrderByDescending(r => r.CreatedAtUtc).Select(r => new ExchangeRateDto(
            r.Id, r.FromCurrencyCode, r.ToCurrencyCode, r.Rate, r.EffectiveFrom, r.EffectiveTo,
            r.Status.ToString(), r.Source.ToString(), r.CreatedBy, r.CreatedAtUtc, r.ModifiedBy, r.LastModifiedAtUtc)).ToList();
        return Result.Success<IReadOnlyList<ExchangeRateDto>>(dtos);
    }
}

// ── Get Currency Dashboard ────────────────────────────────────────────────────
public sealed record GetCurrencyDashboardQuery : IQuery<Result<CurrencyDashboardDto>>;

public sealed class GetCurrencyDashboardQueryHandler : IRequestHandler<GetCurrencyDashboardQuery, Result<CurrencyDashboardDto>>
{
    private readonly IUnitOfWork _uow;
    public GetCurrencyDashboardQueryHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<CurrencyDashboardDto>> Handle(GetCurrencyDashboardQuery request, CancellationToken ct)
    {
        var currRepo = _uow.Repository<INK.ERP.Domain.Entities.Pricing.Currency>();
        var rateRepo = _uow.Repository<ExchangeRate>();

        var currencies = await currRepo.GetAllAsync(ct);
        var rates = await rateRepo.GetAllAsync(ct);

        var baseCurrency = currencies.FirstOrDefault(c => c.IsBaseCurrency);
        var baseCurrencyCode = baseCurrency?.Code ?? "INR";

        var activeCurrencies = currencies.Count(c => c.Status == CurrencyStatus.Active);
        var activeRates = rates.Count(r => r.Status == ExchangeRateStatus.Active);

        decimal? GetLatestRate(string from, string to) => rates
            .Where(r => r.FromCurrencyCode == from && r.ToCurrencyCode == to && r.Status == ExchangeRateStatus.Active)
            .OrderByDescending(r => r.EffectiveFrom).FirstOrDefault()?.Rate;

        var dto = new CurrencyDashboardDto(
            baseCurrencyCode,
            activeCurrencies,
            activeRates,
            GetLatestRate("USD", "INR"),
            GetLatestRate("EUR", "INR"),
            GetLatestRate("AED", "INR")
        );

        return Result.Success(dto);
    }
}
