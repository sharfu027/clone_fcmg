using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Pricing.PriceLists.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Features.Pricing.PriceLists.Commands;

public record CreatePriceListCommand(
    Guid CompanyId,
    string Name,
    string? Description,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    List<PriceListItemDto> Items) : IRequest<Result<PriceListDto>>;

public class CreatePriceListCommandHandler : IRequestHandler<CreatePriceListCommand, Result<PriceListDto>>
{
    private readonly IPriceListRepository _priceListRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreatePriceListCommandHandler(IPriceListRepository priceListRepository, IUnitOfWork unitOfWork)
    {
        _priceListRepository = priceListRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PriceListDto>> Handle(CreatePriceListCommand request, CancellationToken cancellationToken)
    {
        var isUnique = await _priceListRepository.IsNameUniqueAsync(request.CompanyId, request.Name, null, cancellationToken);
        if (!isUnique)
        {
            return Result<PriceListDto>.Failure(Error.Conflict("PriceList.DuplicateName", $"A price list named '{request.Name}' already exists for this company."));
        }

        var priceList = new PriceList
        {
            CompanyId = request.CompanyId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo,
            Status = PriceListStatus.Draft,
            Version = 1,
            ConcurrencyToken = Guid.NewGuid().ToString()
        };

        if (request.Items != null)
        {
            foreach (var itemDto in request.Items)
            {
                priceList.Items.Add(new PriceListItem
                {
                    PriceListId = priceList.Id,
                    ProductId = itemDto.ProductId,
                    Price = itemDto.BasePrice,
                    CurrencyCode = string.IsNullOrWhiteSpace(itemDto.CurrencyCode) ? "INR" : itemDto.CurrencyCode.Trim(),
                    EffectiveDate = itemDto.EffectiveDate == default ? request.EffectiveFrom : itemDto.EffectiveDate,
                    IsActive = itemDto.IsActive
                });
            }
        }

        await _priceListRepository.AddAsync(priceList, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = MapToDto(priceList);
        return Result<PriceListDto>.Success(dto);
    }

    private static PriceListDto MapToDto(PriceList entity)
    {
        var items = entity.Items
            .Where(i => !i.IsDeleted)
            .Select(i => new PriceListItemDto(
                i.Id,
                i.PriceListId,
                i.ProductId,
                null,
                null,
                i.Price,
                i.Price, // MSRP default fallback
                i.Price, // MinSellingPrice default fallback
                i.CurrencyCode,
                i.EffectiveDate,
                i.IsActive))
            .ToList();

        return new PriceListDto(
            entity.Id,
            entity.CompanyId,
            entity.Name,
            entity.Description,
            entity.EffectiveFrom,
            entity.EffectiveTo,
            entity.Status.ToString(),
            entity.Version,
            entity.ConcurrencyToken,
            entity.IsDeleted,
            entity.CreatedAtUtc,
            entity.LastModifiedAtUtc,
            items);
    }
}

public record UpdatePriceListCommand(
    Guid Id,
    Guid CompanyId,
    string Name,
    string? Description,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    string ConcurrencyToken,
    List<PriceListItemDto> Items) : IRequest<Result<PriceListDto>>;

public class UpdatePriceListCommandHandler : IRequestHandler<UpdatePriceListCommand, Result<PriceListDto>>
{
    private readonly IPriceListRepository _priceListRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdatePriceListCommandHandler(IPriceListRepository priceListRepository, IUnitOfWork unitOfWork)
    {
        _priceListRepository = priceListRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PriceListDto>> Handle(UpdatePriceListCommand request, CancellationToken cancellationToken)
    {
        var priceList = await _priceListRepository.GetByIdAsync(request.Id, cancellationToken);
        if (priceList == null || priceList.IsDeleted)
        {
            return Result<PriceListDto>.Failure(Error.NotFound("PriceList.NotFound", $"Price list with ID '{request.Id}' was not found."));
        }

        if (priceList.ConcurrencyToken != request.ConcurrencyToken)
        {
            return Result<PriceListDto>.Failure(Error.Conflict("PriceList.ConcurrencyError", "The price list was modified by another user. Please reload and try again."));
        }

        var isUnique = await _priceListRepository.IsNameUniqueAsync(request.CompanyId, request.Name, request.Id, cancellationToken);
        if (!isUnique)
        {
            return Result<PriceListDto>.Failure(Error.Conflict("PriceList.DuplicateName", $"A price list named '{request.Name}' already exists for this company."));
        }

        priceList.CompanyId = request.CompanyId;
        priceList.Name = request.Name.Trim();
        priceList.Description = request.Description?.Trim();
        priceList.EffectiveFrom = request.EffectiveFrom;
        priceList.EffectiveTo = request.EffectiveTo;
        priceList.ConcurrencyToken = Guid.NewGuid().ToString();

        // Update items collection
        priceList.Items.Clear();
        if (request.Items != null)
        {
            foreach (var itemDto in request.Items)
            {
                priceList.Items.Add(new PriceListItem
                {
                    PriceListId = priceList.Id,
                    ProductId = itemDto.ProductId,
                    Price = itemDto.BasePrice,
                    CurrencyCode = string.IsNullOrWhiteSpace(itemDto.CurrencyCode) ? "INR" : itemDto.CurrencyCode.Trim(),
                    EffectiveDate = itemDto.EffectiveDate == default ? request.EffectiveFrom : itemDto.EffectiveDate,
                    IsActive = itemDto.IsActive
                });
            }
        }

        _priceListRepository.Update(priceList);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = MapToDto(priceList);
        return Result<PriceListDto>.Success(dto);
    }

    private static PriceListDto MapToDto(PriceList entity)
    {
        var items = entity.Items
            .Where(i => !i.IsDeleted)
            .Select(i => new PriceListItemDto(
                i.Id,
                i.PriceListId,
                i.ProductId,
                null,
                null,
                i.Price,
                i.Price,
                i.Price,
                i.CurrencyCode,
                i.EffectiveDate,
                i.IsActive))
            .ToList();

        return new PriceListDto(
            entity.Id,
            entity.CompanyId,
            entity.Name,
            entity.Description,
            entity.EffectiveFrom,
            entity.EffectiveTo,
            entity.Status.ToString(),
            entity.Version,
            entity.ConcurrencyToken,
            entity.IsDeleted,
            entity.CreatedAtUtc,
            entity.LastModifiedAtUtc,
            items);
    }
}

public record PublishPriceListCommand(Guid Id, string ConcurrencyToken) : IRequest<Result<PriceListDto>>;

public class PublishPriceListCommandHandler : IRequestHandler<PublishPriceListCommand, Result<PriceListDto>>
{
    private readonly IPriceListRepository _priceListRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PublishPriceListCommandHandler(IPriceListRepository priceListRepository, IUnitOfWork unitOfWork)
    {
        _priceListRepository = priceListRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PriceListDto>> Handle(PublishPriceListCommand request, CancellationToken cancellationToken)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var priceList = await _priceListRepository.GetByIdAsync(request.Id, cancellationToken);
            if (priceList == null || priceList.IsDeleted)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return Result<PriceListDto>.Failure(Error.NotFound("PriceList.NotFound", $"Price list with ID '{request.Id}' was not found."));
            }

            if (priceList.ConcurrencyToken != request.ConcurrencyToken)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return Result<PriceListDto>.Failure(Error.Conflict("PriceList.ConcurrencyError", "The price list was modified by another user."));
            }

            if (priceList.Status != PriceListStatus.Draft)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                return Result<PriceListDto>.Failure(Error.Validation("PriceList.InvalidStatus", $"Only Draft price lists can be Published. Current status is {priceList.Status}."));
            }

            priceList.Status = PriceListStatus.Published;
            priceList.Version += 1;
            priceList.ConcurrencyToken = Guid.NewGuid().ToString();

            _priceListRepository.Update(priceList);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            var dto = MapToDto(priceList);
            return Result<PriceListDto>.Success(dto);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    private static PriceListDto MapToDto(PriceList entity)
    {
        var items = entity.Items
            .Where(i => !i.IsDeleted)
            .Select(i => new PriceListItemDto(
                i.Id,
                i.PriceListId,
                i.ProductId,
                null,
                null,
                i.Price,
                i.Price,
                i.Price,
                i.CurrencyCode,
                i.EffectiveDate,
                i.IsActive))
            .ToList();

        return new PriceListDto(
            entity.Id,
            entity.CompanyId,
            entity.Name,
            entity.Description,
            entity.EffectiveFrom,
            entity.EffectiveTo,
            entity.Status.ToString(),
            entity.Version,
            entity.ConcurrencyToken,
            entity.IsDeleted,
            entity.CreatedAtUtc,
            entity.LastModifiedAtUtc,
            items);
    }
}

public record ArchivePriceListCommand(Guid Id, string ConcurrencyToken) : IRequest<Result<PriceListDto>>;

public class ArchivePriceListCommandHandler : IRequestHandler<ArchivePriceListCommand, Result<PriceListDto>>
{
    private readonly IPriceListRepository _priceListRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ArchivePriceListCommandHandler(IPriceListRepository priceListRepository, IUnitOfWork unitOfWork)
    {
        _priceListRepository = priceListRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PriceListDto>> Handle(ArchivePriceListCommand request, CancellationToken cancellationToken)
    {
        var priceList = await _priceListRepository.GetByIdAsync(request.Id, cancellationToken);
        if (priceList == null || priceList.IsDeleted)
        {
            return Result<PriceListDto>.Failure(Error.NotFound("PriceList.NotFound", $"Price list with ID '{request.Id}' was not found."));
        }

        if (priceList.ConcurrencyToken != request.ConcurrencyToken)
        {
            return Result<PriceListDto>.Failure(Error.Conflict("PriceList.ConcurrencyError", "The price list was modified by another user."));
        }

        priceList.Status = PriceListStatus.Archived;
        priceList.ConcurrencyToken = Guid.NewGuid().ToString();

        _priceListRepository.Update(priceList);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = MapToDto(priceList);
        return Result<PriceListDto>.Success(dto);
    }

    private static PriceListDto MapToDto(PriceList entity)
    {
        var items = entity.Items
            .Where(i => !i.IsDeleted)
            .Select(i => new PriceListItemDto(
                i.Id,
                i.PriceListId,
                i.ProductId,
                null,
                null,
                i.Price,
                i.Price,
                i.Price,
                i.CurrencyCode,
                i.EffectiveDate,
                i.IsActive))
            .ToList();

        return new PriceListDto(
            entity.Id,
            entity.CompanyId,
            entity.Name,
            entity.Description,
            entity.EffectiveFrom,
            entity.EffectiveTo,
            entity.Status.ToString(),
            entity.Version,
            entity.ConcurrencyToken,
            entity.IsDeleted,
            entity.CreatedAtUtc,
            entity.LastModifiedAtUtc,
            items);
    }
}

public record DeletePriceListCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeletePriceListCommandHandler : IRequestHandler<DeletePriceListCommand, Result<Unit>>
{
    private readonly IPriceListRepository _priceListRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeletePriceListCommandHandler(IPriceListRepository priceListRepository, IUnitOfWork unitOfWork)
    {
        _priceListRepository = priceListRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeletePriceListCommand request, CancellationToken cancellationToken)
    {
        var priceList = await _priceListRepository.GetByIdAsync(request.Id, cancellationToken);
        if (priceList == null || priceList.IsDeleted)
        {
            return Result<Unit>.Failure(Error.NotFound("PriceList.NotFound", $"Price list with ID '{request.Id}' was not found."));
        }

        priceList.IsDeleted = true;
        foreach (var item in priceList.Items)
        {
            item.IsDeleted = true;
        }

        _priceListRepository.Update(priceList);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
