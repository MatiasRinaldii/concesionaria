import { FileText, Download } from 'lucide-react';
import { isImageUrl, getFileName, downloadFile } from '../../../lib/utils/fileUtils';

/**
 * Component to display message attachments (images and documents)
 */
const MessageAttachments = ({ files, onImageClick }) => {
    if (!files || files.length === 0) return null;

    const imageFiles = files.filter(isImageUrl);
    const docFiles = files.filter(f => !isImageUrl(f));

    const handleDownload = (e, fileUrl) => {
        e.stopPropagation();
        downloadFile(fileUrl);
    };

    return (
        <div className="flex flex-col gap-2 mb-2">
            {/* Images Section */}
            {imageFiles.length > 0 && (
                <div className={`${imageFiles.length > 1 ? 'grid grid-cols-2 gap-1' : 'block'}`}>
                    {imageFiles.slice(0, 2).map((img, index) => (
                        <div
                            key={index}
                            className={`rounded-lg overflow-hidden cursor-pointer relative ${imageFiles.length === 1 ? 'w-full' : 'aspect-square w-full'}`}
                            onClick={() => onImageClick?.(img)}
                        >
                            <div className="w-full h-full">
                                <img
                                    src={img}
                                    alt={`Attachment ${index + 1}`}
                                    className={`w-full h-full object-cover ${imageFiles.length === 1 ? 'max-h-[300px]' : ''}`}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                                {/* Overlay on the 2nd image if there are more */}
                                {index === 1 && imageFiles.length > 2 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-white text-2xl font-bold">
                                            +{imageFiles.length - 1}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Documents Section */}
            {docFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {docFiles.map((fileUrl, index) => {
                        const fileName = getFileName(fileUrl);
                        const extension = fileName.split('.').pop() || 'FILE';
                        return (
                            <div
                                key={index}
                                className="p-2 bg-black/10 rounded-lg flex items-center gap-3 w-full max-w-[240px] pr-3"
                            >
                                <div className="p-2 bg-white/20 rounded-md">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate opacity-90">{fileName}</p>
                                    <p className="text-[10px] opacity-60 uppercase">{extension}</p>
                                </div>
                                <button
                                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white shrink-0 cursor-pointer"
                                    title="Download"
                                    aria-label={`Download ${fileName}`}
                                    onClick={(e) => handleDownload(e, fileUrl)}
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MessageAttachments;
