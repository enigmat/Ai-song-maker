import React, { useState, ChangeEvent } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { generateProfileFromArtistName, ArtistStyleProfile, StoredArtistProfile } from '../services/geminiService';
import { genres, singerGenders, artistTypes, moods, tempos, melodies, harmonies, rhythms, instrumentations, atmospheres, vocalStyles, styleFieldDescriptions } from '../constants/music';

const PROFILES_STORAGE_KEY = 'mustbmusic_artist_profiles';

const SelectInput: React.FC<{ label: string; name: keyof ArtistStyleProfile; value: string; onChange: (e: ChangeEvent<HTMLSelectElement>) => void; options: readonly string[] | { value: string, label: string }[]; disabled: boolean; }> =
    ({ label, name, value, onChange, options, disabled }) => (
        <div title={styleFieldDescriptions[name as keyof typeof styleFieldDescriptions]}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
                disabled={disabled}
            >
                {options.map((item) => {
                    const optionValue = typeof item === 'string' ? item : item.value;
                    const optionLabel = typeof item === 'string' ? item : item.label;
                    return <option key={optionValue} value={optionValue}>{optionLabel}</option>
                })}
            </select>
        </div>
    );

export const StyleCreator: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
    const [artistName, setArtistName] = useState('');
    const [profileData, setProfileData] = useState<ArtistStyleProfile | null>(null);
    const [newProfileName, setNewProfileName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!artistName.trim()) {
            setError('Please enter an artist name.');
            return;
        }
        setStatus('analyzing');
        setError(null);
        setProfileData(null);
        setSuccessMessage(null);
        try {
            const data = await generateProfileFromArtistName(artistName);
            setProfileData(data);
            setNewProfileName(artistName);
            setStatus('success');
        } catch (err) {
            console.error('Style analysis failed:', err);
            setError('Failed to analyze artist. They may not be well-known enough, or the AI is busy. Please try again.');
            setStatus('error');
        }
    };
    
    const handleProfileChange = (e: ChangeEvent<HTMLSelectElement>) => {
        if (!profileData) return;
        const { name, value } = e.target;
        setProfileData({ ...profileData, [name]: value });
    };

    const handleSaveProfile = () => {
        if (!profileData || !newProfileName.trim()) {
            setError('Profile name cannot be empty.');
            return;
        }

        try {
            const rawData = localStorage.getItem(PROFILES_STORAGE_KEY);
            const existingProfiles: Record<string, StoredArtistProfile> = rawData ? JSON.parse(rawData) : {};
            
            if (existingProfiles[newProfileName.trim()]) {
                setError('A profile with this name already exists.');
                return;
            }

            const newProfile: StoredArtistProfile = {
                style: profileData,
                songs: [],
            };

            const updatedProfiles = { ...existingProfiles, [newProfileName.trim()]: newProfile };
            localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
            
            setSuccessMessage(`Profile "${newProfileName.trim()}" saved successfully!`);
            setStatus('idle');
            setProfileData(null);
            setArtistName('');
            setNewProfileName('');

        } catch (e) {
            console.error('Failed to save profile:', e);
            setError('Could not save profile to local storage.');
        }
    };


    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                AI Style Creator
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Generate an entire artist style profile just from a famous artist's name.
            </p>

            {error && <ErrorMessage message={error} />}
            {successMessage && (
                 <div className="my-4 p-4 bg-green-900/50 border border-green-500 text-green-300 rounded-lg">
                    {successMessage}
                 </div>
            )}

            <div className="space-y-4 max-w-xl mx-auto">
                <div>
                    <label htmlFor="artist-name-input" className="block text-sm font-medium text-gray-400 mb-2">
                        Famous Artist Name
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="artist-name-input"
                            type="text"
                            value={artistName}
                            onChange={(e) => setArtistName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            placeholder="e.g., Daft Punk, Johnny Cash"
                            className="flex-grow p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
                            disabled={status === 'analyzing'}
                        />
                         <button
                            onClick={handleAnalyze}
                            disabled={status === 'analyzing' || !artistName.trim()}
                            className="w-48 flex items-center justify-center gap-2 text-lg font-semibold px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50"
                        >
                            {status === 'analyzing' ? <LoadingSpinner /> : 'Analyze'}
                        </button>
                    </div>
                </div>
            </div>

            {status === 'analyzing' && (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">Analyzing artist's style...</p>
                </div>
            )}

            {status === 'success' && profileData && (
                <div className="mt-8 pt-6 border-t border-gray-700 space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-bold text-center text-teal-300">Generated Style Profile</h3>
                    <div>
                         <label htmlFor="new-profile-name" className="block text-sm font-medium text-gray-400 mb-2">Save Profile As</label>
                         <input type="text" id="new-profile-name" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SelectInput label="Genre" name="genre" value={profileData.genre} onChange={handleProfileChange} options={genres} disabled={false} />
                        <SelectInput label="Singer" name="singerGender" value={profileData.singerGender} onChange={handleProfileChange} options={singerGenders} disabled={false} />
                        <SelectInput label="Artist Type" name="artistType" value={profileData.artistType} onChange={handleProfileChange} options={artistTypes} disabled={false} />
                        <SelectInput label="Mood" name="mood" value={profileData.mood} onChange={handleProfileChange} options={moods} disabled={false} />
                        <SelectInput label="Tempo" name="tempo" value={profileData.tempo} onChange={handleProfileChange} options={tempos} disabled={false} />
                        <SelectInput label="Vocal Style" name="vocalStyle" value={profileData.vocalStyle} onChange={handleProfileChange} options={vocalStyles} disabled={false} />
                        <SelectInput label="Melody" name="melody" value={profileData.melody} onChange={handleProfileChange} options={melodies} disabled={false} />
                        <SelectInput label="Harmony" name="harmony" value={profileData.harmony} onChange={handleProfileChange} options={harmonies} disabled={false} />
                        <SelectInput label="Rhythm" name="rhythm" value={profileData.rhythm} onChange={handleProfileChange} options={rhythms} disabled={false} />
                        <SelectInput label="Instrumentation" name="instrumentation" value={profileData.instrumentation} onChange={handleProfileChange} options={instrumentations} disabled={false} />
                        <SelectInput label="Atmosphere/FX" name="atmosphere" value={profileData.atmosphere} onChange={handleProfileChange} options={atmospheres} disabled={false} />
                    </div>
                    <div className="flex gap-4 pt-4">
                         <button onClick={() => { setStatus('idle'); setProfileData(null); }} className="w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700">Cancel</button>
                         <button onClick={handleSaveProfile} className="w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600">Save Profile</button>
                    </div>
                </div>
            )}

        </div>
    );
};