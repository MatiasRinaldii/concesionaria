import { supabase } from '../supabase';

// ============================================
// LABELS
// ============================================

export async function getLabels() {
    const { data, error } = await supabase
        .from('labels')
        .select('*')
        .order('name');

    if (error) throw error;
    return data || [];
}

export async function createLabel(labelData) {
    const { data, error } = await supabase
        .from('labels')
        .insert(labelData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteLabel(id) {
    const { error } = await supabase
        .from('labels')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// TAGS
// ============================================

export async function getTags() {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

    if (error) throw error;
    return data || [];
}

export async function createTag(name) {
    const { data, error } = await supabase
        .from('tags')
        .insert({ name })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteTag(id) {
    const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// NOTES
// ============================================

export async function getNotes(clientId) {
    const { data, error } = await supabase
        .from('notes')
        .select('*, users(full_name)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten user_name
    return (data || []).map(note => ({
        ...note,
        user_name: note.users?.full_name
    }));
}

export async function createNote(clientId, message) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('notes')
        .insert({
            client_id: clientId,
            user_id: user?.id || null,
            message
        })
        .select('*, users(full_name)')
        .single();

    if (error) throw error;
    return {
        ...data,
        user_name: data.users?.full_name
    };
}

export async function deleteNote(id) {
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// USERS (for team creation)
// ============================================

export async function getUsers() {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', user?.id || '');

    if (error) throw error;
    return data || [];
}
