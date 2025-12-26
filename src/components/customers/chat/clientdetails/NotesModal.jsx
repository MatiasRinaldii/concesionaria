import { useState, useEffect } from 'react';
import { X, StickyNote, Send, Trash2 } from 'lucide-react';
import { getNotes, createNote, deleteNote as apiDeleteNote } from '../../../../lib/api/labels';
import { useAuth } from '../../../../contexts/AuthContext';

const NotesModal = ({ isOpen, onClose, clientId, onNoteAdded }) => {
    const [noteText, setNoteText] = useState('');
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen && clientId) {
            setNotes([]); // Clear stale notes
            fetchNotesData();
        }
    }, [isOpen, clientId]);

    const fetchNotesData = async () => {
        setLoading(true);
        try {
            const data = await getNotes(clientId);
            setNotes(data || []);
        } catch (err) {
            console.error('Error fetching notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!noteText.trim()) return;
        setLoading(true);
        try {
            await createNote(clientId, noteText.trim());
            setNoteText('');
            fetchNotesData();
            if (onNoteAdded) onNoteAdded();
        } catch (err) {
            console.error('Error adding note:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteNoteHandler = async (noteId) => {
        try {
            await apiDeleteNote(noteId);
            setNotes(notes.filter(n => n.id !== noteId));
            if (onNoteAdded) onNoteAdded();
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 pt-10" onClick={onClose}>
            <div className="bg-gradient-to-b from-card to-background rounded-2xl w-full max-w-5xl mx-4 shadow-2xl border border-gray-700/50 flex flex-col h-[85vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-gray-700/50 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl shrink-0">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <StickyNote size={22} className="text-primary" />
                            </div>
                            Notes
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/10 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-5 flex-1 flex gap-5 overflow-hidden">
                    {/* Left: Notes List (History) */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 block shrink-0">
                            History
                        </label>
                        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
                            {loading && notes.length === 0 ? (
                                <div className="flex justify-center items-center py-8 text-muted">
                                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                </div>
                            ) : notes.length > 0 ? (
                                notes.map(note => (
                                    <div key={note.id} className="bg-elevated rounded-xl p-4 group transition-colors border border-transparent hover:border-gray-700 shrink-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                    {(note.users?.full_name || 'A')[0]}
                                                </div>
                                                <span className="text-xs font-medium text-foreground">
                                                    {note.users?.full_name || 'Agent'}
                                                </span>
                                                <span className="text-xs text-muted">
                                                    • {formatDate(note.created_at)}
                                                </span>
                                            </div>
                                            {note.user_id === user?.id && (
                                                <button
                                                    onClick={() => deleteNoteHandler(note.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all p-1 hover:bg-red-500/10 rounded"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap pl-8">{note.message}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted text-sm italic bg-elevated/30 rounded-xl border border-dashed border-gray-700">
                                    No notes yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Add Note */}
                    <div className="flex-1 flex flex-col min-h-0 border-l border-gray-700/50 pl-5">
                        <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block shrink-0">
                            Add New Note
                        </label>
                        <div className="bg-elevated rounded-xl p-1 border border-transparent focus-within:border-primary transition-colors flex-1 flex flex-col max-h-full">
                            <textarea
                                id="note-text-modal"
                                name="note-text-modal"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Write your note here..."
                                className="w-full flex-1 bg-transparent rounded-lg px-3 py-2 text-foreground outline-none resize-none text-sm"
                            />
                            <div className="flex justify-end px-2 pb-2 shrink-0">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !noteText.trim()}
                                    className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    <Send size={14} />
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotesModal;
