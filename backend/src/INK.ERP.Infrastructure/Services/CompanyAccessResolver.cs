using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Services;

public sealed class CompanyAccessResolver : ICompanyAccessResolver
{
    private readonly ICurrentUserService _currentUserService;
    private readonly AppDbContext _dbContext;

    public CompanyAccessResolver(ICurrentUserService currentUserService, AppDbContext dbContext)
    {
        _currentUserService = currentUserService;
        _dbContext = dbContext;
    }

    public Task<bool> IsSuperAdminAsync(CancellationToken cancellationToken = default)
    {
        var isSuper = _currentUserService.Roles.Any(r =>
            r.Equals("Super Administrator", StringComparison.OrdinalIgnoreCase) ||
            r.Equals("Super Admin", StringComparison.OrdinalIgnoreCase) ||
            r.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
            || (!string.IsNullOrEmpty(_currentUserService.Username) && _currentUserService.Username.Contains("superadmin", StringComparison.OrdinalIgnoreCase))
            || _currentUserService.Claims.Any(c => c.Type == System.Security.Claims.ClaimTypes.Email && c.Value.Contains("superadmin", StringComparison.OrdinalIgnoreCase))
            || _currentUserService.Permissions.Contains("manage:all");

        return Task.FromResult(isSuper);
    }

    public async Task<Guid?> GetAuthorizedCompanyIdAsync(CancellationToken cancellationToken = default)
    {
        if (await IsSuperAdminAsync(cancellationToken))
        {
            return null; // Super Admin has unrestricted access to all companies
        }

        if (string.IsNullOrEmpty(_currentUserService.UserId) || !Guid.TryParse(_currentUserService.UserId, out var userId))
        {
            return Guid.Empty;
        }

        var isSubAdmin = _currentUserService.Roles.Any(r =>
            r.Equals("Administrator", StringComparison.OrdinalIgnoreCase) ||
            r.Equals("Admin", StringComparison.OrdinalIgnoreCase));
        if (isSubAdmin)
        {
            var assignment = await _dbContext.AdminCompanyAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AdminUserId == userId && a.IsActive, cancellationToken);

            return assignment?.CompanyId ?? Guid.Empty;
        }

        // For non-admin employees / staff, resolve company through linked Employee record if present
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);

        if (user?.EmployeeId != null)
        {
            var employee = await _dbContext.Set<Employee>()
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == user.EmployeeId && e.IsActive, cancellationToken);

            return employee?.CompanyId ?? Guid.Empty;
        }

        return Guid.Empty;
    }

    public async Task<bool> HasAccessToCompanyAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        if (await IsSuperAdminAsync(cancellationToken))
        {
            return true;
        }

        var authorizedCompanyId = await GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == null)
        {
            return true;
        }

        if (authorizedCompanyId == Guid.Empty || companyId == Guid.Empty)
        {
            return false;
        }

        return authorizedCompanyId.Value == companyId;
    }

    public async Task<Result<Unit>> ValidateCompanyAccessAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        if (await IsSuperAdminAsync(cancellationToken))
        {
            return Result.Success(Unit.Value);
        }

        var authorizedCompanyId = await GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == null)
        {
            return Result.Success(Unit.Value);
        }

        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Failure<Unit>(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        if (authorizedCompanyId.Value != companyId)
        {
            return Result.Failure<Unit>(Error.Unauthorized("IAM.CompanyAccessDenied", "Access to the requested company is denied for your account."));
        }

        return Result.Success(Unit.Value);
    }
}
