import React, { useState } from 'react';
import { getLyricalSuggestions } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LyricalCoWriterModalProps {
    initialLyrics: string;
    onClose: () => void;
    onApplySuggestion: (newLyrics: string) => void;
}

export const LyricalCoWriterModal: React.FC<LyricalCoWriterModalProps> = ({ initialLyrics, onClose, onApplySuggestion }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setSuggestions(null);
        try {
            const result = await getLyricalSuggestions(initialLyrics, prompt);
            setSuggestions(result);
        } catch (err) {
            setError("Failed to get suggestions. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // This is a simple heuristic and might need refinement
    const handleApply = (suggestionMarkdown: string) => {
        // Attempt to extract code blocks, assuming they contain the full revised lyrics
        const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/g;
        const matches = [...suggestionMarkdown.matchAll(codeBlockRegex)];
        
        if (matches.length > 0) {
            // Use the content of the first code block found
            onApplySuggestion(matches[0][1].trim());
        } else {
            // Fallback for when no code block is found
            alert("Could not automatically apply the suggestion. Please copy and paste the desired changes manually.");
        }
    };


    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                        Lyrical Co-Writer
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                
                <main className="flex-grow p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Your Lyrics</h3>
                        <div className="bg-gray-900/50 p-3 rounded-md h-full overflow-y-auto border border-gray-700">
                             <pre className="whitespace-pre-wrap font-sans text-gray-400 text-sm">{initialLyrics || "No lyrics yet."}</pre>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Suggestions</h3>
                        <div className="bg-gray-900/50 p-3 rounded-md flex-grow overflow-y-auto border border-gray-700">
                             {isLoading && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                             {!isLoading && !suggestions && <p className="text-gray-500 text-sm text-center pt-10">Your suggestions will appear here.</p>}
                             {suggestions && (
                                <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{suggestions}</ReactMarkdown>
                                </div>
                             )}
                        </div>
                    </div>
                </main>

                <footer className="p-4 border-t border-gray-700 flex-shrink-0 space-y-3">
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div className="relative">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
                            placeholder="How can I help? e.g., 'Make the chorus more powerful'"
                            disabled={isLoading}
                            className="w-full p-3 pr-28 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim()}
                            className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-2 text-sm font-semibold px-3 py-1.5 bg-purple-600 rounded-md shadow-md hover:bg-purple-500 transition-all disabled:opacity-50"
                        >
                            {isLoading ? <LoadingSpinner size="sm" /> : '✨'}
                            Generate
                        </button>
                    </div>
                    {suggestions && (
                        <div className="text-center">
                            <button onClick={() => handleApply(suggestions)} className="text-sm font-semibold px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">
                                Apply First Suggestion
                            </button>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};