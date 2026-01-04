import { NextResponse } from 'next/server';
import { query, queryOne, insert, remove } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/teams - Get all teams or team details
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('id');

        if (teamId) {
            // Get single team with members
            const team = await queryOne('SELECT * FROM teams WHERE id = $1', [teamId]);
            if (!team) {
                return NextResponse.json({ error: 'Team not found' }, { status: 404 });
            }

            const members = await query(`
                SELECT u.id, u.email, u.full_name, u.avatar_url, tu.role
                FROM team_users tu
                JOIN users u ON tu.user_id = u.id
                WHERE tu.team_id = $1
            `, [teamId]);

            return NextResponse.json({ ...team, members });
        }

        // Get all teams
        const teams = await query(`
            SELECT t.*, 
                   COUNT(tu.id) as member_count,
                   (SELECT COUNT(*) FROM team_messages tm WHERE tm.team_id = t.id) as message_count
            FROM teams t
            LEFT JOIN team_users tu ON t.id = tu.team_id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `);

        return NextResponse.json(teams);
    } catch (error) {
        console.error('Get teams error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/teams - Create team
export async function POST(request) {
    try {
        const user = await getUserFromRequest(request);
        const data = await request.json();

        const team = await insert('teams', {
            name: data.name,
            description: data.description || null,
            created_by: user?.id || null
        });

        // Add creator as admin member
        if (user?.id) {
            await insert('team_users', {
                team_id: team.id,
                user_id: user.id,
                role: 'admin'
            });
        }

        return NextResponse.json(team, { status: 201 });
    } catch (error) {
        console.error('Create team error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/teams - Delete team
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await remove('teams', id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Delete team error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/teams - Update team
export async function PATCH(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const data = await request.json();

        // Build update query dynamically
        const updates = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.description !== undefined) updates.description = data.description;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

        const result = await query(
            `UPDATE teams SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
            [...values, id]
        );

        if (result.length === 0) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error('Update team error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
