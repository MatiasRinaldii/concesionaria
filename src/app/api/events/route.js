import { NextResponse } from 'next/server';
import { query, queryOne, insert, update, remove } from '@/lib/db';

// GET /api/events - Get events
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const userId = searchParams.get('user_id');

        let sql = `
            SELECT e.*, 
                   c.name as client_name,
                   c.phone as client_phone,
                   et.name as event_type_name,
                   et.color as event_type_color
            FROM events_calendar e
            LEFT JOIN clients c ON e.client_id = c.id
            LEFT JOIN event_types et ON e.event_type_id = et.id
            WHERE 1=1
        `;
        const params = [];

        if (date) {
            params.push(date);
            sql += ` AND DATE(e.date) = $${params.length}`;
        }

        if (userId) {
            params.push(userId);
            sql += ` AND e.user_id = $${params.length}`;
        }

        sql += ' ORDER BY e.date ASC';

        const events = await query(sql, params);
        return NextResponse.json(events);
    } catch (error) {
        console.error('Get events error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/events - Create event
export async function POST(request) {
    try {
        const data = await request.json();
        const event = await insert('events_calendar', {
            title: data.title,
            description: data.description || null,
            date: data.date,
            duration: data.duration || 30,
            client_id: data.client_id || null,
            event_type_id: data.event_type_id || null,
            user_id: data.user_id || null
        });
        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error('Create event error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/events - Update event
export async function PATCH(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const data = await request.json();
        const event = await update('events_calendar', id, data);
        return NextResponse.json(event);
    } catch (error) {
        console.error('Update event error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/events - Delete event
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await remove('events_calendar', id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Delete event error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
