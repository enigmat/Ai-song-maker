import React, { useState, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { analyzeVocalProfile, compareVocalProfiles } from '../services/geminiService';
import type { VocalAnalysis, VocalComparison } from '../types';

const UploadIcon = () => (
    <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const FileInput: React.FC<{
    title: string;
    file: File | null;
    onFileSelect: (file: File | null) => void;
    onClear: () => void;
    disabled: boolean;
}> = ({ title, file, onFileSelect, onClear, disabled }) => {
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
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-center text-gray-300 mb-3">{title}</h3>
            <div
                onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 h-full flex flex-col justify-center items-center text-center ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
            >
                <input ref={fileInputRef} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={handleFileChange} className="hidden" disabled={disabled} />
                <UploadIcon />
                <p className="mt-2 text-sm text-gray-400">Drop MP3/WAV file</p>
            </div>
            {file && (
                <div className="mt-3 flex items-center justify-between bg-gray-800/50 p-2 rounded-md">
                    <p className="text-sm text-teal-400 truncate flex-grow" title={file.name}>{file.name}</p>
                    <button onClick={onClear} className="ml-2 text-gray-500 hover:text-white p-1 rounded-full flex-shrink-0">&times;</button>
                </div>
            )}
        </div>
    );
};

const AnalysisCard: React.FC<{ title: string; analysis: VocalAnalysis; fileName: string }> = ({ title, analysis, fileName }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-3">
        <h3 className="text-xl font-bold text-center text-purple-400">{title}</h3>
        <p className="text-xs text-center text-gray-500 truncate -mt-2" title={fileName}>{fileName}</p>
        {Object.entries(analysis).map(([key, value]) => (
            <div key={key} className="bg-gray-800/50 p-2 rounded-md">
                <p className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-sm font-semibold text-gray-200">{value}</p>
            </div>
        ))}
    </div>
);

const SimilarityCircle: React.FC<{ score: number }> = ({ score }) => {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;

    const getStrokeColor = (s: number) => {
        if (s >= 75) return 'stroke-green-400';
        if (s >= 40) return 'stroke-yellow-400';
        return 'stroke-red-400';
    };

    return (
        <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                    className={`transition-all duration-1000 ease-out ${getStrokeColor(score)}`}
                    strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={circumference}
                    strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50"
                    transform="rotate(-90 50 50)" style={{ strokeDashoffset: offset }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getStrokeColor(score).replace('stroke-', 'text-')}`}>{score}%</span>
                <span className="text-xs text-gray-400">Similar</span>
            </div>
        </div>
    );
};


export const ArtistAnalyzer: React.FC = () => {
    const [status, setStatus] = useState<'prompt' | 'analyzing' | 'success' | 'error'>('prompt');
    const [primaryTrack, setPrimaryTrack] = useState<File | null>(null);
    const [comparisonTrack, setComparisonTrack] = useState<File | null>(null);
    const [result, setResult] = useState<VocalAnalysis | VocalComparison | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!primaryTrack) return;

        setStatus('analyzing');
        setError(null);
        setResult(null);

        try {
            if (comparisonTrack) {
                const comparisonResult = await compareVocalProfiles(primaryTrack, comparisonTrack);
                setResult(comparisonResult);
            } else {
                const analysisResult = await analyzeVocalProfile(primaryTrack);
                setResult(analysisResult);
            }
            setStatus('success');
        } catch (err: any) {
            console.error("Analysis failed:", err);
            setError(err.message || 'Failed to analyze vocals. The AI model may be busy. Please try again.');
            setStatus('error');
        }
    };

    const handleReset = useCallback(() => {
        setStatus('prompt');
        setPrimaryTrack(null);
        setComparisonTrack(null);
        setResult(null);
        setError(null);
    }, []);
    
    const isComparison = !!primaryTrack && !!comparisonTrack;

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Artist Vocal Analyzer
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Analyze the vocal characteristics of a track, or compare two voices for similarity.
            </p>

            {error && <ErrorMessage message={error} onRetry={handleAnalyze} />}

            {status === 'analyzing' && (
                <div className="text-center p-10"><LoadingSpinner size="lg" /><p className="mt-4 text-gray-400 text-lg animate-pulse">{isComparison ? 'Comparing voices...' : 'Analyzing vocals...'}</p></div>
            )}

            {(status === 'prompt' || status === 'error') && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FileInput title="Primary Track" file={primaryTrack} onFileSelect={setPrimaryTrack} onClear={() => setPrimaryTrack(null)} disabled={status === 'analyzing'} />
                        <FileInput title="Comparison Track (Optional)" file={comparisonTrack} onFileSelect={setComparisonTrack} onClear={() => setComparisonTrack(null)} disabled={status === 'analyzing'} />
                    </div>
                    <button onClick={handleAnalyze} disabled={!primaryTrack} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">
                        {isComparison ? 'Compare Voices' : 'Analyze Voice'}
                    </button>
                </div>
            )}

            {status === 'success' && result && (
                <div className="space-y-6 animate-fade-in">
                    {'similarityScore' in result ? (
                        // Comparison View
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1 flex flex-col justify-center items-center bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                    <SimilarityCircle score={result.similarityScore} />
                                    <p className="mt-4 text-sm text-gray-400 text-center">{result.justification}</p>
                                </div>
                                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <AnalysisCard title="Voice 1" analysis={result.voice1Analysis} fileName={primaryTrack?.name || 'Track 1'} />
                                    <AnalysisCard title="Voice 2" analysis={result.voice2Analysis} fileName={comparisonTrack?.name || 'Track 2'} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Single Analysis View
                        <div className="max-w-md mx-auto">
                            <AnalysisCard title="Vocal Analysis" analysis={result} fileName={primaryTrack?.name || 'Track'} />
                        </div>
                    )}
                     <div className="text-center pt-4">
                        <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white">
                            Analyze Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
