using System;
using INK.ERP.Domain.Entities;
using INK.ERP.Domain.Entities.Inventory;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.IntegrationTests.Infrastructure;

/// <summary>
/// Centralized Test Entity Factory / Builder for integration test fixtures.
/// Produces minimal, consistent, isolated test entities.
/// </summary>
public static class TestEntityFactory
{
    public static Company CreateCompany(string code, string name)
    {
        return new Company
        {
            Id = Guid.NewGuid(),
            Code = code,
            LegalName = name,
            TradeName = name,
            TaxRegistrationNumber = $"GST_{code.Substring(0, Math.Min(code.Length, 10))}",
            PanNumber = $"PAN_{code.Substring(0, Math.Min(code.Length, 6))}",
            Address = new Address
            {
                AddressLine1 = "Test Address",
                City = "Mumbai",
                State = "MH",
                Country = "India",
                PostalCode = "400001"
            },
            IsActive = true
        };
    }

    public static Branch CreateBranch(Guid companyId, string code, string name)
    {
        return new Branch
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Code = code,
            Name = name,
            Address = new Address
            {
                AddressLine1 = "Test Branch Address",
                City = "Mumbai",
                State = "MH",
                Country = "India",
                PostalCode = "400001"
            },
            IsActive = true
        };
    }

    public static Warehouse CreateWarehouse(Guid companyId, Guid branchId, string code, string name)
    {
        return new Warehouse
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            BranchId = branchId,
            Code = code,
            Name = name,
            IsActive = true
        };
    }

    public static InventoryLocation CreateLocation(Guid companyId, Guid? warehouseId, Guid? branchId, Guid? departmentId, string code, string name)
    {
        return new InventoryLocation
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            WarehouseId = warehouseId,
            BranchId = branchId,
            DepartmentId = departmentId,
            Code = code,
            Name = name,
            IsActive = true
        };
    }

    public static Category CreateCategory(Guid companyId, string code, string name)
    {
        return new Category
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Code = code,
            Name = name,
            IsActive = true
        };
    }

    public static Brand CreateBrand(Guid companyId, string code, string name)
    {
        return new Brand
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Code = code,
            Name = name,
            IsActive = true
        };
    }

    public static UnitOfMeasure CreateUnitOfMeasure(Guid companyId, string code, string name, string baseUnitCode = "PCS")
    {
        return new UnitOfMeasure
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Code = code,
            Name = name,
            BaseUnitCode = baseUnitCode,
            IsActive = true
        };
    }

    public static Product CreateProduct(Guid companyId, Guid categoryId, Guid brandId, Guid baseUomId, string code, string name, decimal basePrice = 100m)
    {
        return new Product
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            CategoryId = categoryId,
            BrandId = brandId,
            Code = code,
            Name = name,
            Sku = $"SKU_{code}",
            BasePrice = basePrice,
            BaseUomId = baseUomId,
            IsActive = true
        };
    }

    public static Employee CreateEmployee(Guid companyId, Guid? branchId, Guid departmentId, Guid designationId, string code, string firstName, string lastName, string email)
    {
        return new Employee
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            BranchId = branchId,
            DepartmentId = departmentId,
            DesignationId = designationId,
            EmployeeCode = code,
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            IsActive = true
        };
    }
}
