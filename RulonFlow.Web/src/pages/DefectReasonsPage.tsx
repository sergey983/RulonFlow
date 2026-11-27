import { useEffect, useState } from 'react';
import {
    getDefectReasons,
    createDefectReason,
    updateDefectReason,
    type DefectReason
} from '../api/defectReasons';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import './SharedPage.css';

interface DefectReasonFormState {
    name: string;
    description: string;
    isActive: boolean;
    sortOrder: number;
}

const emptyForm: DefectReasonFormState = {
    name: '',
    description: '',
    isActive: true,
    sortOrder: 10
};

export default function DefectReasonsPage() {
    const [items, setItems] = useState<DefectReason[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setError] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<DefectReason | null>(null);
    const [form, setForm] = useState<DefectReasonFormState>(emptyForm);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        setError('');
        try {
            const result = await getDefectReasons();
            setItems(result.items);
        } catch {
            setError('Не удалось загрузить причины брака.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setFormError('');
        setShowForm(true);
    }

    function openEdit(item: DefectReason) {
        setEditing(item);
        setForm({
            name: item.name,
            description: item.description ?? '',
            isActive: item.isActive,
            sortOrder: item.sortOrder
        });
        setFormError('');
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setFormError('');
    }

    async function save() {
        if (!form.name.trim()) {
            setFormError('Укажите наименование причины брака.');
            return;
        }

        setSaving(true);
        setFormError('');

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            isActive: form.isActive,
            sortOrder: Number(form.sortOrder) || 0
        };

        try {
            if (editing) {
                await updateDefectReason(editing.uuid, payload);
            } else {
                await createDefectReason(payload);
            }
            closeForm();
            await load();
        } catch {
            setFormError('Не удалось сохранить причину брака.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="entity-page">
            <div className="section-header">
                <div className="section-header__title">
                    <h1>Причины брака</h1>
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
                    <span>{loadError}</span>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell th>Порядок</TableCell>
                        <TableCell th>Наименование</TableCell>
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
                                    <TableCell><Badge variant="default">{item.sortOrder}</Badge></TableCell>
                                    <TableCell><strong>{item.name}</strong></TableCell>
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
                                            <div className="empty-state__icon">⚠️</div>
                                            <div className="empty-state__title">Нет данных</div>
                                            <div className="empty-state__description">Добавьте первую причину брака</div>
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
                title={editing ? 'Редактировать причину брака' : 'Новая причина брака'}
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
                        label="Наименование"
                        placeholder="Царапина"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Описание"
                        placeholder="Механическое повреждение поверхности"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                    <Input
                        label="Порядок сортировки"
                        type="number"
                        value={form.sortOrder}
                        onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })}
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
