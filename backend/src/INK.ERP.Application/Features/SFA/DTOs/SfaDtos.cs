using System;
using System.Collections.Generic;

namespace INK.ERP.Application.Features.SFA.DTOs;

public record SfaSalesRepDto(
    Guid EmployeeId,
    string EmployeeCode,
    string FirstName,
    string LastName,
    string FullName,
    string Email,
    string Phone,
    string? DesignationName,
    string? DepartmentName,
    Guid CompanyId,
    string CompanyName,
    int AssignedCustomerCount,
    int AssignedBeatCount,
    bool IsActive
);

public record SalesBeatDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    Guid? SalesEmployeeId,
    string? SalesEmployeeName,
    string? SalesEmployeeCode,
    string Code,
    string Name,
    string Frequency,
    bool IsActive,
    int TotalCustomers,
    List<SalesBeatCustomerDto> Customers,
    DateTime CreatedAtUtc
);

public record SalesBeatCustomerDto(
    Guid Id,
    Guid SalesBeatId,
    Guid CustomerId,
    string CustomerName,
    string CustomerCode,
    string? Address,
    double? Latitude,
    double? Longitude,
    int SequenceOrder
);

public record SalesRepCustomerAssignmentDto(
    Guid Id,
    Guid CompanyId,
    Guid EmployeeId,
    string EmployeeName,
    string EmployeeCode,
    Guid CustomerId,
    string CustomerName,
    string CustomerCode,
    DateTime AssignedFromUtc,
    DateTime? AssignedToUtc,
    bool IsActive
);

public record SalesVisitDto(
    Guid Id,
    Guid CompanyId,
    Guid SalesEmployeeId,
    string SalesEmployeeName,
    string SalesEmployeeCode,
    Guid CustomerId,
    string CustomerName,
    string CustomerCode,
    DateTime VisitDateUtc,
    double CheckInLatitude,
    double CheckInLongitude,
    double DistanceToCustomerMeters,
    bool IsGpsVerified,
    bool IsFaceVerified,
    DateTime CheckInAtUtc,
    DateTime? CheckOutAtUtc,
    string Outcome,
    string? Notes
);

public record SfaDashboardMetricsDto(
    int TodayVisitsCount,
    int CompletedVisitsCount,
    int PendingVisitsCount,
    int OrdersBookedTodayCount,
    decimal OrdersBookedTodayValue,
    double GpsSuccessRatePercentage
);

public record CreateSalesBeatRequest(
    Guid CompanyId,
    string Code,
    string Name,
    Guid? SalesEmployeeId,
    string Frequency,
    List<Guid>? CustomerIds
);

public record UpdateSalesBeatRequest(
    string Name,
    Guid? SalesEmployeeId,
    string Frequency,
    bool IsActive,
    List<Guid>? CustomerIds
);

public record AssignCustomerRequest(
    Guid CompanyId,
    Guid EmployeeId,
    Guid CustomerId,
    DateTime? AssignedFromUtc,
    DateTime? AssignedToUtc
);

public record CheckInVisitRequest(
    Guid CompanyId,
    Guid CustomerId,
    Guid? SalesEmployeeId,
    double Latitude,
    double Longitude,
    double? AccuracyMeters,
    bool IsFaceVerified,
    string? Notes
);

public record CheckOutVisitRequest(
    string Outcome,
    string? Notes
);
