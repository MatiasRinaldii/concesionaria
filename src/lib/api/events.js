import { supabase } from '../supabase';

/**
 * Get all events
 */
export async function getEvents() {
    const { data, error } = await supabase
        .from('events_calendar')
        .select('*, event_types(*), clients:client_id(name)')
        .order('date', { ascending: true });

    console.log('🗓️ getEvents response:', { data, error });

    if (error) {
        console.error('Supabase getEvents error:', error.message, error.details, error.hint);
        throw error;
    }
    return data || [];
}

/**
 * Get event types
 */
export async function getEventTypes() {
    const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('name');

    if (error) throw error;
    return data || [];
}

/**
 * Create an event
 */
export async function createEvent(eventData) {
    console.log('📝 createEvent input:', eventData);

    const { data, error } = await supabase
        .from('events_calendar')
        .insert(eventData)
        .select('*')
        .single();

    console.log('📝 createEvent response:', { data, error });

    if (error) {
        console.error('createEvent error:', error.message, error.details, error.hint);
        throw error;
    }
    return data;
}

/**
 * Update an event
 */
export async function updateEvent(id, updates) {
    const { data, error } = await supabase
        .from('events_calendar')
        .update(updates)
        .eq('id', id)
        .select('*, event_types(*)')
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete an event
 */
export async function deleteEvent(id) {
    const { error } = await supabase
        .from('events_calendar')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Create an event type
 */
export async function createEventType(eventTypeData) {
    const { data, error } = await supabase
        .from('event_types')
        .insert(eventTypeData)
        .select()
        .single();

    if (error) throw error;
    return data;
}
