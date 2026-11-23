using ClosedXML.Excel;
using RulonFlow.Domain.Entities;

namespace RulonFlow.Api.Services.ImportReceipts.Parsers;

public class BiaksplenReceiptImportParser : IReceiptImportParser
{
    public string FormatName => "Biaksplen";

    public bool CanParse(Dictionary<string, int> headers)
    {
        return headers.ContainsKey("ПАЛЛЕТА") &&
               headers.ContainsKey("МАРКАПЛЕНКИ");
    }

    public void Fill(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        ImportRow item)
    {
        item.PalletNumber = ExcelCellReader.GetText(row, headers, "Паллета");
        item.SupplierFilmName = ExcelCellReader.GetText(row, headers, "Марка пленки");
        item.ThicknessMicron = ExcelCellReader.GetInt(row, headers, "Толщина пленки");
        item.WidthMm = ExcelCellReader.GetInt(row, headers, "Формат");
        item.RollCount = ExcelCellReader.GetInt(row, headers, "Количество рулонов");
        item.NetWeightKg = ExcelCellReader.GetDecimal(row, headers, "Количество Остаток");
        item.GrossWeightKg = ExcelCellReader.GetDecimal(row, headers, "Вес брутто паллеты");
        item.WindDiameterMm = ExcelCellReader.GetInt(row, headers, "Диаметр намотки");
        item.Comment = ExcelCellReader.GetText(row, headers, "Комментарий заказа");
    }

    public Task SetDefaultsAsync(
        ImportRow item,
        IReadOnlyCollection<PalletType> palletTypes)
    {
        return Task.CompletedTask;
    }
}