using System;
using System.Collections.Generic;

namespace INK.ERP.Application.Features.IAM.DTOs;

public sealed record AuditLogDto(
    Guid Id,
    DateTime Timestamp,
    Guid? UserId,
    string Username,
    string EmployeeId,
    string UserDisplayName,
    string EventType,
    string Category,
    string Module,
    string Description,
    bool Success,
    string? FailureReason,
    string IpAddress,
    string Device,
    string Browser,
    string OperatingSystem,
    string Location,
    string? Endpoint,
    string? HttpMethod,
    long? ProcessingTimeMs,
    string? PreviousValue,
    string? NewValue,
    DateTime CreatedAtUtc);

public sealed record AuditLogStatsDto(
    int TotalEvents,
    int SuccessfulLogins,
    int FailedLogins,
    int FaceVerifications,
    int UserManagementEvents,
    int RoleChanges,
    int SecurityExceptions,
    int CriticalSecurityEvents);

public sealed record ExportAuditLogsRequest(
    string? Format = "csv",
    string? SearchTerm = null,
    string? Category = null,
    string? EventType = null,
    string? Module = null,
    string? Result = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null);
