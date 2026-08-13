using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Features.Pricing.Currency.Commands;

// ── Create Exchange Rate ──────────────────────────────────────────────────────
public sealed record CreateExchangeRateCommand(
    string FromCurrencyCode,
    string ToCurrencyCode,
    decimal Rate,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    RateSource Source
) : IRequest<Result<Guid>>;

public sealed class CreateExchangeRateCommandHandler : IRequestHandler<CreateExchangeRateCommand, Result<Guid>>
{
    private readonly IUnitOfWork _uow;
    public CreateExchangeRateCommandHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<Guid>> Handle(CreateExchangeRateCommand request, CancellationToken ct)
    {
        var from = request.FromCurrencyCode.ToUpperInvariant().Trim();
        var to = request.ToCurrencyCode.ToUpperInvariant().Trim();

        if (from == to)
            return Result.Failure<Guid>(Error.Validation("ExchangeRate.SameCurrency", "From and To currencies cannot be the same."));
        if (request.Rate <= 0)
            return Result.Failure<Guid>(Error.Validation("ExchangeRate.InvalidRate", "Exchange Rate must be greater than 0. Example: 1 USD = 86.50 INR"));
        if (request.EffectiveTo.HasValue && request.EffectiveTo.Value <= request.EffectiveFrom)
            return Result.Failure<Guid>(Error.Validation("ExchangeRate.InvalidDates", "Effective From must be before Effective To."));

        var repo = _uow.Repository<ExchangeRate>();
        var exchangeRate = new ExchangeRate(from, to, request.Rate, request.EffectiveFrom, request.EffectiveTo, request.Source);
        await repo.AddAsync(exchangeRate, ct);
        await _uow.SaveChangesAsync(ct);
        return Result.Success(exchangeRate.Id);
    }
}

// ── Update Exchange Rate ──────────────────────────────────────────────────────
public sealed record UpdateExchangeRateCommand(
    Guid Id,
    decimal Rate,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo
) : IRequest<Result>;

public sealed class UpdateExchangeRateCommandHandler : IRequestHandler<UpdateExchangeRateCommand, Result>
{
    private readonly IUnitOfWork _uow;
    public UpdateExchangeRateCommandHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<Result> Handle(UpdateExchangeRateCommand request, CancellationToken ct)
    {
        var repo = _uow.Repository<ExchangeRate>();
        var rate = await repo.GetByIdAsync(request.Id, ct);
        if (rate is null)
            return Result.Failure(Error.NotFound("ExchangeRate.NotFound", $"Exchange rate '{request.Id}' not found."));
        if (rate.Status == ExchangeRateStatus.Archived)
            return Result.Failure(Error.Validation("ExchangeRate.Archived", "Cannot modify an archived exchange rate."));
        if (request.Rate <= 0)
            return Result.Failure(Error.Validation("ExchangeRate.InvalidRate", "Exchange Rate must be greater than 0. Example: 1 USD = 86.50 INR"));
        if (request.EffectiveTo.HasValue && request.EffectiveTo.Value <= request.EffectiveFrom)
            return Result.Failure(Error.Validation("ExchangeRate.InvalidDates", "Effective From must be before Effective To."));

        rate.Update(request.Rate, request.EffectiveFrom, request.EffectiveTo);
        repo.Update(rate);
        await _uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}

// ── Activate Exchange Rate ────────────────────────────────────────────────────
public sealed record ActivateExchangeRateCommand(Guid Id) : IRequest<Result>;

public sealed class ActivateExchangeRateCommandHandler : IRequestHandler<ActivateExchangeRateCommand, Result>
{
    private readonly IUnitOfWork _uow;
    public ActivateExchangeRateCommandHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<Result> Handle(ActivateExchangeRateCommand request, CancellationToken ct)
    {
        var repo = _uow.Repository<ExchangeRate>();
        var rate = await repo.GetByIdAsync(request.Id, ct);
        if (rate is null)
            return Result.Failure(Error.NotFound("ExchangeRate.NotFound", $"Exchange rate '{request.Id}' not found."));

        rate.Activate();
        repo.Update(rate);
        await _uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}

// ── Archive Exchange Rate ─────────────────────────────────────────────────────
public sealed record ArchiveExchangeRateCommand(Guid Id) : IRequest<Result>;

public sealed class ArchiveExchangeRateCommandHandler : IRequestHandler<ArchiveExchangeRateCommand, Result>
{
    private readonly IUnitOfWork _uow;
    public ArchiveExchangeRateCommandHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<Result> Handle(ArchiveExchangeRateCommand request, CancellationToken ct)
    {
        var repo = _uow.Repository<ExchangeRate>();
        var rate = await repo.GetByIdAsync(request.Id, ct);
        if (rate is null)
            return Result.Failure(Error.NotFound("ExchangeRate.NotFound", $"Exchange rate '{request.Id}' not found."));

        rate.Archive();
        repo.Update(rate);
        await _uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
