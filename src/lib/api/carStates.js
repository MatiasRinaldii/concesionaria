/**
 * Fetch all car states
 */
export async function getCarStates() {
    const res = await fetch('/api/car-states', { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching car states');
    return res.json();
}

/**
 * Create a car state
 */
export async function createCarState(data) {
    const res = await fetch('/api/car-states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error creating car state');
    return res.json();
}

/**
 * Update a car state
 */
export async function updateCarState(id, updates) {
    const res = await fetch(`/api/car-states?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Error updating car state');
    return res.json();
}

/**
 * Delete a car state
 */
export async function deleteCarState(id) {
    const res = await fetch(`/api/car-states?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Error deleting car state');
}
