import { useState } from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight, Calendar, Gauge, Palette, DollarSign } from 'lucide-react';
import { getFileUrl } from '../../lib/api/storage';

const Vehicle = ({ car, onEdit, onDelete }) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const getStatusBadge = (status) => {
        const statusMap = {
            available: { class: 'bg-success/15 text-success border border-success/30', label: 'Available', color: 'var(--accent-success)', bgColor: 'rgba(16, 185, 129, 0.15)' },
            reserved: { class: 'bg-warning/15 text-warning border border-warning/30', label: 'Reserved', color: 'var(--accent-warning)', bgColor: 'rgba(245, 158, 11, 0.15)' },
            sold: { class: 'bg-danger/15 text-danger border border-danger/30', label: 'Sold', color: 'var(--accent-danger)', bgColor: 'rgba(239, 68, 68, 0.15)' }
        };
        return statusMap[status] || statusMap.available;
    };

    const formatMileage = (mileage) => {
        if (!mileage) return '0 km';
        return `${mileage.toLocaleString()} km`;
    };

    const status = getStatusBadge(car.status);

    // Get photos array, fallback to image_url or emoji
    const rawPhotos = car.fotos || car.photos || [];

    // Resolve paths to URLs
    const photos = rawPhotos.map(path => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return getFileUrl(path, 'vehicles');
    }).filter(Boolean);

    const hasPhotos = photos.length > 0;

    const nextPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    };

    const prevPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    return (
        <div className="bg-card rounded-lg border border-transparent overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md hover:border-primary group">
            {/* Photo Section */}
            <div className="relative h-[200px] bg-gradient-to-br from-elevated to-card-hover flex items-center justify-center overflow-hidden">
                {hasPhotos ? (
                    <>
                        <img
                            src={photos[currentPhotoIndex]}
                            alt={`${car.modelo || car.model}`}
                            className="w-full h-full object-cover"
                        />
                        {photos.length > 1 && (
                            <>
                                <button
                                    onClick={prevPhoto}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                                    aria-label="Previous photo"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={nextPhoto}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                                    aria-label="Next photo"
                                >
                                    <ChevronRight size={18} />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                    {photos.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-2 h-2 rounded-full transition-colors ${idx === currentPhotoIndex ? 'bg-white' : 'bg-white/40'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <span className="text-[5rem] drop-shadow-lg filter">{car.emoji || '🚗'}</span>
                )}
            </div>

            {/* Model Name - Below Photos */}
            <div className="px-4 pt-4 pb-2">
                <h3 className="text-lg font-bold text-foreground">
                    {car.modelo || car.model}
                </h3>
            </div>

            {/* Characteristics in Gray Box */}
            <div className="px-4 pb-4 flex flex-col gap-3">
                <div className="flex flex-col gap-2 p-3 bg-elevated rounded-lg">
                    {/* Brand */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted">
                            <span className="text-xs font-semibold uppercase tracking-wider">Make</span>
                        </span>
                        <span className="text-foreground font-medium">{car.marca || car.make || 'N/A'}</span>
                    </div>
                    {/* Year */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted">
                            <Calendar size={14} />
                            Year
                        </span>
                        <span className="text-foreground font-medium">{car.year}</span>
                    </div>
                    {/* Mileage */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted">
                            <Gauge size={14} />
                            Mileage
                        </span>
                        <span className="text-foreground font-medium">{formatMileage(car.kilometraje)}</span>
                    </div>
                    {/* Color */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted">
                            <Palette size={14} />
                            Color
                        </span>
                        <span className="text-foreground font-medium">{car.color || 'N/A'}</span>
                    </div>
                    {/* Price */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted">
                            <DollarSign size={14} />
                            Price
                        </span>
                        <span className="text-white font-bold">${car.price?.toLocaleString() || '0'}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-auto h-[32px]">
                    <span
                        className="px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide"
                        style={{
                            backgroundColor: status.bgColor,
                            color: status.color
                        }}
                    >
                        {status.label}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={() => onEdit && onEdit(car)}
                            className="p-2 rounded-md hover:bg-elevated text-muted hover:text-foreground transition-colors"
                            title="Edit vehicle"
                            aria-label={`Edit ${car.modelo || car.model}`}
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => onDelete && onDelete(car)}
                            className="p-2 rounded-md hover:bg-elevated text-muted hover:text-danger transition-colors"
                            title="Delete vehicle"
                            aria-label={`Delete ${car.modelo || car.model}`}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Vehicle;
