import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Phone } from 'lucide-react';
import ChatList from './ChatList';
import ChatUI from './ChatUI';
import EmailUI from './email/EmailUI';
import PhoneUI from './phone/PhoneUI';
import ClientDetails from './clientdetails/ClientDetails';
import LoadingSpinner from '../../ui/LoadingSpinner';
import PlatformIcon, { getPlatformColor } from '../../ui/PlatformIcon';
import { useChats } from '../../../hooks/useChats';
import { getEmailMessages } from '../../../lib/api/emailMessages';
import { getPhoneCalls } from '../../../lib/api/phoneCalls';

const Chat = () => {
    const {
        chats,
        messages,
        selectedChatId,
        setSelectedChatId,
        loading,
        messagesLoading,
        sendMessage,
        refreshChats,
        updateLocalChat
    } = useChats();

    const [messageInput, setMessageInput] = useState('');
    const [viewMode, setViewMode] = useState('chat');

    // Email and Phone data
    const [emails, setEmails] = useState([]);
    const [phoneCalls, setPhoneCalls] = useState([]);
    const [selectedEmailId, setSelectedEmailId] = useState(null);
    const [selectedCallId, setSelectedCallId] = useState(null);

    // Fetch emails and phone calls
    useEffect(() => {
        const fetchEmailsAndCalls = async () => {
            try {
                const [emailData, callData] = await Promise.all([
                    getEmailMessages(),
                    getPhoneCalls()
                ]);
                console.log('📧 Emails fetched:', emailData);
                console.log('📞 Calls fetched:', callData);
                setEmails(emailData);
                setPhoneCalls(callData);
            } catch (error) {
                console.error('Error fetching emails/calls:', error);
            }
        };
        fetchEmailsAndCalls();
    }, []);

    const handleSendMessage = (e, files) => {
        e.preventDefault();
        if (messageInput.trim() || (files && files.length > 0)) {
            sendMessage(messageInput, files || []);
            setMessageInput('');
        }
    };

    const selectedChatData = chats.find(c => c.id === selectedChatId) || null;
    const selectedEmailData = emails.find(e => e.id === selectedEmailId) || null;
    const selectedCallData = phoneCalls.find(c => c.id === selectedCallId) || null;

    // Convert emails/calls to chat-like format for ChatList
    const emailsAsList = emails.map(e => ({
        id: e.id,
        name: e.email || 'No email',
        lastMessage: e.subject || 'No subject',
        time: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        platform: 'email'
    }));

    const callsAsList = phoneCalls.map(c => ({
        id: c.id,
        name: c.phone || 'No phone',
        lastMessage: c.title || 'No title',
        time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        platform: 'phone'
    }));

    // Get appropriate data based on viewMode
    const listData = viewMode === 'chat' ? chats : viewMode === 'email' ? emailsAsList : callsAsList;
    const selectedId = viewMode === 'chat' ? selectedChatId : viewMode === 'email' ? selectedEmailId : selectedCallId;
    const setSelectedId = viewMode === 'chat' ? setSelectedChatId : viewMode === 'email' ? setSelectedEmailId : setSelectedCallId;

    if (loading) {
        return <LoadingSpinner size={32} fullScreen />;
    }

    return (
        <div className="h-screen overflow-hidden relative animate-fade-in">
            <div className="grid grid-cols-[360px_1fr_340px] gap-2 p-2 h-screen">
                <ChatList
                    chats={listData}
                    selectedChat={selectedId}
                    setSelectedChat={setSelectedId}
                    getPlatformColor={getPlatformColor}
                    getPlatformIcon={(platform) => <PlatformIcon platform={platform} size={12} />}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                <div className="h-full bg-card rounded-xl overflow-hidden">
                    {viewMode === 'chat' && (
                        selectedChatData ? (
                            <ChatUI
                                selectedChatData={selectedChatData}
                                messages={messages}
                                message={messageInput}
                                setMessage={setMessageInput}
                                handleSendMessage={handleSendMessage}
                                loading={messagesLoading}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted flex-col gap-2">
                                <MessageSquare size={48} className="opacity-20" />
                                <span>Select a chat to start messaging</span>
                            </div>
                        )
                    )}
                    {viewMode === 'email' && (
                        <EmailUI emails={emails} />
                    )}
                    {viewMode === 'phone' && (
                        <PhoneUI calls={phoneCalls} />
                    )}
                </div>

                <div className="h-full bg-card rounded-xl overflow-y-auto">
                    <ClientDetails
                        selectedChatData={selectedChatData}
                        toggleAiAgentOverride={undefined}
                        onClientUpdated={refreshChats}
                        updateLocalChat={updateLocalChat}
                    />
                </div>
            </div>
        </div>
    );
};

export default Chat;
