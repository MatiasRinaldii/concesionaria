import { useState, useEffect } from 'react';
import { X, ChevronDown, Plus, Check, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { uploadFile, getFileUrl } from '../../lib/api/storage';
import { getCarStates } from '../../lib/api/carStates';

const AddVehicle = ({ isOpen, onClose, onSave, initialData = null }) => {
    const defaultForm = {
        marca: '',
        modelo: '',
        year: new Date().getFullYear(),
        price: '',
        kilometraje: '',
        color: '',
        car_state_id: '',
        version: '', // version/edicion
        tipo_combustible: '',
        transmision: '',
        carroceria: '',
        numero_puertas: '',
        numero_cilindros: '',
        motor: '',
        potencia: '',
        // Features
        aire_acondicionado: false,
        pantalla: false,
        camara_reversa: false,
        sensor_reversa: false,
        crucero: false,
        asientos_cuero: false,
        bolsa_aire: false,
        sistema_frenos: false,
        control_estabilidad: false,
        fotos: []
    };

    const [formData, setFormData] = useState(defaultForm);
    const [loading, setLoading] = useState(false);
    const [carStates, setCarStates] = useState([]);
    const [showCarStateDropdown, setShowCarStateDropdown] = useState(false);

    // Photo management
    const [newPhotos, setNewPhotos] = useState([]); // Array of File objects
    const [existingPhotos, setExistingPhotos] = useState([]); // Array of paths
    const [previews, setPreviews] = useState([]); // Array of { url, isNew, original }

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultForm,
                ...initialData,
                // Sanitize potential nulls for inputs
                marca: initialData.marca || '',
                modelo: initialData.modelo || '',
                price: initialData.price || '',
                kilometraje: initialData.kilometraje || '',
                color: initialData.color || '',
                tipo_combustible: initialData.tipo_combustible || '',
                transmision: initialData.transmision || '',
                carroceria: initialData.carroceria || '',
                numero_puertas: initialData.numero_puertas || '',
                numero_cilindros: initialData.numero_cilindros || '',
                motor: initialData.motor || '',
                potencia: initialData.potencia || '',
                // Ensure booleans are actually booleans
                aire_acondicionado: !!initialData.aire_acondicionado,
                pantalla: !!initialData.pantalla,
                camara_reversa: !!initialData.camara_reversa,
                sensor_reversa: !!initialData.sensor_reversa,
                crucero: !!initialData.crucero,
                asientos_cuero: !!initialData.asientos_cuero,
                bolsa_aire: !!initialData.bolsa_aire,
                sistema_frenos: !!initialData.sistema_frenos,
                control_estabilidad: !!initialData.control_estabilidad,
                // Map version/edicion
                version: initialData['version/edicion'] || initialData.version || '',
            });

            // Initialize photos
            if (initialData.fotos && Array.isArray(initialData.fotos)) {
                setExistingPhotos(initialData.fotos);
            } else {
                setExistingPhotos([]);
            }
        } else {
            setFormData(defaultForm);
            setExistingPhotos([]);
        }
        setNewPhotos([]);
    }, [initialData, isOpen]);

    // Fetch car states when modal opens
    useEffect(() => {
        if (isOpen) {
            getCarStates().then(setCarStates).catch(console.error);
        }
    }, [isOpen]);

    // Generate previews whenever photos change
    useEffect(() => {
        const existingPreviews = existingPhotos.map(path => ({
            url: getFileUrl(path), // Convert path to URL for display
            isNew: false,
            original: path
        }));

        const newPreviews = newPhotos.map(file => ({
            url: URL.createObjectURL(file),
            isNew: true,
            original: file
        }));

        setPreviews([...existingPreviews, ...newPreviews]);

        // Cleanup object URLs
        return () => {
            newPreviews.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, [existingPhotos, newPhotos]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePhotoSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setNewPhotos(prev => [...prev, ...files]);
        }
    };

    const removePhoto = (index) => {
        const itemToRemove = previews[index];
        if (itemToRemove.isNew) {
            // Remove from newPhotos
            setNewPhotos(prev => prev.filter(f => f !== itemToRemove.original));
        } else {
            // Remove from existingPhotos
            setExistingPhotos(prev => prev.filter(p => p !== itemToRemove.original));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Upload new photos
            const uploadPromises = newPhotos.map(file => uploadFile(file, 'vehicles'));
            const uploadResults = await Promise.all(uploadPromises);
            const newPhotoPaths = uploadResults.map(res => res.path);

            // 2. Combine paths
            const finalPhotos = [...existingPhotos, ...newPhotoPaths];

            const vehicleData = {
                ...formData,
                year: parseInt(formData.year),
                price: parseFloat(formData.price),
                kilometraje: parseInt(formData.kilometraje) || 0,
                numero_puertas: parseInt(formData.numero_puertas) || null,
                numero_cilindros: parseInt(formData.numero_cilindros) || null,
                'version/edicion': formData.version, // Map back to DB column name if needed
                fotos: finalPhotos // Save array of paths
            };

            // Clean up temporary keys if necessary, strictly follow DB schema
            delete vehicleData.version;

            await onSave(vehicleData);
            onClose();
        } catch (error) {
            console.error('Error saving vehicle:', error);
            alert('Error saving vehicle. Please check console.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-4xl border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-card z-10">
                    <h2 className="text-xl font-bold text-foreground">
                        {initialData ? 'Edit Vehicle' : 'Add New Vehicle'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-elevated text-muted hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Photos Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Vehicle Photos</h3>
                        <div className="bg-elevated/50 border-2 border-dashed border-white/10 rounded-xl p-6 transition-colors hover:border-primary/50 group">
                            <input
                                type="file"
                                id="photo-upload"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoSelect}
                                className="hidden"
                            />
                            <div className="flex flex-col items-center justify-center gap-2 cursor-pointer" onClick={() => document.getElementById('photo-upload').click()}>
                                <div className="p-3 bg-elevated rounded-full text-muted group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                    <Upload size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-foreground">Click to upload photos</p>
                                    <p className="text-xs text-muted">SVG, PNG, JPG or GIF</p>
                                </div>
                            </div>
                        </div>

                        {/* Previews Grid */}
                        {previews.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {previews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group bg-elevated border border-white/10">
                                        <img
                                            src={preview.url}
                                            alt={`Preview ${index}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <hr className="border-white/10" />

                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Make *</label>
                                <input type="text" name="marca" value={formData.marca} onChange={handleChange} required className="input-field" placeholder="e.g. BMW" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Model *</label>
                                <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required className="input-field" placeholder="e.g. X5" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Version/Edition</label>
                                <input type="text" name="version" value={formData.version} onChange={handleChange} className="input-field" placeholder="e.g. M Sport" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Year *</label>
                                <input type="number" name="year" value={formData.year} onChange={handleChange} required className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Color *</label>
                                <input type="text" name="color" value={formData.color} onChange={handleChange} required className="input-field" placeholder="e.g. Black" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Car State</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowCarStateDropdown(!showCarStateDropdown)}
                                        className="w-full flex items-center justify-between input-field text-left"
                                    >
                                        <span>
                                            {formData.car_state_id
                                                ? carStates.find(s => s.id === formData.car_state_id)?.state || 'Select state'
                                                : 'Select state'}
                                        </span>
                                        <ChevronDown size={16} className="text-muted" />
                                    </button>
                                    {showCarStateDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-elevated border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto">
                                            {carStates.map(state => (
                                                <button
                                                    key={state.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, car_state_id: state.id });
                                                        setShowCarStateDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${formData.car_state_id === state.id ? 'text-primary font-medium' : 'text-foreground'}`}
                                                >
                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: state.color || '#5B8DEF' }} />
                                                    {state.state}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* Technical Specs */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Technical Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Price (USD) *</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} required className="input-field" placeholder="0.00" step="0.01" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Mileage (km) *</label>
                                <input type="number" name="kilometraje" value={formData.kilometraje} onChange={handleChange} required className="input-field" placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Fuel Type</label>
                                <input type="text" name="tipo_combustible" value={formData.tipo_combustible} onChange={handleChange} className="input-field" placeholder="e.g. Gasoline" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Transmission</label>
                                <input type="text" name="transmision" value={formData.transmision} onChange={handleChange} className="input-field" placeholder="e.g. Automatic" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Body Type</label>
                                <input type="text" name="carroceria" value={formData.carroceria} onChange={handleChange} className="input-field" placeholder="e.g. SUV" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Engine</label>
                                <input type="text" name="motor" value={formData.motor} onChange={handleChange} className="input-field" placeholder="e.g. 3.0L V6" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Power</label>
                                <input type="text" name="potencia" value={formData.potencia} onChange={handleChange} className="input-field" placeholder="e.g. 300 HP" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Doors</label>
                                <input type="number" name="numero_puertas" value={formData.numero_puertas} onChange={handleChange} className="input-field" placeholder="4" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Cylinders</label>
                                <input type="number" name="numero_cilindros" value={formData.numero_cilindros} onChange={handleChange} className="input-field" placeholder="6" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* Features */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Features & Equipment</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { key: 'aire_acondicionado', label: 'Air Conditioning' },
                                { key: 'pantalla', label: 'Screen/Display' },
                                { key: 'camara_reversa', label: 'Reverse Camera' },
                                { key: 'sensor_reversa', label: 'Parking Sensors' },
                                { key: 'crucero', label: 'Cruise Control' },
                                { key: 'asientos_cuero', label: 'Leather Seats' },
                                { key: 'bolsa_aire', label: 'Airbags' },
                                { key: 'sistema_frenos', label: 'ABS Brakes' },
                                { key: 'control_estabilidad', label: 'Stability Control' },
                            ].map(feature => (
                                <label key={feature.key} className="flex items-center gap-3 p-3 bg-elevated rounded-lg cursor-pointer hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData[feature.key] ? 'bg-primary border-primary text-white' : 'border-white/20'}`}>
                                        {formData[feature.key] && <Check size={14} />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        name={feature.key}
                                        checked={formData[feature.key]}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <span className="text-sm text-foreground">{feature.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-6 flex gap-3 sticky bottom-0 bg-card border-t border-white/10 -mx-6 px-6 pb-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg font-medium bg-elevated text-foreground hover:bg-elevated/80 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : (initialData ? 'Update Vehicle' : 'Add Vehicle')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVehicle;
