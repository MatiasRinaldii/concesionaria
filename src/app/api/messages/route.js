import { NextResponse } from 'next/server';
import { query, queryOne, insert } from '@/lib/db';

// GET /api/messages - Get messages for a client
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');

        if (!clientId) {
            return NextResponse.json({ error: 'client_id required' }, { status: 400 });
        }

        const messages = await query(`
            SELECT m.*, 
                   u.full_name as agent_name,
                   u.avatar_url as agent_avatar
            FROM messages m
            LEFT JOIN users u ON m.agent_id = u.id
            WHERE m.session_id = $1
            ORDER BY m.created_at ASC
        `, [clientId]);

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/messages - Create a message
export async function POST(request) {
    try {
        const data = await request.json();

        if (!data.session_id) {
            return NextResponse.json({ error: 'session_id required' }, { status: 400 });
        }

        // Get client info for platform
        const client = await queryOne(
            'SELECT platform FROM clients WHERE id = $1',
            [data.session_id]
        );
        const platform = data.platform || client?.platform || 'web';

        const message = await insert('messages', {
            session_id: data.session_id,
            agent_id: data.agent_id || null,
            message: data.message || '',
            message_file: data.message_file ? JSON.stringify(data.message_file) : '[]',
            platform: platform,
            read: false
        });

        // Emit socket event if available (real-time update for all UI clients)
        if (global.io) {
            global.io.to(`client:${data.session_id}`).emit('new_message', message);
        }

        // If message is from agent (human), also send to n8n for platform delivery
        if (data.agent_id && process.env.N8N_SEND_MESSAGE_WEBHOOK) {
            try {
                const n8nPayload = {
                    session_id: data.session_id,
                    message: data.message || '',
                    message_file: data.message_file || null,
                    agent_id: data.agent_id,
                    platform: platform,
                    timestamp: new Date().toISOString()
                };

                // Fire and forget - don't block response
                fetch(process.env.N8N_SEND_MESSAGE_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(n8nPayload)
                }).then(res => {
                    if (!res.ok) {
                        console.error('n8n webhook failed:', res.status);
                    } else {
                        console.log('📤 Message forwarded to n8n for platform delivery');
                    }
                }).catch(err => {
                    console.error('n8n webhook error:', err.message);
                });
            } catch (n8nErr) {
                // Don't fail the request if n8n fails
                console.error('Error calling n8n:', n8nErr);
            }
        }

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Create message error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// PATCH /api/messages - Mark messages as read
export async function PATCH(request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');

        if (!clientId) {
            return NextResponse.json({ error: 'client_id required' }, { status: 400 });
        }

        await query(
            'UPDATE messages SET read = TRUE WHERE session_id = $1 AND read = FALSE',
            [clientId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
