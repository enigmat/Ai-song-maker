import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import { generateProfileFromArtistName, remixArtistStyleProfile } from '../services/geminiService';
import type { ArtistStyleProfile, StoredArtistProfile, RemixResult } from '../types';
import { genres, singerGenders, artistTypes, moods, tempos, melodies, harmonies, rhythms, instrumentations, atmospheres, vocalStyles, styleFieldDescriptions } from '../constants/music';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

const PROFILES_STORAGE_KEY = 'mustbmusic_artist_profiles';

// A generic SelectInput component for the form
const SelectInput: React.FC<{
    label: string;
    name: keyof ArtistStyleProfile;
    value: string;
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    options: readonly string[] | { value: string, label: string }[];
}> = ({ label, name, value, onChange, options }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-1 focus:ring-purple-500 transition-colors text-sm"
        >
            {options.map((item) => {
                const optionValue = typeof item === 'string' ? item : item.value;
                const optionLabel = typeof item === 'string' ? item : item.label;
                return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
            })}
        </select>
    </div>
);

// The main component
export const StyleCreator: React.FC = () => {
    type Mode = 'create' | 'remix' | 'edit';
    type Status = 'idle' | 'processing' | 'success' | 'error';

    const [mode, setMode] = useState<Mode>('create');
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Common state for the generated/edited profile
    const [profileData, setProfileData] = useState<ArtistStyleProfile | null>(null);
    const [profileName, setProfileName] = useState('');

    // State for 'create' mode
    const [artistName, setArtistName] = useState('');

    // State for 'remix' and 'edit' modes
    const [savedProfiles, setSavedProfiles] = useState<Record<string, StoredArtistProfile>>({});
    const [selectedProfileKey, setSelectedProfileKey] = useState('');
    const [targetGenre, setTargetGenre] = useState(genres[0]);
    const [remixPrompt, setRemixPrompt] = useState('');
    
    // New state to hold the full remix result, including the new creative prompt
    const [remixResult, setRemixResult] = useState<{ prompt: string; genre: string; newCreativePrompt: string } | null>(null);

    // State for 'remix' mode source style
    const [sourceStyle, setSourceStyle] = useState<ArtistStyleProfile>({
        genre: genres[0],
        singerGender: 'any',
        artistType: 'any',
        mood: moods[0],
        tempo: tempos[2], // Default to Medium
        melody: melodies[0],
        harmony: harmonies[0],
        rhythm: rhythms[0],
        instrumentation: instrumentations[0],
        atmosphere: atmospheres[0],
        vocalStyle: vocalStyles[0],
    });


    // Load saved profiles from localStorage
    const loadProfiles = useCallback(() => {
        try {
            const storedProfilesRaw = localStorage.getItem(PROFILES_STORAGE_KEY);
            if (storedProfilesRaw) {
                const loadedProfiles = JSON.parse(storedProfilesRaw);
                setSavedProfiles(loadedProfiles);
                const profileKeys = Object.keys(loadedProfiles);
                if (profileKeys.length > 0 && !selectedProfileKey) {
                    setSelectedProfileKey(profileKeys[0]);
                }
            }
        } catch (e) {
            console.error("Failed to load artist profiles:", e);
        }
    }, [selectedProfileKey]);

    useEffect(() => {
        loadProfiles();
    }, []);
    
    // Effect to handle loading profile for editing
    useEffect(() => {
        if (mode === 'edit') {
            if (selectedProfileKey && savedProfiles[selectedProfileKey]) {
                setProfileData(savedProfiles[selectedProfileKey].style);
                setProfileName(selectedProfileKey);
                setStatus('success'); // Show the form immediately
                setError(null);
            } else {
                 handleReset();
            }
        }
    }, [mode, selectedProfileKey, savedProfiles]);
    
    // Reset form when switching modes
    useEffect(() => {
        handleReset();
    }, [mode]);

    // Handlers
    const handleReset = () => {
        setStatus('idle');
        setError(null);
        setSuccessMessage(null);
        setProfileData(null);
        setProfileName('');
        setArtistName('');
        setRemixPrompt('');
        setRemixResult(null);
        // Don't reset selectedProfileKey or targetGenre for better UX
    };
    
    const handleGenerate = async () => {
        if (!artistName.trim()) return;
        setStatus('processing');
        setError(null);
        setProfileData(null);
        try {
            const data = await generateProfileFromArtistName(artistName);
            setProfileData(data);
            setProfileName(`${artistName} Style`);
            setStatus('success');
        } catch (err) {
            setError('Failed to generate style. The artist may be too obscure, or the API is busy.');
            setStatus('error');
        }
    };

    const handleRemix = async () => {
        setStatus('processing');
        setError(null);
        setProfileData(null);
        setRemixResult(null);
        const originalProfile = sourceStyle;
        try {
            const result = await remixArtistStyleProfile(originalProfile, targetGenre, remixPrompt);
            
            setProfileData(result.profile);
            setRemixResult({
                prompt: remixPrompt,
                genre: targetGenre,
                newCreativePrompt: result.newCreativePrompt,
            });
            
            let newName = `${result.profile.genre} Remix`; // Default name
             if (result.newCreativePrompt.trim()) {
                const words = result.newCreativePrompt.trim().split(' ');
                const snippet = words.slice(0, 4).join(' ');
                newName = words.length > 4 ? `${snippet}...` : snippet;
            }
            setProfileName(`${newName} (${targetGenre})`);

            setStatus('success');
        } catch (err) {
            setError('Failed to remix style. The AI model might be busy.');
            setStatus('error');
        }
    };
    
    const handleProfileDataChange = (e: ChangeEvent<HTMLSelectElement>) => {
        if (!profileData) return;
        const { name, value } = e.target;
        setProfileData({ ...profileData, [name]: value as any });
    };

    const handleSourceStyleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSourceStyle(prev => ({ ...prev, [name]: value as any }));
    };

    const handleSave = () => {
        if (!profileName.trim()) {
            setError('Please enter a name for your profile.');
            return;
        }
        if (!profileData) return;
        
        setError(null);
        try {
            const existingProfiles: Record<string, StoredArtistProfile> = savedProfiles;
            
            if (existingProfiles[profileName.trim()] && profileName.trim() !== selectedProfileKey) {
                if (!window.confirm(`A profile named "${profileName.trim()}" already exists. Overwrite it?`)) {
                    return;
                }
            }
            
            const newStoredProfile: StoredArtistProfile = {
                style: profileData,
                songs: existingProfiles[profileName.trim()]?.songs || []
            };

            const updatedProfiles = { ...existingProfiles, [profileName.trim()]: newStoredProfile };
            localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
            
            setSuccessMessage(`Profile "${profileName.trim()}" saved successfully!`);
            setTimeout(() => {
                loadProfiles(); // Reload profiles to reflect changes
                handleReset();
                if (mode === 'edit') {
                    // After saving an edit, select the saved profile key
                    setSelectedProfileKey(profileName.trim());
                }
            }, 2000);

        } catch (e) {
            setError("Could not save profile to local storage.");
        }
    };

    const renderModeSelector = () => (
        <div className="flex justify-center mb-6">
            <div className="flex items-center gap-1 rounded-lg bg-gray-900 p-1 border border-gray-700">
                <button onClick={() => setMode('create')} aria-pressed={mode === 'create'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'create' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Create from Artist</button>
                <button onClick={() => setMode('remix')} aria-pressed={mode === 'remix'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'remix' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Genre Remixer</button>
                <button onClick={() => setMode('edit')} aria-pressed={mode === 'edit'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'edit' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Edit Saved Style</button>
            </div>
        </div>
    );

    const renderStyleForm = (profileData: ArtistStyleProfile, handler: (e: ChangeEvent<HTMLSelectElement>) => void) => (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SelectInput label="Genre" name="genre" value={profileData.genre} onChange={handler} options={genres} />
            <SelectInput label="Singer" name="singerGender" value={profileData.singerGender} onChange={handler} options={singerGenders} />
            <SelectInput label="Artist Type" name="artistType" value={profileData.artistType} onChange={handler} options={artistTypes} />
            <SelectInput label="Mood" name="mood" value={profileData.mood} onChange={handler} options={moods} />
            <SelectInput label="Tempo" name="tempo" value={profileData.tempo} onChange={handler} options={tempos} />
            <SelectInput label="Vocal Style" name="vocalStyle" value={profileData.vocalStyle} onChange={handler} options={vocalStyles} />
            <SelectInput label="Melody" name="melody" value={profileData.melody} onChange={handler} options={melodies} />
            <SelectInput label="Harmony" name="harmony" value={profileData.harmony} onChange={handler} options={harmonies} />
            <SelectInput label="Rhythm" name="rhythm" value={profileData.rhythm} onChange={handler} options={rhythms} />
            <SelectInput label="Instrumentation" name="instrumentation" value={profileData.instrumentation} onChange={handler} options={instrumentations} />
            <SelectInput label="Atmosphere/FX" name="atmosphere" value={profileData.atmosphere} onChange={handler} options={atmospheres} />
        </div>
    );
    
    const renderFormContent = () => {
        if (status === 'processing') {
            return <div className="text-center p-10"><LoadingSpinner size="lg" /><p className="mt-4 text-gray-400 text-lg animate-pulse">Generating...</p></div>;
        }
        
        if (status === 'success' && profileData) {
            return (
                <div className="space-y-4 animate-fade-in">
                    {mode === 'remix' && remixResult && (
                        <div className="p-4 mb-4 bg-gray-900/50 rounded-lg border border-teal-500/50">
                            <h4 className="text-lg font-semibold text-teal-300">AI-Generated Remix Idea:</h4>
                            <p className="text-md text-gray-200 mt-2 p-3 bg-gray-800/50 rounded-md italic">
                                "{remixResult.newCreativePrompt}"
                            </p>
                        </div>
                    )}
                    <h3 className="text-xl font-semibold text-center text-gray-300">
                        {mode === 'create' && `Generated Style for "${artistName}"`}
                        {mode === 'remix' && 'Generated Style Profile'}
                        {mode === 'edit' && `Editing "${selectedProfileKey}"`}
                    </h3>
                    <div>
                        <label htmlFor="profile-name" className="block text-sm font-medium text-gray-400 mb-1">Save Profile As:</label>
                        <input type="text" id="profile-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-1 focus:ring-teal-500" />
                    </div>
                    {renderStyleForm(profileData, handleProfileDataChange)}
                    <div className="flex gap-4 pt-2">
                        <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700">Cancel</button>
                        <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600">Save Profile</button>
                    </div>
                </div>
            );
        }

        switch (mode) {
            case 'create':
                return (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="artist-name" className="block text-sm font-medium text-gray-400 mb-2">Artist Name</label>
                            <input type="text" id="artist-name" value={artistName} onChange={(e) => setArtistName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} placeholder="e.g., Daft Punk, Taylor Swift..." className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"/>
                        </div>
                        <button onClick={handleGenerate} disabled={!artistName.trim()} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">Generate Style</button>
                    </div>
                );
            case 'remix':
                 return (
                     <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-300 mb-3 border-b border-gray-700 pb-2">1. Define Source Style</h3>
                            {renderStyleForm(sourceStyle, handleSourceStyleChange)}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-300 mb-3 border-b border-gray-700 pb-2">2. Define Remix Target</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="genre-select" className="block text-sm font-medium text-gray-400 mb-2">Target Genre</label>
                                    <select id="genre-select" value={targetGenre} onChange={e => setTargetGenre(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                                        {genres.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label htmlFor="remix-prompt" className="block text-sm font-medium text-gray-400 mb-2">Remix Prompt (Optional)</label>
                                <textarea
                                    id="remix-prompt"
                                    value={remixPrompt}
                                    onChange={(e) => setRemixPrompt(e.target.value)}
                                    rows={3}
                                    placeholder="e.g., 'make it darker and more cinematic' or 'give it a 70s disco feel'"
                                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all resize-y"
                                />
                            </div>
                        </div>
                        <button onClick={handleRemix} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all transform hover:scale-105">Remix Style</button>
                    </div>
                );
            case 'edit':
                 return (
                     <div className="space-y-4">
                        <div>
                            <label htmlFor="edit-profile-select" className="block text-sm font-medium text-gray-400 mb-2">Select Profile to Edit</label>
                            <select id="edit-profile-select" value={selectedProfileKey} onChange={e => setSelectedProfileKey(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" disabled={Object.keys(savedProfiles).length === 0}>
                                {Object.keys(savedProfiles).length > 0 ? Object.keys(savedProfiles).map(name => <option key={name} value={name}>{name}</option>) : <option>No profiles saved</option>}
                            </select>
                        </div>
                        {!profileData && Object.keys(savedProfiles).length > 0 && <p className="text-center text-gray-500">Select a profile to begin editing.</p>}
                        {!profileData && Object.keys(savedProfiles).length === 0 && <p className="text-center text-gray-500">No profiles to edit. Create one first!</p>}
                    </div>
                 );
        }
    };
    
    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
             <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                AI Style Editor
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Create, remix, and edit musical style profiles.
            </p>
            {renderModeSelector()}
            <div className="mt-4">
                {error && <ErrorMessage message={error} />}
                {successMessage && <div className="my-4 p-3 bg-green-900/50 border border-green-500 text-green-300 rounded-lg text-center animate-fade-in">{successMessage}</div>}
                {renderFormContent()}
            </div>
        </div>
    );
};
