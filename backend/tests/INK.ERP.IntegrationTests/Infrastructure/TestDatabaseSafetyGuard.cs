using System;
using System.Collections.Generic;
using System.Linq;
using Npgsql;

namespace INK.ERP.IntegrationTests.Infrastructure;

/// <summary>
/// Mandatory Multi-Layer Database Safety Guard.
/// Strictly enforces that automated tests can ONLY connect to explicitly approved test databases.
/// </summary>
public static class TestDatabaseSafetyGuard
{
    public const string ApprovedTestDatabaseName = "ink_fmcg_erp_test";
    public const string ApprovedEnvironmentName = "Testing";

    private static readonly HashSet<string> ExplicitAllowlist = new(StringComparer.OrdinalIgnoreCase)
    {
        ApprovedTestDatabaseName
    };

    private static readonly HashSet<string> ExplicitBlockedList = new(StringComparer.OrdinalIgnoreCase)
    {
        "ink_fmcg_erp",
        "postgres",
        "template0",
        "template1",
        "production",
        "development"
    };

    /// <summary>
    /// Validates the database connection string and environment name before any test execution or write operation.
    /// Throws InvalidOperationException if the target database is not explicitly allowed.
    /// </summary>
    public static void AssertDatabaseIsSafe(string? connectionString, string? environment = ApprovedEnvironmentName)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "[DATABASE SAFETY GUARD TRIGGERED]: Connection string is null or empty. Automated tests cannot proceed.");
        }

        // Layer 1: Validate Environment
        if (!string.Equals(environment, ApprovedEnvironmentName, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"[DATABASE SAFETY GUARD TRIGGERED]: Tests are running with environment '{environment}'. Automated tests MUST run with environment '{ApprovedEnvironmentName}'.");
        }

        var builder = new NpgsqlConnectionStringBuilder(connectionString);
        string dbName = builder.Database?.Trim() ?? string.Empty;

        // Layer 2: Explicit Blocked List Validation
        if (ExplicitBlockedList.Contains(dbName) || string.Equals(dbName, "ink_fmcg_erp", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"[CRITICAL DATABASE SAFETY GUARD TRIGGERED]: Automated tests attempted to execute against FORBIDDEN database '{dbName}'. Execution blocked immediately to protect development/production data.");
        }

        // Layer 3: Explicit Allowlist Validation
        if (!ExplicitAllowlist.Contains(dbName))
        {
            throw new InvalidOperationException(
                $"[CRITICAL DATABASE SAFETY GUARD TRIGGERED]: Database '{dbName}' is not in the explicit test allowlist ('{ApprovedTestDatabaseName}'). Execution blocked immediately.");
        }
    }
}
