import { useState, useEffect } from 'react';
import { Search, Filter, MessageCircle, Instagram, Facebook, Phone, Mail, MessageSquare, Check, Tag, Hash } from 'lucide-react';
import { getLabels, getTags } from '../../../lib/api/labels';

const ChatList = ({ chats, selectedChat, setSelectedChat, getPlatformColor, getPlatformIcon, viewMode, setViewMode }) => {
    const [showFilter, setShowFilter] = useState(false);
    const [selectedLabelIds, setSelectedLabelIds] = useState(new Set());
    const [selectedTagIds, setSelectedTagIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    // Extracted Lists
    const [availableLabels, setAvailableLabels] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);

    // Fetch all labels and tags for filters
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [labels, tags] = await Promise.all([
                    getLabels(),
                    getTags()
                ]);

                setAvailableLabels(labels || []);
                setAvailableTags(tags || []);
            } catch (err) {
                console.error('Error fetching filter data:', err);
            }
        };

        fetchData();
    }, []);

    const toggleLabel = (id) => {
        const next = new Set(selectedLabelIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedLabelIds(next);
    };

    const toggleTag = (id) => {
        const next = new Set(selectedTagIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedTagIds(next);
    };

    const clearFilters = () => {
        setSelectedLabelIds(new Set());
        setSelectedTagIds(new Set());
        setShowFilter(false);
    };

    const filteredChats = chats.filter(chat => {
        // Search Filter
        if (searchTerm) {
            const normalize = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            if (!normalize(chat.name).includes(normalize(searchTerm))) {
                return false;
            }
        }

        // If no filters active, show all (that matched search)
        if (selectedLabelIds.size === 0 && selectedTagIds.size === 0) return true;

        let matchesLabel = false;
        let matchesTag = false;

        // Check Label
        if (selectedLabelIds.size > 0) {
            if (chat.label && selectedLabelIds.has(chat.label.id)) {
                matchesLabel = true;
            }
        } else {
            // If no label filter is set, we don't fail based on label
            matchesLabel = true;
        }

        // Check Tags
        if (selectedTagIds.size > 0) {
            if (chat.tag_client?.some(item => selectedTagIds.has(item.tag?.id))) {
                matchesTag = true;
            }
        } else {
            // If no tag filter is set, we don't fail based on tag
            matchesTag = true;
        }

        // Logic: 
        // If BOTH filters are active, do we want AND or OR? 
        // User said "filtre por labels tags", usually implies "Show me chats with Label X OR Tag Y" within the same context is tricky.
        // Usually implementation is (Match Label if Label Filter Active) AND (Match Tag if Tag Filter Active).
        // Let's go with AND logic between categories, OR logic within category (multi-select).

        // Re-evaluating based on "checkboxes next to each".
        // If I select Label A and Tag B. I expect to see chats that have Label A AND Tag B? Or Label A OR Tag B?
        // Standard e-commerce/list filtering is AND between groups, OR within group.
        // Let's stick to AND between groups for precision.

        // However, the previous code block logic was:
        // matchesLabel = true (if no labels selected) OR chat has label.

        return matchesLabel && matchesTag;
    });

    // Check if any filter is active for UI indication
    const isFiltering = selectedLabelIds.size > 0 || selectedTagIds.size > 0;

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        setSelectedChat(null);
    };

    return (
        <div className="bg-card rounded-xl flex flex-col overflow-hidden h-full">
            <div className="p-3 flex items-center gap-2 min-h-[60px] shrink-0 border-b border-gray-700">
                <div className="flex-1 flex items-center gap-2 bg-elevated px-3 py-1.5 rounded-lg border border-transparent focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 h-[36px]">
                    <Search size={18} className="text-muted" />
                    <input
                        type="text"
                        id="chat-list-search"
                        name="chat-list-search"
                        value={searchTerm || ''}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="bg-transparent border-none p-0 w-full outline-none h-full text-foreground placeholder:text-muted"
                    />
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className={`p-2 rounded-lg transition-colors ${isFiltering || showFilter ? 'bg-primary/20 text-primary' : 'hover:bg-elevated text-muted hover:text-foreground'}`}
                        title="Filter conversations"
                    >
                        <Filter size={18} />
                    </button>

                    {showFilter && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-3 border-b border-gray-700/50 flex justify-between items-center bg-elevated/50">
                                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Filters</span>
                                    {isFiltering && (
                                        <button onClick={clearFilters} className="text-[10px] text-primary hover:underline font-medium">
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {/* Labels Section */}
                                    <div className="mb-3">
                                        <div className="text-[10px] font-bold text-muted px-2 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                            <Tag size={12} />
                                            Labels
                                        </div>
                                        {availableLabels.length > 0 ? availableLabels.map(label => {
                                            const isSelected = selectedLabelIds.has(label.id);
                                            const color = label.color || '#5B8DEF';
                                            return (
                                                <div
                                                    key={label.id}
                                                    onClick={() => toggleLabel(label.id)}
                                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-elevated'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-600 bg-transparent'}`}>
                                                        {isSelected && <Check size={10} className="text-white" />}
                                                    </div>
                                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }}></div>
                                                    <span className={`text-sm ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label.name}</span>
                                                </div>
                                            );
                                        }) : <div className="px-2 text-xs text-muted italic">No labels found</div>}
                                    </div>

                                    {/* Tags Section */}
                                    <div className="mb-3">
                                        <div className="text-[10px] font-bold text-muted px-2 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                            <Hash size={12} />
                                            Tags
                                        </div>
                                        {availableTags.length > 0 ? availableTags.map(tag => {
                                            const isSelected = selectedTagIds.has(tag.id);
                                            return (
                                                <div
                                                    key={tag.id}
                                                    onClick={() => toggleTag(tag.id)}
                                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-elevated'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-600 bg-transparent'}`}>
                                                        {isSelected && <Tag size={10} className="text-white" />}
                                                    </div>
                                                    <span className={`text-sm ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{tag.name}</span>
                                                </div>
                                            );
                                        }) : <div className="px-2 text-xs text-muted italic">No tags found</div>}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="px-3 py-2 bg-elevated/30">
                <div className="flex gap-1 p-1 bg-background/50 rounded-xl">
                    <button
                        onClick={() => handleViewModeChange('chat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${viewMode === 'chat'
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20'
                            : 'text-muted hover:text-foreground hover:bg-elevated'
                            }`}
                    >
                        <MessageSquare size={16} />
                        Chat
                    </button>
                    <button
                        onClick={() => handleViewModeChange('email')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${viewMode === 'email'
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20'
                            : 'text-muted hover:text-foreground hover:bg-elevated'
                            }`}
                    >
                        <Mail size={16} />
                        Email
                    </button>
                    <button
                        onClick={() => handleViewModeChange('phone')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${viewMode === 'phone'
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20'
                            : 'text-muted hover:text-foreground hover:bg-elevated'
                            }`}
                    >
                        <Phone size={16} />
                        Phone
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted py-12">
                        {viewMode === 'chat' && (
                            <>
                                <MessageSquare size={40} className="opacity-30 mb-2" />
                                <p className="text-sm">No chats found</p>
                            </>
                        )}
                        {viewMode === 'email' && (
                            <>
                                <Mail size={40} className="opacity-30 mb-2" />
                                <p className="text-sm">No emails found</p>
                            </>
                        )}
                        {viewMode === 'phone' && (
                            <>
                                <Phone size={40} className="opacity-30 mb-2" />
                                <p className="text-sm">No calls found</p>
                            </>
                        )}
                    </div>
                ) : (
                    filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${selectedChat !== chat.id ? 'hover:bg-elevated' : ''}`}
                            style={selectedChat === chat.id ? {
                                backgroundColor: 'rgba(91, 141, 239, 0.25)'
                            } : undefined}
                            onClick={() => setSelectedChat(chat.id)}
                        >
                            <div className="relative shrink-0 mr-1.5">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                                    {chat.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div
                                    className="absolute top-8 right-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[0.625rem] shadow-sm z-10"
                                    style={{
                                        backgroundColor: viewMode === 'email' ? '#EA4335' : viewMode === 'phone' ? '#34A853' : getPlatformColor(chat.platform),
                                        color: 'white'
                                    }}
                                    title={viewMode === 'email' ? 'Email' : viewMode === 'phone' ? 'Phone' : chat.platform}
                                >
                                    {viewMode === 'email' ? <Mail size={10} className="text-white" /> : viewMode === 'phone' ? <Phone size={10} fill="white" className="text-white" /> : getPlatformIcon(chat.platform)}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-[0.9375rem] font-semibold text-foreground">{chat.name}</h4>
                                    <span className="text-xs text-tertiary">{chat.time}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted truncate flex-1">{chat.lastMessage}</p>
                                    {chat.unread > 0 && (
                                        <span className="bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center ml-2">{chat.unread}</span>
                                    )}
                                </div>
                                <div className="mt-1">
                                    {(() => {
                                        if (!chat.label) return null;
                                        const color = chat.label.color || '#5B8DEF';
                                        const hex = color.replace('#', '');
                                        const r = parseInt(hex.substring(0, 2), 16);
                                        const g = parseInt(hex.substring(2, 4), 16);
                                        const b = parseInt(hex.substring(4, 6), 16);

                                        return (
                                            <span
                                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border transition-colors"
                                                style={{
                                                    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
                                                    borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
                                                    color: color
                                                }}
                                                title={chat.label.description || ''}
                                            >
                                                {chat.label.name}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
};

export default ChatList;
