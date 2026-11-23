import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStorageZones, type StorageZone } from "../api/storage";

export default function StorageZonesPage() {
    const [zones, setZones] = useState<StorageZone[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getStorageZones()
            .then(setZones)
            .catch(() => setError("Не удалось загрузить склады"));
    }, []);

    return (
        <div>
            <h2>Склады</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <table border={1} cellPadding={8}>
                <thead>
                <tr>
                    <th>Склад</th>
                    <th>Ячеек</th>
                    <th>Свободно</th>
                    <th>Заблокировано</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {zones.map(zone => (
                    <tr key={zone.uuid}>
                        <td>{zone.name}</td>
                        <td>{zone.locationCount}</td>
                        <td>{zone.freeLocations}</td>
                        <td>{zone.blockedLocations}</td>
                        <td>
                            <Link to={`/dictionaries/warehouse-map/${zone.uuid}`}>
                                Открыть карту
                            </Link>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}