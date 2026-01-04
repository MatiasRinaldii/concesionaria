import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile } from '../lib/api/storage';
import { formatMessageFiles } from '../lib/utils/fileUtils';
import {
    connectSocket,
    getSocket,
    joinClientRoom,
    leaveClientRoom,
    onNewMessage
} from '../lib/socket';

/**
 * Format a message object for display in the UI
 */
const formatMessage = (msg) => {
    const fileUrls = formatMessageFiles(msg.message_file);
    return {
        id: msg.id,
        sender: msg.agent_id ? 'agent' : 'client',
        senderName: msg.agent_name || msg.users?.full_name || 'Agent',
        text: msg.message,
        file: fileUrls.length > 0 ? fileUrls[0] : null,
        files: fileUrls,
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: msg.read
    };
};

export function useChats() {
    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sendError, setSendError] = useState(null);
    const { user } = useAuth();

    const selectedChatIdRef = useRef(selectedChatId);
    const chatsRef = useRef(chats);
    const prevSelectedChatIdRef = useRef(null);

    useEffect(() => {
        selectedChatIdRef.current = selectedChatId;
    }, [selectedChatId]);

    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    // Fetch all chats via API route
    const fetchChats = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const res = await fetch('/api/clients', {
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error('Error fetching clients');
            }

            const data = await res.json();

            const formattedChats = (data || []).map(chat => {
                return {
                    id: chat.id,
                    created_at: chat.created_at,
                    name: chat.name || 'Unknown Client',
                    lastMessage: chat.last_message || 'No messages yet',
                    time: chat.updated_at ? new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    unread: chat.unread_count || 0,
                    agent: !chat.bot_enable ? 'AI' : 'Human',
                    bot_enable: chat.bot_enable,
                    status: chat.status,
                    platform: chat.platform,
                    label: chat.label_name ? { name: chat.label_name, color: chat.label_color } : null,
                    tags: chat.tags || [],
                    clientData: chat
                };
            });

            setChats(formattedChats);
            setError(null);
        } catch (err) {
            console.error('Error fetching chats:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch messages for selected chat via API route
    const fetchMessages = useCallback(async (clientId) => {
        if (!clientId) return;

        try {
            setMessagesLoading(true);

            const res = await fetch(`/api/messages?client_id=${clientId}`, {
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error('Error fetching messages');
            }

            const data = await res.json();
            setMessages((data || []).map(formatMessage));
        } catch (err) {
            console.error('Error fetching messages:', err?.message || err);
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    // Send message with support for multiple files via API route
    const sendMessage = useCallback(async (text, files = []) => {
        const filesArray = Array.isArray(files) ? files : (files ? [files] : []);
        if (!selectedChatIdRef.current || (!text?.trim() && filesArray.length === 0)) return;

        setSendError(null);
        let fileUrls = [];

        try {
            // Upload all files
            for (const file of filesArray) {
                if (file && file.name) {
                    const uploaded = await uploadFile(file, 'vehicles');
                    fileUrls.push(uploaded.url);
                }
            }

            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    session_id: selectedChatIdRef.current,
                    message: text?.trim() || null,
                    message_file: fileUrls.length > 0 ? fileUrls : [],
                    agent_id: user?.id
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error sending message');
            }

            const data = await res.json();

            // Add message to UI (optimistic - will also arrive via socket but we dedupe)
            setMessages(prev => [...prev, formatMessage(data)]);

            // Update chat list
            setChats(prev => prev.map(chat =>
                chat.id === selectedChatIdRef.current
                    ? {
                        ...chat,
                        lastMessage: text?.trim() || '📎 File',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                    : chat
            ));

            return data;
        } catch (err) {
            console.error('Error sending message:', err?.message || err?.code || JSON.stringify(err));
            setSendError(err?.message || 'Failed to send message');
            throw err;
        }
    }, [user]);

    // Select a chat
    const selectChat = useCallback((chatId) => {
        setSelectedChatId(chatId);
        if (chatId) {
            fetchMessages(chatId);
        } else {
            setMessages([]);
        }
    }, [fetchMessages]);

    // Update local chat (for optimistic updates)
    const updateLocalChat = useCallback((chatId, updates) => {
        setChats(prev => prev.map(chat =>
            chat.id === chatId ? { ...chat, ...updates } : chat
        ));
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    // Socket.io connection and real-time subscription
    useEffect(() => {
        let unsubNewMessage = null;
        let unsubChatUpdated = null;

        const setupSocket = async () => {
            const socket = await connectSocket();
            if (!socket) {
                console.warn('Socket.io connection failed, real-time disabled');
                return;
            }

            console.log('🔌 Socket.io connected for real-time messages');

            // Listen for new messages
            unsubNewMessage = onNewMessage((newMsg) => {
                // If message is for current chat, add to messages
                if (newMsg.session_id === selectedChatIdRef.current) {
                    setMessages(prev => {
                        // Avoid duplicates (from optimistic updates)
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, formatMessage(newMsg)];
                    });
                }

                // Update chat list
                setChats(prev => prev.map(chat =>
                    chat.id === newMsg.session_id
                        ? {
                            ...chat,
                            lastMessage: newMsg.message || '📎 File',
                            time: new Date(newMsg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            unread: chat.id !== selectedChatIdRef.current
                                ? (chat.unread || 0) + 1
                                : chat.unread
                        }
                        : chat
                ));
            });

            // Listen for chat updates (from webhook)
            socket.on('chat_updated', (data) => {
                setChats(prev => prev.map(chat =>
                    chat.id === data.session_id
                        ? {
                            ...chat,
                            lastMessage: data.last_message,
                            time: new Date(data.updated_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            unread: chat.id !== selectedChatIdRef.current
                                ? (chat.unread || 0) + 1
                                : chat.unread
                        }
                        : chat
                ));
            });
        };

        setupSocket();

        return () => {
            if (unsubNewMessage) unsubNewMessage();
            const socket = getSocket();
            if (socket) {
                socket.off('chat_updated');
            }
        };
    }, []);

    // Join/leave client rooms when selected chat changes
    useEffect(() => {
        // Leave previous room
        if (prevSelectedChatIdRef.current) {
            leaveClientRoom(prevSelectedChatIdRef.current);
        }

        // Join new room
        if (selectedChatId) {
            joinClientRoom(selectedChatId);
        }

        prevSelectedChatIdRef.current = selectedChatId;
    }, [selectedChatId]);

    // Get selected chat data
    const selectedChatData = chats.find(c => c.id === selectedChatId) || null;

    return {
        chats,
        messages,
        selectedChatId,
        selectedChatData,
        loading,
        messagesLoading,
        error,
        sendError,
        fetchChats,
        selectChat,
        setSelectedChatId: selectChat, // Alias for backwards compatibility
        sendMessage,
        updateLocalChat,
        refreshChats: () => fetchChats(false)
    };
}
