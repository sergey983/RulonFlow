namespace RulonFlow.Api.DTOs.ImportReceipts;

public record ImportReceiptGroupedDto(
    Guid Uuid,
    Guid? SupplierUuid,
    string FileName,
    long FileSizeBytes,
    string? DetectedFormat,
    string Status,
    DateTime CreatedAt,
    IReadOnlyList<ImportPalletDto> Pallets
);

public record ImportPalletDto(
    string PalletNumber,
    Guid? PalletTypeUuid,
    int RollCount,
    decimal NetWeightKg,
    decimal GrossWeightKg,
    IReadOnlyList<string> ValidationErrors,
    IReadOnlyList<ImportRowDto> Rows
);