using RulonFlow.Api.Services.ImportReceipts.Parsers;

namespace RulonFlow.Api.Services.ImportReceipts;

public class ImportFormatDetector
{
    private readonly List<IReceiptImportParser> _parsers;

    public ImportFormatDetector(IEnumerable<IReceiptImportParser> parsers)
    {
        _parsers = parsers.ToList();
    }

    public string Detect(Dictionary<string, int> headers)
    {
        var parser = _parsers.FirstOrDefault(x => x.CanParse(headers));

        return parser?.FormatName ?? "Manual";
    }
}