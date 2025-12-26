import { supabase } from '../supabase';

/**
 * Get all phone calls
 */
export async function getPhoneCalls() {
    const { data, error } = await supabase
        .from('phone_calls')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get phone calls for a specific client
 */
export async function getClientPhoneCalls(clientId) {
    const { data, error } = await supabase
        .from('phone_calls')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Create a new phone call record
 */
export async function createPhoneCall(callData) {
    const { data, error } = await supabase
        .from('phone_calls')
        .insert(callData)
        .select()
        .single();

    if (error) throw error;
    return data;
}
