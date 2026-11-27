import { useMemo } from "react";
import { useAuth } from "./useAuth";

/**
 * Хук для проверки разрешений (permissions) пользователя.
 *
 * Примеры:
 *   const canManageUsers = useHasPermission("users:manage");
 *   const canViewReports = useHasPermission("reports:view");
 *
 * Если пользователь не авторизован или permissions нет в контексте — возвращает false.
 */
export function useHasPermission(permission: string): boolean {
    const { user } = useAuth();

    return useMemo(() => {
        if (!user?.permissions) return false;
        return user.permissions.includes(permission);
    }, [user?.permissions, permission]);
}

/**
 * Проверка: есть хотя бы одно из перечисленных разрешений.
 */
export function useHasAnyPermission(permissions: string[]): boolean {
    const { user } = useAuth();

    return useMemo(() => {
        if (!user?.permissions) return false;
        return permissions.some(p => user.permissions.includes(p));
    }, [user?.permissions, permissions]);
}

/**
 * Проверка: есть ВСЕ перечисленные разрешения.
 */
export function useHasAllPermissions(permissions: string[]): boolean {
    const { user } = useAuth();

    return useMemo(() => {
        if (!user?.permissions) return false;
        return permissions.every(p => user.permissions.includes(p));
    }, [user?.permissions, permissions]);
}
