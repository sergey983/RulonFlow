using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Api.DTOs.ImportReceipts;
using RulonFlow.Api.Services.ImportReceipts;
using RulonFlow.Api.Services.ImportReceipts.Parsers;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;
using System.Text.Json;

namespace RulonFlow.Api.Services;

public class ReceiptImportParserService
{
    private readonly RulonFlowDbContext _db;
    private readonly ImportFormatDetector _formatDetector;
    private readonly Dictionary<string, IReceiptImportParser> _parsers;

    public ReceiptImportParserService(
        RulonFlowDbContext db,
        IEnumerable<IReceiptImportParser> parsers)
    {
        _db = db;

        var parserList = parsers.ToList();

        _formatDetector = new ImportFormatDetector(
            parserList.Where(x => x.FormatName != "Manual"));

        _parsers = parserList.ToDictionary(x => x.FormatName);
    }

    public async Task<string> ParseAsync(Guid importFileUuid)
    {
        var importFile = await _db.ImportFiles
            .FirstOrDefaultAsync(x => x.Uuid == importFileUuid)
            ?? throw new InvalidOperationException("Импорт не найден.");

        using var workbook = new XLWorkbook(importFile.StoredFilePath);
        var worksheet = workbook.Worksheets.First();
        var usedRange = worksheet.RangeUsed()
            ?? throw new InvalidOperationException("Файл пустой.");

        var headers = ExcelCellReader.ReadHeaders(usedRange);
        var format = _formatDetector.Detect(headers);

        importFile.DetectedFormat = format;

        var parser = _parsers[format];

        var aliases = await _db.FilmBrandAliases
            .AsNoTracking()
            .Where(x => x.SupplierUuid == importFile.SupplierUuid)
            .ToDictionaryAsync(
                x => ExcelCellReader.NormalizeHeader(x.SupplierFilmName),
                x => x.FilmTypeUuid);

        var palletTypes = await _db.PalletTypes
            .AsNoTracking()
            .ToListAsync();

        var rows = new List<ImportRow>();
        var rowNumber = 1;

        foreach (var row in usedRange.RowsUsed().Skip(1))
        {
            rowNumber++;

            var importRow = new ImportRow
            {
                Uuid = Guid.NewGuid(),
                ImportFileUuid = importFileUuid,
                RowNumber = rowNumber,
                CreatedAt = DateTime.UtcNow,
                IsSelected = true
            };

            var errors = new List<string>();

            parser.Fill(row, headers, importRow);

            if (IsSummaryRow(importRow.PalletNumber, importRow.SupplierFilmName))
                continue;

            await parser.SetDefaultsAsync(
                importRow,
                palletTypes);

            MatchFilmType(importRow, format, aliases, errors);

            importRow.IsValid = errors.Count == 0;
            importRow.ValidationErrors = errors.Count == 0
                ? null
                : JsonSerializer.Serialize(errors);

            rows.Add(importRow);
        }

        await ValidateRollDuplicatesAsync(importFileUuid, rows);

        var existingRows = _db.ImportRows
            .Where(x => x.ImportFileUuid == importFileUuid);

        _db.ImportRows.RemoveRange(existingRows);
        _db.ImportRows.AddRange(rows);

        importFile.Status = rows.Any(x => !x.IsValid)
            ? "validation_failed"
            : "parsed";

        await _db.SaveChangesAsync();

        return format;
    }

    private async Task ValidateRollDuplicatesAsync(
    Guid importFileUuid,
    List<ImportRow> rows)
    {
        var filledRows = rows
            .Where(x => !string.IsNullOrWhiteSpace(x.Barcode))
            .ToList();

        var duplicateRollsInFile = filledRows
            .GroupBy(x => x.Barcode!.Trim())
            .Where(x => x.Count() > 1)
            .SelectMany(x => x)
            .ToHashSet();

        var barcodes = filledRows
            .Select(x => x.Barcode!.Trim())
            .Distinct()
            .ToList();

        var existingRollNumbers = await _db.Rolls
            .AsNoTracking()
            .Where(x => barcodes.Contains(x.RollNumber))
            .Select(x => x.RollNumber)
            .ToListAsync();

        var existingRollNumberSet = existingRollNumbers
            .Select(x => x.Trim())
            .ToHashSet();

        foreach (var row in rows)
        {
            var errors = string.IsNullOrWhiteSpace(row.ValidationErrors)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(
                    row.ValidationErrors!) ?? new List<string>();

            var barcode = row.Barcode?.Trim();

            if (!string.IsNullOrWhiteSpace(barcode))
            {
                if (duplicateRollsInFile.Contains(row))
                {
                    errors.Add("Дубликат штрихкода рулона в файле");
                }

                if (existingRollNumberSet.Contains(barcode))
                {
                    errors.Add("Рулон с таким штрихкодом уже существует");
                }
            }
            
            if (errors.Count > 0)
            {
                row.IsValid = false;
                row.ValidationErrors = JsonSerializer.Serialize(errors);
            }
        }
    }

    private static bool IsSummaryRow(string? palletNumber, string? filmName)
    {
        var pallet = palletNumber?.ToUpperInvariant() ?? string.Empty;
        var film = filmName?.ToUpperInvariant() ?? string.Empty;

        return pallet.Contains("TOTAL") ||
               film.Contains("TOTAL") ||
               pallet.Contains("SUM TOTAL");
    }

    private static void MatchFilmType(
        ImportRow item,
        string format,
        Dictionary<string, Guid> aliases,
        List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(item.SupplierFilmName))
        {
            errors.Add("Не указано название плёнки");
            return;
        }

        var brand = format == "Gettel"
            ? GetGettelBrand(item.SupplierFilmName)
            : item.SupplierFilmName;

        var key = ExcelCellReader.NormalizeHeader(brand);

        if (aliases.TryGetValue(key, out var filmTypeUuid))
        {
            item.FilmTypeUuid = filmTypeUuid;
        }
        else
        {
            errors.Add("Марка не сопоставлена");
        }
    }



    private static string GetGettelBrand(string supplierFilmName)
    {
        var parts = supplierFilmName.Split(
            '-',
            StringSplitOptions.RemoveEmptyEntries);

        return parts.Length > 0
            ? parts[0].Trim()
            : supplierFilmName.Trim();
    }

    public async Task ConfirmAsync(
    Guid importFileUuid,
    Guid createdByUuid,
    ConfirmImportReceiptRequest request)
    {
        var importFile = await _db.ImportFiles
            .Include(x => x.Rows)
            .FirstOrDefaultAsync(x => x.Uuid == importFileUuid)
            ?? throw new InvalidOperationException("Импорт не найден.");

        if (importFile.Status == "confirmed")
        {
            throw new InvalidOperationException(
                "Поступление уже создано по этому импорту.");
        }

        var requestRowUuids = request.Rows
            .Select(x => x.RowUuid)
            .ToHashSet();

        var selectedRows = importFile.Rows
            .Where(x => requestRowUuids.Contains(x.Uuid))
            .ToList();

        if (selectedRows.Count == 0)
        {
            throw new InvalidOperationException(
                "Выберите хотя бы один рулон для создания поступления.");
        }

        if (selectedRows.Any(x => !x.IsValid))
        {
            throw new InvalidOperationException(
                "Невозможно создать поступление: есть строки с ошибками валидации.");
        }

        await using var transaction =
            await _db.Database.BeginTransactionAsync();

        try
        {
            var receipt = new MaterialReceipt
            {
                Uuid = Guid.NewGuid(),
                SupplierUuid = importFile.SupplierUuid,
                ReceiptNumber = $"ИМП-{DateTime.UtcNow:yyyyMMdd-HHmmss}",
                ReceiptDate = DateOnly.FromDateTime(DateTime.UtcNow),
                Comment = "Поступление создано из импортированного файла",
                CreatedByUuid = createdByUuid,
                CreatedAt = DateTime.UtcNow
            };

            _db.MaterialReceipts.Add(receipt);

            var palletsByNumber = new Dictionary<string, Pallet>();

            foreach (var row in selectedRows)
            {
                var palletNumber = row.PalletNumber!.Trim();

                if (!palletsByNumber.TryGetValue(
                        palletNumber,
                        out var pallet))
                {
                    pallet = new Pallet
                    {
                        Uuid = Guid.NewGuid(),
                        PalletNumber = palletNumber,
                        PalletTypeUuid = row.PalletTypeUuid,
                        Status = "open",
                        CreatedByUuid = createdByUuid,
                        CreatedAt = DateTime.UtcNow
                    };

                    _db.Pallets.Add(pallet);
                    palletsByNumber[palletNumber] = pallet;
                }

                if (row.ThicknessMicron is null || row.ThicknessMicron <= 0)
                {
                    throw new InvalidOperationException(
                        $"Для рулона {row.Barcode} не указана толщина материала.");
                }

                var roll = new Roll
                {
                    Uuid = Guid.NewGuid(),
                    RollNumber = row.Barcode!.Trim(),

                    // Главное исправление:
                    ReceiptUuid = receipt.Uuid,

                    FilmTypeUuid = row.FilmTypeUuid,
                    ThicknessMicron = row.ThicknessMicron.Value,
                    WidthMm = row.WidthMm,
                    LengthM = row.LengthM,
                    GrossWeightKg = row.GrossWeightKg,
                    NetWeightKg = row.NetWeightKg,
                    BatchNumber = row.BatchNumber,
                    Status = "received",
                    PalletUuid = pallet.Uuid,
                    Comment = row.Comment,
                    CreatedByUuid = createdByUuid,
                    CreatedAt = DateTime.UtcNow
                };

                _db.Rolls.Add(roll);
            }

            importFile.Status = "confirmed";

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}