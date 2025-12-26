import { supabase } from '../supabase';

/**
 * Fetch all clients from the database
 * @returns {Promise<Array>} Array of client objects
 */
export async function getClients() {
    const { data, error } = await supabase
        .from('clients')
        .select(`
            *,
            label:labels!clients_label_id_fkey(*),
            tags:tag_client(tag_id, tags(id, name))
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten tags
    return (data || []).map(client => ({
        ...client,
        tags: client.tags?.map(t => t.tags) || []
    }));
}

/**
 * Get a single client by ID
 * @param {string} id - Client ID
 * @returns {Promise<Object>} Client object
 */
export async function getClient(id) {
    const { data, error } = await supabase
        .from('clients')
        .select(`
            *,
            label:labels!clients_label_id_fkey(*),
            tags:tag_client(tag_id, tags(id, name))
        `)
        .eq('id', id)
        .single();

    if (error) throw error;

    return {
        ...data,
        tags: data.tags?.map(t => t.tags) || []
    };
}

/**
 * Create a new client
 * @param {Object} clientData - Client data to insert
 * @returns {Promise<Object>} Created client
 */
export async function createClient(clientData) {
    const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update an existing client
 * @param {string} id - Client ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated client
 */
export async function updateClient(id, updates) {
    const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a client
 * @param {string} id - Client ID
 * @returns {Promise<void>}
 */
export async function deleteClient(id) {
    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Add tags to a client
 * @param {string} clientId - Client ID
 * @param {Array<string>} tagIds - Array of tag IDs
 */
export async function addTagsToClient(clientId, tagIds) {
    const inserts = tagIds.map(tag_id => ({ client_id: clientId, tag_id }));
    const { error } = await supabase
        .from('tag_client')
        .insert(inserts);

    if (error) throw error;
}

/**
 * Remove a tag from a client
 * @param {string} clientId - Client ID
 * @param {string} tagId - Tag ID
 */
export async function removeTagFromClient(clientId, tagId) {
    const { error } = await supabase
        .from('tag_client')
        .delete()
        .eq('client_id', clientId)
        .eq('tag_id', tagId);

    if (error) throw error;
}
