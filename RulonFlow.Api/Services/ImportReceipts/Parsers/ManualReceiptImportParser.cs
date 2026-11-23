using ClosedXML.Excel;
using RulonFlow.Domain.Entities;

namespace RulonFlow.Api.Services.ImportReceipts.Parsers;

public class ManualReceiptImportParser : IReceiptImportParser
{
    public string FormatName => "Manual";

    public bool CanParse(Dictionary<string, int> headers)
    {
        // Ручной режим — резервный, выбирается последним.
        return true;
    }

    public void Fill(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        ImportRow item)
    {
        item.SupplierFilmName = FindFirstText(row, headers);
        item.Comment = "Формат не распознан: требуется ручное сопоставление";
        item.IsSelected = false;
    }

    public Task SetDefaultsAsync(
        ImportRow item,
        IReadOnlyCollection<PalletType> palletTypes)
    {
        return Task.CompletedTask;
    }

    private static string? FindFirstText(
        IXLRangeRow row,
        Dictionary<string, int> headers)
    {
        foreach (var column in headers.Values.OrderBy(x => x))
        {
            var value = row.Worksheet
                .Cell(row.RowNumber(), column)
                .GetString()
                .Trim();

            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }
}