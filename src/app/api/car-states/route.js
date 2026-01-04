import { NextResponse } from 'next/server';
import { query, insert, update, remove } from '@/lib/db';

// GET /api/car-states - Get car states
export async function GET() {
    try {
        const states = await query('SELECT * FROM car_states ORDER BY name ASC');
        return NextResponse.json(states);
    } catch (error) {
        console.error('Get car states error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/car-states - Create car state
export async function POST(request) {
    try {
        const data = await request.json();
        const state = await insert('car_states', {
            name: data.name,
            color: data.color || '#5B8DEF'
        });
        return NextResponse.json(state, { status: 201 });
    } catch (error) {
        console.error('Create car state error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/car-states - Update car state
export async function PATCH(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const data = await request.json();
        const state = await update('car_states', id, data);
        return NextResponse.json(state);
    } catch (error) {
        console.error('Update car state error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/car-states - Delete car state
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await remove('car_states', id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Delete car state error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
