import { useState, useEffect } from 'react';
import { X, Plus, Tag as TagIcon, Trash2, Check, Loader2 } from 'lucide-react';
import { getLabels, createLabel as apiCreateLabel, deleteLabel as apiDeleteLabel } from '../../../../lib/api/labels';
import { updateClient } from '../../../../lib/api/clients';

const LabelsModal = ({ isOpen, onClose, clientId, onLabelsUpdated, allowManagement = false }) => {
    const [clientLabels, setClientLabels] = useState([]);
    const [allLabels, setAllLabels] = useState([]);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelDesc, setNewLabelDesc] = useState('');
    const [selectedColor, setSelectedColor] = useState('#5B8DEF'); // Default blue
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const LABEL_COLORS = [
        '#5B8DEF', // Default Blue
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#6366F1', // Indigo
        '#F97316', // Orange
    ];

    const [pendingLabel, setPendingLabel] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (isOpen && clientId) {
            const init = async () => {
                setInitialLoading(true);
                setClientLabels([]); // Clear stale data
                setPendingLabel(null); // Clear stale selection
                setHasChanges(false);
                try {
                    await Promise.all([fetchClientLabels(), fetchAllLabels()]);
                } catch (error) {
                    console.error("Error initializing modal:", error);
                } finally {
                    setInitialLoading(false);
                }
            };
            init();
        }
    }, [isOpen, clientId]);

    const fetchClientLabels = async () => {
        try {
            // Fetch the client to get current label_id
            const { getClient } = await import('../../../../lib/api/clients');
            const client = await getClient(clientId);
            const label = client?.label || null;
            setClientLabels(label ? [label] : []);
            setPendingLabel(label || null);
        } catch (err) {
            console.error('Error fetching client labels:', JSON.stringify(err, null, 2));
        }
    };

    const fetchAllLabels = async () => {
        try {
            const data = await getLabels();
            setAllLabels(data || []);
        } catch (err) {
            console.error('Error fetching labels:', err);
        }
    };

    const createLabel = async () => {
        if (!newLabelName.trim()) return;
        setLoading(true);
        try {
            const labelData = {
                name: newLabelName.trim(),
                description: newLabelDesc.trim() || null,
                color: selectedColor
            };

            const data = await apiCreateLabel(labelData);

            setAllLabels([...allLabels, data]);
            setPendingLabel(data);
            setHasChanges(true);

            setNewLabelName('');
            setNewLabelDesc('');
            setSelectedColor('#5B8DEF');
        } catch (err) {
            console.error('Error creating label:', JSON.stringify(err, null, 2));
            alert('Failed to create label: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const toggleLabelSelection = (label) => {
        if (pendingLabel?.id === label.id) {
            // Deselect
            setPendingLabel(null);
        } else {
            // Select (single selection)
            setPendingLabel(label);
        }
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            if (hasChanges) {
                await updateClient(clientId, { label_id: pendingLabel ? pendingLabel.id : null });

                if (onLabelsUpdated) onLabelsUpdated();
            }
            onClose();
        } catch (err) {
            console.error('Error saving labels:', err);
            alert('Failed to save changes');
        }
    };

    const deleteLabel = async (labelId, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this label globally?')) return;

        try {
            await apiDeleteLabel(labelId);
            setAllLabels(allLabels.filter(l => l.id !== labelId));

            if (pendingLabel?.id === labelId) {
                setPendingLabel(null);
                setHasChanges(true);
            }
        } catch (err) {
            console.error('Error deleting label:', err);
        }
    };

    const activeLabelId = pendingLabel?.id;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 pt-20" onClick={onClose}>
            <div className="bg-gradient-to-b from-card to-background rounded-2xl w-full max-w-lg min-h-[550px] mx-4 shadow-2xl border border-gray-700/50 flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header calls onClose which won't save, maybe that's intended cancel behavior? Or should X also save? Usually X is cancel/close. Done is save. */}
                <div className="p-5 border-b border-gray-700/50 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <TagIcon size={22} className="text-primary" />
                            </div>
                            {allowManagement ? 'Manage Label' : 'Select Label'}
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
                    {/* Create New Label (Only if allowed) */}
                    {allowManagement && (
                        <div>
                            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">
                                Create New Label
                            </label>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <input
                                        id="new-label-name"
                                        name="new-label-name"
                                        type="text"
                                        value={newLabelName}
                                        onChange={(e) => setNewLabelName(e.target.value)}
                                        placeholder="Label Name"
                                        className="flex-1 bg-background border border-gray-600 focus:border-primary rounded-xl px-4 py-3 text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                    {LABEL_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 shrink-0 transition-transform hover:scale-110 ${selectedColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        id="new-label-desc"
                                        name="new-label-desc"
                                        type="text"
                                        value={newLabelDesc}
                                        onChange={(e) => setNewLabelDesc(e.target.value)}
                                        placeholder="Description (optional)"
                                        className="flex-1 bg-background border border-gray-600 focus:border-primary rounded-xl px-4 py-2 text-sm text-foreground outline-none transition-all"
                                        onKeyDown={(e) => e.key === 'Enter' && createLabel()}
                                    />
                                    <button
                                        onClick={createLabel}
                                        disabled={loading || !newLabelName.trim()}
                                        className="px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Labels List */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">
                            {allowManagement ? 'Select Label (Single Selection)' : 'Label Selection'}
                        </label>
                        <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            {/* Selected Label Section */}
                            {pendingLabel && (
                                <div className="mb-2">
                                    <div className="text-[10px] font-medium text-primary mb-1 pl-1">SELECTED</div>
                                    <div
                                        key={pendingLabel.id}
                                        onClick={() => toggleLabelSelection(pendingLabel)}
                                        className="p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center group shadow-sm"
                                        style={{
                                            backgroundColor: `rgba(${parseInt(pendingLabel.color.slice(1, 3), 16)}, ${parseInt(pendingLabel.color.slice(3, 5), 16)}, ${parseInt(pendingLabel.color.slice(5, 7), 16)}, 0.15)`,
                                            borderColor: `rgba(${parseInt(pendingLabel.color.slice(1, 3), 16)}, ${parseInt(pendingLabel.color.slice(3, 5), 16)}, ${parseInt(pendingLabel.color.slice(5, 7), 16)}, 0.3)`,
                                            color: pendingLabel.color
                                        }}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm font-semibold truncate transition-colors" style={{ color: pendingLabel.color }}>
                                                    {pendingLabel.name}
                                                </span>
                                                {pendingLabel.description && (
                                                    <span className="text-xs text-muted truncate">
                                                        {pendingLabel.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {allowManagement && (
                                            <button
                                                onClick={(e) => deleteLabel(pendingLabel.id, e)}
                                                className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all shrink-0"
                                                title="Delete label globally"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Available Labels Section */}
                            {allLabels.filter(l => l.id !== pendingLabel?.id).length > 0 && (
                                <div>
                                    {pendingLabel && <div className="text-[10px] font-medium text-muted mb-1 pl-1 mt-2">AVAILABLE</div>}
                                    <div className="flex flex-col gap-2">
                                        {allLabels
                                            .filter(l => l.id !== pendingLabel?.id)
                                            .map(label => (
                                                <div
                                                    key={label.id}
                                                    onClick={() => toggleLabelSelection(label)}
                                                    className="p-3 rounded-xl border border-transparent bg-elevated hover:bg-elevated/80 cursor-pointer transition-all flex justify-between items-center group"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-sm font-semibold truncate text-foreground transition-colors">
                                                                {label.name}
                                                            </span>
                                                            {label.description && (
                                                                <span className="text-xs text-muted truncate">
                                                                    {label.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {allowManagement && (
                                                        <button
                                                            onClick={(e) => deleteLabel(label.id, e)}
                                                            className="p-1.5 opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all shrink-0"
                                                            title="Delete label globally"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {allLabels.length === 0 && (
                                <div className="text-center py-8 text-muted text-sm italic bg-elevated/30 rounded-xl border border-dashed border-gray-700">
                                    No labels available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700/50 bg-background/50 rounded-b-2xl">
                    <button
                        onClick={handleSave}
                        className={`w-full py-3 rounded-xl font-medium transition-colors ${hasChanges
                            ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                            : 'bg-elevated hover:bg-card-hover text-foreground'
                            }`}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabelsModal;
