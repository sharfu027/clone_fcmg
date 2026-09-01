using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using MediatR;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Designations.Commands;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.UnitTests.Features.MasterData;

public sealed class DeleteDesignationCommandHandlerTests
{
    private readonly Mock<IDesignationRepository> _designationRepoMock;
    private readonly Mock<IEmployeeRepository> _employeeRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICompanyAccessResolver> _companyAccessResolverMock;
    private readonly DeleteDesignationCommandHandler _handler;

    public DeleteDesignationCommandHandlerTests()
    {
        _designationRepoMock = new Mock<IDesignationRepository>();
        _employeeRepoMock = new Mock<IEmployeeRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _companyAccessResolverMock = new Mock<ICompanyAccessResolver>();

        _handler = new DeleteDesignationCommandHandler(
            _designationRepoMock.Object,
            _employeeRepoMock.Object,
            _unitOfWorkMock.Object,
            _companyAccessResolverMock.Object);
    }

    [Fact]
    public async Task Handle_WhenDesignationDoesNotExist_ReturnsNotFoundFailure()
    {
        // Arrange
        var designationId = Guid.NewGuid();
        _designationRepoMock
            .Setup(r => r.GetByIdAsync(designationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Designation?)null);

        var command = new DeleteDesignationCommand(designationId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Type.Should().Be(ErrorType.NotFound);
        result.Error.Code.Should().Be("Designation.NotFound");
    }

    [Fact]
    public async Task Handle_WhenCompanyAccessFails_ReturnsCompanyAccessError()
    {
        // Arrange
        var designationId = Guid.NewGuid();
        var companyId = Guid.NewGuid();
        var designation = new Designation
        {
            Id = designationId,
            CompanyId = companyId,
            Code = "DSG-001",
            Title = "Sales Officer"
        };

        _designationRepoMock
            .Setup(r => r.GetByIdAsync(designationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(designation);

        _companyAccessResolverMock
            .Setup(c => c.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<Unit>.Failure(Error.Forbidden("IAM.CompanyForbidden", "You do not have access to this company.")));

        var command = new DeleteDesignationCommand(designationId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
        result.Error.Code.Should().Be("IAM.CompanyForbidden");
        _designationRepoMock.Verify(r => r.DeleteAsync(It.IsAny<Designation>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenDesignationIsAssignedToEmployees_ReturnsConflictFailureWithEmployeeCount()
    {
        // Arrange
        var designationId = Guid.NewGuid();
        var companyId = Guid.NewGuid();
        var designation = new Designation
        {
            Id = designationId,
            CompanyId = companyId,
            Code = "DSG-MGR",
            Title = "Regional Sales Manager"
        };

        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            DesignationId = designationId,
            EmployeeCode = "EMP-100",
            FirstName = "John",
            LastName = "Doe",
            Email = "john@example.com",
            Phone = "9999999999"
        };

        _designationRepoMock
            .Setup(r => r.GetByIdAsync(designationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(designation);

        _companyAccessResolverMock
            .Setup(c => c.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<Unit>.Success(Unit.Value));

        _employeeRepoMock
            .Setup(e => e.FindAsync(It.IsAny<Expression<Func<Employee, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Employee> { employee });

        var command = new DeleteDesignationCommand(designationId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Type.Should().Be(ErrorType.Conflict);
        result.Error.Code.Should().Be("Designation.InUse");
        result.Error.Description.Should().Contain("Cannot delete designation 'Regional Sales Manager'");
        result.Error.Description.Should().Contain("assigned to 1 employee");
        _designationRepoMock.Verify(r => r.DeleteAsync(It.IsAny<Designation>(), It.IsAny<CancellationToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenDesignationIsUnused_DeletesSuccessfully()
    {
        // Arrange
        var designationId = Guid.NewGuid();
        var companyId = Guid.NewGuid();
        var designation = new Designation
        {
            Id = designationId,
            CompanyId = companyId,
            Code = "DSG-UNUSED",
            Title = "Temporary Assistant"
        };

        _designationRepoMock
            .Setup(r => r.GetByIdAsync(designationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(designation);

        _companyAccessResolverMock
            .Setup(c => c.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<Unit>.Success(Unit.Value));

        _employeeRepoMock
            .Setup(e => e.FindAsync(It.IsAny<Expression<Func<Employee, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Employee>());

        var command = new DeleteDesignationCommand(designationId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _designationRepoMock.Verify(r => r.DeleteAsync(designation, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
