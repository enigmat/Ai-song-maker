import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { analyzeAudioForProfile } from '../services/geminiService';
import type { ArtistStyleProfile, StoredArtistProfile, ArtistSong } from '../types';
import { genres, singerGenders, artistTypes, moods, tempos, melodies, harmonies, rhythms, instrumentations, atmospheres, vocalStyles, styleFieldDescriptions } from '../constants/music';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

const PROFILES_STORAGE_KEY = 'mustbmusic_artist_profiles';

const UploadIcon = () => (
  <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SelectInput: React.FC<{ label: string; name: keyof ArtistStyleProfile; value: string; onChange: (e: ChangeEvent<HTMLSelectElement>) => void; options: readonly string[] | { value: string, label: string }[]; }> =
    ({ label, name, value, onChange, options }) => (
        <div title={styleFieldDescriptions[name as keyof typeof styleFieldDescriptions]}>
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
                    return <option key={optionValue} value={optionValue}>{optionLabel}</option>
                })}
            </select>
        </div>
    );

export const ArtistProfileManager: React.FC = () => {
    const [profiles, setProfiles] = useState<Record<string, StoredArtistProfile>>({});
    const [initialProfiles, setInitialProfiles] = useState<Record<string, StoredArtistProfile>>({});
    const [dirtyProfiles, setDirtyProfiles] = useState<Set<string>>(new Set());

    const [status, setStatus] = useState<'idle' | 'analyzing' | 'analyzed' | 'error'>('idle');
    const [expandedProfiles, setExpandedProfiles] = useState<Record<string, boolean>>({});
    
    const [mp3File, setMp3File] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [newProfileData, setNewProfileData] = useState<ArtistStyleProfile | null>(null);
    const [newProfileName, setNewProfileName] = useState('');
    
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        try {
            const rawData = localStorage.getItem(PROFILES_STORAGE_KEY);
            if (rawData) {
                const data = JSON.parse(rawData);

                if (!data || typeof data !== 'object' || Array.isArray(data)) {
                    console.warn("Invalid data in localStorage for artist profiles. Expected an object.");
                    return;
                }

                const firstProfileName = Object.keys(data)[0];
                const firstProfile = firstProfileName ? data[firstProfileName] : undefined;

                if (firstProfile && typeof firstProfile === 'object' && firstProfile !== null && 'genre' in firstProfile && !('style' in firstProfile)) {
                    const migratedProfiles: Record<string, StoredArtistProfile> = {};
                    Object.entries(data).forEach(([name, style]) => {
                        migratedProfiles[name] = {
                            style: style as ArtistStyleProfile,
                            songs: []
                        };
                    });
                    setProfiles(migratedProfiles);
                    setInitialProfiles(migratedProfiles);
                    saveProfilesToStorage(migratedProfiles);
                } else {
                    const loadedProfiles = data as Record<string, StoredArtistProfile>;
                    setProfiles(loadedProfiles);
                    setInitialProfiles(loadedProfiles);
                }
            }
        } catch (e) {
            console.error("Failed to load or migrate artist profiles:", e);
        }
    }, []);

    const saveProfilesToStorage = (updatedProfiles: Record<string, StoredArtistProfile>) => {
        try {
            localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
        } catch (e) {
            console.error("Failed to save artist profiles:", e);
            setError("Could not save profiles. Local storage might be full.");
        }
    };
    
    const handleFileSelect = (file: File | null) => {
        if (file) {
            if (!file.type.startsWith('audio/mpeg') && !file.name.toLowerCase().endsWith('.mp3')) {
                setError('Please select a valid MP3 audio file.');
                setMp3File(null);
                return;
            }
            setMp3File(file);
            setError(null);
        }
    };
    
    const handleAnalyze = async () => {
        if (!mp3File) {
            setError('Please select an MP3 file to analyze.');
            return;
        }
        setStatus('analyzing');
        setError(null);
        try {
            const result = await analyzeAudioForProfile(mp3File);
            const { artistNameSuggestion, ...profileData } = result;
            setNewProfileData(profileData);
            setNewProfileName(artistNameSuggestion);
            setStatus('analyzed');
        } catch (err) {
            console.error('MP3 analysis failed:', err);
            setError('Failed to analyze audio. The AI model may be busy. Please try again.');
            setStatus('error');
        }
    };

    const handleSaveNewProfile = () => {
        if (!newProfileName.trim()) {
            setError('Please provide a name for the new profile.');
            return;
        }
        if (profiles[newProfileName.trim()]) {
            setError('A profile with this name already exists.');
            return;
        }
        if (!newProfileData) return;

        const newProfileEntry = { [newProfileName.trim()]: { style: newProfileData, songs: [] } };
        const updatedProfiles = { ...profiles, ...newProfileEntry };
        setProfiles(updatedProfiles);
        setInitialProfiles(updatedProfiles);
        saveProfilesToStorage(updatedProfiles);
        
        setNewProfileData(null);
        setNewProfileName('');
        setMp3File(null);
        setStatus('idle');
    };

    const handleDeleteProfile = (name: string) => {
        if (window.confirm(`Are you sure you want to delete the profile "${name}"? This will also delete all associated songs.`)) {
            const { [name]: _, ...rest } = profiles;
            setProfiles(rest);
            setInitialProfiles(rest);
            saveProfilesToStorage(rest);
        }
    };
    
    const handleDeleteSong = (artistName: string, songIndex: number) => {
        if (!window.confirm("Are you sure you want to delete this song from the artist's profile?")) return;
        
        const updatedProfiles = { ...profiles };
        const artistProfile = updatedProfiles[artistName];
        if (artistProfile) {
            const updatedSongs = [...artistProfile.songs];
            updatedSongs.splice(songIndex, 1);
            updatedProfiles[artistName] = { ...artistProfile, songs: updatedSongs };
            setProfiles(updatedProfiles);
            setInitialProfiles(updatedProfiles);
            saveProfilesToStorage(updatedProfiles);
        }
    };

    const handleProfileChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, name: string) => {
        const { name: field, value } = e.target;
        
        const profileToUpdate = profiles[name];
        if (!profileToUpdate) return;
        
        const updatedProfiles = {
            ...profiles,
            [name]: {
                ...profileToUpdate,
                style: {
                    ...profileToUpdate.style,
                    [field]: value
                }
            }
        };
        setProfiles(updatedProfiles);
        setDirtyProfiles(prev => new Set(prev).add(name));
    };
    
    const handleSaveAllChanges = () => {
        saveProfilesToStorage(profiles);
        setInitialProfiles(profiles); 
        setDirtyProfiles(new Set());
    };

    const handleDiscardAllChanges = () => {
        setProfiles(initialProfiles); 
        setDirtyProfiles(new Set());
    };

    const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragIn = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.items?.length > 0) setIsDragging(true); }, []);
    const handleDragOut = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, []);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length > 0) handleFileSelect(e.target.files[0]);
    };
    

    const renderProfileForm = (profileData: ArtistStyleProfile, handler: (e: ChangeEvent<HTMLSelectElement>) => void) => (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
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
    

    return (
        <div className="space-y-8">
            {/* Create Profile Section */}
            <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                    Artist Profile Manager
                </h2>
                <p className="text-center text-gray-400 mt-2 mb-6">
                    Create a new artist style profile by analyzing an MP3 file with AI.
                </p>
                
                {error && <ErrorMessage message={error} />}

                {status === 'analyzing' && (
                    <div className="text-center p-10"><LoadingSpinner size="lg" /><p className="mt-4 text-gray-400 text-lg animate-pulse">Analyzing audio...</p></div>
                )}

                {(status === 'idle' || status === 'error') && (
                     <div className="space-y-4">
                        <div
                            onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                            className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                            onClick={() => document.getElementById('mp3-profile-input')?.click()}
                        >
                            <input id="mp3-profile-input" type="file" accept=".mp3,audio/mpeg" onChange={handleFileChange} className="hidden" />
                            <div className="text-center">
                                <UploadIcon />
                                {mp3File ? <p className="mt-2 text-lg font-semibold text-teal-400 truncate" title={mp3File.name}>{mp3File.name}</p> : <p className="mt-2 text-lg font-semibold text-gray-300">Drag & Drop MP3 to analyze</p>}
                            </div>
                        </div>
                        <button onClick={handleAnalyze} disabled={!mp3File} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50">
                            Analyze & Create Profile
                        </button>
                    </div>
                )}
                
                {status === 'analyzed' && newProfileData && (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-xl font-semibold text-center text-teal-300">New Profile Analyzed</h3>
                        <div>
                             <label htmlFor="new-profile-name" className="block text-sm font-medium text-gray-400 mb-1">Profile Name</label>
                             <input type="text" id="new-profile-name" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-1 focus:ring-teal-500" />
                        </div>
                        {renderProfileForm(newProfileData, (e) => setNewProfileData({...newProfileData, [e.target.name]: e.target.value }))}
                        <div className="flex gap-4 pt-2">
                             <button onClick={() => setStatus('idle')} className="w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700">Cancel</button>
                             <button onClick={handleSaveNewProfile} className="w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600">Save New Profile</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Saved Profiles Section */}
            <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-200">Your Saved Profiles</h2>
                    {dirtyProfiles.size > 0 && (
                        <div className="flex items-center gap-2 animate-fade-in-fast">
                            <button onClick={handleDiscardAllChanges} className="px-3 py-1.5 text-sm font-semibold bg-gray-600 hover:bg-gray-500 rounded-md transition-colors">Discard All</button>
                            <button onClick={handleSaveAllChanges} className="px-3 py-1.5 text-sm font-semibold bg-teal-600 hover:bg-teal-500 rounded-md transition-colors">Save All Changes</button>
                        </div>
                    )}
                </div>
                <div className="mt-6 space-y-4">
                    {Object.keys(profiles).length === 0 ? (
                        <p className="text-center text-gray-500">You have no saved profiles yet. Create one above!</p>
                    ) : (
                        Object.keys(profiles).map((name) => {
                            const profile = profiles[name];
                            return (
                            <div key={name} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 transition-all duration-300">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-purple-400">{name}</h3>
                                        {dirtyProfiles.has(name) && <div className="w-2 h-2 rounded-full bg-yellow-400" title="Unsaved changes"></div>}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => setExpandedProfiles(p => ({...p, [name]: !p[name]}))} className="text-gray-400 hover:text-white" title={expandedProfiles[name] ? "Collapse" : "Expand"}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${expandedProfiles[name] ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                        <button onClick={() => handleDeleteProfile(name)} className="text-gray-400 hover:text-red-500" title="Delete Profile"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                    </div>
                                </div>
                                 {expandedProfiles[name] && (
                                    <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-6">
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-300 mb-2">Style Parameters</h4>
                                            {renderProfileForm(profile.style, (e) => handleProfileChange(e, name))}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-300">Saved Songs ({profile.songs.length})</h4>
                                            <div className="mt-2 space-y-3">
                                                {profile.songs.length === 0 ? <p className="text-sm text-gray-500">No songs saved for this artist yet.</p> : profile.songs.map((song, i) => (
                                                    <div key={i} className="bg-gray-800/50 p-3 rounded-md border border-gray-700/80">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-semibold text-gray-200">{song.title}</p>
                                                                <p className="text-xs text-gray-500">Created: {new Date(song.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => handleDeleteSong(name, i)} className="text-gray-500 hover:text-red-500 p-1" title="Delete Song"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                                            </div>
                                                        </div>
                                                        <details className="mt-2 text-xs text-gray-400">
                                                            <summary className="cursor-pointer hover:text-white">Show Prompts</summary>
                                                            <div className="mt-2 p-2 bg-gray-900/70 rounded-md space-y-2 font-mono text-gray-500">
                                                                <p><strong className="text-gray-400">Song Idea:</strong> {song.songPrompt}</p>
                                                                <p><strong className="text-gray-400">Album Cover:</strong> {song.albumCoverPrompt}</p>
                                                            </div>
                                                        </details>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
