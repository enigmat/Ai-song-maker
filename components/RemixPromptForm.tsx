import React, { useState, useCallback, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { SingerGender, ArtistType } from '../types';
import { singerGenders, artistTypes, moods, genres } from '../constants/music';

interface RemixPromptFormProps {
    onGenerate: (
        details: { originalTitle: string; originalArtist: string; audioFile: File | null; lyrics: string | null; },
        targetGenre: string,
        singerGender: SingerGender,
        artistType: ArtistType,
        mood: string,
        remixPrompt: string,
    ) => void;
    isLoading: boolean;
}

const RemixerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
);

const UploadIcon = () => (
    <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
    const [inputMode, setInputMode] = useState<'title' | 'lyrics' | 'audio'>('title');
    const [originalTitle, setOriginalTitle] = useState('');
    const [originalArtist, setOriginalArtist] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Style parameters state
    const [targetGenre, setTargetGenre] = useState(genres[0]);
    const [singerGender, setSingerGender] = useState<SingerGender>('any');
    const [artistType, setArtistType] = useState<ArtistType>('any');
    const [mood, setMood] = useState(moods[0]);
    const [remixPrompt, setRemixPrompt] = useState('');
    
    const handleFileSelect = useCallback((file: File | null) => {
        if (file) {
            const isValid = file.type.startsWith('audio/mpeg') || file.name.toLowerCase().endsWith('.mp3') || file.type.startsWith('audio/wav') || file.name.toLowerCase().endsWith('.wav');
            if (!isValid) {
                console.warn("Invalid file type for remixing.");
                return;
            }
            setAudioFile(file);
        }
    }, []);

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
    }, [handleFileSelect]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length > 0) handleFileSelect(e.target.files[0]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const details = {
            originalTitle: inputMode === 'title' ? originalTitle : '',
            originalArtist: inputMode === 'title' ? originalArtist : '',
            audioFile: inputMode === 'audio' ? audioFile : null,
            lyrics: inputMode === 'lyrics' ? lyrics : null,
        };

        if ((inputMode === 'title' && (!details.originalTitle.trim() || !details.originalArtist.trim())) ||
            (inputMode === 'lyrics' && !details.lyrics?.trim()) ||
            (inputMode === 'audio' && !details.audioFile)) {
            return;
        }

        onGenerate(details, targetGenre, singerGender, artistType, mood, remixPrompt);
    };


    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h1 className="text-4xl text-center font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Song Remixer
            </h1>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Reimagine a song for a new generation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Choose Remix Source</label>
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center gap-1 rounded-lg bg-gray-900 p-1 border border-gray-700">
                            <button type="button" onClick={() => setInputMode('title')} aria-pressed={inputMode === 'title'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${inputMode === 'title' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Title/Artist</button>
                            <button type="button" onClick={() => setInputMode('lyrics')} aria-pressed={inputMode === 'lyrics'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${inputMode === 'lyrics' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Paste Lyrics</button>
                            <button type="button" onClick={() => setInputMode('audio')} aria-pressed={inputMode === 'audio'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${inputMode === 'audio' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Upload Audio</button>
                        </div>
                    </div>
                    {inputMode === 'title' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-fast">
                             <div>
                                <label htmlFor="originalTitle" className="block text-sm font-medium text-gray-400 mb-2">Original Song Title</label>
                                <input
                                    id="originalTitle"
                                    type="text"
                                    value={originalTitle}
                                    onChange={(e) => setOriginalTitle(e.target.value)}
                                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                    placeholder="e.g., 'Bohemian Rhapsody'"
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
                                    placeholder="e.g., 'Queen'"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    )}
                    {inputMode === 'lyrics' && (
                        <div className="animate-fade-in-fast">
                             <label htmlFor="lyrics" className="block text-sm font-medium text-gray-400 mb-2">Original Lyrics</label>
                             <textarea
                                id="lyrics"
                                rows={8}
                                value={lyrics}
                                onChange={e => setLyrics(e.target.value)}
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y"
                                placeholder="Paste lyrics here to create a new version..."
                                disabled={isLoading}
                             />
                        </div>
                    )}
                    {inputMode === 'audio' && (
                        <div className="animate-fade-in-fast">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Upload Audio to Remix</label>
                            <div
                                onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                            >
                                <input ref={fileInputRef} id="audio-file-input" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={handleFileChange} className="hidden" disabled={isLoading} />
                                <div className="text-center">
                                    <UploadIcon />
                                    {audioFile ? (
                                        <div className="mt-2 text-center">
                                            <p className="text-lg font-semibold text-teal-400 truncate" title={audioFile.name}>{audioFile.name}</p>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setAudioFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="mt-1 text-xs px-2 py-1 text-gray-400 hover:text-white hover:bg-red-600/50 rounded-md transition-colors">Clear</button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="mt-2 text-lg font-semibold text-gray-300">Drag & Drop MP3/WAV file</p>
                                            <p className="mt-1 text-sm text-gray-400">or click to select a file</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                     <SelectInput label="Target Genre" value={targetGenre} onChange={(e) => setTargetGenre(e.target.value)} options={genres} disabled={isLoading} />
                     <SelectInput label="Mood" value={mood} onChange={(e) => setMood(e.target.value)} options={moods} disabled={isLoading} />
                     <div className="md:col-span-2">
                        <label htmlFor="remix-prompt" className="block text-sm font-medium text-gray-400 mb-2">Creative Direction (Optional)</label>
                        <textarea
                            id="remix-prompt"
                            rows={3}
                            value={remixPrompt}
                            onChange={(e) => setRemixPrompt(e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y"
                            placeholder="e.g., 'give it a cyberpunk theme' or 'set the story in a haunted forest'"
                            disabled={isLoading}
                        />
                    </div>
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
                    disabled={isLoading || (inputMode === 'title' && (!originalTitle.trim() || !originalArtist.trim())) || (inputMode === 'lyrics' && !lyrics.trim()) || (inputMode === 'audio' && !audioFile)}
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
            <style>{`.animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out; } @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};