import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { InteractiveImageEditor } from './InteractiveImageEditor';
// Fix: Module '"../App"' has no exported member 'SingerGender' or 'ArtistType'. They are exported from geminiService.
import type { SingerGender, ArtistType } from '../services/geminiService';
import type { VocalMelody } from '../services/geminiService';

interface SongData {
    title: string;
    artistName: string;
    artistBio: string;
    albumCoverPrompt: string;
    lyrics: string;
    styleGuide: string;
    beatPattern: string;
    singerGender: SingerGender;
    artistType: ArtistType;
    vocalMelody: VocalMelody | null;
    bpm: number;
    videoPrompt: string;
    genre: string;
}

interface SongEditorProps {
    songData: SongData;
    setSongData: (songData: SongData) => void;
    onFinalize: () => void;
    onCancel: () => void;
    isLoading: boolean;
    onRegenerateImage: () => void;
    artistImageUrl: string;
    isRegeneratingImage: boolean;
    onImageUpdate: (newImageUrl: string) => void;
}

const CopyButton = ({ textToCopy, positionClasses }: { textToCopy: string; positionClasses: string }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => console.error("Failed to copy text: ", err));
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={`absolute ${positionClasses} text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-gray-700/50`}
            title={isCopied ? "Copied!" : "Copy to clipboard"}
            aria-label={isCopied ? "Content copied" : "Copy content to clipboard"}
        >
            {isCopied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                    <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" />
                </svg>
            )}
        </button>
    );
};


export const SongEditor: React.FC<SongEditorProps> = ({ songData, setSongData, onFinalize, onCancel, isLoading, onRegenerateImage, artistImageUrl, isRegeneratingImage, onImageUpdate }) => {
    const [lyricsViewMode, setLyricsViewMode] = useState<'edit' | 'structured'>('edit');
    const [showImageEditor, setShowImageEditor] = useState(false);
    
    const handleChange = (field: keyof SongData, value: string | number) => {
        setSongData({ ...songData, [field]: value });
    };

    const handleSaveEditedImage = (newImageUrl: string) => {
        onImageUpdate(newImageUrl);
    };

    const renderLyricsView = () => {
        if (lyricsViewMode === 'structured') {
            return (
                <div className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg font-serif min-h-[384px] max-h-[500px] overflow-y-auto prose prose-invert prose-p:my-1">
                    {songData.lyrics.split('\n').map((line, index) => {
                        const isSectionHeader = /^\s*\[.*\]\s*$/.test(line);
                        if (isSectionHeader) {
                            return (
                                <p key={index} className="font-bold text-purple-400 mt-4 mb-2">
                                    {line.trim()}
                                </p>
                            );
                        }
                        return (
                            <p key={index} className="text-gray-300 leading-relaxed">
                                {line || <>&nbsp;</>}
                            </p>
                        );
                    })}
                </div>
            );
        }

        return (
             <div className="relative">
                <textarea
                    id="lyrics"
                    rows={15}
                    value={songData.lyrics}
                    onChange={(e) => handleChange('lyrics', e.target.value)}
                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y font-serif pr-12"
                />
                <CopyButton textToCopy={songData.lyrics} positionClasses="top-3 right-3" />
            </div>
        );
    };
    
    return (
        <>
            {showImageEditor && artistImageUrl && (
                <InteractiveImageEditor
                    initialImageUrl={artistImageUrl}
                    onSave={handleSaveEditedImage}
                    onClose={() => setShowImageEditor(false)}
                />
            )}
            <div className="animate-fade-in space-y-6 p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                    Review & Edit Your Song
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="title" className="block text-lg font-medium text-gray-300 mb-2">Song Title</label>
                        <div className="relative">
                            <input
                                id="title"
                                type="text"
                                value={songData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all pr-12"
                            />
                            <CopyButton textToCopy={songData.title} positionClasses="top-1/2 right-3 -translate-y-1/2" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="artistName" className="block text-lg font-medium text-gray-300 mb-2">Artist Name</label>
                        <div className="relative">
                            <input
                                id="artistName"
                                type="text"
                                value={songData.artistName}
                                onChange={(e) => handleChange('artistName', e.target.value)}
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all pr-12"
                            />
                            <CopyButton textToCopy={songData.artistName} positionClasses="top-1/2 right-3 -translate-y-1/2" />
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="genre" className="block text-lg font-medium text-gray-300 mb-2">Genre</label>
                    <div className="relative">
                        <input
                            id="genre"
                            type="text"
                            value={songData.genre}
                            onChange={(e) => handleChange('genre', e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all pr-12"
                        />
                        <CopyButton textToCopy={songData.genre} positionClasses="top-1/2 right-3 -translate-y-1/2" />
                    </div>
                </div>

                <div>
                    <label htmlFor="artistBio" className="block text-lg font-medium text-gray-300 mb-2">Artist Bio</label>
                    <div className="relative">
                        <textarea
                            id="artistBio"
                            rows={3}
                            value={songData.artistBio}
                            onChange={(e) => handleChange('artistBio', e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y pr-12"
                        />
                        <CopyButton textToCopy={songData.artistBio} positionClasses="top-3 right-3" />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="albumCoverPrompt" className="block text-lg font-medium text-gray-300">
                            Album Cover Prompt
                            <span className="text-sm text-gray-400 ml-2">(Edit to change the album cover)</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowImageEditor(true)}
                                disabled={isRegeneratingImage || !artistImageUrl}
                                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-purple-600 rounded-md shadow-md hover:bg-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                type="button"
                                onClick={onRegenerateImage}
                                disabled={isRegeneratingImage}
                                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-teal-600 rounded-md shadow-md hover:bg-teal-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isRegeneratingImage ? <LoadingSpinner size="sm" /> : '✨'}
                                Regenerate
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <textarea
                            id="albumCoverPrompt"
                            rows={4}
                            value={songData.albumCoverPrompt}
                            onChange={(e) => handleChange('albumCoverPrompt', e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-y font-mono text-sm pr-12"
                        />
                        <CopyButton textToCopy={songData.albumCoverPrompt} positionClasses="top-3 right-3" />
                    </div>
                    <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-600 flex justify-center items-center h-48">
                        {isRegeneratingImage ? (
                            <div className="text-center text-gray-400">
                                <LoadingSpinner />
                                <p className="mt-2 animate-pulse">Generating new image...</p>
                            </div>
                        ) : artistImageUrl ? (
                            <img src={artistImageUrl} alt="Generated album cover" className="max-h-full max-w-full object-contain rounded-md shadow-lg" />
                        ) : (
                            <div className="text-center text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-2 text-sm">Album cover will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="videoPrompt" className="block text-lg font-medium text-gray-300 mb-2">
                        Music Video Prompt
                        <span className="text-sm text-gray-400 ml-2">(Describes the music video visuals)</span>
                    </label>
                    <div className="relative">
                        <textarea
                            id="videoPrompt"
                            rows={4}
                            value={songData.videoPrompt}
                            onChange={(e) => handleChange('videoPrompt', e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-y font-mono text-sm pr-12"
                        />
                        <CopyButton textToCopy={songData.videoPrompt} positionClasses="top-3 right-3" />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="beatPattern" className="block text-lg font-medium text-gray-300 mb-2">
                            Beat Pattern (JSON)
                        </label>
                        <div className="relative">
                            <textarea
                                id="beatPattern"
                                rows={4}
                                value={songData.beatPattern}
                                onChange={(e) => handleChange('beatPattern', e.target.value)}
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-y font-mono text-sm pr-12"
                                placeholder='e.g., {"kick": [0, 8], "snare": [4, 12], "hihat": [0,2,4,6,8,10,12,14]}'
                            />
                            <CopyButton textToCopy={songData.beatPattern} positionClasses="top-3 right-3" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="bpm" className="block text-lg font-medium text-gray-300 mb-2">
                            BPM
                        </label>
                        <input
                            id="bpm"
                            type="number"
                            value={songData.bpm}
                            onChange={(e) => handleChange('bpm', parseInt(e.target.value, 10) || 120)}
                            min="40"
                            max="220"
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
                        />
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="lyrics" className="block text-lg font-medium text-gray-300">Lyrics</label>
                        <div className="flex items-center gap-1 rounded-lg bg-gray-900 p-1 border border-gray-700">
                            <button 
                                onClick={() => setLyricsViewMode('edit')}
                                aria-pressed={lyricsViewMode === 'edit'}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${lyricsViewMode === 'edit' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => setLyricsViewMode('structured')}
                                aria-pressed={lyricsViewMode === 'structured'}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${lyricsViewMode === 'structured' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                            >
                                View
                            </button>
                        </div>
                    </div>
                    {renderLyricsView()}
                </div>

                <div>
                    <label htmlFor="styleGuide" className="block text-lg font-medium text-gray-300 mb-2">Production Style Guide</label>
                    <div className="relative">
                        <textarea
                            id="styleGuide"
                            rows={10}
                            value={songData.styleGuide}
                            onChange={(e) => handleChange('styleGuide', e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y pr-12"
                        />
                        <CopyButton textToCopy={songData.styleGuide} positionClasses="top-3 right-3" />
                    </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-4">
                    <button
                        onClick={onFinalize}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner />
                                Creating Artist...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Create Artist & Finalize
                            </>
                        )}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                </div>
            </div>
        </>
    );
};