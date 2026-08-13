using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Procurement.PurchaseRequisitions.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Procurement;

namespace INK.ERP.Application.Features.Procurement.PurchaseRequisitions.Commands;

public record CreatePurchaseRequisitionCommand(
    Guid CompanyId,
    Guid? DepartmentId,
    string? DepartmentName,
    Guid? WarehouseId,
    string? WarehouseName,
    DateTime RequestDate,
    DateTime RequiredByDate,
    RequisitionPriority Priority,
    string Purpose,
    string? Notes,
    List<CreatePurchaseRequisitionItemRequest> Items) : IRequest<Result<PurchaseRequisitionDto>>;

public class CreatePurchaseRequisitionCommandHandler : IRequestHandler<CreatePurchaseRequisitionCommand, Result<PurchaseRequisitionDto>>
{
    private readonly IPurchaseRequisitionRepository _requisitionRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public CreatePurchaseRequisitionCommandHandler(
        IPurchaseRequisitionRepository requisitionRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _requisitionRepository = requisitionRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PurchaseRequisitionDto>> Handle(CreatePurchaseRequisitionCommand request, CancellationToken cancellationToken)
    {
        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.NotFound("Company.NotFound", $"Company '{request.CompanyId}' was not found."));
        }

        if (request.Items == null || request.Items.Count == 0)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.NoItems", "At least one product line item is required. Example: 50x Premium Basmati Rice"));
        }

        if (request.RequiredByDate < request.RequestDate)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.InvalidDate", "Required By Date cannot be earlier than Request Date. Example: 25-08-2026"));
        }

        if (string.IsNullOrWhiteSpace(request.Purpose))
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.PurposeRequired", "Purpose / Justification is required. Example: Monthly FMCG packaging materials replenishment."));
        }

        var requisitionNumber = await _requisitionRepository.GenerateNextRequisitionNumberAsync(request.CompanyId, cancellationToken);
        var requestedUserId = _currentUserService.UserId ?? "SYSTEM";
        var requestedUsername = _currentUserService.Username ?? "Administrator";

        var pr = new PurchaseRequisition
        {
            CompanyId = request.CompanyId,
            RequisitionNumber = requisitionNumber,
            RequestedByUserId = requestedUserId,
            RequestedByName = requestedUsername,
            DepartmentId = request.DepartmentId,
            DepartmentName = request.DepartmentName,
            WarehouseId = request.WarehouseId,
            WarehouseName = request.WarehouseName,
            RequestDate = request.RequestDate.ToUniversalTime(),
            RequiredByDate = request.RequiredByDate.ToUniversalTime(),
            Priority = request.Priority,
            Status = RequisitionStatus.Draft,
            Purpose = request.Purpose.Trim(),
            Notes = request.Notes?.Trim(),
            CurrencyCode = "INR"
        };

        var duplicateProductIds = request.Items
            .GroupBy(i => i.ProductId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();
        if (duplicateProductIds.Any())
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.DuplicateProduct", "Product is already added to this requisition. Example: select a different product."));
        }

        decimal totalAmount = 0m;
        foreach (var itemReq in request.Items)
        {
            var product = await _productRepository.GetByIdWithDetailsAsync(itemReq.ProductId, cancellationToken);
            if (product == null)
            {
                return Result<PurchaseRequisitionDto>.Failure(Error.NotFound("Product.NotFound", $"Product '{itemReq.ProductId}' was not found."));
            }

            if (!product.IsActive)
            {
                return Result<PurchaseRequisitionDto>.Failure(Error.Validation("Product.Inactive", $"Product '{product.Code} - {product.Name}' is inactive and cannot be selected for purchase requisition."));
            }

            if (product.CompanyId != request.CompanyId)
            {
                return Result<PurchaseRequisitionDto>.Failure(Error.Validation("Product.CompanyMismatch", $"Product '{product.Code}' does not belong to the requisition's company."));
            }

            if (itemReq.RequestedQuantity <= 0)
            {
                return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.InvalidQuantity", $"Quantity for product '{product.Name}' must be greater than 0. Example: 50"));
            }

            if (itemReq.EstimatedUnitPrice < 0)
            {
                return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.InvalidPrice", $"Estimated unit price for product '{product.Name}' cannot be negative. Example: 120.00"));
            }

            var lineTotal = itemReq.RequestedQuantity * itemReq.EstimatedUnitPrice;
            totalAmount += lineTotal;

            pr.Items.Add(new PurchaseRequisitionItem
            {
                ProductId = product.Id,
                ProductCode = product.Code,
                ProductName = product.Name,
                Uom = !string.IsNullOrWhiteSpace(product.BaseUom?.Code) ? product.BaseUom.Code : "PCS",
                RequestedQuantity = itemReq.RequestedQuantity,
                EstimatedUnitPrice = itemReq.EstimatedUnitPrice,
                EstimatedLineTotal = lineTotal,
                Notes = itemReq.Notes?.Trim()
            });
        }

        pr.EstimatedTotalAmount = totalAmount;

        pr.StatusHistories.Add(new PurchaseRequisitionStatusHistory
        {
            FromStatus = RequisitionStatus.Draft,
            ToStatus = RequisitionStatus.Draft,
            ChangedByUserId = requestedUserId,
            ChangedByName = requestedUsername,
            Comment = "Purchase Requisition draft created.",
            TimestampUtc = DateTime.UtcNow
        });

        await _requisitionRepository.AddAsync(pr, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var detailedPr = await _requisitionRepository.GetByIdWithDetailsAsync(pr.Id, cancellationToken);
        return Result<PurchaseRequisitionDto>.Success(MapToDto(detailedPr!));
    }

    private static PurchaseRequisitionDto MapToDto(PurchaseRequisition pr)
    {
        return new PurchaseRequisitionDto(
            pr.Id,
            pr.CompanyId,
            pr.RequisitionNumber,
            pr.RequestedByUserId,
            pr.RequestedByName,
            pr.DepartmentId,
            pr.DepartmentName,
            pr.WarehouseId,
            pr.WarehouseName,
            pr.RequestDate,
            pr.RequiredByDate,
            pr.Priority.ToString(),
            pr.Status.ToString(),
            pr.Purpose,
            pr.Notes,
            pr.EstimatedTotalAmount,
            pr.CurrencyCode,
            pr.SubmittedAtUtc,
            pr.ApprovedAtUtc,
            pr.RejectedAtUtc,
            pr.CancelledAtUtc,
            pr.CreatedAtUtc,
            pr.CreatedBy,
            pr.LastModifiedAtUtc,
            pr.LastModifiedBy,
            pr.Items.Select(i => new PurchaseRequisitionItemDto(
                i.Id, i.PurchaseRequisitionId, i.ProductId, i.ProductCode, i.ProductName, i.Uom, i.RequestedQuantity, i.EstimatedUnitPrice, i.EstimatedLineTotal, i.Notes
            )).ToList(),
            pr.StatusHistories.Select(h => new PurchaseRequisitionStatusHistoryDto(
                h.Id, h.PurchaseRequisitionId, h.FromStatus.ToString(), h.ToStatus.ToString(), h.ChangedByUserId, h.ChangedByName, h.Comment, h.TimestampUtc
            )).OrderBy(h => h.TimestampUtc).ToList()
        );
    }
}

public record UpdatePurchaseRequisitionCommand(
    Guid Id,
    Guid? DepartmentId,
    string? DepartmentName,
    Guid? WarehouseId,
    string? WarehouseName,
    DateTime RequestDate,
    DateTime RequiredByDate,
    RequisitionPriority Priority,
    string Purpose,
    string? Notes,
    List<CreatePurchaseRequisitionItemRequest> Items) : IRequest<Result<PurchaseRequisitionDto>>;

public class UpdatePurchaseRequisitionCommandHandler : IRequestHandler<UpdatePurchaseRequisitionCommand, Result<PurchaseRequisitionDto>>
{
    private readonly IPurchaseRequisitionRepository _requisitionRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public UpdatePurchaseRequisitionCommandHandler(
        IPurchaseRequisitionRepository requisitionRepository,
        IProductRepository productRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _requisitionRepository = requisitionRepository;
        _productRepository = productRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PurchaseRequisitionDto>> Handle(UpdatePurchaseRequisitionCommand request, CancellationToken cancellationToken)
    {
        var pr = await _requisitionRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (pr == null)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.NotFound("PR.NotFound", $"Purchase Requisition '{request.Id}' was not found."));
        }

        if (pr.Status != RequisitionStatus.Draft)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.ImmutableState", $"Cannot modify Purchase Requisition '{pr.RequisitionNumber}' because it is in '{pr.Status}' status. Only Draft requisitions can be edited."));
        }

        if (request.Items == null || request.Items.Count == 0)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.NoItems", "At least one product line item is required. Example: 50x Premium Basmati Rice"));
        }

        if (request.RequiredByDate < request.RequestDate)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.InvalidDate", "Required By Date cannot be earlier than Request Date. Example: 25-08-2026"));
        }

        pr.DepartmentId = request.DepartmentId;
        pr.DepartmentName = request.DepartmentName;
        pr.WarehouseId = request.WarehouseId;
        pr.WarehouseName = request.WarehouseName;
        pr.RequestDate = request.RequestDate.ToUniversalTime();
        pr.RequiredByDate = request.RequiredByDate.ToUniversalTime();
        pr.Priority = request.Priority;
        pr.Purpose = request.Purpose.Trim();
        pr.Notes = request.Notes?.Trim();

        var duplicateProductIds = request.Items
            .GroupBy(i => i.ProductId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();
        if (duplicateProductIds.Any())
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.DuplicateProduct", "Product is already added to this requisition. Example: select a different product."));
        }

        // In-place collection update to preserve tracked entity keys & avoid EF Core concurrency exceptions
        var existingItems = pr.Items.ToList();
        var requestProductIds = request.Items.Select(i => i.ProductId).ToHashSet();

        // Remove items no longer in request
        foreach (var existingItem in existingItems)
        {
            if (!requestProductIds.Contains(existingItem.ProductId))
            {
                pr.Items.Remove(existingItem);
            }
        }

        decimal totalAmount = 0m;
        foreach (var itemReq in request.Items)
        {
            var product = await _productRepository.GetByIdWithDetailsAsync(itemReq.ProductId, cancellationToken);
            if (product == null)
            {
                return Result<PurchaseRequisitionDto>.Failure(Error.NotFound("Product.NotFound", $"Product '{itemReq.ProductId}' was not found."));
            }

            if (!product.IsActive)
            {
                return Result<PurchaseRequisitionDto>.Failure(Error.Validation("Product.Inactive", $"Product '{product.Code} - {product.Name}' is inactive and cannot be selected for purchase requisition."));
            }

            if (product.CompanyId != pr.CompanyId)
            {
                return Result<PurchaseRequisitionDto>.Failure(Error.Validation("Product.CompanyMismatch", $"Product '{product.Code}' does not belong to the requisition's company."));
            }

            if (itemReq.RequestedQuantity <= 0)
            {
                return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.InvalidQuantity", $"Quantity for product '{product.Name}' must be greater than 0. Example: 50"));
            }

            if (itemReq.EstimatedUnitPrice < 0)
            {
                return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.InvalidPrice", $"Estimated unit price for product '{product.Name}' cannot be negative. Example: 120.00"));
            }

            var lineTotal = itemReq.RequestedQuantity * itemReq.EstimatedUnitPrice;
            totalAmount += lineTotal;

            var existingItem = pr.Items.FirstOrDefault(i => i.ProductId == product.Id);
            if (existingItem != null)
            {
                // Update existing tracked item in-place
                existingItem.ProductCode = product.Code;
                existingItem.ProductName = product.Name;
                existingItem.Uom = !string.IsNullOrWhiteSpace(product.BaseUom?.Code) ? product.BaseUom.Code : "PCS";
                existingItem.RequestedQuantity = itemReq.RequestedQuantity;
                existingItem.EstimatedUnitPrice = itemReq.EstimatedUnitPrice;
                existingItem.EstimatedLineTotal = lineTotal;
                existingItem.Notes = itemReq.Notes?.Trim();
            }
            else
            {
                // Add new item to collection with Id = Guid.Empty so EF Core treats it as EntityState.Added
                pr.Items.Add(new PurchaseRequisitionItem
                {
                    Id = Guid.Empty,
                    PurchaseRequisitionId = pr.Id,
                    ProductId = product.Id,
                    ProductCode = product.Code,
                    ProductName = product.Name,
                    Uom = !string.IsNullOrWhiteSpace(product.BaseUom?.Code) ? product.BaseUom.Code : "PCS",
                    RequestedQuantity = itemReq.RequestedQuantity,
                    EstimatedUnitPrice = itemReq.EstimatedUnitPrice,
                    EstimatedLineTotal = lineTotal,
                    Notes = itemReq.Notes?.Trim()
                });
            }
        }

        pr.EstimatedTotalAmount = totalAmount;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<PurchaseRequisitionDto>.Success(MapToDto(pr));
    }

    private static PurchaseRequisitionDto MapToDto(PurchaseRequisition pr)
    {
        return new PurchaseRequisitionDto(
            pr.Id,
            pr.CompanyId,
            pr.RequisitionNumber,
            pr.RequestedByUserId,
            pr.RequestedByName,
            pr.DepartmentId,
            pr.DepartmentName,
            pr.WarehouseId,
            pr.WarehouseName,
            pr.RequestDate,
            pr.RequiredByDate,
            pr.Priority.ToString(),
            pr.Status.ToString(),
            pr.Purpose,
            pr.Notes,
            pr.EstimatedTotalAmount,
            pr.CurrencyCode,
            pr.SubmittedAtUtc,
            pr.ApprovedAtUtc,
            pr.RejectedAtUtc,
            pr.CancelledAtUtc,
            pr.CreatedAtUtc,
            pr.CreatedBy,
            pr.LastModifiedAtUtc,
            pr.LastModifiedBy,
            pr.Items.Select(i => new PurchaseRequisitionItemDto(
                i.Id, i.PurchaseRequisitionId, i.ProductId, i.ProductCode, i.ProductName, i.Uom, i.RequestedQuantity, i.EstimatedUnitPrice, i.EstimatedLineTotal, i.Notes
            )).ToList(),
            pr.StatusHistories.Select(h => new PurchaseRequisitionStatusHistoryDto(
                h.Id, h.PurchaseRequisitionId, h.FromStatus.ToString(), h.ToStatus.ToString(), h.ChangedByUserId, h.ChangedByName, h.Comment, h.TimestampUtc
            )).OrderBy(h => h.TimestampUtc).ToList()
        );
    }
}

public record SubmitPurchaseRequisitionCommand(Guid Id) : IRequest<Result<PurchaseRequisitionDto>>;

public class SubmitPurchaseRequisitionCommandHandler : IRequestHandler<SubmitPurchaseRequisitionCommand, Result<PurchaseRequisitionDto>>
{
    private readonly IPurchaseRequisitionRepository _requisitionRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public SubmitPurchaseRequisitionCommandHandler(IPurchaseRequisitionRepository requisitionRepository, ICurrentUserService currentUserService, IUnitOfWork unitOfWork)
    {
        _requisitionRepository = requisitionRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PurchaseRequisitionDto>> Handle(SubmitPurchaseRequisitionCommand request, CancellationToken cancellationToken)
    {
        var pr = await _requisitionRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (pr == null)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.NotFound("PR.NotFound", $"Purchase Requisition '{request.Id}' was not found."));
        }

        if (pr.Status != RequisitionStatus.Draft)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.InvalidStatusTransition", $"Cannot submit Purchase Requisition '{pr.RequisitionNumber}' because it is in '{pr.Status}' status. Only Draft requisitions can be submitted for approval."));
        }

        var oldStatus = pr.Status;
        pr.Status = RequisitionStatus.PendingApproval;
        pr.SubmittedAtUtc = DateTime.UtcNow;

        var userId = _currentUserService.UserId ?? "SYSTEM";
        var userName = _currentUserService.Username ?? "Administrator";

        var statusHistory = new PurchaseRequisitionStatusHistory
        {
            Id = Guid.NewGuid(),
            PurchaseRequisitionId = pr.Id,
            FromStatus = oldStatus,
            ToStatus = RequisitionStatus.PendingApproval,
            ChangedByUserId = userId,
            ChangedByName = userName,
            Comment = "Purchase Requisition submitted for manager approval.",
            TimestampUtc = DateTime.UtcNow
        };

        pr.StatusHistories.Add(statusHistory);
        await _unitOfWork.Repository<PurchaseRequisitionStatusHistory>().AddAsync(statusHistory, cancellationToken);

        await _requisitionRepository.UpdateAsync(pr, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<PurchaseRequisitionDto>.Success(MapToDto(pr));
    }

    private static PurchaseRequisitionDto MapToDto(PurchaseRequisition pr)
    {
        return new PurchaseRequisitionDto(
            pr.Id,
            pr.CompanyId,
            pr.RequisitionNumber,
            pr.RequestedByUserId,
            pr.RequestedByName,
            pr.DepartmentId,
            pr.DepartmentName,
            pr.WarehouseId,
            pr.WarehouseName,
            pr.RequestDate,
            pr.RequiredByDate,
            pr.Priority.ToString(),
            pr.Status.ToString(),
            pr.Purpose,
            pr.Notes,
            pr.EstimatedTotalAmount,
            pr.CurrencyCode,
            pr.SubmittedAtUtc,
            pr.ApprovedAtUtc,
            pr.RejectedAtUtc,
            pr.CancelledAtUtc,
            pr.CreatedAtUtc,
            pr.CreatedBy,
            pr.LastModifiedAtUtc,
            pr.LastModifiedBy,
            pr.Items.Select(i => new PurchaseRequisitionItemDto(
                i.Id, i.PurchaseRequisitionId, i.ProductId, i.ProductCode, i.ProductName, i.Uom, i.RequestedQuantity, i.EstimatedUnitPrice, i.EstimatedLineTotal, i.Notes
            )).ToList(),
            pr.StatusHistories.Select(h => new PurchaseRequisitionStatusHistoryDto(
                h.Id, h.PurchaseRequisitionId, h.FromStatus.ToString(), h.ToStatus.ToString(), h.ChangedByUserId, h.ChangedByName, h.Comment, h.TimestampUtc
            )).OrderBy(h => h.TimestampUtc).ToList()
        );
    }
}

public record ApprovePurchaseRequisitionCommand(Guid Id, string? Comment) : IRequest<Result<PurchaseRequisitionDto>>;

public class ApprovePurchaseRequisitionCommandHandler : IRequestHandler<ApprovePurchaseRequisitionCommand, Result<PurchaseRequisitionDto>>
{
    private readonly IPurchaseRequisitionRepository _requisitionRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public ApprovePurchaseRequisitionCommandHandler(IPurchaseRequisitionRepository requisitionRepository, ICurrentUserService currentUserService, IUnitOfWork unitOfWork)
    {
        _requisitionRepository = requisitionRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PurchaseRequisitionDto>> Handle(ApprovePurchaseRequisitionCommand request, CancellationToken cancellationToken)
    {
        var pr = await _requisitionRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (pr == null)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.NotFound("PR.NotFound", $"Purchase Requisition '{request.Id}' was not found."));
        }

        if (pr.Status != RequisitionStatus.PendingApproval)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.InvalidStatusTransition", $"Cannot approve Purchase Requisition '{pr.RequisitionNumber}' because it is in '{pr.Status}' status. Only PendingApproval requisitions can be approved."));
        }

        var oldStatus = pr.Status;
        pr.Status = RequisitionStatus.Approved;
        pr.ApprovedAtUtc = DateTime.UtcNow;

        var userId = _currentUserService.UserId ?? "SYSTEM";
        var userName = _currentUserService.Username ?? "Administrator";

        var statusHistory = new PurchaseRequisitionStatusHistory
        {
            Id = Guid.NewGuid(),
            PurchaseRequisitionId = pr.Id,
            FromStatus = oldStatus,
            ToStatus = RequisitionStatus.Approved,
            ChangedByUserId = userId,
            ChangedByName = userName,
            Comment = request.Comment ?? "Purchase Requisition approved.",
            TimestampUtc = DateTime.UtcNow
        };

        pr.StatusHistories.Add(statusHistory);
        await _unitOfWork.Repository<PurchaseRequisitionStatusHistory>().AddAsync(statusHistory, cancellationToken);

        await _requisitionRepository.UpdateAsync(pr, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<PurchaseRequisitionDto>.Success(MapToDto(pr));
    }

    private static PurchaseRequisitionDto MapToDto(PurchaseRequisition pr) => SubmitPurchaseRequisitionCommandHandler_MapToDto(pr);
    private static PurchaseRequisitionDto SubmitPurchaseRequisitionCommandHandler_MapToDto(PurchaseRequisition pr)
    {
        return new PurchaseRequisitionDto(
            pr.Id,
            pr.CompanyId,
            pr.RequisitionNumber,
            pr.RequestedByUserId,
            pr.RequestedByName,
            pr.DepartmentId,
            pr.DepartmentName,
            pr.WarehouseId,
            pr.WarehouseName,
            pr.RequestDate,
            pr.RequiredByDate,
            pr.Priority.ToString(),
            pr.Status.ToString(),
            pr.Purpose,
            pr.Notes,
            pr.EstimatedTotalAmount,
            pr.CurrencyCode,
            pr.SubmittedAtUtc,
            pr.ApprovedAtUtc,
            pr.RejectedAtUtc,
            pr.CancelledAtUtc,
            pr.CreatedAtUtc,
            pr.CreatedBy,
            pr.LastModifiedAtUtc,
            pr.LastModifiedBy,
            pr.Items.Select(i => new PurchaseRequisitionItemDto(
                i.Id, i.PurchaseRequisitionId, i.ProductId, i.ProductCode, i.ProductName, i.Uom, i.RequestedQuantity, i.EstimatedUnitPrice, i.EstimatedLineTotal, i.Notes
            )).ToList(),
            pr.StatusHistories.Select(h => new PurchaseRequisitionStatusHistoryDto(
                h.Id, h.PurchaseRequisitionId, h.FromStatus.ToString(), h.ToStatus.ToString(), h.ChangedByUserId, h.ChangedByName, h.Comment, h.TimestampUtc
            )).OrderBy(h => h.TimestampUtc).ToList()
        );
    }
}

public record RejectPurchaseRequisitionCommand(Guid Id, string Reason) : IRequest<Result<PurchaseRequisitionDto>>;

public class RejectPurchaseRequisitionCommandHandler : IRequestHandler<RejectPurchaseRequisitionCommand, Result<PurchaseRequisitionDto>>
{
    private readonly IPurchaseRequisitionRepository _requisitionRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public RejectPurchaseRequisitionCommandHandler(IPurchaseRequisitionRepository requisitionRepository, ICurrentUserService currentUserService, IUnitOfWork unitOfWork)
    {
        _requisitionRepository = requisitionRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PurchaseRequisitionDto>> Handle(RejectPurchaseRequisitionCommand request, CancellationToken cancellationToken)
    {
        var pr = await _requisitionRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (pr == null)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.NotFound("PR.NotFound", $"Purchase Requisition '{request.Id}' was not found."));
        }

        if (pr.Status != RequisitionStatus.PendingApproval)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.InvalidStatusTransition", $"Cannot reject Purchase Requisition '{pr.RequisitionNumber}' because it is in '{pr.Status}' status. Only PendingApproval requisitions can be rejected."));
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.ReasonRequired", "A reason for rejection is required. Example: Budget limit exceeded."));
        }

        var oldStatus = pr.Status;
        pr.Status = RequisitionStatus.Rejected;
        pr.RejectedAtUtc = DateTime.UtcNow;

        var userId = _currentUserService.UserId ?? "SYSTEM";
        var userName = _currentUserService.Username ?? "Administrator";

        var statusHistory = new PurchaseRequisitionStatusHistory
        {
            Id = Guid.NewGuid(),
            PurchaseRequisitionId = pr.Id,
            FromStatus = oldStatus,
            ToStatus = RequisitionStatus.Rejected,
            ChangedByUserId = userId,
            ChangedByName = userName,
            Comment = request.Reason.Trim(),
            TimestampUtc = DateTime.UtcNow
        };

        pr.StatusHistories.Add(statusHistory);
        await _unitOfWork.Repository<PurchaseRequisitionStatusHistory>().AddAsync(statusHistory, cancellationToken);

        await _requisitionRepository.UpdateAsync(pr, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<PurchaseRequisitionDto>.Success(MapToDto(pr));
    }

    private static PurchaseRequisitionDto MapToDto(PurchaseRequisition pr)
    {
        return new PurchaseRequisitionDto(
            pr.Id,
            pr.CompanyId,
            pr.RequisitionNumber,
            pr.RequestedByUserId,
            pr.RequestedByName,
            pr.DepartmentId,
            pr.DepartmentName,
            pr.WarehouseId,
            pr.WarehouseName,
            pr.RequestDate,
            pr.RequiredByDate,
            pr.Priority.ToString(),
            pr.Status.ToString(),
            pr.Purpose,
            pr.Notes,
            pr.EstimatedTotalAmount,
            pr.CurrencyCode,
            pr.SubmittedAtUtc,
            pr.ApprovedAtUtc,
            pr.RejectedAtUtc,
            pr.CancelledAtUtc,
            pr.CreatedAtUtc,
            pr.CreatedBy,
            pr.LastModifiedAtUtc,
            pr.LastModifiedBy,
            pr.Items.Select(i => new PurchaseRequisitionItemDto(
                i.Id, i.PurchaseRequisitionId, i.ProductId, i.ProductCode, i.ProductName, i.Uom, i.RequestedQuantity, i.EstimatedUnitPrice, i.EstimatedLineTotal, i.Notes
            )).ToList(),
            pr.StatusHistories.Select(h => new PurchaseRequisitionStatusHistoryDto(
                h.Id, h.PurchaseRequisitionId, h.FromStatus.ToString(), h.ToStatus.ToString(), h.ChangedByUserId, h.ChangedByName, h.Comment, h.TimestampUtc
            )).OrderBy(h => h.TimestampUtc).ToList()
        );
    }
}

public record CancelPurchaseRequisitionCommand(Guid Id, string? Reason) : IRequest<Result<PurchaseRequisitionDto>>;

public class CancelPurchaseRequisitionCommandHandler : IRequestHandler<CancelPurchaseRequisitionCommand, Result<PurchaseRequisitionDto>>
{
    private readonly IPurchaseRequisitionRepository _requisitionRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public CancelPurchaseRequisitionCommandHandler(IPurchaseRequisitionRepository requisitionRepository, ICurrentUserService currentUserService, IUnitOfWork unitOfWork)
    {
        _requisitionRepository = requisitionRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PurchaseRequisitionDto>> Handle(CancelPurchaseRequisitionCommand request, CancellationToken cancellationToken)
    {
        var pr = await _requisitionRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (pr == null)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.NotFound("PR.NotFound", $"Purchase Requisition '{request.Id}' was not found."));
        }

        if (pr.Status != RequisitionStatus.Draft && pr.Status != RequisitionStatus.PendingApproval)
        {
            return Result<PurchaseRequisitionDto>.Failure(Error.Validation("PR.InvalidStatusTransition", $"Cannot cancel Purchase Requisition '{pr.RequisitionNumber}' because it is in '{pr.Status}' status. Only Draft or PendingApproval requisitions can be cancelled."));
        }

        var oldStatus = pr.Status;
        pr.Status = RequisitionStatus.Cancelled;
        pr.CancelledAtUtc = DateTime.UtcNow;

        var userId = _currentUserService.UserId ?? "SYSTEM";
        var userName = _currentUserService.Username ?? "Administrator";

        var statusHistory = new PurchaseRequisitionStatusHistory
        {
            Id = Guid.NewGuid(),
            PurchaseRequisitionId = pr.Id,
            FromStatus = oldStatus,
            ToStatus = RequisitionStatus.Cancelled,
            ChangedByUserId = userId,
            ChangedByName = userName,
            Comment = request.Reason?.Trim() ?? "Purchase Requisition cancelled.",
            TimestampUtc = DateTime.UtcNow
        };

        pr.StatusHistories.Add(statusHistory);
        await _unitOfWork.Repository<PurchaseRequisitionStatusHistory>().AddAsync(statusHistory, cancellationToken);

        await _requisitionRepository.UpdateAsync(pr, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<PurchaseRequisitionDto>.Success(MapToDto(pr));
    }

    private static PurchaseRequisitionDto MapToDto(PurchaseRequisition pr)
    {
        return new PurchaseRequisitionDto(
            pr.Id,
            pr.CompanyId,
            pr.RequisitionNumber,
            pr.RequestedByUserId,
            pr.RequestedByName,
            pr.DepartmentId,
            pr.DepartmentName,
            pr.WarehouseId,
            pr.WarehouseName,
            pr.RequestDate,
            pr.RequiredByDate,
            pr.Priority.ToString(),
            pr.Status.ToString(),
            pr.Purpose,
            pr.Notes,
            pr.EstimatedTotalAmount,
            pr.CurrencyCode,
            pr.SubmittedAtUtc,
            pr.ApprovedAtUtc,
            pr.RejectedAtUtc,
            pr.CancelledAtUtc,
            pr.CreatedAtUtc,
            pr.CreatedBy,
            pr.LastModifiedAtUtc,
            pr.LastModifiedBy,
            pr.Items.Select(i => new PurchaseRequisitionItemDto(
                i.Id, i.PurchaseRequisitionId, i.ProductId, i.ProductCode, i.ProductName, i.Uom, i.RequestedQuantity, i.EstimatedUnitPrice, i.EstimatedLineTotal, i.Notes
            )).ToList(),
            pr.StatusHistories.Select(h => new PurchaseRequisitionStatusHistoryDto(
                h.Id, h.PurchaseRequisitionId, h.FromStatus.ToString(), h.ToStatus.ToString(), h.ChangedByUserId, h.ChangedByName, h.Comment, h.TimestampUtc
            )).OrderBy(h => h.TimestampUtc).ToList()
        );
    }
}

public record DeletePurchaseRequisitionCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeletePurchaseRequisitionCommandHandler : IRequestHandler<DeletePurchaseRequisitionCommand, Result<Unit>>
{
    private readonly IPurchaseRequisitionRepository _requisitionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeletePurchaseRequisitionCommandHandler(IPurchaseRequisitionRepository requisitionRepository, IUnitOfWork unitOfWork)
    {
        _requisitionRepository = requisitionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeletePurchaseRequisitionCommand request, CancellationToken cancellationToken)
    {
        var pr = await _requisitionRepository.GetByIdAsync(request.Id, cancellationToken);
        if (pr == null)
        {
            return Result<Unit>.Failure(Error.NotFound("PR.NotFound", $"Purchase Requisition '{request.Id}' was not found."));
        }

        if (pr.Status != RequisitionStatus.Draft)
        {
            return Result<Unit>.Failure(Error.Validation("PR.CannotDeleteNonDraft", $"Cannot delete Purchase Requisition '{pr.RequisitionNumber}' because it is in '{pr.Status}' status. Only Draft requisitions can be deleted."));
        }

        await _requisitionRepository.DeleteAsync(pr, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
