using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.Application.Features.Security.Face.DTOs;

public sealed record FaceEmbeddingResult(
    FaceEmbedding Embedding,
    float QualityScore,
    string ModelVersion,
    int EmbeddingDimension,
    TimeSpan ProcessingTime,
    string EmbeddingProvider,
    string ModelChecksum,
    string InferenceDevice,
    string ProcessingVersion,
    IReadOnlyCollection<string> Warnings);
