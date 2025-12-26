import { useState } from 'react';
import ChatUI from '../customers/chat/ChatUI';

const Vision = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'Vision',
            text: 'Hello! I am Vision, your advanced AI assistant. How can I help you analyze your dealership performance today?',
            time: '09:00 AM',
            isMe: false,
            sender_type: 'ai' // To distinguish for avatar
        }
    ]);

    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (message.trim()) {
            const newMessage = {
                id: Date.now(),
                sender: 'You',
                text: message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: true
            };
            setMessages(prev => [...prev, newMessage]);
            const currentMessage = message;
            setMessage('');

            // Simulate AI response
            setTimeout(() => {
                const aiResponse = {
                    id: Date.now() + 1,
                    sender: 'Vision',
                    text: `I am processing your request: "${currentMessage}". My advanced vision capabilities are analyzing the data...`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: false,
                    sender_type: 'ai'
                };
                setMessages(prev => [...prev, aiResponse]);
            }, 1000);
        }
    };

    const chatData = {
        id: 'vision-ai',
        name: 'Vision',
        description: 'Advanced AI Assistant for Dealership Management',
        type: 'ai',
        status: 'online',
        agent: null, // Allow sending messages in Teams section
        avatar: 'sparkles'
    };

    return (
        <ChatUI
            selectedChatData={chatData}
            messages={messages}
            message={message}
            setMessage={setMessage}
            handleSendMessage={handleSendMessage}
            customHeaderClass="h-[74px] px-6"
            headerSize="large"
        />
    );
};

export default Vision;
