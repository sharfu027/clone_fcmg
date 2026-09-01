using System;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace INK.ERP.IntegrationTests.Infrastructure;

public class CustomWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((context, config) =>
        {
            // Ensure appsettings.Testing.json is loaded
            config.AddJsonFile("appsettings.Testing.json", optional: false, reloadOnChange: false);
            config.AddEnvironmentVariables();
        });

        builder.ConfigureServices((context, services) =>
        {
            var config = context.Configuration;
            string? connectionString = config.GetConnectionString("Database")
                ?? config["Database:ConnectionString"];
            string environment = context.HostingEnvironment.EnvironmentName;

            // Enforce Safety Guard at the host configuration layer
            TestDatabaseSafetyGuard.AssertDatabaseIsSafe(connectionString, environment);
        });
    }
}
