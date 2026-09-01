using System;
using System.Collections.Generic;

namespace INK.ERP.Application.Features.Sales.Invoices.DTOs;

public record SalesInvoiceItemDto(
    Guid Id,
    Guid SalesInvoiceId,
    Guid ProductId,
    string ProductName,
    string ProductCode,
    string? Sku,
    string? UnitOfMeasure,
    decimal Quantity,
    decimal UnitPrice,
    decimal DiscountAmount,
    decimal TaxAmount,
    decimal LineTotal,
    string? BatchNumber
);

public record InvoicePaymentDto(
    Guid Id,
    Guid SalesInvoiceId,
    string PaymentNumber,
    DateTime PaymentDateUtc,
    decimal Amount,
    string PaymentMode,
    string? ReferenceNumber,
    string? Notes,
    Guid? ReceivedByEmployeeId,
    string? ReceivedByEmployeeName
);

public record SalesInvoiceDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    Guid CustomerId,
    string CustomerName,
    string CustomerCode,
    Guid SalesOrderId,
    string SalesOrderNumber,
    Guid? DispatchId,
    string InvoiceNumber,
    string Status,
    DateTime InvoiceDateUtc,
    DateTime DueDateUtc,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal TaxAmount,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal OutstandingAmount,
    string PaymentStatus,
    string? PaymentTerms,
    string? Notes,
    string EInvoiceStatus,
    string? Irn,
    string? AckNo,
    DateTime? AckDateUtc,
    string? QrCodeData,
    string? SignedInvoiceData,
    string? EInvoiceFailureReason,
    DateTime CreatedAtUtc,
    DateTime? LastModifiedAtUtc,
    List<SalesInvoiceItemDto> Items,
    List<InvoicePaymentDto> Payments
);

public record CreateSalesInvoiceCommand(
    Guid SalesOrderId,
    DateTime? InvoiceDateUtc = null,
    DateTime? DueDateUtc = null,
    string? PaymentTerms = null,
    string? Notes = null
);

public record RecordInvoicePaymentRequest(
    decimal Amount,
    string PaymentMode = "Cash",
    string? ReferenceNumber = null,
    string? Notes = null,
    Guid? ReceivedByEmployeeId = null
);

public record EInvoiceResultDto(
    bool Success,
    string Message,
    string? Irn,
    string? AckNo,
    DateTime? AckDateUtc,
    string? QrCodeData
);
