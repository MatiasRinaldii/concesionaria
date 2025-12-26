import { supabase } from '../supabase';

/**
 * Get all car states
 */
export async function getCarStates() {
    const { data, error } = await supabase
        .from('car_state')
        .select('*')
        .order('state');

    if (error) throw error;
    return data || [];
}

/**
 * Create a car state
 */
export async function createCarState(carState) {
    const { data, error } = await supabase
        .from('car_state')
        .insert(carState)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update a car state
 */
export async function updateCarState(id, updates) {
    const { data, error } = await supabase
        .from('car_state')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a car state
 */
export async function deleteCarState(id) {
    const { error } = await supabase
        .from('car_state')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
