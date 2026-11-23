namespace RulonFlow.Api.DTOs.ImportReceipts;

public record ImportRowDto(
    Guid Uuid,
    int RowNumber,
    string? PalletNumber,
    string? Barcode,
    string? SupplierFilmName,
    Guid? FilmTypeUuid,
    string? FilmBrand,
    int? ThicknessMicron,
    int? WidthMm,
    int? LengthM,
    int? RollCount,
    decimal? NetWeightKg,
    decimal? GrossWeightKg,
    string? BatchNumber,
    int? WindDiameterMm,
    int? SpoolDiameterMm,
    string? Comment,
    bool IsValid,
    string? ValidationErrors,
    bool IsSelected
);