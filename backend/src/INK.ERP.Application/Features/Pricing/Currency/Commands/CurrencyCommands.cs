using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Features.Pricing.Currency.Commands;

// ── Create Currency ──────────────────────────────────────────────────────────
public sealed record CreateCurrencyCommand(
    string Code,
    string Name,
    string Symbol,
    int DecimalPlaces,
    bool IsBaseCurrency
) : IRequest<Result<Guid>>;

public sealed class CreateCurrencyCommandHandler : IRequestHandler<CreateCurrencyCommand, Result<Guid>>
{
    private readonly IUnitOfWork _uow;
    public CreateCurrencyCommandHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<Guid>> Handle(CreateCurrencyCommand request, CancellationToken ct)
    {
        var repo = _uow.Repository<INK.ERP.Domain.Entities.Pricing.Currency>();
        var existing = await repo.FindAsync(c => c.Code == request.Code.ToUpperInvariant().Trim(), ct);
        if (existing.Any())
            return Result.Failure<Guid>(Error.Conflict("Currency.Duplicate", $"Currency with code '{request.Code}' already exists."));

        if (request.IsBaseCurrency)
        {
            var currentBase = await repo.FindAsync(c => c.IsBaseCurrency, ct);
            foreach (var b in currentBase)
            {
                b.UnsetBase();
                _uow.Repository<INK.ERP.Domain.Entities.Pricing.Currency>().Update(b);
            }
        }

        var currency = new INK.ERP.Domain.Entities.Pricing.Currency(
            request.Code, request.Name, request.Symbol, request.DecimalPlaces, request.IsBaseCurrency);

        await repo.AddAsync(currency, ct);
        await _uow.SaveChangesAsync(ct);
        return Result.Success(currency.Id);
    }
}

// ── Update Currency ──────────────────────────────────────────────────────────
public sealed record UpdateCurrencyCommand(
    Guid Id,
    string Name,
    string Symbol,
    int DecimalPlaces
) : IRequest<Result>;

public sealed class UpdateCurrencyCommandHandler : IRequestHandler<UpdateCurrencyCommand, Result>
{
    private readonly IUnitOfWork _uow;
    public UpdateCurrencyCommandHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<Result> Handle(UpdateCurrencyCommand request, CancellationToken ct)
    {
        var repo = _uow.Repository<INK.ERP.Domain.Entities.Pricing.Currency>();
        var currency = await repo.GetByIdAsync(request.Id, ct);
        if (currency is null)
            return Result.Failure(Error.NotFound("Currency.NotFound", $"Currency '{request.Id}' not found."));

        currency.Update(request.Name, request.Symbol, request.DecimalPlaces);
        repo.Update(currency);
        await _uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}

// ── Activate Currency ─────────────────────────────────────────────────────────
public sealed record ActivateCurrencyCommand(Guid Id) : IRequest<Result>;

public sealed class ActivateCurrencyCommandHandler : IRequestHandler<ActivateCurrencyCommand, Result>
{
    private readonly IUnitOfWork _uow;
    public ActivateCurrencyCommandHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<Result> Handle(ActivateCurrencyCommand request, CancellationToken ct)
    {
        var repo = _uow.Repository<INK.ERP.Domain.Entities.Pricing.Currency>();
        var currency = await repo.GetByIdAsync(request.Id, ct);
        if (currency is null)
            return Result.Failure(Error.NotFound("Currency.NotFound", $"Currency '{request.Id}' not found."));

        currency.Activate();
        repo.Update(currency);
        await _uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}

// ── Deactivate Currency ───────────────────────────────────────────────────────
public sealed record DeactivateCurrencyCommand(Guid Id) : IRequest<Result>;

public sealed class DeactivateCurrencyCommandHandler : IRequestHandler<DeactivateCurrencyCommand, Result>
{
    private readonly IUnitOfWork _uow;
    public DeactivateCurrencyCommandHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<Result> Handle(DeactivateCurrencyCommand request, CancellationToken ct)
    {
        var repo = _uow.Repository<INK.ERP.Domain.Entities.Pricing.Currency>();
        var currency = await repo.GetByIdAsync(request.Id, ct);
        if (currency is null)
            return Result.Failure(Error.NotFound("Currency.NotFound", $"Currency '{request.Id}' not found."));
        if (currency.IsBaseCurrency)
            return Result.Failure(Error.Validation("Currency.BaseCannotDeactivate", "The base currency cannot be deactivated."));

        currency.Deactivate();
        repo.Update(currency);
        await _uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
