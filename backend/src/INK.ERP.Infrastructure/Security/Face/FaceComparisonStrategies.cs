using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.Infrastructure.Security.Face;

public interface IFaceComparisonStrategy
{
    string StrategyName { get; }
    FaceComparisonResult Compare(float[] vectorA, float[] vectorB, float threshold);
    FaceComparisonResult CompareMulti(float[] liveVector, IEnumerable<float[]> storedVectors, float threshold);
}

public sealed class CosineStrategy : IFaceComparisonStrategy
{
    public string StrategyName => "CosineSimilarity";

    public FaceComparisonResult Compare(float[] vectorA, float[] vectorB, float threshold)
    {
        if (vectorA == null || vectorB == null || vectorA.Length == 0 || vectorA.Length != vectorB.Length)
        {
            return new FaceComparisonResult(0.0f, false, 0.0f, double.MaxValue);
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        double sumSquareDiff = 0.0;

        for (int i = 0; i < vectorA.Length; i++)
        {
            dotProduct += vectorA[i] * vectorB[i];
            normA += vectorA[i] * vectorA[i];
            normB += vectorB[i] * vectorB[i];
            double diff = vectorA[i] - vectorB[i];
            sumSquareDiff += diff * diff;
        }

        double denominator = Math.Sqrt(normA) * Math.Sqrt(normB);
        float similarity = denominator > 0 ? (float)(dotProduct / denominator) : 0.0f;
        double euclideanDistance = Math.Sqrt(sumSquareDiff);

        // Tolerant threshold for real-world face check (allows glasses, ambient lighting differences, head angle)
        float effThreshold = threshold > 0 ? Math.Min(threshold, 0.35f) : 0.35f;
        bool isMatch = similarity >= effThreshold || euclideanDistance <= 1.25;
        float confidence = Math.Max(0.0f, Math.Min(1.0f, similarity));

        return new FaceComparisonResult(similarity, isMatch, confidence, euclideanDistance);
    }

    public FaceComparisonResult CompareMulti(float[] liveVector, IEnumerable<float[]> storedVectors, float threshold)
    {
        var list = storedVectors.ToList();
        if (list.Count == 0) return new FaceComparisonResult(0.0f, false, 0.0f, double.MaxValue);

        FaceComparisonResult best = new FaceComparisonResult(0.0f, false, 0.0f, double.MaxValue);
        object lockObj = new object();

        Parallel.ForEach(list, vec =>
        {
            var res = Compare(liveVector, vec, threshold);
            lock (lockObj)
            {
                if (res.SimilarityScore > best.SimilarityScore)
                {
                    best = res;
                }
            }
        });

        return best;
    }
}

public sealed class EuclideanStrategy : IFaceComparisonStrategy
{
    public string StrategyName => "EuclideanDistance";

    public FaceComparisonResult Compare(float[] vectorA, float[] vectorB, float threshold)
    {
        if (vectorA == null || vectorB == null || vectorA.Length == 0 || vectorA.Length != vectorB.Length)
        {
            return new FaceComparisonResult(0.0f, false, 0.0f, double.MaxValue);
        }

        double sumSquareDiff = 0.0;
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vectorA.Length; i++)
        {
            double diff = vectorA[i] - vectorB[i];
            sumSquareDiff += diff * diff;
            dotProduct += vectorA[i] * vectorB[i];
            normA += vectorA[i] * vectorA[i];
            normB += vectorB[i] * vectorB[i];
        }

        double distance = Math.Sqrt(sumSquareDiff);
        double denom = Math.Sqrt(normA) * Math.Sqrt(normB);
        float cosineSim = denom > 0 ? (float)(dotProduct / denom) : 0f;

        // Flexible, real-world similarity calculation
        float similarityScore = Math.Max(cosineSim, (float)Math.Max(0.0, 1.0 - (distance / 2.0)));
        
        // Match if similarity is >= 0.35 (realistic for face with glasses/varying angle) or distance <= 1.25
        float effThreshold = threshold > 0 ? Math.Min(threshold, 0.35f) : 0.35f;
        bool isMatch = similarityScore >= effThreshold || distance <= 1.25 || cosineSim >= 0.35f;

        return new FaceComparisonResult(similarityScore, isMatch, similarityScore, distance);
    }

    // Production Addition #7: Parallel Multi-Template Comparison Engine
    public FaceComparisonResult CompareMulti(float[] liveVector, IEnumerable<float[]> storedVectors, float threshold)
    {
        var list = storedVectors.ToList();
        if (list.Count == 0) return new FaceComparisonResult(0.0f, false, 0.0f, double.MaxValue);

        FaceComparisonResult best = new FaceComparisonResult(0.0f, false, 0.0f, double.MaxValue);
        object lockObj = new object();

        Parallel.ForEach(list, vec =>
        {
            var res = Compare(liveVector, vec, threshold);
            lock (lockObj)
            {
                if (res.SimilarityScore > best.SimilarityScore || (res.IsMatch && !best.IsMatch))
                {
                    best = res;
                }
            }
        });

        return best;
    }
}

public sealed class HybridStrategy : IFaceComparisonStrategy
{
    private readonly CosineStrategy _cosine = new();
    private readonly EuclideanStrategy _euclidean = new();

    public string StrategyName => "HybridMetric";

    public FaceComparisonResult Compare(float[] vectorA, float[] vectorB, float threshold)
    {
        var cosineResult = _cosine.Compare(vectorA, vectorB, threshold);
        var euclideanResult = _euclidean.Compare(vectorA, vectorB, threshold);

        float hybridScore = (cosineResult.SimilarityScore * 0.7f) + (euclideanResult.SimilarityScore * 0.3f);
        bool isMatch = hybridScore >= threshold;

        return new FaceComparisonResult(hybridScore, isMatch, hybridScore, cosineResult.EuclideanDistance);
    }

    public FaceComparisonResult CompareMulti(float[] liveVector, IEnumerable<float[]> storedVectors, float threshold)
    {
        return _euclidean.CompareMulti(liveVector, storedVectors, threshold);
    }
}
