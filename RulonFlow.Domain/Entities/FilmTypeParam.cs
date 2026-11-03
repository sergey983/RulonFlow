using System;
using System.Collections.Generic;
using System.Text;

namespace RulonFlow.Domain.Entities
{
    public class FilmTypeParam
    {
        public Guid Uuid { get; set; }
        public Guid FilmTypeUuid { get; set; }
        public int ThicknessMicron { get; set; }
        public decimal? Surface { get; set; }
        public decimal? Price { get; set; }
        public string CurrencyCode { get; set; } = "RUB";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public FilmType FilmType { get; set; } = null!;
    }
}
