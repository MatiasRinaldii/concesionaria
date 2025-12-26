import { Phone, Mail, AlertTriangle, Car } from 'lucide-react';

// Status styles - defined outside component for performance
const STATUS_STYLES = {
    'initial': { bg: 'rgba(100, 116, 139, 0.15)', text: 'var(--text-muted)' },
    'qualified': { bg: 'rgba(91, 141, 239, 0.15)', text: 'var(--accent-primary)' },
    'test-drive': { bg: 'rgba(245, 158, 11, 0.15)', text: 'var(--accent-warning)' },
    'negotiation': { bg: 'rgba(139, 92, 246, 0.15)', text: 'var(--accent-secondary)' },
    'financing': { bg: 'rgba(16, 185, 129, 0.15)', text: 'var(--accent-success)' },
};

const getStatusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES['initial'];

const ClientCard = ({ client }) => {
    const statusStyle = getStatusStyle(client.status || 'initial');

    return (
        <div className="bg-card rounded-xl p-5 border border-transparent hover:border-primary transition-all duration-200 group hover:shadow-md">
            {/* Header: Avatar + Name + Contact Info */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-base shadow-lg shadow-primary/20 shrink-0">
                    {client.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">{client.name}</h3>
                    <div className="flex flex-col gap-1 text-sm text-muted">
                        <div className="flex items-center gap-1.5">
                            <Phone size={14} className="shrink-0" />
                            <span className="truncate">{client.phone ? (client.phone.startsWith('+') ? client.phone : `+${client.phone}`) : <span className="text-muted italic">No phone</span>}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Mail size={14} className="shrink-0" />
                            <span className="truncate">{client.email || <span className="text-muted italic">No email</span>}</span>
                        </div>
                    </div>
                </div>
                {client.ai_enabled === false && (
                    <div
                        className="text-red-500 shrink-0"
                        title="AI Agent disabled"
                        style={{
                            animation: 'blink 1s ease-in-out infinite'
                        }}
                    >
                        <AlertTriangle size={22} />
                    </div>
                )}
            </div>

            {/* Vehicles Info */}
            <div className="mt-4 space-y-3 border-t border-gray-700/50 pt-4">
                <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 bg-primary/10 rounded-md shrink-0">
                        <Car size={16} className="text-primary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">Auto de Interés</span>
                        <span className="text-sm font-medium text-white truncate max-w-full">
                            {client.auto_interes || '-'}
                        </span>
                    </div>
                </div>

                {client.auto_entrega && (
                    <div className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 bg-primary/10 rounded-md shrink-0">
                            <Car size={16} className="text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">Auto a Entregar</span>
                            <span className="text-sm font-medium text-white truncate max-w-full">
                                {client.auto_entrega}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientCard;
