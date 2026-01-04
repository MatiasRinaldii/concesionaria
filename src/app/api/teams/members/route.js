import { NextResponse } from 'next/server';
import { query, insert, remove } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/teams/members - Get team members
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('team_id');

        if (!teamId) {
            return NextResponse.json({ error: 'team_id required' }, { status: 400 });
        }

        const members = await query(`
            SELECT u.id, u.email, u.full_name, u.avatar_url, tu.role
            FROM team_users tu
            JOIN users u ON tu.user_id = u.id
            WHERE tu.team_id = $1
        `, [teamId]);

        return NextResponse.json(members);
    } catch (error) {
        console.error('Get team members error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/teams/members - Add team member
export async function POST(request) {
    try {
        const user = await getUserFromRequest(request);
        const data = await request.json();

        if (!data.team_id || !data.user_id) {
            return NextResponse.json({ error: 'team_id and user_id required' }, { status: 400 });
        }

        const member = await insert('team_users', {
            team_id: data.team_id,
            user_id: data.user_id,
            role: data.role || 'member'
        });

        return NextResponse.json(member, { status: 201 });
    } catch (error) {
        console.error('Add team member error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/teams/members - Remove team member
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('team_id');
        const userId = searchParams.get('user_id');

        if (!teamId || !userId) {
            return NextResponse.json({ error: 'team_id and user_id required' }, { status: 400 });
        }

        await query(
            'DELETE FROM team_users WHERE team_id = $1 AND user_id = $2',
            [teamId, userId]
        );

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Remove team member error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
