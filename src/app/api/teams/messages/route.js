import { NextResponse } from 'next/server';
import { query, insert } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/teams/messages - Get team messages
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('team_id');

        if (!teamId) {
            return NextResponse.json({ error: 'team_id required' }, { status: 400 });
        }

        const messages = await query(`
            SELECT tm.*, 
                   u.full_name as user_name,
                   u.avatar_url as user_avatar
            FROM team_messages tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = $1
            ORDER BY tm.created_at ASC
        `, [teamId]);

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Get team messages error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/teams/messages - Create team message
export async function POST(request) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        if (!data.team_id) {
            return NextResponse.json({ error: 'team_id required' }, { status: 400 });
        }

        const message = await insert('team_messages', {
            team_id: data.team_id,
            user_id: user.id,
            message: data.message || '',
            message_file: data.message_file ? JSON.stringify(data.message_file) : '[]'
        });

        // Get user details for response
        const fullMessage = await query(`
            SELECT tm.*, u.full_name as user_name, u.avatar_url as user_avatar
            FROM team_messages tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.id = $1
        `, [message.id]);

        const messageWithUser = fullMessage[0];

        // Emit socket event
        if (global.io) {
            global.io.to(`team:${data.team_id}`).emit('team_message', messageWithUser);
        }

        return NextResponse.json(messageWithUser, { status: 201 });
    } catch (error) {
        console.error('Create team message error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
