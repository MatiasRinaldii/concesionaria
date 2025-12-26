import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Plus, Check, Calendar, Car, Tag } from 'lucide-react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../../lib/api/vehicles';
import { getCarStates } from '../../lib/api/carStates';
import LoadingSpinner from '../ui/LoadingSpinner';
import Vehicle from './Vehicle';
import AddVehicle from './AddVehicle';
import DeleteVehicleModal from './DeleteVehicleModal';

const Stock = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [vehicleToDelete, setVehicleToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter state
    const [showFilter, setShowFilter] = useState(false);
    const [selectedYears, setSelectedYears] = useState(new Set());
    const [selectedMarcas, setSelectedMarcas] = useState(new Set());
    const [selectedModelos, setSelectedModelos] = useState(new Set());
    const [carStateFilter, setCarStateFilter] = useState('all');
    const [carStates, setCarStates] = useState([]);

    const fetchCars = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getVehicles();
            setCars(data || []);
        } catch {
            // Silent error handling
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCars();
        getCarStates().then(setCarStates).catch(console.error);
    }, [fetchCars]);

    // Get unique values for filters
    const filterOptions = useMemo(() => {
        const years = [...new Set(cars.map(c => c.year).filter(Boolean))].sort((a, b) => b - a);
        const marcas = [...new Set(cars.map(c => c.marca || c.make).filter(Boolean))].sort();
        const modelos = [...new Set(cars.map(c => c.modelo || c.model).filter(Boolean))].sort();

        return { years, marcas, modelos };
    }, [cars]);

    // Toggle functions
    const toggleYear = (year) => {
        const next = new Set(selectedYears);
        if (next.has(year)) next.delete(year);
        else next.add(year);
        setSelectedYears(next);
    };

    const toggleMarca = (marca) => {
        const next = new Set(selectedMarcas);
        if (next.has(marca)) next.delete(marca);
        else next.add(marca);
        setSelectedMarcas(next);
    };

    const toggleModelo = (modelo) => {
        const next = new Set(selectedModelos);
        if (next.has(modelo)) next.delete(modelo);
        else next.add(modelo);
        setSelectedModelos(next);
    };

    const clearFilters = () => {
        setSelectedYears(new Set());
        setSelectedMarcas(new Set());
        setSelectedModelos(new Set());
        setShowFilter(false);
    };

    const isFiltering = selectedYears.size > 0 || selectedMarcas.size > 0 || selectedModelos.size > 0;

    // Memoized filtered cars
    const filteredCars = useMemo(() => {
        return cars.filter(car => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = searchQuery.trim() === '' ||
                car.marca?.toLowerCase().includes(searchLower) ||
                car.modelo?.toLowerCase().includes(searchLower) ||
                car.model?.toLowerCase().includes(searchLower) ||
                car.make?.toLowerCase().includes(searchLower) ||
                car.year?.toString().includes(searchQuery) ||
                car.color?.toLowerCase().includes(searchLower);

            const matchesYear = selectedYears.size === 0 || selectedYears.has(car.year);
            const matchesMarca = selectedMarcas.size === 0 ||
                selectedMarcas.has(car.marca || car.make);
            const matchesModelo = selectedModelos.size === 0 ||
                selectedModelos.has(car.modelo || car.model);
            const matchesCarState = carStateFilter === 'all' || car.car_state_id === carStateFilter;

            return matchesSearch && matchesYear && matchesMarca && matchesModelo && matchesCarState;
        });
    }, [cars, searchQuery, selectedYears, selectedMarcas, selectedModelos, carStateFilter]);

    const handleSaveVehicle = useCallback(async (vehicleData) => {
        try {
            if (editingVehicle) {
                await updateVehicle(editingVehicle.id, vehicleData);
            } else {
                await createVehicle(vehicleData);
            }

            await fetchCars();
            setIsModalOpen(false);
            setEditingVehicle(null);
        } catch {
            alert('Failed to save vehicle. Please try again.');
        }
    }, [editingVehicle, fetchCars]);

    const handleEditVehicle = useCallback((car) => {
        setEditingVehicle(car);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingVehicle(null);
    }, []);

    const handleDeleteClick = useCallback((car) => {
        setVehicleToDelete(car);
        setIsDeleteModalOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!vehicleToDelete) return;

        try {
            await deleteVehicle(vehicleToDelete.id);
            await fetchCars();
            setIsDeleteModalOpen(false);
            setVehicleToDelete(null);
        } catch {
            alert('Failed to delete vehicle. Please try again.');
        }
    }, [vehicleToDelete, fetchCars]);

    return (
        <div className="animate-fade-in">
            <div className="p-6 pb-4">
                <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1 text-foreground">Stock Management</h1>
                        <p className="text-base text-muted">Manage your vehicle inventory</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingVehicle(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 h-[42px]"
                        aria-label="Add new vehicle"
                    >
                        <Plus size={18} />
                        Add Vehicle
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 bg-elevated px-4 py-2 rounded-lg border border-transparent focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 h-[42px]">
                        <Search size={18} className="text-muted" />
                        <input
                            type="text"
                            id="stock-search"
                            name="stock-search"
                            placeholder="Search by make, model or year..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none p-0 w-full outline-none h-full text-foreground placeholder:text-muted placeholder:italic"
                            aria-label="Search vehicles"
                        />
                    </div>

                    {/* Filter Button with Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 h-[42px] ${isFiltering || showFilter ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card text-foreground hover:bg-elevated'}`}
                            aria-label="Filter vehicles"
                        >
                            <Filter size={18} />
                            Filters
                            {isFiltering && (
                                <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {selectedYears.size + selectedMarcas.size + selectedModelos.size}
                                </span>
                            )}
                        </button>

                        {showFilter && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-3 border-b border-gray-700/50 flex justify-between items-center bg-elevated/50">
                                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Filters</span>
                                        {isFiltering && (
                                            <button onClick={clearFilters} className="text-[10px] text-primary hover:underline font-medium">
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {/* Year Section */}
                                        <div className="mb-3">
                                            <div className="text-[10px] font-bold text-muted px-2 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                                <Calendar size={12} />
                                                Year
                                            </div>
                                            {filterOptions.years.length > 0 ? filterOptions.years.map(year => {
                                                const isSelected = selectedYears.has(year);
                                                return (
                                                    <div
                                                        key={year}
                                                        onClick={() => toggleYear(year)}
                                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-elevated'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-600 bg-transparent'}`}>
                                                            {isSelected && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <span className={`text-sm ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{year}</span>
                                                    </div>
                                                );
                                            }) : <div className="px-2 text-xs text-muted italic">No years available</div>}
                                        </div>

                                        {/* Marca Section */}
                                        <div className="mb-3">
                                            <div className="text-[10px] font-bold text-muted px-2 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                                <Car size={12} />
                                                Make
                                            </div>
                                            {filterOptions.marcas.length > 0 ? filterOptions.marcas.map(marca => {
                                                const isSelected = selectedMarcas.has(marca);
                                                return (
                                                    <div
                                                        key={marca}
                                                        onClick={() => toggleMarca(marca)}
                                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-elevated'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-600 bg-transparent'}`}>
                                                            {isSelected && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <span className={`text-sm ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{marca}</span>
                                                    </div>
                                                );
                                            }) : <div className="px-2 text-xs text-muted italic">No makes available</div>}
                                        </div>

                                        {/* Modelo Section */}
                                        <div className="mb-3">
                                            <div className="text-[10px] font-bold text-muted px-2 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                                <Tag size={12} />
                                                Model
                                            </div>
                                            {filterOptions.modelos.length > 0 ? filterOptions.modelos.map(modelo => {
                                                const isSelected = selectedModelos.has(modelo);
                                                return (
                                                    <div
                                                        key={modelo}
                                                        onClick={() => toggleModelo(modelo)}
                                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-elevated'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-600 bg-transparent'}`}>
                                                            {isSelected && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <span className={`text-sm ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{modelo}</span>
                                                    </div>
                                                );
                                            }) : <div className="px-2 text-xs text-muted italic">No models available</div>}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Car State Select - Separate */}
                    <select
                        value={carStateFilter}
                        onChange={(e) => setCarStateFilter(e.target.value)}
                        className="bg-card text-foreground rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer h-[42px] min-w-[130px]"
                        aria-label="Filter by car state"
                    >
                        <option value="all">All States</option>
                        {carStates.map(state => (
                            <option key={state.id} value={state.id}>{state.state}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="px-6 pb-6">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <LoadingSpinner size={48} />
                    </div>
                ) : filteredCars.length === 0 ? (
                    <div className="text-center py-12 text-muted">
                        <p className="text-lg">
                            {cars.length === 0
                                ? 'No vehicles found in stock.'
                                : 'No vehicles match your search criteria.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                        {filteredCars.map((car) => (
                            <Vehicle
                                key={car.id}
                                car={car}
                                onEdit={handleEditVehicle}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AddVehicle
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveVehicle}
                initialData={editingVehicle}
            />

            <DeleteVehicleModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                vehicle={vehicleToDelete}
            />
        </div>
    );
};

export default Stock;
