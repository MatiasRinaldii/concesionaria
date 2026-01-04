import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    connectSocket,
    getSocket
} from '../lib/socket';

export function useTeamChats() {
    const [teams, setTeams] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const { user } = useAuth();

    // Fetch teams via API route
    const fetchTeams = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);

            const res = await fetch('/api/teams/user-teams', {
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error('Error fetching teams');
            }

            const data = await res.json();

            console.log('👥 fetchTeams response:', { data, userId: user.id });

            const formattedTeams = (data || []).map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                created_at: t.created_at,
                lastMessage: t.description || 'Team chat',
                time: '',
                unread: 0,
                type: 'group',
                members: t.members || []
            }));

            console.log('👥 formattedTeams:', formattedTeams);

            setTeams(formattedTeams);
        } catch (err) {
            console.error('Error fetching teams:', err?.message || err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch messages for selected team via API route
    const fetchMessages = useCallback(async (teamId) => {
        // Skip if no teamId or if it's a special non-UUID id (like 'vision-ai')
        if (!teamId || !teamId.includes('-') || teamId.length < 30) return;

        try {
            setMessagesLoading(true);

            const res = await fetch(`/api/teams/messages?team_id=${teamId}`, {
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error('Error fetching team messages');
            }

            const data = await res.json();

            setMessages((data || []).map(msg => ({
                id: msg.id,
                text: msg.message,
                sender: msg.user_id === user?.id ? 'me' : 'other',
                senderName: msg.user_name || 'Unknown',
                senderAvatar: msg.user_avatar || null,
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
        } catch (err) {
            console.error('Error fetching team messages:', err?.message || err);
        } finally {
            setMessagesLoading(false);
        }
    }, [user]);

    // Send message via API route
    const sendMessage = useCallback(async (text) => {
        if (!selectedTeamId || !text?.trim() || !user) return;

        try {
            const res = await fetch('/api/teams/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    team_id: selectedTeamId,
                    message: text.trim()
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error sending message');
            }

            const data = await res.json();

            setMessages(prev => [...prev, {
                id: data.id,
                text: data.message,
                sender: 'me',
                senderName: data.user_name || 'Me',
                senderAvatar: data.user_avatar,
                time: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);

            return data;
        } catch (err) {
            console.error('Error sending team message:', err);
            throw err;
        }
    }, [selectedTeamId, user]);

    // Select team
    const selectTeam = useCallback((teamId) => {
        setSelectedTeamId(teamId);
        if (teamId) {
            fetchMessages(teamId);
        } else {
            setMessages([]);
        }
    }, [fetchMessages]);

    // Initial fetch
    useEffect(() => {
        if (user) {
            fetchTeams();
        }
    }, [user, fetchTeams]);

    // Socket.io for team messages (real-time)
    useEffect(() => {
        if (!selectedTeamId) return;

        let socket = null;

        const setupSocket = async () => {
            socket = await connectSocket();
            if (!socket) return;

            // Join team room
            socket.emit('join_team', selectedTeamId);

            // Listen for new team messages
            socket.on('team_message', (newMsg) => {
                // Avoid duplicates
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;

                    return [...prev, {
                        id: newMsg.id,
                        text: newMsg.message,
                        sender: newMsg.user_id === user?.id ? 'me' : 'other',
                        senderName: newMsg.user_name || 'User',
                        senderAvatar: newMsg.user_avatar || null,
                        time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }];
                });
            });
        };

        setupSocket();

        return () => {
            if (socket) {
                socket.emit('leave_team', selectedTeamId);
                socket.off('team_message');
            }
        };
    }, [selectedTeamId, user]);

    const selectedTeam = teams.find(t => t.id === selectedTeamId) || null;

    return {
        teams,
        chats: teams, // Alias for Team component
        messages,
        selectedTeamId,
        selectedChatId: selectedTeamId, // Alias
        selectedTeam,
        loading,
        messagesLoading,
        fetchTeams,
        refreshChats: fetchTeams, // Alias
        selectTeam,
        setSelectedChatId: selectTeam, // Alias for backwards compatibility
        sendMessage
    };
}
