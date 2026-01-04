/**
 * Fetch all vehicles
 */
export async function getVehicles(filters = {}) {
    let url = '/api/vehicles';
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.make) params.append('make', filters.make);

    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching vehicles');
    return res.json();
}

/**
 * Get a single vehicle by ID
 */
export async function getVehicle(id) {
    const res = await fetch(`/api/vehicles?id=${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching vehicle');
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
}

/**
 * Create a new vehicle
 */
export async function createVehicle(vehicleData) {
    const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(vehicleData)
    });
    if (!res.ok) throw new Error('Error creating vehicle');
    return res.json();
}

/**
 * Update an existing vehicle
 */
export async function updateVehicle(id, updates) {
    const res = await fetch(`/api/vehicles?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Error updating vehicle');
    return res.json();
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id) {
    const res = await fetch(`/api/vehicles?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Error deleting vehicle');
}
