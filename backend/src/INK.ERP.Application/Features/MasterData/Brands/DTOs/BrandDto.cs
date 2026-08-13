namespace INK.ERP.Application.Features.MasterData.Brands.DTOs;

public record BrandDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    string Code,
    string Name,
    string? ManufacturerName,
    string? OriginCountry,
    bool IsActive,
    DateTime CreatedAtUtc);
