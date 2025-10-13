import React, { useState, useEffect, useRef } from 'react';
import { getStudioAssistantResponse } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

const UserIcon = () => (
    <div className="w-8 h-8 rounded-full bg-pink-500 flex-shrink-0"></div>
);
const AssistantIcon = () => (
    <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0"></div>
);

const examplePrompts = [
    "Explain the circle of fifths.",
    "What's the difference between compression and limiting?",
    "Give me some ideas for a song about space exploration.",
    "How can I make my basslines more interesting?",
];

export const StudioAssistant: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', parts: [{ text: "Hello! I'm Maestro, your AI studio assistant. How can I help you with your music today?" }] }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (prompt?: string) => {
        const messageToSend = prompt || userInput;
        if (!messageToSend.trim()) return;

        const oldMessages = messages;
        const newMessages: ChatMessage[] = [
            ...oldMessages,
            { role: 'user', parts: [{ text: messageToSend }] }
        ];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const responseText = await getStudioAssistantResponse(oldMessages, messageToSend);
            setMessages(prev => [
                ...prev,
                { role: 'model', parts: [{ text: responseText }] }
            ]);
        } catch (error) {
            console.error("Failed to get response from AI:", error);
            setMessages(prev => [
                ...prev,
                { role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }] }
            ]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 flex flex-col h-[75vh]">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text mb-4">
                Studio Assistant
            </h2>
            <div className="flex-grow overflow-y-auto pr-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <AssistantIcon />}
                        <div className={`max-w-lg p-3 rounded-xl ${msg.role === 'user' ? 'bg-pink-500/80 text-white' : 'bg-gray-700/60 text-gray-200'}`}>
                           <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
                               <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.parts[0].text}</ReactMarkdown>
                           </div>
                        </div>
                        {msg.role === 'user' && <UserIcon />}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <AssistantIcon />
                        <div className="max-w-lg p-3 rounded-xl bg-gray-700/60 text-gray-200">
                           <LoadingSpinner size="sm" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
             {messages.length <= 1 && (
                <div className="my-4">
                    <p className="text-center text-gray-400 text-sm mb-2">Or try one of these prompts:</p>
                    <div className="grid grid-cols-2 gap-2 text-center text-sm">
                        {examplePrompts.map(prompt => (
                            <button key={prompt} onClick={() => handleSend(prompt)} className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="mt-4 flex-shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder="Ask me anything about music..."
                        disabled={isLoading}
                        className="w-full p-4 pr-16 bg-gray-900 border border-gray-600 rounded-full focus:ring-2 focus:ring-purple-500 transition-colors"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !userInput.trim()}
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-3 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       <SendIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};