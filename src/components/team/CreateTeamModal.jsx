import { useState, useEffect } from 'react';
import { X, Search, UserPlus, Loader2 } from 'lucide-react';
import { getUsers } from '../../lib/api/labels';

const CreateTeamModal = ({ isOpen, onClose, onCreateTeam }) => {
    const [teamName, setTeamName] = useState('');
    const [description, setDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(false);

    // Fetch available users
    useEffect(() => {
        if (isOpen) {
            fetchUsersData();
        }
    }, [isOpen]);

    const fetchUsersData = async () => {
        try {
            setFetchingUsers(true);
            const users = await getUsers();
            setAvailableUsers(users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setFetchingUsers(false);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!teamName.trim() || selectedUsers.length === 0) return;

        try {
            setLoading(true);
            await onCreateTeam(teamName.trim(), description.trim(), selectedUsers);
            handleClose();
        } catch (err) {
            console.error('Error creating team:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTeamName('');
        setDescription('');
        setSearchQuery('');
        setSelectedUsers([]);
        onClose();
    };

    const filteredUsers = availableUsers.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-foreground">Create Team Chat</h2>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-lg hover:bg-elevated text-muted hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Team Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Team Name
                        </label>
                        <input
                            type="text"
                            id="team-name"
                            name="team-name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Engineering Team"
                            className="w-full bg-elevated border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/10 rounded-lg px-4 py-2.5 outline-none transition-all duration-200 text-foreground placeholder:text-muted"
                        />
                    </div>

                    {/* Description Input */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Description
                        </label>
                        <textarea
                            id="team-description"
                            name="team-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Purpose of this team..."
                            rows={2}
                            className="w-full bg-elevated border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/10 rounded-lg px-4 py-2.5 outline-none transition-all duration-200 text-foreground placeholder:text-muted resize-none"
                        />
                    </div>

                    {/* Search Users */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Add Members ({selectedUsers.length} selected)
                        </label>
                        <div className="flex items-center gap-2 bg-elevated px-3 py-2 rounded-lg border border-transparent focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 mb-3">
                            <Search size={18} className="text-muted" />
                            <input
                                type="text"
                                id="create-team-user-search"
                                name="create-team-user-search"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none p-0 w-full outline-none text-foreground placeholder:text-muted text-sm"
                            />
                        </div>

                        {/* Users List */}
                        <div className="max-h-[300px] overflow-y-auto space-y-1">
                            {fetchingUsers ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 size={24} className="text-primary animate-spin" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-8 text-muted">
                                    No users found
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleUserSelection(user.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedUsers.includes(user.id)
                                            ? 'bg-primary/20 border border-primary'
                                            : 'hover:bg-elevated border border-transparent'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold">
                                            {user.full_name?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {user.full_name || 'Unknown User'}
                                            </div>
                                            <div className="text-xs text-muted truncate">
                                                {user.email}
                                            </div>
                                        </div>
                                        {selectedUsers.includes(user.id) && (
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path d="M5 13l4 4L19 7"></path>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-elevated text-foreground hover:bg-elevated/80"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!teamName.trim() || selectedUsers.length === 0 || loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Create Team
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTeamModal;
