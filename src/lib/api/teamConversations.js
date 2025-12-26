import { supabase } from '../supabase';

/**
 * Get team conversations
 */
export async function getTeamConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('team_users')
        .select('team_id, teams(*, team_users(user_id, users(full_name, avatar_url)))')
        .eq('user_id', user.id);

    if (error) throw error;
    return data?.map(t => t.teams) || [];
}

/**
 * Get team messages
 */
export async function getTeamMessages(teamId) {
    const { data, error } = await supabase
        .from('team_messages')
        .select('*, users(full_name, avatar_url)')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Send team message
 */
export async function sendTeamMessage(teamId, message) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('team_messages')
        .insert({
            team_id: teamId,
            user_id: user?.id,
            message
        })
        .select('*, users(full_name, avatar_url)')
        .single();

    if (error) throw error;
    return data;
}

/**
 * Create a team
 */
export async function createTeam(teamData) {
    const { data: { user } } = await supabase.auth.getUser();

    // Create team
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
            name: teamData.name,
            description: teamData.description,
            created_by: user?.id
        })
        .select()
        .single();

    if (teamError) throw teamError;

    // Add members (including creator)
    const memberIds = [...(teamData.member_ids || []), user?.id];
    const uniqueIds = [...new Set(memberIds)];

    const members = uniqueIds.map(userId => ({
        team_id: team.id,
        user_id: userId
    }));

    const { error: membersError } = await supabase
        .from('team_users')
        .insert(members);

    if (membersError) throw membersError;

    return team;
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId) {
    const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

    if (error) throw error;
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId) {
    const { data, error } = await supabase
        .from('team_users')
        .select('user_id, users(id, full_name, avatar_url, email)')
        .eq('team_id', teamId);

    if (error) throw error;
    return data?.map(m => m.users) || [];
}

/**
 * Update a team
 */
export async function updateTeam(teamId, updates) {
    const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Add a member to a team
 */
export async function addTeamMember(teamId, userId) {
    const { error } = await supabase
        .from('team_users')
        .insert({ team_id: teamId, user_id: userId });

    if (error) throw error;
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(teamId, userId) {
    const { error } = await supabase
        .from('team_users')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

    if (error) throw error;
}

/**
 * Get users that can be added to a team
 */
export async function getAvailableUsersForTeam(teamId) {
    const { data: { user } } = await supabase.auth.getUser();

    // Get current team members
    const { data: members } = await supabase
        .from('team_users')
        .select('user_id')
        .eq('team_id', teamId);

    const memberIds = members?.map(m => m.user_id) || [];

    // Get all users except current members
    const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, email')
        .not('id', 'in', `(${memberIds.join(',')})`);

    if (error) throw error;
    return data || [];
}

// Alias for backwards compatibility
export const createTeamGroup = createTeam;
