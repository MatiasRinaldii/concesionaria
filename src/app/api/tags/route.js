import { NextResponse } from 'next/server';
import { query, insert, remove } from '@/lib/db';

// GET /api/tags - Get all tags
export async function GET() {
    try {
        const tags = await query('SELECT * FROM tags ORDER BY name ASC');
        return NextResponse.json(tags);
    } catch (error) {
        console.error('Get tags error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/tags - Create tag
export async function POST(request) {
    try {
        const data = await request.json();
        const tag = await insert('tags', {
            name: data.name
        });
        return NextResponse.json(tag, { status: 201 });
    } catch (error) {
        console.error('Create tag error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/tags - Delete tag
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await remove('tags', id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Delete tag error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
