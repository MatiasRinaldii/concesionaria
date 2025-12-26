import { AlertTriangle, X } from 'lucide-react';

const DeleteVehicleModal = ({ isOpen, onClose, onConfirm, vehicle }) => {
    if (!isOpen || !vehicle) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-md border border-white/10 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-red-500/5">
                    <div className="flex items-center gap-3 text-red-500">
                        <div className="p-2 bg-red-500/10 rounded-full">
                            <AlertTriangle size={24} />
                        </div>
                        <h2 className="text-xl font-bold">Delete Vehicle</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-elevated text-muted hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-foreground/80 mb-4">
                        Are you sure you want to delete this vehicle? This action cannot be undone.
                    </p>

                    <div className="bg-elevated/50 rounded-lg p-4 border border-white/5 flex flex-col gap-1">
                        <span className="text-sm text-muted uppercase tracking-wider font-semibold">Vehicle Details</span>
                        <div className="text-lg font-medium text-foreground">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-sm text-muted">
                            {vehicle.color || 'No Color'} • {vehicle.kilometraje ? `${vehicle.kilometraje.toLocaleString()} km` : '0 km'}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-elevated text-foreground hover:bg-elevated/80 transition-colors border border-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(vehicle)}
                        className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                    >
                        Delete Vehicle
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteVehicleModal;
