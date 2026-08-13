namespace INK.ERP.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(byte[] content, string fileName, string folderName, CancellationToken cancellationToken = default);
    Task<byte[]> GetFileAsync(string fileUrl, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default);
}
