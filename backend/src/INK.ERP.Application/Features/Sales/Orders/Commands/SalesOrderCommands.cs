using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Sales.Orders.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Sales;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.Application.Features.Sales.Orders.Commands;

// ----------------------------------------------------
// 0. VERIFY FIELD SALES LOCATION & BIOMETRICS COMMAND
// ----------------------------------------------------
public record VerifyFieldSalesOrderLocationCommand(
    Guid CompanyId,
    Guid CustomerId,
    Guid? SalesEmployeeId = null,
    double CaptureLatitude = 0.0,
    double CaptureLongitude = 0.0,
    double? AccuracyMeters = null,
    string? FaceImageBase64 = null,
    bool RequireFaceVerification = false
) : IRequest<Result<VerifyFieldLocationResultDto>>;

public class VerifyFieldSalesOrderLocationCommandHandler : IRequestHandler<VerifyFieldSalesOrderLocationCommand, Result<VerifyFieldLocationResultDto>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ISfaRepository _sfaRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISender _mediator;

    public VerifyFieldSalesOrderLocationCommandHandler(
        ICustomerRepository customerRepository,
        IEmployeeRepository employeeRepository,
        ISfaRepository sfaRepository,
        ICompanyAccessResolver companyAccessResolver,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        ISender mediator)
    {
        _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _sfaRepository = sfaRepository ?? throw new ArgumentNullException(nameof(sfaRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    public async Task<Result<VerifyFieldLocationResultDto>> Handle(VerifyFieldSalesOrderLocationCommand request, CancellationToken cancellationToken)
    {
        if (request.CompanyId == Guid.Empty || request.CustomerId == Guid.Empty)
            return Result<VerifyFieldLocationResultDto>.Failure(Error.Validation("SalesOrder.InvalidRequest", "Company ID and Customer ID are required."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<VerifyFieldLocationResultDto>.Failure(Error.Unauthorized("SalesOrder.Unauthorized", "Unauthorized access to requested company."));

        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null || customer.CompanyId != request.CompanyId)
            return Result<VerifyFieldLocationResultDto>.Failure(Error.NotFound("SalesOrder.CustomerNotFound", "Customer not found or does not belong to specified company."));

        if (!customer.IsActive)
            return Result<VerifyFieldLocationResultDto>.Failure(Error.Validation("SalesOrder.InactiveCustomer", "Customer is inactive."));

        // 1. Resolve & Validate Sales Representative and Assignment
        Guid? resolvedEmployeeId = request.SalesEmployeeId;
        Guid? resolvedUserId = null;

        if (Guid.TryParse(_currentUserService.UserId, out var currentUserId) && currentUserId != Guid.Empty)
        {
            resolvedUserId = currentUserId;
            if (!resolvedEmployeeId.HasValue || resolvedEmployeeId.Value == Guid.Empty)
            {
                var userRepo = _unitOfWork.Repository<ApplicationUser>();
                var currentUser = await userRepo.GetByIdAsync(currentUserId, cancellationToken);
                if (currentUser != null && currentUser.EmployeeId.HasValue)
                {
                    resolvedEmployeeId = currentUser.EmployeeId.Value;
                }
            }
        }

        if (resolvedEmployeeId.HasValue && resolvedEmployeeId.Value != Guid.Empty)
        {
            var assignments = await _sfaRepository.GetCustomerAssignmentsAsync(
                new List<Guid> { request.CompanyId },
                resolvedEmployeeId.Value,
                null,
                cancellationToken);

            var activeAssignments = assignments.Where(a => a.IsActive).ToList();
            if (activeAssignments.Count > 0 && !activeAssignments.Any(a => a.CustomerId == request.CustomerId))
            {
                return Result<VerifyFieldLocationResultDto>.Failure(Error.Validation(
                    "SalesOrder.UnassignedCustomer",
                    $"Store '{customer.TradeName ?? customer.LegalName}' is not assigned to your territory route."));
            }
        }

        // 2. Validate Live Geolocation against Customer/Store Registered GPS (<= 50 meters)
        if (double.IsNaN(request.CaptureLatitude) || double.IsNaN(request.CaptureLongitude) ||
            request.CaptureLatitude < -90.0 || request.CaptureLatitude > 90.0 ||
            request.CaptureLongitude < -180.0 || request.CaptureLongitude > 180.0)
        {
            return Result<VerifyFieldLocationResultDto>.Failure(Error.Validation(
                "SalesOrder.InvalidCoordinates",
                "Latitude must be between -90 and 90, and Longitude must be between -180 and 180."));
        }

        double distanceMeters = 0.0;
        bool isWithinRange = false;

        if (customer.Latitude.HasValue && customer.Longitude.HasValue)
        {
            var repCoord = new GpsCoordinate(request.CaptureLatitude, request.CaptureLongitude);
            var custCoord = new GpsCoordinate(customer.Latitude.Value, customer.Longitude.Value);
            distanceMeters = repCoord.DistanceToMeters(custCoord);

            isWithinRange = distanceMeters <= 50.0;
            if (!isWithinRange)
            {
                return Result<VerifyFieldLocationResultDto>.Failure(Error.Validation(
                    "SalesOrder.GpsOutOfRange",
                    $"Store location check failed. You are {distanceMeters:F1} meters from {customer.TradeName ?? customer.LegalName}. Maximum allowed distance is 50 meters."));
            }
        }
        else
        {
            // Initial coordinate tagging if customer had no GPS
            customer.Latitude = request.CaptureLatitude;
            customer.Longitude = request.CaptureLongitude;
            await _customerRepository.UpdateAsync(customer, cancellationToken);
            distanceMeters = 0.0;
            isWithinRange = true;
        }

        // 3. Biometric Face Verification using the SAME enrolled biometric profile
        bool isFaceVerified = false;
        float? faceSimilarity = null;

        if (!string.IsNullOrWhiteSpace(request.FaceImageBase64))
        {
            byte[] imageBytes = ParseImageData(request.FaceImageBase64);
            if (imageBytes.Length > 0 && resolvedUserId.HasValue)
            {
                var faceCommand = new INK.ERP.Application.Features.Security.Face.VerifyFaceBiometricsCommand(
                    resolvedUserId.Value,
                    imageBytes,
                    null,
                    null,
                    null);

                var faceResult = await _mediator.Send(faceCommand, cancellationToken);
                if (faceResult.IsSuccess && faceResult.Value != null)
                {
                    isFaceVerified = faceResult.Value.Success;
                    faceSimilarity = faceResult.Value.SimilarityScore;

                    if (!isFaceVerified)
                    {
                        return Result<VerifyFieldLocationResultDto>.Failure(Error.Validation(
                            "SalesOrder.FaceMismatch",
                            $"Biometric face verification failed: {faceResult.Value.Message} (Score: {faceResult.Value.SimilarityScore:P0})"));
                    }
                }
                else
                {
                    return Result<VerifyFieldLocationResultDto>.Failure(Error.Validation(
                        "SalesOrder.FaceVerificationError",
                        faceResult.Error.Description ?? "Could not verify biometric face template."));
                }
            }
        }
        else if (request.RequireFaceVerification)
        {
            return Result<VerifyFieldLocationResultDto>.Failure(Error.Validation(
                "SalesOrder.FaceRequired",
                "Facial biometric capture is required to authorize this customer store visit."));
        }

        // 4. Record Verification Audit Trail in SFA Visit
        if (resolvedEmployeeId.HasValue)
        {
            var visit = new INK.ERP.Domain.Entities.SFA.SalesVisit
            {
                Id = Guid.NewGuid(),
                CompanyId = request.CompanyId,
                SalesEmployeeId = resolvedEmployeeId.Value,
                CustomerId = request.CustomerId,
                VisitDateUtc = DateTime.UtcNow.Date,
                CheckInLatitude = request.CaptureLatitude,
                CheckInLongitude = request.CaptureLongitude,
                DistanceToCustomerMeters = distanceMeters,
                IsGpsVerified = isWithinRange,
                IsFaceVerified = isFaceVerified,
                CheckInAtUtc = DateTime.UtcNow,
                Outcome = "StoreVisitVerified",
                Notes = $"Verified at store '{customer.TradeName ?? customer.LegalName}' (Distance: {distanceMeters:F1}m, Face: {(isFaceVerified ? "Matched" : "N/A")})",
                CreatedAtUtc = DateTime.UtcNow
            };

            await _sfaRepository.AddSalesVisitAsync(visit, cancellationToken);
            await _sfaRepository.SaveChangesAsync(cancellationToken);
        }

        var verificationProof = $"FIELD_SECURE:{customer.Id}:{resolvedEmployeeId}:{distanceMeters:F1}m:FACE_{(isFaceVerified ? "VERIFIED" : "NONE")}:{DateTime.UtcNow:O}";
        var message = $"Store visit verified at {customer.TradeName ?? customer.LegalName} ({distanceMeters:F1}m away). Face biometric: {(isFaceVerified ? "Verified ✓" : "N/A")}.";

        var resultDto = new VerifyFieldLocationResultDto(
            Success: isWithinRange && (!request.RequireFaceVerification || isFaceVerified),
            DistanceMeters: distanceMeters,
            IsWithinRange: isWithinRange,
            IsFaceVerified: isFaceVerified,
            FaceSimilarityScore: faceSimilarity,
            Message: message,
            CustomerName: customer.TradeName ?? customer.LegalName,
            VerificationProof: verificationProof,
            VerifiedAtUtc: DateTime.UtcNow
        );

        return Result.Success(resultDto);
    }

    private static byte[] ParseImageData(string base64Payload)
    {
        try
        {
            var data = base64Payload.Contains(',') ? base64Payload.Substring(base64Payload.IndexOf(',') + 1) : base64Payload;
            return Convert.FromBase64String(data);
        }
        catch
        {
            return Array.Empty<byte>();
        }
    }
}


// ----------------------------------------------------
// 1. CREATE SALES ORDER COMMAND
// ----------------------------------------------------
public record CreateSalesOrderCommand(
    Guid CompanyId,
    Guid CustomerId,
    Guid? SalesEmployeeId,
    Guid? InventoryLocationId,
    DateTime? OrderDateUtc,
    string? Notes,
    List<CreateSalesOrderItemRequest> Items,
    double? CaptureLatitude = null,
    double? CaptureLongitude = null,
    double? CaptureAccuracyMeters = null,
    bool IsFaceVerified = false
) : IRequest<Result<SalesOrderDto>>;

public class CreateSalesOrderCommandHandler : IRequestHandler<CreateSalesOrderCommand, Result<SalesOrderDto>>
{
    private readonly ISalesOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly IPricingResolutionService _pricingService;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public CreateSalesOrderCommandHandler(
        ISalesOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IEmployeeRepository employeeRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        IPricingResolutionService pricingService,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _locationRepository = locationRepository ?? throw new ArgumentNullException(nameof(locationRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _pricingService = pricingService ?? throw new ArgumentNullException(nameof(pricingService));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<SalesOrderDto>> Handle(CreateSalesOrderCommand request, CancellationToken cancellationToken)
    {
        if (request.CompanyId == Guid.Empty)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.EmptyCompany", "Company ID is required."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesOrderDto>.Failure(Error.Unauthorized("SalesOrder.Unauthorized", "Unauthorized access to requested company."));

        if (request.Items == null || request.Items.Count == 0)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.EmptyItems", "Order must contain at least one line item."));

        // Validate Customer
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null || customer.CompanyId != request.CompanyId)
            return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.CustomerNotFound", "Customer not found or does not belong to specified company."));
        if (!customer.IsActive)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InactiveCustomer", "Cannot create order for an inactive customer."));

        // Server-Side GPS Rule Enforcement (if GPS coordinates provided during Field Order Capture)
        double? distanceMeters = null;
        bool isGpsVerified = false;
        if (request.CaptureLatitude.HasValue && request.CaptureLongitude.HasValue)
        {
            if (double.IsNaN(request.CaptureLatitude.Value) || double.IsNaN(request.CaptureLongitude.Value) ||
                request.CaptureLatitude.Value < -90.0 || request.CaptureLatitude.Value > 90.0 ||
                request.CaptureLongitude.Value < -180.0 || request.CaptureLongitude.Value > 180.0)
            {
                return Result<SalesOrderDto>.Failure(Error.Validation(
                    "SalesOrder.InvalidCoordinates",
                    "Latitude must be between -90 and 90, and Longitude must be between -180 and 180."));
            }

            if (customer.Latitude.HasValue && customer.Longitude.HasValue)
            {
                var repCoord = new GpsCoordinate(request.CaptureLatitude.Value, request.CaptureLongitude.Value);
                var custCoord = new GpsCoordinate(customer.Latitude.Value, customer.Longitude.Value);
                distanceMeters = repCoord.DistanceToMeters(custCoord);

                if (distanceMeters > 50.0)
                {
                    return Result<SalesOrderDto>.Failure(Error.Validation(
                        "SalesOrder.GpsOutOfRange",
                        $"Field order cannot be confirmed. You are {distanceMeters:F1} meters from the customer location. Maximum allowed distance is 50 meters."));
                }
                isGpsVerified = true;
            }
            else
            {
                // Customer has no prior GPS tagged - tag initial coordinate
                customer.Latitude = request.CaptureLatitude.Value;
                customer.Longitude = request.CaptureLongitude.Value;
                await _customerRepository.UpdateAsync(customer, cancellationToken);
                distanceMeters = 0.0;
                isGpsVerified = true;
            }
        }

        // Validate Sales Employee if specified
        if (request.SalesEmployeeId.HasValue && request.SalesEmployeeId.Value != Guid.Empty)
        {
            var emp = await _employeeRepository.GetByIdAsync(request.SalesEmployeeId.Value, cancellationToken);
            if (emp == null || emp.CompanyId != request.CompanyId)
                return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.EmployeeNotFound", "Sales employee not found or does not belong to specified company."));
            if (!emp.IsActive)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InactiveEmployee", "Assigned sales employee is inactive."));
        }

        // Validate Location if specified
        if (request.InventoryLocationId.HasValue && request.InventoryLocationId.Value != Guid.Empty)
        {
            var loc = await _locationRepository.GetByIdAsync(request.InventoryLocationId.Value, cancellationToken);
            if (loc == null || loc.CompanyId != request.CompanyId)
                return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.LocationNotFound", "Inventory location not found or does not belong to specified company."));
            if (!loc.IsActive)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InactiveLocation", "Cannot assign inactive inventory location."));
        }

        // Validate Products & Quantities + Resolve Authoritative Pricing
        var orderItems = new List<SalesOrderItem>();
        decimal subtotal = 0;
        decimal totalDiscount = 0;
        decimal totalTax = 0;

        foreach (var item in request.Items)
        {
            if (item.Quantity <= 0)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidQuantity", "Quantity must be strictly positive (> 0)."));

            var prod = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken);
            if (prod == null || prod.CompanyId != request.CompanyId)
                return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.ProductNotFound", $"Product {item.ProductId} not found or does not belong to specified company."));
            if (!prod.IsActive)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InactiveProduct", $"Product '{prod.Name}' is inactive."));

            decimal unitPrice = item.UnitPrice ?? 0m;
            if (unitPrice <= 0m)
            {
                var priceResolution = await _pricingService.ResolvePriceAsync(
                    request.CompanyId,
                    request.CustomerId,
                    item.ProductId,
                    request.OrderDateUtc ?? DateTime.UtcNow,
                    cancellationToken);
                unitPrice = priceResolution.ResolvedPrice;
            }

            decimal lineSubtotal = item.Quantity * unitPrice;
            decimal lineDiscount = Math.Max(0m, item.DiscountAmount);
            decimal lineTax = Math.Max(0m, item.TaxAmount);
            decimal lineTotal = Math.Max(0m, lineSubtotal - lineDiscount + lineTax);

            subtotal += lineSubtotal;
            totalDiscount += lineDiscount;
            totalTax += lineTax;

            orderItems.Add(new SalesOrderItem
            {
                Id = Guid.NewGuid(),
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = unitPrice,
                DiscountAmount = lineDiscount,
                TaxAmount = lineTax,
                LineTotal = lineTotal,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        decimal totalAmount = Math.Max(0m, subtotal - totalDiscount + totalTax);
        string orderNumber = await _orderRepository.GetNextOrderNumberAsync(request.CompanyId, cancellationToken);

        var order = new SalesOrder
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            CustomerId = request.CustomerId,
            SalesEmployeeId = request.SalesEmployeeId,
            InventoryLocationId = request.InventoryLocationId,
            OrderNumber = orderNumber,
            OrderStatus = SalesOrderStatuses.Draft,
            OrderDateUtc = request.OrderDateUtc ?? DateTime.UtcNow,
            Subtotal = subtotal,
            DiscountAmount = totalDiscount,
            TaxAmount = totalTax,
            TotalAmount = totalAmount,
            Notes = request.Notes,
            CaptureLatitude = request.CaptureLatitude,
            CaptureLongitude = request.CaptureLongitude,
            CaptureAccuracyMeters = request.CaptureAccuracyMeters,
            DistanceToCustomerMeters = distanceMeters,
            IsGpsVerified = isGpsVerified,
            IsFaceVerified = request.IsFaceVerified,
            VerifiedAtUtc = (isGpsVerified || request.IsFaceVerified) ? DateTime.UtcNow : null,
            CreatedAtUtc = DateTime.UtcNow,
            Items = orderItems
        };

        await _orderRepository.AddAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var detail = await _orderRepository.GetByIdWithDetailsAsync(order.Id, cancellationToken);
        return Result.Success(new SalesOrderDto(
            detail!.Id,
            detail.CompanyId,
            detail.Company?.LegalName ?? "Company",
            detail.CustomerId,
            detail.Customer?.LegalName ?? "Customer",
            detail.Customer?.Code ?? "CUST",
            detail.SalesEmployeeId,
            detail.SalesEmployee != null ? $"{detail.SalesEmployee.FirstName} {detail.SalesEmployee.LastName}".Trim() : null,
            detail.InventoryLocationId,
            detail.InventoryLocation?.Name,
            detail.InventoryLocation?.Code,
            detail.OrderNumber,
            detail.OrderStatus,
            detail.OrderDateUtc,
            detail.Subtotal,
            detail.DiscountAmount,
            detail.TaxAmount,
            detail.TotalAmount,
            detail.Notes,
            detail.CreatedAtUtc,
            detail.LastModifiedAtUtc,
            detail.Items.Select(i => new SalesOrderItemDto(
                i.Id,
                i.SalesOrderId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.Quantity,
                i.UnitPrice,
                i.DiscountAmount,
                i.TaxAmount,
                i.LineTotal
            )).ToList(),
            detail.CaptureLatitude,
            detail.CaptureLongitude,
            detail.CaptureAccuracyMeters,
            detail.DistanceToCustomerMeters,
            detail.IsGpsVerified,
            detail.IsFaceVerified,
            detail.VerifiedAtUtc
        ));
    }
}

// ----------------------------------------------------
// 1.1. UPDATE SALES ORDER COMMAND (Draft only)
// ----------------------------------------------------
public record UpdateSalesOrderCommand(
    Guid Id,
    Guid? SalesEmployeeId,
    Guid? InventoryLocationId,
    DateTime? OrderDateUtc,
    string? Notes,
    List<CreateSalesOrderItemRequest> Items,
    Guid? CompanyId = null
) : IRequest<Result<SalesOrderDto>>;

public class UpdateSalesOrderCommandHandler : IRequestHandler<UpdateSalesOrderCommand, Result<SalesOrderDto>>
{
    private readonly ISalesOrderRepository _orderRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly IPricingResolutionService _pricingService;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateSalesOrderCommandHandler(
        ISalesOrderRepository orderRepository,
        IEmployeeRepository employeeRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        IPricingResolutionService pricingService,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _locationRepository = locationRepository ?? throw new ArgumentNullException(nameof(locationRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _pricingService = pricingService ?? throw new ArgumentNullException(nameof(pricingService));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<SalesOrderDto>> Handle(UpdateSalesOrderCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidId", "Sales order ID is required."));

        var order = await _orderRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (order == null)
            return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.NotFound", "Sales order not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(order.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesOrderDto>.Failure(Error.Unauthorized("SalesOrder.Unauthorized", "Unauthorized access to requested company order."));

        if (order.OrderStatus != SalesOrderStatuses.Draft)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidStatus", $"Only Draft orders can be modified. Current status: '{order.OrderStatus}'."));

        if (request.Items == null || request.Items.Count == 0)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.EmptyItems", "Order must contain at least one line item."));

        if (request.SalesEmployeeId.HasValue && request.SalesEmployeeId.Value != Guid.Empty)
        {
            var emp = await _employeeRepository.GetByIdAsync(request.SalesEmployeeId.Value, cancellationToken);
            if (emp == null || emp.CompanyId != order.CompanyId)
                return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.EmployeeNotFound", "Sales employee not found or does not belong to specified company."));
            if (!emp.IsActive)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InactiveEmployee", "Assigned sales employee is inactive."));
            order.SalesEmployeeId = request.SalesEmployeeId;
        }

        if (request.InventoryLocationId.HasValue && request.InventoryLocationId.Value != Guid.Empty)
        {
            var loc = await _locationRepository.GetByIdAsync(request.InventoryLocationId.Value, cancellationToken);
            if (loc == null || loc.CompanyId != order.CompanyId)
                return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.LocationNotFound", "Inventory location not found or does not belong to specified company."));
            if (!loc.IsActive)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InactiveLocation", "Cannot assign inactive inventory location."));
            order.InventoryLocationId = request.InventoryLocationId;
        }

        // Safely synchronize order items collection
        var requestedProductIds = request.Items.Select(i => i.ProductId).ToHashSet();
        var toRemove = order.Items.Where(i => !requestedProductIds.Contains(i.ProductId)).ToList();
        foreach (var rem in toRemove)
        {
            order.Items.Remove(rem);
        }

        decimal subtotal = 0;
        decimal totalDiscount = 0;
        decimal totalTax = 0;

        foreach (var item in request.Items)
        {
            if (item.Quantity <= 0)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidQuantity", "Quantity must be strictly positive (> 0)."));

            var prod = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken);
            if (prod == null || prod.CompanyId != order.CompanyId)
                return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.ProductNotFound", $"Product {item.ProductId} not found or does not belong to specified company."));
            if (!prod.IsActive)
                return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InactiveProduct", $"Product '{prod.Name}' is inactive."));

            decimal unitPrice = item.UnitPrice ?? 0m;
            if (unitPrice <= 0m)
            {
                var priceResolution = await _pricingService.ResolvePriceAsync(
                    order.CompanyId,
                    order.CustomerId,
                    item.ProductId,
                    request.OrderDateUtc ?? order.OrderDateUtc,
                    cancellationToken);
                unitPrice = priceResolution.ResolvedPrice;
            }

            decimal lineSubtotal = item.Quantity * unitPrice;
            decimal lineDiscount = Math.Max(0m, item.DiscountAmount);
            decimal lineTax = Math.Max(0m, item.TaxAmount);
            decimal lineTotal = Math.Max(0m, lineSubtotal - lineDiscount + lineTax);

            subtotal += lineSubtotal;
            totalDiscount += lineDiscount;
            totalTax += lineTax;

            var existingItem = order.Items.FirstOrDefault(i => i.ProductId == item.ProductId);
            if (existingItem != null)
            {
                existingItem.Quantity = item.Quantity;
                existingItem.UnitPrice = unitPrice;
                existingItem.DiscountAmount = lineDiscount;
                existingItem.TaxAmount = lineTax;
                existingItem.LineTotal = lineTotal;
                existingItem.LastModifiedAtUtc = DateTime.UtcNow;
            }
            else
            {
                order.Items.Add(new SalesOrderItem
                {
                    Id = Guid.NewGuid(),
                    SalesOrderId = order.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = unitPrice,
                    DiscountAmount = lineDiscount,
                    TaxAmount = lineTax,
                    LineTotal = lineTotal,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }

        order.Subtotal = subtotal;
        order.DiscountAmount = totalDiscount;
        order.TaxAmount = totalTax;
        order.TotalAmount = Math.Max(0m, subtotal - totalDiscount + totalTax);
        if (request.OrderDateUtc.HasValue) order.OrderDateUtc = request.OrderDateUtc.Value;
        if (request.Notes != null) order.Notes = request.Notes;
        order.LastModifiedAtUtc = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var detail = await _orderRepository.GetByIdWithDetailsAsync(order.Id, cancellationToken);
        return Result.Success(new SalesOrderDto(
            detail!.Id,
            detail.CompanyId,
            detail.Company?.LegalName ?? "Company",
            detail.CustomerId,
            detail.Customer?.LegalName ?? "Customer",
            detail.Customer?.Code ?? "CUST",
            detail.SalesEmployeeId,
            detail.SalesEmployee != null ? $"{detail.SalesEmployee.FirstName} {detail.SalesEmployee.LastName}".Trim() : null,
            detail.InventoryLocationId,
            detail.InventoryLocation?.Name,
            detail.InventoryLocation?.Code,
            detail.OrderNumber,
            detail.OrderStatus,
            detail.OrderDateUtc,
            detail.Subtotal,
            detail.DiscountAmount,
            detail.TaxAmount,
            detail.TotalAmount,
            detail.Notes,
            detail.CreatedAtUtc,
            detail.LastModifiedAtUtc,
            detail.Items.Select(i => new SalesOrderItemDto(
                i.Id,
                i.SalesOrderId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.Quantity,
                i.UnitPrice,
                i.DiscountAmount,
                i.TaxAmount,
                i.LineTotal
            )).ToList(),
            detail.CaptureLatitude,
            detail.CaptureLongitude,
            detail.CaptureAccuracyMeters,
            detail.DistanceToCustomerMeters,
            detail.IsGpsVerified,
            detail.IsFaceVerified,
            detail.VerifiedAtUtc
        ));
    }
}

// ----------------------------------------------------
// 2. SUBMIT SALES ORDER COMMAND (Availability + Auto-Reservation)
// ----------------------------------------------------
public record SubmitSalesOrderCommand(Guid Id, Guid? CompanyId = null) : IRequest<Result<SalesOrderDto>>;

public class SubmitSalesOrderCommandHandler : IRequestHandler<SubmitSalesOrderCommand, Result<SalesOrderDto>>
{
    private readonly ISalesOrderRepository _orderRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public SubmitSalesOrderCommandHandler(
        ISalesOrderRepository orderRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryReservationRepository reservationRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<SalesOrderDto>> Handle(SubmitSalesOrderCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidId", "Sales order ID is required."));

        var order = await _orderRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (order == null)
            return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.NotFound", "Sales order not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(order.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesOrderDto>.Failure(Error.Unauthorized("SalesOrder.Unauthorized", "Unauthorized access to requested company order."));

        if (order.OrderStatus != SalesOrderStatuses.Draft)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidStatus", $"Only Draft orders can be submitted. Current status: '{order.OrderStatus}'."));

        if (!order.InventoryLocationId.HasValue)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.NoLocation", "Sales order must have an assigned InventoryLocation to perform stock check and reservation."));

        var locationId = order.InventoryLocationId.Value;
        int fullyAvailableCount = 0;
        int partialOrInsufficientCount = 0;

        foreach (var item in order.Items)
        {
            var balance = await _balanceRepository.GetByLocationAndProductAsync(
                order.CompanyId,
                locationId,
                item.ProductId,
                cancellationToken);

            decimal onHand = balance?.OnHandQuantity ?? 0m;
            decimal reserved = balance?.ReservedQuantity ?? 0m;
            decimal allocated = balance?.AllocatedQuantity ?? 0m;
            decimal available = Math.Max(0m, onHand - reserved - allocated);

            if (available >= item.Quantity)
            {
                // Full quantity available -> Reserve full
                decimal qtyToReserve = item.Quantity;
                if (balance == null)
                {
                    // Create balance record if not exists
                    balance = new InventoryBalance
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = order.CompanyId,
                        InventoryLocationId = locationId,
                        ProductId = item.ProductId,
                        OnHandQuantity = 0m,
                        ReservedQuantity = qtyToReserve,
                        AllocatedQuantity = 0m,
                        CreatedAtUtc = DateTime.UtcNow
                    };
                    await _balanceRepository.AddAsync(balance, cancellationToken);
                }
                else
                {
                    balance.ReservedQuantity += qtyToReserve;
                    balance.LastModifiedAtUtc = DateTime.UtcNow;
                    await _balanceRepository.UpdateAsync(balance, cancellationToken);
                }

                var reservation = new InventoryReservation
                {
                    Id = Guid.NewGuid(),
                    CompanyId = order.CompanyId,
                    InventoryLocationId = locationId,
                    ProductId = item.ProductId,
                    SalesOrderId = order.Id,
                    SalesOrderLineId = item.Id,
                    ReservedQuantity = qtyToReserve,
                    Status = InventoryReservationStatuses.Active,
                    ReservedAtUtc = DateTime.UtcNow,
                    CreatedAtUtc = DateTime.UtcNow
                };
                await _reservationRepository.AddAsync(reservation, cancellationToken);

                fullyAvailableCount++;
            }
            else if (available > 0)
            {
                // Partial quantity available -> Reserve available portion
                decimal qtyToReserve = available;
                balance!.ReservedQuantity += qtyToReserve;
                balance.LastModifiedAtUtc = DateTime.UtcNow;
                await _balanceRepository.UpdateAsync(balance, cancellationToken);

                var reservation = new InventoryReservation
                {
                    Id = Guid.NewGuid(),
                    CompanyId = order.CompanyId,
                    InventoryLocationId = locationId,
                    ProductId = item.ProductId,
                    SalesOrderId = order.Id,
                    SalesOrderLineId = item.Id,
                    ReservedQuantity = qtyToReserve,
                    Status = InventoryReservationStatuses.Active,
                    ReservedAtUtc = DateTime.UtcNow,
                    CreatedAtUtc = DateTime.UtcNow
                };
                await _reservationRepository.AddAsync(reservation, cancellationToken);

                partialOrInsufficientCount++;
            }
            else
            {
                // Zero stock -> Cannot reserve
                partialOrInsufficientCount++;
            }
        }

        // Determine final order status based on stock check results
        if (partialOrInsufficientCount == 0)
        {
            order.OrderStatus = SalesOrderStatuses.Reserved;
        }
        else if (fullyAvailableCount > 0)
        {
            order.OrderStatus = SalesOrderStatuses.PartiallyAvailable;
        }
        else
        {
            order.OrderStatus = SalesOrderStatuses.AwaitingTransfer;
        }

        order.LastModifiedAtUtc = DateTime.UtcNow;
        await _orderRepository.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _orderRepository.GetByIdWithDetailsAsync(order.Id, cancellationToken);
        return Result.Success(new SalesOrderDto(
            updated!.Id,
            updated.CompanyId,
            updated.Company?.LegalName ?? "Company",
            updated.CustomerId,
            updated.Customer?.LegalName ?? "Customer",
            updated.Customer?.Code ?? "CUST",
            updated.SalesEmployeeId,
            updated.SalesEmployee != null ? $"{updated.SalesEmployee.FirstName} {updated.SalesEmployee.LastName}".Trim() : null,
            updated.InventoryLocationId,
            updated.InventoryLocation?.Name,
            updated.InventoryLocation?.Code,
            updated.OrderNumber,
            updated.OrderStatus,
            updated.OrderDateUtc,
            updated.Subtotal,
            updated.DiscountAmount,
            updated.TaxAmount,
            updated.TotalAmount,
            updated.Notes,
            updated.CreatedAtUtc,
            updated.LastModifiedAtUtc,
            updated.Items.Select(i => new SalesOrderItemDto(
                i.Id,
                i.SalesOrderId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.Quantity,
                i.UnitPrice,
                i.DiscountAmount,
                i.TaxAmount,
                i.LineTotal
            )).ToList()
        ));
    }
}

// ----------------------------------------------------
// 3. CANCEL SALES ORDER COMMAND (Releases active reservations)
// ----------------------------------------------------
public record CancelSalesOrderCommand(Guid Id, Guid? CompanyId = null) : IRequest<Result<SalesOrderDto>>;

public class CancelSalesOrderCommandHandler : IRequestHandler<CancelSalesOrderCommand, Result<SalesOrderDto>>
{
    private readonly ISalesOrderRepository _orderRepository;
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;
    private readonly IUnitOfWork _unitOfWork;

    public CancelSalesOrderCommandHandler(
        ISalesOrderRepository orderRepository,
        IInventoryBalanceRepository balanceRepository,
        IInventoryReservationRepository reservationRepository,
        ICompanyAccessResolver companyAccessResolver,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<SalesOrderDto>> Handle(CancelSalesOrderCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.InvalidId", "Sales order ID is required."));

        var order = await _orderRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (order == null)
            return Result<SalesOrderDto>.Failure(Error.NotFound("SalesOrder.NotFound", "Sales order not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(order.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<SalesOrderDto>.Failure(Error.Unauthorized("SalesOrder.Unauthorized", "Unauthorized access to requested company order."));

        if (order.OrderStatus == SalesOrderStatuses.Cancelled)
            return Result<SalesOrderDto>.Failure(Error.Validation("SalesOrder.AlreadyCancelled", "Sales order is already cancelled."));

        // Release all active reservations linked to this sales order
        var reservations = await _reservationRepository.ListAsync(
            order.CompanyId,
            salesOrderId: order.Id,
            status: InventoryReservationStatuses.Active,
            cancellationToken: cancellationToken);

        foreach (var resv in reservations)
        {
            var balance = await _balanceRepository.GetByLocationAndProductAsync(
                resv.CompanyId,
                resv.InventoryLocationId,
                resv.ProductId,
                cancellationToken);

            if (balance != null)
            {
                balance.ReservedQuantity = Math.Max(0m, balance.ReservedQuantity - resv.ReservedQuantity);
                balance.LastModifiedAtUtc = DateTime.UtcNow;
                await _balanceRepository.UpdateAsync(balance, cancellationToken);
            }

            resv.Status = InventoryReservationStatuses.Cancelled;
            resv.ReleasedAtUtc = DateTime.UtcNow;
            resv.LastModifiedAtUtc = DateTime.UtcNow;
            await _reservationRepository.UpdateAsync(resv, cancellationToken);
        }

        order.OrderStatus = SalesOrderStatuses.Cancelled;
        order.LastModifiedAtUtc = DateTime.UtcNow;
        await _orderRepository.UpdateAsync(order, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _orderRepository.GetByIdWithDetailsAsync(order.Id, cancellationToken);
        return Result.Success(new SalesOrderDto(
            updated!.Id,
            updated.CompanyId,
            updated.Company?.LegalName ?? "Company",
            updated.CustomerId,
            updated.Customer?.LegalName ?? "Customer",
            updated.Customer?.Code ?? "CUST",
            updated.SalesEmployeeId,
            updated.SalesEmployee != null ? $"{updated.SalesEmployee.FirstName} {updated.SalesEmployee.LastName}".Trim() : null,
            updated.InventoryLocationId,
            updated.InventoryLocation?.Name,
            updated.InventoryLocation?.Code,
            updated.OrderNumber,
            updated.OrderStatus,
            updated.OrderDateUtc,
            updated.Subtotal,
            updated.DiscountAmount,
            updated.TaxAmount,
            updated.TotalAmount,
            updated.Notes,
            updated.CreatedAtUtc,
            updated.LastModifiedAtUtc,
            updated.Items.Select(i => new SalesOrderItemDto(
                i.Id,
                i.SalesOrderId,
                i.ProductId,
                i.Product?.Name ?? "Product",
                i.Product?.Code ?? "PRD",
                i.Product?.Sku,
                i.Product?.BaseUom?.Name ?? "unit",
                i.Quantity,
                i.UnitPrice,
                i.DiscountAmount,
                i.TaxAmount,
                i.LineTotal
            )).ToList()
        ));
    }
}
