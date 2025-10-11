import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { InteractiveImageEditor } from './InteractiveImageEditor';
import {
    generateAlbumConcept,
    generateImage,
    generateAlbumNames,
} from '../services/geminiService';
import { genres } from '../constants/music';

type Status = 'prompt' | 'generating' | 'display' | 'error';

const SelectInput: React.FC<{
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: readonly string[];
    disabled: boolean;
}> = ({ label, value, onChange, options, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
            disabled={disabled}
        >
            {options.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
    </div>
);

export const AlbumGenerator: React.FC = () => {
    const [status, setStatus] = useState<Status>('prompt');
    const [error, setError] = useState<string | null>(null);
    const [albumResult, setAlbumResult] = useState<{
        albumTitle: string;
        artistName: string;
        artistBio: string;
        albumCoverUrl: string;
    } | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    
    // Form state
    const [albumPrompt, setAlbumPrompt] = useState('');
    const [albumName, setAlbumName] = useState('');
    const [artistName, setArtistName] = useState('');
    const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
    const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
    const [genre, setGenre] = useState(genres[0]);
    
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);

    const [generationProgress, setGenerationProgress] = useState({ step: '', current: 0, total: 1 });
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setCoverArtFile(file);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverArtPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setCoverArtFile(null);
            setCoverArtPreview(null);
            if (e.target.files && e.target.files.length > 0) {
                setError('Please select a valid image file.');
            }
        }
    };

    const handleSuggestNames = async () => {
        if (!artistName.trim() || !albumPrompt.trim()) {
            setError("Please provide an Artist Name and Album Concept to get suggestions.");
            return;
        }
        setIsSuggesting(true);
        setError(null);
        setNameSuggestions([]);
        try {
            const suggestions = await generateAlbumNames(artistName, albumPrompt, genre);
            setNameSuggestions(suggestions);
        } catch (err) {
            console.error("Failed to suggest names:", err);
            setError("Could not generate album name suggestions. Please try again.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleGenerate = async () => {
        if (!albumPrompt.trim() || !albumName.trim() || !artistName.trim()) {
            setError("Please fill out the Album Name, Artist Name, and Album Concept fields.");
            return;
        }
        setStatus('generating');
        setError(null);
        setAlbumResult(null);

        const totalSteps = 2; // 1 for concept, 1 for cover

        try {
            // 1. Generate Album concept
            setGenerationProgress({ step: 'Developing album concept...', current: 1, total: totalSteps });
            const albumConcept = await generateAlbumConcept(albumPrompt, genre, albumName, artistName, !coverArtFile);
            
            let finalAlbumCoverUrl = '';

            // 2. Handle Album Cover
            if (coverArtPreview) {
                 setGenerationProgress({ step: 'Using provided album cover...', current: 2, total: totalSteps });
                 finalAlbumCoverUrl = coverArtPreview;
            } else {
                setGenerationProgress({ step: 'Designing album cover...', current: 2, total: totalSteps });
                finalAlbumCoverUrl = await generateImage(albumConcept.albumCoverPrompt);
            }
            
            setAlbumResult({
                albumTitle: albumName,
                artistName: artistName,
                artistBio: albumConcept.artistBio,
                albumCoverUrl: finalAlbumCoverUrl,
            });

            setStatus('display');

        } catch (err) {
            console.error('Album generation failed:', err);
            setError('An error occurred during album generation. Please try again.');
            setStatus('error');
        }
    };
    
    const handleReset = () => {
        setStatus('prompt');
        setError(null);
        setAlbumResult(null);
        setAlbumPrompt('');
        setAlbumName('');
        setArtistName('');
        setCoverArtFile(null);
        setCoverArtPreview(null);
        setNameSuggestions([]);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <style>{`.animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; } @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }`}</style>
            {showEditor && albumResult && (
                <InteractiveImageEditor
                    initialImageUrl={albumResult.albumCoverUrl}
                    onSave={(newUrl) => {
                        setAlbumResult(prev => prev ? { ...prev, albumCoverUrl: newUrl } : null);
                    }}
                    onClose={() => setShowEditor(false)}
                />
            )}
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Album Cover Generator
            </h2>

            {error && <ErrorMessage message={error} />}
            
            {status === 'prompt' && (
                <div className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="album-name" className="block text-sm font-medium text-gray-400">Album Name</label>
                                <button
                                    type="button"
                                    onClick={handleSuggestNames}
                                    disabled={isSuggesting || !artistName.trim() || !albumPrompt.trim()}
                                    className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-teal-600 rounded-full shadow-md hover:bg-teal-500 transition-all duration-300 disabled:opacity-50"
                                >
                                    {isSuggesting ? <LoadingSpinner size="sm" /> : '✨'}
                                    Suggest Names
                                </button>
                            </div>
                            <input id="album-name" type="text" value={albumName} onChange={(e) => { setAlbumName(e.target.value); setNameSuggestions([]); }} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Chronicles of a Star Sailor'" />
                            {isSuggesting && (
                                <div className="mt-2 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                                    <LoadingSpinner size="sm" /> Generating suggestions...
                                </div>
                            )}
                            {nameSuggestions.length > 0 && !isSuggesting && (
                                <div className="mt-2 space-y-1 bg-gray-900/50 border border-gray-700 rounded-lg p-2 animate-fade-in-fast">
                                    <p className="text-xs text-gray-500 px-2 pb-1">Click to use a suggestion:</p>
                                    {nameSuggestions.map((name, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => {
                                                setAlbumName(name);
                                                setNameSuggestions([]);
                                            }}
                                            className="w-full text-left p-2 rounded-md hover:bg-purple-600/50 transition-colors text-sm text-gray-300"
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="artist-name" className="block text-sm font-medium text-gray-400 mb-2">Artist Name</label>
                            <input id="artist-name" type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'The Cosmic Drifters'" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="album-prompt" className="block text-sm font-medium text-gray-400 mb-2">Album Concept</label>
                        <textarea id="album-prompt" rows={3} value={albumPrompt} onChange={(e) => setAlbumPrompt(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'A synth-pop concept album about a robot falling in love with a star.'" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div>
                             <label htmlFor="cover-art-file" className="block text-sm font-medium text-gray-400 mb-2">Album Cover (Optional)</label>
                             <input id="cover-art-file" type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600/50 file:text-purple-200 hover:file:bg-purple-600/70" />
                             <p className="text-xs text-gray-500 mt-1">If you don't upload an image, one will be generated by AI.</p>
                        </div>
                        {coverArtPreview && (
                            <div className="mt-2 text-center">
                                <img src={coverArtPreview} alt="Album cover preview" className="w-24 h-24 rounded-md inline-block border-2 border-gray-600" />
                            </div>
                        )}
                    </div>

                    <div>
                        <SelectInput label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} options={genres} disabled={false} />
                    </div>

                    <button onClick={handleGenerate} disabled={!albumPrompt.trim() || !albumName.trim() || !artistName.trim()} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">Generate Album Cover</button>
                </div>
            )}
            
            {status === 'generating' && (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">{generationProgress.step}</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}></div>
                    </div>
                </div>
            )}

            {status === 'display' && albumResult && (
                <div className="space-y-6 mt-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        {/* Image Column */}
                        <div className="relative group flex-shrink-0">
                            <img src={albumResult.albumCoverUrl} alt={`Album cover for ${albumResult.albumTitle}`} className="w-64 h-64 md:w-80 md:h-80 rounded-lg shadow-2xl border-4 border-purple-500/50" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <button
                                    onClick={() => setShowEditor(true)}
                                    className="flex items-center gap-2 text-lg font-semibold px-6 py-3 bg-gray-700/80 rounded-lg shadow-md hover:bg-purple-600 transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                    </svg>
                                    Edit
                                </button>
                            </div>
                        </div>

                        {/* Info Column */}
                        <div className="text-center md:text-left max-w-md">
                            <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">{albumResult.albumTitle}</h3>
                            <p className="text-2xl font-semibold text-gray-300">{albumResult.artistName}</p>
                            <p className="mt-2 text-sm text-gray-400">{albumResult.artistBio}</p>
                            <div className="mt-6">
                                <a
                                    href={albumResult.albumCoverUrl}
                                    download={`${albumResult.artistName.replace(/ /g, '_')}-${albumResult.albumTitle.replace(/ /g, '_')}.jpeg`}
                                    className="inline-flex items-center justify-center gap-3 text-lg font-semibold px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-lg hover:from-teal-600 hover:to-cyan-600 transition-all transform hover:scale-105"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Cover
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="text-center pt-4">
                        <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white">Create Another Album</button>
                    </div>
                </div>
            )}
        </div>
    );
};