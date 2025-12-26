// app/api/send-message/route.js
import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_SEND_MESSAGE_WEBHOOK;

export async function POST(request) {
    try {
        // Validar que el webhook esté configurado
        if (!N8N_WEBHOOK_URL) {
            console.error('N8N_SEND_MESSAGE_WEBHOOK not configured');
            return NextResponse.json(
                { error: 'Webhook not configured' },
                { status: 500 }
            );
        }

        // Parsear el body
        const body = await request.json();
        const { platform, data } = body;

        // Validaciones
        if (!platform) {
            return NextResponse.json(
                { error: 'Platform is required' },
                { status: 400 }
            );
        }

        if (!data?.client_id) {
            return NextResponse.json(
                { error: 'Client ID is required' },
                { status: 400 }
            );
        }

        if (!data?.message?.trim() && (!data?.message_file || data.message_file.length === 0)) {
            return NextResponse.json(
                { error: 'Message or file is required' },
                { status: 400 }
            );
        }

        // Preparar payload para n8n
        const n8nPayload = {
            session_id: data.client_id,
            message: data.message || '',
            message_file: data.message_file || null,
            agent_id: data.agent_id || null,
            platform: platform,
            timestamp: new Date().toISOString()
        };

        console.log('Sending to n8n:', {
            webhook: N8N_WEBHOOK_URL,
            session_id: n8nPayload.session_id,
            platform: n8nPayload.platform
        });

        // Llamar al webhook de n8n con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(n8nPayload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('n8n webhook error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });

            return NextResponse.json(
                {
                    error: `Webhook failed: ${response.statusText}`,
                    details: errorText
                },
                { status: response.status }
            );
        }

        const result = await response.json().catch(() => ({}));

        console.log('n8n response:', result);

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in send-message API:', error);

        if (error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Request timeout' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// Opcional: endpoint para health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        webhook_configured: !!N8N_WEBHOOK_URL
    });
}
