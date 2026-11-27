﻿﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RulonFlow.Api.DTOs.ImportReceipts;
using RulonFlow.Api.Services;
using RulonFlow.Domain.Entities;
using RulonFlow.Infrastructure.Persistence;
using System.Security.Claims;

namespace RulonFlow.Api.Controllers;

public record ImportFileDto(
    Guid Uuid,
    Guid? SupplierUuid,
    string FileName,
    long FileSizeBytes,
    string? DetectedFormat,
    string Status,
    DateTime CreatedAt
);

[ApiController]
[Route("api/v1/import/receipts")]
[Authorize]
public class ImportReceiptsController : ControllerBase
{
    private readonly RulonFlowDbContext _db;
    private readonly IWebHostEnvironment _environment;
    private readonly ReceiptImportParserService _parser;

    public ImportReceiptsController(
        RulonFlowDbContext db,
        IWebHostEnvironment environment,
        ReceiptImportParserService parser)
    {
        _db = db;
        _environment = environment;
        _parser = parser;
    }

    [HttpPost("file")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile file,
        [FromForm] Guid? supplierUuid)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Выберите файл."
                }
            });
        }

        var allowedExtensions = new[] { ".xlsx", ".xls", ".csv" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Поддерживаются файлы XLSX, XLS и CSV."
                }
            });
        }

        var importsFolder = Path.Combine(
            _environment.ContentRootPath,
            "App_Data",
            "receipt-imports");

        Directory.CreateDirectory(importsFolder);

        var storedFileName = $"{Guid.NewGuid()}{extension}";
        var storedFilePath = Path.Combine(importsFolder, storedFileName);

        await using (var stream = System.IO.File.Create(storedFilePath))
        {
            await file.CopyToAsync(stream);
        }

        var item = new ImportFile
        {
            Uuid = Guid.NewGuid(),
            SupplierUuid = supplierUuid,
            FileName = file.FileName,
            StoredFilePath = storedFilePath,
            FileSizeBytes = file.Length,
            ContentType = file.ContentType,
            DetectedFormat = null,
            Status = "uploaded",
            UploadedByUuid = null,
            CreatedAt = DateTime.UtcNow
        };

        _db.ImportFiles.Add(item);
        await _db.SaveChangesAsync();

        return Ok(new ImportFileDto(
            item.Uuid,
            item.SupplierUuid,
            item.FileName,
            item.FileSizeBytes,
            item.DetectedFormat,
            item.Status,
            item.CreatedAt
        ));
    }

    [HttpPost("{uuid:guid}/parse")]
    public async Task<IActionResult> Parse(Guid uuid)
    {
        try
        {
            var format = await _parser.ParseAsync(uuid);

            return Ok(new
            {
                uuid,
                detectedFormat = format,
                status = "parsed"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "IMPORT_PARSE_ERROR",
                    message = ex.Message
                }
            });
        }
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> Get(Guid uuid)
    {
        var item = await _db.ImportFiles
            .AsNoTracking()
            .Include(x => x.Rows)
                .ThenInclude(x => x.FilmType)
            .FirstOrDefaultAsync(x => x.Uuid == uuid);

        if (item is null)
        {
            return NotFound(new
            {
                error = new
                {
                    code = "IMPORT_NOT_FOUND",
                    message = "Импорт не найден."
                }
            });
        }

        var rows = item.Rows
            .OrderBy(x => x.RowNumber)
            .ToList();

        var palletGroups = rows
            .Where(x => !string.IsNullOrWhiteSpace(x.PalletNumber))
            .GroupBy(
                x => x.PalletNumber!.Trim(),
                StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x.Key)
            .ToList();

        var palletNumbers = palletGroups
            .Select(x => x.Key)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existingPalletNumbers = await _db.Pallets
            .AsNoTracking()
            .Where(x => palletNumbers.Contains(x.PalletNumber))
            .Select(x => x.PalletNumber)
            .ToListAsync();

        var existingPalletNumberSet = existingPalletNumbers
            .Select(x => x.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var pallets = palletGroups
            .Select(group =>
            {
                var groupRows = group.ToList();

                var netWeight = groupRows.Sum(
                    x => x.NetWeightKg ?? 0m);

                var grossWeight = netWeight * GettelPalletGrossCoefficient;

                var palletErrors = new List<string>();

                if (existingPalletNumberSet.Contains(group.Key))
                {
                    palletErrors.Add(
                        "Паллета с таким номером уже существует");
                }

                return new ImportPalletDto(
                    group.Key,
                    groupRows
                        .Select(x => x.PalletTypeUuid)
                        .FirstOrDefault(x => x.HasValue),
                    groupRows.Sum(x => x.RollCount ?? 0),
                    Math.Round(netWeight, 2),
                    Math.Round(grossWeight, 2),
                    palletErrors,
                    groupRows
                        .Select(ToDto)
                        .ToList()
                );
            })
            .ToList();

        return Ok(new ImportReceiptGroupedDto(
            item.Uuid,
            item.SupplierUuid,
            item.FileName,
            item.FileSizeBytes,
            item.DetectedFormat,
            item.Status,
            item.CreatedAt,
            pallets
        ));
    }
    [HttpPost("{uuid:guid}/confirm")]
    public async Task<IActionResult> Confirm(
    Guid uuid,
    [FromBody] ConfirmImportReceiptRequest request)
    {
        var createdByUuid = GetCurrentUserUuid();

        if (createdByUuid is null)
        {
            return Unauthorized(new
            {
                error = new
                {
                    code = "UNAUTHORIZED",
                    message = "Пользователь не авторизован."
                }
            });
        }

        try
        {
            await _parser.ConfirmAsync(
                uuid,
                createdByUuid.Value,
                request);

            return Ok(new
            {
                uuid,
                status = "confirmed"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                error = new
                {
                    code = "IMPORT_CONFIRM_ERROR",
                    message = ex.Message
                }
            });
        }
    }

    private Guid? GetCurrentUserUuid()
    {
        var value =
            User.FindFirst("sub")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("nameid")?.Value;

        return Guid.TryParse(value, out var uuid)
            ? uuid
            : null;
    }
    private static ImportRowDto ToDto(ImportRow row)
    {
        return new ImportRowDto(
            row.Uuid,
            row.RowNumber,
            row.PalletNumber,
            row.Barcode,
            row.SupplierFilmName,
            row.FilmTypeUuid,
            row.FilmType?.Brand,
            row.ThicknessMicron,
            row.WidthMm,
            row.LengthM,
            row.RollCount,
            row.NetWeightKg,
            row.GrossWeightKg,
            row.BatchNumber,
            row.WindDiameterMm,
            row.SpoolDiameterMm,
            row.Comment,
            row.IsValid,
            row.ValidationErrors,
            row.IsSelected
        );
    }

    private const decimal GettelPalletGrossCoefficient = 1.0765m;
}