import { supabase } from '../supabase';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(file, bucket = 'vehicles') {
    if (!file || !file.name) {
        throw new Error('Invalid file: file object with name property is required');
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return {
        path: data.path,
        url: publicUrl
    };
}

/**
 * Get public URL for a file
 */
export function getFileUrl(path, bucket = 'vehicles') {
    if (!path) return null;

    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return publicUrl;
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(path, bucket = 'vehicles') {
    const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

    if (error) throw error;
}
