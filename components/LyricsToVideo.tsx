import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { generateVideoFromLyrics } from '../services/geminiService';
import { CopyButton } from './CopyButton';

const VideoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm4 8v-2h2v2H6zm4 0v-2h2v2h-2zM4 6h12v2H4V6z" />
    </svg>
);


export const LyricsToVideo: React.FC = () => {
    const [status, setStatus] = useState<'prompt' | 'generating' | 'success' | 'error'>('prompt');
    const [lyrics, setLyrics] = useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState('');

    const handleGenerate = async () => {
        if (!lyrics.trim()) {
            setError("Please enter some lyrics to generate a prompt.");
            return;
        }
        
        setStatus('generating');
        setError(null);
        setGeneratedPrompt('');

        try {
            const prompt = await generateVideoFromLyrics(lyrics, (message) => {
                setProgressMessage(message);
            });
            setGeneratedPrompt(prompt);
            setStatus('success');
        } catch (err: any) {
            console.error("Prompt generation failed:", err);
            const errorMessage = err.message || "An unknown error occurred during prompt generation.";
            setError(errorMessage);
            setStatus('error');
        }
    };
    
    const handleReset = () => {
        setStatus('prompt');
        setError(null);
        setGeneratedPrompt('');
        // Don't reset lyrics, user might want to try again
    };

    const renderContent = () => {
        if (status === 'generating') {
            return (
                <div className="text-center p-10 bg-gray-900/50 rounded-lg border border-gray-700">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">{progressMessage}</p>
                </div>
            );
        }

        if (status === 'success' && generatedPrompt) {
            return (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-bold text-center text-gray-200">Your Video Prompt is Ready!</h3>
                    <div className="relative max-w-2xl mx-auto">
                        <textarea 
                            readOnly 
                            value={generatedPrompt} 
                            rows={8} 
                            className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg shadow-lg text-gray-300 font-mono text-sm resize-y" 
                        />
                        <CopyButton textToCopy={generatedPrompt} className="absolute top-3 right-3" />
                    </div>
                    <div className="text-center">
                        <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white">
                            Create Another Prompt
                        </button>
                    </div>
                </div>
            );
        }
        
        return (
             <div className="space-y-4 max-w-2xl mx-auto">
                <div>
                    <label htmlFor="lyrics-input" className="block text-sm font-medium text-gray-400 mb-2">Your Lyrics</label>
                    <textarea 
                        id="lyrics-input" 
                        rows={10} 
                        value={lyrics} 
                        onChange={(e) => setLyrics(e.target.value)} 
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all resize-y" 
                        placeholder="Paste or write the lyrics for your video..."
                    />
                </div>
                <button 
                    onClick={handleGenerate} 
                    disabled={!lyrics.trim()}
                    className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50"
                >
                    <VideoIcon />
                    Generate Video Prompt
                </button>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Lyrics to Video Prompt
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Turn your song's story into a detailed, cinematic prompt for a video AI.
            </p>
            {error && <ErrorMessage message={error} onRetry={handleGenerate} />}
            {renderContent()}
        </div>
    );
};