import React, { useState, ChangeEvent } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { CopyButton } from './CopyButton';
import { generateArtistPersona, generateImage } from '../services/geminiService';
import type { ArtistPersona, ArtistStyleProfile, StoredArtistProfile, SingerGender, ArtistType } from '../types';
import { genres, singerGenders, artistTypes } from '../constants/music';

const PROFILES_STORAGE_KEY = 'mustbmusic_artist_profiles';

type Status = 'prompt' | 'generating' | 'success' | 'error';

interface ResultData {
    persona: ArtistPersona;
    artistImageUrl: string;
}

const StyleProfileDisplay: React.FC<{ profile: ArtistStyleProfile }> = ({ profile }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <h4 className="text-lg font-bold text-gray-200 mb-3 text-center">Musical Style</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {Object.entries(profile).map(([key, value]) => (
                <div key={key} className="bg-gray-800/50 p-2 rounded-md">
                    <p className="text-xs text-purple-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="font-semibold text-gray-300">{value}</p>
                </div>
            ))}
        </div>
    </div>
);


export const ArtistGenerator: React.FC = () => {
    const [status, setStatus] = useState<Status>('prompt');
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<ResultData | null>(null);
    const [generationMessage, setGenerationMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // New state for additional inputs
    const [genre, setGenre] = useState(genres[0]);
    const [singerGender, setSingerGender] = useState<SingerGender>('any');
    const [artistType, setArtistType] = useState<ArtistType>('any');
    const [artistName, setArtistName] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please enter an idea for your artist.");
            return;
        }
        setStatus('generating');
        setError(null);
        setResult(null);

        try {
            setGenerationMessage("Crafting artist persona...");
            const persona = await generateArtistPersona(prompt, genre, singerGender, artistType, artistName);

            setGenerationMessage("Generating artist portrait...");
            const artistImageUrl = await generateImage(persona.artistImagePrompt);
            
            setResult({ persona, artistImageUrl });
            setStatus('success');

        } catch (err: any) {
            console.error("Artist generation failed:", err);
            setError(err.message || "Failed to generate artist. The AI model may be busy. Please try again.");
            setStatus('error');
        } finally {
            setGenerationMessage('');
        }
    };
    
    const handleSave = () => {
        if (!result) return;

        setIsSaving(true);
        setError(null);
        setSaveSuccess(false);

        try {
            const rawData = localStorage.getItem(PROFILES_STORAGE_KEY);
            const existingProfiles: Record<string, StoredArtistProfile> = rawData ? JSON.parse(rawData) : {};
            
            const profileName = result.persona.artistName;

            if (existingProfiles[profileName]) {
                if (!window.confirm(`An artist named "${profileName}" already exists. Do you want to overwrite it?`)) {
                    setIsSaving(false);
                    return;
                }
            }
            
            const newStoredProfile: StoredArtistProfile = {
                style: result.persona.styleProfile,
                songs: existingProfiles[profileName]?.songs || []
            };

            const updatedProfiles = { ...existingProfiles, [profileName]: newStoredProfile };
            localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
            
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);

        } catch (e) {
            setError("Could not save artist profile. Local storage might be full.");
        } finally {
            setIsSaving(false);
        }
    };


    const handleReset = () => {
        setStatus('prompt');
        setError(null);
        setResult(null);
        setPrompt('');
        setArtistName('');
    };

    const renderSuccess = () => result && (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-6 items-center">
                <img src={result.artistImageUrl} alt={`Portrait of ${result.persona.artistName}`} className="w-40 h-40 md:w-48 md:h-48 rounded-full shadow-lg object-cover border-4 border-purple-500/50 flex-shrink-0" />
                <div className="text-center md:text-left">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text relative pr-10">
                        {result.persona.artistName}
                        <CopyButton textToCopy={result.persona.artistName} className="absolute top-1/2 right-0 -translate-y-1/2" />
                    </h3>
                    <div className="relative mt-2 pr-10">
                        <p className="text-gray-300 whitespace-pre-wrap">{result.persona.artistBio}</p>
                        <CopyButton textToCopy={result.persona.artistBio} className="absolute top-0 right-0" />
                    </div>
                </div>
            </div>

            <StyleProfileDisplay profile={result.persona.styleProfile} />

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h4 className="text-lg font-bold text-gray-200 mb-3 text-center">Signature Song Concepts</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-center">
                    {result.persona.signatureSongConcepts.map((concept, index) => (
                        <li key={index} className="bg-gray-800/50 p-2 rounded-md text-sm text-gray-300 italic">"{concept}"</li>
                    ))}
                </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50"
                >
                    {isSaving ? <LoadingSpinner /> : 'Save Artist Profile'}
                </button>
                 <button onClick={handleReset} className="w-full sm:w-auto flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white">
                    Create Another
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (status) {
            case 'generating':
                return (
                    <div className="text-center p-10">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-400 text-lg animate-pulse">{generationMessage}</p>
                    </div>
                );
            case 'success':
                return renderSuccess();
            case 'prompt':
            case 'error':
            default:
                return (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <div>
                            <label htmlFor="artist-prompt" className="block text-sm font-medium text-gray-400 mb-2">Describe Your Artist*</label>
                            <textarea
                                id="artist-prompt"
                                rows={4}
                                value={prompt}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all resize-y"
                                placeholder="e.g., 'A mysterious solo synthwave artist from the future, trapped in the 80s.'"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                                <label htmlFor="genre" className="block text-sm font-medium text-gray-400 mb-2">Genre*</label>
                                <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="singerGender" className="block text-sm font-medium text-gray-400 mb-2">Singer*</label>
                                <select id="singerGender" value={singerGender} onChange={(e) => setSingerGender(e.target.value as SingerGender)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    {singerGenders.map(sg => <option key={sg.value} value={sg.value}>{sg.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="artistType" className="block text-sm font-medium text-gray-400 mb-2">Artist Type*</label>
                                <select id="artistType" value={artistType} onChange={(e) => setArtistType(e.target.value as ArtistType)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    {artistTypes.map(at => <option key={at.value} value={at.value}>{at.label}</option>)}
                                </select>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="artist-name" className="block text-sm font-medium text-gray-400 mb-2">Artist Name (Optional)</label>
                            <input
                                id="artist-name"
                                type="text"
                                value={artistName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setArtistName(e.target.value)}
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="Leave blank for AI to generate a name"
                            />
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={status === 'generating' || !prompt.trim()}
                            className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50"
                        >
                            Generate Artist
                        </button>
                    </div>
                );
        }
    };
    
    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Artist Persona Generator
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Create a complete, fully-realized artist persona from a single idea.
            </p>
            {error && <ErrorMessage message={error} />}
            {saveSuccess && (
                <div className="my-4 p-3 bg-green-900/50 border border-green-500 text-green-300 rounded-lg text-center animate-fade-in">
                    Artist profile saved successfully!
                </div>
            )}
            {renderContent()}
        </div>
    );
};