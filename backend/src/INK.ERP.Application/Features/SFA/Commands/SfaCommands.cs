using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.SFA.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.SFA;
using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.Application.Features.SFA.Commands;

// ----------------------------------------------------
// 1. ASSIGN CUSTOMER TO REP COMMAND
// ----------------------------------------------------
public record AssignCustomerToRepCommand(
    Guid CompanyId,
    Guid EmployeeId,
    Guid CustomerId,
    DateTime? AssignedFromUtc = null,
    DateTime? AssignedToUtc = null
) : IRequest<Result<SalesRepCustomerAssignmentDto>>;

public class AssignCustomerToRepCommandHandler : IRequestHandler<AssignCustomerToRepCommand, Result<SalesRepCustomerAssignmentDto>>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public AssignCustomerToRepCommandHandler(
        ISfaRepository sfaRepository,
        IEmployeeRepository employeeRepository,
        ICustomerRepository customerRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<SalesRepCustomerAssignmentDto>> Handle(AssignCustomerToRepCommand request, CancellationToken cancellationToken)
    {
        if (request.CompanyId == Guid.Empty)
            return Result<SalesRepCustomerAssignmentDto>.Failure(Error.Validation("SFA.EmptyCompany", "Company ID is required."));
        if (request.EmployeeId == Guid.Empty)
            return Result<SalesRepCustomerAssignmentDto>.Failure(Error.Validation("SFA.EmptyEmployee", "Please select a Sales Representative."));
        if (request.CustomerId == Guid.Empty)
            return Result<SalesRepCustomerAssignmentDto>.Failure(Error.Validation("SFA.EmptyCustomer", "Please select a Customer Store / Outlet."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesRepCustomerAssignmentDto>.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized company access."));

        var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId, cancellationToken);
        if (employee == null || employee.CompanyId != request.CompanyId)
            return Result<SalesRepCustomerAssignmentDto>.Failure(Error.NotFound("SFA.EmployeeNotFound", "Employee not found or does not belong to specified company."));
        if (!employee.IsActive)
            return Result<SalesRepCustomerAssignmentDto>.Failure(Error.Validation("SFA.InactiveEmployee", "Cannot assign customer to an inactive employee."));

        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null || customer.CompanyId != request.CompanyId)
            return Result<SalesRepCustomerAssignmentDto>.Failure(Error.NotFound("SFA.CustomerNotFound", "Customer not found or does not belong to specified company."));
        if (!customer.IsActive)
            return Result<SalesRepCustomerAssignmentDto>.Failure(Error.Validation("SFA.InactiveCustomer", "Cannot assign an inactive customer."));

        var existing = await _sfaRepository.GetActiveAssignmentAsync(request.CompanyId, request.EmployeeId, request.CustomerId, cancellationToken);
        if (existing != null)
            return Result<SalesRepCustomerAssignmentDto>.Failure(Error.Conflict("SFA.DuplicateAssignment", "Active assignment already exists for this employee and customer."));

        var assignment = new SalesRepCustomerAssignment
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            EmployeeId = request.EmployeeId,
            CustomerId = request.CustomerId,
            AssignedFromUtc = request.AssignedFromUtc ?? DateTime.UtcNow,
            AssignedToUtc = request.AssignedToUtc,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _sfaRepository.AddCustomerAssignmentAsync(assignment, cancellationToken);
        await _sfaRepository.SaveChangesAsync(cancellationToken);

        var dto = new SalesRepCustomerAssignmentDto(
            assignment.Id,
            assignment.CompanyId,
            assignment.EmployeeId,
            $"{employee.FirstName} {employee.LastName}".Trim(),
            employee.EmployeeCode,
            assignment.CustomerId,
            customer.LegalName,
            customer.Code,
            assignment.AssignedFromUtc,
            assignment.AssignedToUtc,
            assignment.IsActive
        );

        return Result.Success(dto);
    }
}

// ----------------------------------------------------
// 2. REMOVE CUSTOMER ASSIGNMENT COMMAND
// ----------------------------------------------------
public record RemoveCustomerAssignmentCommand(Guid Id) : IRequest<Result>;

public class RemoveCustomerAssignmentCommandHandler : IRequestHandler<RemoveCustomerAssignmentCommand, Result>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public RemoveCustomerAssignmentCommandHandler(ISfaRepository sfaRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result> Handle(RemoveCustomerAssignmentCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result.Failure(Error.Validation("SFA.InvalidId", "Assignment ID is required."));

        var assignment = await _sfaRepository.GetCustomerAssignmentByIdAsync(request.Id, cancellationToken);
        if (assignment == null)
            return Result.Failure(Error.NotFound("SFA.AssignmentNotFound", "Assignment not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(assignment.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized access."));

        assignment.IsActive = false;
        assignment.AssignedToUtc = DateTime.UtcNow;
        assignment.LastModifiedAtUtc = DateTime.UtcNow;

        await _sfaRepository.UpdateCustomerAssignmentAsync(assignment, cancellationToken);
        await _sfaRepository.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// ----------------------------------------------------
// 3. CREATE SALES BEAT COMMAND
// ----------------------------------------------------
public record CreateSalesBeatCommand(
    Guid CompanyId,
    string Code,
    string Name,
    Guid? SalesEmployeeId,
    string Frequency,
    List<Guid>? CustomerIds = null
) : IRequest<Result<SalesBeatDto>>;

public class CreateSalesBeatCommandHandler : IRequestHandler<CreateSalesBeatCommand, Result<SalesBeatDto>>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateSalesBeatCommandHandler(
        ISfaRepository sfaRepository,
        IEmployeeRepository employeeRepository,
        ICustomerRepository customerRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<SalesBeatDto>> Handle(CreateSalesBeatCommand request, CancellationToken cancellationToken)
    {
        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesBeatDto>.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized company access."));

        if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Name))
            return Result<SalesBeatDto>.Failure(Error.Validation("SFA.InvalidBeat", "Beat Code and Name are required."));

        Employee? employee = null;
        if (request.SalesEmployeeId.HasValue && request.SalesEmployeeId.Value != Guid.Empty)
        {
            employee = await _employeeRepository.GetByIdAsync(request.SalesEmployeeId.Value, cancellationToken);
            if (employee == null || employee.CompanyId != request.CompanyId)
                return Result<SalesBeatDto>.Failure(Error.NotFound("SFA.EmployeeNotFound", "Assigned employee not found or belongs to another company."));
        }

        var beat = new SalesBeat
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            Code = request.Code.Trim(),
            Name = request.Name.Trim(),
            SalesEmployeeId = request.SalesEmployeeId,
            Frequency = string.IsNullOrWhiteSpace(request.Frequency) ? "Daily" : request.Frequency.Trim(),
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        if (request.CustomerIds != null && request.CustomerIds.Count > 0)
        {
            int seq = 1;
            foreach (var custId in request.CustomerIds.Distinct())
            {
                var cust = await _customerRepository.GetByIdAsync(custId, cancellationToken);
                if (cust != null && cust.CompanyId == request.CompanyId)
                {
                    beat.Customers.Add(new SalesBeatCustomer
                    {
                        Id = Guid.NewGuid(),
                        SalesBeatId = beat.Id,
                        CustomerId = custId,
                        SequenceOrder = seq++,
                        CreatedAtUtc = DateTime.UtcNow
                    });
                }
            }
        }

        await _sfaRepository.AddSalesBeatAsync(beat, cancellationToken);
        await _sfaRepository.SaveChangesAsync(cancellationToken);

        var dto = new SalesBeatDto(
            beat.Id,
            beat.CompanyId,
            "Company",
            beat.SalesEmployeeId,
            employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : null,
            employee?.EmployeeCode,
            beat.Code,
            beat.Name,
            beat.Frequency,
            beat.IsActive,
            beat.Customers.Count,
            beat.Customers.Select(c => new SalesBeatCustomerDto(
                c.Id,
                c.SalesBeatId,
                c.CustomerId,
                "Customer",
                "CUST",
                null,
                null,
                null,
                c.SequenceOrder
            )).ToList(),
            beat.CreatedAtUtc
        );

        return Result.Success(dto);
    }
}

// ----------------------------------------------------
// 4. UPDATE SALES BEAT COMMAND
// ----------------------------------------------------
public record UpdateSalesBeatCommand(
    Guid Id,
    string Name,
    Guid? SalesEmployeeId,
    string Frequency,
    bool IsActive,
    List<Guid>? CustomerIds = null
) : IRequest<Result<SalesBeatDto>>;

public class UpdateSalesBeatCommandHandler : IRequestHandler<UpdateSalesBeatCommand, Result<SalesBeatDto>>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateSalesBeatCommandHandler(
        ISfaRepository sfaRepository,
        IEmployeeRepository employeeRepository,
        ICustomerRepository customerRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<SalesBeatDto>> Handle(UpdateSalesBeatCommand request, CancellationToken cancellationToken)
    {
        var beat = await _sfaRepository.GetSalesBeatByIdAsync(request.Id, cancellationToken);
        if (beat == null)
            return Result<SalesBeatDto>.Failure(Error.NotFound("SFA.BeatNotFound", "Beat not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(beat.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesBeatDto>.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized company access."));

        Employee? employee = null;
        if (request.SalesEmployeeId.HasValue && request.SalesEmployeeId.Value != Guid.Empty)
        {
            employee = await _employeeRepository.GetByIdAsync(request.SalesEmployeeId.Value, cancellationToken);
            if (employee == null || employee.CompanyId != beat.CompanyId)
                return Result<SalesBeatDto>.Failure(Error.NotFound("SFA.EmployeeNotFound", "Employee not found."));
            beat.SalesEmployeeId = request.SalesEmployeeId;
        }
        else
        {
            beat.SalesEmployeeId = null;
        }

        if (!string.IsNullOrWhiteSpace(request.Name)) beat.Name = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Frequency)) beat.Frequency = request.Frequency.Trim();
        beat.IsActive = request.IsActive;
        beat.LastModifiedAtUtc = DateTime.UtcNow;

        if (request.CustomerIds != null)
        {
            var requestedIds = request.CustomerIds.Distinct().ToHashSet();
            var toRemove = beat.Customers.Where(c => !requestedIds.Contains(c.CustomerId)).ToList();
            foreach (var rem in toRemove) beat.Customers.Remove(rem);

            int seq = 1;
            foreach (var custId in request.CustomerIds.Distinct())
            {
                var existing = beat.Customers.FirstOrDefault(c => c.CustomerId == custId);
                if (existing != null)
                {
                    existing.SequenceOrder = seq++;
                    existing.LastModifiedAtUtc = DateTime.UtcNow;
                }
                else
                {
                    var cust = await _customerRepository.GetByIdAsync(custId, cancellationToken);
                    if (cust != null && cust.CompanyId == beat.CompanyId)
                    {
                        beat.Customers.Add(new SalesBeatCustomer
                        {
                            Id = Guid.NewGuid(),
                            SalesBeatId = beat.Id,
                            CustomerId = custId,
                            SequenceOrder = seq++,
                            CreatedAtUtc = DateTime.UtcNow
                        });
                    }
                }
            }
        }

        await _sfaRepository.UpdateSalesBeatAsync(beat, cancellationToken);
        await _sfaRepository.SaveChangesAsync(cancellationToken);

        var dto = new SalesBeatDto(
            beat.Id,
            beat.CompanyId,
            beat.Company?.LegalName ?? "Company",
            beat.SalesEmployeeId,
            employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : null,
            employee?.EmployeeCode,
            beat.Code,
            beat.Name,
            beat.Frequency,
            beat.IsActive,
            beat.Customers.Count,
            beat.Customers.OrderBy(c => c.SequenceOrder).Select(c => new SalesBeatCustomerDto(
                c.Id,
                c.SalesBeatId,
                c.CustomerId,
                c.Customer?.LegalName ?? "Customer",
                c.Customer?.Code ?? "CUST",
                c.Customer != null && c.Customer.Address != null ? $"{c.Customer.Address.AddressLine1}, {c.Customer.Address.City}" : null,
                c.Customer?.Latitude,
                c.Customer?.Longitude,
                c.SequenceOrder
            )).ToList(),
            beat.CreatedAtUtc
        );

        return Result.Success(dto);
    }
}

// ----------------------------------------------------
// 5. DELETE SALES BEAT COMMAND
// ----------------------------------------------------
public record DeleteSalesBeatCommand(Guid Id) : IRequest<Result>;

public class DeleteSalesBeatCommandHandler : IRequestHandler<DeleteSalesBeatCommand, Result>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteSalesBeatCommandHandler(ISfaRepository sfaRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result> Handle(DeleteSalesBeatCommand request, CancellationToken cancellationToken)
    {
        var beat = await _sfaRepository.GetSalesBeatByIdAsync(request.Id, cancellationToken);
        if (beat == null)
            return Result.Failure(Error.NotFound("SFA.BeatNotFound", "Beat not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(beat.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized company access."));

        beat.IsDeleted = true;
        beat.DeletedAtUtc = DateTime.UtcNow;

        await _sfaRepository.UpdateSalesBeatAsync(beat, cancellationToken);
        await _sfaRepository.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// ----------------------------------------------------
// 6. CHECK-IN STORE VISIT COMMAND (GPS <= 50m + Face Check)
// ----------------------------------------------------
public record CheckInStoreVisitCommand(
    Guid CompanyId,
    Guid CustomerId,
    Guid? SalesEmployeeId,
    double Latitude,
    double Longitude,
    double? AccuracyMeters = null,
    bool IsFaceVerified = false,
    string? Notes = null
) : IRequest<Result<SalesVisitDto>>;

public class CheckInStoreVisitCommandHandler : IRequestHandler<CheckInStoreVisitCommand, Result<SalesVisitDto>>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CheckInStoreVisitCommandHandler(
        ISfaRepository sfaRepository,
        IEmployeeRepository employeeRepository,
        ICustomerRepository customerRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<SalesVisitDto>> Handle(CheckInStoreVisitCommand request, CancellationToken cancellationToken)
    {
        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesVisitDto>.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized company access."));

        // 1. Validate Sales Employee
        if (!request.SalesEmployeeId.HasValue || request.SalesEmployeeId.Value == Guid.Empty)
            return Result<SalesVisitDto>.Failure(Error.Validation("SFA.MissingEmployee", "Sales Employee ID is required for check-in."));

        var employee = await _employeeRepository.GetByIdAsync(request.SalesEmployeeId.Value, cancellationToken);
        if (employee == null || employee.CompanyId != request.CompanyId)
            return Result<SalesVisitDto>.Failure(Error.NotFound("SFA.EmployeeNotFound", "Employee not found or belongs to another company."));
        if (!employee.IsActive)
            return Result<SalesVisitDto>.Failure(Error.Validation("SFA.InactiveEmployee", "Assigned employee is inactive."));

        // 2. Validate Customer
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null || customer.CompanyId != request.CompanyId)
            return Result<SalesVisitDto>.Failure(Error.NotFound("SFA.CustomerNotFound", "Customer not found or belongs to another company."));
        // 3. Server-Side Haversine Geofence Verification (<= 50.0m)
        if (double.IsNaN(request.Latitude) || double.IsNaN(request.Longitude) ||
            request.Latitude < -90.0 || request.Latitude > 90.0 ||
            request.Longitude < -180.0 || request.Longitude > 180.0)
        {
            return Result<SalesVisitDto>.Failure(Error.Validation(
                "SFA.InvalidCoordinates",
                "Latitude must be between -90 and 90, and Longitude must be between -180 and 180."));
        }

        double distanceMeters;
        bool isGpsVerified = false;

        if (customer.Latitude.HasValue && customer.Longitude.HasValue)
        {
            var repCoord = new GpsCoordinate(request.Latitude, request.Longitude);
            var custCoord = new GpsCoordinate(customer.Latitude.Value, customer.Longitude.Value);
            distanceMeters = repCoord.DistanceToMeters(custCoord);

            if (distanceMeters > 50.0)
            {
                return Result<SalesVisitDto>.Failure(Error.Validation(
                    "SFA.GpsOutOfRange",
                    $"Store visit check-in rejected. You are {distanceMeters:F1} meters from the store. Maximum allowed distance is 50 meters."));
            }
            isGpsVerified = true;
        }
        else
        {
            // Initial coordinate tagging
            customer.Latitude = request.Latitude;
            customer.Longitude = request.Longitude;
            await _customerRepository.UpdateAsync(customer, cancellationToken);
            distanceMeters = 0.0;
            isGpsVerified = true;
        }

        // 4. Create SalesVisit Record
        var visit = new SalesVisit
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            SalesEmployeeId = request.SalesEmployeeId.Value,
            CustomerId = request.CustomerId,
            VisitDateUtc = DateTime.UtcNow.Date,
            CheckInLatitude = request.Latitude,
            CheckInLongitude = request.Longitude,
            DistanceToCustomerMeters = distanceMeters,
            IsGpsVerified = isGpsVerified,
            IsFaceVerified = request.IsFaceVerified,
            CheckInAtUtc = DateTime.UtcNow,
            Outcome = "Planned",
            Notes = request.Notes?.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        await _sfaRepository.AddSalesVisitAsync(visit, cancellationToken);
        await _sfaRepository.SaveChangesAsync(cancellationToken);

        var dto = new SalesVisitDto(
            visit.Id,
            visit.CompanyId,
            visit.SalesEmployeeId,
            $"{employee.FirstName} {employee.LastName}".Trim(),
            employee.EmployeeCode,
            visit.CustomerId,
            customer.LegalName,
            customer.Code,
            visit.VisitDateUtc,
            visit.CheckInLatitude,
            visit.CheckInLongitude,
            visit.DistanceToCustomerMeters,
            visit.IsGpsVerified,
            visit.IsFaceVerified,
            visit.CheckInAtUtc,
            visit.CheckOutAtUtc,
            visit.Outcome,
            visit.Notes
        );

        return Result.Success(dto);
    }
}

// ----------------------------------------------------
// 7. CHECK-OUT STORE VISIT COMMAND
// ----------------------------------------------------
public record CheckOutStoreVisitCommand(
    Guid Id,
    string Outcome,
    string? Notes = null
) : IRequest<Result<SalesVisitDto>>;

public class CheckOutStoreVisitCommandHandler : IRequestHandler<CheckOutStoreVisitCommand, Result<SalesVisitDto>>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CheckOutStoreVisitCommandHandler(ISfaRepository sfaRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<SalesVisitDto>> Handle(CheckOutStoreVisitCommand request, CancellationToken cancellationToken)
    {
        var visit = await _sfaRepository.GetSalesVisitByIdAsync(request.Id, cancellationToken);
        if (visit == null)
            return Result<SalesVisitDto>.Failure(Error.NotFound("SFA.VisitNotFound", "Visit record not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(visit.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesVisitDto>.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized company access."));

        if (!string.IsNullOrWhiteSpace(request.Outcome)) visit.Outcome = request.Outcome.Trim();
        if (request.Notes != null) visit.Notes = request.Notes.Trim();
        visit.CheckOutAtUtc = DateTime.UtcNow;
        visit.LastModifiedAtUtc = DateTime.UtcNow;

        await _sfaRepository.UpdateSalesVisitAsync(visit, cancellationToken);
        await _sfaRepository.SaveChangesAsync(cancellationToken);

        var dto = new SalesVisitDto(
            visit.Id,
            visit.CompanyId,
            visit.SalesEmployeeId,
            visit.SalesEmployee != null ? $"{visit.SalesEmployee.FirstName} {visit.SalesEmployee.LastName}".Trim() : "Employee",
            visit.SalesEmployee?.EmployeeCode ?? "EMP",
            visit.CustomerId,
            visit.Customer?.LegalName ?? "Customer",
            visit.Customer?.Code ?? "CUST",
            visit.VisitDateUtc,
            visit.CheckInLatitude,
            visit.CheckInLongitude,
            visit.DistanceToCustomerMeters,
            visit.IsGpsVerified,
            visit.IsFaceVerified,
            visit.CheckInAtUtc,
            visit.CheckOutAtUtc,
            visit.Outcome,
            visit.Notes
        );

        return Result.Success(dto);
    }
}
