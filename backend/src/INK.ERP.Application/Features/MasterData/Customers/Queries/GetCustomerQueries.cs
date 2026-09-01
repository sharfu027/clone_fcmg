using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Customers.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Customers.Queries;

public record GetCustomerByIdQuery(Guid Id) : IRequest<Result<CustomerDto>>;

public class GetCustomerByIdQueryHandler : IRequestHandler<GetCustomerByIdQuery, Result<CustomerDto>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetCustomerByIdQueryHandler(ICustomerRepository customerRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _customerRepository = customerRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<CustomerDto>> Handle(GetCustomerByIdQuery request, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(request.Id, cancellationToken);
        if (customer == null)
        {
            return Result<CustomerDto>.Failure(Error.NotFound("Customer.NotFound", $"Customer with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(customer.CompanyId, cancellationToken))
        {
            return Result<CustomerDto>.Failure(Error.NotFound("Customer.NotFound", $"Customer with ID '{request.Id}' was not found."));
        }

        var dto = new CustomerDto(
            customer.Id,
            customer.CompanyId,
            customer.Company?.LegalName,
            customer.Code,
            customer.LegalName,
            customer.TradeName,
            customer.CustomerType,
            customer.Gstin,
            customer.Pan,
            customer.Email,
            customer.Phone,
            customer.Address.AddressLine1,
            customer.Address.AddressLine2,
            customer.Address.City,
            customer.Address.State,
            customer.Address.PostalCode,
            customer.Address.Country,
            customer.CreditLimit,
            customer.CreditDays,
            customer.RouteId,
            customer.Latitude,
            customer.Longitude,
            customer.IsActive,
            customer.CreatedAtUtc);

        return Result<CustomerDto>.Success(dto);
    }
}

public record GetCustomersPagedQuery(
    Guid? CompanyId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<CustomerDto>>>;

public class GetCustomersPagedQueryHandler : IRequestHandler<GetCustomersPagedQuery, Result<IReadOnlyList<CustomerDto>>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetCustomersPagedQueryHandler(ICustomerRepository customerRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _customerRepository = customerRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<CustomerDto>>> Handle(GetCustomersPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<CustomerDto>>(new List<CustomerDto>());
        }

        var customers = await _customerRepository.GetAllAsync(cancellationToken);
        var query = customers.AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(c => c.CompanyId == effectiveCompanyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(c => c.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     c.LegalName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     (!string.IsNullOrEmpty(c.TradeName) && c.TradeName.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                                     (!string.IsNullOrEmpty(c.Gstin) && c.Gstin.Contains(search, StringComparison.OrdinalIgnoreCase)));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(c => c.IsActive == isActive);
        }

        var list = query
            .OrderBy(c => c.Code)
            .Select(customer => new CustomerDto(
                customer.Id,
                customer.CompanyId,
                customer.Company != null ? customer.Company.LegalName : null,
                customer.Code,
                customer.LegalName,
                customer.TradeName,
                customer.CustomerType,
                customer.Gstin,
                customer.Pan,
                customer.Email,
                customer.Phone,
                customer.Address.AddressLine1,
                customer.Address.AddressLine2,
                customer.Address.City,
                customer.Address.State,
                customer.Address.PostalCode,
                customer.Address.Country,
                customer.CreditLimit,
                customer.CreditDays,
                customer.RouteId,
                customer.Latitude,
                customer.Longitude,
                customer.IsActive,
                customer.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<CustomerDto>>(list);
    }
}
