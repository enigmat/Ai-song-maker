import React, { useState, ChangeEvent } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { CopyButton } from './CopyButton';
import { generateArtistPersona, generateImage } from '../services/geminiService';
import type { ArtistPersona, ArtistStyleProfile, StoredArtistProfile } from '../types';

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
            const persona = await generateArtistPersona(prompt);

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
    };

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
                if (!result) return null;
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-6 items-center">
                            <img src={result.artistImageUrl} alt={`Portrait of ${result.persona.artistName}`} className="w-40 h-40 md:w-48 md:h-48 rounded-full shadow-lg object-cover border-4 border-purple-500/50 flex-shrink-0" />
                            <div className="text-center md:text-left">
                                <h3 className