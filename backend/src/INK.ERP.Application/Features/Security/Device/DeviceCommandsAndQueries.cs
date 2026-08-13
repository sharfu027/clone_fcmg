using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Application.Features.Security.Device.DTOs;

namespace INK.ERP.Application.Features.Security.Device;

// ----------------------------------------------------
// 1. ApproveDeviceCommand
// ----------------------------------------------------
public sealed record ApproveDeviceCommand(Guid DeviceId, string ApprovedBy) : ICommand<Result<Unit>>;

public sealed class ApproveDeviceCommandHandler : IRequestHandler<ApproveDeviceCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ApproveDeviceCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(ApproveDeviceCommand request, CancellationToken cancellationToken)
    {
        var deviceRepo = _unitOfWork.Repository<RegisteredDevice>();
        var device = await deviceRepo.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device == null || device.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Device.NotFound(request.DeviceId));
        }

        try
        {
            device.Approve(request.ApprovedBy);
            deviceRepo.Update(device);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success(Unit.Value);
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure<Unit>(new Error("SECURITY.DEVICE.APPROVE_FAILED", ex.Message, ErrorType.Conflict));
        }
    }
}

public sealed class ApproveDeviceCommandValidator : AbstractValidator<ApproveDeviceCommand>
{
    public ApproveDeviceCommandValidator()
    {
        RuleFor(x => x.DeviceId).NotEmpty();
        RuleFor(x => x.ApprovedBy).NotEmpty();
    }
}

// ----------------------------------------------------
// 2. RejectDeviceCommand & TrustDeviceCommand
// ----------------------------------------------------
public sealed record RejectDeviceCommand(Guid DeviceId, string Reason) : ICommand<Result<Unit>>;

public sealed class RejectDeviceCommandHandler : IRequestHandler<RejectDeviceCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public RejectDeviceCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(RejectDeviceCommand request, CancellationToken cancellationToken)
    {
        var deviceRepo = _unitOfWork.Repository<RegisteredDevice>();
        var device = await deviceRepo.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device == null || device.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Device.NotFound(request.DeviceId));
        }

        device.Reject(request.Reason);
        deviceRepo.Update(device);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

public sealed record TrustDeviceCommand(Guid DeviceId) : ICommand<Result<Unit>>;

public sealed class TrustDeviceCommandHandler : IRequestHandler<TrustDeviceCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public TrustDeviceCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(TrustDeviceCommand request, CancellationToken cancellationToken)
    {
        var deviceRepo = _unitOfWork.Repository<RegisteredDevice>();
        var device = await deviceRepo.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device == null || device.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Device.NotFound(request.DeviceId));
        }

        try
        {
            device.Trust();
            deviceRepo.Update(device);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success(Unit.Value);
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure<Unit>(new Error("SECURITY.DEVICE.TRUST_FAILED", ex.Message, ErrorType.Conflict));
        }
    }
}

// ----------------------------------------------------
// 3. RevokeDeviceCommand, DeactivateDeviceCommand, HeartbeatCommand
// ----------------------------------------------------
public sealed record RevokeDeviceCommand(Guid DeviceId, string Reason) : ICommand<Result<Unit>>;

public sealed class RevokeDeviceCommandHandler : IRequestHandler<RevokeDeviceCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public RevokeDeviceCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(RevokeDeviceCommand request, CancellationToken cancellationToken)
    {
        var deviceRepo = _unitOfWork.Repository<RegisteredDevice>();
        var device = await deviceRepo.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device == null || device.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Device.NotFound(request.DeviceId));
        }

        device.Revoke(request.Reason);
        deviceRepo.Update(device);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

public sealed record DeactivateDeviceCommand(Guid DeviceId) : ICommand<Result<Unit>>;

public sealed class DeactivateDeviceCommandHandler : IRequestHandler<DeactivateDeviceCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeactivateDeviceCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeactivateDeviceCommand request, CancellationToken cancellationToken)
    {
        var deviceRepo = _unitOfWork.Repository<RegisteredDevice>();
        var device = await deviceRepo.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device == null || device.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Device.NotFound(request.DeviceId));
        }

        device.Deactivate();
        deviceRepo.Update(device);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

public sealed record HeartbeatCommand(Guid DeviceId, string IpAddress) : ICommand<Result<Unit>>;

public sealed class HeartbeatCommandHandler : IRequestHandler<HeartbeatCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public HeartbeatCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(HeartbeatCommand request, CancellationToken cancellationToken)
    {
        var deviceRepo = _unitOfWork.Repository<RegisteredDevice>();
        var device = await deviceRepo.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device == null || device.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Device.NotFound(request.DeviceId));
        }

        try
        {
            device.Heartbeat(request.IpAddress);
            deviceRepo.Update(device);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success(Unit.Value);
        }
        catch (InvalidOperationException)
        {
            return Result.Failure<Unit>(SecurityErrors.Device.HeartbeatRejected);
        }
    }
}

// ----------------------------------------------------
// 4. Device Queries
// ----------------------------------------------------
public sealed record GetDeviceQuery(Guid DeviceId) : IQuery<Result<RegisteredDeviceDto>>;

public sealed class GetDeviceQueryHandler : IRequestHandler<GetDeviceQuery, Result<RegisteredDeviceDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetDeviceQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RegisteredDeviceDto>> Handle(GetDeviceQuery request, CancellationToken cancellationToken)
    {
        var deviceRepo = _unitOfWork.Repository<RegisteredDevice>();
        var device = await deviceRepo.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device == null || device.IsDeleted)
        {
            return Result.Failure<RegisteredDeviceDto>(SecurityErrors.Device.NotFound(request.DeviceId));
        }

        var dto = new RegisteredDeviceDto(
            device.Id,
            device.UserId,
            device.DeviceName,
            device.Fingerprint.FingerprintHash,
            device.Fingerprint.ClientType,
            device.Fingerprint.DeviceModel,
            device.Fingerprint.OperatingSystem,
            device.Status.ToString(),
            device.ApprovedBy,
            device.ApprovedAtUtc,
            device.LastHeartbeatUtc,
            device.LastIpAddress);

        return Result.Success(dto);
    }
}

public sealed record GetTrustedDevicesQuery(Guid UserId) : IQuery<Result<IReadOnlyList<RegisteredDeviceDto>>>;

public sealed class GetTrustedDevicesQueryHandler : IRequestHandler<GetTrustedDevicesQuery, Result<IReadOnlyList<RegisteredDeviceDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetTrustedDevicesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IReadOnlyList<RegisteredDeviceDto>>> Handle(GetTrustedDevicesQuery request, CancellationToken cancellationToken)
    {
        var deviceRepo = _unitOfWork.Repository<RegisteredDevice>();
        var devices = await deviceRepo.FindAsync(d => d.UserId == request.UserId && (d.Status == DeviceStatus.Trusted || d.Status == DeviceStatus.Approved) && !d.IsDeleted, cancellationToken);

        var dtos = devices.Select(d => new RegisteredDeviceDto(
            d.Id, d.UserId, d.DeviceName, d.Fingerprint.FingerprintHash, d.Fingerprint.ClientType,
            d.Fingerprint.DeviceModel, d.Fingerprint.OperatingSystem, d.Status.ToString(),
            d.ApprovedBy, d.ApprovedAtUtc, d.LastHeartbeatUtc, d.LastIpAddress)).ToList();

        return Result.Success<IReadOnlyList<RegisteredDeviceDto>>(dtos);
    }
}

public sealed record DeviceHistoryQuery(Guid DeviceId) : IQuery<Result<DeviceHistoryDto>>;

public sealed class DeviceHistoryQueryHandler : IRequestHandler<DeviceHistoryQuery, Result<DeviceHistoryDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeviceHistoryQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<DeviceHistoryDto>> Handle(DeviceHistoryQuery request, CancellationToken cancellationToken)
    {
        var deviceRepo = _unitOfWork.Repository<RegisteredDevice>();
        var device = await deviceRepo.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device == null || device.IsDeleted)
        {
            return Result.Failure<DeviceHistoryDto>(SecurityErrors.Device.NotFound(request.DeviceId));
        }

        var dto = new DeviceHistoryDto(
            device.Id,
            device.Status.ToString(),
            device.LastIpAddress,
            device.LastHeartbeatUtc,
            device.CreatedAtUtc);

        return Result.Success(dto);
    }
}
