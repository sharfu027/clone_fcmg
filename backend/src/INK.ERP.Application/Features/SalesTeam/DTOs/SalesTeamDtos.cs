using System;
using System.Collections.Generic;

namespace INK.ERP.Application.Features.SalesTeam.DTOs;

public sealed record SalesRepresentativeDto(
    Guid Id, // Employee Id
    Guid UserId,
    Guid CompanyId,
    string? CompanyName,
    Guid? BranchId,
    string? BranchName,
    string EmployeeCode,
    string FirstName,
    string LastName,
    string DisplayName,
    string Username,
    string Email,
    string Phone,
    bool IsActive,
    int AssignedCustomersCount,
    DateTime CreatedAtUtc,
    DateTime? LastLoginUtc,
    IReadOnlyList<Guid>? AssignedCustomerIds = null,
    bool LocationRegistered = false,
    bool FaceRegistered = false,
    string? LocationName = null,
    double? AllowedRadiusMeters = null);

public sealed record CreateSalesRepresentativeRequest(
    string FirstName,
    string LastName,
    string Username,
    string Email,
    string Phone,
    string Password,
    Guid? BranchId = null,
    bool IsActive = true);

public sealed record UpdateSalesRepresentativeRequest(
    string FirstName,
    string LastName,
    string Phone,
    string Email,
    Guid? BranchId = null,
    bool IsActive = true);

public sealed record ResetSalesRepPasswordRequest(
    string NewPassword);

public sealed record AssignCustomersToSalesRepRequest(
    List<Guid> CustomerIds);

public sealed record SalesRepCustomerSummaryDto(
    Guid CustomerId,
    string Code,
    string LegalName,
    string? TradeName,
    string? City,
    string? Phone,
    bool IsActive,
    DateTime AssignedAtUtc);

public sealed record SalesRepLocationEnrollmentDto(
    Guid Id,
    Guid CompanyId,
    Guid EmployeeId,
    Guid? UserId,
    string LocationName,
    double Latitude,
    double Longitude,
    double AllowedRadiusMeters,
    bool IsActive,
    DateTime EnrolledAtUtc,
    Guid? EnrolledByUserId,
    DateTime? UpdatedAtUtc);

public sealed record RegisterSalesRepLocationRequest(
    string LocationName,
    double Latitude,
    double Longitude,
    double AllowedRadiusMeters = 50.0);

public sealed record SalesRepBiometricStatusDto(
    bool FaceRegistered,
    Guid? FaceProfileId,
    int? TemplateVersion,
    DateTime? FaceEnrolledAtUtc,
    bool LocationRegistered,
    string? LocationName,
    double? Latitude,
    double? Longitude,
    double? AllowedRadiusMeters,
    DateTime? LocationEnrolledAtUtc);

public sealed record EnrollSalesRepFaceBase64Request(
    string ImageBase64,
    string? AlgorithmVersion = "v1.0");
