namespace RulonFlow.Domain.Entities;

public class ImportFile
{
    public Guid Uuid { get; set; }
    public Guid? SupplierUuid { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoredFilePath { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? ContentType { get; set; }
    public string? DetectedFormat { get; set; }
    public string Status { get; set; } = "uploaded";
    public Guid? UploadedByUuid { get; set; }
    public DateTime CreatedAt { get; set; }

    public Supplier? Supplier { get; set; }
    public List<ImportRow> Rows { get; set; } = [];
}