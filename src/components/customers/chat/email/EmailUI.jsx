import React from 'react';
import { Mail, Calendar } from 'lucide-react';
import EmailMessage from './EmailMessage';

const EmailUI = ({ emails }) => {
    return (
        <div className="flex flex-col h-full bg-card text-foreground">
            {/* Header - similar to ChatUI */}
            <div className="p-3 px-4 border-b border-gray-700 flex items-center gap-2 h-[60px] shrink-0">
                <Mail size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">Email History</h2>
            </div>

            {/* Email list */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {!emails || emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted">
                        <Mail size={48} className="opacity-20 mb-2" />
                        <p className="text-sm">No emails found</p>
                    </div>
                ) : (
                    emails.map(email => (
                        <EmailMessage key={email.id} email={email} />
                    ))
                )}
            </div>
        </div>
    );
};

export default EmailUI;
