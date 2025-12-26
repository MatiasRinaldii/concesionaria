import { useState, useEffect } from 'react';
import { User, Palette, Bot, Save, Tag, Plus, Trash2, Car } from 'lucide-react';
import { getLabels, createLabel, deleteLabel } from '../../lib/api/labels';
import { getCarStates, createCarState, deleteCarState } from '../../lib/api/carStates';
import ToggleSwitch from '../ui/ToggleSwitch';

const Settings = () => {
    const [activeSection, setActiveSection] = useState('user');
    const [theme, setTheme] = useState('dark');
    const [language, setLanguage] = useState('en');
    const [labels, setLabels] = useState([]);
    const [newLabel, setNewLabel] = useState('');
    const [newLabelDesc, setNewLabelDesc] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#5B8DEF');
    const [carStates, setCarStates] = useState([]);
    const [newCarStateName, setNewCarStateName] = useState('');
    const [newCarStateColor, setNewCarStateColor] = useState('#5B8DEF');

    const navItems = [
        { id: 'user', label: 'User', icon: User },
        { id: 'labels', label: 'Labels', icon: Tag },
        { id: 'carStates', label: 'Car States', icon: Car },
        { id: 'theme', label: 'Theme', icon: Palette },
        { id: 'ai', label: 'AI Agent', icon: Bot },
    ];

    useEffect(() => {
        fetchLabels();
        fetchCarStates();
    }, []);

    const fetchLabels = async () => {
        try {
            const data = await getLabels();
            setLabels(data || []);
        } catch {
            // Silent error handling
        }
    };

    const handleAddLabel = async () => {
        if (!newLabel.trim()) return;
        try {
            const data = await createLabel({
                name: newLabel.trim(),
                description: newLabelDesc.trim() || null,
                color: newLabelColor
            });
            setLabels([...labels, data]);
            setNewLabel('');
            setNewLabelDesc('');
            setNewLabelColor('#5B8DEF');
        } catch {
            alert('Failed to add label');
        }
    };

    const handleDeleteLabel = async (id) => {
        if (!confirm('Are you sure you want to delete this label?')) return;
        try {
            await deleteLabel(id);
            setLabels(labels.filter(l => l.id !== id));
        } catch {
            alert('Failed to delete label');
        }
    };

    const fetchCarStates = async () => {
        try {
            const data = await getCarStates();
            setCarStates(data || []);
        } catch {
            // Silent error handling
        }
    };

    const handleAddCarState = async () => {
        if (!newCarStateName.trim()) return;
        try {
            const data = await createCarState({
                state: newCarStateName.trim(),
                color: newCarStateColor
            });
            setCarStates([...carStates, data]);
            setNewCarStateName('');
            setNewCarStateColor('#5B8DEF');
        } catch {
            alert('Failed to add car state');
        }
    };

    const handleDeleteCarState = async (id) => {
        if (!confirm('Are you sure you want to delete this car state?')) return;
        try {
            await deleteCarState(id);
            setCarStates(carStates.filter(s => s.id !== id));
        } catch {
            alert('Failed to delete car state');
        }
    };

    useEffect(() => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }, [theme]);

    const renderContent = () => {
        switch (activeSection) {
            case 'user':
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">Profile Settings</h2>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted">Full Name</label>
                                    <input type="text" defaultValue="Admin User" className="w-full bg-elevated border border-transparent focus:border-primary rounded-lg px-4 py-2 text-foreground outline-none transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted">Email</label>
                                    <input type="email" defaultValue="admin@dealercrm.com" className="w-full bg-elevated border border-transparent focus:border-primary rounded-lg px-4 py-2 text-foreground outline-none transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted">Role</label>
                                    <select defaultValue="manager" className="w-full bg-elevated border border-transparent focus:border-primary rounded-lg px-4 py-2 text-foreground outline-none transition-colors cursor-pointer">
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="agent">Agent</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">Notifications</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-elevated/50 transition-colors">
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">New Lead Notifications</h4>
                                        <p className="text-xs text-muted">Get notified when a new lead comes in</p>
                                    </div>
                                    <ToggleSwitch checked={true} />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-elevated/50 transition-colors">
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">Email Notifications</h4>
                                        <p className="text-xs text-muted">Receive email updates for important events</p>
                                    </div>
                                    <ToggleSwitch checked={false} />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'labels':
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">Labels Management</h2>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2 items-start">
                                    <div className="flex-1 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Label Name"
                                            value={newLabel}
                                            onChange={(e) => setNewLabel(e.target.value)}
                                            className="w-1/3 bg-elevated border border-transparent focus:border-primary rounded-lg px-4 py-2 text-foreground outline-none transition-colors"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Description (optional)"
                                            value={newLabelDesc}
                                            onChange={(e) => setNewLabelDesc(e.target.value)}
                                            className="flex-1 bg-elevated border border-transparent focus:border-primary rounded-lg px-4 py-2 text-foreground outline-none transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddLabel}
                                        disabled={!newLabel.trim()}
                                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
                                    >
                                        <Plus size={18} />
                                        Add Label
                                    </button>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <span className="text-sm text-muted">Color:</span>
                                    <div className="flex gap-2">
                                        {[
                                            '#EF4444', // Red
                                            '#F97316', // Orange
                                            '#F59E0B', // Amber
                                            '#10B981', // Emerald
                                            '#06B6D4', // Cyan
                                            '#3B82F6', // Blue
                                            '#8B5CF6', // Violet
                                            '#EC4899'  // Pink
                                        ].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setNewLabelColor(color)}
                                                className={`w-6 h-6 rounded-full transition-all ${newLabelColor === color ? 'ring-2 ring-offset-2 ring-offset-card ring-primary scale-110' : 'hover:scale-110'}`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {labels.map(label => (
                                    <div key={label.id} className="bg-elevated p-3 rounded-lg flex justify-between items-start group border border-transparent hover:border-primary/20 transition-all">
                                        <div className="flex flex-col gap-1 overflow-hidden">
                                            <div className="flex items-center gap-2">
                                                <Tag size={14} style={{ color: label.color || '#5B8DEF' }} className="shrink-0" />
                                                <span className="text-sm font-medium text-foreground truncate">{label.name}</span>
                                            </div>
                                            {label.description && (
                                                <span className="text-xs text-muted truncate pl-5.5">{label.description}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteLabel(label.id)}
                                            className="text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-500/10 rounded shrink-0"
                                            title="Delete Label"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {labels.length === 0 && (
                                    <div className="col-span-full text-center text-muted text-sm py-4">
                                        No labels created yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'carStates':
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">Car States Management</h2>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2 items-start">
                                    <input
                                        type="text"
                                        placeholder="State Name"
                                        value={newCarStateName}
                                        onChange={(e) => setNewCarStateName(e.target.value)}
                                        className="flex-1 bg-elevated border border-transparent focus:border-primary rounded-lg px-4 py-2 text-foreground outline-none transition-colors"
                                    />
                                    <button
                                        onClick={handleAddCarState}
                                        disabled={!newCarStateName.trim()}
                                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
                                    >
                                        <Plus size={18} />
                                        Add State
                                    </button>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <span className="text-sm text-muted">Color:</span>
                                    <div className="flex gap-2">
                                        {[
                                            '#EF4444', // Red
                                            '#F97316', // Orange
                                            '#F59E0B', // Amber
                                            '#10B981', // Emerald
                                            '#06B6D4', // Cyan
                                            '#3B82F6', // Blue
                                            '#8B5CF6', // Violet
                                            '#EC4899'  // Pink
                                        ].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setNewCarStateColor(color)}
                                                className={`w-6 h-6 rounded-full transition-all ${newCarStateColor === color ? 'ring-2 ring-offset-2 ring-offset-card ring-primary scale-110' : 'hover:scale-110'}`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {carStates.map(state => (
                                    <div key={state.id} className="bg-elevated p-3 rounded-lg flex justify-between items-center group border border-transparent hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-2">
                                            <Car size={14} style={{ color: state.color || '#5B8DEF' }} className="shrink-0" />
                                            <span className="text-sm font-medium text-foreground truncate">{state.state}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCarState(state.id)}
                                            className="text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-500/10 rounded shrink-0"
                                            title="Delete State"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {carStates.length === 0 && (
                                    <div className="col-span-full text-center text-muted text-sm py-4">
                                        No car states created yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'theme':
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">Appearance</h2>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted">Theme</label>
                                <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full bg-elevated border border-transparent focus:border-primary rounded-lg px-4 py-2 text-foreground outline-none transition-colors cursor-pointer">
                                    <option value="dark">Dark Mode</option>
                                    <option value="light">Light Mode</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted">Language</label>
                                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-elevated border border-transparent focus:border-primary rounded-lg px-4 py-2 text-foreground outline-none transition-colors cursor-pointer">
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted">Accent Color</label>
                                <div className="flex gap-3 mt-2">
                                    <div className="w-8 h-8 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-card ring-primary" style={{ background: 'var(--accent-primary)' }}></div>
                                    <div className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-card hover:ring-secondary transition-all" style={{ background: 'var(--accent-secondary)' }}></div>
                                    <div className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-card hover:ring-success transition-all" style={{ background: 'var(--accent-success)' }}></div>
                                    <div className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-card hover:ring-warning transition-all" style={{ background: 'var(--accent-warning)' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'ai':
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">AI Configuration</h2>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted">AI Response Style</label>
                                <select defaultValue="professional" className="w-full bg-elevated border border-transparent focus:border-primary rounded-lg px-4 py-2 text-foreground outline-none transition-colors cursor-pointer">
                                    <option value="professional">Professional</option>
                                    <option value="friendly">Friendly</option>
                                    <option value="casual">Casual</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-muted">Auto-escalation Threshold</label>
                                    <span className="text-xs font-bold text-primary">Medium</span>
                                </div>
                                <input type="range" min="1" max="10" defaultValue="5" className="w-full h-2 bg-elevated rounded-lg appearance-none cursor-pointer accent-primary" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-elevated/50 transition-colors">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">Auto-assign Leads to AI</h4>
                                    <p className="text-xs text-muted">Automatically route new leads to AI agents</p>
                                </div>
                                <ToggleSwitch checked={true} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-elevated/50 transition-colors">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">AI Agent Alerts</h4>
                                    <p className="text-xs text-muted">Receive alerts when AI needs assistance</p>
                                </div>
                                <ToggleSwitch checked={true} />
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="h-screen overflow-hidden">
            <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1 text-foreground">Settings</h1>
                        <p className="text-base text-muted">Customize your CRM experience</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 h-[42px]">
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="px-6 pb-6 grid grid-cols-[240px_1fr] gap-6 h-[calc(100vh-120px)]">
                {/* Sidebar Navigation */}
                <div className="bg-card rounded-xl p-3 h-fit">
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeSection === item.id
                                        ? 'text-primary'
                                        : 'text-muted hover:bg-elevated hover:text-foreground'
                                        }`}
                                    style={activeSection === item.id ? { backgroundColor: 'rgba(91, 141, 239, 0.25)' } : undefined}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="bg-card rounded-xl p-6 overflow-y-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Settings;
