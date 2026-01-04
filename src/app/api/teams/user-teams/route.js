import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/teams/user-teams - Get teams for current user
export async function GET(request) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const teams = await query(`
            SELECT t.id, t.name, t.description, t.created_at,
                   json_agg(
                       json_build_object(
                           'user_id', tu2.user_id,
                           'full_name', u2.full_name,
                           'avatar_url', u2.avatar_url
                       )
                   ) FILTER (WHERE tu2.user_id IS NOT NULL) as members
            FROM team_users tu
            JOIN teams t ON tu.team_id = t.id
            LEFT JOIN team_users tu2 ON t.id = tu2.team_id
            LEFT JOIN users u2 ON tu2.user_id = u2.id
            WHERE tu.user_id = $1
            GROUP BY t.id, t.name, t.description, t.created_at
            ORDER BY t.created_at DESC
        `, [user.id]);

        return NextResponse.json(teams);
    } catch (error) {
        console.error('Get user teams error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
