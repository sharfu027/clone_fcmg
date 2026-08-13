using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Departments.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.Departments.Commands;

public record CreateDepartmentCommand(
    Guid BranchId,
    string Code,
    string Name,
    string? Description) : IRequest<Result<DepartmentDto>>;

public class CreateDepartmentCommandHandler : IRequestHandler<CreateDepartmentCommand, Result<DepartmentDto>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateDepartmentCommandHandler(IDepartmentRepository departmentRepository, IBranchRepository branchRepository, IUnitOfWork unitOfWork)
    {
        _departmentRepository = departmentRepository;
        _branchRepository = branchRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<DepartmentDto>> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var branch = await _branchRepository.GetByIdAsync(request.BranchId, cancellationToken);
        if (branch == null)
        {
            return Result<DepartmentDto>.Failure(Error.NotFound("Branch.NotFound", $"Parent Branch with ID '{request.BranchId}' was not found."));
        }

        if (!await _departmentRepository.IsCodeUniqueAsync(request.BranchId, request.Code, null, cancellationToken))
        {
            return Result<DepartmentDto>.Failure(Error.Conflict("Department.DuplicateCode", $"Department code '{request.Code}' already exists under branch '{branch.Name}'."));
        }

        var department = new Department
        {
            BranchId = request.BranchId,
            Code = request.Code.ToUpperInvariant().Trim(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true
        };

        await _departmentRepository.AddAsync(department, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new DepartmentDto(
            department.Id,
            department.BranchId,
            branch.Name,
            department.Code,
            department.Name,
            department.Description,
            department.IsActive,
            department.CreatedAtUtc);

        return Result<DepartmentDto>.Success(dto);
    }
}

public record UpdateDepartmentCommand(
    Guid Id,
    Guid BranchId,
    string Code,
    string Name,
    string? Description,
    bool IsActive) : IRequest<Result<DepartmentDto>>;

public class UpdateDepartmentCommandHandler : IRequestHandler<UpdateDepartmentCommand, Result<DepartmentDto>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateDepartmentCommandHandler(IDepartmentRepository departmentRepository, IBranchRepository branchRepository, IUnitOfWork unitOfWork)
    {
        _departmentRepository = departmentRepository;
        _branchRepository = branchRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<DepartmentDto>> Handle(UpdateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = await _departmentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (department == null)
        {
            return Result<DepartmentDto>.Failure(Error.NotFound("Department.NotFound", $"Department with ID '{request.Id}' was not found."));
        }

        var branch = await _branchRepository.GetByIdAsync(request.BranchId, cancellationToken);
        if (branch == null)
        {
            return Result<DepartmentDto>.Failure(Error.NotFound("Branch.NotFound", $"Parent Branch with ID '{request.BranchId}' was not found."));
        }

        if (!await _departmentRepository.IsCodeUniqueAsync(request.BranchId, request.Code, request.Id, cancellationToken))
        {
            return Result<DepartmentDto>.Failure(Error.Conflict("Department.DuplicateCode", $"Department code '{request.Code}' already exists under branch '{branch.Name}'."));
        }

        department.BranchId = request.BranchId;
        department.Code = request.Code.ToUpperInvariant().Trim();
        department.Name = request.Name.Trim();
        department.Description = request.Description?.Trim();
        department.IsActive = request.IsActive;

        await _departmentRepository.UpdateAsync(department, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new DepartmentDto(
            department.Id,
            department.BranchId,
            branch.Name,
            department.Code,
            department.Name,
            department.Description,
            department.IsActive,
            department.CreatedAtUtc);

        return Result<DepartmentDto>.Success(dto);
    }
}

public record DeleteDepartmentCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteDepartmentCommandHandler : IRequestHandler<DeleteDepartmentCommand, Result<Unit>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteDepartmentCommandHandler(IDepartmentRepository departmentRepository, IUnitOfWork unitOfWork)
    {
        _departmentRepository = departmentRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = await _departmentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (department == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Department.NotFound", $"Department with ID '{request.Id}' was not found."));
        }

        await _departmentRepository.DeleteAsync(department, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
