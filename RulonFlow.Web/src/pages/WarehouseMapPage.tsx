import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
    getStorageLocations,
    updateStorageLocation,
    type StorageLocation
} from "../api/storage";

export default function WarehouseMapPage() {
    const { zoneUuid } = useParams();

    const [locations, setLocations] = useState<StorageLocation[]>([]);
    const [selected, setSelected] = useState<StorageLocation | null>(null);
    const [error, setError] = useState<string | null>(null);

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
            return { background: "#e5e7eb", color: "#6b7280" };
        }

        if (location.isBlocked) {
            return { background: "#fecaca", color: "#991b1b" };
        }

        if (location.palletCount >= location.maxPallets) {
            return { background: "#fde68a", color: "#92400e" };
        }

        return { background: "#bbf7d0", color: "#166534" };
    }

    async function save() {
        if (!selected) return;

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
        }
    }

    if (!zoneUuid) {
        return <p>Склад не выбран</p>;
    }

    return (
        <div>
            <h2>Карта склада</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <table cellPadding={6} style={{ borderCollapse: "collapse" }}>
                <tbody>
                {rows.map(({ row, cells }) => (
                    <tr key={row}>
                        <td style={{ fontWeight: 700 }}>{row}</td>

                        {cells.map(cell => (
                            <td key={cell.uuid}>
                                <button
                                    style={{
                                        width: 70,
                                        height: 44,
                                        border: "1px solid #9ca3af",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        ...cellStyle(cell)
                                    }}
                                    onClick={() => setSelected(cell)}
                                >
                                    {cell.name}
                                    <br />
                                    {cell.palletCount}/{cell.maxPallets}
                                </button>
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>

            {selected && (
                <div
                    style={{
                        marginTop: 24,
                        padding: 16,
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        maxWidth: 420
                    }}
                >
                    <h3>Ячейка {selected.name}</h3>

                    <label style={{ display: "block", marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={selected.isActive}
                            onChange={e =>
                                setSelected({ ...selected, isActive: e.target.checked })
                            }
                        />
                        Активна
                    </label>

                    <label style={{ display: "block", marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={selected.isBlocked}
                            onChange={e =>
                                setSelected({ ...selected, isBlocked: e.target.checked })
                            }
                        />
                        Запрещена для размещения
                    </label>

                    {selected.isBlocked && (
                        <input
                            placeholder="Причина запрета"
                            value={selected.blockReason ?? ""}
                            onChange={e =>
                                setSelected({ ...selected, blockReason: e.target.value })
                            }
                            style={{ width: "100%", marginBottom: 8 }}
                        />
                    )}

                    <label style={{ display: "block", marginBottom: 12 }}>
                        Вместимость, паллет:
                        <input
                            type="number"
                            min={0}
                            value={selected.maxPallets}
                            onChange={e =>
                                setSelected({
                                    ...selected,
                                    maxPallets: Number(e.target.value)
                                })
                            }
                            style={{ width: 80, marginLeft: 8 }}
                        />
                    </label>

                    <button onClick={save}>Сохранить</button>
                    <button
                        style={{ marginLeft: 8 }}
                        onClick={() => setSelected(null)}
                    >
                        Отмена
                    </button>
                </div>
            )}
        </div>
    );
}