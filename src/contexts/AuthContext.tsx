'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface User {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<any>;
    signUp: (email: string, password: string, fullName?: string) => Promise<any>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { }
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

// PostgreSQL/JWT Auth Provider
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        checkAuth();
    }, []);

    useEffect(() => {
        // Connect/disconnect socket based on auth state
        if (user) {
            connectSocket();
        } else {
            disconnectSocket();
        }
    }, [user]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Error al iniciar sesión');
        }

        const data = await res.json();
        setUser(data.user);
        return data;
    };

    const signUp = async (email: string, password: string, fullName?: string) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name: fullName }),
            credentials: 'include'
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Error al registrarse');
        }

        const data = await res.json();
        setUser(data.user);
        return data;
    };

    const signOut = async () => {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        setUser(null);
        disconnectSocket();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
