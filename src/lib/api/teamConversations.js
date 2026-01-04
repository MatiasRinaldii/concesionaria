/**
 * Get team conversations for the current user
 * Uses the new API routes
 */
export async function getTeamConversations() {
    const res = await fetch('/api/teams/user-teams', { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching team conversations');
    return res.json();
}

/**
 * Get messages for a team
 */
export async function getTeamMessages(teamId) {
    const res = await fetch(`/api/teams/messages?team_id=${teamId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching team messages');
    return res.json();
}

/**
 * Create a new team
 */
export async function createTeam(teamData) {
    const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(teamData)
    });
    if (!res.ok) throw new Error('Error creating team');
    return res.json();
}

/**
 * Delete a team
 */
export async function deleteTeam(id) {
    const res = await fetch(`/api/teams?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Error deleting team');
}

/**
 * Get team details
 */
export async function getTeamDetails(teamId) {
    const res = await fetch(`/api/teams?id=${teamId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching team details');
    return res.json();
}

/**
 * Send a team message
 */
export async function sendTeamMessage(teamId, message) {
    const res = await fetch('/api/teams/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ team_id: teamId, message })
    });
    if (!res.ok) throw new Error('Error sending team message');
    return res.json();
}

/**
 * Add member to team
 */
export async function addTeamMember(teamId, userId, role = 'member') {
    const res = await fetch('/api/teams/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ team_id: teamId, user_id: userId, role })
    });
    if (!res.ok) throw new Error('Error adding team member');
    return res.json();
}

/**
 * Remove member from team
 */
export async function removeTeamMember(teamId, userId) {
    const res = await fetch(`/api/teams/members?team_id=${teamId}&user_id=${userId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Error removing team member');
}

/**
 * Check if user has access to team
 */
export async function hasTeamAccess(teamId) {
    try {
        const res = await fetch(`/api/teams?id=${teamId}`, { credentials: 'include' });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId) {
    const res = await fetch(`/api/teams/members?team_id=${teamId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error fetching team members');
    return res.json();
}

/**
 * Update a team
 */
export async function updateTeam(teamId, updates) {
    const res = await fetch(`/api/teams?id=${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Error updating team');
    return res.json();
}

/**
 * Get available users for team (users not in the team)
 */
export async function getAvailableUsersForTeam(teamId) {
    // Get all users
    const usersRes = await fetch('/api/users', { credentials: 'include' });
    if (!usersRes.ok) throw new Error('Error fetching users');
    const allUsers = await usersRes.json();

    // Get current team members
    const membersRes = await fetch(`/api/teams/members?team_id=${teamId}`, { credentials: 'include' });
    if (!membersRes.ok) throw new Error('Error fetching team members');
    const members = await membersRes.json();

    // Filter out users who are already members
    const memberIds = new Set(members.map(m => m.id));
    return allUsers.filter(user => !memberIds.has(user.id));
}

/**
 * Legacy alias for createTeam - used by older components
 */
export async function createTeamGroup(name, description, memberIds = []) {
    const team = await createTeam({ name, description });

    // Add members if provided
    for (const userId of memberIds) {
        try {
            await addTeamMember(team.id, userId);
        } catch (err) {
            console.warn('Failed to add member:', userId, err);
        }
    }

    return team;
}
