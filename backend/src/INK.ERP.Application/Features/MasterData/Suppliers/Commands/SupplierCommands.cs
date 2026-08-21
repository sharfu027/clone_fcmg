using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Suppliers.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Application.Features.MasterData.Suppliers.Commands;

public record CreateSupplierCommand(
    Guid CompanyId,
    string? Code,
    string LegalName,
    string? TradeName,
    string? Gstin,
    string? Pan,
    string Email,
    string Phone,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    int PaymentTermsDays,
    decimal CreditLimit) : IRequest<Result<SupplierDto>>;

public class CreateSupplierCommandHandler : IRequestHandler<CreateSupplierCommand, Result<SupplierDto>>
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateSupplierCommandHandler(
        ISupplierRepository supplierRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _supplierRepository = supplierRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<SupplierDto>> Handle(CreateSupplierCommand request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<SupplierDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<SupplierDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        var code = string.IsNullOrWhiteSpace(request.Code)
            ? await _supplierRepository.GenerateNextCodeAsync(targetCompanyId, cancellationToken)
            : request.Code.ToUpperInvariant().Trim();

        if (!await _supplierRepository.IsCodeUniqueAsync(targetCompanyId, code, null, cancellationToken))
        {
            return Result<SupplierDto>.Failure(Error.Conflict("Supplier.DuplicateCode", $"Supplier code '{code}' already exists under company '{company.LegalName}'."));
        }

        var supplier = new Supplier
        {
            CompanyId = targetCompanyId,
            Code = code,
            LegalName = request.LegalName.Trim(),
            TradeName = request.TradeName?.Trim(),
            Gstin = request.Gstin?.ToUpperInvariant().Trim() ?? string.Empty,
            Pan = request.Pan?.ToUpperInvariant().Trim() ?? string.Empty,
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country),
            PaymentTermsDays = request.PaymentTermsDays,
            CreditLimit = request.CreditLimit,
            IsActive = true
        };

        await _supplierRepository.AddAsync(supplier, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new SupplierDto(
            supplier.Id,
            supplier.CompanyId,
            company.LegalName,
            supplier.Code,
            supplier.LegalName,
            supplier.TradeName,
            supplier.Gstin,
            supplier.Pan,
            supplier.Email,
            supplier.Phone,
            supplier.Address.AddressLine1,
            supplier.Address.AddressLine2,
            supplier.Address.City,
            supplier.Address.State,
            supplier.Address.PostalCode,
            supplier.Address.Country,
            supplier.PaymentTermsDays,
            supplier.CreditLimit,
            supplier.IsActive,
            supplier.CreatedAtUtc);

        return Result<SupplierDto>.Success(dto);
    }
}

public record UpdateSupplierCommand(
    Guid Id,
    Guid CompanyId,
    string Code,
    string LegalName,
    string? TradeName,
    string? Gstin,
    string? Pan,
    string Email,
    string Phone,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    int PaymentTermsDays,
    decimal CreditLimit,
    bool IsActive) : IRequest<Result<SupplierDto>>;

public class UpdateSupplierCommandHandler : IRequestHandler<UpdateSupplierCommand, Result<SupplierDto>>
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateSupplierCommandHandler(
        ISupplierRepository supplierRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _supplierRepository = supplierRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<SupplierDto>> Handle(UpdateSupplierCommand request, CancellationToken cancellationToken)
    {
        var supplier = await _supplierRepository.GetByIdAsync(request.Id, cancellationToken);
        if (supplier == null)
        {
            return Result<SupplierDto>.Failure(Error.NotFound("Supplier.NotFound", $"Supplier with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(supplier.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<SupplierDto>.Failure(accessResult.Error);
        }

        var company = await _companyRepository.GetByIdAsync(supplier.CompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<SupplierDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{supplier.CompanyId}' was not found."));
        }

        if (!await _supplierRepository.IsCodeUniqueAsync(supplier.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<SupplierDto>.Failure(Error.Conflict("Supplier.DuplicateCode", $"Supplier code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        supplier.Code = request.Code.ToUpperInvariant().Trim();
        supplier.LegalName = request.LegalName.Trim();
        supplier.TradeName = request.TradeName?.Trim();
        supplier.Gstin = request.Gstin?.ToUpperInvariant().Trim() ?? string.Empty;
        supplier.Pan = request.Pan?.ToUpperInvariant().Trim() ?? string.Empty;
        supplier.Email = request.Email.Trim();
        supplier.Phone = request.Phone.Trim();
        supplier.Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country);
        supplier.PaymentTermsDays = request.PaymentTermsDays;
        supplier.CreditLimit = request.CreditLimit;
        supplier.IsActive = request.IsActive;

        await _supplierRepository.UpdateAsync(supplier, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new SupplierDto(
            supplier.Id,
            supplier.CompanyId,
            company.LegalName,
            supplier.Code,
            supplier.LegalName,
            supplier.TradeName,
            supplier.Gstin,
            supplier.Pan,
            supplier.Email,
            supplier.Phone,
            supplier.Address.AddressLine1,
            supplier.Address.AddressLine2,
            supplier.Address.City,
            supplier.Address.State,
            supplier.Address.PostalCode,
            supplier.Address.Country,
            supplier.PaymentTermsDays,
            supplier.CreditLimit,
            supplier.IsActive,
            supplier.CreatedAtUtc);

        return Result<SupplierDto>.Success(dto);
    }
}

public record DeleteSupplierCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteSupplierCommandHandler : IRequestHandler<DeleteSupplierCommand, Result<Unit>>
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteSupplierCommandHandler(
        ISupplierRepository supplierRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _supplierRepository = supplierRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteSupplierCommand request, CancellationToken cancellationToken)
    {
        var supplier = await _supplierRepository.GetByIdAsync(request.Id, cancellationToken);
        if (supplier == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Supplier.NotFound", $"Supplier with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(supplier.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Unit>.Failure(accessResult.Error);
        }

        await _supplierRepository.DeleteAsync(supplier, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
