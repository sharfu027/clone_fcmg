using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using INK.ERP.Domain.Common;
using INK.ERP.Infrastructure.Persistence.Seeding;
using INK.ERP.Persistence;

namespace INK.ERP.IntegrationTests.Infrastructure;

/// <summary>
/// Coordinated, thread-safe test database fixture.
/// Initializes the dedicated test database ('ink_fmcg_erp_test') exactly once per test run.
/// </summary>
public static class TestDatabaseFixture
{
    private static readonly SemaphoreSlim InitLock = new(1, 1);
    private static bool _isInitialized = false;

    public static async Task EnsureDatabaseInitializedAsync(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        if (_isInitialized) return;

        await InitLock.WaitAsync();
        try
        {
            if (_isInitialized) return;

            string? connectionString = configuration.GetConnectionString("Database")
                ?? configuration["Database:ConnectionString"];
            string environment = configuration["Application:EnvironmentName"] ?? "Testing";

            // Enforce Multi-Layer Database Safety Guard
            TestDatabaseSafetyGuard.AssertDatabaseIsSafe(connectionString, environment);

            var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

            // 1. Ensure Migrations applied to ink_fmcg_erp_test
            await db.Database.MigrateAsync();

            // 2. Ensure Baseline IAM & Master Data seeds applied to ink_fmcg_erp_test
            await IamDbSeeder.SeedAsync(db, userManager, roleManager, logger);

            _isInitialized = true;
        }
        finally
        {
            InitLock.Release();
        }
    }
}
