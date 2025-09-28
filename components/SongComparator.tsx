import React, { useState, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { compareSongs, ComparisonReport, SongComparisonMetrics } from '../services/geminiService';
import { genres, moods } from '../constants/music';

const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11.685 5.206A1 1 0 0112.553 4H14a1 1 0 011 1v2a1 1 0 01-1 1h-1.447a1 1 0 01-.868-.596l-2-4a1 1 0 011.002-1.404z" />
        <path d="M8.315 5.206A1 1 0 007.447 4H6a1 1 0 00-1 1v2a1 1 0 001 1h1.447a1 1 0 00.868-.596l2-4a1 1 0 00-1.002-1.404z" />
        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M10 14a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);
const UploadIcon = () => (
  <svg className="w-8 h-8 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


const FileInput: React.FC<{
    songNumber: 1 | 2;
    file: File | null;
    onFileSelect: (file: File | null) => void;
    disabled: boolean;
}> = ({ songNumber, file, onFileSelect, disabled }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragIn = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.items?.length > 0) setIsDragging(true); }, []);
    const handleDragOut = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, [onFileSelect]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length > 0) onFileSelect(e.target.files[0]);
    };

    return (
        <div 
            onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 h-full flex flex-col justify-center items-center text-center ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
        >
            <input ref={fileInputRef} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={handleFileChange} className="hidden" disabled={disabled} />
            <UploadIcon />
            <p className="mt-2 text-sm font-semibold text-gray-300">
                {file ? <span className="text-teal-400 break-all">{file.name}</span> : `Drop Song ${songNumber} (MP3/WAV)`}
            </p>
            {!file && <p className="mt-1 text-xs text-gray-400">or click to select</p>}
        </div>
    );
};

const WinnerCard: React.FC<{ title: string; winner: 'song1' | 'song2' | 'tie'; justification: string; song1Name?: string; song2Name?: string; }> = ({ title, winner, justification, song1Name, song2Name }) => {
    const winnerName = winner === 'song1' ? song1Name : (winner === 'song2' ? song2Name : 'Tie');
    const winnerColor = winner === 'song1' ? 'border-teal-500' : (winner === 'song2' ? 'border-pink-500' : 'border-gray-500');

    return (
        <div className={`bg-gray-900/50 rounded-xl p-4 border-2 ${winnerColor} shadow-lg h-full flex flex-col`}>
            <h3 className="text-lg font-bold text-center text-gray-200">{title}</h3>
            <div className="flex-grow flex flex-col items-center justify-center my-3">
                <TrophyIcon />
                <p className="mt-2 text-xl font-bold text-yellow-400">{winnerName || `Song ${winner.slice(-1)}`}</p>
            </div>
            <p className="text-sm text-gray-400 text-center">{justification}</p>
        </div>
    );
};

const AnalysisColumn: React.FC<{ title: string; analysis: SongComparisonMetrics; recommendations: string[]; color: string }> = ({ title, analysis, recommendations, color }) => (
    <div className={`p-4 rounded-lg bg-gray-900/50 border border-gray-700 space-y-4`}>
        <h3 className={`text-xl font-bold text-center ${color}`}>{title}</h3>
        <p className="text-sm text-gray-400 italic text-center">{analysis.summary}</p>
        <div className="space-y-2 text-sm">
            {Object.entries(analysis).filter(([key]) => key !== 'summary').map(([key, value]) => (
                <div key={key} className="bg-gray-800/50 p-2 rounded-md">
                    <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        {/* FIX: `value` is of type unknown here. Cast to access `score` property. */}
                        <span className={`font-bold text-lg ${color}`}>{(value as any).score}</span>
                    </div>
                    {/* FIX: `value` is of type unknown here. Cast to access `justification` property. */}
                    <p className="text-xs text-gray-500">{(value as any).justification}</p>
                </div>
            ))}
        </div>
         <div>
            <h4 className="font-semibold text-gray-300 mb-1">Recommendations:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
                {recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
            </ul>
        </div>
    </div>
);


export const SongComparator: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'comparing' | 'success' | 'error'>('idle');
    const [song1File, setSong1File] = useState<File | null>(null);
    const [song2File, setSong2File] = useState<File | null>(null);
    const [song1Genre, setSong1Genre] = useState(genres[0]);
    const [song1Vibe, setSong1Vibe] = useState(moods[0]);
    const [song2Genre, setSong2Genre] = useState(genres[0]);
    const [song2Vibe, setSong2Vibe] = useState(moods[0]);
    const [report, setReport] = useState<ComparisonReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (file: File | null, songNumber: 1 | 2) => {
        if (file) {
            const isValid = file.type.startsWith('audio/mpeg') || file.name.toLowerCase().endsWith('.mp3') || file.type.startsWith('audio/wav') || file.name.toLowerCase().endsWith('.wav');
            if (!isValid) {
                setError(`Please select a valid MP3 or WAV file for Song ${songNumber}.`);
                return;
            }
        }
        setError(null);
        if (songNumber === 1) setSong1File(file);
        else setSong2File(file);
    };

    const handleCompare = async () => {
        if (!song1File || !song2File) {
            setError('Please select two songs to compare.');
            return;
        }
        setStatus('comparing');
        setError(null);
        setReport(null);
        try {
            const result = await compareSongs(
                song1File.name, song1Genre, song1Vibe,
                song2File.name, song2Genre, song2Vibe
            );
            setReport(result);
            setStatus('success');
        } catch (err) {
            console.error('Comparison failed:', err);
            setError('Failed to compare songs. The AI model may be overloaded. Please try again.');
            setStatus('error');
        }
    };

    const handleReset = useCallback(() => {
        setStatus('idle');
        setSong1File(null);
        setSong2File(null);
        setSong1Genre(genres[0]);
        setSong1Vibe(moods[0]);
        setSong2Genre(genres[0]);
        setSong2Vibe(moods[0]);
        setReport(null);
        setError(null);
    }, []);

    if (status === 'success' && report) {
        return (
            <div className="space-y-8 p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 animate-fade-in">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">Comparison Result</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <WinnerCard title="Overall Winner" {...report.overallWinner} song1Name={song1File?.name} song2Name={song2File?.name} />
                    <WinnerCard title="Marketability" {...report.marketabilityWinner} song1Name={song1File?.name} song2Name={song2File?.name} />
                    <WinnerCard title="Spotify Potential" {...report.spotifyWinner} song1Name={song1File?.name} song2Name={song2File?.name} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnalysisColumn title={song1File?.name || 'Song 1'} analysis={report.song1Analysis} recommendations={report.recommendationsForSong1} color="text-teal-400" />
                    <AnalysisColumn title={song2File?.name || 'Song 2'} analysis={report.song2Analysis} recommendations={report.recommendationsForSong2} color="text-pink-400" />
                </div>

                <div className="text-center pt-4">
                    <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all duration-300">
                        Compare Other Songs
                    </button>
                </div>
            </div>
        );
    }
    
    const isProcessing = status === 'comparing';

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-1 text-gray-200">Song Comparator</h2>
            <p className="text-center text-gray-400 mb-6">Which track has more hit potential? Let our AI A&R scout decide.</p>

            {error && <ErrorMessage message={error} onRetry={status === 'error' ? handleCompare : undefined} />}

            {isProcessing ? (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">Comparing tracks...</p>
                    <p className="text-gray-500">Our AI is analyzing the potential of your songs.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Song 1 */}
                        <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-teal-500/30">
                            <h3 className="text-xl font-semibold text-center text-teal-400">Song 1</h3>
                            <FileInput songNumber={1} file={song1File} onFileSelect={(f) => handleFileSelect(f, 1)} disabled={isProcessing} />
                             <div>
                                <label htmlFor="s1-genre" className="block text-sm font-medium text-gray-400 mb-1">Genre</label>
                                <select id="s1-genre" value={song1Genre} onChange={e => setSong1Genre(e.target.value)} disabled={isProcessing} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-1 focus:ring-teal-500 text-sm">
                                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="s1-vibe" className="block text-sm font-medium text-gray-400 mb-1">Vibe / Mood</label>
                                <select id="s1-vibe" value={song1Vibe} onChange={e => setSong1Vibe(e.target.value)} disabled={isProcessing} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-1 focus:ring-teal-500 text-sm">
                                    {moods.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Song 2 */}
                        <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-pink-500/30">
                             <h3 className="text-xl font-semibold text-center text-pink-400">Song 2</h3>
                             <FileInput songNumber={2} file={song2File} onFileSelect={(f) => handleFileSelect(f, 2)} disabled={isProcessing} />
                             <div>
                                <label htmlFor="s2-genre" className="block text-sm font-medium text-gray-400 mb-1">Genre</label>
                                <select id="s2-genre" value={song2Genre} onChange={e => setSong2Genre(e.target.value)} disabled={isProcessing} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-1 focus:ring-pink-500 text-sm">
                                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="s2-vibe" className="block text-sm font-medium text-gray-400 mb-1">Vibe / Mood</label>
                                <select id="s2-vibe" value={song2Vibe} onChange={e => setSong2Vibe(e.target.value)} disabled={isProcessing} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-1 focus:ring-pink-500 text-sm">
                                    {moods.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <button onClick={handleCompare} disabled={isProcessing || !song1File || !song2File} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                             Compare Songs
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};