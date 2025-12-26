import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Check, ChevronDown, Calendar, Clock, Search, User, Phone, Mail, Timer } from 'lucide-react';
import { getEventTypes, createEventType } from '../../lib/api/events';
import { getClients } from '../../lib/api/clients';

const CreateEventModal = ({ isOpen, onClose, onEventCreated, initialData = {} }) => {
    const [formData, setFormData] = useState({
        title: initialData.title || '',
        day: initialData.day || '',
        time: initialData.time || '',
        duration: initialData.duration || '30',
        client_name: initialData.client_name || '',
        client_id: initialData.client_id || '',
        event_type_id: initialData.event_type_id || ''
    });
    const [loading, setLoading] = useState(false);
    const [eventTypes, setEventTypes] = useState([]);
    const [isAddingType, setIsAddingType] = useState(false);
    const [newType, setNewType] = useState({ name: '', color: '#5B8DEF' });
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    // Client search state
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

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

    useEffect(() => {
        if (isOpen) {
            setIsAddingType(false);
            setClientSearch('');
            setShowClientDropdown(false);

            // Set initial selected client if editing
            if (initialData.client_id && initialData.client_name) {
                setSelectedClient({ id: initialData.client_id, name: initialData.client_name });
            } else {
                setSelectedClient(null);
            }

            setFormData(prev => ({
                ...prev,
                client_name: initialData.client_name || '',
                client_id: initialData.client_id || '',
                title: initialData.title || '',
                day: initialData.day || new Date().toISOString().split('T')[0],
                time: initialData.time || '09:00',
                event_type_id: initialData.event_type_id || ''
            }));
            fetchTypes();
            fetchClients();
        }
    }, [isOpen]);

    const fetchTypes = async () => {
        const types = await getEventTypes();
        setEventTypes(types);
    };

    const fetchClients = async () => {
        try {
            const data = await getClients();
            setClients(data || []);
        } catch {
            setClients([]);
        }
    };

    // Filter clients based on search
    const filteredClients = useMemo(() => {
        if (!clientSearch.trim()) return clients.slice(0, 10); // Show first 10 if no search
        const searchLower = clientSearch.toLowerCase();
        return clients.filter(c =>
            c.name?.toLowerCase().includes(searchLower) ||
            c.phone?.includes(clientSearch) ||
            c.email?.toLowerCase().includes(searchLower)
        ).slice(0, 10);
    }, [clients, clientSearch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeSelect = (typeId) => {
        setFormData(prev => ({ ...prev, event_type_id: typeId }));
        setShowTypeDropdown(false);
    };

    const handleClientSelect = (client) => {
        setSelectedClient(client);
        setFormData(prev => ({
            ...prev,
            client_id: client.id,
            client_name: client.name
        }));
        setClientSearch('');
        setShowClientDropdown(false);
    };

    const handleClearClient = () => {
        setSelectedClient(null);
        setFormData(prev => ({
            ...prev,
            client_id: '',
            client_name: ''
        }));
    };

    const handleCreateType = async () => {
        if (!newType.name.trim()) return;
        try {
            const created = await createEventType(newType.name, newType.color);
            if (created) {
                setEventTypes([...eventTypes, created]);
                setFormData(prev => ({ ...prev, event_type_id: created.id }));
                setIsAddingType(false);
                setNewType({ name: '', color: '#5B8DEF' });
            }
        } catch {
            // Silent fail
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Combine day + time into a single timestamp
            const dateTimeStr = formData.time
                ? `${formData.day}T${formData.time}:00`
                : `${formData.day}T12:00:00`;

            const payload = {
                title: formData.title,
                date: dateTimeStr, // timestamp
                duration: parseInt(formData.duration, 10) || 30, // numeric
                event_type_id: formData.event_type_id || null,
                client_id: formData.client_id || null
            };

            if (initialData.id) {
                payload.id = initialData.id;
            }

            await onEventCreated(payload);

            // Reset form
            setFormData({
                title: '',
                day: '',
                time: '',
                duration: '30',
                client_name: '',
                client_id: '',
                event_type_id: ''
            });
            setSelectedClient(null);

            onClose();
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const currentTypeLabel = eventTypes.find(t => t.id === formData.event_type_id)?.name || 'Select Type';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 pt-24 p-4">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl min-h-[600px] border border-white/10 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-foreground">
                        {initialData.id ? 'Edit Event' : (selectedClient ? `Schedule event with ${selectedClient.name}` : 'Schedule New Event')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-elevated text-muted hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col gap-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Event Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Enter event title"
                            className="w-full bg-elevated border border-white/10 rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted placeholder:italic focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Event Type */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Event Type *
                        </label>

                        {isAddingType ? (
                            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 p-3 bg-secondary/10 rounded-lg border border-white/5">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="New type name..."
                                        value={newType.name}
                                        onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                                        className="flex-1 bg-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCreateType}
                                        disabled={!newType.name.trim()}
                                        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingType(false)}
                                        className="px-3 py-2 bg-elevated text-foreground rounded-lg hover:bg-elevated/80 border border-white/10"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="flex gap-2 overflow-x-auto p-1.5 custom-scrollbar">
                                    {LABEL_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewType({ ...newType, color })}
                                            className={`w-6 h-6 rounded-md shrink-0 transition-transform ${newType.color === color ? 'ring-1 ring-white' : ''}`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2 relative">
                                {/* Custom Select Button */}
                                <div className="relative flex-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                        className="w-full flex items-center justify-between bg-elevated border border-white/10 rounded-lg px-4 py-2.5 text-foreground hover:bg-elevated/80 transition-all capitalize"
                                    >
                                        <span className={!formData.event_type_id ? 'italic text-muted' : ''}>{currentTypeLabel}</span>
                                        <ChevronDown size={16} className="text-muted" />
                                    </button>

                                    {showTypeDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowTypeDropdown(false)}></div>
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-elevated border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                                {eventTypes.length === 0 ? (
                                                    <div className="px-4 py-2 text-sm text-muted italic">No types available</div>
                                                ) : (
                                                    eventTypes.map(type => (
                                                        <button
                                                            key={type.id}
                                                            type="button"
                                                            onClick={() => handleTypeSelect(type.id)}
                                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors capitalize flex items-center gap-2 ${formData.event_type_id === type.id ? 'text-primary font-medium' : 'text-foreground'}`}
                                                        >
                                                            <span className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: type.color }}></span>
                                                            {type.name}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingType(true);
                                        setShowTypeDropdown(false);
                                    }}
                                    className="px-3 rounded-lg bg-elevated border border-white/10 hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center text-muted shrink-0"
                                    title="Add New Type"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Client Search */}
                    {!initialData.client_id && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Contact
                            </label>

                            {selectedClient ? (
                                <div className="flex items-center gap-2 bg-elevated border border-white/10 rounded-lg px-4 py-2.5">
                                    <User size={16} className="text-primary" />
                                    <span className="flex-1 text-foreground">{selectedClient.name}</span>
                                    <button
                                        type="button"
                                        onClick={handleClearClient}
                                        className="p-1 hover:bg-white/10 rounded text-muted hover:text-foreground transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                    <input
                                        type="text"
                                        value={clientSearch}
                                        onChange={(e) => {
                                            setClientSearch(e.target.value);
                                            setShowClientDropdown(true);
                                        }}
                                        onFocus={() => setShowClientDropdown(true)}
                                        placeholder="Search contacts by name, phone, or email..."
                                        className="w-full bg-elevated border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted placeholder:italic focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />

                                    {showClientDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowClientDropdown(false)}></div>
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-elevated border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                                {filteredClients.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-muted italic">
                                                        {clientSearch ? 'No contacts found' : 'Start typing to search...'}
                                                    </div>
                                                ) : (
                                                    filteredClients.map(client => (
                                                        <button
                                                            key={client.id}
                                                            type="button"
                                                            onClick={() => handleClientSelect(client)}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-3"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                                                                {client.name?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                                                                <p className="text-xs text-muted truncate flex items-center gap-2">
                                                                    {client.phone && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Phone size={10} />
                                                                            +{client.phone}
                                                                        </span>
                                                                    )}
                                                                    {client.email && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Mail size={10} />
                                                                            {client.email}
                                                                        </span>
                                                                    )}
                                                                    {!client.phone && !client.email && 'No contact info'}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Date, Time and Duration */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Date *
                            </label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                <input
                                    type="date"
                                    name="day"
                                    value={formData.day}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-elevated border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Time *
                            </label>
                            <div className="relative">
                                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" />
                                <select
                                    name="time"
                                    value={formData.time}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-elevated border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select time</option>
                                    <option value="09:00">09:00</option>
                                    <option value="09:30">09:30</option>
                                    <option value="10:00">10:00</option>
                                    <option value="10:30">10:30</option>
                                    <option value="11:00">11:00</option>
                                    <option value="11:30">11:30</option>
                                    <option value="12:00">12:00</option>
                                    <option value="12:30">12:30</option>
                                    <option value="13:00">13:00</option>
                                    <option value="13:30">13:30</option>
                                    <option value="14:00">14:00</option>
                                    <option value="14:30">14:30</option>
                                    <option value="15:00">15:00</option>
                                    <option value="15:30">15:30</option>
                                    <option value="16:00">16:00</option>
                                    <option value="16:30">16:30</option>
                                    <option value="17:00">17:00</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Duration
                            </label>
                            <div className="relative">
                                <Timer size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" />
                                <select
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    className="w-full bg-elevated border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                                >
                                    <option value="15">15 min</option>
                                    <option value="30">30 min</option>
                                    <option value="45">45 min</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 mt-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-elevated text-foreground hover:bg-elevated/80 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (initialData.id ? 'Updating...' : 'Creating...') : (initialData.id ? 'Update Event' : 'Create Event')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;
