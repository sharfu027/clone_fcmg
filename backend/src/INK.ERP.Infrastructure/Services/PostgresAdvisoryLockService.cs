using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Services;

public sealed class PostgresAdvisoryLockService : IPostgresAdvisoryLockService
{
    private readonly AppDbContext _context;

    public PostgresAdvisoryLockService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> AcquireAdvisoryLockAsync(int lockId, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        await _context.Database.OpenConnectionAsync(cancellationToken);

        using var command = connection.CreateCommand();
        command.CommandText = "SELECT pg_try_advisory_lock(@lockId)";
        
        var parameter = command.CreateParameter();
        parameter.ParameterName = "@lockId";
        parameter.Value = lockId;
        command.Parameters.Add(parameter);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is bool locked && locked;
    }

    public async Task ReleaseAdvisoryLockAsync(int lockId, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT pg_advisory_unlock(@lockId)";
        
        var parameter = command.CreateParameter();
        parameter.ParameterName = "@lockId";
        parameter.Value = lockId;
        command.Parameters.Add(parameter);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
