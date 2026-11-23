using System.Security.Cryptography.X509Certificates;

namespace RulonFlow.Domain.Entities;

public class StorageZone
{
    public Guid Uuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<StorageLocation> Locations { get; set; } = [];
}