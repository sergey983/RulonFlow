const api = "/api/v1";

export type StorageZone = {
    uuid: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    locationCount: number;
    freeLocations: number;
    blockedLocations: number;
};

export type StorageLocation = {
    uuid: string;
    zoneUuid: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    isBlocked: boolean;
    blockReason?: string | null;
    maxPallets: number;
    palletCount: number;
};

export async function getStorageZones(): Promise<StorageZone[]> {
    const res = await fetch(`${api}/storage-zones`);
    if (!res.ok) throw new Error("Не удалось загрузить склады");
    const data = await res.json();
    return data.items;
}

export async function getStorageLocations(zoneUuid: string): Promise<StorageLocation[]> {
    const res = await fetch(`${api}/storage-zones/${zoneUuid}/locations`);
    if (!res.ok) throw new Error("Не удалось загрузить карту склада");
    const data = await res.json();
    return data.items;
}

export async function updateStorageLocation(
    uuid: string,
    values: {
        name: string;
        description?: string | null;
        isActive: boolean;
        isBlocked: boolean;
        blockReason?: string | null;
        maxPallets: number;
    }
): Promise<void> {
    const res = await fetch(`${api}/storage-locations/${uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
    });

    if (!res.ok) throw new Error("Не удалось сохранить ячейку");
}