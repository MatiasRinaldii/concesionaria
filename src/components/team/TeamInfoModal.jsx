import { useState, useEffect } from 'react';
import { X, Users, Calendar, Crown, Shield, Edit2, Save, UserPlus, Trash2, Search, Loader2 } from 'lucide-react';
import {
    getTeamMembers,
    updateTeam,
    addTeamMember,
    removeTeamMember,
    getAvailableUsersForTeam,
    deleteTeam
} from '../../lib/api/teamConversations';

const TeamInfoModal = ({ isOpen, onClose, teamData, onTeamDeleted }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // Member Management
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddMember, setShowAddMember] = useState(false);

    useEffect(() => {
        if (isOpen && teamData?.id) {
            fetchMembers();
            setName(teamData.name);
            setDescription(teamData.description || '');
            setIsEditing(false);
            setShowAddMember(false);
        }
    }, [isOpen, teamData]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const data = await getTeamMembers(teamData.id);
            setMembers(data);
        } catch (error) {
            console.error('Error fetching team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableUsers = async () => {
        try {
            const users = await getAvailableUsersForTeam(teamData.id);
            setAvailableUsers(users);
        } catch (error) {
            console.error('Error fetching available users:', error);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateTeam(teamData.id, { name, description });
            // Ideally notify parent to refresh team list, but for now we update local state
            setIsEditing(false);
            // Optionally trigger a refresh or callback here if passed
        } catch (error) {
            console.error('Error updating team:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleAddMember = async (userId) => {
        try {
            setSaving(true);
            await addTeamMember(teamData.id, userId);
            await fetchMembers();
            await fetchAvailableUsers(); // Refresh available list
            setShowAddMember(false);
        } catch (error) {
            console.error('Error adding member:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            setSaving(true);
            await removeTeamMember(teamData.id, userId);
            await fetchMembers();
            fetchAvailableUsers(); // Refresh available list
        } catch (error) {
            console.error('Error removing member:', error);
        } finally {
            setSaving(false);
        }
    };

    const toggleEdit = () => {
        if (!isEditing) {
            setIsEditing(true);
            // Prepare available users when entering edit mode (or when clicking add)
            fetchAvailableUsers();
        } else {
            setIsEditing(false);
            // Reset fields
            setName(teamData.name);
            setDescription(teamData.description || '');
        }
    };

    const handleDeleteTeam = async () => {
        if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;
        try {
            setSaving(true);
            await deleteTeam(teamData.id);
            onClose();
            if (onTeamDeleted) onTeamDeleted();
        } catch (error) {
            console.error('Error deleting team:', error);
            alert('Error deleting team');
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = availableUsers.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-10 z-50 animate-fade-in">
            <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[85vh] min-h-[500px]">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-blue-950/50 shrink-0">
                    <h2 className="text-lg font-bold text-foreground">
                        {isEditing ? 'Edit Team Details' : 'Team Details'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={handleDeleteTeam}
                                    disabled={saving}
                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
                                    title="Delete Team"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={toggleEdit}
                                    className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-primary transition-colors"
                                    title="Edit Team"
                                >
                                    <Edit2 size={18} />
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-elevated text-muted hover:text-foreground transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto chat-scrollbar flex-1">
                    {/* Team Info Form/Display */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-primary/20 shrink-0">
                            {name?.substring(0, 2).toUpperCase()}
                        </div>

                        {isEditing ? (
                            <div className="w-full space-y-3">
                                <div>
                                    <label className="text-xs text-muted font-medium ml-1">Team Name</label>
                                    <input
                                        id="team-name-input"
                                        name="team-name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-elevated border border-transparent focus:border-primary rounded-lg px-3 py-2 outline-none text-foreground text-left font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted font-medium ml-1">Description</label>
                                    <textarea
                                        id="team-description-input"
                                        name="team-description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        className="w-full bg-elevated border border-transparent focus:border-primary rounded-lg px-3 py-2 outline-none text-foreground text-sm text-left resize-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-foreground mb-1 text-center">{name}</h3>
                                <p className="text-sm text-muted text-center max-w-[90%]">
                                    {description || 'No description provided'}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Stats (View Only) */}
                    {!isEditing && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-elevated/50 p-3 rounded-lg flex flex-col items-center">
                                <div className="flex items-center gap-2 text-primary mb-1">
                                    <Users size={18} />
                                    <span className="font-bold">{members.length}</span>
                                </div>
                                <span className="text-xs text-muted">Members</span>
                            </div>
                            <div className="bg-elevated/50 p-3 rounded-lg flex flex-col items-center">
                                <div className="flex items-center gap-2 text-primary mb-1">
                                    <Calendar size={18} />
                                    <span className="font-bold">Created</span>
                                </div>
                                <span className="text-xs text-muted">
                                    {new Date(teamData.created_at || Date.now()).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    )}



                    {/* Members List */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Users size={16} />
                                Team Members
                            </h4>
                            {isEditing && (
                                <button
                                    onClick={() => setShowAddMember(!showAddMember)}
                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
                                >
                                    <UserPlus size={14} />
                                    {showAddMember ? 'Cancel Add' : 'Add Member'}
                                </button>
                            )}
                        </div>

                        {/* Add Member Search */}
                        {isEditing && showAddMember && (
                            <div className="mb-4 bg-elevated/30 p-3 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 bg-elevated px-3 py-2 rounded-md mb-2">
                                    <Search size={14} className="text-muted" />
                                    <input
                                        id="add-member-search"
                                        name="add-member-search"
                                        type="text"
                                        placeholder="Search users to add..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-transparent border-none p-0 w-full outline-none text-sm text-foreground placeholder:text-muted"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-[150px] overflow-y-auto space-y-1">
                                    {filteredUsers.length === 0 ? (
                                        <p className="text-xs text-muted text-center py-2">No users found</p>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleAddMember(user.id)}
                                                className="flex items-center gap-2 p-2 hover:bg-primary/10 rounded cursor-pointer group"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white">
                                                    {user.full_name?.[0] || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-foreground truncate">{user.full_name}</p>
                                                </div>
                                                <UserPlus size={14} className="text-muted group-hover:text-primary" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1 chat-scrollbar">
                            {loading ? (
                                <p className="text-sm text-muted text-center py-4">Loading members...</p>
                            ) : (
                                members.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-elevated/50 transition-colors group">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-xs font-semibold">
                                            {member.full_name?.substring(0, 2).toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{member.full_name}</p>
                                            <p className="text-xs text-muted truncate">{member.email}</p>
                                        </div>
                                        {member.role === 'admin' ? (
                                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1 border border-primary/20">
                                                <Crown size={10} />
                                                Admin
                                            </span>
                                        ) : isEditing ? (
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="p-1.5 rounded-md hover:bg-red-500/20 text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove Member"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        ) : (
                                            <span className="text-xs bg-gray-500/10 text-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Shield size={10} />
                                                Member
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="p-4 border-t border-gray-700 flex justify-end gap-3 bg-elevated/50 shrink-0">
                        <button
                            onClick={toggleEdit}
                            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-elevated text-foreground hover:bg-elevated/80"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamInfoModal;
