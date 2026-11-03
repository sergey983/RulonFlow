// RulonFlow.Domain/Entities/DefectReason.cs
namespace RulonFlow.Domain.Entities;

public class DefectReason
{
    public Guid Uuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public uint SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}