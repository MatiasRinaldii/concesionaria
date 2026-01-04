import { NextResponse } from 'next/server';
import { query, queryOne, insert, update, remove } from '@/lib/db';

// GET /api/clients - List all clients
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const labelId = searchParams.get('label_id');
        const status = searchParams.get('status');

        let sql = `
            SELECT c.*, 
                   l.name as label_name, 
                   l.color as label_color,
                   (SELECT COUNT(*) FROM messages m WHERE m.session_id = c.id AND m.read = false) as unread_count
            FROM clients c
            LEFT JOIN labels l ON c.label_id = l.id
            WHERE 1=1
        `;
        const params = [];

        if (labelId) {
            params.push(labelId);
            sql += ` AND c.label_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            sql += ` AND c.status = $${params.length}`;
        }

        sql += ' ORDER BY c.updated_at DESC';

        const clients = await query(sql, params);
        return NextResponse.json(clients);
    } catch (error) {
        console.error('Get clients error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/clients - Create client
export async function POST(request) {
    try {
        const data = await request.json();
        const client = await insert('clients', {
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            platform: data.platform || 'web',
            agent: data.agent || 'AI',
            status: data.status || 'new',
            label_id: data.label_id || null
        });
        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        console.error('Create client error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/clients - Update client
export async function PATCH(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const data = await request.json();
        const client = await update('clients', id, data);
        return NextResponse.json(client);
    } catch (error) {
        console.error('Update client error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/clients - Delete client
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await remove('clients', id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Delete client error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
