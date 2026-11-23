namespace RulonFlow.Domain.Entities;

public class StorageLocation
{
    public Guid Uuid { get; set; }
    public Guid ZoneUuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public int MaxPallets { get; set; } = 1;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public StorageZone Zone { get; set; } = null!;
    public List<Pallet> Pallets { get; set; } = [];
}