/**
 * Upload a file to storage
 * Uses API route which supports R2 (production) or local filesystem (development)
 */
export async function uploadFile(file, bucket = 'vehicles') {
    if (!file || !file.name) {
        throw new Error('Invalid file: file object with name property is required');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);

    const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
    }

    return res.json();
}

/**
 * Get public URL for a file
 * If it's already a URL, returns as-is
 * Otherwise constructs URL from path
 */
export function getFileUrl(path, bucket = 'vehicles') {
    if (!path) return null;

    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
        return path;
    }

    // Construct URL from path - assumes local storage or R2 public URL
    // In production, R2_PUBLIC_URL would be used by the upload endpoint
    return `/uploads/${bucket}/${path}`;
}

/**
 * Delete a file from storage
 * Note: This functionality requires the storage backend to support deletion
 */
export async function deleteFile(path, bucket = 'vehicles') {
    const res = await fetch(`/api/upload?path=${encodeURIComponent(path)}&bucket=${bucket}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Delete failed');
    }
}
