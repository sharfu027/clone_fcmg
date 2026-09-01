using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Xunit.Abstractions;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Persistence;
using INK.ERP.IntegrationTests.Infrastructure;

namespace INK.ERP.IntegrationTests;

public class DesignationDeletionIntegrationTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly ITestOutputHelper _output;

    public DesignationDeletionIntegrationTests(CustomWebApplicationFactory<Program> factory, ITestOutputHelper output)
    {
        _factory = factory;
        _output = output;
    }

    [Fact]
    public async Task DeleteDesignation_WhenUnused_SucceedsWith204()
    {
        // Ensure isolation to test DB
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        TestDatabaseSafetyGuard.AssertDatabaseIsSafe(db.Database.GetDbConnection().ConnectionString);

        var adminUser = await db.Users.FirstOrDefaultAsync(u => u.UserName == "superadmin")
            ?? await db.Users.FirstOrDefaultAsync();

        var tokenService = scope.ServiceProvider.GetRequiredService<INK.ERP.Application.Common.Interfaces.ITokenService>();
        var token = tokenService.GenerateJwtToken(
            adminUser!,
            new[] { "Super Administrator" },
            new[] { "manage:all", "IAM.Users.Delete", "masters:designation" });

        // 1. Create a company & an unused designation in test db
        var suffix = Guid.NewGuid().ToString("N")[..6];
        var company = TestEntityFactory.CreateCompany($"C_{suffix}", $"Test Company {suffix}");
        db.Companies.Add(company);

        var designation = new Designation
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Code = $"DSG_{suffix[..4]}",
            Title = "Unused Test Designation",
            Level = 1,
            IsActive = true
        };
        db.Designations.Add(designation);
        await db.SaveChangesAsync();

        try
        {
            // 2. Call DELETE endpoint
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            var response = await client.DeleteAsync($"/api/v1/masters/designation/{designation.Id}");

            // 3. Assert 204 No Content
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);

            // 4. Verify record deleted from database
            using var verifyScope = _factory.Services.CreateScope();
            var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var exists = await verifyDb.Designations.AnyAsync(d => d.Id == designation.Id);
            exists.Should().BeFalse();
        }
        finally
        {
            // Cleanup
            using var cleanScope = _factory.Services.CreateScope();
            var cleanDb = cleanScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var d = await cleanDb.Designations.FindAsync(designation.Id);
            if (d != null) cleanDb.Designations.Remove(d);
            var c = await cleanDb.Companies.FindAsync(company.Id);
            if (c != null) cleanDb.Companies.Remove(c);
            await cleanDb.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task DeleteDesignation_WhenAssignedToEmployee_Returns409ConflictWithMeaningfulMessage()
    {
        // Ensure isolation to test DB
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        TestDatabaseSafetyGuard.AssertDatabaseIsSafe(db.Database.GetDbConnection().ConnectionString);

        var adminUser = await db.Users.FirstOrDefaultAsync(u => u.UserName == "superadmin")
            ?? await db.Users.FirstOrDefaultAsync();

        var tokenService = scope.ServiceProvider.GetRequiredService<INK.ERP.Application.Common.Interfaces.ITokenService>();
        var token = tokenService.GenerateJwtToken(
            adminUser!,
            new[] { "Super Administrator" },
            new[] { "manage:all", "IAM.Users.Delete", "masters:designation" });

        // 1. Create company, department, designation, branch, employee
        var suffix = Guid.NewGuid().ToString("N")[..6];
        var company = TestEntityFactory.CreateCompany($"C_{suffix}", $"Test Company {suffix}");
        db.Companies.Add(company);

        var department = new Department
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Code = $"DPT_{suffix[..4]}",
            Name = "Sales Department",
            IsActive = true
        };
        db.Departments.Add(department);

        var designation = new Designation
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Code = $"DSG_{suffix[..4]}",
            Title = "Active Manager",
            Level = 2,
            IsActive = true
        };
        db.Designations.Add(designation);

        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            DepartmentId = department.Id,
            DesignationId = designation.Id,
            EmployeeCode = $"EMP_{suffix[..4]}",
            FirstName = "Test",
            LastName = "User",
            Email = $"test-{suffix}@test.com",
            Phone = "9999988888",
            IsActive = true
        };
        db.Employees.Add(employee);
        await db.SaveChangesAsync();

        try
        {
            // 2. Call DELETE endpoint
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            var response = await client.DeleteAsync($"/api/v1/masters/designation/{designation.Id}");

            // 3. Assert 409 Conflict
            response.StatusCode.Should().Be(HttpStatusCode.Conflict);

            var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
            problem.Should().NotBeNull();
            problem!.Detail.Should().Contain("Cannot delete designation 'Active Manager'");
            problem.Detail.Should().Contain("assigned to 1 employee");

            // 4. Verify designation and employee still exist
            using var verifyScope = _factory.Services.CreateScope();
            var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var dExists = await verifyDb.Designations.AnyAsync(d => d.Id == designation.Id);
            var eExists = await verifyDb.Employees.AnyAsync(e => e.Id == employee.Id);
            dExists.Should().BeTrue();
            eExists.Should().BeTrue();
        }
        finally
        {
            // Cleanup
            using var cleanScope = _factory.Services.CreateScope();
            var cleanDb = cleanScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var e = await cleanDb.Employees.FindAsync(employee.Id);
            if (e != null) cleanDb.Employees.Remove(e);
            var dept = await cleanDb.Departments.FindAsync(department.Id);
            if (dept != null) cleanDb.Departments.Remove(dept);
            var d = await cleanDb.Designations.FindAsync(designation.Id);
            if (d != null) cleanDb.Designations.Remove(d);
            var c = await cleanDb.Companies.FindAsync(company.Id);
            if (c != null) cleanDb.Companies.Remove(c);
            await cleanDb.SaveChangesAsync();
        }
    }
}
