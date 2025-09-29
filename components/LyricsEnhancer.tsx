import React, { useState, useCallback, useEffect } from 'react';
import { enhanceLyrics } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

const EnhancerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(() => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => console.error("Failed to copy text: ", err));
    }, [textToCopy]);

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-sm font-semibold px-3 py-1 bg-gray-700 text-gray-300 rounded-md shadow-sm hover:bg-purple-600 hover:text-white transition-all duration-200"
            aria-label={isCopied ? "Lyrics copied" : "Copy enhanced lyrics"}
            title={isCopied ? "Copied!" : "Copy to clipboard"}
        >
            {isCopied ? (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Copied
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>
                    Copy
                </>
            )}
        </button>
    );
};

const LyricsColumn: React.FC<{ title: string; lyrics: string; isLoading?: boolean; children?: React.ReactNode }> = ({ title, lyrics, isLoading = false, children }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex-1 w-full flex flex-col">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-gray-300">{title}</h3>
            {children}
        </div>
        <div className="bg-gray-800/50 p-3 rounded-md min-h-[300px] max-h-[60vh] overflow-y-auto flex-grow">
             {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 pt-20">
                    <LoadingSpinner />
                    <p className="mt-4 animate-pulse">Enhancing lyrics...</p>
                </div>
            ) : (
                <pre className="whitespace-pre-wrap font-sans text-gray-300 text-left leading-relaxed text-sm sm:text-base">
                    {lyrics || <span className="text-gray-500">No lyrics yet...</span>}
                </pre>
            )}
        </div>
    </div>
);


export const LyricsEnhancer: React.FC = () => {
    const [originalLyrics, setOriginalLyrics] = useState('');
    const [enhancedLyrics, setEnhancedLyrics] = useState('');
    const [displayedEnhancedLyrics, setDisplayedEnhancedLyrics] = useState('');
    const [status, setStatus] = useState<'idle' | 'enhancing' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'success' && enhancedLyrics) {
            setDisplayedEnhancedLyrics(''); // Reset before typing
            let i = 0;
            const typingInterval = 10; // Speed of typing in milliseconds

            const typeCharacter = () => {
                if (i < enhancedLyrics.length) {
                    setDisplayedEnhancedLyrics(prev => prev + enhancedLyrics.charAt(i));
                    i++;
                    setTimeout(typeCharacter, typingInterval);
                }
            };
            
            const timeoutId = setTimeout(typeCharacter, typingInterval);
            
            return () => clearTimeout(timeoutId);
        }
    }, [enhancedLyrics, status]);

    const handleEnhance = async () => {
        if (!originalLyrics.trim()) {
            setError('Please enter some lyrics to enhance.');
            return;
        }
        setStatus('enhancing');
        setError(null);
        setEnhancedLyrics('');
        setDisplayedEnhancedLyrics('');
        try {
            const result = await enhanceLyrics(originalLyrics);
            setEnhancedLyrics(result);
            setStatus('success');
        } catch (err) {
            console.error('Lyrics enhancement failed:', err);
            setError('Failed to enhance lyrics. The AI model might be busy. Please try again.');
            setStatus('error');
        }
    };

    const handleReset = useCallback(() => {
        setOriginalLyrics('');
        setEnhancedLyrics('');
        setDisplayedEnhancedLyrics('');
        setStatus('idle');
        setError(null);
    }, []);

    if (status === 'enhancing' || status === 'success') {
        const isTypingFinished = enhancedLyrics.length > 0 && enhancedLyrics.length === displayedEnhancedLyrics.length;
        return (
            <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 animate-fade-in">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                    Lyrics Comparison
                </h2>
                <div className="mt-6 flex flex-col md:flex-row gap-4 items-center">
                    <LyricsColumn title="Original" lyrics={originalLyrics} />
                    <div className="hidden md:flex text-purple-500/80 transform rotate-90 md:rotate-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </div>
                    <LyricsColumn title="Enhanced" lyrics={displayedEnhancedLyrics} isLoading={status === 'enhancing'}>
                        {isTypingFinished && <CopyButton textToCopy={enhancedLyrics} />}
                    </LyricsColumn>
                </div>
                <div className="mt-8 text-center">
                    <button
                        onClick={handleReset}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all duration-300"
                    >
                        Enhance Another
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Lyrics Enhancer
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Paste your lyrics and let our AI songwriter elevate them.
            </p>

            {error && <ErrorMessage message={error} onRetry={status === 'error' ? handleEnhance : undefined} />}

            <div className="space-y-4">
                <div>
                    <label htmlFor="lyrics-input" className="block text-sm font-medium text-gray-400 mb-2">
                        Your Lyrics
                    </label>
                    <textarea
                        id="lyrics-input"
                        rows={12}
                        value={originalLyrics}
                        onChange={(e) => setOriginalLyrics(e.target.value)}
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y"
                        placeholder="Paste or write your lyrics here..."
                        disabled={status === 'enhancing'}
                    />
                </div>

                <button
                    onClick={handleEnhance}
                    disabled={status === 'enhancing' || !originalLyrics.trim()}
                    className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    <EnhancerIcon />
                    Enhance Lyrics
                </button>
            </div>
        </div>
    );
};
