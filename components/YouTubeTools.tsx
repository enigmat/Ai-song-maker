import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { genres } from '../constants/music';
import { generateYouTubeAssets, generateImage } from '../services/geminiService';
import type { YouTubeAssets } from '../services/geminiService';
import { CopyButton } from './CopyButton';

const ThumbnailGenerator: React.FC<{ prompt: string }> = ({ prompt }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const url = await generateImage(prompt);
            setImageUrl(url);
        } catch (err) {
            setError("Image generation failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex flex-col h-full">
            <p className="text-sm text-gray-400 italic font-mono flex-grow">"{prompt}"</p>
            <div className="mt-3 aspect-video bg-gray-900/50 rounded-md flex items-center justify-center">
                {isLoading ? <LoadingSpinner /> : imageUrl ? <img src={imageUrl} alt="Generated thumbnail" className="w-full h-full object-cover rounded-md" /> : <div className="text-gray-600 text-xs">Preview</div>}
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            <button onClick={handleGenerate} disabled={isLoading} className="mt-3 w-full text-xs font-semibold px-3 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors disabled:opacity-50">
                {isLoading ? 'Generating...' : imageUrl ? 'Regenerate' : 'Generate Image'}
            </button>
        </div>
    );
};


export const YouTubeTools: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<YouTubeAssets | null>(null);

    const [songTitle, setSongTitle] = useState('');
    const [artistName, setArtistName] = useState('');
    const [genre, setGenre] = useState(genres[0]);
    const [vibe, setVibe] = useState('');

    const handleGenerate = async () => {
        if (!songTitle.trim() || !artistName.trim()) {
            setError("Please provide at least a Song Title and Artist Name.");
            return;
        }
        setStatus('generating');
        setError(null);
        setResult(null);
        try {
            const assets = await generateYouTubeAssets(songTitle, artistName, genre, vibe);
            setResult(assets);
            setStatus('success');
        } catch (err) {
            setError("Failed to generate YouTube assets. The AI model might be busy. Please try again.");
            setStatus('error');
        }
    };

    const handleReset = () => {
        setStatus('idle');
        setError(null);
        setResult(null);
    };
    
    const copyAllTags = () => {
        if (result?.tags) {
            navigator.clipboard.writeText(result.tags.join(', '));
        }
    };

    const renderForm = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="yt-song-title" className="block text-sm font-medium text-gray-400 mb-2">Song Title</label>
                    <input id="yt-song-title" type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Midnight Drive'" />
                </div>
                <div>
                    <label htmlFor="yt-artist-name" className="block text-sm font-medium text-gray-400 mb-2">Artist Name</label>
                    <input id="yt-artist-name" type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'The Nightrunners'" />
                </div>
            </div>
            <div>
                <label htmlFor="yt-genre" className="block text-sm font-medium text-gray-400 mb-2">Genre</label>
                <select id="yt-genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="yt-vibe" className="block text-sm font-medium text-gray-400 mb-2">Song Vibe / Description (Optional)</label>
                <textarea id="yt-vibe" rows={2} value={vibe} onChange={(e) => setVibe(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'A nostalgic synthwave track about driving through a neon city at night.'" />
            </div>
            <button onClick={handleGenerate} disabled={status === 'generating'} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">
                {status === 'generating' ? <><LoadingSpinner /> Generating...</> : 'Generate YouTube Assets'}
            </button>
        </div>
    );
    
    const renderSuccess = () => result && (
        <div className="space-y-6 animate-fade-in">
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Generated Video Title</label>
                <div className="relative">
                    <input type="text" readOnly value={result.title} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-300 pr-12" />
                    <CopyButton textToCopy={result.title} className="absolute top-1/2 right-2 -translate-y-1/2" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Generated Video Description</label>
                <div className="relative">
                    <textarea readOnly rows={8} value={result.description} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-300 resize-y pr-12" />
                    <CopyButton textToCopy={result.description} className="absolute top-2 right-2" />
                </div>
            </div>
             <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-400">Generated Tags</label>
                    <button onClick={copyAllTags} className="text-xs font-semibold px-3 py-1 bg-gray-700 text-gray-300 rounded-full hover:bg-purple-600 hover:text-white transition-colors">Copy All</button>
                </div>
                <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg flex flex-wrap gap-2">
                    {result.tags.map(tag => <span key={tag} className="px-2 py-1 bg-teal-500/20 text-teal-300 text-xs font-semibold rounded-md">{tag}</span>)}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Thumbnail Ideas</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.thumbnailPrompts.map((prompt, i) => <ThumbnailGenerator key={i} prompt={prompt} />)}
                </div>
            </div>
            <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white">Start Over</button>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                YouTube Optimizer
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Generate catchy titles, descriptions, tags, and thumbnail ideas for your music video.
            </p>

            {error && <ErrorMessage message={error} onRetry={status === 'error' ? handleGenerate : undefined} />}

            {status === 'success' ? renderSuccess() : renderForm()}
        </div>
    );
};
