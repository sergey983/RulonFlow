namespace RulonFlow.Domain.Entities;

public class Pallet
{
    public Guid Uuid { get; set; }
    public string PalletNumber { get; set; } = string.Empty;
    public Guid? PalletTypeUuid { get; set; }
    public Guid? CurrentLocationUuid { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid CreatedByUuid { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    public PalletType? PalletType { get; set; }
    public StorageLocation? CurrentLocation { get; set; }
}