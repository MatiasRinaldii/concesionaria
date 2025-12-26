/**
 * API Client for communicating with Express backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Token management
let accessToken = null;
let refreshToken = null;

export const setTokens = (access, refresh) => {
    accessToken = access;
    refreshToken = refresh;
    if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
    }
};

export const getAccessToken = () => {
    if (accessToken) return accessToken;
    if (typeof window !== 'undefined') {
        accessToken = localStorage.getItem('accessToken');
    }
    return accessToken;
};

export const getRefreshToken = () => {
    if (refreshToken) return refreshToken;
    if (typeof window !== 'undefined') {
        refreshToken = localStorage.getItem('refreshToken');
    }
    return refreshToken;
};

export const clearTokens = () => {
    accessToken = null;
    refreshToken = null;
    if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
};

// Token refresh logic
let isRefreshing = false;
let refreshPromise = null;

const refreshAccessToken = async () => {
    if (isRefreshing) {
        return refreshPromise;
    }

    isRefreshing = true;
    const currentRefresh = getRefreshToken();

    if (!currentRefresh) {
        isRefreshing = false;
        throw new Error('No refresh token');
    }

    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefresh })
    })
        .then(async (res) => {
            if (!res.ok) {
                clearTokens();
                throw new Error('Token refresh failed');
            }
            const data = await res.json();
            setTokens(data.accessToken, data.refreshToken);
            return data.accessToken;
        })
        .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
        });

    return refreshPromise;
};

/**
 * Make an authenticated API request
 */
export const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;
    const token = getAccessToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        config.body = JSON.stringify(options.body);
    }

    let response = await fetch(url, config);

    // Handle token expiration
    if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.code === 'TOKEN_EXPIRED') {
            try {
                await refreshAccessToken();
                // Retry with new token
                headers['Authorization'] = `Bearer ${getAccessToken()}`;
                response = await fetch(url, { ...config, headers });
            } catch {
                clearTokens();
                window.location.href = '/login';
                throw new Error('Session expired');
            }
        } else {
            clearTokens();
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return null;
    }

    return response.json();
};

/**
 * API helper methods
 */
export const api = {
    get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
    patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
    put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
    delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' })
};

/**
 * Upload file using FormData
 */
export const uploadFile = async (file, folder = 'uploads') => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('folder', folder);

    const token = getAccessToken();

    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data.files[0]; // Return first file
};

/**
 * Upload multiple files
 */
export const uploadFiles = async (files, folder = 'uploads') => {
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file);
    }
    formData.append('folder', folder);

    const token = getAccessToken();

    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data.files;
};

export default api;
