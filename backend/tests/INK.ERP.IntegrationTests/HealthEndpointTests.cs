using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using FluentAssertions;
using Xunit;

using INK.ERP.IntegrationTests.Infrastructure;

namespace INK.ERP.IntegrationTests;

public sealed class HealthEndpointTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(CustomWebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthCheck_ShouldReturnOk_AndHealthyStatus()
    {
        // Act
        var response = await _client.GetAsync("/health/live");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Be("Healthy");
    }
}
