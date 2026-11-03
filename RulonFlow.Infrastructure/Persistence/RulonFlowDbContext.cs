using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;

namespace RulonFlow.Infrastructure.Persistence;

public class RulonFlowDbContext : DbContext
{
    public RulonFlowDbContext(DbContextOptions<RulonFlowDbContext> options)
        : base(options)
    {
    }

    public DbSet<FilmType> FilmTypes => Set<FilmType>();
    public DbSet<FilmTypeParam> FilmTypeParams => Set<FilmTypeParam>();
    public DbSet<FilmBrandAlias> FilmBrandAliases => Set<FilmBrandAlias>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Counterparty> Counterparties => Set<Counterparty>();
    public DbSet<DefectReason> DefectReasons => Set<DefectReason>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FilmType>(entity =>
        {
            entity.ToTable("film_types");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.Brand)
                .HasColumnName("brand")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.DisplayName)
                .HasColumnName("display_name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.DensityGcm3)
                .HasColumnName("density_gcm3")
                .HasPrecision(6, 3);

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(255);

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasIndex(x => x.Brand)
                .IsUnique();

            entity.HasMany(x => x.Params)
                .WithOne(x => x.FilmType)
                .HasForeignKey(x => x.FilmTypeUuid)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FilmTypeParam>(entity =>
        {
            entity.ToTable("film_type_params");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.FilmTypeUuid)
                .HasColumnName("film_type_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.ThicknessMicron)
                .HasColumnName("thickness_micron");

            entity.Property(x => x.Surface)
                .HasColumnName("surface")
                .HasPrecision(10, 2);

            entity.Property(x => x.Price)
                .HasColumnName("price")
                .HasPrecision(12, 2);

            entity.Property(x => x.CurrencyCode)
                .HasColumnName("currency_code")
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasIndex(x => new { x.FilmTypeUuid, x.ThicknessMicron })
                .IsUnique();
        });

        modelBuilder.Entity<FilmBrandAlias>(entity =>
        {
            entity.ToTable("film_brand_aliases");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.SupplierUuid)
                .HasColumnName("supplier_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.SupplierFilmName)
                .HasColumnName("supplier_film_name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.FilmTypeUuid)
                .HasColumnName("film_type_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasOne(x => x.Supplier)
                .WithMany()
                .HasForeignKey(x => x.SupplierUuid);

            entity.HasOne(x => x.FilmType)
                .WithMany()
                .HasForeignKey(x => x.FilmTypeUuid);

            entity.HasIndex(x => new { x.SupplierUuid, x.SupplierFilmName })
                .IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.Login).HasColumnName("login").HasMaxLength(100).IsRequired();
            entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.Role).HasColumnName("role").HasMaxLength(50).IsRequired();
            entity.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(255);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.Property(x => x.LastLoginAt).HasColumnName("last_login_at");

            entity.HasIndex(x => x.Login).IsUnique();
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.ToTable("suppliers");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.Inn).HasColumnName("inn").HasMaxLength(20);
            entity.Property(x => x.IsActive).HasColumnName("is_active");

            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<Counterparty>(entity =>
        {
            entity.ToTable("counterparties");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.Inn).HasColumnName("inn").HasMaxLength(20);
            entity.Property(x => x.Kpp).HasColumnName("kpp").HasMaxLength(20);
            entity.Property(x => x.LegalAddressText).HasColumnName("legal_address_text").HasMaxLength(500);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<DefectReason>(entity =>
        {
            entity.ToTable("defect_reasons");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.SortOrder).HasColumnName("sort_order");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            entity.HasIndex(x => x.Name).IsUnique();
        });

        base.OnModelCreating(modelBuilder);
    }
}