using ClosedXML.Excel;
using RulonFlow.Domain.Entities;

namespace RulonFlow.Api.Services.ImportReceipts.Parsers;

public class GettelReceiptImportParser : IReceiptImportParser
{
    private const int GettelSpoolDiameterMm = 152;

    public string FormatName => "Gettel";

    public bool CanParse(Dictionary<string, int> headers)
    {
        return headers.ContainsKey("PALLETNO") &&
               headers.ContainsKey("NETWEIGHTKGSROLL");
    }

    public void Fill(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        ImportRow item)
    {
        item.PalletNumber = ExcelCellReader.GetText(row, headers, "PALLET NO.");
        item.Barcode = ExcelCellReader.GetText(row, headers, "BAR CODE");
        item.SupplierFilmName = ExcelCellReader.GetText(row, headers, "DESCRIPTION");
        item.WidthMm = ExcelCellReader.GetInt(row, headers, "WIDTH(MM)");
        item.LengthM = ExcelCellReader.GetInt(row, headers, "LENGTH(M)");
        item.RollCount = ExcelCellReader.GetInt(row, headers, "NO OF ROLLS");
        item.BatchNumber = ExcelCellReader.GetText(row, headers, "LOT NO.");

        item.NetWeightKg = ExcelCellReader.GetDecimal(row, headers, "NET WEIGHT(KGS)/ROLL");
        item.GrossWeightKg = null;

        item.WindDiameterMm = null;
        item.SpoolDiameterMm = GettelSpoolDiameterMm;

        ParseFilmName(item);
    }

    public Task SetDefaultsAsync(
        ImportRow item,
        IReadOnlyCollection<PalletType> palletTypes)
    {
        if (item.PalletTypeUuid.HasValue)
            return Task.CompletedTask;

        var palletType = palletTypes.FirstOrDefault(x =>
            x.LengthMm == 1100 &&
            x.WidthMm == 1100 );

        if (palletType is not null)
        {
            item.PalletTypeUuid = palletType.Uuid;
        }

        return Task.CompletedTask;
    }

    private static void ParseFilmName(ImportRow item)
    {
        if (string.IsNullOrWhiteSpace(item.SupplierFilmName))
            return;

        var parts = item.SupplierFilmName.Split(
            '-',
            StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length < 2)
            return;

        var brand = parts[0].Trim();
        var thicknessText = parts[1].Trim();

        if (int.TryParse(thicknessText, out var thicknessMicron))
        {
            item.ThicknessMicron = thicknessMicron;
            item.Comment = $"Gettel: марка {brand}, толщина {thicknessMicron} мкм";
        }
        else
        {
            item.Comment = $"Gettel: марка {brand}, толщина не распознана ({thicknessText})";
        }
    }
}