import { useEffect, useState } from 'react';
import {
    getFilmTypes,
    createFilmType,
    updateFilmType,
    type FilmType
} from '../api/filmTypes';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import './SharedPage.css';

interface FilmTypeFormState {
    brand: string;
    densityGcm3: string;
    description: string;
    isActive: boolean;
}

const emptyForm: FilmTypeFormState = {
    brand: '',
    densityGcm3: '',
    description: '',
    isActive: true
};

export default function FilmTypesPage() {
    const [items, setItems] = useState<FilmType[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<FilmType | null>(null);
    const [form, setForm] = useState<FilmTypeFormState>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const result = await getFilmTypes();
            setItems(result.items);
        } catch {
            setLoadError('Не удалось загрузить марки плёнки.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setFormError(null);
        setShowForm(true);
    }

    function openEdit(item: FilmType) {
        setEditing(item);
        setForm({
            brand: item.brand,
            densityGcm3: item.densityGcm3?.toString() ?? '',
            description: item.description ?? '',
            isActive: item.isActive
        });
        setFormError(null);
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setFormError(null);
    }

    async function save() {
        if (!form.brand.trim()) {
            setFormError('Укажите марку.');
            return;
        }

        setSaving(true);
        setFormError(null);

        const payload = {
            brand: form.brand.trim(),
            densityGcm3: form.densityGcm3 ? Number(form.densityGcm3) : null,
            description: form.description.trim() || null,
            isActive: form.isActive
        };

        try {
            if (editing) {
                await updateFilmType(editing.uuid, payload);
            } else {
                await createFilmType(payload);
            }
            closeForm();
            await load();
        } catch {
            setFormError('Не удалось сохранить марку.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="entity-page">
            <div className="section-header">
                <div className="section-header__title">
                    <h1>Марки плёнки</h1>
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
                    <span>{loadError} <a onClick={() => load()} style={{ textDecoration: 'underline', cursor: 'pointer' }}>Повторить</a></span>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell th>Марка</TableCell>
                        <TableCell th>Плотность, г/см³</TableCell>
                        <TableCell th>Описание</TableCell>
                        <TableCell th>Статус</TableCell>
                        <TableCell th className="table__cell--actions">Действия</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell th={false} colSpan={5} className="text-center">Загрузка…</TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {items.map(item => (
                                <TableRow key={item.uuid}>
                                    <TableCell><strong>{item.brand}</strong></TableCell>
                                    <TableCell><code>{item.densityGcm3 ?? '—'}</code></TableCell>
                                    <TableCell className="text-muted text-sm">{item.description}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.isActive ? 'success' : 'default'}>
                                            {item.isActive ? 'Активна' : 'Неактивна'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="table__cell--actions">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                                            Изменить
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell th={false} colSpan={5} className="text-center">
                                        <div className="empty-state">
                                            <div className="empty-state__icon">🎞️</div>
                                            <div className="empty-state__title">Нет данных</div>
                                            <div className="empty-state__description">Добавьте первую марку плёнки</div>
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
                title={editing ? 'Редактировать марку' : 'Новая марка'}
                actions={
                    <>
                        <Button variant="primary" onClick={save} disabled={saving}>
                            {saving ? 'Сохранение…' : editing ? 'Сохранить' : 'Добавить'}
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
                        label="Марка"
                        placeholder="HGPL"
                        value={form.brand}
                        onChange={e => setForm({ ...form, brand: e.target.value })}
                        required
                    />
                    <Input
                        label="Плотность, г/см³"
                        type="number"
                        step="0.001"
                        placeholder="0.93"
                        value={form.densityGcm3}
                        onChange={e => setForm({ ...form, densityGcm3: e.target.value })}
                    />
                    <Input
                        label="Описание"
                        placeholder="Описание марки"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                    />

                    <label className="checkbox-wrapper">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        />
                        <span>Активна</span>
                    </label>
                </div>
            </Modal>
        </div>
    );
}
