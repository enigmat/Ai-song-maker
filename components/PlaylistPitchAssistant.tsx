import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { CopyButton } from './CopyButton';
import { genres, moods } from '../constants/music';
import { generatePlaylistPitch } from '../services/geminiService';

const PitchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

export const PlaylistPitchAssistant: React.FC = () => {
    const [status, setStatus] = useState<'prompt' | 'generating' | 'success' | 'error'>('prompt');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);

    const [songTitle, setSongTitle] = useState('');
    const [artistName, setArtistName] = useState('');
    const [genre, setGenre] = useState(genres[0]);
    const [vibe, setVibe] = useState(moods[0]);
    const [sellingPoints, setSellingPoints] = useState('');

    const handleGenerate = async () => {
        if (!songTitle.trim() || !artistName.trim()) {
            setError("Please provide at least a Song Title and Artist Name.");
            return;
        }
        setStatus('generating');
        setError(null);
        setResult(null);
        try {
            const pitch = await generatePlaylistPitch(songTitle, artistName, genre, vibe, sellingPoints);
            setResult(pitch);
            setStatus('success');
        } catch (err) {
            setError("Failed to generate pitch. The AI model might be busy. Please try again.");
            setStatus('error');
        }
    };

    const handleReset = () => {
        setStatus('prompt');
        setError(null);
        setResult(null);
    };

    const renderForm = () => (
        <div className="space-y-4 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="pitch-song-title" className="block text-sm font-medium text-gray-400 mb-2">Song Title*</label>
                    <input id="pitch-song-title" type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Midnight Drive'" />
                </div>
                <div>
                    <label htmlFor="pitch-artist-name" className="block text-sm font-medium text-gray-400 mb-2">Artist Name*</label>
                    <input id="pitch-artist-name" type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'The Nightrunners'" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="pitch-genre" className="block text-sm font-medium text-gray-400 mb-2">Genre</label>
                    <select id="pitch-genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                        {genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="pitch-vibe" className="block text-sm font-medium text-gray-400 mb-2">Vibe/Mood</label>
                    <select id="pitch-vibe" value={vibe} onChange={(e) => setVibe(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                        {moods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="pitch-selling-points" className="block text-sm font-medium text-gray-400 mb-2">Key Selling Points / Hooks (Optional)</label>
                <textarea id="pitch-selling-points" rows={3} value={sellingPoints} onChange={(e) => setSellingPoints(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Featured in a popular indie film', 'Similar sound to Tame Impala', 'Viral TikTok sound'" />
            </div>
            <button onClick={handleGenerate} disabled={status === 'generating'} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">
                {status === 'generating' ? <><LoadingSpinner /> Generating...</> : <><PitchIcon /> Generate Pitch</>}
            </button>
        </div>
    );

    const renderSuccess = () => result && (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 relative">
                 <CopyButton textToCopy={result} className="absolute top-4 right-4" />
                 <pre className="whitespace-pre-wrap font-sans text-gray-300 text-left leading-relaxed text-sm sm:text-base">
                    {result}
                </pre>
            </div>
             <div className="text-center">
                <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white">
                    Create Another Pitch
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Playlist Pitch Assistant
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Craft the perfect email to get your song on the right playlists.
            </p>

            {error && <ErrorMessage message={error} onRetry={handleGenerate} />}

            {status === 'generating' ? (
                 <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">Writing your pitch...</p>
                 </div>
            ) : status === 'success' ? renderSuccess() : renderForm()}
        </div>
    );
};