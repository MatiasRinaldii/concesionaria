/**
 * Get phone calls for a client
 */
export async function getPhoneCalls(clientId) {
    let url = '/api/phone-calls';
    if (clientId) url += `?client_id=${clientId}`;

    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching phone calls');
    return res.json();
}

/**
 * Create a phone call
 */
export async function createPhoneCall(data) {
    const res = await fetch('/api/phone-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error creating phone call');
    return res.json();
}

/**
 * Update a phone call
 */
export async function updatePhoneCall(id, updates) {
    const res = await fetch(`/api/phone-calls?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Error updating phone call');
    return res.json();
}
