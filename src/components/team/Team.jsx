import { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, Loader2, Sparkles } from 'lucide-react';
import { useTeamChats } from '../../hooks/useTeamChats';
import { createTeam } from '../../lib/api/teamConversations';
import Vision from './Vision';
import CreateTeamModal from './CreateTeamModal';
import ChatUI from '../customers/chat/ChatUI';

// Vision chat object - defined outside component as it's static
const VISION_CHAT = {
    id: 'vision-ai',
    name: 'Vision',
    lastMessage: 'Ready to analyze data',
    time: 'Now',
    unread: 0,
    type: 'ai',
    status: 'online',
    role: 'AI Assistant'
};

const Team = () => {
    const {
        chats: teamChats,
        messages,
        selectedChatId,
        setSelectedChatId,
        loading,
        messagesLoading,
        sendMessage,
        refreshChats
    } = useTeamChats();

    const [messageInput, setMessageInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Memoize allChats to prevent unnecessary re-renders
    const allChats = useMemo(() => {
        if (!teamChats) return [VISION_CHAT];
        return [VISION_CHAT, ...teamChats];
    }, [teamChats]);

    // Filter chats based on search
    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return allChats;
        return allChats.filter(chat =>
            chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allChats, searchQuery]);

    // Set default selection
    useEffect(() => {
        if (!selectedChatId) {
            setSelectedChatId('vision-ai');
        }
    }, [selectedChatId, setSelectedChatId]);

    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (messageInput.trim()) {
            sendMessage(messageInput);
            setMessageInput('');
        }
    };

    const handleCreateTeam = async (teamName, description, memberIds) => {
        try {
            await createTeam({ name: teamName, description });
            await refreshChats();
        } catch (err) {
            console.error('Error creating team:', err);
            alert('Error al crear el equipo.\n\nError: ' + (err.message || JSON.stringify(err)));
            throw err;
        }
    };

    const selectedChatData = allChats.find(c => c.id === selectedChatId) || allChats[0];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden relative animate-fade-in">
            <div className="grid grid-cols-[360px_1fr] gap-2 p-2 h-screen">
                {/* Left Column */}
                <div className="flex flex-col h-full bg-card rounded-xl overflow-hidden border border-gray-700">
                    <div className="flex flex-col overflow-hidden flex-1">
                        <div className="p-4 min-h-[60px] flex items-center gap-2 border-b border-gray-700 shrink-0">
                            <div className="flex-1 flex items-center gap-2 bg-elevated px-3 py-2 rounded-lg border border-transparent focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 h-[42px]">
                                <Search size={18} className="text-muted" />
                                <input
                                    type="text"
                                    id="team-search"
                                    name="team-search"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none p-0 w-full outline-none text-foreground placeholder:text-muted text-sm"
                                    aria-label="Search teams and chats"
                                />
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="p-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 hover:-translate-y-0.5"
                                title="Create New Team"
                                aria-label="Create new team"
                            >
                                <UserPlus size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${selectedChatId !== chat.id ? 'hover:bg-elevated' : ''}`}
                                    style={selectedChatId === chat.id ? {
                                        backgroundColor: chat.id === 'vision-ai' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(91, 141, 239, 0.25)'
                                    } : undefined}
                                    onClick={() => setSelectedChatId(chat.id)}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${chat.id === 'vision-ai'
                                        ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20'
                                        : 'bg-gradient-to-br from-primary to-secondary'
                                        }`}>
                                        {chat.id === 'vision-ai' ? <Sparkles size={20} /> : (chat.type === 'group' ? '👥' : chat.name?.split(' ').map(n => n[0]).join('') || 'U')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="text-[0.9375rem] font-semibold text-foreground truncate flex items-center gap-2">
                                                {chat.name}
                                                {chat.id === 'vision-ai' && (
                                                    <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[9px] font-bold uppercase tracking-wider border border-violet-500/30">AI</span>
                                                )}
                                            </h4>
                                            <span className="text-xs text-tertiary">{chat.time}</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-2">
                                            <p className="text-sm text-muted truncate">{chat.lastMessage}</p>
                                            {chat.unread > 0 && (
                                                <span className="bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center ml-2">{chat.unread}</span>
                                            )}
                                        </div>
                                        {chat.type === 'group' && (
                                            <span className="text-xs text-tertiary mt-1 block">{chat.members?.length || 0} members</span>
                                        )}
                                        {chat.type === 'direct' && chat.role && (
                                            <span className="text-xs text-tertiary mt-1 block">{chat.role}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col h-full overflow-hidden bg-card rounded-xl border border-gray-700">
                    {selectedChatId === 'vision-ai' ? (
                        <Vision />
                    ) : (
                        <ChatUI
                            selectedChatData={selectedChatData}
                            messages={messages}
                            message={messageInput}
                            setMessage={setMessageInput}
                            handleSendMessage={handleSendMessage}
                            loading={messagesLoading}
                            customHeaderClass="h-[74px] px-6"
                            headerSize="large"
                            onTeamDeleted={() => {
                                setSelectedChatId('vision-ai');
                                refreshChats();
                            }}
                        />
                    )}
                </div>

            </div>

            <CreateTeamModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreateTeam={handleCreateTeam}
            />
        </div >
    );
};

export default Team;
