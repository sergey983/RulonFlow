import { api } from "./client";

// === Types ===

export type UserRole = {
    roleUuid: string;
    roleName: string;
};

export type UserRolesList = {
    roleUuid: string;
    roleName: string;
}[];

export type RoleResponse = {
    uuid: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
    permissions?: string[];
};

export type Permission = {
    uuid: string;
    code: string;
    name: string;
    description?: string | null;
};

export type UserResponse = {
    uuid: string;
    login: string;
    fullName: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
    lastLoginAt?: string | null;
    roles: UserRolesList;
};

export type PaginatedResponse<T> = {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
};

// === Roles API ===

export async function getRoles(): Promise<RoleResponse[]> {
    const res = await api.get("/admin/roles");
    return res.data;
}

export async function getRoleOptions(): Promise<UserRole[]> {
    const res = await api.get("/admin/roles");
    return (res.data as RoleResponse[]).map(r => ({
        roleUuid: r.uuid,
        roleName: r.name
    }));
}

export async function getActiveRoles(): Promise<RoleResponse[]> {
    const res = await api.get("/admin/roles", { params: { isActive: true } });
    return res.data;
}

export async function createRole(data: { name: string; description?: string }): Promise<RoleResponse> {
    const res = await api.post("/admin/roles", data);
    return res.data;
}

export async function updateRole(uuid: string, data: { name: string; description?: string }): Promise<RoleResponse> {
    const res = await api.patch(`/admin/roles/${uuid}`, data);
    return res.data;
}

export async function toggleRoleActive(uuid: string): Promise<RoleResponse> {
    const res = await api.patch(`/admin/roles/${uuid}/toggle-active`);
    return res.data;
}

export async function deleteRole(uuid: string): Promise<void> {
    await api.delete(`/admin/roles/${uuid}`);
}

// === Role Permissions API ===

export async function getPermissions(): Promise<Permission[]> {
    const res = await api.get("/admin/roles/permissions");
    return res.data;
}

export async function getRolePermissions(uuid: string): Promise<string[]> {
    const res = await api.get(`/admin/roles/${uuid}/permissions`);
    return res.data;
}

export async function assignRolePermissions(uuid: string, permissionUuids: string[]): Promise<void> {
    await api.patch(`/admin/roles/${uuid}/permissions`, { permissionUuids });
}

// === Users API ===

export async function getUsers(
    page = 1,
    pageSize = 50,
    search?: string,
    isActive?: boolean
): Promise<PaginatedResponse<UserResponse>> {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (isActive !== undefined) params.set("isActive", String(isActive));

    const res = await api.get("/admin/users", { params });
    return res.data;
}

export async function getUser(uuid: string): Promise<UserResponse> {
    const res = await api.get(`/admin/users/${uuid}`);
    return res.data;
}

export async function createUser(data: {
    login: string;
    fullName: string;
    password: string;
    roleUuids: string[];
}): Promise<UserResponse> {
    const res = await api.post("/admin/users", data);
    return res.data;
}

export async function updateUser(uuid: string, data: {
    fullName: string;
    roleUuids: string[];
}): Promise<UserResponse> {
    const res = await api.patch(`/admin/users/${uuid}`, data);
    return res.data;
}

export async function toggleUserActive(uuid: string): Promise<UserResponse> {
    const res = await api.patch(`/admin/users/${uuid}/toggle-active`);
    return res.data;
}

export async function deleteUser(uuid: string): Promise<void> {
    await api.delete(`/admin/users/${uuid}`);
}
