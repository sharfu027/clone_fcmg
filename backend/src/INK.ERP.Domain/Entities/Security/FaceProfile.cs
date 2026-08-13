using System;
using System.Collections.Generic;
using System.Linq;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Domain.Events.Security;
using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.Domain.Entities.Security;

public sealed class FaceTemplate : AuditableEntity
{
    public int Version { get; private set; }
    public string VectorData { get; private set; } = string.Empty;
    public string AlgorithmVersion { get; private set; } = "v2.1.0";
    public float QualityScore { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime? ArchivedAtUtc { get; private set; }

    // Production Addition #2: Embedding Model Versioning Metadata
    public string ModelName { get; private set; } = "insightface_mobilefacenet";
    public string ModelChecksum { get; private set; } = "sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    public string ModelDate { get; private set; } = "2026-08-01";
    public int EmbeddingDimension { get; private set; } = 512;
    public string Provider { get; private set; } = "CPUExecutionProvider";
    public string NormalizationVersion { get; private set; } = "L2Norm_v1";

    // Production Addition #11: Template Health Score Telemetry
    public int TimesUsed { get; private set; }
    public int SuccessCount { get; private set; }
    public float AverageSimilarity { get; private set; }
    public DateTime? LastSuccessfulLoginUtc { get; private set; }

    private FaceTemplate() { } // EF Core

    public FaceTemplate(int version, FaceEmbedding embedding, string? provider = null, string? checksum = null)
    {
        Id = Guid.Empty;
        Version = version;
        VectorData = embedding.VectorData;
        AlgorithmVersion = embedding.AlgorithmVersion;
        QualityScore = embedding.QualityScore;
        IsActive = true;
        Provider = provider ?? "CPUExecutionProvider";
        ModelChecksum = checksum ?? ModelChecksum;
        EmbeddingDimension = embedding.Dimension > 0 ? embedding.Dimension : 512;
    }

    public void Archive()
    {
        IsActive = false;
        ArchivedAtUtc = DateTime.UtcNow;
    }

    public void RecordUsage(float similarityScore, bool isSuccess)
    {
        TimesUsed++;
        if (isSuccess)
        {
            SuccessCount++;
            LastSuccessfulLoginUtc = DateTime.UtcNow;
            AverageSimilarity = ((AverageSimilarity * (SuccessCount - 1)) + similarityScore) / SuccessCount;
        }
    }
}

public sealed class FaceVerificationLog : BaseEntity
{
    public Guid FaceProfileId { get; private set; }
    public float MatchScore { get; private set; }
    public bool IsSuccessful { get; private set; }
    public string? DeviceId { get; private set; }
    public string? FailureReason { get; private set; }

    private FaceVerificationLog() { }

    public FaceVerificationLog(Guid faceProfileId, float matchScore, bool isSuccessful, string? deviceId = null, string? failureReason = null)
    {
        Id = Guid.Empty;
        FaceProfileId = faceProfileId;
        MatchScore = matchScore;
        IsSuccessful = isSuccessful;
        DeviceId = deviceId;
        FailureReason = failureReason;
    }
}

public sealed class FaceEnrollmentLog : BaseEntity
{
    public int TemplateVersion { get; private set; }
    public FaceEnrollmentStatus Status { get; private set; }
    public string? Notes { get; private set; }

    private FaceEnrollmentLog() { }

    public FaceEnrollmentLog(int templateVersion, FaceEnrollmentStatus status, string? notes = null)
    {
        Id = Guid.Empty;
        TemplateVersion = templateVersion;
        Status = status;
        Notes = notes;
    }
}

public sealed class FaceProfile : AuditableEntity
{
    private readonly List<FaceTemplate> _templates = new();
    private readonly List<FaceVerificationLog> _verificationLogs = new();
    private readonly List<FaceEnrollmentLog> _enrollmentLogs = new();

    public Guid UserId { get; private set; }
    public FaceEnrollmentStatus Status { get; private set; } = FaceEnrollmentStatus.Pending;
    public bool IsActive { get; private set; } = true;
    public int ActiveTemplateVersion { get; private set; }

    public IReadOnlyCollection<FaceTemplate> Templates => _templates.AsReadOnly();
    public IReadOnlyCollection<FaceVerificationLog> VerificationLogs => _verificationLogs.AsReadOnly();
    public IReadOnlyCollection<FaceEnrollmentLog> EnrollmentLogs => _enrollmentLogs.AsReadOnly();

    private FaceProfile() { } // EF Core

    public FaceProfile(Guid userId)
    {
        UserId = userId;
        Status = FaceEnrollmentStatus.Pending;
        IsActive = true;
    }

    public void Enroll(FaceEmbedding embedding)
    {
        if (!IsActive) IsActive = true;

        foreach (var template in _templates.Where(t => t.IsActive))
        {
            template.Archive();
        }

        while (_templates.Count >= 10)
        {
            var oldestArchived = _templates.FirstOrDefault(t => !t.IsActive);
            if (oldestArchived != null) _templates.Remove(oldestArchived);
            else break;
        }

        ActiveTemplateVersion++;
        var newTemplate = new FaceTemplate(ActiveTemplateVersion, embedding);
        _templates.Add(newTemplate);

        Status = FaceEnrollmentStatus.Enrolled;
        _enrollmentLogs.Add(new FaceEnrollmentLog(ActiveTemplateVersion, FaceEnrollmentStatus.Enrolled, "Single Template Enrolled"));
        AddDomainEvent(new FaceEnrolledEvent(UserId, Id, ActiveTemplateVersion));
    }

    // Production Addition #8: Multi-Template Cluster Registration (Stores 5-10 diverse active templates)
    public void EnrollCluster(IEnumerable<FaceEmbedding> embeddings, string? provider = null)
    {
        if (!IsActive) IsActive = true;

        // Archive previous templates
        foreach (var template in _templates.Where(t => t.IsActive))
        {
            template.Archive();
        }

        int addedCount = 0;
        foreach (var embedding in embeddings)
        {
            ActiveTemplateVersion++;
            var newTemplate = new FaceTemplate(ActiveTemplateVersion, embedding, provider);
            _templates.Add(newTemplate);
            addedCount++;
        }

        Status = FaceEnrollmentStatus.Enrolled;
        _enrollmentLogs.Add(new FaceEnrollmentLog(ActiveTemplateVersion, FaceEnrollmentStatus.Enrolled, $"Multi-Template Cluster Enrolled ({addedCount} representative templates)"));
        AddDomainEvent(new FaceEnrolledEvent(UserId, Id, ActiveTemplateVersion));
    }

    // Production Addition #3: Automatic Re-enrollment Template Replacement on High Confidence Logins
    public void AutoReplaceWeakestTemplate(FaceEmbedding newEmbedding, string? provider = null)
    {
        var activeTemplates = _templates.Where(t => t.IsActive).ToList();
        if (activeTemplates.Count < 5)
        {
            ActiveTemplateVersion++;
            _templates.Add(new FaceTemplate(ActiveTemplateVersion, newEmbedding, provider));
            return;
        }

        // Find weakest template based on QualityScore and AverageSimilarity
        var weakest = activeTemplates.OrderBy(t => t.QualityScore + t.AverageSimilarity).FirstOrDefault();
        if (weakest != null)
        {
            weakest.Archive();
            ActiveTemplateVersion++;
            _templates.Add(new FaceTemplate(ActiveTemplateVersion, newEmbedding, provider));
            _enrollmentLogs.Add(new FaceEnrollmentLog(ActiveTemplateVersion, FaceEnrollmentStatus.Enrolled, "Auto-replaced weakest template on high-confidence login"));
        }
    }

    public void ReplaceTemplate(FaceEmbedding newEmbedding)
    {
        Enroll(newEmbedding);
    }

    public void RecordVerification(float matchScore, bool isSuccess, string? deviceId = null, string? failureReason = null)
    {
        if (!IsActive)
        {
            AddDomainEvent(new FaceVerificationFailedEvent(UserId, "Cannot verify inactive face profile."));
            throw new InvalidOperationException("Cannot verify inactive face profile.");
        }

        var log = new FaceVerificationLog(Id, matchScore, isSuccess, deviceId, failureReason);
        _verificationLogs.Add(log);

        if (isSuccess)
        {
            AddDomainEvent(new FaceVerifiedEvent(UserId, matchScore));
        }
        else
        {
            AddDomainEvent(new FaceVerificationFailedEvent(UserId, failureReason ?? "Match score below threshold"));
        }
    }

    public void RemoveAllTemplates()
    {
        foreach (var template in _templates.Where(t => t.IsActive))
        {
            template.Archive();
        }
        Status = FaceEnrollmentStatus.Pending;
        ActiveTemplateVersion = 0;
    }

    public void ArchiveTemplate(int version)
    {
        var template = _templates.FirstOrDefault(t => t.Version == version);
        if (template != null && template.IsActive)
        {
            template.Archive();
        }
        if (!_templates.Any(t => t.IsActive))
        {
            Status = FaceEnrollmentStatus.Pending;
            ActiveTemplateVersion = 0;
        }
    }

    public void Deactivate()
    {
        IsActive = false;
        Status = FaceEnrollmentStatus.Deactivated;
    }

    public void Reactivate()
    {
        IsActive = true;
        Status = _templates.Any(t => t.IsActive) ? FaceEnrollmentStatus.Enrolled : FaceEnrollmentStatus.Pending;
    }
}
