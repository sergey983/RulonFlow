using Microsoft.EntityFrameworkCore;
using RulonFlow.Domain.Entities;
using System.Security.Cryptography.X509Certificates;

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
    public DbSet<Roll> Rolls => Set<Roll>();
    public DbSet<Pallet> Pallets => Set<Pallet>();
    public DbSet<PalletType> PalletTypes => Set<PalletType>();
    public DbSet<StorageZone> StorageZones => Set<StorageZone>();
    public DbSet<StorageLocation> StorageLocations => Set<StorageLocation>();
    public DbSet<ImportFile> ImportFiles => Set<ImportFile>();
    public DbSet<ImportRow> ImportRows => Set<ImportRow>();
    public DbSet<MaterialReceipt> MaterialReceipts => Set<MaterialReceipt>();

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

        modelBuilder.Entity<PalletType>(entity =>
        {
            entity.ToTable("pallet_types");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.LengthMm)
                .HasColumnName("length_mm");

            entity.Property(x => x.WidthMm)
                .HasColumnName("width_mm");

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(255);

            entity.Property(x => x.SortOrder)
                .HasColumnName("sort_order");

            entity.HasIndex(x => x.Name)
                .IsUnique();
        });

        modelBuilder.Entity<Roll>(entity =>
        {
            entity.ToTable("source_rolls");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.RollNumber)
                .HasColumnName("roll_number")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.ReceiptUuid)
                .HasColumnName("receipt_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.FilmTypeUuid)
                .HasColumnName("film_type_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.ThicknessMicron)
                .HasColumnName("thickness_micron");

            entity.Property(x => x.WidthMm)
                .HasColumnName("width_mm");

            entity.Property(x => x.LengthM)
                .HasColumnName("length_m");

            entity.Property(x => x.GrossWeightKg)
                .HasColumnName("gross_weight_kg")
                .HasPrecision(12, 2);

            entity.Property(x => x.NetWeightKg)
                .HasColumnName("net_weight_kg")
                .HasPrecision(12, 2);

            entity.Property(x => x.BatchNumber)
                .HasColumnName("batch_number")
                .HasMaxLength(100);

            entity.Property(x => x.Status)
                .HasColumnName("status")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.PalletUuid)
                .HasColumnName("pallet_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.Comment)
                .HasColumnName("comment")
                .HasMaxLength(1000);

            entity.Property(x => x.CreatedByUuid)
                .HasColumnName("created_by_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.HasIndex(x => x.RollNumber)
                .IsUnique();

            entity.HasOne(x => x.FilmType)
                .WithMany()
                .HasForeignKey(x => x.FilmTypeUuid);

            entity.HasOne(x => x.Pallet)
                .WithMany()
                .HasForeignKey(x => x.PalletUuid);
        });

        modelBuilder.Entity<Pallet>(entity =>
        {
            entity.ToTable("pallets");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.PalletNumber).HasColumnName("pallet_number").HasMaxLength(50).IsRequired();
            entity.Property(x => x.PalletTypeUuid).HasColumnName("pallet_type_uuid").HasMaxLength(36);
            entity.Property(x => x.CurrentLocationUuid).HasColumnName("current_location_uuid").HasMaxLength(36);
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(30).IsRequired();
            entity.Property(x => x.CreatedByUuid).HasColumnName("created_by_uuid").HasMaxLength(36);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.ClosedAt).HasColumnName("closed_at");
            entity.HasIndex(x => x.PalletNumber).IsUnique();

            entity.HasOne(x => x.PalletType)
                .WithMany(x => x.Pallets)
                .HasForeignKey(x => x.PalletTypeUuid);

            entity.HasOne(x => x.CurrentLocation)
                .WithMany(x => x.Pallets)
                .HasForeignKey(x => x.CurrentLocationUuid);
        });

        modelBuilder.Entity<StorageZone>(entity =>
        {
            entity.ToTable("storage_zones");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(255);

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasIndex(x => x.Name)
                .IsUnique();

            entity.HasMany(x => x.Locations)
                .WithOne(x => x.Zone)
                .HasForeignKey(x => x.ZoneUuid);
        });

        modelBuilder.Entity<StorageLocation>(entity =>
        {
            entity.ToTable("storage_locations");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.ZoneUuid)
                .HasColumnName("zone_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(255);

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.IsBlocked)
                .HasColumnName("is_blocked");

            entity.Property(x => x.BlockReason)
                .HasColumnName("block_reason")
                .HasMaxLength(255);

            entity.Property(x => x.MaxPallets)
                .HasColumnName("max_pallets");

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasIndex(x => new { x.ZoneUuid, x.Name })
                .IsUnique();

            entity.HasOne(x => x.Zone)
                .WithMany(x => x.Locations)
                .HasForeignKey(x => x.ZoneUuid);

            entity.HasMany(x => x.Pallets)
                .WithOne(x => x.CurrentLocation)
                .HasForeignKey(x => x.CurrentLocationUuid);
        });

        modelBuilder.Entity<ImportFile>(entity =>
        {
            entity.ToTable("import_files");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.SupplierUuid).HasColumnName("supplier_uuid").HasMaxLength(36);
            entity.Property(x => x.FileName).HasColumnName("file_name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.StoredFilePath).HasColumnName("stored_file_path").HasMaxLength(500).IsRequired();
            entity.Property(x => x.FileSizeBytes).HasColumnName("file_size_bytes");
            entity.Property(x => x.ContentType).HasColumnName("content_type").HasMaxLength(100);
            entity.Property(x => x.DetectedFormat).HasColumnName("detected_format").HasMaxLength(50);
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(30).IsRequired();
            entity.Property(x => x.UploadedByUuid).HasColumnName("uploaded_by_uuid").HasMaxLength(36);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");

            entity.HasOne(x => x.Supplier)
                .WithMany()
                .HasForeignKey(x => x.SupplierUuid);

            entity.HasMany(x => x.Rows)
                .WithOne(x => x.ImportFile)
                .HasForeignKey(x => x.ImportFileUuid);
        });

        modelBuilder.Entity<ImportRow>(entity =>
        {
            entity.ToTable("import_rows");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid).HasColumnName("uuid").HasMaxLength(36);
            entity.Property(x => x.ImportFileUuid).HasColumnName("import_file_uuid").HasMaxLength(36);
            entity.Property(x => x.RowNumber).HasColumnName("row_num");
            entity.Property(x => x.PalletNumber).HasColumnName("pallet_number").HasMaxLength(50);
            entity.Property(x => x.Barcode).HasColumnName("barcode").HasMaxLength(100);
            entity.Property(x => x.SupplierFilmName).HasColumnName("supplier_film_name").HasMaxLength(200);
            entity.Property(x => x.FilmTypeUuid).HasColumnName("film_type_uuid").HasMaxLength(36);
            entity.Property(x => x.ThicknessMicron).HasColumnName("thickness_micron");
            entity.Property(x => x.WidthMm).HasColumnName("width_mm");
            entity.Property(x => x.LengthM).HasColumnName("length_m");
            entity.Property(x => x.RollCount).HasColumnName("roll_count");
            entity.Property(x => x.NetWeightKg).HasColumnName("net_weight_kg").HasPrecision(12, 2);
            entity.Property(x => x.GrossWeightKg).HasColumnName("gross_weight_kg").HasPrecision(12, 2);
            entity.Property(x => x.BatchNumber).HasColumnName("batch_number").HasMaxLength(100);
            entity.Property(x => x.WindDiameterMm).HasColumnName("wind_diameter_mm");
            entity.Property(x => x.SpoolDiameterMm).HasColumnName("spool_diameter_mm");
            entity.Property(x => x.PalletTypeUuid).HasColumnName("pallet_type_uuid").HasMaxLength(36);
            entity.Property(x => x.Comment).HasColumnName("comment").HasMaxLength(1000);
            entity.Property(x => x.IsValid).HasColumnName("is_valid");
            entity.Property(x => x.ValidationErrors).HasColumnName("validation_errors");
            entity.Property(x => x.IsSelected).HasColumnName("is_selected");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.ImportFile).WithMany(x => x.Rows).HasForeignKey(x => x.ImportFileUuid);
            entity.HasOne(x => x.FilmType).WithMany().HasForeignKey(x => x.FilmTypeUuid);
            entity.HasOne(x => x.PalletType).WithMany().HasForeignKey(x => x.PalletTypeUuid).HasConstraintName("FK_import_rows_pallet_types")
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(x => x.PalletTypeUuid).HasDatabaseName("IX_import_rows_pallet_type_uuid");
        });

        modelBuilder.Entity<MaterialReceipt>(entity =>
        {
            entity.ToTable("material_receipts");
            entity.HasKey(x => x.Uuid);

            entity.Property(x => x.Uuid)
                .HasColumnName("uuid")
                .HasMaxLength(36);

            entity.Property(x => x.SupplierUuid)
                .HasColumnName("supplier_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.ReceiptNumber)
                .HasColumnName("receipt_number")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.ReceiptDate)
                .HasColumnName("receipt_date");

            entity.Property(x => x.Comment)
                .HasColumnName("comment");

            entity.Property(x => x.CreatedByUuid)
                .HasColumnName("created_by_uuid")
                .HasMaxLength(36);

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at");
        });

        base.OnModelCreating(modelBuilder);
    }
}