import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile } from '../lib/api/storage';
import { formatMessageFiles } from '../lib/utils/fileUtils';

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

    useEffect(() => {
        selectedChatIdRef.current = selectedChatId;
    }, [selectedChatId]);

    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    // Fetch all chats
    const fetchChats = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const { data, error: fetchError } = await supabase
                .from('clients')
                .select(`
                    *,
                    label:labels!clients_label_id_fkey(*),
                    tags:tag_client(tag_id, tags(id, name)),
                    last_message:messages(id, message, message_file, created_at, agent_id)
                `)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            const formattedChats = (data || []).map(chat => {
                const lastMsg = chat.last_message?.[0];
                return {
                    id: chat.id,
                    created_at: chat.created_at,
                    name: chat.name || 'Unknown Client',
                    lastMessage: lastMsg?.message || (lastMsg?.message_file ? '📎 File' : 'No messages yet'),
                    time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    unread: 0,
                    agent: !chat.bot_enable ? 'AI' : 'Human',
                    bot_enable: chat.bot_enable,
                    status: chat.status,
                    platform: chat.platform,
                    label: chat.label || null,
                    tags: chat.tags?.map(t => t.tags) || [],
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

    // Fetch messages for selected chat
    const fetchMessages = useCallback(async (clientId) => {
        if (!clientId) return;

        try {
            setMessagesLoading(true);

            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*, users:agent_id(full_name)')
                .eq('session_id', clientId)
                .order('created_at', { ascending: true });

            if (fetchError) {
                console.error('Supabase error:', fetchError.message, fetchError.details, fetchError.hint);
                throw fetchError;
            }

            setMessages((data || []).map(formatMessage));
        } catch (err) {
            console.error('Error fetching messages:', err?.message || err);
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    // Send message with support for multiple files (images, videos, PDFs, etc.)
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

            const { data, error: sendErr } = await supabase
                .from('messages')
                .insert({
                    session_id: selectedChatIdRef.current,
                    message: text?.trim() || null,
                    message_file: fileUrls.length > 0 ? fileUrls : [],
                    agent_id: user?.id
                })
                .select('*, users:agent_id(full_name)')
                .single();

            if (sendErr) throw sendErr;

            // Add message to UI
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

    // Supabase Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('messages-realtime')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new;

                    // If message is for current chat, add to messages
                    if (newMsg.session_id === selectedChatIdRef.current) {
                        setMessages(prev => {
                            // Avoid duplicates
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
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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
