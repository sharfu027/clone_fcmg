using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.SFA.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.SFA.Queries;

// ----------------------------------------------------
// 1. GET SFA SALES REPS QUERY
// ----------------------------------------------------
public record GetSfaSalesRepsQuery(
    Guid? CompanyId = null,
    string? Search = null
) : IRequest<Result<IReadOnlyList<SfaSalesRepDto>>>;

public class GetSfaSalesRepsQueryHandler : IRequestHandler<GetSfaSalesRepsQuery, Result<IReadOnlyList<SfaSalesRepDto>>>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetSfaSalesRepsQueryHandler(ISfaRepository sfaRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<SfaSalesRepDto>>> Handle(GetSfaSalesRepsQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        var targetCompanyIds = new List<Guid>();

        if (request.CompanyId.HasValue && request.CompanyId.Value != Guid.Empty)
        {
            var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId.Value, cancellationToken);
            if (!hasAccess)
                return Result<IReadOnlyList<SfaSalesRepDto>>.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized access to company sales reps."));
            targetCompanyIds.Add(request.CompanyId.Value);
        }
        else if (authorizedCompanyId.HasValue && authorizedCompanyId.Value != Guid.Empty)
        {
            targetCompanyIds.Add(authorizedCompanyId.Value);
        }

        var employees = await _sfaRepository.GetSalesRepsAsync(targetCompanyIds, request.Search, cancellationToken);
        var employeeIds = employees.Select(e => e.Id).ToList();

        var assignmentCounts = await _sfaRepository.GetAssignmentCountsAsync(employeeIds, cancellationToken);
        var beatCounts = await _sfaRepository.GetBeatCountsAsync(employeeIds, cancellationToken);

        var dtos = employees.Select(e => new SfaSalesRepDto(
            e.Id,
            e.EmployeeCode,
            e.FirstName,
            e.LastName,
            $"{e.FirstName} {e.LastName}".Trim(),
            e.Email,
            e.Phone,
            e.Designation?.Title,
            e.Department?.Name,
            e.CompanyId,
            e.Company?.LegalName ?? "Company",
            assignmentCounts.GetValueOrDefault(e.Id, 0),
            beatCounts.GetValueOrDefault(e.Id, 0),
            e.IsActive
        )).ToList();

        return Result.Success<IReadOnlyList<SfaSalesRepDto>>(dtos);
    }
}

// ----------------------------------------------------
// 2. GET SALES BEATS QUERY
// ----------------------------------------------------
public record GetSalesBeatsQuery(
    Guid? CompanyId = null,
    Guid? SalesEmployeeId = null,
    string? Search = null
) : IRequest<Result<IReadOnlyList<SalesBeatDto>>>;

public class GetSalesBeatsQueryHandler : IRequestHandler<GetSalesBeatsQuery, Result<IReadOnlyList<SalesBeatDto>>>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetSalesBeatsQueryHandler(ISfaRepository sfaRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<SalesBeatDto>>> Handle(GetSalesBeatsQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        var targetCompanyIds = new List<Guid>();

        if (request.CompanyId.HasValue && request.CompanyId.Value != Guid.Empty)
        {
            var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId.Value, cancellationToken);
            if (!hasAccess)
                return Result<IReadOnlyList<SalesBeatDto>>.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized access to company beats."));
            targetCompanyIds.Add(request.CompanyId.Value);
        }
        else if (authorizedCompanyId.HasValue && authorizedCompanyId.Value != Guid.Empty)
        {
            targetCompanyIds.Add(authorizedCompanyId.Value);
        }

        var beats = await _sfaRepository.GetSalesBeatsAsync(targetCompanyIds, request.SalesEmployeeId, request.Search, cancellationToken);

        var dtos = beats.Select(b => new SalesBeatDto(
            b.Id,
            b.CompanyId,
            b.Company?.LegalName ?? "Company",
            b.SalesEmployeeId,
            b.SalesEmployee != null ? $"{b.SalesEmployee.FirstName} {b.SalesEmployee.LastName}".Trim() : null,
            b.SalesEmployee?.EmployeeCode,
            b.Code,
            b.Name,
            b.Frequency,
            b.IsActive,
            b.Customers.Count,
            b.Customers.OrderBy(c => c.SequenceOrder).Select(c => new SalesBeatCustomerDto(
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
            b.CreatedAtUtc
        )).ToList();

        return Result.Success<IReadOnlyList<SalesBeatDto>>(dtos);
    }
}

// ----------------------------------------------------
// 3. GET CUSTOMER ASSIGNMENTS QUERY
// ----------------------------------------------------
public record GetCustomerAssignmentsQuery(
    Guid? CompanyId = null,
    Guid? EmployeeId = null,
    Guid? CustomerId = null
) : IRequest<Result<IReadOnlyList<SalesRepCustomerAssignmentDto>>>;

public class GetCustomerAssignmentsQueryHandler : IRequestHandler<GetCustomerAssignmentsQuery, Result<IReadOnlyList<SalesRepCustomerAssignmentDto>>>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetCustomerAssignmentsQueryHandler(ISfaRepository sfaRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<SalesRepCustomerAssignmentDto>>> Handle(GetCustomerAssignmentsQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        var targetCompanyIds = new List<Guid>();

        if (request.CompanyId.HasValue && request.CompanyId.Value != Guid.Empty)
        {
            var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId.Value, cancellationToken);
            if (!hasAccess)
                return Result<IReadOnlyList<SalesRepCustomerAssignmentDto>>.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized company access."));
            targetCompanyIds.Add(request.CompanyId.Value);
        }
        else if (authorizedCompanyId.HasValue && authorizedCompanyId.Value != Guid.Empty)
        {
            targetCompanyIds.Add(authorizedCompanyId.Value);
        }

        var assignments = await _sfaRepository.GetCustomerAssignmentsAsync(targetCompanyIds, request.EmployeeId, request.CustomerId, cancellationToken);

        var dtos = assignments.Select(a => new SalesRepCustomerAssignmentDto(
            a.Id,
            a.CompanyId,
            a.EmployeeId,
            a.Employee != null ? $"{a.Employee.FirstName} {a.Employee.LastName}".Trim() : "Employee",
            a.Employee?.EmployeeCode ?? "EMP",
            a.CustomerId,
            a.Customer?.LegalName ?? "Customer",
            a.Customer?.Code ?? "CUST",
            a.AssignedFromUtc,
            a.AssignedToUtc,
            a.IsActive
        )).ToList();

        return Result.Success<IReadOnlyList<SalesRepCustomerAssignmentDto>>(dtos);
    }
}

// ----------------------------------------------------
// 4. GET SALES VISITS QUERY
// ----------------------------------------------------
public record GetSalesVisitsQuery(
    Guid? CompanyId = null,
    Guid? SalesEmployeeId = null,
    Guid? CustomerId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    string? Outcome = null
) : IRequest<Result<IReadOnlyList<SalesVisitDto>>>;

public class GetSalesVisitsQueryHandler : IRequestHandler<GetSalesVisitsQuery, Result<IReadOnlyList<SalesVisitDto>>>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetSalesVisitsQueryHandler(ISfaRepository sfaRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<SalesVisitDto>>> Handle(GetSalesVisitsQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        var targetCompanyIds = new List<Guid>();

        if (request.CompanyId.HasValue && request.CompanyId.Value != Guid.Empty)
        {
            var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId.Value, cancellationToken);
            if (!hasAccess)
                return Result<IReadOnlyList<SalesVisitDto>>.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized company access."));
            targetCompanyIds.Add(request.CompanyId.Value);
        }
        else if (authorizedCompanyId.HasValue && authorizedCompanyId.Value != Guid.Empty)
        {
            targetCompanyIds.Add(authorizedCompanyId.Value);
        }

        var visits = await _sfaRepository.GetSalesVisitsAsync(targetCompanyIds, request.SalesEmployeeId, request.CustomerId, request.FromDate, request.ToDate, request.Outcome, cancellationToken);

        var dtos = visits.Select(v => new SalesVisitDto(
            v.Id,
            v.CompanyId,
            v.SalesEmployeeId,
            v.SalesEmployee != null ? $"{v.SalesEmployee.FirstName} {v.SalesEmployee.LastName}".Trim() : "Employee",
            v.SalesEmployee?.EmployeeCode ?? "EMP",
            v.CustomerId,
            v.Customer?.LegalName ?? "Customer",
            v.Customer?.Code ?? "CUST",
            v.VisitDateUtc,
            v.CheckInLatitude,
            v.CheckInLongitude,
            v.DistanceToCustomerMeters,
            v.IsGpsVerified,
            v.IsFaceVerified,
            v.CheckInAtUtc,
            v.CheckOutAtUtc,
            v.Outcome,
            v.Notes
        )).ToList();

        return Result.Success<IReadOnlyList<SalesVisitDto>>(dtos);
    }
}

// ----------------------------------------------------
// 5. GET SFA DASHBOARD METRICS QUERY
// ----------------------------------------------------
public record GetSfaDashboardMetricsQuery(
    Guid? CompanyId = null,
    Guid? SalesEmployeeId = null
) : IRequest<Result<SfaDashboardMetricsDto>>;

public class GetSfaDashboardMetricsQueryHandler : IRequestHandler<GetSfaDashboardMetricsQuery, Result<SfaDashboardMetricsDto>>
{
    private readonly ISfaRepository _sfaRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetSfaDashboardMetricsQueryHandler(ISfaRepository sfaRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<SfaDashboardMetricsDto>> Handle(GetSfaDashboardMetricsQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        var targetCompanyIds = new List<Guid>();

        if (request.CompanyId.HasValue && request.CompanyId.Value != Guid.Empty)
        {
            var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId.Value, cancellationToken);
            if (!hasAccess)
                return Result<SfaDashboardMetricsDto>.Failure(Error.Unauthorized("SFA.Unauthorized", "Unauthorized company access."));
            targetCompanyIds.Add(request.CompanyId.Value);
        }
        else if (authorizedCompanyId.HasValue && authorizedCompanyId.Value != Guid.Empty)
        {
            targetCompanyIds.Add(authorizedCompanyId.Value);
        }

        var (totalVisits, completedVisits, ordersCount, ordersValue, gpsVerifiedVisits) =
            await _sfaRepository.GetDashboardMetricsAsync(targetCompanyIds, request.SalesEmployeeId, cancellationToken);

        int pendingVisits = Math.Max(0, totalVisits - completedVisits);
        double gpsRate = totalVisits > 0
            ? Math.Round((double)gpsVerifiedVisits / totalVisits * 100.0, 1)
            : 100.0;

        var dto = new SfaDashboardMetricsDto(
            totalVisits,
            completedVisits,
            pendingVisits,
            ordersCount,
            ordersValue,
            gpsRate
        );

        return Result.Success(dto);
    }
}
