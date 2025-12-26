import React, { useState, useEffect } from 'react';
import { Phone, Search, Loader2 } from 'lucide-react';
import { getPhoneCalls } from '../../../../lib/api/phoneCalls';

const PhoneList = ({ selectedCall, setSelectedCall }) => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                setLoading(true);
                const data = await getPhoneCalls();
                setCalls(data);
            } catch (error) {
                console.error('Error fetching calls:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCalls();
    }, []);

    const filteredCalls = calls.filter(call =>
        call.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-card rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-3 px-4 border-b border-gray-700 flex items-center gap-2 h-[60px] shrink-0">
                <Phone size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">Phone Calls</h2>
                <span className="ml-auto text-xs text-muted bg-elevated px-2 py-1 rounded-full">
                    {calls.length}
                </span>
            </div>

            {/* Search */}
            <div className="p-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Search calls..."
                        className="w-full bg-elevated border border-transparent focus:border-primary rounded-lg pl-9 pr-3 py-2 text-sm text-foreground outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Call List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                ) : filteredCalls.length === 0 ? (
                    <div className="text-center text-muted text-sm py-8">No calls found</div>
                ) : (
                    filteredCalls.map(call => (
                        <div
                            key={call.id}
                            onClick={() => setSelectedCall(call)}
                            className={`p-3 rounded-lg cursor-pointer transition-all mb-1 ${selectedCall?.id === call.id
                                    ? 'bg-primary/20 border border-primary/30'
                                    : 'hover:bg-elevated border border-transparent'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                    {call.phone || 'No phone'}
                                </span>
                                <span className="text-[10px] text-muted">
                                    {new Date(call.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs text-muted truncate">{call.title || 'No title'}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PhoneList;
