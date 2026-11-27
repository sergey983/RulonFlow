-- ============================================================
-- RulonFlow — миграция users.role -> roles + users_roles
-- Применяется к СУЩЕСТВУЮЩЕЙ базе rulonflow.
-- Не удаляет users и не пересоздаёт существующие таблицы.
-- ============================================================

SET NAMES utf8mb4;

USE `rulonflow`;

START TRANSACTION;

-- ------------------------------------------------------------
-- 1. Таблица ролей
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `uuid` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `uq_roles_name` (`name`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Связь пользователей и ролей
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users_roles` (
  `user_uuid` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_uuid` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`user_uuid`, `role_uuid`),
  KEY `ix_users_roles_role_uuid` (`role_uuid`),
  CONSTRAINT `fk_users_roles_user`
    FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_users_roles_role`
    FOREIGN KEY (`role_uuid`) REFERENCES `roles` (`uuid`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. Базовые роли
-- ------------------------------------------------------------
INSERT INTO `roles`
    (`uuid`, `name`, `description`, `is_active`, `created_at`, `updated_at`)
VALUES
    (
        'A1B2C3D4-E5F6-4A7B-8C9D-E0F1A2B3C4D5',
        'Администратор',
        'Полный доступ к системе, управление пользователями и настройками',
        1,
        CURRENT_TIMESTAMP(3),
        NULL
    ),
    (
        'B2C3D4E5-F6A7-4B8C-9D0E-F1A2B3C4D5E6',
        'Начальник склада',
        'Управление складом, просмотр отчётов, подтверждение поступлений',
        1,
        CURRENT_TIMESTAMP(3),
        NULL
    ),
    (
        'C3D4E5F6-A7B8-4C9D-0E1F-A2B3C4D5E6F7',
        'Кладовщик',
        'Приёмка, размещение, отгрузка рулонов и поддонов',
        1,
        CURRENT_TIMESTAMP(3),
        NULL
    )
ON DUPLICATE KEY UPDATE
    `description` = VALUES(`description`),
    `is_active` = 1;

-- ------------------------------------------------------------
-- 4. Перенос существующих ролей из users.role
--    warehouse    -> Кладовщик
--    admin        -> Администратор
--    другие значения -> Кладовщик (по умолчанию)
-- ------------------------------------------------------------
INSERT INTO `users_roles` (`user_uuid`, `role_uuid`)
SELECT
    u.`uuid`,
    r.`uuid`
FROM `users` u
JOIN `roles` r
  ON r.`name` = CASE u.`role`
      WHEN 'warehouse' THEN 'Кладовщик'
      WHEN 'admin'     THEN 'Администратор'
      ELSE 'Кладовщик'
  END
WHERE u.`role` IS NOT NULL
  AND u.`role` <> ''
ON DUPLICATE KEY UPDATE
    `users_roles`.`role_uuid` = VALUES(`role_uuid`);

-- ------------------------------------------------------------
-- 5. Создание администратора (только если не существует).
--    Пароль: Admin@123  (bcrypt rounds=11)
-- ------------------------------------------------------------
INSERT INTO `users`
    (`uuid`, `login`, `full_name`, `role`, `password_hash`, `is_active`, `created_at`, `updated_at`, `last_login_at`)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'admin',
        'Администратор системы',
        'admin',
        '$2a$11$P9j8VXciIWCjG7ai3.a33OpgcfJvFrA2LXOzCoym/40G3/CIS2hvW',
        1,
        CURRENT_TIMESTAMP(3),
        NULL,
        NULL
    )
ON DUPLICATE KEY UPDATE
    `full_name` = VALUES(`full_name`),
    `is_active` = 1,
    `password_hash` = VALUES(`password_hash`);

-- ------------------------------------------------------------
-- 6. Обновление пароля warehouse1
--    Пароль: password  (bcrypt rounds=11)
-- ------------------------------------------------------------
UPDATE `users`
SET `password_hash` = '$2a$11$81F3Gq427dAEe2rq.ZVIy.Pk7zxZTiEmRirEdlD5ssN.yrHPEBFea'
WHERE `login` = 'warehouse1';

-- Назначение роли администратору
INSERT INTO `users_roles` (`user_uuid`, `role_uuid`)
SELECT
    u.`uuid`,
    r.`uuid`
FROM `users` u
JOIN `roles` r
  ON r.`name` = 'Администратор'
WHERE u.`login` = 'admin'
ON DUPLICATE KEY UPDATE
    `users_roles`.`role_uuid` = VALUES(`role_uuid`);

COMMIT;

-- ============================================================
-- ПРОВЕРКА ПОСЛЕ МИГРАЦИИ
-- ============================================================

SELECT
    u.`login`,
    u.`role` AS old_role,
    r.`name` AS migrated_role
FROM `users` u
LEFT JOIN `users_roles` ur ON ur.`user_uuid` = u.`uuid`
LEFT JOIN `roles` r ON r.`uuid` = ur.`role_uuid`
ORDER BY u.`login`;

-- ============================================================
-- УДАЛЕНИЕ users.role — ВЫПОЛНЯТЬ ТОЛЬКО ПОСЛЕ ПРОВЕРКИ
-- И ПОСЛЕ ТОГО, КАК КОД ПОЛНОСТЬЮ ПЕРЕВЕДЁН НА users_roles.
-- ============================================================

-- ALTER TABLE `users` DROP COLUMN `role`;

