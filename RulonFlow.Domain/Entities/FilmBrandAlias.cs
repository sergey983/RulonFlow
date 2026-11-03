using System;
using System.Collections.Generic;
using System.Text;

namespace RulonFlow.Domain.Entities
{
    public class FilmBrandAlias
    {
        public Guid Uuid { get; set; }
        public Guid SupplierUuid { get; set; }
        public string SupplierFilmName { get; set; } = string.Empty;
        public Guid FilmTypeUuid { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public Supplier Supplier { get; set; } = null!;
        public FilmType FilmType { get; set; } = null!;
    }
}
