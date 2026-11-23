namespace RulonFlow.Domain.Entities;

public class Roll
{
    public Guid Uuid { get; set; }

    public string RollNumber { get; set; } = string.Empty;

    public Guid? ReceiptUuid { get; set; }

    public Guid? FilmTypeUuid { get; set; }
    public int ThicknessMicron { get; set; }

    public int? WidthMm { get; set; }

    public int? LengthM { get; set; }

    public decimal? GrossWeightKg { get; set; }

    public decimal? NetWeightKg { get; set; }

    public string? BatchNumber { get; set; }

    public string Status { get; set; } = string.Empty;

    public Guid? PalletUuid { get; set; }

    public string? Comment { get; set; }

    public Guid? CreatedByUuid { get; set; }

    public DateTime CreatedAt { get; set; }

    public FilmType? FilmType { get; set; }

    public Pallet? Pallet { get; set; }
}