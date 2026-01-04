/**
 * Utility functions for file operations
 * PostgreSQL/API-based version - no Supabase dependencies
 */

/**
 * Check if a URL points to an image file
 * @param {string} url - The URL to check
 * @returns {boolean}
 */
export const isImageUrl = (url) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|tiff|heic)$/i.test(cleanUrl);
};

/**
 * Extract filename from URL
 * @param {string} url - The URL to extract filename from
 * @returns {string}
 */
export const getFileName = (url) => {
    if (!url) return 'file';
    return url.split('/').pop().split('?')[0];
};

/**
 * Get file extension from URL
 * @param {string} url - The URL to extract extension from
 * @returns {string}
 */
export const getFileExtension = (url) => {
    const fileName = getFileName(url);
    return fileName.split('.').pop()?.toUpperCase() || 'FILE';
};

/**
 * Convert a file path to a public URL
 * @param {string} path - The file path or URL
 * @param {string} bucket - The storage bucket name (default: 'vehicles')
 * @returns {string} - The public URL
 */
export const getPublicUrl = (path, bucket = 'vehicles') => {
    if (!path) return null;

    // If it's already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
        return path;
    }

    // If it's an object with url property
    if (typeof path === 'object' && path.url) {
        return path.url;
    }

    // Remove bucket prefix if present
    const cleanPath = path.replace(`${bucket}/`, '');

    // Construct URL - works with both local storage and R2
    return `/uploads/${bucket}/${cleanPath}`;
};

/**
 * Download a file from URL
 * @param {string} fileUrl - URL of the file to download
 * @param {string} fileName - Name to save the file as
 */
export const downloadFile = async (fileUrl, fileName) => {
    try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName || getFileName(fileUrl);
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch {
        // Fallback: open in new tab
        window.open(fileUrl, '_blank');
    }
};

/**
 * Format message files from various formats into a consistent array of PUBLIC URLs
 * @param {Object|Array} messageFile - The message_file field from a message
 * @returns {Array} Array of public file URLs
 */
export const formatMessageFiles = (messageFile) => {
    if (!messageFile) return [];

    let paths = [];

    // If it's already an array
    if (Array.isArray(messageFile)) {
        paths = messageFile.filter(f => typeof f === 'string');
    }
    // If it's an object with a url property
    else if (typeof messageFile === 'object' && messageFile.url) {
        paths = [messageFile.url];
    }
    // If it's a string
    else if (typeof messageFile === 'string') {
        paths = [messageFile];
    }

    // Convert paths to public URLs
    return paths.map(path => getPublicUrl(path, 'messages'));
};
