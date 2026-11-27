import { useCallback, useEffect, useState } from "react";
import { createPalletType, getPalletTypes, updatePalletType } from "../api/palletTypes";
import type { PalletType } from "../api/palletTypes";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import Table, { TableHeader, TableBody, TableRow, TableCell } from "../ui/Table";
import './SharedPage.css';

interface PalletTypeFormState {
    lengthMm: string;
    widthMm: string;
    description: string;
    sortOrder: string;
}

const emptyForm: PalletTypeFormState = {
    lengthMm: "",
    widthMm: "",
    description: "",
    sortOrder: "0",
};

export default function PalletTypesPage() {
    const [items, setItems] = useState<PalletType[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<PalletType | null>(null);
    const [form, setForm] = useState<PalletTypeFormState>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const result = await getPalletTypes(1, 200);
            setItems(result.items);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Не удалось загрузить справочник");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormError(null);
        setShowForm(true);
    };

    const openEdit = (item: PalletType) => {
        setEditing(item);
        setForm({
            lengthMm: item.lengthMm.toString(),
            widthMm: item.widthMm.toString(),
            description: item.description ?? "",
            sortOrder: item.sortOrder.toString(),
        });
        setFormError(null);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setFormError(null);
    };

    const save = async () => {
        const lengthMm = Number(form.lengthMm);
        const widthMm = Number(form.widthMm);
        const sortOrder = Number(form.sortOrder || 0);

        if (!Number.isInteger(lengthMm) || lengthMm <= 0) {
            setFormError("Укажите целую длину поддона больше нуля");
            return;
        }
        if (!Number.isInteger(widthMm) || widthMm <= 0) {
            setFormError("Укажите целую ширину поддона больше нуля");
            return;
        }

        setSaving(true);
        setFormError(null);

        try {
            const payload = {
                name: `${lengthMm}x${widthMm}`,
                lengthMm,
                widthMm,
                description: form.description.trim() || null,
                sortOrder,
            };

            if (editing) {
                await updatePalletType(editing.uuid, payload);
            } else {
                await createPalletType(payload);
            }

            closeForm();
            await load();
        } catch (e) {
            setFormError(e instanceof Error ? e.message : "Не удалось сохранить тип паллеты");
        } finally {
            setSaving(false);
        }
    };

    const generatedName = form.lengthMm && form.widthMm
        ? `${form.lengthMm}x${form.widthMm}`
        : "—";

    return (
        <div className="entity-page">
            <div className="section-header">
                <div className="section-header__title">
                    <h1>Типы паллет</h1>
                </div>
                <Button variant="primary" onClick={openCreate}>
                    + Добавить
                </Button>
            </div>

            {loadError && (
                <div className="alert alert--danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{loadError} <a onClick={() => void load()} style={{ textDecoration: 'underline', cursor: 'pointer' }}>Повторить</a></span>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell th>Порядок</TableCell>
                        <TableCell th>Название</TableCell>
                        <TableCell th>Длина, мм</TableCell>
                        <TableCell th>Ширина, мм</TableCell>
                        <TableCell th>Описание</TableCell>
                        <TableCell th className="table__cell--actions">Действия</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell th={false} colSpan={6} className="text-center">Загрузка…</TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {items.map(item => (
                                <TableRow key={item.uuid}>
                                    <TableCell><Badge variant="default">{item.sortOrder}</Badge></TableCell>
                                    <TableCell><strong>{item.name}</strong></TableCell>
                                    <TableCell><code>{item.lengthMm}</code></TableCell>
                                    <TableCell><code>{item.widthMm}</code></TableCell>
                                    <TableCell className="text-muted text-sm">{item.description ?? '—'}</TableCell>
                                    <TableCell className="table__cell--actions">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                                            Изменить
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && items.length === 0 && (
                                <TableRow>
                                    <TableCell th={false} colSpan={6} className="text-center">
                                        <div className="empty-state">
                                            <div className="empty-state__icon">📦</div>
                                            <div className="empty-state__title">Нет данных</div>
                                            <div className="empty-state__description">Добавьте первый тип паллеты</div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    )}
                </TableBody>
            </Table>

            <Modal
                isOpen={showForm}
                onClose={closeForm}
                title={editing ? 'Изменить тип паллеты' : 'Новый тип паллеты'}
                actions={
                    <>
                        <Button variant="primary" onClick={save} disabled={saving}>
                            {saving ? 'Сохранение…' : 'Сохранить'}
                        </Button>
                        <Button variant="secondary" onClick={closeForm} disabled={saving}>
                            Отмена
                        </Button>
                    </>
                }
            >
                {formError && (
                    <div className="alert alert--danger" style={{ marginBottom: 0 }}>
                        <span>{formError}</span>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Input
                        label="Длина, мм"
                        type="number"
                        min="1"
                        step="1"
                        value={form.lengthMm}
                        onChange={event => setForm({ ...form, lengthMm: event.target.value })}
                    />
                    <Input
                        label="Ширина, мм"
                        type="number"
                        min="1"
                        step="1"
                        value={form.widthMm}
                        onChange={event => setForm({ ...form, widthMm: event.target.value })}
                    />
                    <Input
                        label="Описание"
                        placeholder="евро, Gettel"
                        value={form.description}
                        onChange={event => setForm({ ...form, description: event.target.value })}
                    />
                    <Input
                        label="Порядок"
                        type="number"
                        min="0"
                        step="1"
                        value={form.sortOrder}
                        onChange={event => setForm({ ...form, sortOrder: event.target.value })}
                    />

                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        Название: <strong style={{ color: 'var(--text-h)' }}>{generatedName}</strong>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
