// ============================================
// LABELS - Using API Routes
// ============================================

export async function getLabels() {
    const res = await fetch('/api/labels', { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching labels');
    return res.json();
}

export async function createLabel(labelData) {
    const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(labelData)
    });
    if (!res.ok) throw new Error('Error creating label');
    return res.json();
}

export async function deleteLabel(id) {
    const res = await fetch(`/api/labels?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Error deleting label');
}

// ============================================
// TAGS - Using API Routes
// ============================================

export async function getTags() {
    const res = await fetch('/api/tags', { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching tags');
    return res.json();
}

export async function createTag(name) {
    const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Error creating tag');
    return res.json();
}

export async function deleteTag(id) {
    const res = await fetch(`/api/tags?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Error deleting tag');
}

// ============================================
// NOTES - Using API Routes
// ============================================

export async function getNotes(clientId) {
    const res = await fetch(`/api/notes?client_id=${clientId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching notes');
    return res.json();
}

export async function createNote(clientId, message) {
    const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ client_id: clientId, message })
    });
    if (!res.ok) throw new Error('Error creating note');
    return res.json();
}

export async function deleteNote(id) {
    const res = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Error deleting note');
}

// ============================================
// USERS - Using API Routes
// ============================================

export async function getUsers() {
    const res = await fetch('/api/users', { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching users');
    return res.json();
}
