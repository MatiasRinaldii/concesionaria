import { useState, useEffect } from 'react';
import { X, Plus, Hash, Trash2, Check, Loader2 } from 'lucide-react';
import { getTags, createTag as apiCreateTag, deleteTag as apiDeleteTag } from '../../../../lib/api/labels';
import { getClient, addTagsToClient, removeTagFromClient as apiRemoveTagFromClient } from '../../../../lib/api/clients';

const TagsModal = ({ isOpen, onClose, clientId, onTagsUpdated }) => {
    // ... state ...
    const [clientTags, setClientTags] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [newTagName, setNewTagName] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // ... useEffect ...
    useEffect(() => {
        if (isOpen && clientId) {
            const init = async () => {
                setInitialLoading(true);
                setClientTags([]); // Clear stale data
                try {
                    await Promise.all([fetchClientTags(), fetchAllTags()]);
                } catch (error) {
                    console.error("Error initializing tags modal:", error);
                } finally {
                    setInitialLoading(false);
                }
            };
            init();
        }
    }, [isOpen, clientId]);

    // ... fetch functions ...
    const fetchClientTags = async () => {
        try {
            const client = await getClient(clientId);
            setClientTags(client?.tags || []);
        } catch (err) {
            console.error('Error fetching client tags:', err);
        }
    };

    const fetchAllTags = async () => {
        try {
            const data = await getTags();
            setAllTags(data || []);
        } catch (err) {
            console.error('Error fetching tags:', err);
        }
    };

    const createTag = async () => {
        if (!newTagName.trim()) return;
        setLoading(true);
        try {
            // Create the tag
            const data = await apiCreateTag(newTagName.trim());

            // Automatically assign to client
            await addTagsToClient(clientId, [data.id]);

            setAllTags([...allTags, data]);
            setClientTags([...clientTags, data]);
            setNewTagName('');
            if (onTagsUpdated) onTagsUpdated();
        } catch (err) {
            console.error('Error creating tag:', err);
        } finally {
            setLoading(false);
        }
    };

    const addTagToClient = async (tag) => {
        try {
            await addTagsToClient(clientId, [tag.id]);
            setClientTags([...clientTags, tag]);
            if (onTagsUpdated) onTagsUpdated();
        } catch (err) {
            console.error('Error adding tag:', err);
        }
    };

    const removeTagFromClient = async (tagId) => {
        try {
            await apiRemoveTagFromClient(clientId, tagId);
            setClientTags(clientTags.filter(t => t.id !== tagId));
            if (onTagsUpdated) onTagsUpdated();
        } catch (err) {
            console.error('Error removing tag:', err);
        }
    };

    const deleteTag = async (tagId) => {
        try {
            await apiDeleteTag(tagId);
            setAllTags(allTags.filter(t => t.id !== tagId));
            setClientTags(clientTags.filter(t => t.id !== tagId));
        } catch (err) {
            console.error('Error deleting tag:', err);
        }
    };

    const availableTags = allTags.filter(t => !clientTags.some(ct => ct.id === t.id));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 pt-10" onClick={onClose}>
            <div className="bg-gradient-to-b from-card to-background rounded-2xl w-full max-w-2xl min-h-[700px] mx-4 shadow-2xl border border-gray-700/50 flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-gray-700/50 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Hash size={22} className="text-primary" />
                            </div>
                            Manage Tags
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/10 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-5 relative flex-1 flex flex-col min-h-0">
                    {initialLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] z-10 rounded-b-2xl">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    )}
                    {/* Create New Tag */}
                    <div>
                        <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">
                            Create New Tag
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="new-tag-name"
                                name="new-tag-name"
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Enter tag name..."
                                className="flex-1 bg-background border border-gray-600 focus:border-primary rounded-xl px-4 py-3 text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/20 placeholder:italic"
                                onKeyDown={(e) => e.key === 'Enter' && createTag()}
                            />
                            <button
                                onClick={createTag}
                                disabled={loading || !newTagName.trim()}
                                className="px-5 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Assigned Tags */}
                    <div>
                        <label className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Check size={14} />
                            Assigned to Contact
                        </label>
                        <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                            {clientTags.length > 0 ? (
                                clientTags.map(tag => (
                                    <span
                                        key={tag.id}
                                        className="px-4 py-2 rounded-full bg-green-500/20 text-sm font-semibold text-green-400 flex items-center gap-2 border border-green-500/30"
                                    >
                                        <Check size={14} />
                                        {tag.name}
                                        <button
                                            onClick={() => removeTagFromClient(tag.id)}
                                            className="ml-1 hover:text-red-400 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-muted italic">No tags assigned yet</span>
                            )}
                        </div>
                    </div>

                    {/* Available Tags */}
                    <div>
                        <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Hash size={14} />
                            Available Tags ({availableTags.length})
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                            {availableTags.length > 0 ? (
                                availableTags.map(tag => (
                                    <div key={tag.id} className="flex items-center gap-1 group">
                                        <button
                                            onClick={() => addTagToClient(tag)}
                                            className="px-4 py-2 rounded-full bg-blue-500/10 text-sm font-medium text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 transition-all flex items-center gap-2"
                                        >
                                            <Plus size={14} />
                                            {tag.name}
                                        </button>
                                        <button
                                            onClick={() => deleteTag(tag.id)}
                                            className="p-1.5 opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                                            title="Delete tag permanently"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <span className="text-sm text-muted italic">All tags are assigned</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700/50 bg-background/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-elevated hover:bg-card-hover text-foreground rounded-xl font-medium transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TagsModal;
