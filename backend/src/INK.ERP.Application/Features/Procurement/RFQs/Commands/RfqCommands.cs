using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.Procurement.RFQs.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Procurement;

namespace INK.ERP.Application.Features.Procurement.RFQs.Commands;

public record CreateRfqCommand(
    Guid CompanyId,
    Guid PurchaseRequisitionId,
    DateTime ResponseDueDate,
    string? Notes,
    List<CreateRfqSupplierRequest> Suppliers,
    List<CreateRfqItemRequest>? Items = null) : IRequest<Result<RfqDto>>;

public class CreateRfqCommandHandler : IRequestHandler<CreateRfqCommand, Result<RfqDto>>
{
    private readonly IRfqRepository _rfqRepository;
    private readonly IPurchaseRequisitionRepository _prRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public CreateRfqCommandHandler(
        IRfqRepository rfqRepository,
        IPurchaseRequisitionRepository prRepository,
        ISupplierRepository supplierRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _rfqRepository = rfqRepository;
        _prRepository = prRepository;
        _supplierRepository = supplierRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<RfqDto>> Handle(CreateRfqCommand request, CancellationToken cancellationToken)
    {
        var pr = await _prRepository.GetByIdWithDetailsAsync(request.PurchaseRequisitionId, cancellationToken);
        if (pr == null)
        {
            return Result<RfqDto>.Failure(Error.NotFound("PR.NotFound", $"Purchase Requisition '{request.PurchaseRequisitionId}' was not found."));
        }

        if (pr.CompanyId != request.CompanyId)
        {
            return Result<RfqDto>.Failure(Error.Validation("PR.CompanyMismatch", "Purchase Requisition does not belong to the selected company."));
        }

        if (pr.Status != RequisitionStatus.Approved)
        {
            return Result<RfqDto>.Failure(Error.Validation("PR.NotApproved", $"Purchase Requisition '{pr.RequisitionNumber}' must be Approved before an RFQ can be created. Current status: {pr.Status}."));
        }

        if (request.Suppliers == null || !request.Suppliers.Any())
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.NoSuppliers", "At least one supplier is required for an RFQ. Example: SUP-001 - ABC Suppliers"));
        }

        // Validate supplier duplication
        var duplicateSupplierIds = request.Suppliers
            .GroupBy(s => s.SupplierId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();
        if (duplicateSupplierIds.Any())
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.DuplicateSupplier", "Supplier is already selected for this RFQ. Please select another supplier."));
        }

        if (request.ResponseDueDate < DateTime.UtcNow.Date)
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.InvalidDueDate", "Response Due Date cannot be in the past. Example: 20-08-2026"));
        }

        var rfqNumber = await _rfqRepository.GenerateNextRfqNumberAsync(request.CompanyId, cancellationToken);
        var userId = _currentUserService.UserId ?? "System";
        var userName = _currentUserService.Username ?? "System User";

        var rfq = new Rfq
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            RfqNumber = rfqNumber,
            PurchaseRequisitionId = pr.Id,
            PurchaseRequisitionNumber = pr.RequisitionNumber,
            RfqDate = DateTime.UtcNow,
            ResponseDueDate = request.ResponseDueDate.ToUniversalTime(),
            DepartmentId = pr.DepartmentId,
            DepartmentName = pr.DepartmentName,
            RequestedByUserId = userId,
            RequestedByName = userName,
            BuyerUserId = userId,
            BuyerName = userName,
            CurrencyCode = string.IsNullOrWhiteSpace(pr.CurrencyCode) ? "INR" : pr.CurrencyCode,
            Status = RfqStatus.Draft,
            Notes = request.Notes?.Trim()
        };

        // Attach Suppliers
        foreach (var supplierReq in request.Suppliers)
        {
            var supplier = await _supplierRepository.GetByIdAsync(supplierReq.SupplierId, cancellationToken);
            if (supplier == null)
            {
                return Result<RfqDto>.Failure(Error.NotFound("Supplier.NotFound", $"Supplier '{supplierReq.SupplierId}' was not found."));
            }

            if (supplier.CompanyId != request.CompanyId)
            {
                return Result<RfqDto>.Failure(Error.Validation("Supplier.CompanyMismatch", $"Supplier '{supplier.Code}' does not belong to the selected company."));
            }

            rfq.Suppliers.Add(new RfqSupplier
            {
                Id = Guid.Empty,
                RfqId = rfq.Id,
                SupplierId = supplier.Id,
                SupplierCode = supplier.Code,
                SupplierName = supplier.LegalName,
                ContactPerson = supplier.LegalName,
                Email = supplier.Email,
                Phone = supplier.Phone,
                DeliveryStatus = RfqSupplierRecipientStatus.Pending
            });
        }

        // Attach Items — always sourced from the approved PR items only.
        // If the caller provides override Items, each ProductId must exist in the PR's approved items.
        // This prevents data-integrity violations where RFQ products diverge from the source PR.
        if (request.Items != null && request.Items.Any())
        {
            var prProductIds = pr.Items.Select(i => i.ProductId).ToHashSet();
            var unauthorizedProducts = request.Items
                .Where(i => !prProductIds.Contains(i.ProductId))
                .ToList();

            if (unauthorizedProducts.Any())
            {
                return Result<RfqDto>.Failure(Error.Validation("RFQ.ItemNotInPR",
                    $"One or more RFQ items contain products that are not in the source Purchase Requisition '{pr.RequisitionNumber}'. " +
                    "RFQ items must be derived from the approved PR items only."));
            }

            var duplicateProductIds = request.Items.GroupBy(i => i.ProductId).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
            if (duplicateProductIds.Any())
            {
                return Result<RfqDto>.Failure(Error.Validation("RFQ.DuplicateProduct", "At least one product is duplicated in the RFQ item list."));
            }

            foreach (var itemReq in request.Items)
            {
                var product = await _productRepository.GetByIdWithDetailsAsync(itemReq.ProductId, cancellationToken);
                if (product == null)
                {
                    return Result<RfqDto>.Failure(Error.NotFound("Product.NotFound", $"Product '{itemReq.ProductId}' was not found."));
                }

                if (itemReq.RequestedQuantity <= 0)
                {
                    return Result<RfqDto>.Failure(Error.Validation("RFQ.InvalidQuantity", $"Requested quantity for product '{product.Name}' must be greater than 0."));
                }

                rfq.Items.Add(new RfqItem
                {
                    Id = Guid.Empty,
                    RfqId = rfq.Id,
                    ProductId = product.Id,
                    ProductCode = product.Code,
                    ProductName = product.Name,
                    Uom = !string.IsNullOrWhiteSpace(product.BaseUom?.Code) ? product.BaseUom.Code : "PCS",
                    RequestedQuantity = itemReq.RequestedQuantity,
                    RequiredByDate = itemReq.RequiredByDate?.ToUniversalTime() ?? pr.RequiredByDate,
                    Notes = itemReq.Notes?.Trim()
                });
            }
        }
        else
        {
            // Default: copy all approved PR items exactly — preserving product scope and quantities.
            foreach (var prItem in pr.Items)
            {
                rfq.Items.Add(new RfqItem
                {
                    Id = Guid.Empty,
                    RfqId = rfq.Id,
                    ProductId = prItem.ProductId,
                    ProductCode = prItem.ProductCode,
                    ProductName = prItem.ProductName,
                    Uom = prItem.Uom,
                    RequestedQuantity = prItem.RequestedQuantity,
                    RequiredByDate = pr.RequiredByDate,
                    Notes = prItem.Notes
                });
            }
        }

        await _rfqRepository.AddAsync(rfq, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var detailedRfq = await _rfqRepository.GetByIdWithDetailsAsync(rfq.Id, cancellationToken);
        return Result<RfqDto>.Success(RfqMappingHelper.MapToDto(detailedRfq!));
    }
}

public record UpdateRfqCommand(
    Guid Id,
    DateTime ResponseDueDate,
    string? Notes,
    List<CreateRfqSupplierRequest> Suppliers,
    List<CreateRfqItemRequest> Items) : IRequest<Result<RfqDto>>;

public class UpdateRfqCommandHandler : IRequestHandler<UpdateRfqCommand, Result<RfqDto>>
{
    private readonly IRfqRepository _rfqRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateRfqCommandHandler(
        IRfqRepository rfqRepository,
        ISupplierRepository supplierRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork)
    {
        _rfqRepository = rfqRepository;
        _supplierRepository = supplierRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RfqDto>> Handle(UpdateRfqCommand request, CancellationToken cancellationToken)
    {
        var rfq = await _rfqRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rfq == null)
        {
            return Result<RfqDto>.Failure(Error.NotFound("RFQ.NotFound", $"RFQ '{request.Id}' was not found."));
        }

        if (rfq.Status != RfqStatus.Draft)
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.CannotEdit", $"RFQ '{rfq.RfqNumber}' cannot be edited in '{rfq.Status}' status. Only Draft RFQs can be edited."));
        }

        if (request.Suppliers == null || !request.Suppliers.Any())
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.NoSuppliers", "At least one supplier is required for an RFQ."));
        }

        var duplicateSupplierIds = request.Suppliers.GroupBy(s => s.SupplierId).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
        if (duplicateSupplierIds.Any())
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.DuplicateSupplier", "Supplier is already selected for this RFQ. Please select another supplier."));
        }

        if (request.Items == null || !request.Items.Any())
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.NoItems", "At least one product item is required for an RFQ."));
        }

        var duplicateProductIds = request.Items.GroupBy(i => i.ProductId).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
        if (duplicateProductIds.Any())
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.DuplicateProduct", "At least one product is duplicated in the RFQ item list."));
        }

        rfq.ResponseDueDate = request.ResponseDueDate.ToUniversalTime();
        rfq.Notes = request.Notes?.Trim();

        // In-place Suppliers update
        var existingSuppliers = rfq.Suppliers.ToList();
        var reqSupplierIds = request.Suppliers.Select(s => s.SupplierId).ToHashSet();
        foreach (var existingSup in existingSuppliers)
        {
            if (!reqSupplierIds.Contains(existingSup.SupplierId))
            {
                rfq.Suppliers.Remove(existingSup);
            }
        }

        foreach (var supplierReq in request.Suppliers)
        {
            var existingSup = rfq.Suppliers.FirstOrDefault(s => s.SupplierId == supplierReq.SupplierId);
            if (existingSup == null)
            {
                var supplier = await _supplierRepository.GetByIdAsync(supplierReq.SupplierId, cancellationToken);
                if (supplier == null)
                {
                    return Result<RfqDto>.Failure(Error.NotFound("Supplier.NotFound", $"Supplier '{supplierReq.SupplierId}' was not found."));
                }

                rfq.Suppliers.Add(new RfqSupplier
                {
                    Id = Guid.Empty,
                    RfqId = rfq.Id,
                    SupplierId = supplier.Id,
                    SupplierCode = supplier.Code,
                    SupplierName = supplier.LegalName,
                    ContactPerson = supplier.LegalName,
                    Email = supplier.Email,
                    Phone = supplier.Phone,
                    DeliveryStatus = RfqSupplierRecipientStatus.Pending
                });
            }
        }

        // In-place Items update
        var existingItems = rfq.Items.ToList();
        var reqProductIds = request.Items.Select(i => i.ProductId).ToHashSet();
        foreach (var existingItem in existingItems)
        {
            if (!reqProductIds.Contains(existingItem.ProductId))
            {
                rfq.Items.Remove(existingItem);
            }
        }

        foreach (var itemReq in request.Items)
        {
            var product = await _productRepository.GetByIdWithDetailsAsync(itemReq.ProductId, cancellationToken);
            if (product == null)
            {
                return Result<RfqDto>.Failure(Error.NotFound("Product.NotFound", $"Product '{itemReq.ProductId}' was not found."));
            }

            if (itemReq.RequestedQuantity <= 0)
            {
                return Result<RfqDto>.Failure(Error.Validation("RFQ.InvalidQuantity", $"Requested quantity for product '{product.Name}' must be greater than 0."));
            }

            var existingItem = rfq.Items.FirstOrDefault(i => i.ProductId == product.Id);
            if (existingItem != null)
            {
                existingItem.ProductCode = product.Code;
                existingItem.ProductName = product.Name;
                existingItem.Uom = !string.IsNullOrWhiteSpace(product.BaseUom?.Code) ? product.BaseUom.Code : "PCS";
                existingItem.RequestedQuantity = itemReq.RequestedQuantity;
                existingItem.RequiredByDate = itemReq.RequiredByDate?.ToUniversalTime();
                existingItem.Notes = itemReq.Notes?.Trim();
            }
            else
            {
                rfq.Items.Add(new RfqItem
                {
                    Id = Guid.Empty,
                    RfqId = rfq.Id,
                    ProductId = product.Id,
                    ProductCode = product.Code,
                    ProductName = product.Name,
                    Uom = !string.IsNullOrWhiteSpace(product.BaseUom?.Code) ? product.BaseUom.Code : "PCS",
                    RequestedQuantity = itemReq.RequestedQuantity,
                    RequiredByDate = itemReq.RequiredByDate?.ToUniversalTime(),
                    Notes = itemReq.Notes?.Trim()
                });
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<RfqDto>.Success(RfqMappingHelper.MapToDto(rfq));
    }
}

public record SubmitRfqCommand(Guid Id) : IRequest<Result<RfqDto>>;

public class SubmitRfqCommandHandler : IRequestHandler<SubmitRfqCommand, Result<RfqDto>>
{
    private readonly IRfqRepository _rfqRepository;
    private readonly IUnitOfWork _unitOfWork;

    public SubmitRfqCommandHandler(IRfqRepository rfqRepository, IUnitOfWork unitOfWork)
    {
        _rfqRepository = rfqRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RfqDto>> Handle(SubmitRfqCommand request, CancellationToken cancellationToken)
    {
        var rfq = await _rfqRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rfq == null)
        {
            return Result<RfqDto>.Failure(Error.NotFound("RFQ.NotFound", $"RFQ '{request.Id}' was not found."));
        }

        if (rfq.Status != RfqStatus.Draft)
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.InvalidStateTransition", $"RFQ '{rfq.RfqNumber}' is in '{rfq.Status}' status and cannot be submitted. Only Draft RFQs can be submitted."));
        }

        if (!rfq.Suppliers.Any())
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.NoSuppliers", "Cannot submit RFQ without at least one supplier."));
        }

        if (!rfq.Items.Any())
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.NoItems", "Cannot submit RFQ without at least one line item."));
        }

        rfq.Status = RfqStatus.Submitted;
        rfq.SubmittedAtUtc = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<RfqDto>.Success(RfqMappingHelper.MapToDto(rfq));
    }
}

public record SendRfqCommand(Guid Id) : IRequest<Result<RfqDto>>;

public class SendRfqCommandHandler : IRequestHandler<SendRfqCommand, Result<RfqDto>>
{
    private readonly IRfqRepository _rfqRepository;
    private readonly IUnitOfWork _unitOfWork;

    public SendRfqCommandHandler(IRfqRepository rfqRepository, IUnitOfWork unitOfWork)
    {
        _rfqRepository = rfqRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RfqDto>> Handle(SendRfqCommand request, CancellationToken cancellationToken)
    {
        var rfq = await _rfqRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rfq == null)
        {
            return Result<RfqDto>.Failure(Error.NotFound("RFQ.NotFound", $"RFQ '{request.Id}' was not found."));
        }

        if (rfq.Status != RfqStatus.Submitted)
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.InvalidStateTransition", $"RFQ '{rfq.RfqNumber}' is in '{rfq.Status}' status and cannot be sent. Only Submitted RFQs can be sent to suppliers."));
        }

        rfq.Status = RfqStatus.Sent;
        rfq.SentAtUtc = DateTime.UtcNow;

        // Update all recipient delivery statuses to Sent
        foreach (var supplier in rfq.Suppliers)
        {
            supplier.DeliveryStatus = RfqSupplierRecipientStatus.Sent;
            supplier.SentAtUtc = DateTime.UtcNow;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<RfqDto>.Success(RfqMappingHelper.MapToDto(rfq));
    }
}

public record CancelRfqCommand(Guid Id, string Reason) : IRequest<Result<RfqDto>>;

public class CancelRfqCommandHandler : IRequestHandler<CancelRfqCommand, Result<RfqDto>>
{
    private readonly IRfqRepository _rfqRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CancelRfqCommandHandler(IRfqRepository rfqRepository, IUnitOfWork unitOfWork)
    {
        _rfqRepository = rfqRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RfqDto>> Handle(CancelRfqCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.ReasonRequired", "Cancellation reason is required. Example: Supplier sourcing cancelled."));
        }

        var rfq = await _rfqRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rfq == null)
        {
            return Result<RfqDto>.Failure(Error.NotFound("RFQ.NotFound", $"RFQ '{request.Id}' was not found."));
        }

        if (rfq.Status != RfqStatus.Draft && rfq.Status != RfqStatus.Submitted)
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.InvalidStateTransition", $"RFQ '{rfq.RfqNumber}' is in '{rfq.Status}' status and cannot be cancelled. Only Draft or Submitted RFQs can be cancelled."));
        }

        rfq.Status = RfqStatus.Cancelled;
        rfq.CancelReason = request.Reason.Trim();
        rfq.CancelledAtUtc = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<RfqDto>.Success(RfqMappingHelper.MapToDto(rfq));
    }
}

public record CloseRfqCommand(Guid Id, string CloseReason) : IRequest<Result<RfqDto>>;

public class CloseRfqCommandHandler : IRequestHandler<CloseRfqCommand, Result<RfqDto>>
{
    private readonly IRfqRepository _rfqRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CloseRfqCommandHandler(IRfqRepository rfqRepository, IUnitOfWork unitOfWork)
    {
        _rfqRepository = rfqRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RfqDto>> Handle(CloseRfqCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CloseReason))
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.CloseReasonRequired", "Closing reason is required. Example: Closed because supplier sourcing is no longer required."));
        }

        var rfq = await _rfqRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (rfq == null)
        {
            return Result<RfqDto>.Failure(Error.NotFound("RFQ.NotFound", $"RFQ '{request.Id}' was not found."));
        }

        if (rfq.Status != RfqStatus.Sent)
        {
            return Result<RfqDto>.Failure(Error.Validation("RFQ.InvalidStateTransition", $"RFQ '{rfq.RfqNumber}' is in '{rfq.Status}' status and cannot be closed. Only Sent RFQs can be closed."));
        }

        rfq.Status = RfqStatus.Closed;
        rfq.CloseReason = request.CloseReason.Trim();
        rfq.ClosedAtUtc = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<RfqDto>.Success(RfqMappingHelper.MapToDto(rfq));
    }
}

public static class RfqMappingHelper
{
    public static RfqDto MapToDto(Rfq rfq)
    {
        var items = rfq.Items.Select(i => new RfqItemDto(
            i.Id,
            i.RfqId,
            i.ProductId,
            i.ProductCode,
            i.ProductName,
            i.Uom,
            i.RequestedQuantity,
            i.RequiredByDate,
            i.Notes)).ToList();

        var suppliers = rfq.Suppliers.Select(s => new RfqSupplierDto(
            s.Id,
            s.RfqId,
            s.SupplierId,
            s.SupplierCode,
            s.SupplierName,
            s.ContactPerson,
            s.Email,
            s.Phone,
            s.DeliveryStatus.ToString(),
            s.SentAtUtc)).ToList();

        return new RfqDto(
            rfq.Id,
            rfq.CompanyId,
            rfq.RfqNumber,
            rfq.PurchaseRequisitionId,
            rfq.PurchaseRequisitionNumber,
            rfq.RfqDate,
            rfq.ResponseDueDate,
            rfq.DepartmentId,
            rfq.DepartmentName,
            rfq.RequestedByUserId,
            rfq.RequestedByName,
            rfq.BuyerUserId,
            rfq.BuyerName,
            rfq.CurrencyCode,
            rfq.Status.ToString(),
            rfq.Notes,
            rfq.CancelReason,
            rfq.CloseReason,
            rfq.SubmittedAtUtc,
            rfq.SentAtUtc,
            rfq.ClosedAtUtc,
            rfq.CancelledAtUtc,
            rfq.CreatedAtUtc,
            rfq.CreatedBy,
            rfq.LastModifiedAtUtc,
            rfq.LastModifiedBy,
            items,
            suppliers);
    }
}
