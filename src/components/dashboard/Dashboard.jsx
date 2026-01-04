import { useState, useMemo } from 'react';
import { Search, Filter, Plus, Loader2 } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import ClientCard from './ClientCard';
import StatCard from '../ui/StatCard';

// Status configuration - memoized outside component
const STATUS_MAP = {
    'initial': { label: 'Initial Contact', class: 'status-initial' },
    'qualified': { label: 'Qualified', class: 'status-qualified' },
    'test-drive': { label: 'Test Drive', class: 'status-test-drive' },
    'negotiation': { label: 'Negotiation', class: 'status-negotiation' },
    'financing': { label: 'Financing', class: 'status-financing' },
};

const getStatusInfo = (status) => STATUS_MAP[status] || { label: status, class: 'status-initial' };

const Dashboard = () => {
    const { clients, loading, error } = useClients();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Memoize filtered clients
    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            // Search filter
            const matchesSearch = searchQuery.trim() === '' ||
                client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.phone?.includes(searchQuery) ||
                client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.auto_interes?.toLowerCase().includes(searchQuery.toLowerCase());

            // Status filter
            const matchesStatus = statusFilter === 'all' || client.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [clients, searchQuery, statusFilter]);

    // Memoize stats calculation
    const stats = useMemo(() => {
        const totalClients = clients.length;
        const activeDeals = clients.filter(c => c.progress > 50).length;
        const avgDealValue = '$56,250'; // Mock - would calculate from real data

        return [
            { label: 'Total Clients', value: totalClients, change: '+12%' },
            { label: 'Active Deals', value: activeDeals, change: '+8%' },
            { label: 'Avg. Deal Value', value: avgDealValue, change: '+15%' },
        ];
    }, [clients]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 size={48} className="text-primary animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
                    Error loading clients: {error}
                    <p className="text-sm mt-2">Make sure the database is configured correctly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full animate-fade-in">
            <div className="p-6 pb-4">
                <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1 text-foreground">Dashboard</h1>
                        <p className="text-base text-muted">Overview of your client pipeline</p>
                    </div>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4">
                    {stats.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                </div>

                <div className="flex justify-between items-center gap-4 mb-4">
                    <div className="flex-1 flex items-center gap-2 bg-elevated px-4 py-2 rounded-lg border border-transparent focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 h-[42px]">
                        <Search size={18} className="text-muted" />
                        <input
                            type="text"
                            id="dashboard-search"
                            name="dashboard-search"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none p-0 w-full outline-none h-full text-foreground placeholder:text-muted"
                            aria-label="Search contacts"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-card text-foreground hover:bg-elevated hover:border-primary h-[42px]"
                            aria-label="Filter clients"
                        >
                            <Filter size={18} />
                            Filter
                        </button>
                        <select
                            id="status-filter"
                            name="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-card text-foreground rounded-lg px-4 py-2 outline-none focus:border-primary cursor-pointer h-[42px]"
                            aria-label="Filter by status"
                        >
                            <option value="all">All Status</option>
                            <option value="initial">Initial</option>
                            <option value="qualified">Qualified</option>
                            <option value="test-drive">Test Drive</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="financing">Financing</option>
                        </select>
                    </div>
                </div>

                {filteredClients.length === 0 ? (
                    <div className="text-center py-10 text-muted">
                        {clients.length === 0
                            ? 'No clients found. Add your first client to get started.'
                            : 'No clients match your search criteria.'
                        }
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 pb-4 overflow-y-auto pr-1">
                        {filteredClients.map((client) => (
                            <ClientCard
                                key={client.id}
                                client={client}
                                getStatusInfo={getStatusInfo}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
