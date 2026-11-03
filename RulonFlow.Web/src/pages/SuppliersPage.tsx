import { useEffect, useState } from 'react';
import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    type Supplier
} from '../api/suppliers';

const emptyForm = {
    name: '',
    inn: '',
    isActive: true
};

export default function SuppliersPage() {
    const [items, setItems] = useState<Supplier[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [editingUuid, setEditingUuid] = useState<string | null>(null);
    const [error, setError] = useState('');

    async function load() {
        try {
            const result = await getSuppliers();
            setItems(result.items);
            setError('');
        } catch {
            setError('Не удалось загрузить поставщиков.');
        }
    }

    useEffect(() => {
        load();
    }, []);

    function startEdit(item: Supplier) {
        setEditingUuid(item.uuid);
        setForm({
            name: item.name,
            inn: item.inn ?? '',
            isActive: item.isActive
        });
    }

    function cancelEdit() {
        setEditingUuid(null);
        setForm(emptyForm);
    }

    async function save() {
        if (!form.name.trim()) {
            setError('Укажите наименование поставщика.');
            return;
        }

        const payload = {
            name: form.name.trim(),
            inn: form.inn.trim() || null,
            isActive: form.isActive
        };

        try {
            if (editingUuid) {
                await updateSupplier(editingUuid, payload);
            } else {
                await createSupplier(payload);
            }

            cancelEdit();
            await load();
        } catch {
            setError('Не удалось сохранить поставщика.');
        }
    }

    return (
        <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
            <h1>Поставщики</h1>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <section
                style={{
                    border: '1px solid #ccc',
                    padding: 16,
                    marginBottom: 24,
                    maxWidth: 560
                }}
            >
                <h2>{editingUuid ? 'Редактирование' : 'Новый поставщик'}</h2>

                <div style={{ display: 'grid', gap: 8 }}>
                    <input
                        placeholder="Наименование"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                    <input
                        placeholder="ИНН"
                        value={form.inn}
                        onChange={e => setForm({ ...form, inn: e.target.value })}
                    />
                    <label>
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        />
                        Активен
                    </label>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={save}>
                            {editingUuid ? 'Сохранить' : 'Добавить'}
                        </button>
                        {editingUuid && <button onClick={cancelEdit}>Отмена</button>}
                    </div>
                </div>
            </section>

            <table border={1} cellPadding={8}>
                <thead>
                <tr>
                    <th>Наименование</th>
                    <th>ИНН</th>
                    <th>Активен</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {items.map(item => (
                    <tr key={item.uuid}>
                        <td>{item.name}</td>
                        <td>{item.inn}</td>
                        <td>{item.isActive ? 'Да' : 'Нет'}</td>
                        <td>
                            <button onClick={() => startEdit(item)}>Изменить</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </main>
    );
}