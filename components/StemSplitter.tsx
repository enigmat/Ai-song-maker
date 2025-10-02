import React, { useState, useCallback, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { audioBufferToMp3 } from '../services/audioService';

interface StemSplitterProps {
    onInstrumentalSelect: (blob: Blob) => void;
    onVocalSelect: (blob: Blob) => void;
}

const UploadIcon = () => (
    <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SplitterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.293 3.293a1 1 0 011.414 1.414l-13 13A1 1 0 014 18H3a1 1 0 01-1-1v-1a1 1 0 01.293-.707l13-13zM10 4a1 1 0 10-2 0v1.586l-1.293-1.293a1 1 0 00-1.414 1.414L6.586 7 5.293 8.293a1 1 0 001.414 1.414L8 8.414v1.586a1 1 0 102 0v-1.586l1.293 1.293a1 1 0 001.414-1.414L11.414 7l1.293-1.293a1 1 0 00-1.414-1.414L10 5.586V4z" />
        <path d="M16 4a2 2 0 11-4 0 2 2 0 014 0zM6 14a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const UseAsBeatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-1-1z" />
    </svg>
);

const VocalToolsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" />
    </svg>
);


export const StemSplitter: React.FC<StemSplitterProps> = ({ onInstrumentalSelect, onVocalSelect }) => {
    const [status, setStatus] = useState<'idle' | 'splitting' | 'success' | 'error'>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);

    const [vocalUrl, setVocalUrl] = useState<string | null>(null);
    const [instrumentalUrl, setInstrumentalUrl] = useState<string | null>(null);
    const [instrumentalBlob, setInstrumentalBlob] = useState<Blob | null>(null);
    const [vocalBlob, setVocalBlob] = useState<Blob | null>(null);


    // Clean up Object URLs when component unmounts or new files are processed
    useEffect(() => {
        return () => {
            if (vocalUrl) URL.revokeObjectURL(vocalUrl);
            if (instrumentalUrl) URL.revokeObjectURL(instrumentalUrl);
        };
    }, [vocalUrl, instrumentalUrl]);

    const handleFileSelect = (selectedFile: File | null) => {
        if (selectedFile) {
            const isValid = selectedFile.type.startsWith('audio/mpeg') || selectedFile.name.toLowerCase().endsWith('.mp3') || selectedFile.type.startsWith('audio/wav') || selectedFile.name.toLowerCase().endsWith('.wav');
            if (!isValid) {
                setError('Please select a valid MP3 or WAV file.');
                setFile(null);
                return;
            }
            handleReset();
            setFile(selectedFile);
        }
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
        if (e.target.files?.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleSplit = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }
        setStatus('splitting');
        setError(null);
        setProgress(0);
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            setProgress(5);
            const arrayBuffer = await file.arrayBuffer();
            setProgress(10);
            const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setProgress(25);

            if (originalBuffer.numberOfChannels < 2) {
                throw new Error('The audio file must be stereo to perform stem separation.');
            }

            const left = originalBuffer.getChannelData(0);
            const right = originalBuffer.getChannelData(1);
            const len = originalBuffer.length;
            const sampleRate = originalBuffer.sampleRate;
            
            // Create buffer for instrumental (side channel: L-R)
            const instrumentalBuffer = audioContext.createBuffer(1, len, sampleRate);
            const instrumentalData = instrumentalBuffer.getChannelData(0);
            for (let i = 0; i < len; i++) {
                instrumentalData[i] = (left[i] - right[i]) / 2;
            }

            // Create buffer for vocals (center channel: L+R)
            const vocalBuffer = audioContext.createBuffer(1, len, sampleRate);
            const vocalData = vocalBuffer.getChannelData(0);
            for (let i = 0; i < len; i++) {
                vocalData[i] = (left[i] + right[i]) / 2;
            }
            
            const instrumentalMp3Blob = audioBufferToMp3(instrumentalBuffer, (p) => {
                // This step is from 25% to 60%
                setProgress(25 + (p * 0.35));
            });
            const vocalMp3Blob = audioBufferToMp3(vocalBuffer, (p) => {
                // This step is from 60% to 95%
                setProgress(60 + (p * 0.35));
            });
            
            setInstrumentalBlob(instrumentalMp3Blob);
            setInstrumentalUrl(URL.createObjectURL(instrumentalMp3Blob));
            setVocalBlob(vocalMp3Blob);
            setVocalUrl(URL.createObjectURL(vocalMp3Blob));
            
            setProgress(100);
            setStatus('success');

        } catch (err: any) {
            console.error('Stem separation failed:', err);
            setError(err.message || 'Failed to process audio. The file might be corrupt or in an unsupported format.');
            setStatus('error');
        }
    };

    const handleUseAsBeat = () => {
        if (instrumentalBlob) {
            onInstrumentalSelect(instrumentalBlob);
        }
    };

    const handleUseVocals = () => {
        if (vocalBlob) {
            onVocalSelect(vocalBlob);
        }
    };

    const handleReset = useCallback(() => {
        setStatus('idle');
        setFile(null);
        setError(null);
        setProgress(0);
        if (vocalUrl) URL.revokeObjectURL(vocalUrl);
        if (instrumentalUrl) URL.revokeObjectURL(instrumentalUrl);
        setVocalUrl(null);
        setInstrumentalUrl(null);
        setInstrumentalBlob(null);
        setVocalBlob(null);
    }, [vocalUrl, instrumentalUrl]);
    
    if (status === 'success') {
        const baseFileName = file?.name.substring(0, file.name.lastIndexOf('.')) || 'song';
        return (
            <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 animate-fade-in">
                <div className="text-center">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-500 text-transparent bg-clip-text">Splitting Complete!</h2>
                    <p className="mt-2 text-gray-400">Download your separated audio files below.</p>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-purple-400">A Cappella (Vocals)</h3>
                            <p className="text-sm text-gray-500 mt-1 mb-4">The isolated vocal track.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                           <a href={vocalUrl!} download={`${baseFileName}_acappella.mp3`} className="flex-1 w-full inline-flex items-center justify-center gap-2 font-semibold px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
                               <DownloadIcon /> Download
                           </a>
                           <button onClick={handleUseVocals} className="flex-1 w-full inline-flex items-center justify-center gap-2 font-semibold px-4 py-3 bg-gray-700 text-gray-200 rounded-lg shadow-md hover:bg-gray-600 transition-all duration-300 transform hover:scale-105">
                               <VocalToolsIcon /> Transcribe
                           </button>
                        </div>
                    </div>
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-teal-400">Instrumental</h3>
                            <p className="text-sm text-gray-500 mt-1 mb-4">The backing track without vocals.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <a href={instrumentalUrl!} download={`${baseFileName}_instrumental.mp3`} className="flex-1 w-full inline-flex items-center justify-center gap-2 font-semibold px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105">
                                <DownloadIcon /> Download
                            </a>
                            <button onClick={handleUseAsBeat} className="flex-1 w-full inline-flex items-center justify-center gap-2 font-semibold px-4 py-3 bg-gray-700 text-gray-200 rounded-lg shadow-md hover:bg-gray-600 transition-all duration-300 transform hover:scale-105">
                                <UseAsBeatIcon /> Use as Beat
                            </button>
                        </div>
                    </div>
                </div>
                 <div className="mt-8 text-center">
                    <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all duration-300">
                        Split Another Song
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Audio Stem Splitter
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Separate a stereo audio file into vocal and instrumental tracks.
            </p>
            
            {error && <ErrorMessage message={error} onRetry={status === 'error' ? handleSplit : undefined} />}

            {status === 'splitting' ? (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg">Splitting audio stems...</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-300 ease-linear" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-gray-500 mt-2 font-mono">{Math.round(progress)}%</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div
                        onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                        className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                        onClick={() => document.getElementById('splitter-file-input')?.click()}
                    >
                        <input id="splitter-file-input" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={handleFileChange} className="hidden" disabled={status === 'splitting'} />
                        <div className="text-center">
                            <UploadIcon />
                            {file ? (
                                <div className="mt-2 text-center">
                                    <p className="text-lg font-semibold text-teal-400 truncate" title={file.name}>{file.name}</p>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent file picker from opening
                                            handleReset();
                                        }}
                                        className="mt-1 text-xs px-2 py-1 text-gray-400 hover:text-white hover:bg-red-600/50 rounded-md transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="mt-2 text-lg font-semibold text-gray-300">Drag & Drop MP3/WAV file</p>
                                    <p className="mt-1 text-sm text-gray-400">or click to select a file</p>
                                </>
                            )}
                        </div>
                    </div>
                     <div className="p-3 bg-yellow-900/30 text-yellow-300/80 border border-yellow-500/30 rounded-lg text-sm text-center">
                        <strong>Note:</strong> This tool uses phase cancellation, a classic technique for vocal removal. Quality depends on the original stereo mix. It works best when lead vocals are panned to the center of the track.
                    </div>
                    <button
                        onClick={handleSplit}
                        disabled={status === 'splitting' || !file}
                        className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <SplitterIcon />
                        Split Song
                    </button>
                </div>
            )}
        </div>
    );
};