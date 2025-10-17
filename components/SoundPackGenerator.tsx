import React, { useState, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { CopyButton } from './CopyButton';
import { genres } from '../constants/music';
import { generateSoundPack, transcribeAudio, ArtistPackType } from '../services/geminiService';
import type { SoundPackItem } from '../types';

declare var saveAs: any;

const SoundPackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

export const SoundPackGenerator: React.FC = () => {
    type Status = 'prompt' | 'generating' | 'success' | 'error';
    type InputMode = 'text' | 'audio';

    const [status, setStatus] = useState<Status>('prompt');
    const [inputMode, setInputMode] = useState<InputMode>('text');
    const [error, setError] = useState<string | null>(null);
    const [generationMessage, setGenerationMessage] = useState('');

    // Form state
    const [lyrics, setLyrics] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [artistType, setArtistType] = useState<ArtistPackType>('Male Vocalist');

    // Result state
    const [reportData, setReportData] = useState<SoundPackItem[]>([]);
    
    const handleGenreChange = (genre: string, isChecked: boolean) => {
        setSelectedGenres(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                if (newSet.size < 5) {
                    newSet.add(genre);
                }
            } else {
                newSet.delete(genre);
            }
            return Array.from(newSet);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        if (selectedFile && !selectedFile.type.startsWith('audio/')) {
            setError('Please select a valid audio file (MP3 or WAV).');
            setFile(null);
            return;
        }
        setError(null);
        setFile(selectedFile);
    };

    const handleGenerate = async () => {
        if (selectedGenres.length === 0) {
            setError('Please select at least one genre.');
            return;
        }
        if (inputMode === 'text' && !lyrics.trim()) {
            setError('Please paste some lyrics.');
            return;
        }
        if (inputMode === 'audio' && !file) {
            setError('Please upload an audio file.');
            return;
        }

        setStatus('generating');
        setError(null);
        setReportData([]);

        try {
            let originalLyrics = lyrics;
            let inspirationSource = "Pasted Lyrics";

            if (inputMode === 'audio' && file) {
                setGenerationMessage('Transcribing audio file...');
                originalLyrics = await transcribeAudio(file);
                inspirationSource = `File: ${file.name}`;
                if (!originalLyrics.trim()) {
                    throw new Error("Could not detect any lyrics in the audio file.");
                }
            }
            
            setGenerationMessage(`Generating ${selectedGenres.length} sound pack variations...`);
            const results = await generateSoundPack(originalLyrics, inspirationSource, selectedGenres, artistType);
            setReportData(results);
            setStatus('success');

        } catch (err: any) {
            console.error("Sound pack generation failed:", err);
            setError(err.message || 'Failed to generate sound pack. The AI model might be busy.');
            setStatus('error');
        } finally {
            setGenerationMessage('');
        }
    };
    
    const handleDownloadReport = () => {
        if (reportData.length === 0) return;

        let reportText = `SOUND PACK REPORT\n`;
        reportText += `Generated on: ${new Date().toLocaleString()}\n`;
        reportText += `========================================\n\n`;

        reportData.forEach(item => {
            reportText += `GENRE: ${item.genre}\n`;
            reportText += `--------------------\n`;
            reportText += `CREATIVE CONCEPT: ${item.creativeConcept}\n\n`;
            reportText += `NEW LYRICS:\n${item.newLyrics}\n\n`;
            reportText += `STYLE GUIDE:\n${item.styleGuide}\n\n`;
            reportText += `========================================\n\n`;
        });

        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'sound_pack_report.txt');
    };

    const handleReset = useCallback(() => {
        setStatus('prompt');
        setError(null);
        setLyrics('');
        setFile(null);
        setSelectedGenres([]);
        setArtistType('Male Vocalist');
        setReportData([]);
    }, []);

    const renderForm = () => (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex justify-center">
                <div className="flex items-center gap-1 rounded-lg bg-gray-900 p-1 border border-gray-700">
                    <button onClick={() => setInputMode('text')} aria-pressed={inputMode === 'text'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${inputMode === 'text' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Paste Lyrics</button>
                    <button onClick={() => setInputMode('audio')} aria-pressed={inputMode === 'audio'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${inputMode === 'audio' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Upload Audio</button>
                </div>
            </div>

            {inputMode === 'text' ? (
                <div>
                    <label htmlFor="lyrics-input" className="block text-sm font-medium text-gray-400 mb-2">Original Lyrics</label>
                    <textarea id="lyrics-input" rows={8} value={lyrics} onChange={e => setLyrics(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Paste the lyrics you want to reimagine..." />
                </div>
            ) : (
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Audio File (MP3 or WAV)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <div className="flex text-sm text-gray-400">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={handleFileChange} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            {file ? <p className="text-sm text-teal-400">{file.name}</p> : <p className="text-xs text-gray-500">MP3 or WAV</p>}
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Target Genres (Select up to 5)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {genres.map(genre => (
                        <label key={genre} className={`flex items-center p-2 rounded-md border transition-colors cursor-pointer ${selectedGenres.includes(genre) ? 'bg-purple-900/50 border-purple-500' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'} ${selectedGenres.length >= 5 && !selectedGenres.includes(genre) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-purple-600 focus:ring-purple-500"
                                checked={selectedGenres.includes(genre)}
                                disabled={selectedGenres.length >= 5 && !selectedGenres.includes(genre)}
                                onChange={e => handleGenreChange(genre, e.target.checked)}
                            />
                            <span className="ml-2 text-sm text-gray-300">{genre}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label htmlFor="artist-type" className="block text-sm font-medium text-gray-400 mb-2">Artist Type</label>
                <select id="artist-type" value={artistType} onChange={e => setArtistType(e.target.value as ArtistPackType)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option>Male Vocalist</option>
                    <option>Female Vocalist</option>
                    <option>Band</option>
                    <option>Duet</option>
                </select>
            </div>

            <button onClick={handleGenerate} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">
                <SoundPackIcon /> Generate Sound Pack
            </button>
        </div>
    );
    
    const renderSuccess = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-2xl font-bold text-gray-200">Your Sound Pack is Ready!</h3>
                <div className="flex gap-2">
                    <button onClick={handleDownloadReport} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md shadow-md hover:bg-teal-500 transition-colors">Download Report</button>
                    <button onClick={handleReset} className="px-4 py-2 border-2 border-gray-600 text-gray-300 rounded-md hover:bg-gray-700">Start Over</button>
                </div>
            </div>
            {reportData.map((item, index) => (
                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-xl font-bold text-purple-400">{item.genre}</h4>
                    <p className="text-sm italic text-gray-400 mt-1">"{item.creativeConcept}"</p>
                    <div className="mt-4 grid md:grid-cols-2 gap-6">
                        <div className="relative">
                            <h5 className="text-lg font-semibold text-gray-300 mb-2">New Lyrics</h5>
                            <CopyButton textToCopy={item.newLyrics} className="absolute top-0 right-0" />
                            <pre className="whitespace-pre-wrap font-sans text-gray-300 text-sm bg-gray-800/50 p-3 rounded-md h-64 overflow-y-auto">{item.newLyrics}</pre>
                        </div>
                         <div className="relative">
                            <h5 className="text-lg font-semibold text-gray-300 mb-2">Style Guide</h5>
                            <CopyButton textToCopy={item.styleGuide} className="absolute top-0 right-0" />
                            <pre className="whitespace-pre-wrap font-sans text-gray-300 text-sm bg-gray-800/50 p-3 rounded-md h-64 overflow-y-auto">{item.styleGuide}</pre>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Sound Pack Generator
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Instantly reimagine your song in multiple genres.
            </p>

            {error && <ErrorMessage message={error} onRetry={() => { setError(null); setStatus('prompt'); }} />}
            
            {status === 'generating' ? (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">{generationMessage}</p>
                </div>
            ) : status === 'success' ? (
                renderSuccess()
            ) : (
                renderForm()
            )}
        </div>
    );
};