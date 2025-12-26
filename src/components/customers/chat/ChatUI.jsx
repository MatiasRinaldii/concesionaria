import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Phone as PhoneIcon, Mail, Paperclip, Send, Bot, MessageSquare, Loader2, Info, Search, X, FileText, Globe, Instagram, Facebook, ChevronLeft, ChevronRight } from 'lucide-react';
import Phone from './phone/Phone';
import Email from './email/Email';
import TeamInfoModal from '../../team/TeamInfoModal';
import MessageAttachments from './MessageAttachments';

import { useAuth } from '../../../contexts/AuthContext';
import { isImageUrl } from '../../../lib/utils/fileUtils';

// Memoized platform icons - prevents recreating SVG elements on each render
const PLATFORM_ICONS = {
    whatsapp: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" className="text-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
    ),
    instagram: <Instagram size={12} className="text-white" />,
    facebook: <Facebook size={12} fill="white" className="text-white" />,
    web: <Globe size={12} className="text-white" />
};

const getPlatformIcon = (platform) => {
    return PLATFORM_ICONS[platform] || PLATFORM_ICONS.web;
};

const ChatUI = ({ selectedChatData, messages, message, setMessage, handleSendMessage, loading, customHeaderClass, headerSize = 'standard', onTeamDeleted }) => {
    const [activeOverlay, setActiveOverlay] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [filePreviewUrls, setFilePreviewUrls] = useState([]); // Managed Object URLs
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const previewRef = useRef(null);

    const { user } = useAuth();
    const senderName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

    // Header size computed styles
    const headerStyles = useMemo(() => ({
        avatar: headerSize === 'large' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm',
        title: headerSize === 'large' ? 'text-lg' : 'text-base',
        subtitle: headerSize === 'large' ? 'text-sm' : 'text-xs',
        icon: headerSize === 'large' ? 24 : 20,
        iconSmall: headerSize === 'large' ? 22 : 18,
        botIcon: headerSize === 'large' ? 28 : 24
    }), [headerSize]);

    // Manage Object URLs for file previews - cleanup on unmount or file change
    useEffect(() => {
        // Create URLs for new files
        const urls = selectedFiles.map(file => URL.createObjectURL(file));
        setFilePreviewUrls(urls);

        // Cleanup function
        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [selectedFiles]);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = useCallback((index) => {
        setSelectedFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index);
            if (newFiles.length === 0 && fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return newFiles;
        });
    }, []);

    const toggleOverlay = useCallback((overlay) => {
        setActiveOverlay(prev => prev === overlay ? null : overlay);
    }, []);

    // Auto-scroll to bottom when messages change (instant, no animation)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }, [messages]);

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'inherit';
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 120;
            textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
            textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
        }
    }, []);

    const handleTextareaChange = useCallback((e) => {
        setMessage(e.target.value);
        adjustTextareaHeight();
    }, [setMessage, adjustTextareaHeight]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        handleSendMessage(e, selectedFiles);
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [handleSendMessage, selectedFiles]);

    // Memoized grouped messages
    const groupedMessages = useMemo(() => {
        return messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];
            return {
                ...msg,
                showAvatar: !nextMsg || nextMsg.sender !== msg.sender,
                isFirst: !prevMsg || prevMsg.sender !== msg.sender,
                isLast: !nextMsg || nextMsg.sender !== msg.sender,
            };
        });
    }, [messages]);

    // Memoize all images for gallery navigation
    const allImages = useMemo(() => {
        return messages.flatMap(msg => {
            const files = msg.files || (msg.file ? [msg.file] : []);
            return files.filter(isImageUrl);
        });
    }, [messages]);

    const currentIndex = previewImage ? allImages.findIndex(img => img === previewImage) : -1;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < allImages.length - 1;

    const handlePrev = useCallback((e) => {
        e?.stopPropagation();
        if (hasPrev) setPreviewImage(allImages[currentIndex - 1]);
    }, [hasPrev, allImages, currentIndex]);

    const handleNext = useCallback((e) => {
        e?.stopPropagation();
        if (hasNext) setPreviewImage(allImages[currentIndex + 1]);
    }, [hasNext, allImages, currentIndex]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowLeft' && hasPrev) handlePrev(e);
        if (e.key === 'ArrowRight' && hasNext) handleNext(e);
        if (e.key === 'Escape') setPreviewImage(null);
    }, [hasPrev, hasNext, handlePrev, handleNext]);

    // Focus management for preview modal
    useEffect(() => {
        if (previewImage && previewRef.current) {
            previewRef.current.focus();
        }
    }, [previewImage]);

    return (
        <div className="flex flex-col h-full relative">
            {/* Overlays */}
            {activeOverlay === 'phone' && (
                <Phone
                    clientName={selectedChatData.name}
                    phoneNumber={selectedChatData.clientData?.phone}
                    onClose={() => setActiveOverlay(null)}
                />
            )}
            {activeOverlay === 'email' && (
                <Email
                    clientName={selectedChatData.name}
                    email={selectedChatData.clientData?.email}
                    onClose={() => setActiveOverlay(null)}
                />
            )}

            <div className={`flex justify-between items-center shrink-0 border-b border-gray-700 ${customHeaderClass || 'px-4 py-3 h-[60px]'}`}>
                <div className="flex items-center gap-2">
                    {selectedChatData.type === 'group' ? (
                        <>
                            <div className={`${headerStyles.avatar} rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold overflow-hidden shrink-0`}>
                                👥
                            </div>
                            <div>
                                <h3 className={`${headerStyles.title} font-bold text-foreground transition-all`}>{selectedChatData.name}</h3>
                                <p className={`${headerStyles.subtitle} text-muted transition-all`}>
                                    {selectedChatData.members?.length || 0} members
                                    {selectedChatData.description && ` • ${selectedChatData.description}`}
                                </p>
                            </div>
                        </>
                    ) : selectedChatData.type === 'ai' ? (
                        <>
                            <div className={`${headerStyles.avatar} rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold overflow-hidden shadow-lg shadow-purple-500/20 shrink-0`}>
                                <Bot size={headerStyles.botIcon} />
                            </div>
                            <div>
                                <h3 className={`${headerStyles.title} font-bold text-foreground`}>{selectedChatData.name}</h3>
                                <p className={`${headerStyles.subtitle} text-purple-400 font-medium`}>AI Agent</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <MessageSquare size={20} className="text-primary" />
                            <h2 className="text-lg font-bold text-foreground">
                                Chat History
                            </h2>
                        </>
                    )}
                </div>
                <div className="flex gap-1">
                    {showSearch ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <input
                                    type="text"
                                    id="search-messages"
                                    name="search-messages"
                                    autoFocus
                                    placeholder="Search messages..."
                                    className="bg-elevated border-none rounded-full pl-9 pr-4 py-1.5 text-sm w-80 focus:ring-1 focus:ring-primary outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setShowSearch(false);
                                            setSearchQuery('');
                                        }
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setShowSearch(false);
                                    setSearchQuery('');
                                }}
                                className="p-1.5 hover:bg-elevated rounded-full transition-colors text-muted hover:text-foreground"
                                aria-label="Close search"
                            >
                                <X size={headerStyles.iconSmall} />
                            </button>
                        </div>
                    ) : (
                        <>
                            {selectedChatData.type === 'group' ? (
                                <button
                                    className="p-2.5 rounded-lg hover:bg-elevated text-muted hover:text-foreground transition-colors"
                                    onClick={() => setShowInfoModal(true)}
                                    title="Team Info"
                                    aria-label="View team information"
                                >
                                    <Info size={26} />
                                </button>
                            ) : selectedChatData.type === 'ai' ? null : (
                                <>
                                    <button
                                        className={`p-2 rounded-md hover:bg-elevated transition-colors ${activeOverlay === 'phone' ? 'bg-elevated text-primary' : 'text-muted hover:text-foreground'}`}
                                        onClick={() => toggleOverlay('phone')}
                                        aria-label="Open phone dialer"
                                    >
                                        <PhoneIcon size={headerStyles.iconSmall} />
                                    </button>
                                    <button
                                        className={`p-2 rounded-md hover:bg-elevated transition-colors ${activeOverlay === 'email' ? 'bg-elevated text-primary' : 'text-muted hover:text-foreground'}`}
                                        onClick={() => toggleOverlay('email')}
                                        aria-label="Open email composer"
                                    >
                                        <Mail size={headerStyles.iconSmall} />
                                    </button>
                                    <button
                                        onClick={() => setShowSearch(true)}
                                        className="p-2 rounded-md hover:bg-elevated text-muted hover:text-foreground transition-colors"
                                        title="Search messages"
                                        aria-label="Search messages"
                                    >
                                        <Search size={headerStyles.iconSmall} />
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 bg-background/30 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/30 z-10">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : null}
                {groupedMessages.map((msg) => {
                    const isMe = msg.isMe !== undefined ? msg.isMe : (msg.sender === 'agent' || msg.sender === 'me');
                    const isSearchActive = showSearch && searchQuery.trim().length > 0;
                    const isMatch = isSearchActive
                        ? msg.text?.toLowerCase().includes(searchQuery.toLowerCase())
                        : true;
                    const opacityClass = isSearchActive && !isMatch ? 'opacity-30' : 'opacity-100';

                    // Normalize files array
                    const msgFiles = msg.files?.length > 0 ? msg.files : (msg.file ? [msg.file] : []);

                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${msg.isFirst ? 'mt-2' : 'mt-0.5'} transition-opacity duration-300 ${opacityClass}`}
                        >
                            <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {/* Sender name above message */}
                                {selectedChatData?.type === 'group' ? (
                                    !isMe && msg.senderName && (
                                        <span className="text-[10px] text-muted ml-1 mb-0.5 block">{msg.senderName}</span>
                                    )
                                ) : (
                                    isMe && msg.senderName && (
                                        <span className="text-[10px] text-muted mr-1 mb-0.5 block">{msg.senderName}</span>
                                    )
                                )}
                                <div className={`p-2.5 px-3 rounded-lg text-[0.9375rem] leading-relaxed shadow-sm ${isMe
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-elevated text-foreground rounded-tl-none'
                                    }`}>
                                    <MessageAttachments
                                        files={msgFiles}
                                        onImageClick={setPreviewImage}
                                    />
                                    <div className="relative">
                                        <p className="break-words whitespace-pre-wrap m-0 hyphens-auto">
                                            {msg.text}
                                            <span className="inline-block w-[60px]"></span>
                                        </p>
                                        <span className={`absolute bottom-0 right-0 text-[0.65rem] ${isMe ? 'text-white/70' : 'text-muted'} whitespace-nowrap pl-2`}>
                                            {msg.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* File Preview */}
            {selectedFiles.length > 0 && (
                <div className="px-4 pt-2 -mb-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 overflow-x-auto chat-scrollbar pb-2">
                    {selectedFiles.map((file, index) => {
                        const isImage = file.type.startsWith('image/');
                        return (
                            <div key={index} className="relative group shrink-0">
                                <div className="bg-elevated rounded-lg flex items-center justify-center overflow-hidden border border-white/5 shadow-sm" style={{ width: 60, height: 60 }}>
                                    {isImage && filePreviewUrls[index] ? (
                                        <img
                                            src={filePreviewUrls[index]}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <FileText size={24} className="text-primary opacity-80" />
                                    )}
                                </div>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="absolute -top-1.5 -right-1.5 bg-background border border-white/10 rounded-full p-0.5 text-muted hover:text-red-400 hover:bg-elevated transition-colors shadow-sm z-10"
                                    aria-label={`Remove ${file.name}`}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <form className="p-4 bg-card flex items-end gap-2 border-t border-gray-700" onSubmit={handleSubmit}>
                <input
                    type="file"
                    id="file-upload"
                    name="file-upload"
                    ref={fileInputRef}
                    style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <label
                    htmlFor="file-upload"
                    className={`p-2 rounded-lg transition-colors mb-1 ${selectedChatData?.agent === 'AI' ? 'text-muted/50 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:bg-elevated text-muted hover:text-foreground'}`}
                    title="Attach file"
                    aria-label="Attach file"
                >
                    <Paperclip size={20} />
                </label>
                <textarea
                    id="chat-message"
                    name="chat-message"
                    ref={textareaRef}
                    placeholder={selectedChatData.agent === 'AI' ? "AI Agent is active. Deactivate to send messages." : "Type your message..."}
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (message.trim() || selectedFiles.length > 0) {
                                handleSubmit(e);
                            }
                        }
                    }}
                    rows={1}
                    className="flex-1 bg-elevated border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/10 rounded-lg px-4 py-2.5 outline-none transition-all duration-200 text-foreground placeholder:text-muted resize-none min-h-[42px] chat-scrollbar disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedChatData.agent === 'AI'}
                />
                <button
                    type="submit"
                    className={`p-2.5 rounded-lg bg-primary text-white shadow-lg transition-all duration-200 mb-1 ${(!message.trim() && selectedFiles.length === 0) || selectedChatData.agent === 'AI' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-hover shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5'}`}
                    disabled={(!message.trim() && selectedFiles.length === 0) || selectedChatData.agent === 'AI'}
                    aria-label="Send message"
                >
                    <Send size={18} />
                </button>
            </form>
            <TeamInfoModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
                teamData={selectedChatData}
                onTeamDeleted={onTeamDeleted}
            />

            {/* Full Screen Image Preview */}
            {previewImage && (
                <div
                    ref={previewRef}
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200 outline-none"
                    onClick={() => setPreviewImage(null)}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image preview"
                >
                    <button
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-[110]"
                        onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(null);
                        }}
                        aria-label="Close preview"
                    >
                        <X size={32} />
                    </button>

                    {/* Navigation Buttons */}
                    {hasPrev && (
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-[110]"
                            onClick={handlePrev}
                            aria-label="Previous image"
                        >
                            <ChevronLeft size={40} />
                        </button>
                    )}

                    {hasNext && (
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-[110]"
                            onClick={handleNext}
                            aria-label="Next image"
                        >
                            <ChevronRight size={40} />
                        </button>
                    )}

                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />

                    <div className="absolute top-4 left-4 flex gap-2 z-[110]">
                        <a
                            href={previewImage}
                            download="image"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all text-sm font-medium border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Download image"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download
                        </a>
                    </div>
                    {allImages.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium border border-white/10 pointer-events-none">
                            {currentIndex + 1} / {allImages.length}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatUI;
