import React from 'react';
import { Phone } from 'lucide-react';
import PhoneCall from './PhoneCall';

const PhoneUI = ({ calls }) => {
    return (
        <div className="flex flex-col h-full bg-card text-foreground">
            {/* Header - similar to ChatUI */}
            <div className="p-3 px-4 border-b border-gray-700 flex items-center gap-2 h-[60px] shrink-0">
                <Phone size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">Calls History</h2>
            </div>

            {/* Calls list */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {!calls || calls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted">
                        <Phone size={48} className="opacity-20 mb-2" />
                        <p className="text-sm">No calls found</p>
                    </div>
                ) : (
                    calls.map(call => (
                        <PhoneCall key={call.id} call={call} />
                    ))
                )}
            </div>
        </div>
    );
};

export default PhoneUI;
