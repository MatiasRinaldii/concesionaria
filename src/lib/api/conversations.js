import { supabase } from '../supabase';

/**
 * Get all conversations for a client
 */
export async function getConversations(clientId) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Get messages for a conversation
 */
export async function getMessages(clientId) {
    return getConversations(clientId);
}

/**
 * Send a message
 */
export async function sendMessage(messageData) {
    const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(clientId) {
    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('client_id', clientId)
        .eq('is_read', false);

    if (error) throw error;
}
