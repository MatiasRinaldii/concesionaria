import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useTeamChats() {
    const [teams, setTeams] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const { user } = useAuth();

    // Fetch teams
    const fetchTeams = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('team_users')
                .select(`
                    team_id,
                    teams(
                        id, name, description, created_at,
                        team_users(user_id, users(full_name, avatar_url))
                    )
                `)
                .eq('user_id', user.id);

            console.log('👥 fetchTeams response:', { data, error, userId: user.id });

            if (error) {
                console.error('Supabase error:', error.message, error.details, error.hint);
                throw error;
            }

            const formattedTeams = (data || []).map(t => ({
                id: t.teams?.id,
                name: t.teams?.name,
                description: t.teams?.description,
                created_at: t.teams?.created_at,
                lastMessage: t.teams?.description || 'Team chat',
                time: '',
                unread: 0,
                type: 'group',
                members: t.teams?.team_users?.map(m => m.users) || []
            }));

            console.log('👥 formattedTeams:', formattedTeams);

            setTeams(formattedTeams);
        } catch (err) {
            console.error('Error fetching teams:', err?.message || err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch messages for selected team
    const fetchMessages = useCallback(async (teamId) => {
        // Skip if no teamId or if it's a special non-UUID id (like 'vision-ai')
        if (!teamId || !teamId.includes('-') || teamId.length < 30) return;

        try {
            setMessagesLoading(true);

            const { data, error } = await supabase
                .from('team_messages')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Supabase error:', error.message, error.details, error.hint);
                throw error;
            }

            setMessages((data || []).map(msg => ({
                id: msg.id,
                text: msg.message,
                sender: msg.user_id === user?.id ? 'me' : 'other',
                senderName: msg.user_name || 'Unknown',
                senderAvatar: null,
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
        } catch (err) {
            console.error('Error fetching team messages:', err?.message || err);
        } finally {
            setMessagesLoading(false);
        }
    }, [user]);

    // Send message
    const sendMessage = useCallback(async (text) => {
        if (!selectedTeamId || !text?.trim() || !user) return;

        try {
            const { data, error } = await supabase
                .from('team_messages')
                .insert({
                    team_id: selectedTeamId,
                    user_id: user.id,
                    message: text.trim()
                })
                .select('*, users(full_name, avatar_url)')
                .single();

            if (error) throw error;

            setMessages(prev => [...prev, {
                id: data.id,
                text: data.message,
                sender: 'me',
                senderName: data.users?.full_name || 'Me',
                senderAvatar: data.users?.avatar_url,
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

    // Supabase Realtime for team messages
    useEffect(() => {
        if (!selectedTeamId) return;

        const channel = supabase
            .channel(`team-${selectedTeamId}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `team_id=eq.${selectedTeamId}` },
                async (payload) => {
                    const newMsg = payload.new;

                    // Avoid duplicates
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;

                        return [...prev, {
                            id: newMsg.id,
                            text: newMsg.message,
                            sender: newMsg.user_id === user?.id ? 'me' : 'other',
                            senderName: 'User',
                            time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
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
