import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/users - Get all users (excluding current user)
export async function GET(request) {
    try {
        const user = await getUserFromRequest(request);

        let users;
        if (user?.id) {
            users = await query(
                'SELECT id, email, full_name, avatar_url, role FROM users WHERE id != $1 ORDER BY full_name ASC',
                [user.id]
            );
        } else {
            users = await query(
                'SELECT id, email, full_name, avatar_url, role FROM users ORDER BY full_name ASC'
            );
        }

        return NextResponse.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
