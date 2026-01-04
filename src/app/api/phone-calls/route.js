import { NextResponse } from 'next/server';
import { query, insert, update } from '@/lib/db';

// GET /api/phone-calls - Get phone calls
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');

        let sql = `
            SELECT pc.*, c.name as client_name, c.phone as client_phone
            FROM phone_calls pc
            LEFT JOIN clients c ON pc.client_id = c.id
        `;
        const params = [];

        if (clientId) {
            params.push(clientId);
            sql += ` WHERE pc.client_id = $${params.length}`;
        }

        sql += ' ORDER BY pc.created_at DESC';

        const calls = await query(sql, params);
        return NextResponse.json(calls);
    } catch (error) {
        console.error('Get phone calls error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/phone-calls - Create phone call
export async function POST(request) {
    try {
        const data = await request.json();
        const call = await insert('phone_calls', {
            client_id: data.client_id,
            direction: data.direction || 'outbound',
            status: data.status || 'initiated',
            duration: data.duration || 0,
            recording_url: data.recording_url || null
        });
        return NextResponse.json(call, { status: 201 });
    } catch (error) {
        console.error('Create phone call error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/phone-calls - Update phone call
export async function PATCH(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const data = await request.json();
        const call = await update('phone_calls', id, data);
        return NextResponse.json(call);
    } catch (error) {
        console.error('Update phone call error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
