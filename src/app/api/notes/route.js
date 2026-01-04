import { NextResponse } from 'next/server';
import { query, insert, remove } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/notes - Get notes for a client
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');

        if (!clientId) {
            return NextResponse.json({ error: 'client_id required' }, { status: 400 });
        }

        const notes = await query(`
            SELECT n.*, u.full_name as user_name
            FROM notes n
            LEFT JOIN users u ON n.user_id = u.id
            WHERE n.client_id = $1
            ORDER BY n.created_at DESC
        `, [clientId]);

        return NextResponse.json(notes);
    } catch (error) {
        console.error('Get notes error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/notes - Create note
export async function POST(request) {
    try {
        const user = await getUserFromRequest(request);
        const data = await request.json();

        if (!data.client_id) {
            return NextResponse.json({ error: 'client_id required' }, { status: 400 });
        }

        const note = await insert('notes', {
            client_id: data.client_id,
            user_id: user?.id || null,
            message: data.message || ''
        });

        // Get the note with user info
        const fullNote = await query(`
            SELECT n.*, u.full_name as user_name
            FROM notes n
            LEFT JOIN users u ON n.user_id = u.id
            WHERE n.id = $1
        `, [note.id]);

        return NextResponse.json(fullNote[0], { status: 201 });
    } catch (error) {
        console.error('Create note error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/notes - Delete note
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await remove('notes', id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Delete note error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
