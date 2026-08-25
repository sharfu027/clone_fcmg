using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Reservations.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Features.Inventory.Reservations.Commands;

// ----------------------------------------------------
// 1. RESERVE STOCK COMMAND
// ----------------------------------------------------
public record ReserveStockCommand(
    Guid CompanyId,
    Guid InventoryLocationId,
    Guid ProductId,
    decimal RequestedQuantity,
    Guid? SalesOrderId = null,
    Guid? SalesOrderLineId = null,
    DateTime? ExpiresAtUtc = null
) : IRequest<Result<InventoryReservationDto>>;

public class ReserveStockCommandHandler : IRequestHandler<ReserveStockCommand, Result<InventoryReservationDto>>
{
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public ReserveStockCommandHandler(
        IInventoryReservationRepository reservationRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _locationRepository = locationRepository ?? throw new ArgumentNullException(nameof(locationRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<InventoryReservationDto>> Handle(ReserveStockCommand request, CancellationToken cancellationToken)
    {
        if (request.CompanyId == Guid.Empty)
            return Result<InventoryReservationDto>.Failure(Error.Validation("Reservation.EmptyCompany", "Company ID is required."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId);
        if (!hasAccess)
            return Result<InventoryReservationDto>.Failure(Error.Unauthorized("Reservation.Unauthorized", "Unauthorized access to requested company."));

        if (request.RequestedQuantity <= 0)
            return Result<InventoryReservationDto>.Failure(Error.Validation("Reservation.InvalidQuantity", "Requested reservation quantity must be greater than zero."));

        // 1. Validate Location
        var location = await _locationRepository.GetByIdAsync(request.InventoryLocationId, cancellationToken);
        if (location == null)
            return Result<InventoryReservationDto>.Failure(Error.NotFound("Reservation.LocationNotFound", "Inventory location not found."));
        if (location.CompanyId != request.CompanyId)
            return Result<InventoryReservationDto>.Failure(Error.Validation("Reservation.CrossCompanyLocation", "Cross-company location references are strictly forbidden."));
        if (!location.IsActive)
            return Result<InventoryReservationDto>.Failure(Error.Validation("Reservation.InactiveLocation", "Cannot reserve stock in an inactive inventory location."));

        // 2. Validate Product
        var product = await _productRepository.GetByIdWithDetailsAsync(request.ProductId, cancellationToken);
        if (product == null)
            return Result<InventoryReservationDto>.Failure(Error.NotFound("Reservation.ProductNotFound", "Product not found."));
        if (product.CompanyId != request.CompanyId)
            return Result<InventoryReservationDto>.Failure(Error.Validation("Reservation.CrossCompanyProduct", "Cross-company product references are strictly forbidden."));
        if (!product.IsActive)
            return Result<InventoryReservationDto>.Failure(Error.Validation("Reservation.InactiveProduct", "Cannot reserve an inactive product."));

        // 3. Atomic Reservation
        try
        {
            var balance = await _balanceRepository.GetByLocationAndProductAsync(
                request.CompanyId,
                request.InventoryLocationId,
                request.ProductId,
                cancellationToken);

            if (balance == null)
            {
                balance = new InventoryBalance
                {
                    CompanyId = request.CompanyId,
                    InventoryLocationId = request.InventoryLocationId,
                    ProductId = request.ProductId,
                    OnHandQuantity = 0m,
                    ReservedQuantity = 0m,
                    AllocatedQuantity = 0m,
                    CreatedAtUtc = DateTime.UtcNow
                };
                await _balanceRepository.AddAsync(balance, cancellationToken);
            }

            // Available = OnHand - Reserved - Allocated
            decimal availableQuantity = balance.OnHandQuantity - balance.ReservedQuantity - balance.AllocatedQuantity;
            if (availableQuantity < request.RequestedQuantity)
            {
                return Result<InventoryReservationDto>.Failure(Error.Validation(
                    "Reservation.InsufficientStock",
                    $"Insufficient available stock. Available: {availableQuantity:F2} {product.BaseUom?.Name ?? "units"}, Requested: {request.RequestedQuantity:F2}."));
            }

            // Increase ReservedQuantity (OnHand remains untouched)
            balance.ReservedQuantity += request.RequestedQuantity;
            balance.LastModifiedAtUtc = DateTime.UtcNow;
            await _balanceRepository.UpdateAsync(balance, cancellationToken);

            // Create InventoryReservation
            var reservation = new InventoryReservation
            {
                CompanyId = request.CompanyId,
                InventoryLocationId = request.InventoryLocationId,
                ProductId = request.ProductId,
                SalesOrderId = request.SalesOrderId,
                SalesOrderLineId = request.SalesOrderLineId,
                ReservedQuantity = request.RequestedQuantity,
                Status = InventoryReservationStatuses.Active,
                ReservedAtUtc = DateTime.UtcNow,
                ExpiresAtUtc = request.ExpiresAtUtc,
                CreatedAtUtc = DateTime.UtcNow
            };

            await _reservationRepository.AddAsync(reservation, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var dto = new InventoryReservationDto(
                reservation.Id,
                reservation.CompanyId,
                location.Id,
                location.Name,
                location.Code,
                product.Id,
                product.Name,
                product.Code,
                product.Sku,
                product.BaseUom?.Name ?? "unit",
                reservation.ReservedQuantity,
                reservation.Status,
                reservation.SalesOrderId,
                reservation.SalesOrderLineId,
                reservation.ReservedAtUtc,
                reservation.ReleasedAtUtc,
                reservation.ExpiresAtUtc,
                reservation.CreatedAtUtc
            );

            return Result<InventoryReservationDto>.Success(dto);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            return Result<InventoryReservationDto>.Failure(Error.Failure("Reservation.ExecutionFailed", $"Failed to execute atomic reservation: {ex.Message}"));
        }
    }
}

// ----------------------------------------------------
// 2. RELEASE RESERVATION COMMAND
// ----------------------------------------------------
public record ReleaseReservationCommand(Guid Id, Guid? CompanyId = null) : IRequest<Result<InventoryReservationDto>>;

public class ReleaseReservationCommandHandler : IRequestHandler<ReleaseReservationCommand, Result<InventoryReservationDto>>
{
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public ReleaseReservationCommandHandler(
        IInventoryReservationRepository reservationRepository,
        IInventoryBalanceRepository balanceRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<InventoryReservationDto>> Handle(ReleaseReservationCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<InventoryReservationDto>.Failure(Error.Validation("Reservation.InvalidId", "Reservation ID is required."));

        var reservation = await _reservationRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (reservation == null)
            return Result<InventoryReservationDto>.Failure(Error.NotFound("Reservation.NotFound", "Reservation not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(reservation.CompanyId);
        if (!hasAccess)
            return Result<InventoryReservationDto>.Failure(Error.Unauthorized("Reservation.Unauthorized", "Unauthorized access to requested reservation."));

        if (reservation.Status != InventoryReservationStatuses.Active && reservation.Status != InventoryReservationStatuses.Allocated)
        {
            return Result<InventoryReservationDto>.Failure(Error.Validation(
                "Reservation.InvalidStatusForRelease",
                $"Cannot release reservation in status '{reservation.Status}'. Only Active or Allocated reservations can be released."));
        }

        // Decrement ReservedQuantity and mark Released
        try
        {
            var balance = await _balanceRepository.GetByLocationAndProductAsync(
                reservation.CompanyId,
                reservation.InventoryLocationId,
                reservation.ProductId,
                cancellationToken);

            if (balance != null)
            {
                // Decrement ReservedQuantity (never drop below 0, OnHand untouched)
                balance.ReservedQuantity = Math.Max(0m, balance.ReservedQuantity - reservation.ReservedQuantity);
                balance.LastModifiedAtUtc = DateTime.UtcNow;
                await _balanceRepository.UpdateAsync(balance, cancellationToken);
            }

            reservation.Status = InventoryReservationStatuses.Released;
            reservation.ReleasedAtUtc = DateTime.UtcNow;
            reservation.LastModifiedAtUtc = DateTime.UtcNow;

            await _reservationRepository.UpdateAsync(reservation, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var dto = new InventoryReservationDto(
                reservation.Id,
                reservation.CompanyId,
                reservation.InventoryLocationId,
                reservation.InventoryLocation?.Name ?? "Location",
                reservation.InventoryLocation?.Code ?? "LOC",
                reservation.ProductId,
                reservation.Product?.Name ?? "Product",
                reservation.Product?.Code ?? "PRD",
                reservation.Product?.Sku,
                reservation.Product?.BaseUom?.Name ?? "unit",
                reservation.ReservedQuantity,
                reservation.Status,
                reservation.SalesOrderId,
                reservation.SalesOrderLineId,
                reservation.ReservedAtUtc,
                reservation.ReleasedAtUtc,
                reservation.ExpiresAtUtc,
                reservation.CreatedAtUtc
            );

            return Result<InventoryReservationDto>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<InventoryReservationDto>.Failure(Error.Failure("Reservation.ReleaseFailed", $"Failed to release reservation: {ex.Message}"));
        }
    }
}

// ----------------------------------------------------
// 3. CANCEL RESERVATION COMMAND
// ----------------------------------------------------
public record CancelReservationCommand(Guid Id, Guid? CompanyId = null) : IRequest<Result<InventoryReservationDto>>;

public class CancelReservationCommandHandler : IRequestHandler<CancelReservationCommand, Result<InventoryReservationDto>>
{
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public CancelReservationCommandHandler(
        IInventoryReservationRepository reservationRepository,
        IInventoryBalanceRepository balanceRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<InventoryReservationDto>> Handle(CancelReservationCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<InventoryReservationDto>.Failure(Error.Validation("Reservation.InvalidId", "Reservation ID is required."));

        var reservation = await _reservationRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (reservation == null)
            return Result<InventoryReservationDto>.Failure(Error.NotFound("Reservation.NotFound", "Reservation not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(reservation.CompanyId);
        if (!hasAccess)
            return Result<InventoryReservationDto>.Failure(Error.Unauthorized("Reservation.Unauthorized", "Unauthorized access to requested reservation."));

        if (reservation.Status != InventoryReservationStatuses.Active && reservation.Status != InventoryReservationStatuses.Pending)
        {
            return Result<InventoryReservationDto>.Failure(Error.Validation(
                "Reservation.InvalidStatusForCancel",
                $"Cannot cancel reservation in status '{reservation.Status}'. Only Active or Pending reservations can be cancelled."));
        }

        try
        {
            if (reservation.Status == InventoryReservationStatuses.Active)
            {
                var balance = await _balanceRepository.GetByLocationAndProductAsync(
                    reservation.CompanyId,
                    reservation.InventoryLocationId,
                    reservation.ProductId,
                    cancellationToken);

                if (balance != null)
                {
                    balance.ReservedQuantity = Math.Max(0m, balance.ReservedQuantity - reservation.ReservedQuantity);
                    balance.LastModifiedAtUtc = DateTime.UtcNow;
                    await _balanceRepository.UpdateAsync(balance, cancellationToken);
                }
            }

            reservation.Status = InventoryReservationStatuses.Cancelled;
            reservation.ReleasedAtUtc = DateTime.UtcNow;
            reservation.LastModifiedAtUtc = DateTime.UtcNow;

            await _reservationRepository.UpdateAsync(reservation, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var dto = new InventoryReservationDto(
                reservation.Id,
                reservation.CompanyId,
                reservation.InventoryLocationId,
                reservation.InventoryLocation?.Name ?? "Location",
                reservation.InventoryLocation?.Code ?? "LOC",
                reservation.ProductId,
                reservation.Product?.Name ?? "Product",
                reservation.Product?.Code ?? "PRD",
                reservation.Product?.Sku,
                reservation.Product?.BaseUom?.Name ?? "unit",
                reservation.ReservedQuantity,
                reservation.Status,
                reservation.SalesOrderId,
                reservation.SalesOrderLineId,
                reservation.ReservedAtUtc,
                reservation.ReleasedAtUtc,
                reservation.ExpiresAtUtc,
                reservation.CreatedAtUtc
            );

            return Result<InventoryReservationDto>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<InventoryReservationDto>.Failure(Error.Failure("Reservation.CancelFailed", $"Failed to cancel reservation: {ex.Message}"));
        }
    }
}
