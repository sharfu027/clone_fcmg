using NetArchTest.Rules;
using FluentAssertions;
using Xunit;

namespace INK.ERP.UnitTests;

public sealed class ArchitectureTests
{
    private const string DomainNamespace = "INK.ERP.Domain";
    private const string ApplicationNamespace = "INK.ERP.Application";
    private const string InfrastructureNamespace = "INK.ERP.Infrastructure";
    private const string ApiNamespace = "INK.ERP.API";
    private const string SharedNamespace = "INK.ERP.Shared";

    [Fact]
    public void Domain_Should_NotHaveDependencyOnOtherProjects()
    {
        var assembly = typeof(INK.ERP.Domain.Common.BaseEntity).Assembly;

        var result = Types.InAssembly(assembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                ApplicationNamespace,
                InfrastructureNamespace,
                ApiNamespace)
            .GetResult();

        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void Application_Should_NotHaveDependencyOnInfrastructureOrApi()
    {
        var assembly = typeof(Application.DependencyInjection).Assembly;

        var result = Types.InAssembly(assembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                InfrastructureNamespace,
                ApiNamespace)
            .GetResult();

        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void Infrastructure_Should_NotHaveDependencyOnApi()
    {
        var assembly = typeof(INK.ERP.Infrastructure.DependencyInjection).Assembly;

        var result = Types.InAssembly(assembly)
            .ShouldNot()
            .HaveDependencyOnAny(ApiNamespace)
            .GetResult();

        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void API_Should_NotDependOnDirectInternalTestingProjects()
    {
        var assembly = typeof(Program).Assembly;

        var result = Types.InAssembly(assembly)
            .ShouldNot()
            .HaveDependencyOnAny("INK.ERP.UnitTests", "INK.ERP.IntegrationTests")
            .GetResult();

        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void Handlers_Should_HaveNameEndingWithHandler()
    {
        var assembly = typeof(INK.ERP.Application.DependencyInjection).Assembly;

        var result = Types.InAssembly(assembly)
            .That()
            .ImplementInterface(typeof(MediatR.IRequestHandler<,>))
            .Should()
            .HaveNameEndingWith("Handler")
            .GetResult();

        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void Validators_Should_HaveNameEndingWithValidator()
    {
        var assembly = typeof(INK.ERP.Application.DependencyInjection).Assembly;

        var result = Types.InAssembly(assembly)
            .That()
            .Inherit(typeof(FluentValidation.AbstractValidator<>))
            .Should()
            .HaveNameEndingWith("Validator")
            .GetResult();

        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void Repositories_Should_HaveNameEndingWithRepository()
    {
        var assembly = typeof(INK.ERP.Infrastructure.DependencyInjection).Assembly;

        var repoTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && t.Name.EndsWith("Repository"))
            .ToList();

        repoTypes.Should().NotBeEmpty();

        foreach (var type in repoTypes)
        {
            var implementsRepoInterface = type.GetInterfaces().Any(i => i.Name.EndsWith("Repository"));
            implementsRepoInterface.Should().BeTrue($"Repository {type.Name} should implement a repository interface ending with Repository");
        }
    }

    [Fact]
    public void Services_Should_HaveNameEndingWithService()
    {
        var assembly = typeof(INK.ERP.Infrastructure.DependencyInjection).Assembly;

        var result = Types.InAssembly(assembly)
            .That()
            .AreClasses()
            .And()
            .HaveNameEndingWith("Service")
            .Should()
            .NotBeInterfaces()
            .GetResult();

        result.IsSuccessful.Should().BeTrue();
    }
}
