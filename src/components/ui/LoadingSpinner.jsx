/**
 * Standardized loading spinner component
 * Used throughout the app for consistent loading states
 */
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({
    size = 32,
    className = 'text-primary',
    fullScreen = false
}) => {
    if (fullScreen) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 size={size} className={`animate-spin ${className}`} />
            </div>
        );
    }

    return <Loader2 size={size} className={`animate-spin ${className}`} />;
};

export default LoadingSpinner;
