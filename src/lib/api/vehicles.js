import { supabase } from '../supabase';

/**
 * Get all vehicles
 */
export async function getVehicles() {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get a single vehicle
 */
export async function getVehicle(id) {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Create a vehicle
 */
export async function createVehicle(vehicleData) {
    const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update a vehicle
 */
export async function updateVehicle(id, updates) {
    const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id) {
    const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
