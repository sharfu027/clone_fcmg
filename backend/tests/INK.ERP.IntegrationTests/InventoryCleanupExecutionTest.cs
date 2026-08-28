using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Xunit.Abstractions;
using FluentAssertions;
using INK.ERP.Persistence;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.Entities.Inventory.Fulfillment;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Sales;

namespace INK.ERP.IntegrationTests;

public sealed class InventoryCleanupExecutionTest : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly ITestOutputHelper _output;

    public InventoryCleanupExecutionTest(WebApplicationFactory<Program> factory, ITestOutputHelper output)
    {
        _factory = factory;
        _output = output;
    }

    [Fact]
    public async Task ExecuteAcidCleanupAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        _output.WriteLine("==================================================================");
        _output.WriteLine("       STARTING ACID INVENTORY PHASE 1/2/3 TEST CLEANUP           ");
        _output.WriteLine("==================================================================");

        // Protected Legitimate Location IDs
        var protectedLocIds = new HashSet<Guid>
        {
            Guid.Parse("a3727068-ff6c-40c8-9b88-b5d609a6ee9c"), // Location "A"
            Guid.Parse("044fec8d-6e44-45d3-88c0-792720450c6f"), // Location "B"
            Guid.Parse("a03f1e5c-6870-4208-8d40-d42fd54dc7cc"), // Location "a"
            Guid.Parse("7be49fa9-43c3-42e7-8b0a-fb9c6da9ecb0"), // Flipkart Central Hub
            Guid.Parse("f3dbb3a3-b4ae-4328-86d7-fc068f300c0f")  // NFB Retail Outlet 1
        };

        // Protected Legitimate Product IDs
        var protectedProdIds = new HashSet<Guid>
        {
            Guid.Parse("f95e0083-da2c-4d2c-8afc-c1bc197820f2"), // Samsung S23
            Guid.Parse("b65cc4c7-e2a6-40e7-95f7-1585110ccb97")  // Real Fresh Apple Juice 200ltr
        };

        // Protected Legitimate Reservation IDs
        var protectedResvIds = new HashSet<Guid>
        {
            Guid.Parse("f7833f15-e2ab-470f-bfa0-c27651a10eef")  // Samsung S23 Reservation
        };

        // Protected Legitimate Transaction IDs
        var protectedTxIds = new HashSet<Guid>
        {
            Guid.Parse("627b00c2-f100-464b-b94e-8300cefac266"), // Samsung S23 OpeningBalance
            Guid.Parse("4da205ff-17df-4c2c-9330-4bb25a3dfdaa")  // Apple Juice OpeningBalance
        };

        // Identify Test Entities
        var testLocations = await db.InventoryLocations
            .Where(l => !protectedLocIds.Contains(l.Id) && (l.Code.StartsWith("LOC-P3-") || l.Code.StartsWith("LOC-TR-") || l.Name.Contains("Phase 3") || l.Name.Contains("Transfer") || l.Name.Contains("Test")))
            .ToListAsync();

        var testProducts = await db.Products
            .Where(p => !protectedProdIds.Contains(p.Id) && (p.Sku.StartsWith("SKU-STD-") || p.Sku.StartsWith("SKU-BT-") || p.Sku.StartsWith("SKU-TR-") || p.Code.StartsWith("PRD-TR-") || p.Name.Contains("Phase3") || p.Name.Contains("Phase 3") || p.Name.Contains("Transfer Receive")))
            .ToListAsync();

        var testProductIds = testProducts.Select(p => p.Id).ToHashSet();
        var testLocationIds = testLocations.Select(l => l.Id).ToHashSet();

        var testTransfers = await db.StockTransfers
            .Where(t => testLocationIds.Contains(t.SourceLocationId) || testLocationIds.Contains(t.DestinationLocationId) || (t.Notes != null && (t.Notes.Contains("test") || t.Notes.Contains("Test"))) || t.TransferNumber.StartsWith("TRF-2026-"))
            .ToListAsync();
        var testTransferIds = testTransfers.Select(t => t.Id).ToHashSet();

        var testSalesOrders = await db.SalesOrders
            .Where(so => so.OrderNumber.StartsWith("SO-2026-") || (so.Notes != null && so.Notes.Contains("Phase 3")))
            .ToListAsync();
        var testSoIds = testSalesOrders.Select(so => so.Id).ToHashSet();

        var testReservations = await db.InventoryReservations
            .Where(r => !protectedResvIds.Contains(r.Id))
            .ToListAsync();

        var testTransactions = await db.InventoryTransactions
            .Where(t => !protectedTxIds.Contains(t.Id) && (testProductIds.Contains(t.ProductId) || testLocationIds.Contains(t.InventoryLocationId) || (t.ReferenceDocumentId.HasValue && testTransferIds.Contains(t.ReferenceDocumentId.Value))))
            .ToListAsync();

        var testBalances = await db.InventoryBalances
            .Where(b => testProductIds.Contains(b.ProductId) || testLocationIds.Contains(b.InventoryLocationId))
            .ToListAsync();

        var testPickTasks = await db.PickTasks.ToListAsync();
        var testPackTasks = await db.PackTasks.ToListAsync();
        var testDispatches = await db.Dispatches.ToListAsync();

        _output.WriteLine($"Targeted for Deletion:");
        _output.WriteLine($"Locations: {testLocations.Count}");
        _output.WriteLine($"Balances: {testBalances.Count}");
        _output.WriteLine($"Transactions: {testTransactions.Count}");
        _output.WriteLine($"Reservations: {testReservations.Count}");
        _output.WriteLine($"Transfers: {testTransfers.Count}");
        _output.WriteLine($"PickTasks: {testPickTasks.Count}");
        _output.WriteLine($"PackTasks: {testPackTasks.Count}");
        _output.WriteLine($"Dispatches: {testDispatches.Count}");
        _output.WriteLine($"SalesOrders: {testSalesOrders.Count}");
        _output.WriteLine($"Products: {testProducts.Count}");

        // Dependency Verification
        foreach (var p in testProducts)
        {
            protectedProdIds.Should().NotContain(p.Id, "Test product must not match protected products");
        }
        foreach (var l in testLocations)
        {
            protectedLocIds.Should().NotContain(l.Id, "Test location must not match protected locations");
        }

        // Execute in ONE ACID Transaction
        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            try
            {
                _output.WriteLine("Step 1: Deleting DispatchLines & Dispatches...");
                var dispatchLines = await db.DispatchLines.ToListAsync();
                db.DispatchLines.RemoveRange(dispatchLines);
                db.Dispatches.RemoveRange(testDispatches);
                await db.SaveChangesAsync();

                _output.WriteLine("Step 2: Deleting PackageItems, Packages & PackTasks...");
                var packageItems = await db.PackageItems.ToListAsync();
                db.PackageItems.RemoveRange(packageItems);
                var packages = await db.Packages.ToListAsync();
                db.Packages.RemoveRange(packages);
                db.PackTasks.RemoveRange(testPackTasks);
                await db.SaveChangesAsync();

                _output.WriteLine("Step 3: Deleting PickTaskLines & PickTasks...");
                var pickLines = await db.PickTaskLines.ToListAsync();
                db.PickTaskLines.RemoveRange(pickLines);
                db.PickTasks.RemoveRange(testPickTasks);
                await db.SaveChangesAsync();

                _output.WriteLine("Step 4: Deleting StockTransferLines & StockTransfers...");
                var trfLines = await db.StockTransferLines
                    .Where(tl => testTransferIds.Contains(tl.StockTransferId))
                    .ToListAsync();
                db.StockTransferLines.RemoveRange(trfLines);
                db.StockTransfers.RemoveRange(testTransfers);
                await db.SaveChangesAsync();

                _output.WriteLine("Step 5: Deleting Test Reservations...");
                db.InventoryReservations.RemoveRange(testReservations);
                await db.SaveChangesAsync();

                _output.WriteLine("Step 6: Deleting Test SalesOrderItems & SalesOrders...");
                var soItems = await db.SalesOrderItems
                    .Where(soi => testSoIds.Contains(soi.SalesOrderId))
                    .ToListAsync();
                db.SalesOrderItems.RemoveRange(soItems);
                db.SalesOrders.RemoveRange(testSalesOrders);
                await db.SaveChangesAsync();

                _output.WriteLine("Step 7: Deleting Test Inventory Transactions...");
                db.InventoryTransactions.RemoveRange(testTransactions);
                await db.SaveChangesAsync();

                _output.WriteLine("Step 8: Deleting Test Inventory Balances & Restoring Legitimate Balances...");
                db.InventoryBalances.RemoveRange(testBalances);
                var samsung = await db.InventoryBalances.FirstOrDefaultAsync(b => b.ProductId == Guid.Parse("f95e0083-da2c-4d2c-8afc-c1bc197820f2"));
                if (samsung != null)
                {
                    var activeSamsungResvs = await db.InventoryReservations
                        .Where(r => r.ProductId == samsung.ProductId && r.InventoryLocationId == samsung.InventoryLocationId && (r.Status == InventoryReservationStatuses.Active || r.Status == InventoryReservationStatuses.Allocated))
                        .SumAsync(r => r.ReservedQuantity);

                    samsung.OnHandQuantity = 10m;
                    samsung.ReservedQuantity = activeSamsungResvs;
                    samsung.AllocatedQuantity = 0m;
                }
                await db.SaveChangesAsync();

                _output.WriteLine("Step 9: Deleting Test Inventory Locations...");
                db.InventoryLocations.RemoveRange(testLocations);
                await db.SaveChangesAsync();

                _output.WriteLine("Step 10: Deleting Test Products...");
                db.Products.RemoveRange(testProducts);
                await db.SaveChangesAsync();

                // Commit ACID Transaction
                await tx.CommitAsync();
                _output.WriteLine("✅ TRANSACTION COMMITTED SUCCESSFULLY!");
            }
            catch (Exception ex)
            {
                _output.WriteLine($"❌ ERROR OCCURRED, ROLLING BACK: {ex.Message}");
                await tx.RollbackAsync();
                throw;
            }
        });

        // POST-CLEANUP INTEGRITY CHECKS
        _output.WriteLine("\n=== POST-CLEANUP INTEGRITY VERIFICATION ===");
        var finalLocCount = await db.InventoryLocations.CountAsync();
        var finalBalCount = await db.InventoryBalances.CountAsync();
        var finalTxCount = await db.InventoryTransactions.CountAsync();
        var finalResvCount = await db.InventoryReservations.CountAsync();
        var finalTrfCount = await db.StockTransfers.CountAsync();
        var finalPickCount = await db.PickTasks.CountAsync();
        var finalPackCount = await db.PackTasks.CountAsync();
        var finalDispatchCount = await db.Dispatches.CountAsync();
        var finalSoCount = await db.SalesOrders.CountAsync();

        _output.WriteLine($"[POST-CLEANUP] Locations: {finalLocCount} (Expected: 5)");
        _output.WriteLine($"[POST-CLEANUP] Balances: {finalBalCount} (Expected: 2)");
        _output.WriteLine($"[POST-CLEANUP] Transactions: {finalTxCount} (Expected: 2)");
        _output.WriteLine($"[POST-CLEANUP] Reservations: {finalResvCount} (Expected: 1)");
        _output.WriteLine($"[POST-CLEANUP] Transfers: {finalTrfCount} (Expected: 0)");
        _output.WriteLine($"[POST-CLEANUP] Picks: {finalPickCount} (Expected: 0)");
        _output.WriteLine($"[POST-CLEANUP] Packs: {finalPackCount} (Expected: 0)");
        _output.WriteLine($"[POST-CLEANUP] Dispatches: {finalDispatchCount} (Expected: 0)");
        _output.WriteLine($"[POST-CLEANUP] SalesOrders: {finalSoCount} (Expected: 0)");

        finalLocCount.Should().Be(5);
        finalBalCount.Should().Be(2);
        finalTxCount.Should().Be(2);
        finalResvCount.Should().Be(1);
        finalTrfCount.Should().Be(0);
        finalPickCount.Should().Be(0);
        finalPackCount.Should().Be(0);
        finalDispatchCount.Should().Be(0);

        var samsungBal = await db.InventoryBalances
            .FirstOrDefaultAsync(b => b.ProductId == Guid.Parse("f95e0083-da2c-4d2c-8afc-c1bc197820f2"));
        samsungBal.Should().NotBeNull();
        samsungBal!.OnHandQuantity.Should().Be(10);
        var expectedSamsungResvs = await db.InventoryReservations
            .Where(r => r.ProductId == samsungBal.ProductId && r.InventoryLocationId == samsungBal.InventoryLocationId && (r.Status == InventoryReservationStatuses.Active || r.Status == InventoryReservationStatuses.Allocated))
            .SumAsync(r => r.ReservedQuantity);
        samsungBal.ReservedQuantity.Should().Be(expectedSamsungResvs);
        samsungBal.AllocatedQuantity.Should().Be(0);
        (samsungBal.OnHandQuantity - samsungBal.ReservedQuantity - samsungBal.AllocatedQuantity).Should().Be(10m - expectedSamsungResvs);

        var juiceBal = await db.InventoryBalances
            .FirstOrDefaultAsync(b => b.ProductId == Guid.Parse("b65cc4c7-e2a6-40e7-95f7-1585110ccb97"));
        juiceBal.Should().NotBeNull();
        juiceBal!.OnHandQuantity.Should().Be(10.0001m);
        juiceBal.ReservedQuantity.Should().Be(0);
        juiceBal.AllocatedQuantity.Should().Be(0);
        (juiceBal.OnHandQuantity - juiceBal.ReservedQuantity - juiceBal.AllocatedQuantity).Should().Be(10.0001m);

        _output.WriteLine("✅ ALL POST-CLEANUP AUDIT VERIFICATIONS PASSED!");
    }
}
