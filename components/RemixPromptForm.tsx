import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { SingerGender, ArtistType } from '../services/geminiService';
import { singerGenders, artistTypes, moods, genres } from '../constants/music';

interface RemixPromptFormProps {
    onGenerate: (
        originalTitle: string,
        originalArtist: string,
        targetGenre: string,
        singerGender: SingerGender,
        artistType: ArtistType,
        mood: string,
    ) => void;
    isLoading: boolean;
}

const RemixerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
);

const SelectInput: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: readonly string[]; disabled: boolean; }> =
    ({ label, value, onChange, options, disabled }) => (
        <div>
            <label htmlFor={label} className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
            <select
                id={label}
                value={value}
                onChange={onChange}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
                disabled={disabled}
            >
                {options.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
        </div>
    );


export const RemixPromptForm: React.FC<RemixPromptFormProps> = ({ onGenerate, isLoading }) => {
    // Core state
    const [originalTitle, setOriginalTitle] = useState('');
    const [originalArtist, setOriginalArtist] = useState('');
    const [targetGenre, setTargetGenre] = useState(genres[0]);
    
    // Style parameters state
    const [singerGender, setSingerGender] = useState<SingerGender>('any');
    const [artistType, setArtistType] = useState<ArtistType>('any');
    const [mood, setMood] = useState(moods[0]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!originalTitle.trim() || !originalArtist.trim()) return;
        onGenerate(originalTitle, originalArtist, targetGenre, singerGender, artistType, mood);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h1 className="text-4xl text-center font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Song Remixer
            </h1>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Reimagine a classic song for a new generation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="originalTitle" className="block text-sm font-medium text-gray-400 mb-2">Original Song Title</label>
                        <input
                            id="originalTitle"
                            type="text"
                            value={originalTitle}
                            onChange={(e) => setOriginalTitle(e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            placeholder="e.g., 'Jolene'"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="originalArtist" className="block text-sm font-medium text-gray-400 mb-2">Original Artist</label>
                        <input
                            id="originalArtist"
                            type="text"
                            value={originalArtist}
                            onChange={(e) => setOriginalArtist(e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            placeholder="e.g., 'Dolly Parton'"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                     <SelectInput label="Target Genre" value={targetGenre} onChange={(e) => setTargetGenre(e.target.value)} options={genres} disabled={isLoading} />
                     <SelectInput label="Mood" value={mood} onChange={(e) => setMood(e.target.value)} options={moods} disabled={isLoading} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="singer-gender" className="block text-sm font-medium text-gray-400 mb-2">Singer</label>
                        <select
                            id="singer-gender"
                            value={singerGender}
                            onChange={(e) => setSingerGender(e.target.value as SingerGender)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
                            disabled={isLoading}
                        >
                            {singerGenders.map((sg) => <option key={sg.value} value={sg.value}>{sg.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="artist-type" className="block text-sm font-medium text-gray-400 mb-2">Artist Type</label>
                        <select
                            id="artist-type"
                            value={artistType}
                            onChange={(e) => setArtistType(e.target.value as ArtistType)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
                            disabled={isLoading}
                        >
                            {artistTypes.map((at) => <option key={at.value} value={at.value}>{at.label}</option>)}
                        </select>
                    </div>
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading || !originalTitle.trim() || !originalArtist.trim()}
                    className="mt-6 w-full flex items-center justify-center gap-3 text-xl font-semibold px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner />
                            Remixing...
                        </>
                    ) : (
                        <>
                            <RemixerIcon />
                            Generate Remix
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};