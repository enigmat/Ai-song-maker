import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { exploreSong } from '../services/geminiService';
import type { GenerateContentResponse } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ExplorerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);

export const SongExplorer: React.FC = () => {
    const [title, setTitle] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [status, setStatus] = useState<'idle' | 'searching' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<GenerateContentResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!title.trim() && !lyrics.trim()) {
            setError("Please enter a song title or some lyrics to start exploring.");
            return;
        }
        setStatus('searching');
        setError(null);
        setResult(null);
        try {
            const response = await exploreSong(title, lyrics);
            setResult(response);
            setStatus('success');
        } catch (err) {
            console.error('Song exploration failed:', err);
            setError('Failed to find information. The AI might be busy, or the song could not be identified. Please try again.');
            setStatus('error');
        }
    };
    
    const handleReset = () => {
        setTitle('');
        setLyrics('');
        setStatus('idle');
        setResult(null);
        setError(null);
    };

    const renderContent = () => {
        switch (status) {
            case 'searching':
                return (
                    <div className="text-center p-10">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-400 text-lg animate-pulse">Searching the archives...</p>
                    </div>
                );

            case 'success':
                if (!result) return <ErrorMessage message="An unexpected error occurred." />;
                const sources = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
                return (
                    <div className="animate-fade-in space-y-6">
                        <div className="prose prose-invert prose-sm max-w-none bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.text}</ReactMarkdown>
                        </div>
                        {sources.length > 0 && (
                             <div>
                                <h3 className="text-lg font-semibold text-gray-300 mb-2">Sources</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {sources.map((source, index) => (
                                        source.web && (
                                            <a
                                                key={index}
                                                href={source.web.uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block p-2 bg-gray-800/50 rounded-md border border-gray-700 hover:bg-gray-700/50 transition-colors truncate"
                                                title={source.web.title}
                                            >
                                                <span className="text-teal-400">{source.web.title || source.web.uri}</span>
                                            </a>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="text-center">
                             <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all duration-300">
                                Explore Another Song
                            </button>
                        </div>
                    </div>
                );
            
            case 'error':
            case 'idle':
            default:
                return (
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="song-title" className="block text-sm font-medium text-gray-400 mb-2">Song Title</label>
                            <input
                                id="song-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., 'Like a Rolling Stone'"
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="song-lyrics" className="block text-sm font-medium text-gray-400 mb-2">Lyrics Snippet (Optional)</label>
                            <textarea
                                id="song-lyrics"
                                value={lyrics}
                                onChange={(e) => setLyrics(e.target.value)}
                                rows={4}
                                placeholder="...how does it feel, to be on your own..."
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={!title.trim() && !lyrics.trim()}
                            className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                        >
                            <ExplorerIcon /> Explore Song
                        </button>
                    </div>
                );
        }
    };
    
    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Song Explorer
            </h2>
             <p className="text-center text-gray-400 mt-2 mb-6">
                Enter a song title or lyrics and get detailed information powered by Google Search.
            </p>
            {error && status !== 'success' && <ErrorMessage message={error} onRetry={status === 'error' ? handleSearch : undefined} />}
            {renderContent()}
        </div>
    );
};
