import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
    getStorageLocations,
    updateStorageLocation,
    type StorageLocation
} from "../api/storage";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import './SharedPage.css';

export default function WarehouseMapPage() {
    const { zoneUuid } = useParams();

    const [locations, setLocations] = useState<StorageLocation[]>([]);
    const [selected, setSelected] = useState<StorageLocation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function load() {
        if (!zoneUuid) return;

        try {
            const items = await getStorageLocations(zoneUuid);
            setLocations(items);
            setError(null);
        } catch {
            setError("Не удалось загрузить карту склада");
        }
    }

    useEffect(() => {
        load();
    }, [zoneUuid]);

    const rows = useMemo(() => {
        const map = new Map<string, StorageLocation[]>();

        for (const location of locations) {
            const row = location.name.split("-")[0];
            map.set(row, [...(map.get(row) ?? []), location]);
        }

        return [...map.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([row, cells]) => ({
                row,
                cells: cells.sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, { numeric: true })
                )
            }));
    }, [locations]);

    function cellStyle(location: StorageLocation) {
        if (!location.isActive) {
            return { background: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0' };
        }
        if (location.isBlocked) {
            return { background: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' };
        }
        if (location.palletCount >= location.maxPallets) {
            return { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' };
        }
        return { background: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0' };
    }

    async function save() {
        if (!selected) return;

        setSaving(true);
        try {
            await updateStorageLocation(selected.uuid, {
                name: selected.name,
                description: selected.description,
                isActive: selected.isActive,
                isBlocked: selected.isBlocked,
                blockReason: selected.blockReason,
                maxPallets: selected.maxPallets
            });

            setSelected(null);
            await load();
        } catch {
            setError("Не удалось сохранить изменения");
        } finally {
            setSaving(false);
        }
    }

    if (!zoneUuid) {
        return <p>Склад не выбран</p>;
    }

    return (
        <div className="entity-page">
            <div className="section-header">
                <div className="section-header__title">
                    <h1>Карта склада</h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Badge variant="success">● Свободна</Badge>
                    <Badge variant="warning">● Заполнена</Badge>
                    <Badge variant="danger">● Заблокирована</Badge>
                    <Badge variant="default">● Неактивна</Badge>
                </div>
            </div>

            {error && (
                <div className="alert alert--danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <div className="warehouse-grid">
                {rows.map(({ row, cells }) => (
                    <div key={row} className="warehouse-row">
                        <div className="warehouse-row__label">{row}</div>
                        <div className="warehouse-row__cells">
                            {cells.map(cell => (
                                <button
                                    key={cell.uuid}
                                    className="warehouse-cell"
                                    style={cellStyle(cell)}
                                    onClick={() => setSelected(cell)}
                                    title={cell.name}
                                >
                                    <span className="warehouse-cell__name">{cell.name}</span>
                                    <span className="warehouse-cell__count">
                                        {cell.palletCount}/{cell.maxPallets}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <Card className="modal-card" onClick={e => e.stopPropagation()}>
                        <h2>Ячейка {selected.name}</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <label className="checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    checked={selected.isActive}
                                    onChange={e => setSelected({ ...selected, isActive: e.target.checked })}
                                />
                                <span>Активна</span>
                            </label>

                            <label className="checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    checked={selected.isBlocked}
                                    onChange={e => setSelected({ ...selected, isBlocked: e.target.checked })}
                                />
                                <span>Запрещена для размещения</span>
                            </label>

                            {selected.isBlocked && (
                                <Input
                                    label="Причина запрета"
                                    value={selected.blockReason ?? ""}
                                    onChange={e => setSelected({ ...selected, blockReason: e.target.value })}
                                    placeholder="Укажите причину"
                                />
                            )}

                            <Input
                                label="Вместимость, паллет"
                                type="number"
                                min={0}
                                value={selected.maxPallets}
                                onChange={e => setSelected({ ...selected, maxPallets: Number(e.target.value) })}
                            />

                            <div className="entity-page__form-actions">
                                <Button variant="primary" onClick={save} disabled={saving}>
                                    {saving ? 'Сохранение…' : 'Сохранить'}
                                </Button>
                                <Button variant="secondary" onClick={() => setSelected(null)}>
                                    Отмена
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
