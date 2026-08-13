using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using INK.ERP.Infrastructure.Options;

namespace INK.ERP.Infrastructure.Security.Face;

public interface IFaceTemplateProtectionService
{
    string EncryptEmbedding(string rawVectorData);
    string DecryptEmbedding(string encryptedVectorData);
    string RotateKey(string encryptedVectorData, int newKeyVersion);
    bool ValidatePayloadFormat(string encryptedPayload);
}

public sealed class FaceTemplateProtectionService : IFaceTemplateProtectionService
{
    private readonly EncryptionOptions _options;
    private readonly byte[] _masterKey;

    public FaceTemplateProtectionService(IOptions<EncryptionOptions> options)
    {
        _options = options.Value;
        var masterKeyBytes = Convert.FromBase64String(_options.MasterKey);
        using var sha = SHA256.Create();
        _masterKey = sha.ComputeHash(masterKeyBytes);
    }

    public string EncryptEmbedding(string rawVectorData)
    {
        if (string.IsNullOrWhiteSpace(rawVectorData)) return string.Empty;

        return EncryptWithKeyVersion(rawVectorData, _options.KeyVersion);
    }

    public string DecryptEmbedding(string encryptedVectorData)
    {
        if (string.IsNullOrWhiteSpace(encryptedVectorData)) return string.Empty;
        if (!encryptedVectorData.StartsWith("ENC:")) return encryptedVectorData; // Plaintext fallback

        var parts = encryptedVectorData.Split(':');
        if (parts.Length < 3) return string.Empty;

        int version = 1;
        if (parts[1].StartsWith("v") && int.TryParse(parts[1].Substring(1), out int v))
        {
            version = v;
        }

        var payloadBytes = Convert.FromBase64String(parts[2]);
        var key = DeriveKeyForVersion(version);

        var iv = new byte[16];
        var cipherText = new byte[payloadBytes.Length - 16];

        Buffer.BlockCopy(payloadBytes, 0, iv, 0, 16);
        Buffer.BlockCopy(payloadBytes, 16, cipherText, 0, cipherText.Length);

        using var aes = Aes.Create();
        aes.Key = key;
        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        var decryptedBytes = decryptor.TransformFinalBlock(cipherText, 0, cipherText.Length);

        return Encoding.UTF8.GetString(decryptedBytes);
    }

    public string RotateKey(string encryptedVectorData, int newKeyVersion)
    {
        var decryptedRaw = DecryptEmbedding(encryptedVectorData);
        return EncryptWithKeyVersion(decryptedRaw, newKeyVersion);
    }

    public bool ValidatePayloadFormat(string encryptedPayload)
    {
        if (string.IsNullOrWhiteSpace(encryptedPayload)) return false;
        if (!encryptedPayload.StartsWith("ENC:")) return false;

        var parts = encryptedPayload.Split(':');
        return parts.Length == 3 && parts[1].StartsWith("v") && !string.IsNullOrWhiteSpace(parts[2]);
    }

    private string EncryptWithKeyVersion(string rawVectorData, int keyVersion)
    {
        var key = DeriveKeyForVersion(keyVersion);
        var iv = new byte[16];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(iv);
        }

        using var aes = Aes.Create();
        aes.Key = key;
        aes.IV = iv;

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        var inputBytes = Encoding.UTF8.GetBytes(rawVectorData);
        var encryptedBytes = encryptor.TransformFinalBlock(inputBytes, 0, inputBytes.Length);

        var result = new byte[iv.Length + encryptedBytes.Length];
        Buffer.BlockCopy(iv, 0, result, 0, iv.Length);
        Buffer.BlockCopy(encryptedBytes, 0, result, iv.Length, encryptedBytes.Length);

        return $"ENC:v{keyVersion}:" + Convert.ToBase64String(result);
    }

    private byte[] DeriveKeyForVersion(int version)
    {
        using var sha = SHA256.Create();
        var combined = Encoding.UTF8.GetBytes(_options.MasterKey + "_v" + version);
        return sha.ComputeHash(combined);
    }
}
