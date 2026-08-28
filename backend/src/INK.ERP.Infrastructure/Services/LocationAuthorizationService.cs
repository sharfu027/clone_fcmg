using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Services;

public sealed class LocationAuthorizationService : ILocationAuthorizationService
{
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICurrentUserService _currentUserService;
    private readonly AppDbContext _dbContext;

    public LocationAuthorizationService(
        ICompanyAccessResolver companyAccessResolver,
        ICurrentUserService currentUserService,
        AppDbContext dbContext)
    {
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<Result<Unit>> AuthorizeLocationAccessAsync(
        Guid companyId,
        Guid locationId,
        string operationType,
        Guid? specificEmployeeId = null,
        CancellationToken cancellationToken = default)
    {
        if (companyId == Guid.Empty)
            return Result<Unit>.Failure(Error.Validation("Authorization.EmptyCompany", "Company ID is required."));

        if (locationId == Guid.Empty)
            return Result<Unit>.Failure(Error.Validation("Authorization.EmptyLocation", "Location ID is required."));

        // 1. Super Admin is globally authorized across all companies & locations (when not evaluating a specific employee)
        if (!specificEmployeeId.HasValue && await _companyAccessResolver.IsSuperAdminAsync(cancellationToken))
        {
            return Result.Success(Unit.Value);
        }

        // 2. Company Access Validation
        if (!specificEmployeeId.HasValue)
        {
            var hasCompanyAccess = await _companyAccessResolver.HasAccessToCompanyAsync(companyId, cancellationToken);
            if (!hasCompanyAccess)
            {
                return Result<Unit>.Failure(Error.Forbidden(
                    "Transfer.ForbiddenCompany",
                    $"User does not have access to company '{companyId}'. Cross-company operations are strictly rejected."));
            }
        }

        // 3. Location existence and active state check
        var location = await _dbContext.InventoryLocations
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == locationId, cancellationToken);

        if (location == null || location.CompanyId != companyId)
        {
            return Result<Unit>.Failure(Error.Forbidden(
                "Transfer.LocationMismatch",
                $"Location '{locationId}' not found or does not belong to authorized company."));
        }

        if (!location.IsActive)
        {
            return Result<Unit>.Failure(Error.Validation(
                "Transfer.InactiveLocation",
                $"Location '{location.Name}' ({location.Code}) is inactive."));
        }

        // 4. Resolve Employee Profile
        Employee? employee = null;
        if (specificEmployeeId.HasValue && specificEmployeeId.Value != Guid.Empty)
        {
            employee = await _dbContext.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == specificEmployeeId.Value, cancellationToken);

            if (employee == null || employee.CompanyId != companyId)
            {
                return Result<Unit>.Failure(Error.Forbidden(
                    "Transfer.InvalidEmployee",
                    "Specified employee not found or does not belong to the authorized company."));
            }

            if (!employee.IsActive)
            {
                return Result<Unit>.Failure(Error.Validation(
                    "Transfer.InactiveEmployee",
                    $"Employee '{employee.FirstName} {employee.LastName}' is inactive."));
            }
        }
        else if (!string.IsNullOrEmpty(_currentUserService.UserId) && Guid.TryParse(_currentUserService.UserId, out var userId))
        {
            var user = await _dbContext.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);

            if (user?.EmployeeId.HasValue == true)
            {
                employee = await _dbContext.Employees
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == user.EmployeeId.Value && e.IsActive, cancellationToken);
            }
        }

        // 5. Central Authority / Company Admin Check
        var isCompanyAdmin = _currentUserService.Roles.Any(r =>
            r.Equals("Administrator", StringComparison.OrdinalIgnoreCase) ||
            r.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
            r.Equals("Company Admin", StringComparison.OrdinalIgnoreCase) ||
            r.Equals("Inventory Manager", StringComparison.OrdinalIgnoreCase) ||
            r.Equals("Central Inventory Manager", StringComparison.OrdinalIgnoreCase));

        // Central company inventory managers with no restrictive branch/warehouse scope have company-wide authority
        if (isCompanyAdmin && (employee == null || (!employee.BranchId.HasValue && !employee.WarehouseId.HasValue)))
        {
            return Result.Success(Unit.Value);
        }

        if (employee == null)
        {
            return Result<Unit>.Failure(Error.Forbidden(
                "Transfer.NoScopeProfile",
                $"User does not have an authorized employee profile to {operationType.ToLowerInvariant()} transfers for location '{location.Name}'."));
        }

        // 6. Organization Hierarchy Scope Resolution (Branch / Warehouse / Department)
        // Hierarchy 1: Branch Scope
        if (employee.BranchId.HasValue && location.BranchId.HasValue && employee.BranchId.Value != location.BranchId.Value)
        {
            return Result<Unit>.Failure(Error.Forbidden(
                "Transfer.ScopeMismatchBranch",
                $"User is not authorized to {operationType.ToLowerInvariant()} transfers for location '{location.Name}' (Branch mismatch)."));
        }
        if (employee.BranchId.HasValue && !location.BranchId.HasValue)
        {
            return Result<Unit>.Failure(Error.Forbidden(
                "Transfer.ScopeMismatchBranch",
                $"User is restricted to a specific branch and cannot {operationType.ToLowerInvariant()} transfers for location '{location.Name}'."));
        }

        // Hierarchy 2: Warehouse Scope
        if (employee.WarehouseId.HasValue && location.WarehouseId.HasValue && employee.WarehouseId.Value != location.WarehouseId.Value)
        {
            return Result<Unit>.Failure(Error.Forbidden(
                "Transfer.ScopeMismatchWarehouse",
                $"User is not authorized to {operationType.ToLowerInvariant()} transfers for location '{location.Name}' (Warehouse mismatch)."));
        }
        if (employee.WarehouseId.HasValue && !location.WarehouseId.HasValue)
        {
            return Result<Unit>.Failure(Error.Forbidden(
                "Transfer.ScopeMismatchWarehouse",
                $"User is restricted to a specific warehouse and cannot {operationType.ToLowerInvariant()} transfers for location '{location.Name}'."));
        }

        // Hierarchy 3: Department Scope
        if (employee.DepartmentId != Guid.Empty && location.DepartmentId.HasValue && employee.DepartmentId != location.DepartmentId.Value)
        {
            return Result<Unit>.Failure(Error.Forbidden(
                "Transfer.ScopeMismatchDepartment",
                $"User is not authorized to {operationType.ToLowerInvariant()} transfers for location '{location.Name}' (Department mismatch)."));
        }

        return Result.Success(Unit.Value);
    }
}
