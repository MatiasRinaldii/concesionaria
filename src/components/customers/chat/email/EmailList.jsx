import React, { useState, useEffect } from 'react';
import { Mail, Search, Loader2 } from 'lucide-react';
import { getEmailMessages } from '../../../../lib/api/emailMessages';

const EmailList = ({ selectedEmail, setSelectedEmail }) => {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                setLoading(true);
                const data = await getEmailMessages();
                setEmails(data);
            } catch (error) {
                console.error('Error fetching emails:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, []);

    const filteredEmails = emails.filter(email =>
        email.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-card rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-3 px-4 border-b border-gray-700 flex items-center gap-2 h-[60px] shrink-0">
                <Mail size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">Emails</h2>
                <span className="ml-auto text-xs text-muted bg-elevated px-2 py-1 rounded-full">
                    {emails.length}
                </span>
            </div>

            {/* Search */}
            <div className="p-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Search emails..."
                        className="w-full bg-elevated border border-transparent focus:border-primary rounded-lg pl-9 pr-3 py-2 text-sm text-foreground outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                ) : filteredEmails.length === 0 ? (
                    <div className="text-center text-muted text-sm py-8">No emails found</div>
                ) : (
                    filteredEmails.map(email => (
                        <div
                            key={email.id}
                            onClick={() => setSelectedEmail(email)}
                            className={`p-3 rounded-lg cursor-pointer transition-all mb-1 ${selectedEmail?.id === email.id
                                    ? 'bg-primary/20 border border-primary/30'
                                    : 'hover:bg-elevated border border-transparent'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                    {email.email || 'No email'}
                                </span>
                                <span className="text-[10px] text-muted">
                                    {new Date(email.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs text-muted truncate">{email.subject || 'No subject'}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EmailList;
