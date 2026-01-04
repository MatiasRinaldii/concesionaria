import { NextResponse } from 'next/server';
import { query, insert, remove } from '@/lib/db';

// GET /api/clients/tags - Get tags for a client
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');

        if (!clientId) {
            return NextResponse.json({ error: 'client_id required' }, { status: 400 });
        }

        const tags = await query(`
            SELECT t.id, t.name
            FROM tag_client tc
            JOIN tags t ON tc.tag_id = t.id
            WHERE tc.client_id = $1
        `, [clientId]);

        return NextResponse.json(tags);
    } catch (error) {
        console.error('Get client tags error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/clients/tags - Add tags to a client
export async function POST(request) {
    try {
        const data = await request.json();

        if (!data.client_id || !data.tag_ids || !Array.isArray(data.tag_ids)) {
            return NextResponse.json({ error: 'client_id and tag_ids array required' }, { status: 400 });
        }

        // Insert each tag assignment
        for (const tagId of data.tag_ids) {
            await insert('tag_client', {
                client_id: data.client_id,
                tag_id: tagId
            });
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Add client tags error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/clients/tags - Remove a tag from a client
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');
        const tagId = searchParams.get('tag_id');

        if (!clientId || !tagId) {
            return NextResponse.json({ error: 'client_id and tag_id required' }, { status: 400 });
        }

        await query(
            'DELETE FROM tag_client WHERE client_id = $1 AND tag_id = $2',
            [clientId, tagId]
        );

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Remove client tag error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
