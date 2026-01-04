import { NextResponse } from 'next/server';
import { query, queryOne, insert } from '@/lib/db';

// Optional: API Key validation
function validateApiKey(request) {
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.WEBHOOK_API_KEY;

    // If no key configured, allow all requests (dev mode)
    if (!expectedKey) return true;

    return apiKey === expectedKey;
}

/**
 * POST /api/webhook/incoming-message
 * 
 * Endpoint for n8n to send incoming messages from WhatsApp/Instagram/etc.
 * Flow: n8n → API → PostgreSQL + Socket.io → Browser clients
 * 
 * Expected payload:
 * {
 *   session_id: "uuid",       // Client ID (required)
 *   message: "string",        // Message content
 *   message_file: [],         // File URLs (optional)
 *   platform: "whatsapp",     // Platform source
 *   external_id: "string",    // External message ID for idempotency (optional)
 *   sender_name: "string",    // Contact name (optional)
 *   sender_phone: "string"    // Contact phone (optional)
 * }
 */
export async function POST(request) {
    try {
        // Validate API key if configured
        if (!validateApiKey(request)) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid API key' },
                { status: 401 }
            );
        }

        const data = await request.json();

        // Validate required fields
        if (!data.session_id) {
            return NextResponse.json(
                { error: 'session_id is required' },
                { status: 400 }
            );
        }

        if (!data.message?.trim() && (!data.message_file || data.message_file.length === 0)) {
            return NextResponse.json(
                { error: 'message or message_file is required' },
                { status: 400 }
            );
        }

        // Check if client exists
        const client = await queryOne(
            'SELECT id, name FROM clients WHERE id = $1',
            [data.session_id]
        );

        if (!client) {
            // Optionally create client if not exists
            if (data.sender_name || data.sender_phone) {
                await insert('clients', {
                    id: data.session_id,
                    name: data.sender_name || data.sender_phone || 'Unknown',
                    phone: data.sender_phone || null,
                    platform: data.platform || 'whatsapp',
                    status: 'new'
                });
            } else {
                return NextResponse.json(
                    { error: 'Client not found and no sender info provided' },
                    { status: 404 }
                );
            }
        }

        // Check for duplicate message (idempotency)
        if (data.external_id) {
            const existing = await queryOne(
                'SELECT id FROM messages WHERE external_id = $1',
                [data.external_id]
            );
            if (existing) {
                return NextResponse.json(
                    { message: 'Message already processed', id: existing.id },
                    { status: 200 }
                );
            }
        }

        // Insert message into PostgreSQL
        const messageData = {
            session_id: data.session_id,
            agent_id: null, // Incoming message from client, not agent
            message: data.message?.trim() || null,
            message_file: data.message_file ? JSON.stringify(data.message_file) : '[]',
            platform: data.platform || 'whatsapp',
            read: false
        };

        // Add external_id for idempotency if provided
        if (data.external_id) messageData.external_id = data.external_id;

        const message = await insert('messages', messageData);

        // Emit to Socket.io for real-time update
        // Uses Redis adapter automatically for multi-instance support
        if (global.io) {
            global.io.to(`client:${data.session_id}`).emit('new_message', {
                ...message,
                agent_name: null,
                agent_avatar: null
            });

            // Also emit to update chat list for all users
            global.io.emit('chat_updated', {
                session_id: data.session_id,
                last_message: message.message || '📎 File',
                updated_at: message.created_at
            });
        }

        console.log('📨 Incoming message processed:', {
            session_id: data.session_id,
            platform: data.platform,
            message_id: message.id
        });

        return NextResponse.json(message, { status: 201 });

    } catch (error) {
        console.error('Webhook incoming-message error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: '/api/webhook/incoming-message',
        api_key_required: !!process.env.WEBHOOK_API_KEY
    });
}
