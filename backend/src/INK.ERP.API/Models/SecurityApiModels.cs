using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace INK.ERP.API.Models;

public record PaginationParameters
{
    private readonly int _page = 1;
    private readonly int _pageSize = 10;

    [FromQuery(Name = "page")]
    public int Page { get => _page; init => _page = value < 1 ? 1 : value; }

    [FromQuery(Name = "pageSize")]
    public int PageSize { get => _pageSize; init => _pageSize = value > 100 ? 100 : (value < 1 ? 10 : value); }
}

public record SecurityFilterParameters : PaginationParameters
{
    [FromQuery(Name = "status")]
    public string? Status { get; init; }

    [FromQuery(Name = "severity")]
    public string? Severity { get; init; }

    [FromQuery(Name = "startDate")]
    public DateTime? StartDate { get; init; }

    [FromQuery(Name = "endDate")]
    public DateTime? EndDate { get; init; }

    [FromQuery(Name = "search")]
    public string? Search { get; init; }

    [FromQuery(Name = "sort")]
    public string? Sort { get; init; }
}

public sealed record PaginationMetadata(
    int TotalCount,
    int PageSize,
    int CurrentPage,
    int TotalPages);

public record EnrollFaceRequest(
    [FromForm(Name = "userId")] Guid UserId,
    [FromForm(Name = "image")] IFormFile Image,
    [FromForm(Name = "algorithmVersion")] string? AlgorithmVersion = "v1.0");

public record ReplaceFaceTemplateRequest(
    [FromForm(Name = "userId")] Guid UserId,
    [FromForm(Name = "image")] IFormFile Image);
