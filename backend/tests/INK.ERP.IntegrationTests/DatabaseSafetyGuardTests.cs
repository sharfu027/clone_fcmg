using System;
using FluentAssertions;
using INK.ERP.IntegrationTests.Infrastructure;
using Xunit;

namespace INK.ERP.IntegrationTests;

public class DatabaseSafetyGuardTests
{
    [Fact]
    public void Guard_WhenPointingToApprovedTestDatabase_ShouldPass()
    {
        // Arrange
        string validConnectionString = "Host=localhost;Port=5432;Database=ink_fmcg_erp_test;Username=postgres;Password=postgres";
        string environment = "Testing";

        // Act & Assert
        var act = () => TestDatabaseSafetyGuard.AssertDatabaseIsSafe(validConnectionString, environment);
        act.Should().NotThrow();
    }

    [Fact]
    public void Guard_WhenPointingToMainDevelopmentDatabase_MustThrowAndBlockExecution()
    {
        // Arrange
        string mainDbConnectionString = "Host=localhost;Port=5432;Database=ink_fmcg_erp;Username=postgres;Password=postgres";
        string environment = "Testing";

        // Act & Assert
        var act = () => TestDatabaseSafetyGuard.AssertDatabaseIsSafe(mainDbConnectionString, environment);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*CRITICAL DATABASE SAFETY GUARD TRIGGERED*FORBIDDEN database*ink_fmcg_erp*");
    }

    [Fact]
    public void Guard_WhenPointingToPostgresSystemDatabase_MustThrowAndBlockExecution()
    {
        // Arrange
        string postgresConnectionString = "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres";
        string environment = "Testing";

        // Act & Assert
        var act = () => TestDatabaseSafetyGuard.AssertDatabaseIsSafe(postgresConnectionString, environment);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*CRITICAL DATABASE SAFETY GUARD TRIGGERED*FORBIDDEN database*postgres*");
    }

    [Fact]
    public void Guard_WhenPointingToUnapprovedRandomDatabase_MustThrowAndBlockExecution()
    {
        // Arrange
        string randomDbConnectionString = "Host=localhost;Port=5432;Database=some_other_db;Username=postgres;Password=postgres";
        string environment = "Testing";

        // Act & Assert
        var act = () => TestDatabaseSafetyGuard.AssertDatabaseIsSafe(randomDbConnectionString, environment);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*CRITICAL DATABASE SAFETY GUARD TRIGGERED*not in the explicit test allowlist*");
    }

    [Fact]
    public void Guard_WhenEnvironmentIsNotTesting_MustThrowAndBlockExecution()
    {
        // Arrange
        string validConnectionString = "Host=localhost;Port=5432;Database=ink_fmcg_erp_test;Username=postgres;Password=postgres";
        string nonTestEnvironment = "Development";

        // Act & Assert
        var act = () => TestDatabaseSafetyGuard.AssertDatabaseIsSafe(validConnectionString, nonTestEnvironment);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*DATABASE SAFETY GUARD TRIGGERED*MUST run with environment 'Testing'*");
    }
}
