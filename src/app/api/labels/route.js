import { NextResponse } from 'next/server';
import { query, insert, update, remove } from '@/lib/db';

// GET /api/labels - Get all labels
export async function GET() {
    try {
        const labels = await query('SELECT * FROM labels ORDER BY name ASC');
        return NextResponse.json(labels);
    } catch (error) {
        console.error('Get labels error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/labels - Create label
export async function POST(request) {
    try {
        const data = await request.json();
        const label = await insert('labels', {
            name: data.name,
            description: data.description || null,
            color: data.color || '#5B8DEF'
        });
        return NextResponse.json(label, { status: 201 });
    } catch (error) {
        console.error('Create label error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/labels - Update label
export async function PATCH(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const data = await request.json();
        const label = await update('labels', id, data);
        return NextResponse.json(label);
    } catch (error) {
        console.error('Update label error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/labels - Delete label
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await remove('labels', id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Delete label error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
