using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Application.Features.Security.Dashboard.DTOs;

namespace INK.ERP.Application.Features.Security.Dashboard.Queries;

public sealed record GetSecurityDashboardSummaryQuery : IQuery<Result<SecurityDashboardSummaryDto>>;

public sealed class GetSecurityDashboardSummaryQueryHandler : IRequestHandler<GetSecurityDashboardSummaryQuery, Result<SecurityDashboardSummaryDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetSecurityDashboardSummaryQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<SecurityDashboardSummaryDto>> Handle(GetSecurityDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var nowUtc = DateTime.UtcNow;
        var todayStartUtc = nowUtc.Date;
        var onlineWindowUtc = nowUtc.AddMinutes(-30);

        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var sessionRepo = _unitOfWork.Repository<UserSession>();
        var auditRepo = _unitOfWork.Repository<SecurityAuditLog>();
        var loginRepo = _unitOfWork.Repository<LoginHistory>();
        var faceLogRepo = _unitOfWork.Repository<FaceVerificationLog>();
        var deviceRepo = _unitOfWork.Repository<RegisteredDevice>();
        var incidentRepo = _unitOfWork.Repository<SecurityIncident>();

        // 1. User Account Posture Metrics
        var activeUsers = (await userRepo.FindAsync(u => u.IsActive && !u.IsDeleted, cancellationToken)).ToList();
        var lockedUsers = (await userRepo.FindAsync(u => u.IsLocked && !u.IsDeleted, cancellationToken)).ToList();
        var suspendedUsers = (await userRepo.FindAsync(u => !u.IsActive && !u.IsDeleted, cancellationToken)).ToList();

        var activeUsersCount = activeUsers.Count;
        var lockedUsersCount = lockedUsers.Count;
        var suspendedUsersCount = suspendedUsers.Count;

        // Online Users: Check real active sessions in UserSessions or recent logins
        int? onlineUsersCount = null;
        try
        {
            var activeSessions = (await sessionRepo.FindAsync(s => !s.IsDeleted && s.EndedUtc == null && s.LastActivityUtc >= onlineWindowUtc, cancellationToken)).ToList();
            if (activeSessions.Count > 0)
            {
                onlineUsersCount = activeSessions.Select(s => s.UserId).Distinct().Count();
            }
            else
            {
                var recentLogins = activeUsers.Count(u => u.LastLoginUtc.HasValue && u.LastLoginUtc.Value >= onlineWindowUtc);
                onlineUsersCount = recentLogins > 0 ? recentLogins : (activeUsersCount > 0 ? 1 : 0);
            }
        }
        catch
        {
            onlineUsersCount = activeUsersCount > 0 ? 1 : 0;
        }

        // 2. Biometric Verification Metrics
        int faceSuccess = 0;
        int faceFail = 0;
        try
        {
            var faceLogs = (await faceLogRepo.GetAllAsync(cancellationToken)).ToList();
            faceSuccess = faceLogs.Count(l => l.IsSuccessful);
            faceFail = faceLogs.Count(l => !l.IsSuccessful);
        }
        catch
        {
            var auditLogs = (await auditRepo.FindAsync(a => !a.IsDeleted && (a.Category == "Face Verification" || (a.Action != null && a.Action.Contains("Face"))), cancellationToken)).ToList();
            faceSuccess = auditLogs.Count(a => a.Success);
            faceFail = auditLogs.Count(a => !a.Success);
        }

        var biometricVerificationsCount = faceSuccess + faceFail;
        var biometricSuccessRatePercent = biometricVerificationsCount > 0
            ? Math.Round((double)faceSuccess / biometricVerificationsCount * 100.0, 1)
            : 100.0;

        // 3. Security Devices Metrics
        int registeredDevices = 0;
        int unregisteredDevices = 0;
        try
        {
            var devices = (await deviceRepo.FindAsync(d => !d.IsDeleted, cancellationToken)).ToList();
            registeredDevices = devices.Count(d => d.Status == DeviceStatus.Approved || d.Status == DeviceStatus.Trusted);
            unregisteredDevices = devices.Count(d => d.Status == DeviceStatus.PendingApproval || d.Status == DeviceStatus.Rejected || d.Status == DeviceStatus.Revoked);
        }
        catch
        {
            registeredDevices = 0;
            unregisteredDevices = 0;
        }

        // 4. Audit Trail & Incident Metrics
        int failedLoginsToday = 0;
        int successfulLogins = 0;
        int totalEvents = 0;
        int securityAlerts = 0;

        try
        {
            var securityLogs = (await auditRepo.FindAsync(a => !a.IsDeleted, cancellationToken)).ToList();
            var loginLogs = (await loginRepo.FindAsync(l => !l.IsDeleted, cancellationToken)).ToList();

            failedLoginsToday = securityLogs.Count(a => (a.EventType == "LOGIN_FAILED" || (a.Category == "Login" && !a.Success)) && a.Timestamp >= todayStartUtc)
                              + loginLogs.Count(l => !l.IsSuccessful && l.CreatedAtUtc >= todayStartUtc);

            successfulLogins = securityLogs.Count(a => (a.EventType == "LOGIN_SUCCESS" || (a.Category == "Login" && a.Success)))
                             + loginLogs.Count(l => l.IsSuccessful);

            totalEvents = securityLogs.Count + loginLogs.Count;

            securityAlerts = securityLogs.Count(a => a.Category == "Security Exception" || a.EventType == "SECURITY_ALERT" || !a.Success);
            try
            {
                var incidents = (await incidentRepo.FindAsync(i => !i.IsDeleted && !i.IsResolved, cancellationToken)).ToList();
                securityAlerts += incidents.Count;
            }
            catch { }
        }
        catch
        {
            // Fallback
        }

        var dto = new SecurityDashboardSummaryDto(
            ActiveUsersCount: activeUsersCount,
            OnlineUsersCount: onlineUsersCount,
            LockedUsersCount: lockedUsersCount,
            SuspendedUsersCount: suspendedUsersCount,
            FaceVerificationSuccessCount: faceSuccess,
            FaceVerificationFailureCount: faceFail,
            BiometricSuccessRatePercent: biometricSuccessRatePercent,
            RegisteredDevicesCount: registeredDevices,
            UnregisteredDevicesCount: unregisteredDevices,
            SecurityAlertsCount: securityAlerts,
            FailedLoginsTodayCount: failedLoginsToday,
            TotalSecurityEventsCount: totalEvents,
            SuccessfulLoginsCount: successfulLogins,
            BiometricVerificationsCount: biometricVerificationsCount
        );

        return Result.Success(dto);
    }
}
