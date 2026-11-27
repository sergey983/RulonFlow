import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStorageZones, type StorageZone } from "../api/storage";
import Badge from "../ui/Badge";
import Table, { TableHeader, TableBody, TableRow, TableCell } from "../ui/Table";

export default function StorageZonesPage() {
    const [zones, setZones] = useState<StorageZone[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getStorageZones()
            .then(setZones)
            .catch(() => setError("Не удалось загрузить склады"));
    }, []);

    return (
        <div className="entity-page">
            <div className="section-header">
                <div className="section-header__title">
                    <h1>Склады</h1>
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

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell th>Склад</TableCell>
                        <TableCell th>Ячеек</TableCell>
                        <TableCell th>Свободно</TableCell>
                        <TableCell th>Заблокировано</TableCell>
                        <TableCell th>Загрузка</TableCell>
                        <TableCell th className="table__cell--actions">Действия</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {zones.map(zone => {
                        const usagePercent = zone.locationCount > 0
                            ? Math.round(((zone.locationCount - zone.freeLocations) / zone.locationCount) * 100)
                            : 0;

                        return (
                            <TableRow key={zone.uuid}>
                                <TableCell><strong>{zone.name}</strong></TableCell>
                                <TableCell><code>{zone.locationCount}</code></TableCell>
                                <TableCell className="text-muted">{zone.freeLocations}</TableCell>
                                <TableCell className="text-muted">{zone.blockedLocations}</TableCell>
                                <TableCell>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            flex: 1,
                                            height: '6px',
                                            borderRadius: '3px',
                                            background: '#e5e7eb',
                                            overflow: 'hidden'
                                        }} />
                                        <Badge variant={usagePercent > 80 ? 'danger' : usagePercent > 50 ? 'warning' : 'success'}>
                                            {usagePercent}%
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="table__cell--actions">
                                    <Link to={`/dictionaries/warehouse-map/${zone.uuid}`}>
                                        <Badge variant="info">Открыть карту</Badge>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {zones.length === 0 && (
                        <TableRow>
                            <TableCell th={false} colSpan={6} className="text-center">
                                <div className="empty-state">
                                    <div className="empty-state__icon">🏢</div>
                                    <div className="empty-state__title">Нет данных</div>
                                    <div className="empty-state__description">Склады не найдены</div>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
