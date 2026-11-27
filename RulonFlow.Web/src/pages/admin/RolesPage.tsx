import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import Table, { TableHeader, TableBody, TableRow, TableCell } from "../../ui/Table";
import {
    getRoles,
    createRole,
    updateRole,
    toggleRoleActive,
    deleteRole,
    getPermissions,
    getRolePermissions,
    assignRolePermissions,
    type RoleResponse,
    type Permission,
} from "../../api/admin";

// ============================================================
// Permission group definition
// ============================================================

interface PermissionGroup {
    resource: string;
    icon: React.ReactNode;
    description: string;
    permissions: Permission[];
}

// ============================================================
// RolesPage — управление ролями (CRUD) + permissions
// ============================================================

export default function RolesPage() {
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Permissions
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editRole, setEditRole] = useState<RoleResponse | null>(null);
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [formSaving, setFormSaving] = useState(false);

    // Delete confirm
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState("");

    // Permissions modal
    const [permModalOpen, setPermModalOpen] = useState(false);
    const [permRole, setPermRole] = useState<RoleResponse | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [permSaving, setPermSaving] = useState(false);

    // ---- Data loading ----

    const loadRoles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getRoles();
            setRoles(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка загрузки");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadPermissions = useCallback(async () => {
        try {
            const perms = await getPermissions();
            setAllPermissions(perms);
        } catch {
            /* non-fatal */
        }
    }, []);

    useEffect(() => { loadRoles(); }, [loadRoles]);
    useEffect(() => { loadPermissions(); }, [loadPermissions]);

    // ---- Open create / edit modal ----

    const openCreate = () => {
        setEditRole(null);
        setFormName("");
        setFormDescription("");
        setFormError(null);
        setModalOpen(true);
    };

    const openEdit = (role: RoleResponse) => {
        setEditRole(role);
        setFormName(role.name);
        setFormDescription(role.description || "");
        setFormError(null);
        setModalOpen(true);
    };

    // ---- Save ----

    const handleSave = async () => {
        if (!formName.trim()) {
            setFormError("Название обязательно");
            return;
        }

        setFormSaving(true);
        setFormError(null);

        try {
            if (editRole) {
                await updateRole(editRole.uuid, { name: formName.trim(), description: formDescription.trim() || undefined });
            } else {
                await createRole({ name: formName.trim(), description: formDescription.trim() || undefined });
            }
            setModalOpen(false);
            loadRoles();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Ошибка сохранения";
            const json = (e as any)?.response?.data;
            setFormError(json?.message || json?.error || msg);
        } finally {
            setFormSaving(false);
        }
    };

    // ---- Toggle active ----

    const handleToggleActive = async (role: RoleResponse) => {
        try {
            const updated = await toggleRoleActive(role.uuid);
            setRoles(prev => prev.map(r => r.uuid === role.uuid ? updated : r));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка");
        }
    };

    // ---- Delete ----

    const handleDeleteRequest = (role: RoleResponse) => {
        setDeleteId(role.uuid);
        setDeleteName(role.name);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        try {
            await deleteRole(deleteId);
            setDeleteId(null);
            setDeleteName("");
            loadRoles();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Ошибка удаления";
            const json = (e as any)?.response?.data;
            setError(json?.message || json?.error || msg);
        }
    };

    // ---- Permissions ----

    const openPermissions = async (role: RoleResponse) => {
        setPermRole(role);
        try {
            const permUuids = await getRolePermissions(role.uuid);
            setSelectedPermissions(permUuids);
        } catch {
            setSelectedPermissions([]);
        }
        setPermModalOpen(true);
    };

    const togglePermission = (uuid: string) => {
        setSelectedPermissions(prev =>
            prev.includes(uuid)
                ? prev.filter(p => p !== uuid)
                : [...prev, uuid]
        );
    };

    const toggleGroup = (_resource: string, groupPerms: Permission[]) => {
        const groupSelected = groupPerms.every(p => selectedPermissions.includes(p.uuid));
        if (groupSelected) {
            // Deselect all in group
            const toRemove = new Set(groupPerms.map(p => p.uuid));
            setSelectedPermissions(prev => prev.filter(p => !toRemove.has(p)));
        } else {
            // Select all in group
            const current = new Set(selectedPermissions);
            groupPerms.forEach(p => current.add(p.uuid));
            setSelectedPermissions(Array.from(current));
        }
    };

    const savePermissions = async () => {
        if (!permRole) return;
        setPermSaving(true);
        try {
            await assignRolePermissions(permRole.uuid, selectedPermissions);
            setPermModalOpen(false);
            loadRoles();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка сохранения permissions");
        } finally {
            setPermSaving(false);
        }
    };

    // ---- Group permissions by resource prefix ----

    const permissionGroups = useMemo((): PermissionGroup[] => {
        const groups: PermissionGroup[] = [
            { resource: "pallets", icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
            ), description: "Управление паллетами", permissions: [] },
            { resource: "rolls", icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
            ), description: "Управление рулонами", permissions: [] },
            { resource: "reports", icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
            ), description: "Отчёты и аналитика", permissions: [] },
            { resource: "roles", icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
            ), description: "Управление ролями", permissions: [] },
            { resource: "settings", icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
            ), description: "Системные настройки", permissions: [] },
        ];

        // Assign permissions to groups based on code prefix
        allPermissions.forEach(perm => {
            const prefix = perm.code.split(":")[0];
            const group = groups.find(g => g.resource === prefix);
            if (group) {
                group.permissions.push(perm);
            } else {
                // Uncategorized — add to "others"
                const others = groups.find(g => g.resource === "other");
                if (others) {
                    others.permissions.push(perm);
                } else {
                    groups.push({
                        resource: "other",
                        icon: (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                            </svg>
                        ),
                        description: "Прочие разрешения",
                        permissions: [perm]
                    });
                }
            }
        });

        // Filter empty groups except "other" (which should only appear if there are uncategorized perms)
        return groups.filter(g => g.permissions.length > 0 || g.resource !== "other");
    }, [allPermissions]);

    // ---- Helpers ----

    const dateFmt = (d?: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";

    return (
        <div className="entity-page">
            {/* ---- Header ---- */}
            <div className="section-header">
                <div className="section-header__title">
                    <h1>Роли</h1>
                </div>
                <Button variant="primary" onClick={openCreate} leftIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                }>
                    Добавить роль
                </Button>
            </div>

            {/* ---- Error ---- */}
            {error && (
                <div className="alert alert--danger" style={{ marginBottom: 16 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span>{error}</span>
                    <button className="btn btn--ghost btn--sm" onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {/* ---- Table ---- */}
            {loading && roles.length === 0 ? (
                <div className="text-center text-muted" style={{ padding: 40 }}>Загрузка…</div>
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell th>Название</TableCell>
                                <TableCell th>Описание</TableCell>
                                <TableCell th>Права</TableCell>
                                <TableCell th>Статус</TableCell>
                                <TableCell th>Создана</TableCell>
                                <TableCell th className="table__cell--actions">Действия</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map(role => {
                                const rolePermissions = (role as any).permissions as Permission[] | undefined;
                                const permCodes = rolePermissions?.map(p => p.code) || [];
                                return (
                                    <TableRow key={role.uuid}>
                                        <TableCell><strong>{role.name}</strong></TableCell>
                                        <TableCell className="text-muted text-truncate">
                                            <div style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {role.description || "—"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                {permCodes.length > 0 ? permCodes.slice(0, 3).map(code => (
                                                    <Badge key={code} variant="default" size="sm">{code}</Badge>
                                                )) : <span className="text-muted" style={{ fontSize: 12 }}>нет прав</span>}
                                                {permCodes.length > 3 && (
                                                    <Badge variant="info" size="sm">+{permCodes.length - 3}</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={role.isActive ? "success" : "danger"}>
                                                {role.isActive ? "Активна" : "Неактивна"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted">{dateFmt(role.createdAt)}</TableCell>
                                        <TableCell className="table__cell--actions">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(role)} title="Редактировать">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => openPermissions(role)} title="Permissions">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleToggleActive(role)} title={role.isActive ? "Деактивировать" : "Активировать"}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteRequest(role)} title="Удалить" style={{ color: "var(--danger)" }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {roles.length === 0 && (
                                <TableRow>
                                    <TableCell th={false} colSpan={6} className="text-center">
                                        <div className="empty-state">
                                            <div className="empty-state__icon">🏷</div>
                                            <div className="empty-state__title">Роли не найдены</div>
                                            <div className="empty-state__description">Создайте первую роль для управления правами доступа</div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </>
            )}

            {/* ---- Create / Edit Modal ---- */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editRole ? "Редактировать роль" : "Новая роль"}
                actions={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formSaving}>Отмена</Button>
                        <Button variant="primary" onClick={handleSave} isLoading={formSaving}>
                            {editRole ? "Сохранить" : "Создать"}
                        </Button>
                    </>
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="input-wrapper">
                        <label className="input-label input-label--required">Название</label>
                        <input
                            className="input"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="Новая роль"
                            autoFocus
                        />
                    </div>

                    <div className="input-wrapper">
                        <label className="input-label">Описание</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formDescription}
                            onChange={e => setFormDescription(e.target.value)}
                            placeholder="Описание роли…"
                            style={{ resize: "vertical" }}
                        />
                    </div>

                    {formError && (
                        <div className="alert alert--danger" style={{ marginBottom: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            <span>{formError}</span>
                        </div>
                    )}
                </div>
            </Modal>

            {/* ---- Delete Confirm ---- */}
            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Удалить роль?"
                wide
                actions={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteId(null)}>Отмена</Button>
                        <Button variant="danger" onClick={handleDeleteConfirm}>Удалить</Button>
                    </>
                }
            >
                <div className="form-section" style={{ marginBottom: 0 }}>
                    <p style={{ color: "var(--text-h)", lineHeight: 1.6, margin: 0 }}>
                        Вы удаляете роль <strong style={{ color: "var(--danger)" }}>{deleteName}</strong>.
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                        Это действие невозможно, если роль назначена пользователям. Все связанные права доступа будут удалены.
                    </p>
                </div>
            </Modal>

            {/* ---- Permissions Modal ---- */}
            <Modal
                isOpen={permModalOpen}
                onClose={() => setPermModalOpen(false)}
                title={`🛡 ${permRole?.name ?? "Роли"} — Управление правами`}
                wide
                actions={
                    <>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto", fontSize: 13, color: "var(--text-muted)" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            Выделено: <strong style={{ color: "var(--accent)", fontSize: 14 }}>{selectedPermissions.length}</strong>
                        </div>
                        <Button variant="secondary" onClick={() => setPermModalOpen(false)} disabled={permSaving}>Отмена</Button>
                        <Button variant="primary" onClick={savePermissions} disabled={permSaving}>
                            {permSaving ? "Сохранение…" : "Сохранить"}
                        </Button>
                    </>
                }
            >
                {allPermissions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">⚙</div>
                        <div className="empty-state__title">Разрешения не загружены</div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: 520, overflowY: "auto", paddingRight: 8 }}>
                        {permissionGroups.map(group => {
                            const groupSelected = group.permissions.length > 0 && group.permissions.every(p => selectedPermissions.includes(p.uuid));
                            const groupPartial = group.permissions.some(p => selectedPermissions.includes(p.uuid)) && !groupSelected;

                            return (
                                <div key={group.resource} className="form-section" style={{ padding: 0, overflow: "hidden" }}>
                                    {/* Group header with select all */}
                                    <label
                                        className="select-all-header"
                                        style={{
                                            background: groupSelected ? "var(--accent-bg)" : groupPartial ? "var(--warning-bg)" : "transparent",
                                            borderRadius: "12px 12px 0 0",
                                            color: groupSelected ? "var(--accent)" : groupPartial ? "var(--warning)" : "var(--text)",
                                            padding: "10px 16px",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={groupSelected}
                                            onChange={() => toggleGroup(group.resource, group.permissions)}
                                            style={{ width: 18, height: 18, accentColor: "var(--accent)", cursor: "pointer" }}
                                        />
                                        <span style={{ flexShrink: 0 }}>{group.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{group.resource}</div>
                                            <div style={{ fontSize: 12, opacity: 0.7 }}>{group.description}</div>
                                        </div>
                                        <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                                            {selectedPermissions.filter(uuid => group.permissions.some(p => p.uuid === uuid)).length}/{group.permissions.length}
                                        </div>
                                    </label>

                                    {/* Individual permissions */}
                                    <div className="form-section__body" style={{ padding: "8px 16px 12px" }}>
                                        {group.permissions.map(perm => {
                                            const isChecked = selectedPermissions.includes(perm.uuid);
                                            return (
                                                <label
                                                    key={perm.uuid}
                                                    className="checkbox--lg"
                                                    style={{
                                                        background: isChecked ? "var(--accent-bg)" : "transparent",
                                                        padding: "6px 10px",
                                                        borderRadius: 6,
                                                        margin: "0 -6px",
                                                        paddingLeft: 10,
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => togglePermission(perm.uuid)}
                                                        style={{ accentColor: "var(--accent)" }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: 13.5, fontFamily: "var(--mono)", color: isChecked ? "var(--accent)" : "var(--text-h)" }}>
                                                            {perm.code}
                                                        </div>
                                                        {perm.description && (
                                                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
                                                                {perm.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal>
        </div>
    );
}
