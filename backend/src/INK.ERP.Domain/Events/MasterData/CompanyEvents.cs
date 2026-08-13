using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Events.MasterData;

public record CompanyCreatedEvent(Company Company, string ExecutedBy, DateTime TriggeredAtUtc) : IDomainEvent
{
    public CompanyCreatedEvent(Company company, string executedBy) 
        : this(company, executedBy, DateTime.UtcNow) { }
}

public record CompanyUpdatedEvent(Company Company, string ExecutedBy, DateTime TriggeredAtUtc) : IDomainEvent
{
    public CompanyUpdatedEvent(Company company, string executedBy) 
        : this(company, executedBy, DateTime.UtcNow) { }
}

public record CompanyArchivedEvent(Company Company, string ExecutedBy, DateTime TriggeredAtUtc) : IDomainEvent
{
    public CompanyArchivedEvent(Company company, string executedBy) 
        : this(company, executedBy, DateTime.UtcNow) { }
}

public record CompanyRestoredEvent(Company Company, string ExecutedBy, DateTime TriggeredAtUtc) : IDomainEvent
{
    public CompanyRestoredEvent(Company company, string executedBy) 
        : this(company, executedBy, DateTime.UtcNow) { }
}

public record CompanyDeletedEvent(Guid CompanyId, string Code, string ExecutedBy, DateTime TriggeredAtUtc) : IDomainEvent
{
    public CompanyDeletedEvent(Guid companyId, string code, string executedBy) 
        : this(companyId, code, executedBy, DateTime.UtcNow) { }
}
