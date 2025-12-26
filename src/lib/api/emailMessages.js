import { supabase } from '../supabase';

/**
 * Get all email messages
 */
export async function getEmailMessages() {
    const { data, error } = await supabase
        .from('email_messages')
        .select('*')
        .order('created_at', { ascending: false });

    console.log('📧 getEmailMessages response:', { data, error });

    if (error) {
        console.error('Email messages error:', error);
        throw error;
    }
    return data || [];
}

/**
 * Get email messages for a specific client
 */
export async function getClientEmails(clientId) {
    const { data, error } = await supabase
        .from('email_messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Create a new email message
 */
export async function createEmailMessage(emailData) {
    const { data, error } = await supabase
        .from('email_messages')
        .insert(emailData)
        .select()
        .single();

    if (error) throw error;
    return data;
}
