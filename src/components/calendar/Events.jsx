import { Clock, User, Edit2 } from 'lucide-react';

const Events = ({ events, isToday, onEventClick }) => {

    const getEventStyle = (event) => {
        const color = event.event_types?.color || '#5B8DEF';

        // Check if it's a hex code (new system)
        if (color.startsWith('#')) {
            return {
                backgroundColor: `${color}26`, // 15% opacity (hex 26) roughly, matching labels
                color: color,
                borderColor: `${color}4D` // 30% opacity border
            };
        }

        // Fallback or legacy class strings
        return {
            backgroundColor: '#5B8DEF26',
            color: '#5B8DEF',
            borderColor: '#5B8DEF4D'
        };
    };

    const getEventClassName = (event) => {
        const color = event.event_types?.color;
        // If it IS a class string (old data), return it.
        if (color && !color.startsWith('#')) {
            return `inline-block px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border ${color}`;
        }
        return `inline-block px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border`;
    };

    const getEventTypeName = (event) => {
        return event.event_types?.name || event.type || 'Unknown';
    };

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted">
                <p>{isToday ? 'No events scheduled for today.' : 'No events scheduled for this day.'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 overflow-y-auto pr-2 h-full">
            {events.map((event) => (
                <div
                    key={event.id}
                    className="bg-elevated p-4 rounded-xl flex items-center gap-4 group"
                >
                    <div className="text-center shrink-0 bg-background/50 p-2 rounded-lg min-w-[70px]">
                        <div className="text-lg font-bold text-white">
                            {event.date ? new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                        </div>
                        {event.duration && (
                            <div className="text-sm text-muted font-medium">{event.duration} min</div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1 text-lg">{event.title}</h4>
                        <p className="text-base text-muted flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            {event.clients?.name || event.client_name || 'No client'}
                        </p>
                    </div>
                    <span
                        className={getEventClassName(event)}
                        style={getEventStyle(event)}
                    >
                        {getEventTypeName(event).replace('-', ' ')}
                    </span>
                    <button
                        onClick={() => onEventClick && onEventClick(event)}
                        className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit event"
                    >
                        <Edit2 size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Events;
