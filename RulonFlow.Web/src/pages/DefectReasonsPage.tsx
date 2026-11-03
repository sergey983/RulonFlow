import { useEffect, useState } from 'react';
import {
    getDefectReasons,
    createDefectReason,
    updateDefectReason,
    type DefectReason
} from '../api/defectReasons';

const emptyForm = {
    name: '',
    description: '',
    isActive: true,
    sortOrder: 10
};

export default function DefectReasonsPage() {
    const [items, setItems] = useState<DefectReason[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [editingUuid, setEditingUuid] = useState<string | null>(null);
    const [error, setError] = useState('');

    async function load() {
        try {
            const result = await getDefectReasons();
            setItems(result.items);
            setError('');
        } catch {
            setError('Не удалось загрузить причины брака.');
        }
    }

    useEffect(() => {
        load();
    }, []);

    function startEdit(item: DefectReason) {
        setEditingUuid(item.uuid);
        setForm({
            name: item.name,
            description: item.description ?? '',
            isActive: item.isActive,
            sortOrder: item.sortOrder
        });
    }

    function cancelEdit() {
        setEditingUuid(null);
        setForm(emptyForm);
    }

    async function save() {
        if (!form.name.trim()) {
            setError('Укажите наименование причины брака.');
            return;
        }

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            isActive: form.isActive,
            sortOrder: Number(form.sortOrder) || 0
        };

        try {
            if (editingUuid) {
                await updateDefectReason(editingUuid, payload);
            } else {
                await createDefectReason(payload);
            }

            cancelEdit();
            await load();
        } catch {
            setError('Не удалось сохранить причину брака.');
        }
    }

    return (
        <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
            <h1>Причины брака</h1>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <section
                style={{
                    border: '1px solid #ccc',
                    padding: 16,
                    marginBottom: 24,
                    maxWidth: 640
                }}
            >
                <h2>{editingUuid ? 'Редактирование' : 'Новая причина брака'}</h2>

                <div style={{ display: 'grid', gap: 8 }}>
                    <input
                        placeholder="Наименование"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                    <input
                        placeholder="Описание"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Порядок сортировки"
                        value={form.sortOrder}
                        onChange={e =>
                            setForm({ ...form, sortOrder: Number(e.target.value) })
                        }
                    />
                    <label>
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        />
                        Активна
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
                    <th>Порядок</th>
                    <th>Наименование</th>
                    <th>Описание</th>
                    <th>Активна</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {items.map(item => (
                    <tr key={item.uuid}>
                        <td>{item.sortOrder}</td>
                        <td>{item.name}</td>
                        <td>{item.description}</td>
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