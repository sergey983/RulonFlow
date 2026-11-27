-- ============================================================
-- 003_add_permissions.sql
-- Создаёт роль «Рабочий», таблицы permissions и role_permissions,
-- заполняет стартовый набор разрешений и назначает ролям.
--
-- Порядок критичен: роль «Рабочий» создаётся ДО назначения прав,
-- иначе INSERT ... SELECT не найдёт роль.
--
-- Используется ON DUPLICATE KEY UPDATE вместо INSERT IGNORE
-- чтобы не скрывать ошибки при повторном запуске.
-- ============================================================

-- 1. Системная роль для рабочего персонала
INSERT INTO roles (
    uuid,
    name,
    description,
    is_active,
    created_at
)
VALUES (
    '7F3C2A91-8B4D-4E6A-9C21-D5E8F0A3B7C4',
    'Рабочий',
    'Базовый доступ для операционных действий: паллеты и перемещения',
    1,
    CURRENT_TIMESTAMP(3)
)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    is_active = 1;

-- 2. Таблицы permissions
CREATE TABLE IF NOT EXISTS permissions (
    uuid           CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
    code           VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
    name           VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    description    VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
    role_uuid       CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    permission_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    PRIMARY KEY (role_uuid, permission_uuid),
    INDEX ix_role_permissions_permission_uuid (permission_uuid),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_uuid)
        REFERENCES roles(uuid)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_uuid)
        REFERENCES permissions(uuid)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Стартовые разрешения
INSERT INTO permissions (
    uuid,
    code,
    name,
    description
)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'pallets:view',       'Просмотр паллет',           'Может просматривать информацию о паллетах'),
    ('00000000-0000-0000-0000-000000000002', 'pallets:create',     'Создание паллет',           'Может создавать новые паллеты'),
    ('00000000-0000-0000-0000-000000000003', 'pallets:move',       'Перемещение паллет',        'Может перемещать паллеты по складу'),
    ('00000000-0000-0000-0000-000000000004', 'warehouse:view',     'Просмотр склада',           'Может просматривать зоны и locations'),
    ('00000000-0000-0000-0000-000000000005', 'warehouse:manage',   'Управление складом',        'Может управлять зонами, локами и статусами'),
    ('00000000-0000-0000-0000-000000000006', 'reports:view',       'Просмотр отчётов',          'Может просматривать отчёты и аналитику'),
    ('00000000-0000-0000-0000-000000000007', 'users:view',         'Просмотр пользователей',    'Может просматривать список пользователей'),
    ('00000000-0000-0000-0000-000000000008', 'users:manage',       'Управление пользователями', 'Может создавать, редактировать и удалять пользователей'),
    ('00000000-0000-0000-0000-000000000009', 'roles:manage',       'Управление ролями',         'Может создавать, редактировать и удалять роли'),
    ('00000000-0000-0000-0000-000000000010', 'settings:manage',    'Управление настройками',    'Может менять системные настройки')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

-- 4. Администратор — все permissions
INSERT INTO role_permissions (role_uuid, permission_uuid)
SELECT r.uuid, p.uuid
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Администратор'
ON DUPLICATE KEY UPDATE
    role_uuid = role_uuid;

-- 5. Начальник склада — warehouse + reports + pallets
INSERT INTO role_permissions (role_uuid, permission_uuid)
SELECT r.uuid, p.uuid
FROM roles r
JOIN permissions p
    ON p.code IN (
        'pallets:view',
        'pallets:create',
        'pallets:move',
        'warehouse:view',
        'warehouse:manage',
        'reports:view'
    )
WHERE r.name = 'Начальник склада'
ON DUPLICATE KEY UPDATE
    role_uuid = role_uuid;

-- 6. Кладовщик — pallets + warehouse view
INSERT INTO role_permissions (role_uuid, permission_uuid)
SELECT r.uuid, p.uuid
FROM roles r
JOIN permissions p
    ON p.code IN (
        'pallets:view',
        'pallets:create',
        'pallets:move',
        'warehouse:view'
    )
WHERE r.name = 'Кладовщик'
ON DUPLICATE KEY UPDATE
    role_uuid = role_uuid;

-- 7. Рабочий — минимальный мобильный набор
INSERT INTO role_permissions (role_uuid, permission_uuid)
SELECT r.uuid, p.uuid
FROM roles r
JOIN permissions p
    ON p.code IN (
        'pallets:view',
        'pallets:move'
    )
WHERE r.name = 'Рабочий'
ON DUPLICATE KEY UPDATE
    role_uuid = role_uuid;
