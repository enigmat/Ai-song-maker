import React, { useState, ChangeEvent } from 'react';
import { generateProfileFromArtistName, ArtistStyleProfile, StoredArtistProfile, SingerGender, ArtistType } from '../services/geminiService';
import { genres, singerGenders, artistTypes, moods, tempos, melodies, harmonies, rhythms, instrumentations, atmospheres, vocalStyles } from '../constants/music';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

const PROFILES_STORAGE_KEY = 'mustbmusic_artist_profiles';

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


export const StyleCreator: React.FC = () => {
    const [artistName, setArtistName] = useState('');
    const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
    const [profileData, setProfileData] = useState<ArtistStyleProfile | null>(null);
    const [profileName, setProfileName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!artistName.trim()) {
            setError('Please enter an artist name.');
            return;
        }
        setStatus('generating');
        setError(null);
        setSuccessMessage(null);
        try {
            const data = await generateProfileFromArtistName(artistName);
            setProfileData(data);
            setProfileName(`${artistName} Style`);
            setStatus('success');
        } catch (err) {
            console.error(err);
            setError('Failed to generate style. The artist may be too obscure, or the API is busy. Please try again.');
            setStatus('error');
        }
    };
    
    const handleProfileDataChange = (e: ChangeEvent<HTMLSelectElement>) => {
        if (!profileData) return;
        const { name, value } = e.target;
        setProfileData({ ...profileData, [name]: value as any });
    };

    const handleSave = () => {
        if (!profileName.trim()) {
            setError('Please enter a name for your profile.');
            return;
        }
        if (!profileData) {
            setError('No profile data to save.');
            return;
        }
        setError(null);
        try {
            const rawData = localStorage.getItem(PROFILES_STORAGE_KEY);
            const existingProfiles: Record<string, StoredArtistProfile> = rawData ? JSON.parse(rawData) : {};
            
            if (existingProfiles[profileName.trim()]) {
                if (!window.confirm(`A profile named "${profileName.trim()}" already exists. Do you want to overwrite it?`)) {
                    return;
                }
            }
            
            const newStoredProfile: StoredArtistProfile = {
                style: profileData,
                songs: existingProfiles[profileName.trim()]?.songs || [] // Preserve songs if overwriting
            };

            const updatedProfiles = { ...existingProfiles, [profileName.trim()]: newStoredProfile };
            localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
            
            setSuccessMessage(`Profile "${profileName.trim()}" saved successfully! It's now available in the Song Generator.`);
            setTimeout(() => {
                handleReset();
            }, 3000);
            
        } catch (e) {
            console.error("Failed to save profile:", e);
            setError("Could not save profile to local storage.");
        }
    };
    
    const handleReset = () => {
        setArtistName('');
        setStatus('idle');
        setProfileData(null);
        setProfileName('');
        setError(null);
        setSuccessMessage(null);
    };
    
    const renderContent = () => {
        if (status === 'generating') {
            return (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">Analyzing artist's style...</p>
                </div>
            );
        }

        if (status === 'success' && profileData) {
            return (
                <div className="space-y-4 animate-fade-in">
                    <h3 className="text-xl font-semibold text-center text-teal-300">Generated Style for "{artistName}"</h3>
                    <div className="space-y-4">
                        <div>
                             <label htmlFor="profile-name" className="block text-sm font-medium text-gray-400 mb-1">Save Profile As:</label>
                             <input type="text" id="profile-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-1 focus:ring-teal-500" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <SelectInput label="Genre" name="genre" value={profileData.genre} onChange={handleProfileDataChange} options={genres} />
                            <SelectInput label="Singer" name="singerGender" value={profileData.singerGender} onChange={handleProfileDataChange} options={singerGenders} />
                            <SelectInput label="Artist Type" name="artistType" value={profileData.artistType} onChange={handleProfileDataChange} options={artistTypes} />
                            <SelectInput label="Mood" name="mood" value={profileData.mood} onChange={handleProfileDataChange} options={moods} />
                            <SelectInput label="Tempo" name="tempo" value={profileData.tempo} onChange={handleProfileDataChange} options={tempos} />
                            <SelectInput label="Vocal Style" name="vocalStyle" value={profileData.vocalStyle} onChange={handleProfileDataChange} options={vocalStyles} />
                            <SelectInput label="Melody" name="melody" value={profileData.melody} onChange={handleProfileDataChange} options={melodies} />
                            <SelectInput label="Harmony" name="harmony" value={profileData.harmony} onChange={handleProfileDataChange} options={harmonies} />
                            <SelectInput label="Rhythm" name="rhythm" value={profileData.rhythm} onChange={handleProfileDataChange} options={rhythms} />
                            <SelectInput label="Instrumentation" name="instrumentation" value={profileData.instrumentation} onChange={handleProfileDataChange} options={instrumentations} />
                            <SelectInput label="Atmosphere/FX" name="atmosphere" value={profileData.atmosphere} onChange={handleProfileDataChange} options={atmospheres} />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                        <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700">Start Over</button>
                        <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600">Save Profile</button>
                    </div>
                </div>
            );
        }

        return (
             <div className="space-y-4">
                <div>
                    <label htmlFor="artist-name" className="block text-sm font-medium text-gray-400 mb-2">Artist Name</label>
                    <input
                        type="text"
                        id="artist-name"
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        placeholder="e.g., Daft Punk, Taylor Swift, etc."
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={!artistName.trim()}
                    className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                    Generate Style
                </button>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                AI Style Creator
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Generate a musical style profile based on an existing artist.
            </p>

            {error && <ErrorMessage message={error} />}
            {successMessage && <div className="my-4 p-3 bg-green-900/50 border border-green-500 text-green-300 rounded-lg text-center">{successMessage}</div>}

            {renderContent()}
        </div>
    );
};