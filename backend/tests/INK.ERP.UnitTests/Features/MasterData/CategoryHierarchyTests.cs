using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using MediatR;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Categories.Commands;
using INK.ERP.Application.Features.MasterData.Categories.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.UnitTests.Features.MasterData;

public sealed class CategoryHierarchyTests
{
    private readonly Mock<ICategoryRepository> _categoryRepoMock;
    private readonly Mock<ICompanyRepository> _companyRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICompanyAccessResolver> _companyAccessResolverMock;
    private readonly CreateCategoryCommandHandler _createHandler;
    private readonly UpdateCategoryCommandHandler _updateHandler;

    public CategoryHierarchyTests()
    {
        _categoryRepoMock = new Mock<ICategoryRepository>();
        _companyRepoMock = new Mock<ICompanyRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _companyAccessResolverMock = new Mock<ICompanyAccessResolver>();

        _createHandler = new CreateCategoryCommandHandler(
            _categoryRepoMock.Object,
            _companyRepoMock.Object,
            _unitOfWorkMock.Object,
            _companyAccessResolverMock.Object);

        _updateHandler = new UpdateCategoryCommandHandler(
            _categoryRepoMock.Object,
            _companyRepoMock.Object,
            _unitOfWorkMock.Object,
            _companyAccessResolverMock.Object);
    }

    [Fact]
    public async Task CreateCategory_WhenParentIsNull_CreatesRootCategory()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var company = new Company { Id = companyId, LegalName = "Acme Corp" };
        _companyAccessResolverMock.Setup(c => c.GetAuthorizedCompanyIdAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(companyId);
        _companyRepoMock.Setup(r => r.GetByIdAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(company);
        _categoryRepoMock.Setup(r => r.IsCodeUniqueAsync(companyId, "CAT-001", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var command = new CreateCategoryCommand(
            CompanyId: companyId,
            Code: "CAT-001",
            Name: "Electronics",
            ParentCategoryId: null,
            GstTaxRatePercent: 18m,
            HsnCodeDefault: "8517");

        // Act
        var result = await _createHandler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.ParentCategoryId.Should().BeNull();
        result.Value.ParentCategoryName.Should().BeNull();
        result.Value.Code.Should().Be("CAT-001");
        result.Value.Name.Should().Be("Electronics");
        _categoryRepoMock.Verify(r => r.AddAsync(It.Is<Category>(c => c.ParentCategoryId == null), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateCategory_WhenParentIsValid_CreatesSubcategory()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var parentId = Guid.NewGuid();
        var company = new Company { Id = companyId, LegalName = "Acme Corp" };
        var parentCategory = new Category { Id = parentId, CompanyId = companyId, Name = "Electronics", IsActive = true };

        _companyAccessResolverMock.Setup(c => c.GetAuthorizedCompanyIdAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(companyId);
        _companyRepoMock.Setup(r => r.GetByIdAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(company);
        _categoryRepoMock.Setup(r => r.IsCodeUniqueAsync(companyId, "SUBCAT-002", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _categoryRepoMock.Setup(r => r.GetByIdAsync(parentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(parentCategory);

        var command = new CreateCategoryCommand(
            CompanyId: companyId,
            Code: "SUBCAT-002",
            Name: "Mobile",
            ParentCategoryId: parentId,
            GstTaxRatePercent: 18m,
            HsnCodeDefault: "8517");

        // Act
        var result = await _createHandler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.ParentCategoryId.Should().Be(parentId);
        result.Value.ParentCategoryName.Should().Be("Electronics");
        result.Value.Code.Should().Be("SUBCAT-002");
        result.Value.Name.Should().Be("Mobile");
        _categoryRepoMock.Verify(r => r.AddAsync(It.Is<Category>(c => c.ParentCategoryId == parentId), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateCategory_WhenSelfParenting_ReturnsValidationError()
    {
        // Arrange
        var categoryId = Guid.NewGuid();
        var companyId = Guid.NewGuid();
        var category = new Category { Id = categoryId, CompanyId = companyId, Code = "CAT-001", Name = "Electronics", IsActive = true };
        var company = new Company { Id = companyId, LegalName = "Acme Corp" };

        _categoryRepoMock.Setup(r => r.GetByIdAsync(categoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);
        _companyAccessResolverMock.Setup(c => c.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<Unit>.Success(Unit.Value));
        _companyRepoMock.Setup(r => r.GetByIdAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(company);
        _categoryRepoMock.Setup(r => r.IsCodeUniqueAsync(companyId, "CAT-001", categoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var command = new UpdateCategoryCommand(
            Id: categoryId,
            CompanyId: companyId,
            Code: "CAT-001",
            Name: "Electronics",
            ParentCategoryId: categoryId, // Self parenting
            GstTaxRatePercent: 18m,
            HsnCodeDefault: "8517",
            IsActive: true);

        // Act
        var result = await _updateHandler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be("Category.SelfParent");
    }

    [Fact]
    public async Task UpdateCategory_WhenCircularDependencyDetected_ReturnsCircularReferenceError()
    {
        // Arrange
        // Chain: A -> B -> C. Attempting to make A a child of C (creating C -> A -> B -> C loop)
        var companyId = Guid.NewGuid();
        var catAId = Guid.NewGuid();
        var catBId = Guid.NewGuid();
        var catCId = Guid.NewGuid();

        var catA = new Category { Id = catAId, CompanyId = companyId, Code = "CAT-001", Name = "Electronics", ParentCategoryId = null, IsActive = true };
        var catB = new Category { Id = catBId, CompanyId = companyId, Code = "SUBCAT-002", Name = "Mobile", ParentCategoryId = catAId, IsActive = true };
        var catC = new Category { Id = catCId, CompanyId = companyId, Code = "SUBCAT-003", Name = "Smartphones", ParentCategoryId = catBId, IsActive = true };
        var company = new Company { Id = companyId, LegalName = "Acme Corp" };

        _categoryRepoMock.Setup(r => r.GetByIdAsync(catAId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(catA);
        _categoryRepoMock.Setup(r => r.GetByIdAsync(catCId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(catC);
        _companyAccessResolverMock.Setup(c => c.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<Unit>.Success(Unit.Value));
        _companyRepoMock.Setup(r => r.GetByIdAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(company);
        _categoryRepoMock.Setup(r => r.IsCodeUniqueAsync(companyId, "CAT-001", catAId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _categoryRepoMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Category> { catA, catB, catC });

        var command = new UpdateCategoryCommand(
            Id: catAId,
            CompanyId: companyId,
            Code: "CAT-001",
            Name: "Electronics",
            ParentCategoryId: catCId, // A becomes child of C, creating cycle!
            GstTaxRatePercent: 18m,
            HsnCodeDefault: "8517",
            IsActive: true);

        // Act
        var result = await _updateHandler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be("Category.CircularReference");
    }

    [Fact]
    public async Task UpdateCategory_PreservesExistingCategoryCode_EvenIfSubcategoryHasCATPrefix()
    {
        // Arrange
        // Existing record "Mobile" has code "CAT-002" and parent "Electronics"
        var categoryId = Guid.NewGuid();
        var parentId = Guid.NewGuid();
        var companyId = Guid.NewGuid();

        var existingCategory = new Category { Id = categoryId, CompanyId = companyId, Code = "CAT-002", Name = "Mobile", ParentCategoryId = parentId, IsActive = true };
        var parentCategory = new Category { Id = parentId, CompanyId = companyId, Code = "CAT-001", Name = "Electronics", IsActive = true };
        var company = new Company { Id = companyId, LegalName = "Acme Corp" };

        _categoryRepoMock.Setup(r => r.GetByIdAsync(categoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingCategory);
        _categoryRepoMock.Setup(r => r.GetByIdAsync(parentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(parentCategory);
        _companyAccessResolverMock.Setup(c => c.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<Unit>.Success(Unit.Value));
        _companyRepoMock.Setup(r => r.GetByIdAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(company);
        _categoryRepoMock.Setup(r => r.IsCodeUniqueAsync(companyId, "CAT-002", categoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _categoryRepoMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Category> { parentCategory, existingCategory });

        var command = new UpdateCategoryCommand(
            Id: categoryId,
            CompanyId: companyId,
            Code: "CAT-002", // Existing code preserved
            Name: "Mobile Devices",
            ParentCategoryId: parentId,
            GstTaxRatePercent: 18m,
            HsnCodeDefault: "8517",
            IsActive: true);

        // Act
        var result = await _updateHandler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Code.Should().Be("CAT-002");
        result.Value.ParentCategoryId.Should().Be(parentId);
        result.Value.ParentCategoryName.Should().Be("Electronics");
    }
}
