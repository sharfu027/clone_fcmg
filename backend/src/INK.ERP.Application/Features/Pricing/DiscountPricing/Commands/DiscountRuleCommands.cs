using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Application.Features.Pricing.DiscountPricing.DTOs;
using CustomerEntity = INK.ERP.Domain.Entities.MasterData.Customer;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Features.Pricing.DiscountPricing.Commands;

public record CreateDiscountRuleCommand(
    Guid CompanyId,
    string? RuleCode,
    string RuleName,
    string? Description,
    DiscountMethod DiscountMethod,
    decimal DiscountValue,
    DiscountScope Scope,
    Guid? CustomerId,
    Guid? ProductId,
    Guid? CategoryId,
    Guid? PriceListId,
    int? MinimumQuantity,
    int? MaximumQuantity,
    decimal? MaximumDiscountAmount,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    int Priority,
    DiscountRuleStatus Status
) : IRequest<Result<DiscountRuleDto>>;

public class CreateDiscountRuleCommandHandler : IRequestHandler<CreateDiscountRuleCommand, Result<DiscountRuleDto>>
{
    private readonly IDiscountRuleRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public CreateDiscountRuleCommandHandler(
        IDiscountRuleRepository repository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<DiscountRuleDto>> Handle(CreateDiscountRuleCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RuleName))
            return Result<DiscountRuleDto>.Failure(Error.Validation("RuleName.Required", "Rule Name is required. Example: Monsoon Festive Bulk Discount"));

        if (request.DiscountMethod == DiscountMethod.Percentage && (request.DiscountValue <= 0 || request.DiscountValue > 100))
            return Result<DiscountRuleDto>.Failure(Error.Validation("DiscountValue.InvalidPercentage", "Discount percentage must be between 0 and 100. Example: 10%"));

        if (request.DiscountMethod == DiscountMethod.FixedAmount && request.DiscountValue <= 0)
            return Result<DiscountRuleDto>.Failure(Error.Validation("DiscountValue.InvalidFixed", "Fixed discount amount must be greater than 0. Example: 50"));

        if (request.EffectiveTo.HasValue && request.EffectiveFrom > request.EffectiveTo.Value)
            return Result<DiscountRuleDto>.Failure(Error.Validation("EffectiveTo.Invalid", "Effective From date must be earlier than or equal to Effective To date."));

        if (request.MinimumQuantity.HasValue && request.MinimumQuantity.Value <= 0)
            return Result<DiscountRuleDto>.Failure(Error.Validation("MinimumQuantity.Invalid", "Minimum Quantity must be greater than 0."));

        if (request.MaximumQuantity.HasValue && request.MinimumQuantity.HasValue && request.MaximumQuantity.Value < request.MinimumQuantity.Value)
            return Result<DiscountRuleDto>.Failure(Error.Validation("MaximumQuantity.Invalid", "Maximum Quantity must be greater than or equal to Minimum Quantity."));

        string code = !string.IsNullOrWhiteSpace(request.RuleCode)
            ? request.RuleCode.Trim()
            : $"DSC-{DateTime.UtcNow.Year}-{Math.Floor(1000 + Random.Shared.NextDouble() * 9000)}";

        string user = _currentUserService.UserId ?? "System Admin";

        var rule = new DiscountRule
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            RuleCode = code,
            RuleName = request.RuleName.Trim(),
            Description = request.Description?.Trim(),
            DiscountMethod = request.DiscountMethod,
            DiscountValue = request.DiscountValue,
            Scope = request.Scope,
            CustomerId = request.CustomerId,
            ProductId = request.ProductId,
            CategoryId = request.CategoryId,
            PriceListId = request.PriceListId,
            MinimumQuantity = request.MinimumQuantity,
            MaximumQuantity = request.MaximumQuantity,
            MaximumDiscountAmount = request.MaximumDiscountAmount,
            EffectiveFrom = request.EffectiveFrom.ToUniversalTime(),
            EffectiveTo = request.EffectiveTo?.ToUniversalTime(),
            Priority = request.Priority > 0 ? request.Priority : 1,
            Status = request.Status,
            IsActive = request.Status == DiscountRuleStatus.Active,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = user,
            ActivatedBy = request.Status == DiscountRuleStatus.Active ? user : null,
            ActivatedAtUtc = request.Status == DiscountRuleStatus.Active ? DateTime.UtcNow : null
        };

        await _repository.AddAsync(rule, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _repository.GetByIdWithDetailsAsync(rule.Id, cancellationToken);
        return Result<DiscountRuleDto>.Success(MapToDto(created ?? rule));
    }

    private static DiscountRuleDto MapToDto(DiscountRule r) => new(
        r.Id, r.CompanyId, r.RuleCode, r.RuleName, r.Description,
        r.DiscountMethod, r.DiscountValue, r.Scope,
        r.CustomerId, r.Customer?.Code, r.Customer != null ? (r.Customer.TradeName ?? r.Customer.LegalName) : null,
        r.ProductId, r.Product?.Code, r.Product?.Name,
        r.CategoryId, null,
        r.PriceListId, r.PriceList?.Name,
        r.MinimumQuantity, r.MaximumQuantity, r.MaximumDiscountAmount,
        r.EffectiveFrom, r.EffectiveTo, r.Priority,
        r.Status, r.IsActive,
        r.CreatedAtUtc, r.CreatedBy, r.LastModifiedAtUtc, r.LastModifiedBy,
        r.ActivatedBy, r.ActivatedAtUtc, r.DeactivatedBy, r.DeactivatedAtUtc, r.ArchivedBy, r.ArchivedAtUtc
    );
}

public record UpdateDiscountRuleCommand(
    Guid Id,
    string RuleName,
    string? Description,
    DiscountMethod DiscountMethod,
    decimal DiscountValue,
    DiscountScope Scope,
    Guid? CustomerId,
    Guid? ProductId,
    Guid? CategoryId,
    Guid? PriceListId,
    int? MinimumQuantity,
    int? MaximumQuantity,
    decimal? MaximumDiscountAmount,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    int Priority,
    DiscountRuleStatus Status
) : IRequest<Result<DiscountRuleDto>>;

public class UpdateDiscountRuleCommandHandler : IRequestHandler<UpdateDiscountRuleCommand, Result<DiscountRuleDto>>
{
    private readonly IDiscountRuleRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public UpdateDiscountRuleCommandHandler(
        IDiscountRuleRepository repository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<DiscountRuleDto>> Handle(UpdateDiscountRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rule == null) return Result<DiscountRuleDto>.Failure(Error.NotFound("DiscountRule.NotFound", "Discount rule not found."));

        if (string.IsNullOrWhiteSpace(request.RuleName))
            return Result<DiscountRuleDto>.Failure(Error.Validation("RuleName.Required", "Rule Name is required."));

        if (request.DiscountMethod == DiscountMethod.Percentage && (request.DiscountValue <= 0 || request.DiscountValue > 100))
            return Result<DiscountRuleDto>.Failure(Error.Validation("DiscountValue.InvalidPercentage", "Discount percentage must be between 0 and 100."));

        if (request.DiscountMethod == DiscountMethod.FixedAmount && request.DiscountValue <= 0)
            return Result<DiscountRuleDto>.Failure(Error.Validation("DiscountValue.InvalidFixed", "Fixed discount amount must be greater than 0."));

        string user = _currentUserService.UserId ?? "System Admin";

        rule.RuleName = request.RuleName.Trim();
        rule.Description = request.Description?.Trim();
        rule.DiscountMethod = request.DiscountMethod;
        rule.DiscountValue = request.DiscountValue;
        rule.Scope = request.Scope;
        rule.CustomerId = request.CustomerId;
        rule.ProductId = request.ProductId;
        rule.CategoryId = request.CategoryId;
        rule.PriceListId = request.PriceListId;
        rule.MinimumQuantity = request.MinimumQuantity;
        rule.MaximumQuantity = request.MaximumQuantity;
        rule.MaximumDiscountAmount = request.MaximumDiscountAmount;
        rule.EffectiveFrom = request.EffectiveFrom.ToUniversalTime();
        rule.EffectiveTo = request.EffectiveTo?.ToUniversalTime();
        rule.Priority = request.Priority;
        rule.Status = request.Status;
        rule.IsActive = request.Status == DiscountRuleStatus.Active;
        rule.LastModifiedAtUtc = DateTime.UtcNow;
        rule.LastModifiedBy = user;

        if (request.Status == DiscountRuleStatus.Active && rule.ActivatedAtUtc == null)
        {
            rule.ActivatedBy = user;
            rule.ActivatedAtUtc = DateTime.UtcNow;
        }

        await _repository.UpdateAsync(rule, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _repository.GetByIdWithDetailsAsync(rule.Id, cancellationToken);
        return Result<DiscountRuleDto>.Success(MapToDto(updated ?? rule));
    }

    private static DiscountRuleDto MapToDto(DiscountRule r) => new(
        r.Id, r.CompanyId, r.RuleCode, r.RuleName, r.Description,
        r.DiscountMethod, r.DiscountValue, r.Scope,
        r.CustomerId, r.Customer?.Code, r.Customer != null ? (r.Customer.TradeName ?? r.Customer.LegalName) : null,
        r.ProductId, r.Product?.Code, r.Product?.Name,
        r.CategoryId, null,
        r.PriceListId, r.PriceList?.Name,
        r.MinimumQuantity, r.MaximumQuantity, r.MaximumDiscountAmount,
        r.EffectiveFrom, r.EffectiveTo, r.Priority,
        r.Status, r.IsActive,
        r.CreatedAtUtc, r.CreatedBy, r.LastModifiedAtUtc, r.LastModifiedBy,
        r.ActivatedBy, r.ActivatedAtUtc, r.DeactivatedBy, r.DeactivatedAtUtc, r.ArchivedBy, r.ArchivedAtUtc
    );
}

public record ActivateDiscountRuleCommand(Guid Id) : IRequest<Result<DiscountRuleDto>>;
public class ActivateDiscountRuleCommandHandler : IRequestHandler<ActivateDiscountRuleCommand, Result<DiscountRuleDto>>
{
    private readonly IDiscountRuleRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public ActivateDiscountRuleCommandHandler(IDiscountRuleRepository repository, IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<DiscountRuleDto>> Handle(ActivateDiscountRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rule == null) return Result<DiscountRuleDto>.Failure(Error.NotFound("DiscountRule.NotFound", "Discount rule not found."));

        string user = _currentUserService.UserId ?? "System Admin";
        rule.Status = DiscountRuleStatus.Active;
        rule.IsActive = true;
        rule.ActivatedBy = user;
        rule.ActivatedAtUtc = DateTime.UtcNow;
        rule.LastModifiedAtUtc = DateTime.UtcNow;
        rule.LastModifiedBy = user;

        await _repository.UpdateAsync(rule, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<DiscountRuleDto>.Success(MapToDto(rule));
    }

    private static DiscountRuleDto MapToDto(DiscountRule r) => new(
        r.Id, r.CompanyId, r.RuleCode, r.RuleName, r.Description,
        r.DiscountMethod, r.DiscountValue, r.Scope,
        r.CustomerId, r.Customer?.Code, r.Customer != null ? (r.Customer.TradeName ?? r.Customer.LegalName) : null,
        r.ProductId, r.Product?.Code, r.Product?.Name,
        r.CategoryId, null,
        r.PriceListId, r.PriceList?.Name,
        r.MinimumQuantity, r.MaximumQuantity, r.MaximumDiscountAmount,
        r.EffectiveFrom, r.EffectiveTo, r.Priority,
        r.Status, r.IsActive,
        r.CreatedAtUtc, r.CreatedBy, r.LastModifiedAtUtc, r.LastModifiedBy,
        r.ActivatedBy, r.ActivatedAtUtc, r.DeactivatedBy, r.DeactivatedAtUtc, r.ArchivedBy, r.ArchivedAtUtc
    );
}

public record DeactivateDiscountRuleCommand(Guid Id) : IRequest<Result<DiscountRuleDto>>;
public class DeactivateDiscountRuleCommandHandler : IRequestHandler<DeactivateDiscountRuleCommand, Result<DiscountRuleDto>>
{
    private readonly IDiscountRuleRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public DeactivateDiscountRuleCommandHandler(IDiscountRuleRepository repository, IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<DiscountRuleDto>> Handle(DeactivateDiscountRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rule == null) return Result<DiscountRuleDto>.Failure(Error.NotFound("DiscountRule.NotFound", "Discount rule not found."));

        string user = _currentUserService.UserId ?? "System Admin";
        rule.Status = DiscountRuleStatus.Inactive;
        rule.IsActive = false;
        rule.DeactivatedBy = user;
        rule.DeactivatedAtUtc = DateTime.UtcNow;
        rule.LastModifiedAtUtc = DateTime.UtcNow;
        rule.LastModifiedBy = user;

        await _repository.UpdateAsync(rule, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<DiscountRuleDto>.Success(MapToDto(rule));
    }

    private static DiscountRuleDto MapToDto(DiscountRule r) => new(
        r.Id, r.CompanyId, r.RuleCode, r.RuleName, r.Description,
        r.DiscountMethod, r.DiscountValue, r.Scope,
        r.CustomerId, r.Customer?.Code, r.Customer != null ? (r.Customer.TradeName ?? r.Customer.LegalName) : null,
        r.ProductId, r.Product?.Code, r.Product?.Name,
        r.CategoryId, null,
        r.PriceListId, r.PriceList?.Name,
        r.MinimumQuantity, r.MaximumQuantity, r.MaximumDiscountAmount,
        r.EffectiveFrom, r.EffectiveTo, r.Priority,
        r.Status, r.IsActive,
        r.CreatedAtUtc, r.CreatedBy, r.LastModifiedAtUtc, r.LastModifiedBy,
        r.ActivatedBy, r.ActivatedAtUtc, r.DeactivatedBy, r.DeactivatedAtUtc, r.ArchivedBy, r.ArchivedAtUtc
    );
}

public record ArchiveDiscountRuleCommand(Guid Id) : IRequest<Result<DiscountRuleDto>>;
public class ArchiveDiscountRuleCommandHandler : IRequestHandler<ArchiveDiscountRuleCommand, Result<DiscountRuleDto>>
{
    private readonly IDiscountRuleRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public ArchiveDiscountRuleCommandHandler(IDiscountRuleRepository repository, IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<DiscountRuleDto>> Handle(ArchiveDiscountRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rule == null) return Result<DiscountRuleDto>.Failure(Error.NotFound("DiscountRule.NotFound", "Discount rule not found."));

        string user = _currentUserService.UserId ?? "System Admin";
        rule.Status = DiscountRuleStatus.Archived;
        rule.IsActive = false;
        rule.ArchivedBy = user;
        rule.ArchivedAtUtc = DateTime.UtcNow;
        rule.LastModifiedAtUtc = DateTime.UtcNow;
        rule.LastModifiedBy = user;

        await _repository.UpdateAsync(rule, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<DiscountRuleDto>.Success(MapToDto(rule));
    }

    private static DiscountRuleDto MapToDto(DiscountRule r) => new(
        r.Id, r.CompanyId, r.RuleCode, r.RuleName, r.Description,
        r.DiscountMethod, r.DiscountValue, r.Scope,
        r.CustomerId, r.Customer?.Code, r.Customer != null ? (r.Customer.TradeName ?? r.Customer.LegalName) : null,
        r.ProductId, r.Product?.Code, r.Product?.Name,
        r.CategoryId, null,
        r.PriceListId, r.PriceList?.Name,
        r.MinimumQuantity, r.MaximumQuantity, r.MaximumDiscountAmount,
        r.EffectiveFrom, r.EffectiveTo, r.Priority,
        r.Status, r.IsActive,
        r.CreatedAtUtc, r.CreatedBy, r.LastModifiedAtUtc, r.LastModifiedBy,
        r.ActivatedBy, r.ActivatedAtUtc, r.DeactivatedBy, r.DeactivatedAtUtc, r.ArchivedBy, r.ArchivedAtUtc
    );
}

public record DeleteDiscountRuleCommand(Guid Id) : IRequest<Result<bool>>;
public class DeleteDiscountRuleCommandHandler : IRequestHandler<DeleteDiscountRuleCommand, Result<bool>>
{
    private readonly IDiscountRuleRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public DeleteDiscountRuleCommandHandler(IDiscountRuleRepository repository, IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<bool>> Handle(DeleteDiscountRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (rule == null) return Result<bool>.Failure(Error.NotFound("DiscountRule.NotFound", "Discount rule not found."));

        rule.IsDeleted = true;
        rule.DeletedAtUtc = DateTime.UtcNow;
        rule.DeletedBy = _currentUserService.UserId ?? "System Admin";

        await _repository.UpdateAsync(rule, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}

public record DuplicateDiscountRuleCommand(Guid Id) : IRequest<Result<DiscountRuleDto>>;
public class DuplicateDiscountRuleCommandHandler : IRequestHandler<DuplicateDiscountRuleCommand, Result<DiscountRuleDto>>
{
    private readonly IDiscountRuleRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public DuplicateDiscountRuleCommandHandler(IDiscountRuleRepository repository, IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<DiscountRuleDto>> Handle(DuplicateDiscountRuleCommand request, CancellationToken cancellationToken)
    {
        var existing = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (existing == null) return Result<DiscountRuleDto>.Failure(Error.NotFound("DiscountRule.NotFound", "Discount rule not found for duplication."));

        string user = _currentUserService.UserId ?? "System Admin";
        string code = $"DSC-{DateTime.UtcNow.Year}-{Math.Floor(1000 + Random.Shared.NextDouble() * 9000)}";

        var copy = new DiscountRule
        {
            Id = Guid.NewGuid(),
            CompanyId = existing.CompanyId,
            RuleCode = code,
            RuleName = $"Copy of {existing.RuleName}",
            Description = existing.Description,
            DiscountMethod = existing.DiscountMethod,
            DiscountValue = existing.DiscountValue,
            Scope = existing.Scope,
            CustomerId = existing.CustomerId,
            ProductId = existing.ProductId,
            CategoryId = existing.CategoryId,
            PriceListId = existing.PriceListId,
            MinimumQuantity = existing.MinimumQuantity,
            MaximumQuantity = existing.MaximumQuantity,
            MaximumDiscountAmount = existing.MaximumDiscountAmount,
            EffectiveFrom = DateTime.UtcNow,
            EffectiveTo = existing.EffectiveTo,
            Priority = existing.Priority,
            Status = DiscountRuleStatus.Draft, // MUST BE DRAFT
            IsActive = false,                  // MUST NOT AUTOMATICALLY ACTIVATE
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = user
        };

        await _repository.AddAsync(copy, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _repository.GetByIdWithDetailsAsync(copy.Id, cancellationToken);
        return Result<DiscountRuleDto>.Success(MapToDto(created ?? copy));
    }

    private static DiscountRuleDto MapToDto(DiscountRule r) => new(
        r.Id, r.CompanyId, r.RuleCode, r.RuleName, r.Description,
        r.DiscountMethod, r.DiscountValue, r.Scope,
        r.CustomerId, r.Customer?.Code, r.Customer != null ? (r.Customer.TradeName ?? r.Customer.LegalName) : null,
        r.ProductId, r.Product?.Code, r.Product?.Name,
        r.CategoryId, null,
        r.PriceListId, r.PriceList?.Name,
        r.MinimumQuantity, r.MaximumQuantity, r.MaximumDiscountAmount,
        r.EffectiveFrom, r.EffectiveTo, r.Priority,
        r.Status, r.IsActive,
        r.CreatedAtUtc, r.CreatedBy, r.LastModifiedAtUtc, r.LastModifiedBy,
        r.ActivatedBy, r.ActivatedAtUtc, r.DeactivatedBy, r.DeactivatedAtUtc, r.ArchivedBy, r.ArchivedAtUtc
    );
}
