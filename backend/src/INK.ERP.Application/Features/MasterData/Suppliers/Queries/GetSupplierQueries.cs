using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Suppliers.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Suppliers.Queries;

public record GetNextSupplierCodeQuery(Guid CompanyId) : IRequest<Result<string>>;

public class GetNextSupplierCodeQueryHandler : IRequestHandler<GetNextSupplierCodeQuery, Result<string>>
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetNextSupplierCodeQueryHandler(ISupplierRepository supplierRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _supplierRepository = supplierRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<string>> Handle(GetNextSupplierCodeQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;
        var code = await _supplierRepository.GenerateNextCodeAsync(targetCompanyId, cancellationToken);
        return Result<string>.Success(code);
    }
}

public record GetSupplierByIdQuery(Guid Id) : IRequest<Result<SupplierDto>>;

public class GetSupplierByIdQueryHandler : IRequestHandler<GetSupplierByIdQuery, Result<SupplierDto>>
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetSupplierByIdQueryHandler(ISupplierRepository supplierRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _supplierRepository = supplierRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<SupplierDto>> Handle(GetSupplierByIdQuery request, CancellationToken cancellationToken)
    {
        var supplier = await _supplierRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (supplier == null)
        {
            return Result<SupplierDto>.Failure(Error.NotFound("Supplier.NotFound", $"Supplier with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(supplier.CompanyId, cancellationToken))
        {
            return Result<SupplierDto>.Failure(Error.NotFound("Supplier.NotFound", $"Supplier with ID '{request.Id}' was not found."));
        }

        var dto = new SupplierDto(
            supplier.Id,
            supplier.CompanyId,
            supplier.Company?.LegalName,
            supplier.Code,
            supplier.LegalName,
            supplier.TradeName,
            supplier.SupplierType,
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

public record GetSuppliersPagedQuery(
    Guid? CompanyId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<SupplierDto>>>;

public class GetSuppliersPagedQueryHandler : IRequestHandler<GetSuppliersPagedQuery, Result<IReadOnlyList<SupplierDto>>>
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetSuppliersPagedQueryHandler(ISupplierRepository supplierRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _supplierRepository = supplierRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<SupplierDto>>> Handle(GetSuppliersPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<SupplierDto>>(new List<SupplierDto>());
        }

        var suppliers = await _supplierRepository.GetAllWithDetailsAsync(cancellationToken);
        var query = suppliers.AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(s => s.CompanyId == effectiveCompanyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(s => s.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     s.LegalName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     s.SupplierType.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     s.Gstin.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(s => s.IsActive == isActive);
        }

        var list = query
            .OrderBy(s => s.Code)
            .Select(supplier => new SupplierDto(
                supplier.Id,
                supplier.CompanyId,
                supplier.Company != null ? supplier.Company.LegalName : null,
                supplier.Code,
                supplier.LegalName,
                supplier.TradeName,
                supplier.SupplierType,
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
                supplier.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<SupplierDto>>(list);
    }
}
