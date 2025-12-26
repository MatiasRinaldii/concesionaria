'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Login from '../components/ui/Login';
import Sidebar from '../components/ui/Sidebar';
import Dashboard from '../components/dashboard/Dashboard';
import Chat from '../components/customers/chat/Chat';
import Stock from '../components/stock/Stock';
import Metrics from '../components/metrics/Metrics';
import Calendar from '../components/calendar/Calendar';
import Team from '../components/team/Team';
import Settings from '../components/settings/Settings';

function AppContent() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'contacts':
                return <Chat />;
            case 'stock':
                return <Stock />;
            case 'metrics':
                return <Metrics />;
            case 'calendar':
                return <Calendar />;
            case 'team':
                return <Team />;
            case 'settings':
                return <Settings />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <main className="flex-1 overflow-auto ml-[70px]">
                {renderPage()}
            </main>
        </div>
    );
}

export default function Home() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
