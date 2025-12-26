import { TrendingUp, Users, Bot, Target, DollarSign, Clock } from 'lucide-react';

const Metrics = () => {
    const performanceData = [
        { metric: 'AI Response Time', value: '1.2s', change: '-15%', trend: 'up' },
        { metric: 'Human Response Time', value: '4.5m', change: '-8%', trend: 'up' },
        { metric: 'AI Conversion Rate', value: '28.5%', change: '+5.2%', trend: 'up' },
        { metric: 'Human Conversion Rate', value: '42.3%', change: '+2.1%', trend: 'up' },
    ];

    const agentStats = [
        { name: 'AI Agent Alpha', conversations: 523, conversions: 149, rate: '28.5%', status: 'active' },
        { name: 'AI Agent Beta', conversations: 487, conversions: 132, rate: '27.1%', status: 'active' },
        { name: 'Sarah Martinez', conversations: 89, conversions: 38, rate: '42.7%', status: 'active' },
        { name: 'John Davis', conversations: 76, conversions: 32, rate: '42.1%', status: 'active' },
    ];

    return (
        <div>
            <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1 text-foreground">Metrics & Analytics</h1>
                        <p className="text-base text-muted">Track AI and human agent performance</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select className="bg-card border border-transparent hover:border-border-color text-foreground rounded-lg px-4 py-2 outline-none focus:border-primary cursor-pointer h-[42px] transition-all duration-200">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                            <option>Last 90 days</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="px-6 pb-6 space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card rounded-xl border border-transparent p-6 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: 'var(--gradient-primary)' }}>
                            <Bot size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground mb-4">AI Performance</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <span className="block text-sm text-muted mb-1">Conversations</span>
                                    <span className="text-xl font-bold text-foreground">1,843</span>
                                </div>
                                <div>
                                    <span className="block text-sm text-muted mb-1">Avg. Response</span>
                                    <span className="text-xl font-bold text-foreground">1.2s</span>
                                </div>
                                <div>
                                    <span className="block text-sm text-muted mb-1">Conversion</span>
                                    <span className="text-xl font-bold text-foreground">28.5%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border border-transparent p-6 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: 'var(--gradient-secondary)' }}>
                            <Users size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground mb-4">Human Performance</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <span className="block text-sm text-muted mb-1">Conversations</span>
                                    <span className="text-xl font-bold text-foreground">165</span>
                                </div>
                                <div>
                                    <span className="block text-sm text-muted mb-1">Avg. Response</span>
                                    <span className="text-xl font-bold text-foreground">4.5m</span>
                                </div>
                                <div>
                                    <span className="block text-sm text-muted mb-1">Conversion</span>
                                    <span className="text-xl font-bold text-foreground">42.3%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {performanceData.map((item, index) => (
                        <div key={index} className="bg-glass backdrop-blur-xl border border-transparent p-4 rounded-xl hover:shadow-lg transition-all duration-200">
                            <h4 className="text-sm text-muted mb-2">{item.metric}</h4>
                            <div className="flex items-end justify-between">
                                <div className="text-2xl font-bold text-foreground">{item.value}</div>
                                <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">{item.change}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Agent Leaderboard */}
                <div className="bg-card rounded-xl border border-transparent overflow-hidden">
                    <div className="p-6 border-b border-border-color">
                        <h2 className="text-xl font-bold text-foreground">Agent Leaderboard</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-elevated/50 text-left">
                                    <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Agent</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Conversations</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Conversions</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Rate</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color">
                                {agentStats.map((agent, index) => (
                                    <tr key={index} className="hover:bg-elevated/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                                                    {agent.name.includes('AI') ? <Bot size={14} /> : agent.name[0]}
                                                </div>
                                                <span className="text-sm font-medium text-foreground">{agent.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{agent.conversations}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{agent.conversions}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{agent.rate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success">
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Metrics;
