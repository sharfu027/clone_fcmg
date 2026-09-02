using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using MediatR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.IAM.Services;
using INK.ERP.Application.Features.SalesTeam.Commands;
using INK.ERP.Application.Features.SalesTeam.Queries;
using INK.ERP.Application.Features.Security.Pins.Commands;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.SFA;

namespace INK.ERP.UnitTests.Features.Sales;

public class SalesTeamManagementUnitTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork = new();
    private readonly Mock<ICompanyAccessResolver> _mockCompanyAccessResolver = new();
    private readonly Mock<IPasswordPolicyService> _mockPasswordPolicy = new();
    private readonly Mock<ICompanyRepository> _mockCompanyRepo = new();
    private readonly Mock<IBranchRepository> _mockBranchRepo = new();
    private readonly Mock<ICustomerRepository> _mockCustomerRepo = new();
    private readonly Mock<ISfaRepository> _mockSfaRepo = new();
    private readonly Mock<IEmployeeRepository> _mockEmployeeRepository = new();
    private readonly Mock<IFaceProfileRepository> _mockFaceProfileRepo = new();
    private readonly Mock<IGenericRepository<Employee>> _mockEmployeeRepo = new();
    private readonly Mock<IGenericRepository<ApplicationUser>> _mockUserRepo = new();
    private readonly Mock<IGenericRepository<Department>> _mockDeptRepo = new();
    private readonly Mock<IGenericRepository<Designation>> _mockDesignationRepo = new();
    private readonly Mock<IGenericRepository<ApplicationRole>> _mockRoleRepo = new();
    private readonly Mock<IGenericRepository<UserRole>> _mockUserRoleRepo = new();
    private readonly Mock<ILogger<CreateSalesRepresentativeCommandHandler>> _mockCreateLogger = new();
    private readonly Mock<ILogger<UpdateSalesRepresentativeCommandHandler>> _mockUpdateLogger = new();

    public SalesTeamManagementUnitTests()
    {
        _mockUnitOfWork.Setup(u => u.Repository<Employee>()).Returns(_mockEmployeeRepo.Object);
        _mockUnitOfWork.Setup(u => u.Repository<ApplicationUser>()).Returns(_mockUserRepo.Object);
        _mockUnitOfWork.Setup(u => u.Repository<Department>()).Returns(_mockDeptRepo.Object);
        _mockUnitOfWork.Setup(u => u.Repository<Designation>()).Returns(_mockDesignationRepo.Object);
        _mockUnitOfWork.Setup(u => u.Repository<ApplicationRole>()).Returns(_mockRoleRepo.Object);
        _mockUnitOfWork.Setup(u => u.Repository<UserRole>()).Returns(_mockUserRoleRepo.Object);
    }

    [Fact]
    public async Task CreateSalesRepresentative_ShouldSucceed_WhenCompanyAdminCreatesWithinCompany()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var company = new Company { Id = companyId, LegalName = "Acme FMCG", Code = "ACME" };

        _mockCompanyAccessResolver.Setup(r => r.GetAuthorizedCompanyIdAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(companyId);
        _mockCompanyAccessResolver.Setup(r => r.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(Unit.Value));

        _mockCompanyRepo.Setup(r => r.GetByIdAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(company);

        _mockPasswordPolicy.Setup(p => p.ValidatePassword("SecurePassword123!"))
            .Returns(Result.Success());

        _mockUserRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<ApplicationUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationUser>());

        _mockDeptRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Department, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Department> { new Department { Id = Guid.NewGuid(), CompanyId = companyId, Code = "SALES", Name = "Sales" } });

        _mockDesignationRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Designation, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Designation> { new Designation { Id = Guid.NewGuid(), CompanyId = companyId, Code = "SALES_REP", Title = "Sales Rep" } });

        _mockEmployeeRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Employee, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Employee>());

        _mockRoleRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<ApplicationRole, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationRole> { new ApplicationRole { Id = Guid.NewGuid(), Code = "SALES_REP", Name = "Sales Representative" } });

        var handler = new CreateSalesRepresentativeCommandHandler(
            _mockUnitOfWork.Object,
            _mockCompanyAccessResolver.Object,
            _mockPasswordPolicy.Object,
            _mockCompanyRepo.Object,
            _mockBranchRepo.Object,
            _mockCreateLogger.Object);

        var command = new CreateSalesRepresentativeCommand(
            companyId,
            "Ramesh",
            "Kumar",
            "ramesh.sales",
            "ramesh@acmefmcg.com",
            "+919876543210",
            "SecurePassword123!",
            null,
            true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.DisplayName.Should().Be("Ramesh Kumar");
        result.Value.Username.Should().Be("ramesh.sales");
        result.Value.CompanyId.Should().Be(companyId);

        _mockEmployeeRepo.Verify(r => r.AddAsync(It.Is<Employee>(e => e.FirstName == "Ramesh" && e.CompanyId == companyId), It.IsAny<CancellationToken>()), Times.Once);
        _mockUserRepo.Verify(r => r.AddAsync(It.Is<ApplicationUser>(u => u.UserName == "ramesh.sales" && u.PasswordHash != null && u.PasswordHash.StartsWith("HASHED:")), It.IsAny<CancellationToken>()), Times.Once);
        _mockUserRoleRepo.Verify(r => r.AddAsync(It.IsAny<UserRole>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateSalesRepresentative_ShouldFail_WhenBranchBelongsToDifferentCompany()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var otherCompanyId = Guid.NewGuid();
        var foreignBranchId = Guid.NewGuid();

        _mockCompanyAccessResolver.Setup(r => r.GetAuthorizedCompanyIdAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(companyId);
        _mockCompanyAccessResolver.Setup(r => r.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(Unit.Value));

        _mockCompanyRepo.Setup(r => r.GetByIdAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Company { Id = companyId, LegalName = "Acme FMCG", Code = "ACME" });

        // Branch belongs to foreign company
        _mockBranchRepo.Setup(r => r.GetByIdAsync(foreignBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Branch { Id = foreignBranchId, CompanyId = otherCompanyId, Name = "Foreign Branch" });

        var handler = new CreateSalesRepresentativeCommandHandler(
            _mockUnitOfWork.Object,
            _mockCompanyAccessResolver.Object,
            _mockPasswordPolicy.Object,
            _mockCompanyRepo.Object,
            _mockBranchRepo.Object,
            _mockCreateLogger.Object);

        var command = new CreateSalesRepresentativeCommand(
            companyId,
            "Ramesh",
            "Kumar",
            "ramesh.sales",
            "ramesh@acmefmcg.com",
            "+919876543210",
            "SecurePassword123!",
            foreignBranchId,
            true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("SalesTeam.InvalidBranch");
    }

    [Fact]
    public async Task AssignCustomersToSalesRep_ShouldReject_WhenSelectedCustomerBelongsToForeignCompany()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var repId = Guid.NewGuid();
        var foreignCustomerId = Guid.NewGuid();

        var employee = new Employee { Id = repId, CompanyId = companyId, FirstName = "Ramesh" };
        _mockEmployeeRepo.Setup(r => r.GetByIdAsync(repId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(employee);

        _mockCompanyAccessResolver.Setup(r => r.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(Unit.Value));

        // Company has valid customers that do NOT include foreignCustomerId
        _mockCustomerRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Customer, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Customer>
            {
                new Customer { Id = Guid.NewGuid(), CompanyId = companyId, LegalName = "Valid Store", IsActive = true }
            });

        var handler = new AssignCustomersToSalesRepCommandHandler(
            _mockUnitOfWork.Object,
            _mockCompanyAccessResolver.Object,
            _mockCustomerRepo.Object,
            _mockSfaRepo.Object);

        var command = new AssignCustomersToSalesRepCommand(repId, new List<Guid> { foreignCustomerId });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("SalesTeam.CrossCompanyCustomers");
    }

    [Fact]
    public async Task ResetSalesRepresentativePassword_ShouldReject_WhenTargetIsAdminOrSuperAdmin()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var repId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var adminRoleId = Guid.NewGuid();

        var employee = new Employee { Id = repId, CompanyId = companyId, FirstName = "Admin User" };
        var user = new ApplicationUser { Id = userId, EmployeeId = repId, UserName = "admin.user" };

        _mockEmployeeRepo.Setup(r => r.GetByIdAsync(repId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(employee);

        _mockCompanyAccessResolver.Setup(r => r.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(Unit.Value));

        _mockUserRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<ApplicationUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationUser> { user });

        _mockUserRoleRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<UserRole, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserRole> { new UserRole { UserId = userId, RoleId = adminRoleId } });

        _mockRoleRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<ApplicationRole, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationRole> { new ApplicationRole { Id = adminRoleId, Name = "Administrator", Code = "ADMIN" } });

        _mockPasswordPolicy.Setup(p => p.ValidatePassword("NewPassword123!"))
            .Returns(Result.Success());

        var handler = new ResetSalesRepresentativePasswordCommandHandler(
            _mockUnitOfWork.Object,
            _mockCompanyAccessResolver.Object,
            _mockPasswordPolicy.Object);

        var command = new ResetSalesRepresentativePasswordCommand(repId, "NewPassword123!");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("SalesTeam.Forbidden");
    }

    [Fact]
    public async Task RegisterSalesRepLocation_ShouldSucceed_WithDefault50mRadius()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var repId = Guid.NewGuid();
        var employee = new Employee { Id = repId, CompanyId = companyId, FirstName = "Ramesh" };

        _mockEmployeeRepo.Setup(r => r.GetByIdAsync(repId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(employee);

        _mockCompanyAccessResolver.Setup(r => r.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(Unit.Value));

        _mockSfaRepo.Setup(r => r.GetLocationEnrollmentAsync(repId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SalesRepLocationEnrollment?)null);

        var handler = new RegisterSalesRepLocationCommandHandler(
            _mockUnitOfWork.Object,
            _mockCompanyAccessResolver.Object,
            _mockSfaRepo.Object);

        var command = new RegisterSalesRepLocationCommand(
            repId,
            "South Delhi Hub",
            28.6139,
            77.2090,
            50.0);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.LocationName.Should().Be("South Delhi Hub");
        result.Value.AllowedRadiusMeters.Should().Be(50.0);
        result.Value.Latitude.Should().Be(28.6139);
        result.Value.Longitude.Should().Be(77.2090);

        _mockSfaRepo.Verify(r => r.AddLocationEnrollmentAsync(It.Is<SalesRepLocationEnrollment>(e => e.EmployeeId == repId && e.AllowedRadiusMeters == 50.0), It.IsAny<CancellationToken>()), Times.Once);
        _mockSfaRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ValidateLoginLocation_ShouldAllow_WhenWithinEnrolled50mRadius()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var employeeId = Guid.NewGuid();
        var enrolledLocation = new SalesRepLocationEnrollment
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            EmployeeId = employeeId,
            LocationName = "Delhi Central HQ",
            Latitude = 28.613900,
            Longitude = 77.209000,
            AllowedRadiusMeters = 50.0,
            IsActive = true
        };

        _mockSfaRepo.Setup(r => r.GetLocationEnrollmentAsync(employeeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(enrolledLocation);

        var handler = new ValidateLoginLocationCommandHandler(
            _mockBranchRepo.Object,
            _mockEmployeeRepository.Object,
            _mockSfaRepo.Object,
            _mockCompanyAccessResolver.Object);

        // Attempting login 10 meters away from enrolled location
        var command = new ValidateLoginLocationCommand(
            companyId,
            employeeId,
            28.613950,
            77.209050,
            null,
            null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsAllowed.Should().BeTrue();
        result.Value.RequiresPinOverride.Should().BeFalse();
        result.Value.TargetLocationName.Should().Be("Delhi Central HQ");
        result.Value.DistanceMeters.Should().BeLessThan(50.0);
    }

    [Fact]
    public async Task ValidateLoginLocation_ShouldReject_WhenOutsideEnrolledRadius()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var employeeId = Guid.NewGuid();
        var enrolledLocation = new SalesRepLocationEnrollment
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            EmployeeId = employeeId,
            LocationName = "Delhi Central HQ",
            Latitude = 28.613900,
            Longitude = 77.209000,
            AllowedRadiusMeters = 50.0,
            IsActive = true
        };

        _mockSfaRepo.Setup(r => r.GetLocationEnrollmentAsync(employeeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(enrolledLocation);

        var handler = new ValidateLoginLocationCommandHandler(
            _mockBranchRepo.Object,
            _mockEmployeeRepository.Object,
            _mockSfaRepo.Object,
            _mockCompanyAccessResolver.Object);

        // Attempting login from Mumbai (over 1000 km away)
        var command = new ValidateLoginLocationCommand(
            companyId,
            employeeId,
            19.0760,
            72.8777,
            null,
            null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsAllowed.Should().BeFalse();
        result.Value.RequiresPinOverride.Should().BeTrue();
        result.Value.TargetLocationName.Should().Be("Delhi Central HQ");
        result.Value.DistanceMeters.Should().BeGreaterThan(50.0);
    }

    [Fact]
    public async Task VerifyCustomerVisit_ShouldSucceed_WhenWithinCustomerGpsRadius()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var salesEmployeeId = Guid.NewGuid();

        var customer = new Customer
        {
            Id = customerId,
            CompanyId = companyId,
            LegalName = "Sharma Retail Outlet",
            Latitude = 28.5355,
            Longitude = 77.3910,
            IsActive = true
        };

        _mockCustomerRepo.Setup(r => r.GetByIdAsync(customerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);

        _mockCompanyAccessResolver.Setup(r => r.HasAccessToCompanyAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _mockSfaRepo.Setup(r => r.GetCustomerAssignmentsAsync(It.IsAny<List<Guid>>(), salesEmployeeId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SalesRepCustomerAssignment>
            {
                new SalesRepCustomerAssignment { CompanyId = companyId, EmployeeId = salesEmployeeId, CustomerId = customerId, IsActive = true }
            });

        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(s => s.UserId).Returns(Guid.NewGuid().ToString());

        var mockMediator = new Mock<ISender>();

        var handler = new INK.ERP.Application.Features.Sales.Orders.Commands.VerifyFieldSalesOrderLocationCommandHandler(
            _mockCustomerRepo.Object,
            _mockEmployeeRepository.Object,
            _mockSfaRepo.Object,
            _mockCompanyAccessResolver.Object,
            mockCurrentUserService.Object,
            _mockUnitOfWork.Object,
            mockMediator.Object);

        // Within 15 meters of customer location
        var command = new INK.ERP.Application.Features.Sales.Orders.Commands.VerifyFieldSalesOrderLocationCommand(
            companyId,
            customerId,
            salesEmployeeId,
            28.5356,
            77.3911,
            5.0,
            null,
            false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsWithinRange.Should().BeTrue();
        result.Value.DistanceMeters.Should().BeLessThan(50.0);
        result.Value.CustomerName.Should().Be("Sharma Retail Outlet");
    }

    [Fact]
    public async Task VerifyCustomerVisit_ShouldReject_WhenOutsideCustomerGpsRadius()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var salesEmployeeId = Guid.NewGuid();

        var customer = new Customer
        {
            Id = customerId,
            CompanyId = companyId,
            LegalName = "Sharma Retail Outlet",
            Latitude = 28.5355,
            Longitude = 77.3910,
            IsActive = true
        };

        _mockCustomerRepo.Setup(r => r.GetByIdAsync(customerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);

        _mockCompanyAccessResolver.Setup(r => r.HasAccessToCompanyAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _mockSfaRepo.Setup(r => r.GetCustomerAssignmentsAsync(It.IsAny<List<Guid>>(), salesEmployeeId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SalesRepCustomerAssignment>
            {
                new SalesRepCustomerAssignment { CompanyId = companyId, EmployeeId = salesEmployeeId, CustomerId = customerId, IsActive = true }
            });

        var mockCurrentUserService = new Mock<ICurrentUserService>();
        var mockMediator = new Mock<ISender>();

        var handler = new INK.ERP.Application.Features.Sales.Orders.Commands.VerifyFieldSalesOrderLocationCommandHandler(
            _mockCustomerRepo.Object,
            _mockEmployeeRepository.Object,
            _mockSfaRepo.Object,
            _mockCompanyAccessResolver.Object,
            mockCurrentUserService.Object,
            _mockUnitOfWork.Object,
            mockMediator.Object);

        // Attempting from 500 meters away
        var command = new INK.ERP.Application.Features.Sales.Orders.Commands.VerifyFieldSalesOrderLocationCommand(
            companyId,
            customerId,
            salesEmployeeId,
            28.5400,
            77.3950,
            5.0,
            null,
            false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("SalesOrder.GpsOutOfRange");
    }

    [Fact]
    public async Task VerifyCustomerVisit_ShouldReject_WhenCustomerIsNotAssignedToSalesRep()
    {
        // Arrange
        var companyId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var otherCustomerId = Guid.NewGuid();
        var salesEmployeeId = Guid.NewGuid();

        var customer = new Customer
        {
            Id = customerId,
            CompanyId = companyId,
            LegalName = "Unassigned Store",
            Latitude = 28.5355,
            Longitude = 77.3910,
            IsActive = true
        };

        _mockCustomerRepo.Setup(r => r.GetByIdAsync(customerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);

        _mockCompanyAccessResolver.Setup(r => r.HasAccessToCompanyAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Rep is only assigned to otherCustomerId
        _mockSfaRepo.Setup(r => r.GetCustomerAssignmentsAsync(It.IsAny<List<Guid>>(), salesEmployeeId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SalesRepCustomerAssignment>
            {
                new SalesRepCustomerAssignment { CompanyId = companyId, EmployeeId = salesEmployeeId, CustomerId = otherCustomerId, IsActive = true }
            });

        var mockCurrentUserService = new Mock<ICurrentUserService>();
        var mockMediator = new Mock<ISender>();

        var handler = new INK.ERP.Application.Features.Sales.Orders.Commands.VerifyFieldSalesOrderLocationCommandHandler(
            _mockCustomerRepo.Object,
            _mockEmployeeRepository.Object,
            _mockSfaRepo.Object,
            _mockCompanyAccessResolver.Object,
            mockCurrentUserService.Object,
            _mockUnitOfWork.Object,
            mockMediator.Object);

        var command = new INK.ERP.Application.Features.Sales.Orders.Commands.VerifyFieldSalesOrderLocationCommand(
            companyId,
            customerId,
            salesEmployeeId,
            28.5355,
            77.3910,
            5.0,
            null,
            false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("SalesOrder.UnassignedCustomer");
    }

    [Fact]
    public async Task EnrollSalesRepFace_ShouldResolveEmployeeToApplicationUser_WhenEmployeeIdDiffersFromUserId()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var companyId = Guid.NewGuid();

        var employee = new Employee
        {
            Id = employeeId,
            CompanyId = companyId,
            FirstName = "Shadow",
            LastName = "Sales",
            Email = "shadowsales@fmcg.com",
            IsActive = true
        };

        var user = new ApplicationUser
        {
            Id = userId,
            EmployeeId = employeeId,
            UserName = "shadowsales",
            Email = "shadowsales@fmcg.com",
            NormalizedEmail = "SHADOWSALES@FMCG.COM",
            IsActive = true
        };

        _mockEmployeeRepo.Setup(r => r.GetByIdAsync(employeeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(employee);

        _mockCompanyAccessResolver.Setup(r => r.ValidateCompanyAccessAsync(companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(Unit.Value));

        _mockUserRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<ApplicationUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationUser> { user });

        var mockWorkflow = new Mock<INK.ERP.Application.Features.Security.Face.Workflows.IFaceEnrollmentWorkflow>();
        mockWorkflow.Setup(w => w.ExecuteAsync(It.Is<INK.ERP.Application.Features.Security.Face.EnrollFaceCommand>(c => c.UserId == userId), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(new INK.ERP.Application.Features.Security.Face.DTOs.FaceProfileDto(
                Guid.NewGuid(), userId, "Enrolled", true, 1, new List<INK.ERP.Application.Features.Security.Face.DTOs.FaceTemplateDto>())));

        var handler = new EnrollSalesRepFaceCommandHandler(
            _mockUnitOfWork.Object,
            _mockCompanyAccessResolver.Object,
            mockWorkflow.Object);

        var command = new EnrollSalesRepFaceCommand(employeeId, new byte[] { 1, 2, 3, 4 });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        mockWorkflow.Verify(w => w.ExecuteAsync(It.Is<INK.ERP.Application.Features.Security.Face.EnrollFaceCommand>(c => c.UserId == userId), It.IsAny<CancellationToken>()), Times.Once);
    }
}

