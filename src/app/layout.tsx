import './globals.css';

export const metadata = {
    title: 'Dealership CRM',
    description: 'Sistema CRM para concesionaria de autos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}
