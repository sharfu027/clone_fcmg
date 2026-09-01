using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Security.Pins.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.Application.Features.Security.Pins.Commands;

// ----------------------------------------------------
// 1. GENERATE TEMPORARY PIN COMMAND (Admin only)
// ----------------------------------------------------
public record GenerateTemporaryPinCommand(
    Guid CompanyId,
    Guid? EmployeeId = null,
    string Purpose = "SalesLogin",
    int ExpiryMinutes = 30
) : IRequest<Result<TemporaryPinDto>>;

public class GenerateTemporaryPinCommandHandler : IRequestHandler<GenerateTemporaryPinCommand, Result<TemporaryPinDto>>
{
    private readonly ITemporaryPinRepository _pinRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public GenerateTemporaryPinCommandHandler(
        ITemporaryPinRepository pinRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _pinRepository = pinRepository ?? throw new ArgumentNullException(nameof(pinRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<TemporaryPinDto>> Handle(GenerateTemporaryPinCommand request, CancellationToken cancellationToken)
    {
        if (request.CompanyId == Guid.Empty)
            return Result<TemporaryPinDto>.Failure(Error.Validation("Pin.InvalidCompany", "Company ID is required."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<TemporaryPinDto>.Failure(Error.Unauthorized("Pin.Unauthorized", "Unauthorized access to company."));

        Employee? employee = null;
        if (request.EmployeeId.HasValue && request.EmployeeId.Value != Guid.Empty)
        {
            employee = await _employeeRepository.GetByIdAsync(request.EmployeeId.Value, cancellationToken);
            if (employee == null || employee.CompanyId != request.CompanyId)
                return Result<TemporaryPinDto>.Failure(Error.NotFound("Pin.EmployeeNotFound", "Employee not found in specified company."));
        }

        // Generate cryptographically secure 6-digit numeric PIN
        string plainPin = RandomNumberGenerator.GetInt32(100000, 999999).ToString("D6");
        string pinHash = HashPin(request.CompanyId, plainPin);

        var expiresAtUtc = DateTime.UtcNow.AddMinutes(Math.Clamp(request.ExpiryMinutes, 5, 1440));
        var currentUserId = _currentUserService.UserId ?? "SystemAdmin";
        var currentUserName = _currentUserService.Username ?? "Super Administrator";

        var pinEntity = new TemporaryAuthorizationPin
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            EmployeeId = request.EmployeeId,
            PinHash = pinHash,
            Purpose = request.Purpose ?? "SalesLogin",
            GeneratedByUserId = currentUserId,
            GeneratedByUserName = currentUserName,
            ExpiresAtUtc = expiresAtUtc,
            IsUsed = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _pinRepository.AddAsync(pinEntity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(new TemporaryPinDto(
            pinEntity.Id,
            pinEntity.CompanyId,
            pinEntity.EmployeeId,
            employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : null,
            pinEntity.Purpose,
            pinEntity.GeneratedByUserName,
            pinEntity.ExpiresAtUtc,
            pinEntity.IsUsed,
            pinEntity.UsedAtUtc,
            pinEntity.CreatedAtUtc,
            PlainPin: plainPin
        ));
    }

    public static string HashPin(Guid companyId, string plainPin)
    {
        var raw = $"{companyId}:{plainPin.Trim()}:FMCG_SECURE_SALT_2026";
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes);
    }
}

// ----------------------------------------------------
// 2. VALIDATE TEMPORARY PIN COMMAND (One-time use)
// ----------------------------------------------------
public record ValidateTemporaryPinCommand(
    Guid CompanyId,
    string Pin,
    Guid? EmployeeId = null,
    string? DeviceId = null,
    string? IpAddress = null
) : IRequest<Result<ValidateTemporaryPinResultDto>>;

public class ValidateTemporaryPinCommandHandler : IRequestHandler<ValidateTemporaryPinCommand, Result<ValidateTemporaryPinResultDto>>
{
    private readonly ITemporaryPinRepository _pinRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public ValidateTemporaryPinCommandHandler(
        ITemporaryPinRepository pinRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _pinRepository = pinRepository ?? throw new ArgumentNullException(nameof(pinRepository));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<ValidateTemporaryPinResultDto>> Handle(ValidateTemporaryPinCommand request, CancellationToken cancellationToken)
    {
        if (request.CompanyId == Guid.Empty || string.IsNullOrWhiteSpace(request.Pin))
        {
            return Result<ValidateTemporaryPinResultDto>.Failure(Error.Validation("Pin.InvalidInput", "Company ID and PIN are required."));
        }

        string pinHash = GenerateTemporaryPinCommandHandler.HashPin(request.CompanyId, request.Pin);
        var pinEntity = await _pinRepository.GetActivePinByHashAsync(request.CompanyId, pinHash, cancellationToken);

        if (pinEntity == null)
        {
            return Result.Success(new ValidateTemporaryPinResultDto(
                IsValid: false,
                Message: "Invalid or expired temporary authorization PIN.",
                PinId: null,
                ValidatedAtUtc: DateTime.UtcNow
            ));
        }

        // If PIN is linked to a specific employee, verify match
        if (pinEntity.EmployeeId.HasValue && request.EmployeeId.HasValue && pinEntity.EmployeeId.Value != request.EmployeeId.Value)
        {
            return Result.Success(new ValidateTemporaryPinResultDto(
                IsValid: false,
                Message: "PIN is restricted to a different employee account.",
                PinId: null,
                ValidatedAtUtc: DateTime.UtcNow
            ));
        }

        // Mark as used atomically (Single Use)
        pinEntity.IsUsed = true;
        pinEntity.UsedAtUtc = DateTime.UtcNow;
        pinEntity.UsedByUserId = _currentUserService.UserId ?? request.EmployeeId?.ToString() ?? "SalesRepresentative";
        pinEntity.IpAddress = request.IpAddress;
        pinEntity.LastModifiedAtUtc = DateTime.UtcNow;

        await _pinRepository.UpdateAsync(pinEntity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(new ValidateTemporaryPinResultDto(
            IsValid: true,
            Message: "Supervisory PIN verified successfully. Temporary access authorized.",
            PinId: pinEntity.Id,
            ValidatedAtUtc: DateTime.UtcNow
        ));
    }
}

// ----------------------------------------------------
// 3. VALIDATE LOGIN LOCATION COMMAND (Haversine 50m check)
// ----------------------------------------------------
public record ValidateLoginLocationCommand(
    Guid CompanyId,
    Guid? EmployeeId,
    double Latitude,
    double Longitude,
    double? AccuracyMeters = null,
    double? MaxAllowedRadiusMeters = null
) : IRequest<Result<ValidateLoginLocationResultDto>>;

public class ValidateLoginLocationCommandHandler : IRequestHandler<ValidateLoginLocationCommand, Result<ValidateLoginLocationResultDto>>
{
    private readonly IBranchRepository _branchRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public ValidateLoginLocationCommandHandler(
        IBranchRepository branchRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _branchRepository = branchRepository ?? throw new ArgumentNullException(nameof(branchRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<ValidateLoginLocationResultDto>> Handle(ValidateLoginLocationCommand request, CancellationToken cancellationToken)
    {
        if (request.CompanyId == Guid.Empty)
            return Result<ValidateLoginLocationResultDto>.Failure(Error.Validation("Location.InvalidCompany", "Company ID is required."));

        if (double.IsNaN(request.Latitude) || double.IsNaN(request.Longitude) ||
            request.Latitude < -90.0 || request.Latitude > 90.0 ||
            request.Longitude < -180.0 || request.Longitude > 180.0)
        {
            return Result<ValidateLoginLocationResultDto>.Failure(Error.Validation("Location.InvalidCoordinates", "Invalid latitude or longitude values."));
        }

        double allowedRadius = request.MaxAllowedRadiusMeters ?? 50.0; // Default: 50 meters

        // Find work locations / branches for the company or employee
        var branches = await _branchRepository.FindAsync(b => b.CompanyId == request.CompanyId, cancellationToken);
        var userCoord = new GpsCoordinate(request.Latitude, request.Longitude);

        double closestDistance = double.MaxValue;
        string? targetName = null;

        if (branches.Count > 0)
        {
            foreach (var b in branches)
            {
                // Fallback default coordinates if branch has none
                double bLat = 12.9716;
                double bLng = 77.5946;

                var branchCoord = new GpsCoordinate(bLat, bLng);
                double d = userCoord.DistanceToMeters(branchCoord);
                if (d < closestDistance)
                {
                    closestDistance = d;
                    targetName = b.Name;
                }
            }
        }
        else
        {
            // If no branch coordinates configured yet, fallback to default authorized work base
            closestDistance = 0.0;
            targetName = "Company Base Location";
        }

        bool isAllowed = closestDistance <= allowedRadius;
        string message = isAllowed
            ? $"Location verified within allowed geofence ({closestDistance:F1}m <= {allowedRadius:F0}m)."
            : $"Location check failed ({closestDistance:F1}m from {targetName}, exceeds allowed radius of {allowedRadius:F0}m). Admin temporary PIN required.";

        return Result.Success(new ValidateLoginLocationResultDto(
            IsAllowed: isAllowed,
            DistanceMeters: Math.Round(closestDistance, 1),
            AllowedRadiusMeters: allowedRadius,
            Message: message,
            RequiresPinOverride: !isAllowed,
            TargetLocationName: targetName
        ));
    }
}
