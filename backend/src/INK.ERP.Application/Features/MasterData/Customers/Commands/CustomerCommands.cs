using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Customers.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Application.Features.MasterData.Customers.Commands;

public record CreateCustomerCommand(
    Guid CompanyId,
    string Code,
    string LegalName,
    string? TradeName,
    string CustomerType,
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
    decimal CreditLimit,
    int CreditDays,
    Guid? RouteId) : IRequest<Result<CustomerDto>>;

public class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, Result<CustomerDto>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateCustomerCommandHandler(ICustomerRepository customerRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _customerRepository = customerRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CustomerDto>> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<CustomerDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _customerRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, null, cancellationToken))
        {
            return Result<CustomerDto>.Failure(Error.Conflict("Customer.DuplicateCode", $"Customer code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        var customer = new Customer
        {
            CompanyId = request.CompanyId,
            Code = request.Code.ToUpperInvariant().Trim(),
            LegalName = request.LegalName.Trim(),
            TradeName = request.TradeName?.Trim(),
            CustomerType = request.CustomerType,
            Gstin = request.Gstin?.ToUpperInvariant().Trim(),
            Pan = request.Pan?.ToUpperInvariant().Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country),
            CreditLimit = request.CreditLimit,
            CreditDays = request.CreditDays <= 0 ? 30 : request.CreditDays,
            RouteId = request.RouteId,
            IsActive = true
        };

        await _customerRepository.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new CustomerDto(
            customer.Id,
            customer.CompanyId,
            company.LegalName,
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
            customer.IsActive,
            customer.CreatedAtUtc);

        return Result<CustomerDto>.Success(dto);
    }
}

public record UpdateCustomerCommand(
    Guid Id,
    Guid CompanyId,
    string Code,
    string LegalName,
    string? TradeName,
    string CustomerType,
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
    decimal CreditLimit,
    int CreditDays,
    Guid? RouteId,
    bool IsActive) : IRequest<Result<CustomerDto>>;

public class UpdateCustomerCommandHandler : IRequestHandler<UpdateCustomerCommand, Result<CustomerDto>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCustomerCommandHandler(ICustomerRepository customerRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _customerRepository = customerRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CustomerDto>> Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(request.Id, cancellationToken);
        if (customer == null)
        {
            return Result<CustomerDto>.Failure(Error.NotFound("Customer.NotFound", $"Customer with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<CustomerDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _customerRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<CustomerDto>.Failure(Error.Conflict("Customer.DuplicateCode", $"Customer code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        customer.CompanyId = request.CompanyId;
        customer.Code = request.Code.ToUpperInvariant().Trim();
        customer.LegalName = request.LegalName.Trim();
        customer.TradeName = request.TradeName?.Trim();
        customer.CustomerType = request.CustomerType;
        customer.Gstin = request.Gstin?.ToUpperInvariant().Trim();
        customer.Pan = request.Pan?.ToUpperInvariant().Trim();
        customer.Email = request.Email.Trim();
        customer.Phone = request.Phone.Trim();
        customer.Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country);
        customer.CreditLimit = request.CreditLimit;
        customer.CreditDays = request.CreditDays <= 0 ? 30 : request.CreditDays;
        customer.RouteId = request.RouteId;
        customer.IsActive = request.IsActive;

        await _customerRepository.UpdateAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new CustomerDto(
            customer.Id,
            customer.CompanyId,
            company.LegalName,
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
            customer.IsActive,
            customer.CreatedAtUtc);

        return Result<CustomerDto>.Success(dto);
    }
}

public record DeleteCustomerCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteCustomerCommandHandler : IRequestHandler<DeleteCustomerCommand, Result<Unit>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteCustomerCommandHandler(ICustomerRepository customerRepository, IUnitOfWork unitOfWork)
    {
        _customerRepository = customerRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(request.Id, cancellationToken);
        if (customer == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Customer.NotFound", $"Customer with ID '{request.Id}' was not found."));
        }

        await _customerRepository.DeleteAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
