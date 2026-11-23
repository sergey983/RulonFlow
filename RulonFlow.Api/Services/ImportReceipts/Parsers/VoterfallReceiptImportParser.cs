using ClosedXML.Excel;
using RulonFlow.Domain.Entities;

namespace RulonFlow.Api.Services.ImportReceipts.Parsers;

public class VoterfallReceiptImportParser : IReceiptImportParser
{
    public string FormatName => "Voterfall";

    public bool CanParse(Dictionary<string, int> headers)
    {
        return headers.ContainsKey("ШТРИХ-КОДПАЛЛЕТЫ") &&
               headers.ContainsKey("АРТИКУЛМАТЕРИАЛА");
    }

    public void Fill(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        ImportRow item)
    {
        item.PalletNumber = ExcelCellReader.GetText(row, headers, "Штрих-код паллеты");
        item.Barcode = ExcelCellReader.GetText(row, headers, "Штрих-код паллеты");
        item.BatchNumber = ExcelCellReader.GetText(row, headers, "№ партии");
        item.SupplierFilmName = ExcelCellReader.GetText(row, headers, "Артикул материала");
        item.ThicknessMicron = ExcelCellReader.GetInt(row, headers, "Толщина материала, микрон");
        item.WidthMm = ExcelCellReader.GetInt(row, headers, "Ширина материала, мм");
        item.LengthM = ExcelCellReader.GetInt(row, headers, "Длина материала, м");
        item.NetWeightKg = ExcelCellReader.GetDecimal(row, headers, "Нетто, кг (паллеты), кг");
        item.GrossWeightKg = ExcelCellReader.GetDecimal(row, headers, "Брутто, кг (для паллеты)");
        item.RollCount = ExcelCellReader.GetInt(row, headers, "Число рулонов на паллете");
    }

    public Task SetDefaultsAsync(
        ImportRow item,
        IReadOnlyCollection<PalletType> palletTypes)
    {
        return Task.CompletedTask;
    }
}