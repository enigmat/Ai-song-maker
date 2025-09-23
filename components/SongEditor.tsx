import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { SingerGender, ArtistType } from '../App';
import type { VocalMelody } from '../services/geminiService';

interface SongData {
    title: string;
    artistName: string;
    artistBio: string;
    artistImagePrompt: string;
    lyrics: string;
    styleGuide: string;
    beatPattern: string;
    singerGender: SingerGender;
    artistType: ArtistType;
    vocalMelody: VocalMelody | null;
    bpm: number;
}

interface SongEditorProps {
    songData: SongData;
    setSongData: (songData: SongData) => void;
    onFinalize: () => void;
    isLoading: boolean;
}

export const SongEditor: React.FC<SongEditorProps> = ({ songData, setSongData, onFinalize, isLoading }) => {
    const [lyricsViewMode, setLyricsViewMode] = useState<'edit' | 'structured'>('edit');
    
    const handleChange = (field: keyof SongData, value: string | number) => {
        setSongData({ ...songData, [field]: value });
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
            <textarea
                id="lyrics"
                rows={15}
                value={songData.lyrics}
                onChange={(e) => handleChange('lyrics', e.target.value)}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y font-serif"
            />
        );
    };
    
    return (
        <div className="animate-fade-in space-y-6 p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Review & Edit Your Song
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="title" className="block text-lg font-medium text-gray-300 mb-2">Song Title</label>
                    <input
                        id="title"
                        type="text"
                        value={songData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                </div>
                <div>
                    <label htmlFor="artistName" className="block text-lg font-medium text-gray-300 mb-2">Artist Name</label>
                    <input
                        id="artistName"
                        type="text"
                        value={songData.artistName}
                        onChange={(e) => handleChange('artistName', e.target.value)}
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="artistBio" className="block text-lg font-medium text-gray-300 mb-2">Artist Bio</label>
                <textarea
                    id="artistBio"
                    rows={3}
                    value={songData.artistBio}
                    onChange={(e) => handleChange('artistBio', e.target.value)}
                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y"
                />
            </div>

            <div>
                <label htmlFor="artistImagePrompt" className="block text-lg font-medium text-gray-300 mb-2">
                    Artist Video Prompt
                    <span className="text-sm text-gray-400 ml-2">(Edit to change the generated video)</span>
                </label>
                <textarea
                    id="artistImagePrompt"
                    rows={4}
                    value={songData.artistImagePrompt}
                    onChange={(e) => handleChange('artistImagePrompt', e.target.value)}
                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-y font-mono text-sm"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="beatPattern" className="block text-lg font-medium text-gray-300 mb-2">
                        Beat Pattern (JSON)
                    </label>
                    <textarea
                        id="beatPattern"
                        rows={4}
                        value={songData.beatPattern}
                        onChange={(e) => handleChange('beatPattern', e.target.value)}
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-y font-mono text-sm"
                        placeholder='e.g., {"kick": [0, 8], "snare": [4, 12], "hihat": [0,2,4,6,8,10,12,14]}'
                    />
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
                <textarea
                    id="styleGuide"
                    rows={10}
                    value={songData.styleGuide}
                    onChange={(e) => handleChange('styleGuide', e.target.value)}
                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y"
                />
            </div>
            
            <button
                onClick={onFinalize}
                disabled={isLoading}
                className="mt-4 w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
        </div>
    );
};
