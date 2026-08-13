using FluentValidation;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Domain.Services.Security;
using INK.ERP.Application.Features.Security.Policies.DTOs;

namespace INK.ERP.Application.Features.Security.Policies;

// ----------------------------------------------------
// 1. UpdateGlobalSecurityPolicyCommand
// ----------------------------------------------------
public sealed record UpdateGlobalSecurityPolicyCommand(
    Guid PolicyId,
    FaceVerificationMode FaceMode,
    float MinFaceConfidenceScore,
    GpsVerificationMode GpsMode,
    double MaxAllowedGpsRadiusMeters,
    int PasswordMinLength,
    bool PasswordRequireSpecialChar,
    int LockoutThresholdAttempts,
    AttendanceMode AttendanceMode) : ICommand<Result<Unit>>;

public sealed class UpdateGlobalSecurityPolicyCommandHandler : IRequestHandler<UpdateGlobalSecurityPolicyCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateGlobalSecurityPolicyCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(UpdateGlobalSecurityPolicyCommand request, CancellationToken cancellationToken)
    {
        var policyRepo = _unitOfWork.Repository<SecurityPolicy>();
        var policy = await policyRepo.GetByIdAsync(request.PolicyId, cancellationToken);

        if (policy == null || policy.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Policy.NotFound(request.PolicyId));
        }

        try
        {
            policy.UpdateFacePolicy(request.FaceMode, request.MinFaceConfidenceScore);
            policy.UpdateGpsPolicy(request.GpsMode, request.MaxAllowedGpsRadiusMeters);
            policy.UpdatePasswordPolicy(request.PasswordMinLength, request.PasswordRequireSpecialChar, request.LockoutThresholdAttempts);
            policy.UpdateAttendancePolicy(request.AttendanceMode);

            policyRepo.Update(policy);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result.Success(Unit.Value);
        }
        catch (Exception ex)
        {
            return Result.Failure<Unit>(new Error("SECURITY.POLICY.UPDATE_FAILED", ex.Message, ErrorType.Validation));
        }
    }
}

public sealed class UpdateGlobalSecurityPolicyCommandValidator : AbstractValidator<UpdateGlobalSecurityPolicyCommand>
{
    public UpdateGlobalSecurityPolicyCommandValidator()
    {
        RuleFor(x => x.PolicyId).NotEmpty();
        RuleFor(x => x.MinFaceConfidenceScore).InclusiveBetween(0.0f, 1.0f);
        RuleFor(x => x.MaxAllowedGpsRadiusMeters).GreaterThanOrEqualTo(0.0);
        RuleFor(x => x.PasswordMinLength).GreaterThanOrEqualTo(6);
    }
}

// ----------------------------------------------------
// 2. UpdateUserSecurityPolicyCommand & ExpireUserOverrideCommand
// ----------------------------------------------------
public sealed record UpdateUserSecurityPolicyCommand(
    Guid UserId,
    FaceVerificationMode? FaceModeOverride,
    GpsVerificationMode? GpsModeOverride,
    double? MaxAllowedGpsRadiusMetersOverride,
    AttendanceMode? AttendanceModeOverride,
    bool? RequireDeviceRegistrationOverride,
    DateTime? ExpiresAtUtc) : ICommand<Result<Unit>>;

public sealed class UpdateUserSecurityPolicyCommandHandler : IRequestHandler<UpdateUserSecurityPolicyCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateUserSecurityPolicyCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(UpdateUserSecurityPolicyCommand request, CancellationToken cancellationToken)
    {
        var userPolicyRepo = _unitOfWork.Repository<UserSecurityPolicy>();
        var userPolicies = await userPolicyRepo.FindAsync(p => p.UserId == request.UserId && !p.IsDeleted, cancellationToken);
        var userPolicy = userPolicies.FirstOrDefault();

        if (userPolicy == null)
        {
            userPolicy = new UserSecurityPolicy(request.UserId);
            await userPolicyRepo.AddAsync(userPolicy, cancellationToken);
        }

        if (request.FaceModeOverride.HasValue)
            userPolicy.OverrideFace(request.FaceModeOverride.Value, request.ExpiresAtUtc);

        if (request.GpsModeOverride.HasValue && request.MaxAllowedGpsRadiusMetersOverride.HasValue)
            userPolicy.OverrideGps(request.GpsModeOverride.Value, request.MaxAllowedGpsRadiusMetersOverride.Value, request.ExpiresAtUtc);

        if (request.AttendanceModeOverride.HasValue)
            userPolicy.OverrideAttendance(request.AttendanceModeOverride.Value, request.ExpiresAtUtc);

        if (request.RequireDeviceRegistrationOverride.HasValue)
            userPolicy.OverrideDevice(request.RequireDeviceRegistrationOverride.Value, request.ExpiresAtUtc);

        userPolicyRepo.Update(userPolicy);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

public sealed record ExpireUserOverrideCommand(Guid UserId) : ICommand<Result<Unit>>;

public sealed class ExpireUserOverrideCommandHandler : IRequestHandler<ExpireUserOverrideCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ExpireUserOverrideCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(ExpireUserOverrideCommand request, CancellationToken cancellationToken)
    {
        var userPolicyRepo = _unitOfWork.Repository<UserSecurityPolicy>();
        var userPolicies = await userPolicyRepo.FindAsync(p => p.UserId == request.UserId && !p.IsDeleted, cancellationToken);
        var userPolicy = userPolicies.FirstOrDefault();

        if (userPolicy == null)
        {
            return Result.Failure<Unit>(SecurityErrors.Policy.UserPolicyNotFound(request.UserId));
        }

        userPolicy.ExpireOverride();
        userPolicyRepo.Update(userPolicy);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 3. EnableSecurityPolicyCommand & DisableSecurityPolicyCommand
// ----------------------------------------------------
public sealed record EnableSecurityPolicyCommand(Guid PolicyId) : ICommand<Result<Unit>>;

public sealed class EnableSecurityPolicyCommandHandler : IRequestHandler<EnableSecurityPolicyCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public EnableSecurityPolicyCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(EnableSecurityPolicyCommand request, CancellationToken cancellationToken)
    {
        var policyRepo = _unitOfWork.Repository<SecurityPolicy>();
        var policy = await policyRepo.GetByIdAsync(request.PolicyId, cancellationToken);

        if (policy == null || policy.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Policy.NotFound(request.PolicyId));
        }

        policy.Enable();
        policyRepo.Update(policy);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

public sealed record DisableSecurityPolicyCommand(Guid PolicyId) : ICommand<Result<Unit>>;

public sealed class DisableSecurityPolicyCommandHandler : IRequestHandler<DisableSecurityPolicyCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DisableSecurityPolicyCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DisableSecurityPolicyCommand request, CancellationToken cancellationToken)
    {
        var policyRepo = _unitOfWork.Repository<SecurityPolicy>();
        var policy = await policyRepo.GetByIdAsync(request.PolicyId, cancellationToken);

        if (policy == null || policy.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Policy.NotFound(request.PolicyId));
        }

        policy.Disable();
        policyRepo.Update(policy);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 4. Policy Queries
// ----------------------------------------------------
public sealed record GetEffectiveSecurityPolicyQuery(Guid UserId) : IQuery<Result<EffectiveSecurityPolicyDto>>;

public sealed class GetEffectiveSecurityPolicyQueryHandler : IRequestHandler<GetEffectiveSecurityPolicyQuery, Result<EffectiveSecurityPolicyDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly PolicyResolutionDomainService _policyResolver;

    public GetEffectiveSecurityPolicyQueryHandler(IUnitOfWork unitOfWork, PolicyResolutionDomainService policyResolver)
    {
        _unitOfWork = unitOfWork;
        _policyResolver = policyResolver;
    }

    public async Task<Result<EffectiveSecurityPolicyDto>> Handle(GetEffectiveSecurityPolicyQuery request, CancellationToken cancellationToken)
    {
        var policyRepo = _unitOfWork.Repository<SecurityPolicy>();
        var globalPolicies = await policyRepo.FindAsync(p => p.IsActive && !p.IsDeleted, cancellationToken);
        var globalPolicy = globalPolicies.FirstOrDefault() ?? new SecurityPolicy("Default Global Policy");

        var userPolicyRepo = _unitOfWork.Repository<UserSecurityPolicy>();
        var userPolicies = await userPolicyRepo.FindAsync(p => p.UserId == request.UserId && !p.IsDeleted, cancellationToken);
        var userPolicy = userPolicies.FirstOrDefault();

        var effective = _policyResolver.Resolve(globalPolicy, userPolicy);

        var dto = new EffectiveSecurityPolicyDto(
            effective.FaceMode.ToString(),
            effective.MinFaceConfidenceScore,
            effective.GpsMode.ToString(),
            effective.MaxAllowedGpsRadiusMeters,
            effective.AttendanceMode.ToString(),
            effective.RequireDeviceRegistration);

        return Result.Success(dto);
    }
}

public sealed record GetGlobalSecurityPolicyQuery() : IQuery<Result<SecurityPolicyDto>>;

public sealed class GetGlobalSecurityPolicyQueryHandler : IRequestHandler<GetGlobalSecurityPolicyQuery, Result<SecurityPolicyDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetGlobalSecurityPolicyQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<SecurityPolicyDto>> Handle(GetGlobalSecurityPolicyQuery request, CancellationToken cancellationToken)
    {
        var policyRepo = _unitOfWork.Repository<SecurityPolicy>();
        var globalPolicies = await policyRepo.FindAsync(p => !p.IsDeleted, cancellationToken);
        var policy = globalPolicies.FirstOrDefault() ?? new SecurityPolicy("Default Global Policy");

        var dto = new SecurityPolicyDto(
            policy.Id, policy.Name, policy.IsActive, policy.FaceMode.ToString(), policy.MinFaceConfidenceScore,
            policy.GpsMode.ToString(), policy.MaxAllowedGpsRadiusMeters, policy.PasswordMinLength,
            policy.PasswordRequireSpecialChar, policy.LockoutThresholdAttempts, policy.AttendanceMode.ToString(),
            policy.RequireDeviceRegistration, policy.MaxDevicesPerUser);

        return Result.Success(dto);
    }
}

public sealed record GetUserSecurityPolicyQuery(Guid UserId) : IQuery<Result<SecurityPolicyDto>>;

public sealed class GetUserSecurityPolicyQueryHandler : IRequestHandler<GetUserSecurityPolicyQuery, Result<SecurityPolicyDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly PolicyResolutionDomainService _policyResolver;

    public GetUserSecurityPolicyQueryHandler(IUnitOfWork unitOfWork, PolicyResolutionDomainService policyResolver)
    {
        _unitOfWork = unitOfWork;
        _policyResolver = policyResolver;
    }

    public async Task<Result<SecurityPolicyDto>> Handle(GetUserSecurityPolicyQuery request, CancellationToken cancellationToken)
    {
        var policyRepo = _unitOfWork.Repository<SecurityPolicy>();
        var globalPolicies = await policyRepo.FindAsync(p => p.IsActive && !p.IsDeleted, cancellationToken);
        var globalPolicy = globalPolicies.FirstOrDefault() ?? new SecurityPolicy("Default Global Policy");

        var userPolicyRepo = _unitOfWork.Repository<UserSecurityPolicy>();
        var userPolicies = await userPolicyRepo.FindAsync(p => p.UserId == request.UserId && !p.IsDeleted, cancellationToken);
        var userPolicy = userPolicies.FirstOrDefault();

        var effective = _policyResolver.Resolve(globalPolicy, userPolicy);

        var dto = new SecurityPolicyDto(
            globalPolicy.Id, globalPolicy.Name, globalPolicy.IsActive, effective.FaceMode.ToString(),
            effective.MinFaceConfidenceScore, effective.GpsMode.ToString(), effective.MaxAllowedGpsRadiusMeters,
            globalPolicy.PasswordMinLength, globalPolicy.PasswordRequireSpecialChar, globalPolicy.LockoutThresholdAttempts,
            effective.AttendanceMode.ToString(), effective.RequireDeviceRegistration, globalPolicy.MaxDevicesPerUser);

        return Result.Success(dto);
    }
}
