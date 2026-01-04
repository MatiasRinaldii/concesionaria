import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
    try {
        const tokenUser = await getUserFromRequest(request);

        if (!tokenUser) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Get fresh user data from database
        const user = await queryOne(
            'SELECT id, email, full_name, role, avatar_url, created_at FROM users WHERE id = $1 AND is_active = TRUE',
            [tokenUser.id]
        );

        if (!user) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Get me error:', error);

        if (error.message === 'DATABASE_URL not configured') {
            return NextResponse.json(
                { error: 'Base de datos no configurada' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
