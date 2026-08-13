using System;

namespace INK.ERP.Application.Features.Security.Dashboard.DTOs;

public sealed record SecurityDashboardSummaryDto(
    int ActiveUsersCount,
    int? OnlineUsersCount,
    int LockedUsersCount,
    int SuspendedUsersCount,
    int FaceVerificationSuccessCount,
    int FaceVerificationFailureCount,
    double BiometricSuccessRatePercent,
    int RegisteredDevicesCount,
    int UnregisteredDevicesCount,
    int SecurityAlertsCount,
    int FailedLoginsTodayCount,
    int TotalSecurityEventsCount,
    int SuccessfulLoginsCount,
    int BiometricVerificationsCount
);
