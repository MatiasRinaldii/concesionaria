import React, { useState, useEffect } from 'react';
import { getNotes, createNote, deleteNote } from '../../../../lib/api/labels';
import { Send, StickyNote, Trash2 } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';

const Notes = ({ clientId }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (clientId) {
            fetchNotesData();
        }
    }, [clientId]);

    const fetchNotesData = async () => {
        try {
            setLoading(true);
            const data = await getNotes(clientId);
            setNotes(data || []);
        } catch (err) {
            console.error('Error fetching notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim() || !user) return;

        try {
            const data = await createNote(clientId, newNote.trim());
            // Add user name to display
            data.user_name = user.full_name;
            setNotes([data, ...notes]);
            setNewNote('');
        } catch (err) {
            console.error('Error adding note:', err);
            alert('Failed to add note');
        }
    };

    const handleDeleteNote = async (noteId) => {
        try {
            await deleteNote(noteId);
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4 text-foreground">
                <StickyNote size={18} />
                <h3 className="font-semibold">Notes</h3>
            </div>

            <form onSubmit={handleAddNote} className="mb-4 relative">
                <textarea
                    id="note-text-inline"
                    name="note-text-inline"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full bg-elevated border border-border rounded-lg p-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[80px]"
                />
                <button
                    type="submit"
                    disabled={!newNote.trim()}
                    className="absolute bottom-3 right-3 p-1.5 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={14} />
                </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {loading ? (
                    <div className="text-center text-muted text-xs py-4">Loading notes...</div>
                ) : notes.length === 0 ? (
                    <div className="text-center text-muted text-xs py-4">No notes yet</div>
                ) : (
                    notes.map(note => (
                        <div key={note.id} className="bg-card border border-border rounded-lg p-3 group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-medium text-primary">
                                    {note.user_name || note.users?.full_name || 'Unknown User'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted">
                                        {new Date(note.created_at).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{note.message}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notes;
