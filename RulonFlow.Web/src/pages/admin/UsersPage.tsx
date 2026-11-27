import { useCallback, useEffect, useState } from "react";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import Table, { TableHeader, TableBody, TableRow, TableCell } from "../../ui/Table";
import {
    getUsers,
    createUser,
    updateUser,
    toggleUserActive,
    deleteUser,
    getRoleOptions,
    type UserResponse,
    type UserRole,
} from "../../api/admin";

// ============================================================
// UsersPage — управление пользователями (CRUD)
// ============================================================

export default function UsersPage() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<UserResponse | null>(null);
    const [formLogin, setFormLogin] = useState("");
    const [formName, setFormName] = useState("");
    const [formPassword, setFormPassword] = useState("");
    const [formRoles, setFormRoles] = useState<string[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSaving, setFormSaving] = useState(false);

    // Delete confirm
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLogin, setDeleteLogin] = useState("");

    // ---- Data loading ----

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getUsers(page, 50, search || undefined, filterActive !== "all" ? (filterActive === "active") : undefined);
            setUsers(res.items);
            setTotal(res.totalCount);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка загрузки");
        } finally {
            setLoading(false);
        }
    }, [page, search, filterActive]);

    const loadRoles = useCallback(async () => {
        try {
            const res = await getRoleOptions();
            setRoles(res);
        } catch {
            /* non-fatal — roles needed only for CRUD */
        }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);
    useEffect(() => { loadRoles(); }, [loadRoles]);

    // ---- Search debounce ----

    const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (searchTimer) clearTimeout(searchTimer);
        setSearchTimer(setTimeout(() => setPage(1), 300));
    };

    // ---- Open create / edit modal ----

    const openCreate = () => {
        setEditUser(null);
        setFormLogin("");
        setFormName("");
        setFormPassword("");
        setFormRoles(roles.filter(r => r.roleName === "Кладовщик").map(r => r.roleUuid));
        setFormError(null);
        setModalOpen(true);
    };

    const openEdit = (user: UserResponse) => {
        setEditUser(user);
        setFormLogin(user.login);
        setFormName(user.fullName);
        setFormPassword("");
        setFormRoles(user.roles.map(r => r.roleUuid));
        setFormError(null);
        setModalOpen(true);
    };

    // ---- Save ----

    const handleSave = async () => {
        if (!formName.trim()) {
            setFormError("ФИО обязательно");
            return;
        }
        if (!editUser && !formPassword) {
            setFormError("Пароль обязателен для нового пользователя");
            return;
        }
        if (formRoles.length === 0) {
            setFormError("Назначьте хотя бы одну роль");
            return;
        }

        setFormSaving(true);
        setFormError(null);

        try {
            if (editUser) {
                await updateUser(editUser.uuid, { fullName: formName.trim(), roleUuids: formRoles });
            } else {
                await createUser({ login: formLogin.trim(), fullName: formName.trim(), password: formPassword, roleUuids: formRoles });
            }
            setModalOpen(false);
            loadUsers();
        } catch (e) {
            setFormError(e instanceof Error ? e.message : "Ошибка сохранения");
        } finally {
            setFormSaving(false);
        }
    };

    // ---- Toggle active ----

    const handleToggleActive = async (user: UserResponse) => {
        try {
            const updated = await toggleUserActive(user.uuid);
            setUsers(prev => prev.map(u => u.uuid === user.uuid ? updated : u));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка");
        }
    };

    // ---- Delete ----

    const handleDeleteRequest = (user: UserResponse) => {
        setDeleteId(user.uuid);
        setDeleteLogin(user.login);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        try {
            await deleteUser(deleteId);
            setDeleteId(null);
            loadUsers();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Ошибка удаления";
            const json = (e as any)?.response?.data;
            setError(json?.message || json?.error || msg);
        }
    };

    // ---- Helpers ----

    const totalPages = Math.max(1, Math.ceil(total / 50));
    const dateFmt = (d?: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";

    const roleById = (uuid: string) => roles.find(r => r.roleUuid === uuid);

    return (
        <div className="entity-page">
            {/* ---- Header ---- */}
            <div className="section-header">
                <div className="section-header__title">
                    <h1>Пользователи</h1>
                </div>
                <Button variant="primary" onClick={openCreate} leftIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                }>
                    Добавить пользователя
                </Button>
            </div>

            {/* ---- Search / Filter ---- */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                <div style={{ flex: 1, maxWidth: 360 }}>
                    <div className="input-field" style={{ background: "var(--field-bg)" }}>
                        <span className="input-prefix">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Поиск по логину или ФИО…"
                            className="input"
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            style={{ padding: "10px 14px" }}
                        />
                    </div>
                </div>
                <select
                    className="select"
                    value={filterActive}
                    onChange={e => setFilterActive(e.target.value as typeof filterActive)}
                    style={{ minWidth: 160 }}
                >
                    <option value="all">Все пользователи</option>
                    <option value="active">Активные</option>
                    <option value="inactive">Неактивные</option>
                </select>
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
            {loading && users.length === 0 ? (
                <div className="text-center text-muted" style={{ padding: 40 }}>Загрузка…</div>
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell th>Логин</TableCell>
                                <TableCell th>ФИО</TableCell>
                                <TableCell th>Роли</TableCell>
                                <TableCell th>Статус</TableCell>
                                <TableCell th>Создан</TableCell>
                                <TableCell th className="table__cell--actions">Действия</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.uuid}>
                                    <TableCell>
                                        <code style={{ background: "var(--accent-bg)", color: "var(--accent)", padding: "3px 8px", borderRadius: 6, fontSize: 13 }}>{user.login}</code>
                                    </TableCell>
                                    <TableCell>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: "50%",
                                                background: "var(--accent-bg)",
                                                color: "var(--accent)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 13,
                                                fontWeight: 700,
                                                flexShrink: 0,
                                            }}>
                                                {user.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            {user.fullName}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                            {user.roles && user.roles.length > 0 ? (
                                                user.roles.map((r) => {
                                                    const role = roleById(r.roleUuid);
                                                    return (
                                                        <Badge key={r.roleUuid} variant="info" size="sm">
                                                            {role?.roleName ?? r.roleName}
                                                        </Badge>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isActive ? "success" : "danger"}>
                                            {user.isActive ? "Активен" : "Неактивен"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted text-sm">{dateFmt(user.createdAt)}</TableCell>
                                    <TableCell className="table__cell--actions">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)} title="Редактировать">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(user)} title={user.isActive ? "Деактивировать" : "Активировать"}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRequest(user)} title="Удалить" style={{ color: "var(--danger)" }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell th={false} colSpan={6} className="text-center">
                                        <div className="empty-state">
                                            <div className="empty-state__icon">👤</div>
                                            <div className="empty-state__title">Пользователи не найдены</div>
                                            <div className="empty-state__description">Добавьте первого пользователя</div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* ---- Pagination ---- */}
                    {totalPages > 1 && (
                        <div className="pagination" style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 16 }}>
                            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</Button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                let p: number;
                                if (totalPages <= 7) {
                                    p = i + 1;
                                } else if (page <= 4) {
                                    p = i + 1;
                                } else if (page >= totalPages - 3) {
                                    p = totalPages - 6 + i;
                                } else {
                                    p = page - 3 + i;
                                }
                                return (
                                    <Button
                                        key={p}
                                        variant={p === page ? "primary" : "ghost"}
                                        size="sm"
                                        onClick={() => setPage(p)}
                                        style={{ minWidth: 32 }}
                                    >
                                        {p}
                                    </Button>
                                );
                            })}
                            {totalPages > 7 && page < totalPages - 3 && <span style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>…</span>}
                            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
                        </div>
                    )}
                </>
            )}

            {/* ---- Create / Edit Modal ---- */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editUser ? "✏️ Редактировать пользователя" : "👤 Новый пользователь"}
                actions={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formSaving}>Отмена</Button>
                        <Button variant="primary" onClick={handleSave} isLoading={formSaving}>
                            {editUser ? "Сохранить" : "Создать"}
                        </Button>
                    </>
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {!editUser && (
                        <div className="input-wrapper">
                            <label className="input-label input-label--required">Логин</label>
                            <input
                                className="input"
                                value={formLogin}
                                onChange={e => setFormLogin(e.target.value)}
                                placeholder="username"
                                autoComplete="off"
                            />
                        </div>
                    )}

                    <div className="input-wrapper">
                        <label className="input-label input-label--required">ФИО</label>
                        <input
                            className="input"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="Иванов Иван Иванович"
                        />
                    </div>

                    {!editUser && (
                        <div className="input-wrapper">
                            <label className="input-label input-label--required">Пароль</label>
                            <input
                                className="input"
                                type="password"
                                value={formPassword}
                                onChange={e => setFormPassword(e.target.value)}
                                placeholder="Минимум 8 символов"
                            />
                        </div>
                    )}

                    {editUser && (
                        <div className="input-wrapper">
                            <label className="input-label">Логин</label>
                            <code style={{ fontSize: 14, color: "var(--text-h)", padding: "10px 14px", background: "var(--field-bg)", borderRadius: 10, border: "1.5px solid var(--border)" }}>
                                {formLogin}
                            </code>
                        </div>
                    )}

                    <div>
                        <div className="input-wrapper" style={{ marginBottom: 10 }}>
                            <label className="input-label input-label--required">Роли</label>
                        </div>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: 8,
                            padding: 14,
                            background: "var(--section-bg)",
                            border: "1px solid var(--divider)",
                            borderRadius: 12,
                        }}>
                            {roles.map(role => (
                                <label key={role.roleUuid} className="checkbox-wrapper" style={{ padding: "6px 8px", borderRadius: 6, background: formRoles.includes(role.roleUuid) ? "var(--accent-bg)" : "transparent" }}>
                                    <input
                                        type="checkbox"
                                        checked={formRoles.includes(role.roleUuid)}
                                        onChange={e => {
                                            setFormRoles(prev =>
                                                e.target.checked
                                                    ? [...prev, role.roleUuid]
                                                    : prev.filter(r => r !== role.roleUuid)
                                            );
                                        }}
                                    />
                                    <span style={{ fontSize: 13 }}>{role.roleName}</span>
                                </label>
                            ))}
                            {roles.length === 0 && <span className="text-muted" style={{ fontSize: 13 }}>Нет доступных ролей</span>}
                        </div>
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
                title="Удалить пользователя?"
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
                        Вы удаляете пользователя <strong style={{ color: "var(--danger)" }}>{deleteLogin}</strong>.
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                        Все назначенные роли будут потеряны. Это действие невозможно отменить.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
