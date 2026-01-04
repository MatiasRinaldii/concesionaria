import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request) {
    try {
        const { email, password, full_name } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await queryOne(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser) {
            return NextResponse.json(
                { error: 'El email ya está registrado' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await queryOne(
            `INSERT INTO users (email, password_hash, full_name, role) 
             VALUES ($1, $2, $3, 'agent') 
             RETURNING id, email, full_name, role, avatar_url`,
            [email.toLowerCase(), passwordHash, full_name || null]
        );

        // Generate token
        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name
        });

        // Create response
        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar_url: user.avatar_url
            }
        }, { status: 201 });

        // Set HTTP-only cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });

        return response;
    } catch (error) {
        console.error('Register error:', error);

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
