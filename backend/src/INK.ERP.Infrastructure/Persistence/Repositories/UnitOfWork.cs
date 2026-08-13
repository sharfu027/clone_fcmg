using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Concurrent;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly IServiceProvider _serviceProvider;
    private readonly ConcurrentDictionary<string, object> _repositories = new();
    private IDbContextTransaction? _currentTransaction;

    public UnitOfWork(AppDbContext context, IServiceProvider serviceProvider)
    {
        _context = context;
        _serviceProvider = serviceProvider;
    }

    public IGenericRepository<T> Repository<T>() where T : class
    {
        var type = typeof(T).Name;

        return (IGenericRepository<T>)_repositories.GetOrAdd(type, _ =>
        {
            // Try to resolve a specialized repository from DI first
            var specializedRepo = _serviceProvider.GetService<IGenericRepository<T>>();
            if (specializedRepo != null && specializedRepo.GetType() != typeof(GenericRepository<T>))
            {
                return specializedRepo;
            }

            return new GenericRepository<T>(_context);
        });
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<TResponse> ExecuteInTransactionAsync<TResponse>(Func<Task<TResponse>> action, CancellationToken cancellationToken = default)
    {
        if (_currentTransaction is not null)
        {
            return await action();
        }

        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            _currentTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var result = await action();
                await SaveChangesAsync(cancellationToken);
                if (_currentTransaction is not null)
                {
                    await _currentTransaction.CommitAsync(cancellationToken);
                }
                return result;
            }
            catch
            {
                if (_currentTransaction is not null)
                {
                    await _currentTransaction.RollbackAsync(cancellationToken);
                }
                throw;
            }
            finally
            {
                if (_currentTransaction is not null)
                {
                    await _currentTransaction.DisposeAsync();
                    _currentTransaction = null;
                }
            }
        });
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction is not null)
        {
            return;
        }

        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            if (_currentTransaction is null)
            {
                _currentTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            }
        });
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await SaveChangesAsync(cancellationToken);
            if (_currentTransaction is not null)
            {
                await _currentTransaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            if (_currentTransaction is not null)
            {
                await _currentTransaction.DisposeAsync();
                _currentTransaction = null;
            }
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_currentTransaction is not null)
            {
                await _currentTransaction.RollbackAsync(cancellationToken);
            }
        }
        finally
        {
            if (_currentTransaction is not null)
            {
                await _currentTransaction.DisposeAsync();
                _currentTransaction = null;
            }
        }
    }

    public void Dispose()
    {
        _context.Dispose();
        _currentTransaction?.Dispose();
    }
}
