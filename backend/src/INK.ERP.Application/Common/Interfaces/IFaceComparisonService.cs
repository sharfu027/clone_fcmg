namespace INK.ERP.Application.Common.Interfaces;

public record FaceComparisonResult(
    float SimilarityScore,
    bool IsMatch,
    float Confidence,
    double EuclideanDistance);

public interface IFaceComparisonService
{
    FaceComparisonResult Compare(float[] vectorA, float[] vectorB);
    FaceComparisonResult Compare(string vectorDataA, string vectorDataB);
}
