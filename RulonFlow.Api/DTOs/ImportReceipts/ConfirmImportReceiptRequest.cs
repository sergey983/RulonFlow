namespace RulonFlow.Api.DTOs.ImportReceipts;

public record ConfirmImportReceiptRequest(
    IReadOnlyList<ConfirmImportRowRequest> Rows
);

public record ConfirmImportRowRequest(
    Guid RowUuid,
    string PalletNumber,
    Guid FilmTypeUuid,
    Guid? PalletTypeUuid,
    int ThicknessMicron,
    int WidthMm,
    int LengthM,
    int RollCount,
    decimal NetWeightKg,
    string? BatchNumber
);