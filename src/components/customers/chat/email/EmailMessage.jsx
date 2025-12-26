import React from 'react';
import { Paperclip, Calendar, Mail } from 'lucide-react';

const EmailMessage = ({ email }) => {
    if (!email) return null;

    return (
        <div className="bg-card rounded-lg border border-border p-4 mb-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-semibold text-foreground text-sm">{email.subject || 'No Subject'}</h3>
                    <div className="flex items-center text-xs text-muted mt-1">
                        <Mail size={12} className="mr-1" />
                        {email.email || 'No email address'}
                    </div>
                </div>
                <div className="flex items-center text-xs text-muted">
                    <Calendar size={12} className="mr-1" />
                    {new Date(email.created_at).toLocaleString()}
                </div>
            </div>

            <div className="text-sm text-foreground/90 whitespace-pre-wrap mb-3 leading-relaxed bg-elevated p-3 rounded-lg">
                {email.message || 'No message content'}
            </div>

            {email.attachments && email.attachments.length > 0 && (
                <div className="border-t border-border pt-2 mt-2">
                    <p className="text-xs text-muted mb-1 font-medium">Attachments:</p>
                    <div className="flex flex-wrap gap-2">
                        {email.attachments.map((att, index) => (
                            <div key={index} className="flex items-center bg-elevated px-2 py-1 rounded text-xs text-primary">
                                <Paperclip size={12} className="mr-1" />
                                <span className="truncate max-w-[150px]">{att.name || `Attachment ${index + 1}`}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailMessage;
