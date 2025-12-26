import { useState, useEffect, useRef } from 'react';
import { Phone, Mail, Check, X, Plus, Tag, StickyNote, Trash2, Users, Bookmark, Hash, Calendar, Bot, Pencil, Loader2, Copy } from 'lucide-react';
import { updateClient, getClient, deleteClient as apiDeleteClient, removeTagFromClient as apiRemoveTagFromClient } from '../../../../lib/api/clients';
import TagsModal from './TagsModal';
import NotesModal from './NotesModal';
import LabelsModal from './LabelsModal';
import CreateEventModal from '../../../calendar/CreateEventModal';
import { createEvent } from '../../../../lib/api/events';

const ClientDetails = ({ selectedChatData, onClientUpdated, updateLocalChat }) => {
    const [clientTags, setClientTags] = useState([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [showTagsModal, setShowTagsModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showLabelsModal, setShowLabelsModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        phone: '',
        email: ''
    });
    const [editError, setEditError] = useState(null);
    const [copiedField, setCopiedField] = useState(null);

    const handleCopy = async (text, field) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Ref for debouncing refresh
    const refreshTimeoutRef = useRef(null);

    // Sync form with selected chat data
    useEffect(() => {
        if (selectedChatData?.clientData) {
            setEditForm({
                phone: selectedChatData.clientData.phone || '',
                email: selectedChatData.clientData.email || ''
            });
            setIsEditing(false);
            setEditError(null);
        }
    }, [selectedChatData?.id]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, []);

    // NEW TOGGLE FUNCTION
    const toggleAiAgentOverride = async () => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        try {
            const isCurrentlyEnabled = !selectedChatData.bot_enable;

            // 1. Optimistic Update
            if (updateLocalChat) {
                updateLocalChat(selectedChatData.id, {
                    bot_enable: isCurrentlyEnabled ? selectedChatData.id : null,
                    agent: isCurrentlyEnabled ? 'Human' : 'AI'
                });
            }

            // 2. Database Update via API
            await updateClient(selectedChatData.id, {
                bot_enable: isCurrentlyEnabled ? selectedChatData.id : null
            });

            if (onClientUpdated) {
                refreshTimeoutRef.current = setTimeout(() => {
                    onClientUpdated();
                }, 1000);
            }
        } catch (err) {
            // Revert optimistic update on error
            if (updateLocalChat) {
                const isCurrentlyEnabled = !selectedChatData.bot_enable;
                updateLocalChat(selectedChatData.id, {
                    bot_enable: isCurrentlyEnabled ? null : selectedChatData.id,
                    agent: isCurrentlyEnabled ? 'AI' : 'Human'
                });
            }
            console.error('Error toggling bot:', err);
        }
    };

    const handleSaveContactInfo = async () => {
        setEditError(null);
        try {
            await updateClient(selectedChatData.id, {
                phone: editForm.phone,
                email: editForm.email
            });

            setIsEditing(false);
            if (onClientUpdated) onClientUpdated();
        } catch (error) {
            console.error('Update failed:', error);
            if (error.code === '23505') { // Unique violation
                setEditError('Email or Phone already exists.');
            } else {
                setEditError('Failed to update contact.');
            }
        }
    };

    const handleEventCreated = async (eventData) => {
        try {
            await createEvent(eventData);
            // Optionally show success message
        } catch (error) {
            console.error('Error creating event from client details:', error);
        }
    };

    useEffect(() => {
        if (selectedChatData?.id) {
            setClientTags([]); // Clear old tags immediately
            fetchClientTags();
        }
    }, [selectedChatData?.id]);

    const fetchClientTags = async () => {
        try {
            setTagsLoading(true);
            const client = await getClient(selectedChatData.id);
            setClientTags(client?.tags || []);
        } catch (err) {
            console.error('Error fetching client tags:', err);
        } finally {
            setTagsLoading(false);
        }
    };

    const removeTagFromClient = async (tagId) => {
        try {
            await apiRemoveTagFromClient(selectedChatData.id, tagId);
            setClientTags(clientTags.filter(t => t.id !== tagId));
        } catch (err) {
            console.error('Error removing tag:', err);
        }
    };

    const deleteClientHandler = async () => {
        if (!window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
            return;
        }

        try {
            await apiDeleteClient(selectedChatData.id);
            window.location.reload();
        } catch (err) {
            console.error('Error deleting client:', err);
            alert('Failed to delete contact');
        }
    };

    if (!selectedChatData) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center text-muted">
                <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4">
                    <Users size={32} className="opacity-50" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">No Contact Selected</h3>
                <p className="text-sm max-w-[200px]">Select a conversation to view contact details</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-700 h-[60px] shrink-0 flex items-center">
                <h3 className="font-semibold text-foreground">Contact Details</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg shadow-primary/20">
                        {selectedChatData.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{selectedChatData.name}</h2>
                </div>

                {/* Action Buttons Row */}
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => setShowLabelsModal(true)}
                        className="w-10 h-10 rounded-lg bg-elevated hover:bg-primary/20 hover:text-primary flex items-center justify-center text-foreground transition-colors"
                        title="Manage Labels"
                    >
                        <Tag size={18} />
                    </button>
                    <button
                        onClick={() => setShowNotesModal(true)}
                        className="w-10 h-10 rounded-lg bg-elevated hover:bg-primary/20 hover:text-primary flex items-center justify-center text-foreground transition-colors"
                        title="Manage Notes"
                    >
                        <StickyNote size={18} />
                    </button>
                    <button
                        onClick={() => setShowEventModal(true)}
                        className="w-10 h-10 rounded-lg bg-elevated hover:bg-primary/20 hover:text-primary flex items-center justify-center text-foreground transition-colors"
                        title="Schedule Meeting"
                    >
                        <Calendar size={18} />
                    </button>
                    <button
                        className="w-10 h-10 rounded-lg bg-elevated hover:bg-primary/20 hover:text-primary flex items-center justify-center text-foreground transition-colors"
                        title="Person Profile"
                    >
                        <Users size={18} />
                    </button>
                    <button
                        onClick={deleteClientHandler}
                        className="w-10 h-10 rounded-lg bg-elevated hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center text-foreground transition-colors"
                        title="Delete Contact"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                <div>
                    <div
                        className="bg-elevated rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-elevated/80 transition-colors"
                        onClick={toggleAiAgentOverride}
                    >
                        <div>
                            <span className="block text-sm font-semibold text-foreground flex items-center gap-2">
                                <Bot size={24} />
                                AI Agent
                            </span>
                            <span className="block text-xs text-muted">
                                Auto-reply {!selectedChatData.bot_enable ? 'enabled' : 'disabled'}
                            </span>
                        </div>
                        <div
                            className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${!selectedChatData.bot_enable ? 'bg-primary' : 'bg-slate-600'}`}
                            role="switch"
                            aria-checked={!selectedChatData.bot_enable}
                            aria-label="Toggle AI Agent"
                        >
                            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 flex items-center justify-center ${!selectedChatData.bot_enable ? 'translate-x-7' : 'translate-x-0'}`}>
                                {!selectedChatData.bot_enable ? (
                                    <Check size={14} className="text-primary" strokeWidth={3} />
                                ) : (
                                    <X size={14} className="text-slate-600" strokeWidth={3} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-tertiary uppercase tracking-wider">Contact Information</h4>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1 text-muted hover:text-primary transition-colors"
                                title="Edit Contact Info"
                            >
                                <Pencil size={14} />
                            </button>
                        ) : (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleSaveContactInfo}
                                    className="p-1 text-success hover:bg-success/10 rounded"
                                    title="Save"
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditError(null);
                                        // Reset form
                                        setEditForm({
                                            phone: selectedChatData.clientData?.phone || '',
                                            email: selectedChatData.clientData?.email || ''
                                        });
                                    }}
                                    className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                    title="Cancel"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {editError && (
                        <div className="mb-2 text-xs text-red-500 font-medium">
                            {editError}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-sm text-foreground group">
                            <Phone size={16} className="text-muted shrink-0" />
                            {isEditing ? (
                                <input
                                    id="client-phone-edit"
                                    name="client-phone"
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="bg-elevated border border-gray-700 rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-primary"
                                    placeholder="Phone number"
                                />
                            ) : (
                                <>
                                    <span className="truncate">
                                        {selectedChatData.clientData?.phone ? (
                                            selectedChatData.clientData.phone.startsWith('+') ? selectedChatData.clientData.phone : `+${selectedChatData.clientData.phone}`
                                        ) : (
                                            <span className="text-muted italic">No phone</span>
                                        )}
                                    </span>
                                    {selectedChatData.clientData?.phone && (
                                        <button
                                            onClick={() => handleCopy(selectedChatData.clientData.phone.startsWith('+') ? selectedChatData.clientData.phone : `+${selectedChatData.clientData.phone}`, 'phone')}
                                            className="ml-auto p-1.5 text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                            title="Copy phone"
                                        >
                                            {copiedField === 'phone' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-foreground group">
                            <Mail size={16} className="text-muted shrink-0" />
                            {isEditing ? (
                                <input
                                    id="client-email-edit"
                                    name="client-email"
                                    type="text"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="bg-elevated border border-gray-700 rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-primary"
                                    placeholder="Email address"
                                />
                            ) : (
                                <>
                                    <span className="truncate" title={selectedChatData.clientData?.email}>
                                        {selectedChatData.clientData?.email || <span className="text-muted italic">No email</span>}
                                    </span>
                                    {selectedChatData.clientData?.email && (
                                        <button
                                            onClick={() => handleCopy(selectedChatData.clientData.email, 'email')}
                                            className="ml-auto p-1.5 text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                            title="Copy email"
                                        >
                                            {copiedField === 'email' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tags Section */}
                <div className="bg-elevated rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Hash size={16} />
                            Tags
                        </h4>
                        <button
                            onClick={() => setShowTagsModal(true)}
                            className="p-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-all"
                            title="Manage tags"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {tagsLoading ? (
                            <div className="flex w-full justify-center py-2">
                                <Loader2 size={16} className="animate-spin text-muted" />
                            </div>
                        ) : clientTags.length > 0 ? (
                            clientTags.map((tag, index) => {
                                // Rotate through different colors for variety
                                const colors = [
                                    'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25',
                                    'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25',
                                    'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25',
                                    'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25',
                                    'bg-pink-500/15 text-pink-400 border-pink-500/30 hover:bg-pink-500/25',
                                    'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25',
                                ];
                                const colorClass = colors[index % colors.length];
                                return (
                                    <span
                                        key={tag.id}
                                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-1.5 group transition-colors ${colorClass}`}
                                    >
                                        {tag.name}
                                    </span>
                                );
                            })
                        ) : (
                            <span className="text-sm text-muted italic">No tags assigned</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TagsModal
                isOpen={showTagsModal}
                onClose={() => setShowTagsModal(false)}
                clientId={selectedChatData.id}
                onTagsUpdated={fetchClientTags}
            />
            {showNotesModal && (
                <NotesModal
                    isOpen={showNotesModal}
                    onClose={() => setShowNotesModal(false)}
                    clientId={selectedChatData.id}
                />
            )}
            <LabelsModal
                isOpen={showLabelsModal}
                onClose={() => setShowLabelsModal(false)}
                clientId={selectedChatData.id}
                onLabelsUpdated={() => {
                    if (onClientUpdated) onClientUpdated();
                    // Also refresh local state if needed
                }}
                allowManagement={false}
            />
            <CreateEventModal
                isOpen={showEventModal}
                onClose={() => setShowEventModal(false)}
                onEventCreated={handleEventCreated}
                initialData={{
                    client_name: selectedChatData.name,
                    client_id: selectedChatData.id
                }}
            />
        </div>
    );
};

export default ClientDetails;
