using ClosedXML.Excel;
using System.Globalization;

namespace RulonFlow.Api.Services.ImportReceipts;

public static class ExcelCellReader
{
    public static Dictionary<string, int> ReadHeaders(IXLRange usedRange)
    {
        var headers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var headerRow = usedRange.FirstRow();

        foreach (var cell in headerRow.CellsUsed())
        {
            var header = NormalizeHeader(cell.GetString());

            if (!string.IsNullOrWhiteSpace(header))
                headers[header] = cell.Address.ColumnNumber;
        }

        return headers;
    }

    public static string NormalizeHeader(string value)
    {
        return value
            .Trim()
            .ToUpperInvariant()
            .Replace(" ", "")
            .Replace("\u00A0", "")
            .Replace("(", "")
            .Replace(")", "")
            .Replace("/", "")
            .Replace(".", "")
            .Replace(",", "");
    }

    public static string NormalizeTypeName(string value)
    {
        return value
            .Trim()
            .ToUpperInvariant()
            .Replace(" ", "")
            .Replace("\u00A0", "")
            .Replace("-", "")
            .Replace("*", "X")
            .Replace("×", "X")
            .Replace("Х", "X");
    }

    public static string? GetText(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        string header)
    {
        var normalized = NormalizeHeader(header);

        if (!headers.TryGetValue(normalized, out var column))
            return null;

        var cell = row.Worksheet.Cell(row.RowNumber(), column);
        var value = cell.GetString().Trim();

        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    public static int? GetInt(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        string header)
    {
        var value = GetText(row, headers, header);

        return int.TryParse(value, out var result) ? result : null;
    }

    public static decimal? GetDecimal(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        string header)
    {
        var value = GetText(row, headers, header);

        if (string.IsNullOrWhiteSpace(value))
            return null;

        value = value
            .Replace("\u00A0", "")
            .Replace(" ", "")
            .Replace(",", ".");

        return decimal.TryParse(
            value,
            NumberStyles.Any,
            CultureInfo.InvariantCulture,
            out var result)
            ? result
            : null;
    }
}