namespace INK.ERP.Application.Features.MasterData.Designations.DTOs;

public record DesignationDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    string Code,
    string Title,
    int Level,
    decimal? ApprovalLimit,
    bool IsActive,
    DateTime CreatedAtUtc);
