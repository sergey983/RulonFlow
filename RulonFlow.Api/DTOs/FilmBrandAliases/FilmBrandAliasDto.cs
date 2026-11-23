namespace RulonFlow.Api.DTOs.FilmBrandAliases;

public record FilmBrandAliasDto(
    Guid Uuid,
    Guid SupplierUuid,
    string SupplierName,
    string SupplierFilmName,
    Guid FilmTypeUuid,
    string FilmBrand,
    bool IsActive
);