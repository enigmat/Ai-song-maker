import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { genres } from '../constants/music';
import { generateRolloutPlan } from '../services/geminiService';
import type { RolloutPlan } from '../types';
import { CopyButton } from './CopyButton';

const PlannerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
);

export const RolloutPlanGenerator: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<RolloutPlan | null>(null);

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
            const plan = await generateRolloutPlan(songTitle, artistName, genre, vibe);
            setResult(plan);
            setStatus('success');
        } catch (err) {
            setError("Failed to generate the rollout plan. The AI model might be busy. Please try again.");
            setStatus('error');
        }
    };

    const handleReset = () => {
        setStatus('idle');
        setError(null);
        setResult(null);
    };

    const renderForm = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="rp-song-title" className="block text-sm font-medium text-gray-400 mb-2">Song Title</label>
                    <input id="rp-song-title" type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Neon Dreams'" />
                </div>
                <div>
                    <label htmlFor="rp-artist-name" className="block text-sm font-medium text-gray-400 mb-2">Artist Name</label>
                    <input id="rp-artist-name" type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Starlight Velocity'" />
                </div>
            </div>
            <div>
                <label htmlFor="rp-genre" className="block text-sm font-medium text-gray-400 mb-2">Genre</label>
                <select id="rp-genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="rp-vibe" className="block text-sm font-medium text-gray-400 mb-2">Song Vibe / Description (Optional)</label>
                <textarea id="rp-vibe" rows={2} value={vibe} onChange={(e) => setVibe(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'An upbeat, retro-futuristic synthwave track.'" />
            </div>
            <button onClick={handleGenerate} disabled={status === 'generating'} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">
                {status === 'generating' ? <><LoadingSpinner /> Generating...</> : <><PlannerIcon /> Generate Rollout Plan</>}
            </button>
        </div>
    );

    const renderSuccess = () => result && (
        <div className="space-y-8 animate-fade-in">
            {/* Timeline Section */}
            <div>
                <h3 className="text-2xl font-bold text-gray-200 mb-4 border-b-2 border-purple-500/50 pb-2">Release Timeline</h3>
                <div className="relative pl-4 border-l-2 border-gray-700 space-y-8">
                    {result.rollout.map((timeframe, index) => (
                        <div key={index} className="relative">
                            <div className="absolute -left-6 -top-1 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                {result.rollout.length - index}
                            </div>
                            <h4 className="text-xl font-semibold text-purple-400 mb-3 ml-6">{timeframe.timeframe}</h4>
                            <div className="space-y-3 ml-6">
                                {timeframe.tasks.map((task, taskIndex) => (
                                    <div key={taskIndex} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                                        <p className="font-semibold text-gray-200">{task.task}</p>
                                        <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Social Media Section */}
            <div>
                <h3 className="text-2xl font-bold text-gray-200 mb-4 border-b-2 border-teal-500/50 pb-2">Social Media Content Ideas</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {result.socialMediaContent.map((platform, index) => (
                        <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                            <h4 className="text-lg font-semibold text-teal-400 mb-3">{platform.platform}</h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                                {platform.ideas.map((idea, ideaIndex) => <li key={ideaIndex}>{idea}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Email Section */}
            <div>
                <h3 className="text-2xl font-bold text-gray-200 mb-4 border-b-2 border-pink-500/50 pb-2">Email Newsletter Snippets</h3>
                <div className="space-y-4">
                    {result.emailSnippets.map((email, index) => (
                        <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                            <div className="relative">
                                <p className="text-sm font-bold text-pink-400">Subject: <span className="font-normal text-gray-200">{email.subject}</span></p>
                                <CopyButton textToCopy={`Subject: ${email.subject}\n\n${email.body}`} className="absolute -top-2 -right-2" />
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-700/50 whitespace-pre-wrap font-sans text-sm text-gray-300">
                                {email.body}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center pt-4">
                <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white">Start Over</button>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Music Rollout Planner
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Generate a comprehensive rollout plan for your next music release.
            </p>

            {error && <ErrorMessage message={error} onRetry={handleGenerate} />}

            {status === 'idle' || status === 'error' ? renderForm() :
             status === 'generating' ? <div className="text-center p-10"><LoadingSpinner size="lg" /><p className="mt-4 text-gray-400 text-lg animate-pulse">Generating your rollout plan...</p></div> :
             renderSuccess()}
        </div>
    );
};