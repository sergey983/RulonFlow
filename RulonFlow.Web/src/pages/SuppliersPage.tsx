import { useEffect, useState } from 'react';
import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    type Supplier
} from '../api/suppliers';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import './SharedPage.css';

interface SupplierFormState {
    name: string;
    inn: string;
    isActive: boolean;
}

const emptyForm: SupplierFormState = {
    name: '',
    inn: '',
    isActive: true
};

export default function SuppliersPage() {
    const [items, setItems] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setError] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [form, setForm] = useState<SupplierFormState>(emptyForm);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        setError('');
        try {
            const result = await getSuppliers();
            setItems(result.items);
        } catch {
            setError('Не удалось загрузить поставщиков.');
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

    function openEdit(item: Supplier) {
        setEditing(item);
        setForm({
            name: item.name,
            inn: item.inn ?? '',
            isActive: item.isActive
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
            setFormError('Укажите наименование поставщика.');
            return;
        }

        setSaving(true);
        setFormError('');

        const payload = {
            name: form.name.trim(),
            inn: form.inn.trim() || null,
            isActive: form.isActive
        };

        try {
            if (editing) {
                await updateSupplier(editing.uuid, payload);
            } else {
                await createSupplier(payload);
            }
            closeForm();
            await load();
        } catch {
            setFormError('Не удалось сохранить поставщика.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="entity-page">
            <div className="section-header">
                <div className="section-header__title">
                    <h1>Поставщики</h1>
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
                        <TableCell th>Наименование</TableCell>
                        <TableCell th>ИНН</TableCell>
                        <TableCell th>Статус</TableCell>
                        <TableCell th className="table__cell--actions">Действия</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell th={false} colSpan={4} className="text-center">Загрузка…</TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {items.map(item => (
                                <TableRow key={item.uuid}>
                                    <TableCell><strong>{item.name}</strong></TableCell>
                                    <TableCell><code>{item.inn}</code></TableCell>
                                    <TableCell>
                                        <Badge variant={item.isActive ? 'success' : 'default'}>
                                            {item.isActive ? 'Активен' : 'Неактивен'}
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
                                    <TableCell th={false} colSpan={4} className="text-center">
                                        <div className="empty-state">
                                            <div className="empty-state__icon">🏭</div>
                                            <div className="empty-state__title">Нет данных</div>
                                            <div className="empty-state__description">Добавьте первого поставщика</div>
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
                title={editing ? 'Редактировать поставщика' : 'Новый поставщик'}
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
                        placeholder="ООО «Поставщик»"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                    />
                    <Input
                        label="ИНН"
                        placeholder="1234567890"
                        value={form.inn}
                        onChange={e => setForm({ ...form, inn: e.target.value })}
                    />

                    <label className="checkbox-wrapper">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        />
                        <span>Активен</span>
                    </label>
                </div>
            </Modal>
        </div>
    );
}
