import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400 }
            );
        }

        // Find user
        const user = await queryOne(
            'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
            [email.toLowerCase()]
        );

        if (!user) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Verify password
        const validPassword = await comparePassword(password, user.password_hash);
        if (!validPassword) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Update last login
        await queryOne(
            'UPDATE users SET last_login_at = NOW() WHERE id = $1',
            [user.id]
        );

        // Generate token
        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name
        });

        // Create response with user data
        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar_url: user.avatar_url
            }
        });

        // Set HTTP-only cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);

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
