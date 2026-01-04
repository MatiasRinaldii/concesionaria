/**
 * Get all events
 */
export async function getEvents() {
    const res = await fetch('/api/events', { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching events');
    return res.json();
}

/**
 * Get event types
 */
export async function getEventTypes() {
    const res = await fetch('/api/event-types', { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching event types');
    return res.json();
}

/**
 * Create an event
 */
export async function createEvent(eventData) {
    console.log('📝 createEvent input:', eventData);

    const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventData)
    });

    if (!res.ok) throw new Error('Error creating event');
    const data = await res.json();
    console.log('📝 createEvent response:', data);
    return data;
}

/**
 * Update an event
 */
export async function updateEvent(id, updates) {
    const res = await fetch(`/api/events?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Error updating event');
    return res.json();
}

/**
 * Delete an event
 */
export async function deleteEvent(id) {
    const res = await fetch(`/api/events?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Error deleting event');
}

/**
 * Create an event type
 */
export async function createEventType(eventTypeData) {
    const res = await fetch('/api/event-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventTypeData)
    });
    if (!res.ok) throw new Error('Error creating event type');
    return res.json();
}
