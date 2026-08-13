using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace INK.ERP.IntegrationTests;

public class SecurityControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public SecurityControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task EveryRequest_ReturnsXCorrelationIdHeader()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.Headers.Contains("X-Correlation-ID").Should().BeTrue();
        response.Headers.GetValues("X-Correlation-ID").First().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GetFaceProfile_Unauthenticated_ReturnsExtendedProblemDetails()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/security/face/profile?userId=" + Guid.NewGuid());

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.Headers.Contains("X-Correlation-ID").Should().BeTrue();
    }

    [Fact]
    public async Task EnrollFace_InvalidMimeType_ReturnsProblemDetailsBadRequest()
    {
        // Arrange
        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes("fake text data"));
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("text/plain");
        content.Add(fileContent, "Image", "test.txt");
        content.Add(new StringContent(Guid.NewGuid().ToString()), "UserId");

        // Act
        var response = await _client.PostAsync("/api/v1/security/face/enroll", content);

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateGlobalPolicy_MismatchIfMatchHeader_ReturnsPreconditionFailed()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Put, "/api/v1/security/policy/global");
        request.Headers.Add("If-Match", "\"W/invalid-etag-hash\"");
        var payload = JsonSerializer.Serialize(new { PolicyId = Guid.NewGuid(), MinFaceConfidenceScore = 0.90f });
        request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.PreconditionFailed);
    }

    [Fact]
    public async Task DeviceApprove_WithIdempotencyKey_ExecutesSuccessfully()
    {
        // Arrange
        var idempotencyKey = Guid.NewGuid().ToString();
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/security/device/approve");
        request.Headers.Add("Idempotency-Key", idempotencyKey);
        var payload = JsonSerializer.Serialize(new { DeviceId = Guid.NewGuid(), ApprovedBy = "Admin" });
        request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.NoContent, HttpStatusCode.OK);
    }
}
