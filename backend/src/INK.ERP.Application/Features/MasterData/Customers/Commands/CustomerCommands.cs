using System;
using System.Threading;
using System.Threading.Tasks;
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
    Guid? RouteId,
    double? Latitude = null,
    double? Longitude = null) : IRequest<Result<CustomerDto>>;

public class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, Result<CustomerDto>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserRepository _userRepository;
    private readonly ISfaRepository _sfaRepository;

    public CreateCustomerCommandHandler(
        ICustomerRepository customerRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver,
        ICurrentUserService currentUserService,
        IUserRepository userRepository,
        ISfaRepository sfaRepository)
    {
        _customerRepository = customerRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
        _currentUserService = currentUserService;
        _userRepository = userRepository;
        _sfaRepository = sfaRepository;
    }

    public async Task<Result<CustomerDto>> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<CustomerDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;
        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(targetCompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<CustomerDto>.Failure(accessResult.Error);
        }

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<CustomerDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        if (!await _customerRepository.IsCodeUniqueAsync(targetCompanyId, request.Code, null, cancellationToken))
        {
            return Result<CustomerDto>.Failure(Error.Conflict("Customer.DuplicateCode", $"Customer code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            CompanyId = targetCompanyId,
            Code = request.Code.ToUpperInvariant().Trim(),
            LegalName = request.LegalName.Trim(),
            TradeName = request.TradeName?.Trim(),
            CustomerType = string.IsNullOrWhiteSpace(request.CustomerType) ? "Retailer" : request.CustomerType.Trim(),
            Gstin = request.Gstin?.ToUpperInvariant().Trim(),
            Pan = request.Pan?.ToUpperInvariant().Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country),
            CreditLimit = request.CreditLimit,
            CreditDays = request.CreditDays,
            RouteId = request.RouteId,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            IsActive = true
        };

        await _customerRepository.AddAsync(customer, cancellationToken);

        // If created by a Sales Representative / Employee, auto-assign this customer to them
        if (Guid.TryParse(_currentUserService.UserId, out var currentUserId))
        {
            var currentUser = await _userRepository.GetByIdAsync(currentUserId, cancellationToken);
            if (currentUser?.EmployeeId != null)
            {
                var assignment = new INK.ERP.Domain.Entities.SFA.SalesRepCustomerAssignment
                {
                    Id = Guid.NewGuid(),
                    CompanyId = targetCompanyId,
                    EmployeeId = currentUser.EmployeeId.Value,
                    CustomerId = customer.Id,
                    AssignedFromUtc = DateTime.UtcNow,
                    IsActive = true
                };
                await _sfaRepository.AddCustomerAssignmentAsync(assignment, cancellationToken);
            }
        }

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
            customer.Latitude,
            customer.Longitude,
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
    double? Latitude = null,
    double? Longitude = null,
    bool IsActive = true) : IRequest<Result<CustomerDto>>;

public class UpdateCustomerCommandHandler : IRequestHandler<UpdateCustomerCommand, Result<CustomerDto>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateCustomerCommandHandler(
        ICustomerRepository customerRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _customerRepository = customerRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<CustomerDto>> Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(request.Id, cancellationToken);
        if (customer == null)
        {
            return Result<CustomerDto>.Failure(Error.NotFound("Customer.NotFound", $"Customer with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(customer.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<CustomerDto>.Failure(accessResult.Error);
        }

        var company = await _companyRepository.GetByIdAsync(customer.CompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<CustomerDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{customer.CompanyId}' was not found."));
        }

        if (!await _customerRepository.IsCodeUniqueAsync(customer.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<CustomerDto>.Failure(Error.Conflict("Customer.DuplicateCode", $"Customer code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

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
        customer.CreditDays = request.CreditDays;
        customer.RouteId = request.RouteId;
        customer.Latitude = request.Latitude;
        customer.Longitude = request.Longitude;
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
            customer.Latitude,
            customer.Longitude,
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
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteCustomerCommandHandler(
        ICustomerRepository customerRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _customerRepository = customerRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(request.Id, cancellationToken);
        if (customer == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Customer.NotFound", $"Customer with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(customer.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Unit>.Failure(accessResult.Error);
        }

        await _customerRepository.DeleteAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
