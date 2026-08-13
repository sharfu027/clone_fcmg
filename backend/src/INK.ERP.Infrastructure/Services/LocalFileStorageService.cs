using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.Infrastructure.Services;

public sealed class LocalFileStorageService : IFileStorageService
{
    private readonly string _baseStoragePath;

    public LocalFileStorageService()
    {
        // Setup a local directory inside the project root for local file storage
        _baseStoragePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Storage");
        if (!Directory.Exists(_baseStoragePath))
        {
            Directory.CreateDirectory(_baseStoragePath);
        }
    }

    public async Task<string> SaveFileAsync(byte[] content, string fileName, string folderName, CancellationToken cancellationToken = default)
    {
        var targetFolder = Path.Combine(_baseStoragePath, folderName);
        if (!Directory.Exists(targetFolder))
        {
            Directory.CreateDirectory(targetFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var fullPath = Path.Combine(targetFolder, uniqueFileName);

        await File.WriteAllBytesAsync(fullPath, content, cancellationToken);
        return Path.Combine(folderName, uniqueFileName); // Return relative path as fileUrl
    }

    public async Task<byte[]> GetFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        var fullPath = Path.Combine(_baseStoragePath, fileUrl);
        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException("The specified file does not exist.", fullPath);
        }

        return await File.ReadAllBytesAsync(fullPath, cancellationToken);
    }

    public async Task DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        var fullPath = Path.Combine(_baseStoragePath, fileUrl);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        await Task.CompletedTask;
    }
}
