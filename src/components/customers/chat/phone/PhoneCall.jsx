import React from 'react';
import { Phone, Calendar } from 'lucide-react';

const PhoneCall = ({ call }) => {
    if (!call) return null;

    return (
        <div className="bg-card rounded-lg border border-border p-4 mb-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <Phone size={16} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground text-sm">{call.title || 'Phone Call'}</h3>
                        <div className="flex items-center text-xs text-muted">
                            <Phone size={10} className="mr-1" />
                            {call.phone || 'No phone number'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center text-xs text-muted">
                    <Calendar size={12} className="mr-1" />
                    {new Date(call.created_at).toLocaleString()}
                </div>
            </div>

            <div className="bg-elevated rounded p-3 text-sm text-foreground/90 whitespace-pre-wrap font-mono text-xs leading-relaxed border border-border/50">
                {call.conversation || 'No conversation notes'}
            </div>
        </div>
    );
};

export default PhoneCall;
