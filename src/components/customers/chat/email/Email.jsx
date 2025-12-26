import { Mail, X, Send } from 'lucide-react';

const Email = ({ clientName, email, onClose }) => {
    return (
        <div className="absolute top-16 right-4 z-50 w-80 bg-card border border-gray-700 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Mail size={16} className="text-primary" />
                    Send Email
                </h3>
                <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="flex flex-col gap-3">
                <div className="bg-elevated p-2 px-3 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-muted">To:</span>
                    <span className="text-sm font-medium text-foreground">{email || <span className="text-muted italic">No email available</span>}</span>
                </div>

                <input
                    type="text"
                    id="email-subject"
                    name="email-subject"
                    placeholder="Subject"
                    className="bg-elevated border border-transparent focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none transition-all"
                />

                <textarea
                    id="email-body"
                    name="email-body"
                    placeholder="Write your email..."
                    rows={4}
                    className="bg-elevated border border-transparent focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none transition-all resize-none"
                ></textarea>

                <button className="bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                    <Send size={14} />
                    Send Email
                </button>
            </div>
        </div>
    );
};

export default Email;
