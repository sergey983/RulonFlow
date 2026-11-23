using ClosedXML.Excel;
using RulonFlow.Domain.Entities;

namespace RulonFlow.Api.Services.ImportReceipts.Parsers;

public interface IReceiptImportParser
{
    string FormatName { get; }

    bool CanParse(Dictionary<string, int> headers);

    void Fill(
        IXLRangeRow row,
        Dictionary<string, int> headers,
        ImportRow item);

    Task SetDefaultsAsync(
        ImportRow item,
        IReadOnlyCollection<PalletType> palletTypes);
}