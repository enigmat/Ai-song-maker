import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { genres } from '../constants/music';
import { generateYouTubeAssets, generateImage } from '../services/geminiService';
import type { YouTubeAssets, ChannelProfile } from '../types';
import { CopyButton } from './CopyButton';

const PROFILES_STORAGE_KEY = 'mustbmusic_yt_profiles';

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

const ProfileManagerModal: React.FC<{
    profiles: Record<string, ChannelProfile>;
    onClose: () => void;
    onSave: (key: string, profile: ChannelProfile, originalKey: string | null) => void;
    onDelete: (key: string) => void;
}> = ({ profiles, onClose, onSave, onDelete }) => {
    const [editingProfile, setEditingProfile] = useState<ChannelProfile | null>(null);
    const [originalKey, setOriginalKey] = useState<string | null>(null);

    const handleEdit = (key: string) => {
        setOriginalKey(key);
        setEditingProfile({ ...profiles[key] });
    };

    const handleCreateNew = () => {
        setOriginalKey(null);
        setEditingProfile({ name: '' });
    };

    const handleCancelEdit = () => {
        setEditingProfile(null);
        setOriginalKey(null);
    };

    const handleSave = () => {
        if (!editingProfile || !editingProfile.name.trim()) {
            alert("Profile name cannot be empty.");
            return;
        }

        const newKey = editingProfile.name.trim().replace(/\s+/g, '-').toLowerCase();
        onSave(newKey, editingProfile, originalKey);
        handleCancelEdit();
    };
    
    const fields: (keyof Omit<ChannelProfile, 'name'>)[] = [ 'website', 'instagram', 'twitter', 'tiktok', 'facebook', 'patreon', 'contactEmail' ];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-200">Channel Profile Manager</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>

                <main className="flex-grow p-6 overflow-y-auto">
                    {editingProfile ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Profile Name*</label>
                                <input value={editingProfile.name} onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg"/>
                            </div>
                            {fields.map(field => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-gray-400 mb-2 capitalize">{field.replace('Email', ' Email').replace('URL', ' URL')}</label>
                                    <input value={editingProfile[field] || ''} onChange={e => setEditingProfile({ ...editingProfile, [field]: e.target.value })} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg" placeholder={`https://...`}/>
                                </div>
                            ))}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Other Info</label>
                                <textarea value={editingProfile.otherInfo || ''} onChange={e => setEditingProfile({ ...editingProfile, otherInfo: e.target.value })} rows={3} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg resize-y" placeholder="Any other text or links to include."/>
                            </div>
                            <div className="flex gap-4 justify-end">
                                <button onClick={handleCancelEdit} className="px-4 py-2 text-gray-300 font-semibold rounded-lg border-2 border-gray-600 hover:bg-gray-700">Cancel</button>
                                <button onClick={handleSave} className="px-5 py-2 text-white font-semibold rounded-lg bg-purple-600 hover:bg-purple-500">Save Profile</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={handleCreateNew} className="w-full p-3 text-center bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold">
                                + Create New Profile
                            </button>
                            {Object.keys(profiles).length > 0 ? Object.keys(profiles).map(key => (
                                <div key={key} className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                    <p className="font-semibold text-gray-200">{profiles[key].name}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(key)} className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md">Edit</button>
                                        <button onClick={() => { if(window.confirm('Are you sure?')) onDelete(key) }} className="px-3 py-1 text-sm bg-red-800/80 hover:bg-red-700/80 rounded-md">Delete</button>
                                    </div>
                                </div>
                            )) : <p className="text-center text-gray-500 mt-4">No profiles saved yet.</p>}
                        </div>
                    )}
                </main>
            </div>
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

    const [profiles, setProfiles] = useState<Record<string, ChannelProfile>>({});
    const [selectedProfileKey, setSelectedProfileKey] = useState<string>('none');
    const [isProfileManagerOpen, setIsProfileManagerOpen] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
            if (raw) setProfiles(JSON.parse(raw));
        } catch (e) {
            console.error("Failed to load YT profiles", e);
        }
    }, []);

    const saveProfiles = (newProfiles: Record<string, ChannelProfile>) => {
        try {
            localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(newProfiles));
            setProfiles(newProfiles);
        } catch (e) {
            console.error("Failed to save YT profiles", e);
            setError("Could not save profiles to local storage.");
        }
    };
    
    const handleSaveProfile = (key: string, profile: ChannelProfile, originalKey: string | null) => {
        let newProfiles = { ...profiles };
        if (originalKey && originalKey !== key) {
            const { [originalKey]: _, ...rest } = newProfiles;
            newProfiles = rest;
        }
        newProfiles[key] = profile;
        saveProfiles(newProfiles);
    };

    const handleDeleteProfile = (key: string) => {
        const { [key]: _, ...rest } = profiles;
        saveProfiles(rest);
        if (selectedProfileKey === key) {
            setSelectedProfileKey('none');
        }
    };

    const handleGenerate = async () => {
        if (!songTitle.trim() || !artistName.trim()) {
            setError("Please provide at least a Song Title and Artist Name.");
            return;
        }
        setStatus('generating');
        setError(null);
        setResult(null);

        let channelProfileText = '';
        if (selectedProfileKey !== 'none' && profiles[selectedProfileKey]) {
            const profile = profiles[selectedProfileKey];
            channelProfileText = Object.entries(profile)
                .filter(([key, value]) => key !== 'name' && value && String(value).trim())
                .map(([key, value]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(' ', '').replace(/^./, str => str.toUpperCase());
                    return `${label}: ${value}`;
                })
                .join('\n');
        }

        try {
            const assets = await generateYouTubeAssets(songTitle, artistName, genre, vibe, channelProfileText);
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
        setSelectedProfileKey('none');
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
            <div>
                <label htmlFor="yt-channel-profile" className="block text-sm font-medium text-gray-400 mb-2">Channel Profile (Optional)</label>
                <div className="flex gap-2">
                    <select
                        id="yt-channel-profile"
                        value={selectedProfileKey}
                        onChange={(e) => setSelectedProfileKey(e.target.value)}
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                        disabled={status === 'generating'}
                    >
                        <option value="none">None</option>
                        {Object.keys(profiles).sort((a,b) => profiles[a].name.localeCompare(profiles[b].name)).map(key => (
                            <option key={key} value={key}>{profiles[key].name}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => setIsProfileManagerOpen(true)}
                        className="px-4 py-2 font-semibold bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Manage
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Select a profile to automatically append your links and info to the description.</p>
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
             <style>{`.animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; } @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }`}</style>
            {isProfileManagerOpen && (
                <ProfileManagerModal
                    profiles={profiles}
                    onClose={() => setIsProfileManagerOpen(false)}
                    onSave={handleSaveProfile}
                    onDelete={handleDeleteProfile}
                />
            )}
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