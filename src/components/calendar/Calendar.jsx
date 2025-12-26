import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import Events from './Events';
import CreateEventModal from './CreateEventModal';
import { getEvents, getEventTypes, createEvent, updateEvent } from '../../lib/api/events';

const Calendar = () => {
    const [events, setEvents] = useState([]);
    const [eventTypes, setEventTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [statsView, setStatsView] = useState('today'); // 'today' or 'week'

    useEffect(() => {
        fetchEvents();
        getEventTypes().then(setEventTypes).catch(console.error);
    }, []);

    // Navigation handlers
    const prevDay = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() - 1);
        setCurrentDate(next);
    };

    const nextDay = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + 1);
        setCurrentDate(next);
    };

    const jumpToToday = () => {
        setCurrentDate(new Date());
    };

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await getEvents();
            setEvents(data);

            // Process data for upcoming events
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Calculate week start (Sunday) and end (Saturday)
            const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - dayOfWeek); // Go back to Sunday
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // Saturday

            const monthEnd = new Date(today);
            monthEnd.setDate(monthEnd.getDate() + 30);

            const getEventDate = (event) => {
                if (!event.date) return new Date(0);
                // date is a timestamp
                const date = new Date(event.date);
                date.setHours(0, 0, 0, 0);
                return date;
            };

            const todayEvents = data.filter(e => {
                const eventDate = getEventDate(e);
                return eventDate.getTime() === today.getTime();
            });

            const tomorrowEvents = data.filter(e => {
                const eventDate = getEventDate(e);
                return eventDate.getTime() === tomorrow.getTime();
            });

            const weekEvents = data.filter(e => {
                const eventDate = getEventDate(e);
                return eventDate >= weekStart && eventDate <= weekEnd;
            });

            const monthEvents = data.filter(e => {
                const eventDate = getEventDate(e);
                return eventDate >= today && eventDate <= monthEnd;
            });

            // Count events by type dynamically (with color)
            // Always include all event types, even if count is 0
            const countByType = (eventsToCount, allEventTypes) => {
                const counts = {};
                // Initialize all types with 0
                allEventTypes.forEach(type => {
                    counts[type.name] = { count: 0, color: type.color || '#5B8DEF' };
                });
                // Count actual events
                eventsToCount.forEach(e => {
                    if (!e.event_types?.name) return; // Skip events without type
                    const typeName = e.event_types.name;
                    if (counts[typeName]) {
                        counts[typeName].count += 1;
                    }
                });
                return counts;
            };

            // Fetch all event types to ensure we show all of them
            const allEventTypes = await getEventTypes();

            const todayCounts = countByType(todayEvents, allEventTypes);
            const tomorrowCounts = countByType(tomorrowEvents, allEventTypes);
            const weekCounts = countByType(weekEvents, allEventTypes);
            const monthCounts = countByType(monthEvents, allEventTypes);

            const formatCounts = (counts) => {
                return Object.entries(counts).map(([type, data]) => `${data.count} ${type}`);
            };

            const processedUpcoming = [
                {
                    date: 'Tomorrow',
                    count: tomorrowEvents.length,
                    events: formatCounts(tomorrowCounts)
                },
                {
                    date: 'Today',
                    count: todayEvents.length,
                    events: formatCounts(todayCounts),
                    typeCounts: todayCounts
                },
                {
                    date: 'This Week',
                    count: weekEvents.length,
                    events: formatCounts(weekCounts),
                    typeCounts: weekCounts
                },
                {
                    date: 'This Month',
                    count: monthEvents.length,
                    events: formatCounts(monthCounts)
                },
            ];

            setUpcomingEvents(processedUpcoming);
        } catch (err) {
            console.error('Error fetching events:', err?.message || err);
            setEvents([]);
            setUpcomingEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEvent = async (eventData) => {
        try {
            if (eventData.id) {
                await updateEvent(eventData.id, eventData);
            } else {
                await createEvent(eventData);
            }
            // Refresh events after creating/updating
            await fetchEvents();
            setIsModalOpen(false); // Close modal here on success
        } catch (error) {
            console.error('Failed to save event:', error);
            alert('Failed to save event. Please try again.');
        }
    };

    const handleEventClick = (event) => {
        // Prevent editing past events
        const eventDate = new Date(event.day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (eventDate < today) {
            return; // Don't open modal for past events
        }

        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    // Filter events for current view
    const currentDayEvents = events.filter(e => {
        if (!e.date) return false;
        // e.date is a timestamp
        const eventDate = new Date(e.date);
        return (
            eventDate.getFullYear() === currentDate.getFullYear() &&
            eventDate.getMonth() === currentDate.getMonth() &&
            eventDate.getDate() === currentDate.getDate()
        );
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden flex flex-col">
            <div className="p-6 pb-4 shrink-0">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1 text-foreground cursor-default">Calendar</h1>
                        <p className="text-base text-muted">Manage test drives and appointments</p>
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 h-[42px]"
                    >
                        <Plus size={18} />
                        Schedule Event
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-[1fr_300px] gap-4 px-6 pb-6 flex-1 overflow-hidden">
                {/* Main Calendar */}
                <div className="bg-card rounded-xl p-6 flex flex-col h-full overflow-hidden">
                    <div className="relative flex items-center justify-center mb-6 shrink-0">


                        {/* Centered Navigation */}
                        <div className="flex items-center gap-6 bg-elevated/30 p-2 rounded-2xl border border-white/5 shadow-sm">
                            <button
                                onClick={prevDay}
                                className="p-2 rounded-xl hover:bg-elevated text-muted hover:text-foreground transition-all hover:scale-110 active:scale-95"
                            >
                                <ChevronLeft size={24} />
                            </button>

                            <h2 className="text-2xl font-bold text-foreground capitalize cursor-default min-w-[340px] text-center tracking-tight">
                                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h2>

                            <button
                                onClick={nextDay}
                                className="p-2 rounded-xl hover:bg-elevated text-muted hover:text-foreground transition-all hover:scale-110 active:scale-95"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>


                    <Events
                        events={currentDayEvents}
                        isToday={
                            currentDate.getDate() === new Date().getDate() &&
                            currentDate.getMonth() === new Date().getMonth() &&
                            currentDate.getFullYear() === new Date().getFullYear()
                        }
                        onEventClick={handleEventClick}
                    />
                </div>

                {/* Sidebar */}
                <div className="space-y-4 h-full overflow-y-auto pr-1">
                    {/* Stats with Toggle */}
                    <div className="bg-card rounded-xl p-5">
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setStatsView('today')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${statsView === 'today' ? 'bg-primary text-white' : 'bg-elevated text-muted hover:text-foreground'}`}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setStatsView('week')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${statsView === 'week' ? 'bg-primary text-white' : 'bg-elevated text-muted hover:text-foreground'}`}
                            >
                                This Week
                            </button>
                        </div>
                        <div className="space-y-3">
                            {(() => {
                                const dataKey = statsView === 'today' ? 'Today' : 'This Week';
                                const viewData = upcomingEvents.find(u => u.date === dataKey);
                                const typeCounts = viewData?.typeCounts || {};
                                const entries = Object.entries(typeCounts);

                                if (entries.length === 0) {
                                    return (
                                        <div className="text-center text-muted text-sm py-4">
                                            No events {statsView === 'today' ? 'today' : 'this week'}
                                        </div>
                                    );
                                }

                                return entries.map(([typeName, data]) => (
                                    <div key={typeName} className="flex justify-between items-center bg-elevated p-4 rounded-xl">
                                        <span
                                            className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border"
                                            style={{
                                                backgroundColor: `${data.color}26`,
                                                color: data.color,
                                                borderColor: `${data.color}4D`
                                            }}
                                        >
                                            {typeName}
                                        </span>
                                        <span className="text-xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                                            {data.count}
                                        </span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            <CreateEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onEventCreated={handleSaveEvent}
                initialData={selectedEvent || {}}
            />
        </div>
    );
};

export default Calendar;
