using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Fulfillment.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.Application.Features.Inventory.Fulfillment.Commands;

// ----------------------------------------------------
// 1. CREATE PACK TASK COMMAND
// ----------------------------------------------------
public record CreatePackTaskCommand(
    Guid PickTaskId,
    Guid? AssignedEmployeeId = null,
    string? Notes = null
) : IRequest<Result<PackTaskDto>>;

public class CreatePackTaskCommandHandler : IRequestHandler<CreatePackTaskCommand, Result<PackTaskDto>>
{
    private readonly IPackTaskRepository _packTaskRepository;
    private readonly IPickTaskRepository _pickTaskRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ISalesOrderRepository _salesOrderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public CreatePackTaskCommandHandler(
        IPackTaskRepository packTaskRepository,
        IPickTaskRepository pickTaskRepository,
        IEmployeeRepository employeeRepository,
        ISalesOrderRepository salesOrderRepository,
        ICompanyAccessResolver companyAccessResolver,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _packTaskRepository = packTaskRepository ?? throw new ArgumentNullException(nameof(packTaskRepository));
        _pickTaskRepository = pickTaskRepository ?? throw new ArgumentNullException(nameof(pickTaskRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _salesOrderRepository = salesOrderRepository ?? throw new ArgumentNullException(nameof(salesOrderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PackTaskDto>> Handle(CreatePackTaskCommand request, CancellationToken cancellationToken)
    {
        if (request.PickTaskId == Guid.Empty)
            return Result<PackTaskDto>.Failure(Error.Validation("PackTask.InvalidPickId", "Pick task ID is required."));

        var pickTask = await _pickTaskRepository.GetByIdWithDetailsAsync(request.PickTaskId, cancellationToken);
        if (pickTask == null)
            return Result<PackTaskDto>.Failure(Error.NotFound("PackTask.PickNotFound", "Pick task not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(pickTask.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<PackTaskDto>.Failure(Error.Unauthorized("PackTask.Unauthorized", "Unauthorized access to company pick task."));

        if (pickTask.Status != PickTaskStatuses.Completed && pickTask.Status != PickTaskStatuses.PartiallyPicked)
        {
            return Result<PackTaskDto>.Failure(Error.Validation(
                "PackTask.PickNotCompleted",
                $"Cannot create pack task for pick task in status '{pickTask.Status}'. Picking must be 'Completed' or 'PartiallyPicked'."));
        }

        // Prevent duplicate active pack task for the same pick task
        var existingActive = await _packTaskRepository.GetByPickTaskIdAsync(pickTask.CompanyId, pickTask.Id, cancellationToken);
        if (existingActive != null && existingActive.Status != PackTaskStatuses.Cancelled)
        {
            return Result<PackTaskDto>.Failure(Error.Conflict(
                "PackTask.DuplicateActiveTask",
                $"An active pack task ({existingActive.PackTaskNumber}) already exists for this Pick Task in status '{existingActive.Status}'."));
        }

        Employee? employee = null;
        if (request.AssignedEmployeeId.HasValue && request.AssignedEmployeeId.Value != Guid.Empty)
        {
            employee = await _employeeRepository.GetByIdAsync(request.AssignedEmployeeId.Value, cancellationToken);
            if (employee == null || employee.CompanyId != pickTask.CompanyId || !employee.IsActive)
            {
                return Result<PackTaskDto>.Failure(Error.Validation("PackTask.InvalidPacker", "Assigned packer does not exist, is inactive, or belongs to another company."));
            }
        }

        string packNumber = await _packTaskRepository.GetNextPackTaskNumberAsync(pickTask.CompanyId, cancellationToken);

        var packTask = new PackTask
        {
            Id = Guid.NewGuid(),
            CompanyId = pickTask.CompanyId,
            SalesOrderId = pickTask.SalesOrderId,
            PickTaskId = pickTask.Id,
            PackTaskNumber = packNumber,
            AssignedEmployeeId = request.AssignedEmployeeId,
            Status = request.AssignedEmployeeId.HasValue ? PackTaskStatuses.Assigned : PackTaskStatuses.Pending,
            TotalPackagesCount = 0,
            Notes = request.Notes,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _packTaskRepository.AddAsync(packTask, cancellationToken);

        // Update SalesOrder status to Packing
        if (pickTask.SalesOrder != null)
        {
            pickTask.SalesOrder.OrderStatus = SalesOrderStatuses.Packing;
            pickTask.SalesOrder.LastModifiedAtUtc = DateTime.UtcNow;
            await _salesOrderRepository.UpdateAsync(pickTask.SalesOrder, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var detail = await _packTaskRepository.GetByIdWithDetailsAsync(packTask.Id, cancellationToken);
        return Result.Success(MapPackTaskDetail(detail!));
    }

    private static PackTaskDto MapPackTaskDetail(PackTask t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber ?? "SO",
        t.SalesOrder?.CustomerId ?? Guid.Empty,
        t.SalesOrder?.Customer?.LegalName ?? "Customer",
        t.PickTaskId,
        t.PickTask?.PickTaskNumber ?? "PK",
        t.PackTaskNumber,
        t.AssignedEmployeeId,
        t.AssignedEmployee != null ? $"{t.AssignedEmployee.FirstName} {t.AssignedEmployee.LastName}".Trim() : null,
        t.AssignedEmployee?.EmployeeCode,
        t.Status,
        t.TotalPackagesCount,
        t.StartedAtUtc,
        t.CompletedAtUtc,
        t.Notes,
        t.ConcurrencyToken,
        t.CreatedAtUtc,
        t.Packages.Select(p => new PackageDto(
            p.Id,
            p.PackTaskId,
            p.PackageNumber,
            p.PackageType,
            p.GrossWeightKg,
            p.Length,
            p.Width,
            p.Height,
            p.SealNumber,
            p.Barcode,
            p.PackedByEmployeeId,
            p.PackedByEmployee != null ? $"{p.PackedByEmployee.FirstName} {p.PackedByEmployee.LastName}".Trim() : null,
            p.PackedAtUtc,
            p.Items.Select(i => new PackageItemDto(
                i.Id,
                i.PackageId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.PackedQuantity,
                i.BatchNumber
            )).ToList()
        )).ToList()
    );
}

// ----------------------------------------------------
// 2. ASSIGN PACKER COMMAND
// ----------------------------------------------------
public record AssignPackerCommand(
    Guid PackTaskId,
    Guid EmployeeId
) : IRequest<Result<PackTaskDto>>;

public class AssignPackerCommandHandler : IRequestHandler<AssignPackerCommand, Result<PackTaskDto>>
{
    private readonly IPackTaskRepository _packTaskRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public AssignPackerCommandHandler(
        IPackTaskRepository packTaskRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _packTaskRepository = packTaskRepository ?? throw new ArgumentNullException(nameof(packTaskRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PackTaskDto>> Handle(AssignPackerCommand request, CancellationToken cancellationToken)
    {
        if (request.PackTaskId == Guid.Empty || request.EmployeeId == Guid.Empty)
            return Result<PackTaskDto>.Failure(Error.Validation("PackTask.InvalidParams", "Pack Task ID and Employee ID are required."));

        var packTask = await _packTaskRepository.GetByIdWithDetailsAsync(request.PackTaskId, cancellationToken);
        if (packTask == null)
            return Result<PackTaskDto>.Failure(Error.NotFound("PackTask.NotFound", "Pack task not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(packTask.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<PackTaskDto>.Failure(Error.Unauthorized("PackTask.Unauthorized", "Unauthorized access to company pack task."));

        if (packTask.Status == PackTaskStatuses.Packed || packTask.Status == PackTaskStatuses.Cancelled)
        {
            return Result<PackTaskDto>.Failure(Error.Validation("PackTask.InvalidStatusForAssignment", $"Cannot assign packer to a {packTask.Status} pack task."));
        }

        var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId, cancellationToken);
        if (employee == null || employee.CompanyId != packTask.CompanyId || !employee.IsActive)
        {
            return Result<PackTaskDto>.Failure(Error.Validation("PackTask.InvalidEmployee", "Selected employee does not exist, is inactive, or belongs to another company."));
        }

        packTask.AssignedEmployeeId = employee.Id;
        if (packTask.Status == PackTaskStatuses.Pending)
        {
            packTask.Status = PackTaskStatuses.Assigned;
        }

        packTask.LastModifiedAtUtc = DateTime.UtcNow;
        await _packTaskRepository.UpdateAsync(packTask, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _packTaskRepository.GetByIdWithDetailsAsync(packTask.Id, cancellationToken);
        return Result.Success(MapPackTaskDetail(updated!));
    }

    private static PackTaskDto MapPackTaskDetail(PackTask t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber ?? "SO",
        t.SalesOrder?.CustomerId ?? Guid.Empty,
        t.SalesOrder?.Customer?.LegalName ?? "Customer",
        t.PickTaskId,
        t.PickTask?.PickTaskNumber ?? "PK",
        t.PackTaskNumber,
        t.AssignedEmployeeId,
        t.AssignedEmployee != null ? $"{t.AssignedEmployee.FirstName} {t.AssignedEmployee.LastName}".Trim() : null,
        t.AssignedEmployee?.EmployeeCode,
        t.Status,
        t.TotalPackagesCount,
        t.StartedAtUtc,
        t.CompletedAtUtc,
        t.Notes,
        t.ConcurrencyToken,
        t.CreatedAtUtc,
        t.Packages.Select(p => new PackageDto(
            p.Id,
            p.PackTaskId,
            p.PackageNumber,
            p.PackageType,
            p.GrossWeightKg,
            p.Length,
            p.Width,
            p.Height,
            p.SealNumber,
            p.Barcode,
            p.PackedByEmployeeId,
            p.PackedByEmployee != null ? $"{p.PackedByEmployee.FirstName} {p.PackedByEmployee.LastName}".Trim() : null,
            p.PackedAtUtc,
            p.Items.Select(i => new PackageItemDto(
                i.Id,
                i.PackageId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.PackedQuantity,
                i.BatchNumber
            )).ToList()
        )).ToList()
    );
}

// ----------------------------------------------------
// 3. COMPLETE PACK TASK COMMAND (Multi-package creation & Item verification)
// ----------------------------------------------------
public record PackageItemInput(
    Guid ProductId,
    decimal PackedQuantity,
    string? BatchNumber = null
);

public record PackageInput(
    string? PackageNumber = null,
    string PackageType = "Carton",
    decimal? GrossWeightKg = null,
    decimal? Length = null,
    decimal? Width = null,
    decimal? Height = null,
    string? SealNumber = null,
    string? Barcode = null,
    List<PackageItemInput>? Items = null
);

public record CompletePackTaskCommand(
    Guid PackTaskId,
    List<PackageInput> Packages
) : IRequest<Result<PackTaskDto>>;

public class CompletePackTaskCommandHandler : IRequestHandler<CompletePackTaskCommand, Result<PackTaskDto>>
{
    private readonly IPackTaskRepository _packTaskRepository;
    private readonly IPickTaskRepository _pickTaskRepository;
    private readonly ISalesOrderRepository _salesOrderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public CompletePackTaskCommandHandler(
        IPackTaskRepository packTaskRepository,
        IPickTaskRepository pickTaskRepository,
        ISalesOrderRepository salesOrderRepository,
        ICompanyAccessResolver companyAccessResolver,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _packTaskRepository = packTaskRepository ?? throw new ArgumentNullException(nameof(packTaskRepository));
        _pickTaskRepository = pickTaskRepository ?? throw new ArgumentNullException(nameof(pickTaskRepository));
        _salesOrderRepository = salesOrderRepository ?? throw new ArgumentNullException(nameof(salesOrderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PackTaskDto>> Handle(CompletePackTaskCommand request, CancellationToken cancellationToken)
    {
        if (request.PackTaskId == Guid.Empty)
            return Result<PackTaskDto>.Failure(Error.Validation("PackTask.InvalidId", "Pack task ID is required."));

        var packTask = await _packTaskRepository.GetByIdWithDetailsAsync(request.PackTaskId, cancellationToken);
        if (packTask == null)
            return Result<PackTaskDto>.Failure(Error.NotFound("PackTask.NotFound", "Pack task not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(packTask.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<PackTaskDto>.Failure(Error.Unauthorized("PackTask.Unauthorized", "Unauthorized access to company pack task."));

        if (packTask.Status == PackTaskStatuses.Packed || packTask.Status == PackTaskStatuses.Cancelled)
        {
            return Result<PackTaskDto>.Failure(Error.Validation("PackTask.AlreadyFinished", $"Cannot complete pack task in status '{packTask.Status}'."));
        }

        var pickTask = await _pickTaskRepository.GetByIdWithDetailsAsync(packTask.PickTaskId, cancellationToken);
        if (pickTask == null)
            return Result<PackTaskDto>.Failure(Error.NotFound("PackTask.PickNotFound", "Associated pick task not found."));

        // If packages are not explicitly itemized, generate one default package with all picked items
        var packageInputs = request.Packages;
        if (packageInputs == null || packageInputs.Count == 0)
        {
            var defaultItems = pickTask.Lines
                .Where(l => l.PickedQuantity > 0)
                .Select(l => new PackageItemInput(l.ProductId, l.PickedQuantity, l.BatchNumber))
                .ToList();

            packageInputs = new List<PackageInput>
            {
                new PackageInput(
                    PackageNumber: null,
                    PackageType: "Carton",
                    GrossWeightKg: null,
                    Items: defaultItems
                )
            };
        }

        // Validate that sum of packed quantities for each product does not exceed picked quantity
        var totalPackedByProduct = new Dictionary<Guid, decimal>();
        foreach (var pkg in packageInputs)
        {
            if (pkg.Items == null || pkg.Items.Count == 0)
                return Result<PackTaskDto>.Failure(Error.Validation("PackTask.EmptyPackage", "Every package must contain at least one product item."));

            foreach (var item in pkg.Items)
            {
                if (item.PackedQuantity <= 0)
                    return Result<PackTaskDto>.Failure(Error.Validation("PackTask.InvalidPackedQty", "Packed quantity must be greater than zero."));

                if (!totalPackedByProduct.ContainsKey(item.ProductId))
                    totalPackedByProduct[item.ProductId] = 0m;

                totalPackedByProduct[item.ProductId] += item.PackedQuantity;
            }
        }

        foreach (var kvp in totalPackedByProduct)
        {
            var pickLine = pickTask.Lines.FirstOrDefault(l => l.ProductId == kvp.Key);
            decimal maxAllowed = pickLine?.PickedQuantity ?? 0m;
            if (kvp.Value > maxAllowed)
            {
                return Result<PackTaskDto>.Failure(Error.Validation(
                    "PackTask.OverPackDetected",
                    $"Packed quantity ({kvp.Value}) for product '{pickLine?.Product?.Name ?? kvp.Key.ToString()}' cannot exceed verified picked quantity ({maxAllowed})."));
            }
        }

        // Build packages
        int pkgIndex = 1;
        foreach (var pkgInput in packageInputs)
        {
            string pkgNum = pkgInput.PackageNumber ?? string.Empty;
            if (string.IsNullOrWhiteSpace(pkgNum))
            {
                pkgNum = await _packTaskRepository.GetNextPackageNumberAsync(packTask.CompanyId, cancellationToken);
            }

            var package = new Package
            {
                Id = Guid.NewGuid(),
                PackTaskId = packTask.Id,
                PackageNumber = pkgNum,
                PackageType = string.IsNullOrWhiteSpace(pkgInput.PackageType) ? "Carton" : pkgInput.PackageType,
                GrossWeightKg = pkgInput.GrossWeightKg,
                Length = pkgInput.Length,
                Width = pkgInput.Width,
                Height = pkgInput.Height,
                SealNumber = pkgInput.SealNumber,
                Barcode = pkgInput.Barcode,
                PackedByEmployeeId = packTask.AssignedEmployeeId,
                PackedAtUtc = DateTime.UtcNow,
                CreatedAtUtc = DateTime.UtcNow
            };

            foreach (var itm in pkgInput.Items!)
            {
                package.Items.Add(new PackageItem
                {
                    Id = Guid.NewGuid(),
                    PackageId = package.Id,
                    ProductId = itm.ProductId,
                    PackedQuantity = itm.PackedQuantity,
                    BatchNumber = itm.BatchNumber,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            packTask.Packages.Add(package);
            await _packTaskRepository.AddPackageAsync(package, cancellationToken);
            pkgIndex++;
        }

        packTask.TotalPackagesCount = packTask.Packages.Count;
        packTask.Status = PackTaskStatuses.Packed;
        packTask.CompletedAtUtc = DateTime.UtcNow;
        packTask.LastModifiedAtUtc = DateTime.UtcNow;
        await _packTaskRepository.UpdateAsync(packTask, cancellationToken);

        // Update SalesOrder status
        if (packTask.SalesOrder != null)
        {
            packTask.SalesOrder.OrderStatus = SalesOrderStatuses.Packed;
            packTask.SalesOrder.LastModifiedAtUtc = DateTime.UtcNow;
            await _salesOrderRepository.UpdateAsync(packTask.SalesOrder, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _packTaskRepository.GetByIdWithDetailsAsync(packTask.Id, cancellationToken);
        return Result.Success(MapPackTaskDetail(updated!));
    }

    private static PackTaskDto MapPackTaskDetail(PackTask t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber ?? "SO",
        t.SalesOrder?.CustomerId ?? Guid.Empty,
        t.SalesOrder?.Customer?.LegalName ?? "Customer",
        t.PickTaskId,
        t.PickTask?.PickTaskNumber ?? "PK",
        t.PackTaskNumber,
        t.AssignedEmployeeId,
        t.AssignedEmployee != null ? $"{t.AssignedEmployee.FirstName} {t.AssignedEmployee.LastName}".Trim() : null,
        t.AssignedEmployee?.EmployeeCode,
        t.Status,
        t.TotalPackagesCount,
        t.StartedAtUtc,
        t.CompletedAtUtc,
        t.Notes,
        t.ConcurrencyToken,
        t.CreatedAtUtc,
        t.Packages.Select(p => new PackageDto(
            p.Id,
            p.PackTaskId,
            p.PackageNumber,
            p.PackageType,
            p.GrossWeightKg,
            p.Length,
            p.Width,
            p.Height,
            p.SealNumber,
            p.Barcode,
            p.PackedByEmployeeId,
            p.PackedByEmployee != null ? $"{p.PackedByEmployee.FirstName} {p.PackedByEmployee.LastName}".Trim() : null,
            p.PackedAtUtc,
            p.Items.Select(i => new PackageItemDto(
                i.Id,
                i.PackageId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.PackedQuantity,
                i.BatchNumber
            )).ToList()
        )).ToList()
    );
}

// ----------------------------------------------------
// 4. CANCEL PACK TASK COMMAND
// ----------------------------------------------------
public record CancelPackTaskCommand(Guid PackTaskId) : IRequest<Result<PackTaskDto>>;

public class CancelPackTaskCommandHandler : IRequestHandler<CancelPackTaskCommand, Result<PackTaskDto>>
{
    private readonly IPackTaskRepository _packTaskRepository;
    private readonly ISalesOrderRepository _salesOrderRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public CancelPackTaskCommandHandler(
        IPackTaskRepository packTaskRepository,
        ISalesOrderRepository salesOrderRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _packTaskRepository = packTaskRepository ?? throw new ArgumentNullException(nameof(packTaskRepository));
        _salesOrderRepository = salesOrderRepository ?? throw new ArgumentNullException(nameof(salesOrderRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PackTaskDto>> Handle(CancelPackTaskCommand request, CancellationToken cancellationToken)
    {
        if (request.PackTaskId == Guid.Empty)
            return Result<PackTaskDto>.Failure(Error.Validation("PackTask.InvalidId", "Pack task ID is required."));

        var packTask = await _packTaskRepository.GetByIdWithDetailsAsync(request.PackTaskId, cancellationToken);
        if (packTask == null)
            return Result<PackTaskDto>.Failure(Error.NotFound("PackTask.NotFound", "Pack task not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(packTask.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<PackTaskDto>.Failure(Error.Unauthorized("PackTask.Unauthorized", "Unauthorized access to company pack task."));

        if (packTask.Status == PackTaskStatuses.Cancelled)
        {
            return Result<PackTaskDto>.Failure(Error.Validation("PackTask.AlreadyCancelled", "Pack task is already cancelled."));
        }

        packTask.Status = PackTaskStatuses.Cancelled;
        packTask.LastModifiedAtUtc = DateTime.UtcNow;
        await _packTaskRepository.UpdateAsync(packTask, cancellationToken);

        if (packTask.SalesOrder != null)
        {
            packTask.SalesOrder.OrderStatus = SalesOrderStatuses.Picked;
            packTask.SalesOrder.LastModifiedAtUtc = DateTime.UtcNow;
            await _salesOrderRepository.UpdateAsync(packTask.SalesOrder, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _packTaskRepository.GetByIdWithDetailsAsync(packTask.Id, cancellationToken);
        return Result.Success(MapPackTaskDetail(updated!));
    }

    private static PackTaskDto MapPackTaskDetail(PackTask t) => new(
        t.Id,
        t.CompanyId,
        t.Company?.LegalName ?? "Company",
        t.SalesOrderId,
        t.SalesOrder?.OrderNumber ?? "SO",
        t.SalesOrder?.CustomerId ?? Guid.Empty,
        t.SalesOrder?.Customer?.LegalName ?? "Customer",
        t.PickTaskId,
        t.PickTask?.PickTaskNumber ?? "PK",
        t.PackTaskNumber,
        t.AssignedEmployeeId,
        t.AssignedEmployee != null ? $"{t.AssignedEmployee.FirstName} {t.AssignedEmployee.LastName}".Trim() : null,
        t.AssignedEmployee?.EmployeeCode,
        t.Status,
        t.TotalPackagesCount,
        t.StartedAtUtc,
        t.CompletedAtUtc,
        t.Notes,
        t.ConcurrencyToken,
        t.CreatedAtUtc,
        t.Packages.Select(p => new PackageDto(
            p.Id,
            p.PackTaskId,
            p.PackageNumber,
            p.PackageType,
            p.GrossWeightKg,
            p.Length,
            p.Width,
            p.Height,
            p.SealNumber,
            p.Barcode,
            p.PackedByEmployeeId,
            p.PackedByEmployee != null ? $"{p.PackedByEmployee.FirstName} {p.PackedByEmployee.LastName}".Trim() : null,
            p.PackedAtUtc,
            p.Items.Select(i => new PackageItemDto(
                i.Id,
                i.PackageId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.PackedQuantity,
                i.BatchNumber
            )).ToList()
        )).ToList()
    );
}
