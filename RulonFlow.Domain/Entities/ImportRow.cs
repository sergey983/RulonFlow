namespace RulonFlow.Domain.Entities;

public class ImportRow
{
    public Guid Uuid { get; set; }
    public Guid ImportFileUuid { get; set; }
    public int RowNumber { get; set; }

    public string? PalletNumber { get; set; }
    public string? Barcode { get; set; }
    public string? SupplierFilmName { get; set; }

    public Guid? FilmTypeUuid { get; set; }
    public FilmType? FilmType { get; set; }

    public int? ThicknessMicron { get; set; }
    public int? WidthMm { get; set; }
    public int? LengthM { get; set; }
    public int? RollCount { get; set; }

    public decimal? NetWeightKg { get; set; }
    public decimal? GrossWeightKg { get; set; }

    public string? BatchNumber { get; set; }

    public int? WindDiameterMm { get; set; }
    public int? SpoolDiameterMm { get; set; }

    public Guid? PalletTypeUuid { get; set; }
    public PalletType? PalletType { get; set; }

    public string? Comment { get; set; }

    public bool IsValid { get; set; }
    public string? ValidationErrors { get; set; }
    public bool IsSelected { get; set; }

    public DateTime CreatedAt { get; set; }

    public ImportFile ImportFile { get; set; } = null!;
}