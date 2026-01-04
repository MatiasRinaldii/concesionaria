/**
 * Fetch all clients from the database
 * @returns {Promise<Array>} Array of client objects
 */
export async function getClients() {
    const res = await fetch('/api/clients', { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching clients');
    const data = await res.json();

    // Map to expected format
    return (data || []).map(client => ({
        ...client,
        label: client.label_name ? { name: client.label_name, color: client.label_color } : null,
        tags: client.tags || []
    }));
}

/**
 * Get a single client by ID
 * @param {string} id - Client ID
 * @returns {Promise<Object>} Client object
 */
export async function getClient(id) {
    const res = await fetch(`/api/clients?id=${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching client');
    const data = await res.json();

    // If array, get first item
    const client = Array.isArray(data) ? data[0] : data;

    return {
        ...client,
        label: client?.label_name ? { name: client.label_name, color: client.label_color } : null,
        tags: client?.tags || []
    };
}

/**
 * Create a new client
 * @param {Object} clientData - Client data to insert
 * @returns {Promise<Object>} Created client
 */
export async function createClient(clientData) {
    const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(clientData)
    });
    if (!res.ok) throw new Error('Error creating client');
    return res.json();
}

/**
 * Update an existing client
 * @param {string} id - Client ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated client
 */
export async function updateClient(id, updates) {
    const res = await fetch(`/api/clients?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Error updating client');
    return res.json();
}

/**
 * Delete a client
 * @param {string} id - Client ID
 * @returns {Promise<void>}
 */
export async function deleteClient(id) {
    const res = await fetch(`/api/clients?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Error deleting client');
}

/**
 * Add tags to a client
 * @param {string} clientId - Client ID
 * @param {Array<string>} tagIds - Array of tag IDs
 */
export async function addTagsToClient(clientId, tagIds) {
    const res = await fetch('/api/clients/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ client_id: clientId, tag_ids: tagIds })
    });
    if (!res.ok) throw new Error('Error adding tags to client');
}

/**
 * Remove a tag from a client
 * @param {string} clientId - Client ID
 * @param {string} tagId - Tag ID
 */
export async function removeTagFromClient(clientId, tagId) {
    const res = await fetch(`/api/clients/tags?client_id=${clientId}&tag_id=${tagId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Error removing tag from client');
}
