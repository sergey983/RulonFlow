-- ============================================================
-- RulonFlow — полная схема базы данных
-- Применяется один раз при первой миграции
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `rulonflow`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `rulonflow`;

-- ========================== ТБЛИЦЫ ==========================

-- -----------------------------------------
-- users — пользователи системы
-- -----------------------------------------
CREATE TABLE `users` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `login` VARCHAR(100) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT NULL,
  `last_login_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_users_login` (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- roles — роли системы
-- -----------------------------------------
CREATE TABLE `roles` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- users_roles — связка пользователей и ролей
-- -----------------------------------------
CREATE TABLE `users_roles` (
  `user_uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `role_uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  PRIMARY KEY (`user_uuid`, `role_uuid`),
  KEY `IX_users_roles_role_uuid` (`role_uuid`),
  CONSTRAINT `FK_users_roles_roles_role_uuid`
    FOREIGN KEY (`role_uuid`) REFERENCES `roles` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `FK_users_roles_users_user_uuid`
    FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- storage_zones — зоны хранения (склады/цеха)
-- -----------------------------------------
CREATE TABLE `storage_zones` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_storage_zones_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- storage_locations — ячейки хранения
-- -----------------------------------------
CREATE TABLE `storage_locations` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `zone_uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_blocked` TINYINT(1) NOT NULL DEFAULT 0,
  `block_reason` VARCHAR(255) DEFAULT NULL,
  `max_pallets` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_storage_locations_zone_uuid_name` (`zone_uuid`, `name`),
  KEY `IX_storage_locations_zone_uuid` (`zone_uuid`),
  CONSTRAINT `FK_storage_locations_storage_zones_zone_uuid`
    FOREIGN KEY (`zone_uuid`) REFERENCES `storage_zones` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- pallet_types — типы поддонов
-- -----------------------------------------
CREATE TABLE `pallet_types` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `length_mm` INT NOT NULL,
  `width_mm` INT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_pallet_types_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- pallets — поддоны
-- -----------------------------------------
CREATE TABLE `pallets` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `pallet_number` VARCHAR(50) NOT NULL,
  `pallet_type_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `current_location_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL,
  `created_by_uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `closed_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_pallets_pallet_number` (`pallet_number`),
  KEY `IX_pallets_pallet_type_uuid` (`pallet_type_uuid`),
  KEY `IX_pallets_current_location_uuid` (`current_location_uuid`),
  CONSTRAINT `FK_pallets_pallet_types_pallet_type_uuid`
    FOREIGN KEY (`pallet_type_uuid`) REFERENCES `pallet_types` (`uuid`) ON DELETE SET NULL,
  CONSTRAINT `FK_pallets_storage_locations_current_location_uuid`
    FOREIGN KEY (`current_location_uuid`) REFERENCES `storage_locations` (`uuid`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- film_types — типы плёнки (бренды)
-- -----------------------------------------
CREATE TABLE `film_types` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `density_gcm3` DECIMAL(6,3) DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_film_types_brand` (`brand`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- film_type_params — параметры типа плёнки
-- -----------------------------------------
CREATE TABLE `film_type_params` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `film_type_uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `thickness_micron` INT NOT NULL,
  `surface` DECIMAL(10,2) DEFAULT NULL,
  `price` DECIMAL(12,2) DEFAULT NULL,
  `currency_code` VARCHAR(10) NOT NULL DEFAULT 'RUB',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_film_type_params_film_type_uuid_thickness_micron` (`film_type_uuid`, `thickness_micron`),
  CONSTRAINT `FK_film_type_params_film_types_film_type_uuid`
    FOREIGN KEY (`film_type_uuid`) REFERENCES `film_types` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- film_brand_aliases — алиасы марок для поставщиков
-- -----------------------------------------
CREATE TABLE `film_brand_aliases` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `supplier_uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `supplier_film_name` VARCHAR(100) NOT NULL,
  `film_type_uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_film_brand_aliases_supplier_uuid_supplier_film_name` (`supplier_uuid`, `supplier_film_name`),
  KEY `IX_film_brand_aliases_film_type_uuid` (`film_type_uuid`),
  CONSTRAINT `FK_film_brand_aliases_film_types_film_type_uuid`
    FOREIGN KEY (`film_type_uuid`) REFERENCES `film_types` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `FK_film_brand_aliases_suppliers_supplier_uuid`
    FOREIGN KEY (`supplier_uuid`) REFERENCES `suppliers` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- suppliers — поставщики
-- -----------------------------------------
CREATE TABLE `suppliers` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `inn` VARCHAR(20) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_suppliers_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- counterparties — контрагенты (ЮЛ)
-- -----------------------------------------
CREATE TABLE `counterparties` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `inn` VARCHAR(20) DEFAULT NULL,
  `kpp` VARCHAR(20) DEFAULT NULL,
  `legal_address_text` VARCHAR(500) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_counterparties_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- defect_reasons — причины дефектов
-- -----------------------------------------
CREATE TABLE `defect_reasons` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` VARCHAR(500) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_defect_reasons_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- material_receipts — поступления на склад
-- -----------------------------------------
CREATE TABLE `material_receipts` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `supplier_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `receipt_number` VARCHAR(100) NOT NULL,
  `receipt_date` DATE NOT NULL,
  `comment` LONGTEXT DEFAULT NULL,
  `created_by_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`uuid`),
  KEY `IX_material_receipts_supplier_uuid` (`supplier_uuid`),
  CONSTRAINT `FK_material_receipts_suppliers_supplier_uuid`
    FOREIGN KEY (`supplier_uuid`) REFERENCES `suppliers` (`uuid`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- source_rolls — рулоны
-- -----------------------------------------
CREATE TABLE `source_rolls` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `roll_number` VARCHAR(50) NOT NULL,
  `receipt_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `film_type_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `thickness_micron` INT NOT NULL,
  `width_mm` INT DEFAULT NULL,
  `length_m` INT DEFAULT NULL,
  `gross_weight_kg` DECIMAL(12,2) DEFAULT NULL,
  `net_weight_kg` DECIMAL(12,2) DEFAULT NULL,
  `batch_number` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL,
  `pallet_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `comment` VARCHAR(1000) DEFAULT NULL,
  `created_by_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `IX_source_rolls_roll_number` (`roll_number`),
  KEY `IX_source_rolls_film_type_uuid` (`film_type_uuid`),
  KEY `IX_source_rolls_pallet_uuid` (`pallet_uuid`),
  CONSTRAINT `FK_source_rolls_film_types_film_type_uuid`
    FOREIGN KEY (`film_type_uuid`) REFERENCES `film_types` (`uuid`) ON DELETE SET NULL,
  CONSTRAINT `FK_source_rolls_pallets_pallet_uuid`
    FOREIGN KEY (`pallet_uuid`) REFERENCES `pallets` (`uuid`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- import_files — файлы импорта
-- -----------------------------------------
CREATE TABLE `import_files` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `supplier_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `stored_file_path` VARCHAR(500) NOT NULL,
  `file_size_bytes` BIGINT NOT NULL,
  `content_type` VARCHAR(100) DEFAULT NULL,
  `detected_format` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL,
  `uploaded_by_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`uuid`),
  KEY `IX_import_files_supplier_uuid` (`supplier_uuid`),
  CONSTRAINT `FK_import_files_suppliers_supplier_uuid`
    FOREIGN KEY (`supplier_uuid`) REFERENCES `suppliers` (`uuid`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------
-- import_rows — строки импорта
-- -----------------------------------------
CREATE TABLE `import_rows` (
  `uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `import_file_uuid` CHAR(36) COLLATE ascii_general_ci NOT NULL,
  `row_num` INT NOT NULL,
  `pallet_number` VARCHAR(50) DEFAULT NULL,
  `barcode` VARCHAR(100) DEFAULT NULL,
  `supplier_film_name` VARCHAR(200) DEFAULT NULL,
  `film_type_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `thickness_micron` INT DEFAULT NULL,
  `width_mm` INT DEFAULT NULL,
  `length_m` INT DEFAULT NULL,
  `roll_count` INT DEFAULT NULL,
  `net_weight_kg` DECIMAL(12,2) DEFAULT NULL,
  `gross_weight_kg` DECIMAL(12,2) DEFAULT NULL,
  `batch_number` VARCHAR(100) DEFAULT NULL,
  `wind_diameter_mm` INT DEFAULT NULL,
  `spool_diameter_mm` INT DEFAULT NULL,
  `pallet_type_uuid` CHAR(36) COLLATE ascii_general_ci DEFAULT NULL,
  `comment` VARCHAR(1000) DEFAULT NULL,
  `is_valid` TINYINT(1) NOT NULL DEFAULT 0,
  `validation_errors` LONGTEXT DEFAULT NULL,
  `is_selected` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`uuid`),
  KEY `IX_import_rows_import_file_uuid` (`import_file_uuid`),
  KEY `IX_import_rows_film_type_uuid` (`film_type_uuid`),
  KEY `IX_import_rows_pallet_type_uuid` (`pallet_type_uuid`),
  CONSTRAINT `FK_import_rows_film_types_film_type_uuid`
    FOREIGN KEY (`film_type_uuid`) REFERENCES `film_types` (`uuid`) ON DELETE SET NULL,
  CONSTRAINT `FK_import_rows_import_files_import_file_uuid`
    FOREIGN KEY (`import_file_uuid`) REFERENCES `import_files` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `FK_import_rows_pallet_types_pallet_type_uuid`
    FOREIGN KEY (`pallet_type_uuid`) REFERENCES `pallet_types` (`uuid`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================== СЕМЕННЫЕ ДАННЫЕ ====================

-- Роли по умолчанию
INSERT INTO `roles` (`uuid`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
('A1B2C3D4-E5F6-4A7B-8C9D-E0F1A2B3C4D5', 'Администратор', 'Полный доступ к системе, управление пользователями и настройками', 1, NOW(), NULL),
('B2C3D4E5-F6A7-4B8C-9D0E-F1A2B3C4D5E6', 'Начальник склада', 'Управление складом, просмотр отчётов, подтверждение поступлений', 1, NOW(), NULL),
('C3D4E5F6-A7B8-4C9D-0E1F-A2B3C4D5E6F7', 'Кладовщик', 'Приёмка, размещение, отгрузка рулонов и поддонов', 1, NOW(), NULL);

-- Администратор (login: admin, password: Admin@123)
-- BCrypt-хеш от "Admin@123" (BCrypt.Net-Next)
INSERT INTO `users` (`uuid`, `login`, `full_name`, `password_hash`, `is_active`, `created_at`, `updated_at`, `last_login_at`) VALUES
(UUID(), 'admin', 'Администратор системы', '$2a$11$K5a.6x8b7y4z5w6v8u9t0s1r2q3p4o5n6m7l8k9j0h1g2f3e4d5c6b7', 1, NOW(), NULL, NULL);

-- Назначение ролей администратору
INSERT INTO `users_roles` (`user_uuid`, `role_uuid`)
SELECT u.uuid, r.uuid FROM `users` u
CROSS JOIN `roles` r
WHERE u.login = 'admin' AND r.name = 'Администратор';

-- ============================================================
-- МИГРАЦИЯ существующего пользователя warehouse1
-- Сохраняет пароль и создаёт запись users_roles с ролью "Кладовщик"
-- ============================================================
INSERT INTO `users` (`uuid`, `login`, `full_name`, `password_hash`, `is_active`, `created_at`, `updated_at`, `last_login_at`)
VALUES ('47c5980f-d6a7-11f1-a1a5-d843aea08c54', 'warehouse1', 'Кладовщик 1', '$2a$11$f4nN.d6vkUDsO5VIUqArg.LcPSUN2kk5Rj9nhqOwFIWzWWFpZxVy.', 1, '2026-11-02 13:22:17.700', NULL, NULL)
ON DUPLICATE KEY UPDATE
  `updated_at` = NOW();

-- Назначение роли "Кладовщик" пользователю warehouse1
INSERT INTO `users_roles` (`user_uuid`, `role_uuid`)
SELECT u.uuid, r.uuid FROM `users` u
CROSS JOIN `roles` r
WHERE u.login = 'warehouse1' AND r.name = 'Кладовщик'
ON DUPLICATE KEY UPDATE `role_uuid` = VALUES(`role_uuid`);

SET FOREIGN_KEY_CHECKS = 1;
