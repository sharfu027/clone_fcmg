using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using MediatR;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Balances.Commands;
using INK.ERP.Application.Features.Inventory.Balances.DTOs;
using INK.ERP.Application.Features.Inventory.Transactions.Commands;
using INK.ERP.Application.Features.Inventory.Transactions.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.UnitTests.Features.Inventory;

public sealed class OpeningStockUnitTests
{
    private readonly Mock<IInventoryTransactionRepository> _transactionRepoMock;
    private readonly Mock<IInventoryBalanceRepository> _balanceRepoMock;
    private readonly Mock<IInventoryLocationRepository> _locationRepoMock;
    private readonly Mock<IProductRepository> _productRepoMock;
    private readonly Mock<ICompanyRepository> _companyRepoMock;
    private readonly Mock<IEmployeeRepository> _employeeRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICompanyAccessResolver> _companyAccessResolverMock;
    private readonly PostInventoryTransactionCommandHandler _handler;

    public OpeningStockUnitTests()
    {
        _transactionRepoMock = new Mock<IInventoryTransactionRepository>();
        _balanceRepoMock = new Mock<IInventoryBalanceRepository>();
        _locationRepoMock = new Mock<IInventoryLocationRepository>();
        _productRepoMock = new Mock<IProductRepository>();
        _companyRepoMock = new Mock<ICompanyRepository>();
        _employeeRepoMock = new Mock<IEmployeeRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _companyAccessResolverMock = new Mock<ICompanyAccessResolver>();

        _handler = new PostInventoryTransactionCommandHandler(
            _transactionRepoMock.Object,
            _balanceRepoMock.Object,
            _locationRepoMock.Object,
            _productRepoMock.Object,
            _companyRepoMock.Object,
            _employeeRepoMock.Object,
            _unitOfWorkMock.Object,
            _companyAccessResolverMock.Object);
    }

    [Fact]
    public async Task PostTransaction_WhenOpeningBalanceOnExistingBalance_AddsQuantityWithoutConflict()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var locationId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        var company = new Company { Id = companyId, LegalName = "Acme Corp" };
        var location = new InventoryLocation { Id = locationId, CompanyId = companyId, Name = "Bin-1", Code = "B1", IsActive = true };
        var uom = new UnitOfMeasure { Id = Guid.NewGuid(), Name = "Units" };
        var product = new Product { Id = productId, CompanyId = companyId, Name = "Paracetamol", Code = "P1", BaseUomId = uom.Id, BaseUom = uom, IsActive = true, IsBatchTracked = false };

        var existingBalance = new InventoryBalance
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            InventoryLocationId = locationId,
            ProductId = productId,
            OnHandQuantity = 10m,
            BatchNumber = null
        };

        _companyAccessResolverMock.Setup(c => c.GetAuthorizedCompanyIdAsync(It.IsAny<CancellationToken>())).ReturnsAsync(companyId);
        _companyRepoMock.Setup(c => c.GetByIdAsync(companyId, It.IsAny<CancellationToken>())).ReturnsAsync(company);
        _locationRepoMock.Setup(l => l.GetByIdAsync(locationId, It.IsAny<CancellationToken>())).ReturnsAsync(location);
        _productRepoMock.Setup(p => p.GetByIdWithDetailsAsync(productId, It.IsAny<CancellationToken>())).ReturnsAsync(product);
        _balanceRepoMock.Setup(b => b.GetByLocationProductAndBatchAsync(companyId, locationId, productId, null, It.IsAny<CancellationToken>())).ReturnsAsync(existingBalance);

        var command = new PostInventoryTransactionCommand(
            CompanyId: companyId,
            InventoryLocationId: locationId,
            ProductId: productId,
            TransactionType: InventoryTransactionTypes.OpeningBalance,
            Quantity: 15m);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.BalanceAfter.Should().Be(25m);
        existingBalance.OnHandQuantity.Should().Be(25m);
        _balanceRepoMock.Verify(b => b.UpdateAsync(existingBalance, It.IsAny<CancellationToken>()), Times.Once);
        _transactionRepoMock.Verify(t => t.AddAsync(It.Is<InventoryTransaction>(tx => tx.Quantity == 15m && tx.BalanceAfter == 25m), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task PostTransaction_WhenDifferentBatchOnSameProduct_CreatesSeparateBatchBalance()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var locationId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        var company = new Company { Id = companyId, LegalName = "Acme Corp" };
        var location = new InventoryLocation { Id = locationId, CompanyId = companyId, Name = "Bin-1", Code = "B1", IsActive = true };
        var uom = new UnitOfMeasure { Id = Guid.NewGuid(), Name = "Units" };
        var product = new Product { Id = productId, CompanyId = companyId, Name = "Paracetamol", Code = "P1", BaseUomId = uom.Id, BaseUom = uom, IsActive = true, IsBatchTracked = true };

        _companyAccessResolverMock.Setup(c => c.GetAuthorizedCompanyIdAsync(It.IsAny<CancellationToken>())).ReturnsAsync(companyId);
        _companyRepoMock.Setup(c => c.GetByIdAsync(companyId, It.IsAny<CancellationToken>())).ReturnsAsync(company);
        _locationRepoMock.Setup(l => l.GetByIdAsync(locationId, It.IsAny<CancellationToken>())).ReturnsAsync(location);
        _productRepoMock.Setup(p => p.GetByIdWithDetailsAsync(productId, It.IsAny<CancellationToken>())).ReturnsAsync(product);
        _balanceRepoMock.Setup(b => b.GetByLocationProductAndBatchAsync(companyId, locationId, productId, "BATCH-002", It.IsAny<CancellationToken>())).ReturnsAsync((InventoryBalance?)null);
        _transactionRepoMock.Setup(t => t.GetByBalanceContextAsync(companyId, locationId, productId, It.IsAny<CancellationToken>())).ReturnsAsync(new List<InventoryTransaction>());

        var command = new PostInventoryTransactionCommand(
            CompanyId: companyId,
            InventoryLocationId: locationId,
            ProductId: productId,
            TransactionType: InventoryTransactionTypes.OpeningBalance,
            Quantity: 15m,
            BatchNumber: " BATCH-002 ");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.BalanceAfter.Should().Be(15m);
        result.Value.BatchNumber.Should().Be("BATCH-002");
        _balanceRepoMock.Verify(b => b.AddAsync(It.Is<InventoryBalance>(bal => bal.BatchNumber == "BATCH-002" && bal.OnHandQuantity == 15m), It.IsAny<CancellationToken>()), Times.Once);
        _transactionRepoMock.Verify(t => t.AddAsync(It.Is<InventoryTransaction>(tx => tx.BatchNumber == "BATCH-002" && tx.BalanceAfter == 15m), It.IsAny<CancellationToken>()), Times.Once);
    }
}
