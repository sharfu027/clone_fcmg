using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Xunit.Abstractions;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Transactions.Commands;
using INK.ERP.Application.Features.Inventory.Balances.Commands;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Persistence;
using INK.ERP.IntegrationTests.Infrastructure;

namespace INK.ERP.IntegrationTests;

public class OpeningStockBatchIntegrationTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly ITestOutputHelper _output;

    public OpeningStockBatchIntegrationTests(CustomWebApplicationFactory<Program> factory, ITestOutputHelper output)
    {
        _factory = factory;
        _output = output;
    }

    [Fact]
    public async Task OpeningStock_CompleteBusinessRuleMatrix_PassesAllScenarios()
    {
        var testFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(ICurrentUserService));
                if (descriptor != null) services.Remove(descriptor);
                services.AddScoped<ICurrentUserService, TestCurrentUserService>();
            });
        });

        using var scope = testFactory.Services.CreateScope();
        var mediator = scope.ServiceProvider.GetRequiredService<ISender>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 1. Setup Test Company, Location, and Products
        var companyId = Guid.NewGuid();
        var company = new Company
        {
            Id = companyId,
            LegalName = "Test FMCG Distribution Corp",
            Code = $"COMP-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
            TaxRegistrationNumber = $"GSTIN{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
            IsActive = true
        };
        db.Companies.Add(company);

        var uom = new UnitOfMeasure
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Code = $"PCS-{Guid.NewGuid().ToString("N")[..4].ToUpper()}",
            Name = "Pieces",
            BaseUnitCode = "PCS",
            ConversionFactor = 1m,
            IsActive = true
        };
        db.UnitsOfMeasure.Add(uom);

        var locA = new InventoryLocation
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Code = "LOC-001",
            Name = "Location Alpha",
            LocationType = "Bin",
            IsActive = true
        };
        var locB = new InventoryLocation
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Code = "LOC-002",
            Name = "Location Beta",
            LocationType = "Bin",
            IsActive = true
        };
        db.InventoryLocations.AddRange(locA, locB);

        var category = new Category
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Code = "CAT-001",
            Name = "Pharmaceuticals & Beverages",
            IsActive = true
        };
        db.Categories.Add(category);

        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Code = "BRD-001",
            Name = "Apex Healthcare",
            IsActive = true
        };
        db.Brands.Add(brand);

        var productBatchTracked = new Product
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            CategoryId = category.Id,
            BrandId = brand.Id,
            Code = "PROD-001",
            Name = "Dolo Variations",
            Sku = "SKU-DOLO-01",
            BaseUomId = uom.Id,
            IsBatchTracked = true,
            IsActive = true
        };

        var productNonBatch = new Product
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            CategoryId = category.Id,
            BrandId = brand.Id,
            Code = "PROD-002",
            Name = "Mineral Water 1L",
            Sku = "SKU-WATER-01",
            BaseUomId = uom.Id,
            IsBatchTracked = false,
            IsActive = true
        };

        db.Products.AddRange(productBatchTracked, productNonBatch);
        await db.SaveChangesAsync();

        _output.WriteLine("Setup test entities completed.");

        // =========================================================================
        // SCENARIO 1: First Opening Balance (PROD-001, LOC-001, BATCH-001, Qty 10)
        // =========================================================================
        var cmd1 = new PostInventoryTransactionCommand(
            CompanyId: companyId,
            InventoryLocationId: locA.Id,
            ProductId: productBatchTracked.Id,
            TransactionType: InventoryTransactionTypes.OpeningBalance,
            Quantity: 10m,
            BatchNumber: "BATCH-001",
            ExpiryDate: new DateTime(2027, 12, 31),
            Notes: "First opening entry");

        var res1 = await mediator.Send(cmd1);
        res1.IsSuccess.Should().BeTrue();
        res1.Value.BalanceAfter.Should().Be(10m);
        res1.Value.BatchNumber.Should().Be("BATCH-001");

        // Verify Database State
        var balance1 = await db.InventoryBalances.FirstOrDefaultAsync(b =>
            b.CompanyId == companyId &&
            b.InventoryLocationId == locA.Id &&
            b.ProductId == productBatchTracked.Id &&
            b.BatchNumber == "BATCH-001");

        balance1.Should().NotBeNull();
        balance1!.OnHandQuantity.Should().Be(10m);

        var txns1 = await db.InventoryTransactions.Where(t =>
            t.CompanyId == companyId &&
            t.InventoryLocationId == locA.Id &&
            t.ProductId == productBatchTracked.Id &&
            t.BatchNumber == "BATCH-001").ToListAsync();

        txns1.Should().HaveCount(1);
        _output.WriteLine("Scenario 1 passed: First opening balance created.");

        // =========================================================================
        // SCENARIO 2: Same Product + Same Location + Same Batch (BATCH-001, Qty 15)
        // Must NOT return 409 Conflict; must ADD quantity (10 + 15 = 25).
        // =========================================================================
        var cmd2 = new PostInventoryTransactionCommand(
            CompanyId: companyId,
            InventoryLocationId: locA.Id,
            ProductId: productBatchTracked.Id,
            TransactionType: InventoryTransactionTypes.OpeningBalance,
            Quantity: 15m,
            BatchNumber: "BATCH-001",
            ExpiryDate: new DateTime(2027, 12, 31),
            Notes: "Second opening entry - additive");

        var res2 = await mediator.Send(cmd2);
        res2.IsSuccess.Should().BeTrue();
        res2.Value.BalanceAfter.Should().Be(25m);

        // Verify Database State: Still ONE balance record for BATCH-001 with OnHand = 25
        var balance2 = await db.InventoryBalances.FirstOrDefaultAsync(b =>
            b.CompanyId == companyId &&
            b.InventoryLocationId == locA.Id &&
            b.ProductId == productBatchTracked.Id &&
            b.BatchNumber == "BATCH-001");

        balance2.Should().NotBeNull();
        balance2!.OnHandQuantity.Should().Be(25m);

        var txns2 = await db.InventoryTransactions.Where(t =>
            t.CompanyId == companyId &&
            t.InventoryLocationId == locA.Id &&
            t.ProductId == productBatchTracked.Id &&
            t.BatchNumber == "BATCH-001").ToListAsync();

        txns2.Should().HaveCount(2);
        _output.WriteLine("Scenario 2 passed: Same product and batch updated additively to 25 with 2 ledger transactions.");

        // =========================================================================
        // SCENARIO 3 (MANDATORY SEPARATION TEST):
        // Same Product + Same Location + Different Batch (BATCH-002, Qty 15)
        // Must create a SEPARATE stock balance record.
        // Result: BATCH-001 = 25, BATCH-002 = 15.
        // =========================================================================
        var cmd3 = new PostInventoryTransactionCommand(
            CompanyId: companyId,
            InventoryLocationId: locA.Id,
            ProductId: productBatchTracked.Id,
            TransactionType: InventoryTransactionTypes.OpeningBalance,
            Quantity: 15m,
            BatchNumber: "BATCH-002",
            ExpiryDate: new DateTime(2028, 6, 30),
            Notes: "New separate batch entry");

        var res3 = await mediator.Send(cmd3);
        res3.IsSuccess.Should().BeTrue();
        res3.Value.BalanceAfter.Should().Be(15m);
        res3.Value.BatchNumber.Should().Be("BATCH-002");

        // Verify 2 separate batch records exist at Location A
        var allBalancesLocA = await db.InventoryBalances.Where(b =>
            b.CompanyId == companyId &&
            b.InventoryLocationId == locA.Id &&
            b.ProductId == productBatchTracked.Id).ToListAsync();

        allBalancesLocA.Should().HaveCount(2);

        var batch1Rec = allBalancesLocA.FirstOrDefault(b => b.BatchNumber == "BATCH-001");
        var batch2Rec = allBalancesLocA.FirstOrDefault(b => b.BatchNumber == "BATCH-002");

        batch1Rec.Should().NotBeNull();
        batch1Rec!.OnHandQuantity.Should().Be(25m);

        batch2Rec.Should().NotBeNull();
        batch2Rec!.OnHandQuantity.Should().Be(15m);

        _output.WriteLine("Scenario 3 passed: BATCH-001 (25) and BATCH-002 (15) exist as separate balances.");

        // =========================================================================
        // SCENARIO 4: Same Product + Different Location (LOC-002, BATCH-001, Qty 20)
        // Must create a SEPARATE balance per location.
        // =========================================================================
        var cmd4 = new PostInventoryTransactionCommand(
            CompanyId: companyId,
            InventoryLocationId: locB.Id,
            ProductId: productBatchTracked.Id,
            TransactionType: InventoryTransactionTypes.OpeningBalance,
            Quantity: 20m,
            BatchNumber: "BATCH-001",
            ExpiryDate: new DateTime(2027, 12, 31));

        var res4 = await mediator.Send(cmd4);
        res4.IsSuccess.Should().BeTrue();
        res4.Value.BalanceAfter.Should().Be(20m);

        var balanceLocB = await db.InventoryBalances.FirstOrDefaultAsync(b =>
            b.CompanyId == companyId &&
            b.InventoryLocationId == locB.Id &&
            b.ProductId == productBatchTracked.Id &&
            b.BatchNumber == "BATCH-001");

        balanceLocB.Should().NotBeNull();
        balanceLocB!.OnHandQuantity.Should().Be(20m);
        _output.WriteLine("Scenario 4 passed: Separate balance maintained for different location.");

        // =========================================================================
        // SCENARIO 5: Multiple Additions (+10, +20, +5) on Non-Batch Product
        // =========================================================================
        var cmd5a = new PostInventoryTransactionCommand(companyId, locA.Id, productNonBatch.Id, InventoryTransactionTypes.OpeningBalance, 10m);
        var cmd5b = new PostInventoryTransactionCommand(companyId, locA.Id, productNonBatch.Id, InventoryTransactionTypes.OpeningBalance, 20m);
        var cmd5c = new PostInventoryTransactionCommand(companyId, locA.Id, productNonBatch.Id, InventoryTransactionTypes.OpeningBalance, 5m);

        (await mediator.Send(cmd5a)).IsSuccess.Should().BeTrue();
        (await mediator.Send(cmd5b)).IsSuccess.Should().BeTrue();
        (await mediator.Send(cmd5c)).IsSuccess.Should().BeTrue();

        var nonBatchBalance = await db.InventoryBalances.FirstOrDefaultAsync(b =>
            b.CompanyId == companyId &&
            b.InventoryLocationId == locA.Id &&
            b.ProductId == productNonBatch.Id &&
            b.BatchNumber == null);

        nonBatchBalance.Should().NotBeNull();
        nonBatchBalance!.OnHandQuantity.Should().Be(35m);

        var nonBatchTxns = await db.InventoryTransactions.Where(t =>
            t.CompanyId == companyId &&
            t.InventoryLocationId == locA.Id &&
            t.ProductId == productNonBatch.Id).ToListAsync();

        nonBatchTxns.Should().HaveCount(3);
        _output.WriteLine("Scenario 5 passed: Multiple additions (+10, +20, +5) produced OnHand = 35 with 3 immutable transactions.");

        // =========================================================================
        // SCENARIO 6: Reserved & Allocated Stock Protection
        // If OnHand = 20, Reserved = 5, Allocated = 2, then add +10 -> OnHand = 30, Available = 23.
        // =========================================================================
        nonBatchBalance.OnHandQuantity = 20m;
        nonBatchBalance.ReservedQuantity = 5m;
        nonBatchBalance.AllocatedQuantity = 2m;
        await db.SaveChangesAsync();

        var cmd6 = new PostInventoryTransactionCommand(companyId, locA.Id, productNonBatch.Id, InventoryTransactionTypes.OpeningBalance, 10m);
        var res6 = await mediator.Send(cmd6);
        res6.IsSuccess.Should().BeTrue();

        var refreshedBalance = await db.InventoryBalances.AsNoTracking().FirstOrDefaultAsync(b => b.Id == nonBatchBalance.Id);
        refreshedBalance!.OnHandQuantity.Should().Be(30m);
        refreshedBalance.ReservedQuantity.Should().Be(5m);
        refreshedBalance.AllocatedQuantity.Should().Be(2m);

        decimal available = refreshedBalance.OnHandQuantity - refreshedBalance.ReservedQuantity - refreshedBalance.AllocatedQuantity;
        available.Should().Be(23m);
        _output.WriteLine("Scenario 6 passed: Reserved & allocated quantities protected. Available = 23.");

        // =========================================================================
        // SCENARIO 7: Conflicting Batch Expiry Validation
        // BATCH-001 has Expiry 2027-12-31. Submitting with Expiry 2025-01-01 must fail with validation error.
        // =========================================================================
        var cmd7 = new PostInventoryTransactionCommand(
            CompanyId: companyId,
            InventoryLocationId: locA.Id,
            ProductId: productBatchTracked.Id,
            TransactionType: InventoryTransactionTypes.OpeningBalance,
            Quantity: 5m,
            BatchNumber: "BATCH-001",
            ExpiryDate: new DateTime(2025, 1, 1)); // Conflicting expiry!

        var res7 = await mediator.Send(cmd7);
        res7.IsSuccess.Should().BeFalse();
        res7.Error.Code.Should().Be("InventoryTransaction.ConflictingBatchExpiry");
        _output.WriteLine("Scenario 7 passed: Conflicting batch expiry prevented with business validation error.");

        // =========================================================================
        // SCENARIO 8: Batch Normalization Check (case-insensitivity & whitespace)
        // ' batch-001 ' should match 'BATCH-001'
        // =========================================================================
        var cmd8 = new PostInventoryTransactionCommand(
            CompanyId: companyId,
            InventoryLocationId: locA.Id,
            ProductId: productBatchTracked.Id,
            TransactionType: InventoryTransactionTypes.OpeningBalance,
            Quantity: 5m,
            BatchNumber: " batch-001 ",
            ExpiryDate: new DateTime(2027, 12, 31));

        var res8 = await mediator.Send(cmd8);
        res8.IsSuccess.Should().BeTrue();
        res8.Value.BalanceAfter.Should().Be(30m); // 25 + 5 = 30
        res8.Value.BatchNumber.Should().Be("BATCH-001");
        _output.WriteLine("Scenario 8 passed: Batch normalization (' batch-001 ' -> 'BATCH-001') verified.");
    }
}
