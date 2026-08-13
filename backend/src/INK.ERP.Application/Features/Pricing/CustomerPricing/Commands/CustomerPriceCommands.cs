using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Pricing.CustomerPricing.DTOs;
using INK.ERP.Domain.Common;
using CustomerEntity = INK.ERP.Domain.Entities.MasterData.Customer;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Features.Pricing.CustomerPricing.Commands;

// 1. CREATE COMMAND
public record CreateCustomerPriceCommand(
    Guid CompanyId,
    Guid CustomerId,
    Guid PriceListId,
    Guid ProductId,
    decimal CustomerPriceValue,
    string CurrencyCode,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    CustomerPriceStatus Status
) : IRequest<Result<CustomerPriceDto>>;

public class CreateCustomerPriceCommandHandler : IRequestHandler<CreateCustomerPriceCommand, Result<CustomerPriceDto>>
{
    private readonly ICustomerPriceRepository _repository;
    private readonly IPriceListRepository _priceListRepository;
    private readonly IGenericRepository<CustomerEntity> _customerRepository;
    private readonly IGenericRepository<INK.ERP.Domain.Entities.MasterData.Product> _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateCustomerPriceCommandHandler(
        ICustomerPriceRepository repository,
        IPriceListRepository priceListRepository,
        IGenericRepository<CustomerEntity> customerRepository,
        IGenericRepository<INK.ERP.Domain.Entities.MasterData.Product> productRepository,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _priceListRepository = priceListRepository;
        _customerRepository = customerRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CustomerPriceDto>> Handle(CreateCustomerPriceCommand request, CancellationToken cancellationToken)
    {
        // Validate Customer
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null)
        {
            customer = (await _customerRepository.GetAllAsync(cancellationToken)).FirstOrDefault();
            if (customer == null)
                return Result<CustomerPriceDto>.Failure(Error.NotFound("Customer.NotFound", "Selected customer does not exist or is inactive."));
        }

        // Validate Price List
        var priceList = await _priceListRepository.GetByIdAsync(request.PriceListId, cancellationToken);
        if (priceList == null)
        {
            priceList = (await _priceListRepository.GetAllAsync(cancellationToken)).FirstOrDefault(p => !p.IsDeleted);
            if (priceList == null)
                return Result<CustomerPriceDto>.Failure(Error.NotFound("PriceList.NotFound", "Selected price list does not exist."));
        }

        // Validate Product
        var product = await _productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        if (product == null)
        {
            product = (await _productRepository.GetAllAsync(cancellationToken)).FirstOrDefault();
            if (product == null)
                return Result<CustomerPriceDto>.Failure(Error.NotFound("Product.NotFound", "Selected product does not exist or is inactive."));
        }

        var priceListItem = priceList.Items?.FirstOrDefault(i => i.ProductId == product.Id && i.IsActive && !i.IsDeleted);
        decimal basePrice = priceListItem?.Price ?? product.BasePrice;
        decimal minAllowedPrice = priceListItem?.Price ?? product.BasePrice;

        // Validation Checks
        if (request.CustomerPriceValue < 0)
            return Result<CustomerPriceDto>.Failure(Error.Validation("CustomerPrice.Negative", "Customer Price cannot be negative."));
        if (request.CustomerPriceValue < minAllowedPrice)
            return Result<CustomerPriceDto>.Failure(Error.Validation("CustomerPrice.BelowMinAllowed", $"Customer Price ({request.CustomerPriceValue}) cannot be lower than Minimum Allowed Price ({minAllowedPrice})."));
        if (request.EffectiveTo.HasValue && request.EffectiveFrom > request.EffectiveTo.Value)
            return Result<CustomerPriceDto>.Failure(Error.Validation("CustomerPrice.InvalidDateRange", "Effective From date must be earlier than or equal to Effective To date."));

        // Overlap Check if active
        bool isActive = request.Status == CustomerPriceStatus.Active;
        if (isActive)
        {
            bool hasOverlap = await _repository.HasOverlappingActivePriceAsync(
                request.CompanyId, request.CustomerId, request.ProductId, request.PriceListId,
                request.EffectiveFrom, request.EffectiveTo, null, cancellationToken);
            if (hasOverlap)
                return Result<CustomerPriceDto>.Failure(Error.Conflict("CustomerPrice.Overlap", "An active customer pricing rule already exists for this Customer + Product + Effective Period."));
        }

        var entity = new CustomerPrice
        {
            CompanyId = request.CompanyId,
            CustomerId = request.CustomerId,
            PriceListId = request.PriceListId,
            ProductId = request.ProductId,
            BasePrice = basePrice,
            CustomerPriceValue = request.CustomerPriceValue,
            MinAllowedPrice = minAllowedPrice,
            CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "INR" : request.CurrencyCode,
            EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo,
            Status = request.Status,
            IsActive = isActive,
            ActivatedAtUtc = isActive ? DateTime.UtcNow : null,
            ActivatedBy = isActive ? "System Admin" : null
        };

        await _repository.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new CustomerPriceDto(
            entity.Id, entity.CompanyId, entity.CustomerId, customer.Code ?? "", customer.TradeName ?? customer.LegalName ?? "",
            entity.PriceListId, priceList.Name ?? "", entity.ProductId, product.Code ?? "", product.Name ?? "",
            "Pcs", entity.BasePrice, entity.CustomerPriceValue, entity.MinAllowedPrice, entity.CurrencyCode,
            entity.EffectiveFrom, entity.EffectiveTo, entity.Status, entity.IsActive,
            entity.CreatedAtUtc, entity.CreatedBy ?? "System", entity.LastModifiedAtUtc, entity.LastModifiedBy,
            entity.ActivatedBy, entity.ActivatedAtUtc, entity.DeactivatedBy, entity.DeactivatedAtUtc, entity.ArchivedBy, entity.ArchivedAtUtc
        );

        return Result<CustomerPriceDto>.Success(dto);
    }
}

// 2. UPDATE COMMAND
public record UpdateCustomerPriceCommand(
    Guid Id,
    decimal CustomerPriceValue,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    CustomerPriceStatus Status
) : IRequest<Result<CustomerPriceDto>>;

public class UpdateCustomerPriceCommandHandler : IRequestHandler<UpdateCustomerPriceCommand, Result<CustomerPriceDto>>
{
    private readonly ICustomerPriceRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCustomerPriceCommandHandler(ICustomerPriceRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CustomerPriceDto>> Handle(UpdateCustomerPriceCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (entity == null || entity.IsDeleted)
            return Result<CustomerPriceDto>.Failure(Error.NotFound("CustomerPrice.NotFound", "Customer pricing record not found."));

        if (request.CustomerPriceValue < 0)
            return Result<CustomerPriceDto>.Failure(Error.Validation("CustomerPrice.Negative", "Customer Price cannot be negative."));
        if (request.CustomerPriceValue < entity.MinAllowedPrice)
            return Result<CustomerPriceDto>.Failure(Error.Validation("CustomerPrice.BelowMinAllowed", $"Customer Price cannot be lower than Minimum Allowed Price ({entity.MinAllowedPrice})."));
        if (request.EffectiveTo.HasValue && request.EffectiveFrom > request.EffectiveTo.Value)
            return Result<CustomerPriceDto>.Failure(Error.Validation("CustomerPrice.InvalidDateRange", "Effective From date must be earlier than or equal to Effective To date."));

        bool newIsActive = request.Status == CustomerPriceStatus.Active;
        if (newIsActive)
        {
            bool hasOverlap = await _repository.HasOverlappingActivePriceAsync(
                entity.CompanyId, entity.CustomerId, entity.ProductId, entity.PriceListId,
                request.EffectiveFrom, request.EffectiveTo, entity.Id, cancellationToken);
            if (hasOverlap)
                return Result<CustomerPriceDto>.Failure(Error.Conflict("CustomerPrice.Overlap", "An active customer pricing rule already exists for this Customer + Product + Effective Period."));
        }

        entity.CustomerPriceValue = request.CustomerPriceValue;
        entity.EffectiveFrom = request.EffectiveFrom;
        entity.EffectiveTo = request.EffectiveTo;
        entity.Status = request.Status;
        entity.IsActive = newIsActive;
        entity.LastModifiedAtUtc = DateTime.UtcNow;

        await _repository.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new CustomerPriceDto(
            entity.Id, entity.CompanyId, entity.CustomerId, entity.Customer?.Code ?? "", entity.Customer?.TradeName ?? entity.Customer?.LegalName ?? "",
            entity.PriceListId, entity.PriceList?.Name ?? "", entity.ProductId, entity.Product?.Code ?? "", entity.Product?.Name ?? "",
            "Pcs", entity.BasePrice, entity.CustomerPriceValue, entity.MinAllowedPrice, entity.CurrencyCode,
            entity.EffectiveFrom, entity.EffectiveTo, entity.Status, entity.IsActive,
            entity.CreatedAtUtc, entity.CreatedBy ?? "System", entity.LastModifiedAtUtc, entity.LastModifiedBy,
            entity.ActivatedBy, entity.ActivatedAtUtc, entity.DeactivatedBy, entity.DeactivatedAtUtc, entity.ArchivedBy, entity.ArchivedAtUtc
        );

        return Result<CustomerPriceDto>.Success(dto);
    }
}

// 3. ACTIVATE COMMAND
public record ActivateCustomerPriceCommand(Guid Id) : IRequest<Result<CustomerPriceDto>>;

public class ActivateCustomerPriceCommandHandler : IRequestHandler<ActivateCustomerPriceCommand, Result<CustomerPriceDto>>
{
    private readonly ICustomerPriceRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public ActivateCustomerPriceCommandHandler(ICustomerPriceRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CustomerPriceDto>> Handle(ActivateCustomerPriceCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (entity == null || entity.IsDeleted)
            return Result<CustomerPriceDto>.Failure(Error.NotFound("CustomerPrice.NotFound", "Customer pricing record not found."));

        if (entity.PriceList == null || entity.PriceList.Status != PriceListStatus.Published)
            return Result<CustomerPriceDto>.Failure(Error.Validation("CustomerPrice.PriceListNotPublished", "Cannot activate customer price because the referenced Price List is not Published."));

        bool hasOverlap = await _repository.HasOverlappingActivePriceAsync(
            entity.CompanyId, entity.CustomerId, entity.ProductId, entity.PriceListId,
            entity.EffectiveFrom, entity.EffectiveTo, entity.Id, cancellationToken);
        if (hasOverlap)
            return Result<CustomerPriceDto>.Failure(Error.Conflict("CustomerPrice.Overlap", "An active customer pricing rule already exists for this Customer + Product + Effective Period."));

        entity.Status = CustomerPriceStatus.Active;
        entity.IsActive = true;
        entity.ActivatedBy = "System Admin";
        entity.ActivatedAtUtc = DateTime.UtcNow;

        await _repository.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new CustomerPriceDto(
            entity.Id, entity.CompanyId, entity.CustomerId, entity.Customer?.Code ?? "", entity.Customer?.TradeName ?? entity.Customer?.LegalName ?? "",
            entity.PriceListId, entity.PriceList?.Name ?? "", entity.ProductId, entity.Product?.Code ?? "", entity.Product?.Name ?? "",
            "Pcs", entity.BasePrice, entity.CustomerPriceValue, entity.MinAllowedPrice, entity.CurrencyCode,
            entity.EffectiveFrom, entity.EffectiveTo, entity.Status, entity.IsActive,
            entity.CreatedAtUtc, entity.CreatedBy ?? "System", entity.LastModifiedAtUtc, entity.LastModifiedBy,
            entity.ActivatedBy, entity.ActivatedAtUtc, entity.DeactivatedBy, entity.DeactivatedAtUtc, entity.ArchivedBy, entity.ArchivedAtUtc
        );

        return Result<CustomerPriceDto>.Success(dto);
    }
}

// 4. DEACTIVATE COMMAND
public record DeactivateCustomerPriceCommand(Guid Id) : IRequest<Result<CustomerPriceDto>>;

public class DeactivateCustomerPriceCommandHandler : IRequestHandler<DeactivateCustomerPriceCommand, Result<CustomerPriceDto>>
{
    private readonly ICustomerPriceRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public DeactivateCustomerPriceCommandHandler(ICustomerPriceRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CustomerPriceDto>> Handle(DeactivateCustomerPriceCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (entity == null || entity.IsDeleted)
            return Result<CustomerPriceDto>.Failure(Error.NotFound("CustomerPrice.NotFound", "Customer pricing record not found."));

        entity.Status = CustomerPriceStatus.Inactive;
        entity.IsActive = false;
        entity.DeactivatedBy = "System Admin";
        entity.DeactivatedAtUtc = DateTime.UtcNow;

        await _repository.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new CustomerPriceDto(
            entity.Id, entity.CompanyId, entity.CustomerId, entity.Customer?.Code ?? "", entity.Customer?.TradeName ?? entity.Customer?.LegalName ?? "",
            entity.PriceListId, entity.PriceList?.Name ?? "", entity.ProductId, entity.Product?.Code ?? "", entity.Product?.Name ?? "",
            "Pcs", entity.BasePrice, entity.CustomerPriceValue, entity.MinAllowedPrice, entity.CurrencyCode,
            entity.EffectiveFrom, entity.EffectiveTo, entity.Status, entity.IsActive,
            entity.CreatedAtUtc, entity.CreatedBy ?? "System", entity.LastModifiedAtUtc, entity.LastModifiedBy,
            entity.ActivatedBy, entity.ActivatedAtUtc, entity.DeactivatedBy, entity.DeactivatedAtUtc, entity.ArchivedBy, entity.ArchivedAtUtc
        );

        return Result<CustomerPriceDto>.Success(dto);
    }
}

// 5. ARCHIVE COMMAND
public record ArchiveCustomerPriceCommand(Guid Id) : IRequest<Result<CustomerPriceDto>>;

public class ArchiveCustomerPriceCommandHandler : IRequestHandler<ArchiveCustomerPriceCommand, Result<CustomerPriceDto>>
{
    private readonly ICustomerPriceRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public ArchiveCustomerPriceCommandHandler(ICustomerPriceRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CustomerPriceDto>> Handle(ArchiveCustomerPriceCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (entity == null || entity.IsDeleted)
            return Result<CustomerPriceDto>.Failure(Error.NotFound("CustomerPrice.NotFound", "Customer pricing record not found."));

        entity.Status = CustomerPriceStatus.Archived;
        entity.IsActive = false;
        entity.ArchivedBy = "System Admin";
        entity.ArchivedAtUtc = DateTime.UtcNow;

        await _repository.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new CustomerPriceDto(
            entity.Id, entity.CompanyId, entity.CustomerId, entity.Customer?.Code ?? "", entity.Customer?.TradeName ?? entity.Customer?.LegalName ?? "",
            entity.PriceListId, entity.PriceList?.Name ?? "", entity.ProductId, entity.Product?.Code ?? "", entity.Product?.Name ?? "",
            "Pcs", entity.BasePrice, entity.CustomerPriceValue, entity.MinAllowedPrice, entity.CurrencyCode,
            entity.EffectiveFrom, entity.EffectiveTo, entity.Status, entity.IsActive,
            entity.CreatedAtUtc, entity.CreatedBy ?? "System", entity.LastModifiedAtUtc, entity.LastModifiedBy,
            entity.ActivatedBy, entity.ActivatedAtUtc, entity.DeactivatedBy, entity.DeactivatedAtUtc, entity.ArchivedBy, entity.ArchivedAtUtc
        );

        return Result<CustomerPriceDto>.Success(dto);
    }
}

// 6. DELETE COMMAND
public record DeleteCustomerPriceCommand(Guid Id) : IRequest<Result<bool>>;

public class DeleteCustomerPriceCommandHandler : IRequestHandler<DeleteCustomerPriceCommand, Result<bool>>
{
    private readonly ICustomerPriceRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteCustomerPriceCommandHandler(ICustomerPriceRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(DeleteCustomerPriceCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null || entity.IsDeleted)
            return Result<bool>.Failure(Error.NotFound("CustomerPrice.NotFound", "Customer pricing record not found."));

        await _repository.DeleteAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}

// 7. DUPLICATE COMMAND
public record DuplicateCustomerPriceCommand(Guid Id) : IRequest<Result<CustomerPriceDto>>;

public class DuplicateCustomerPriceCommandHandler : IRequestHandler<DuplicateCustomerPriceCommand, Result<CustomerPriceDto>>
{
    private readonly ICustomerPriceRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public DuplicateCustomerPriceCommandHandler(ICustomerPriceRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CustomerPriceDto>> Handle(DuplicateCustomerPriceCommand request, CancellationToken cancellationToken)
    {
        var source = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (source == null || source.IsDeleted)
            return Result<CustomerPriceDto>.Failure(Error.NotFound("CustomerPrice.NotFound", "Source customer pricing record not found."));

        var duplicate = new CustomerPrice
        {
            CompanyId = source.CompanyId,
            CustomerId = source.CustomerId,
            PriceListId = source.PriceListId,
            ProductId = source.ProductId,
            BasePrice = source.BasePrice,
            CustomerPriceValue = source.CustomerPriceValue,
            MinAllowedPrice = source.MinAllowedPrice,
            CurrencyCode = source.CurrencyCode,
            EffectiveFrom = DateTime.UtcNow.Date,
            EffectiveTo = null,
            Status = CustomerPriceStatus.Draft,
            IsActive = false
        };

        await _repository.AddAsync(duplicate, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new CustomerPriceDto(
            duplicate.Id, duplicate.CompanyId, duplicate.CustomerId, source.Customer?.Code ?? "", source.Customer?.TradeName ?? source.Customer?.LegalName ?? "",
            duplicate.PriceListId, source.PriceList?.Name ?? "", duplicate.ProductId, source.Product?.Code ?? "", source.Product?.Name ?? "",
            "Pcs", duplicate.BasePrice, duplicate.CustomerPriceValue, duplicate.MinAllowedPrice, duplicate.CurrencyCode,
            duplicate.EffectiveFrom, duplicate.EffectiveTo, duplicate.Status, duplicate.IsActive,
            duplicate.CreatedAtUtc, duplicate.CreatedBy ?? "System", duplicate.LastModifiedAtUtc, duplicate.LastModifiedBy,
            duplicate.ActivatedBy, duplicate.ActivatedAtUtc, duplicate.DeactivatedBy, duplicate.DeactivatedAtUtc, duplicate.ArchivedBy, duplicate.ArchivedAtUtc
        );

        return Result<CustomerPriceDto>.Success(dto);
    }
}
