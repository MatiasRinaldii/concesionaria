/**
 * Get email messages for a client
 */
export async function getEmailMessages(clientId) {
    let url = '/api/email-messages';
    if (clientId) url += `?client_id=${clientId}`;

    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching email messages');
    return res.json();
}

/**
 * Create an email message
 */
export async function createEmailMessage(data) {
    const res = await fetch('/api/email-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error creating email message');
    return res.json();
}

/**
 * Send an email (alias for createEmailMessage with direction=outbound)
 */
export async function sendEmail(data) {
    return createEmailMessage({
        ...data,
        direction: 'outbound',
        status: 'sent'
    });
}
