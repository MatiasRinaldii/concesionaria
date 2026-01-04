import { NextResponse } from 'next/server';
import { query, insert } from '@/lib/db';

// GET /api/email-messages - Get email messages
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');

        let sql = `
            SELECT em.*, c.name as client_name, c.email as client_email
            FROM email_messages em
            LEFT JOIN clients c ON em.client_id = c.id
        `;
        const params = [];

        if (clientId) {
            params.push(clientId);
            sql += ` WHERE em.client_id = $${params.length}`;
        }

        sql += ' ORDER BY em.created_at DESC';

        const emails = await query(sql, params);
        return NextResponse.json(emails);
    } catch (error) {
        console.error('Get email messages error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/email-messages - Create email message
export async function POST(request) {
    try {
        const data = await request.json();
        const email = await insert('email_messages', {
            client_id: data.client_id,
            direction: data.direction || 'outbound',
            subject: data.subject || null,
            body: data.body || '',
            from_email: data.from_email || null,
            to_email: data.to_email || null,
            status: data.status || 'sent'
        });
        return NextResponse.json(email, { status: 201 });
    } catch (error) {
        console.error('Create email message error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
