import { NextResponse } from 'next/server';
import { query, insert, update, remove } from '@/lib/db';

// GET /api/event-types - Get all event types
export async function GET() {
    try {
        const types = await query('SELECT * FROM event_types ORDER BY name ASC');
        return NextResponse.json(types);
    } catch (error) {
        console.error('Get event types error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/event-types - Create event type
export async function POST(request) {
    try {
        const data = await request.json();
        const type = await insert('event_types', {
            name: data.name,
            color: data.color || '#5B8DEF'
        });
        return NextResponse.json(type, { status: 201 });
    } catch (error) {
        console.error('Create event type error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/event-types - Update event type
export async function PATCH(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const data = await request.json();
        const type = await update('event_types', id, data);
        return NextResponse.json(type);
    } catch (error) {
        console.error('Update event type error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/event-types - Delete event type
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await remove('event_types', id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Delete event type error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
