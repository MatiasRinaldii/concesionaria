import { Phone as PhoneIcon, X } from 'lucide-react';

const Phone = ({ clientName, phoneNumber, onClose }) => {
    return (
        <div className="absolute top-16 right-4 z-50 w-72 bg-card border border-gray-700 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <PhoneIcon size={16} className="text-primary" />
                    Call Client
                </h3>
                <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="bg-elevated p-3 rounded-lg text-center">
                    <p className="text-xs text-muted mb-1">Mobile Number</p>
                    <p className="text-lg font-bold text-foreground tracking-wide">{phoneNumber || <span className="text-sm font-normal text-muted italic">No phone number available</span>}</p>
                </div>

                <div className="flex gap-2">
                    <button className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
                        Call Now
                    </button>
                    <button className="flex-1 bg-elevated text-foreground py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700">
                        Copy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Phone;
