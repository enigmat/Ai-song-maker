import React, { useState, useCallback, useEffect, useRef } from 'react';
import { enhanceLyrics, transcribeAudio } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

const EnhancerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const UploadIcon = () => (
  <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(() => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => console.error("Failed to copy text: ", err));
    }, [textToCopy]);

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-sm font-semibold px-3 py-1 bg-gray-700 text-gray-300 rounded-md shadow-sm hover:bg-purple-600 hover:text-white transition-all duration-200"
            aria-label={isCopied ? "Lyrics copied" : "Copy enhanced lyrics"}
            title={isCopied ? "Copied!" : "Copy to clipboard"}
        >
            {isCopied ? (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Copied
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>
                    Copy
                </>
            )}
        </button>
    );
};

interface VocalToolsProps {}

export const VocalTools: React.FC<VocalToolsProps> = () => {
    const [mode, setMode] = useState<'paste' | 'transcribe'>('paste');
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [originalLyrics, setOriginalLyrics] = useState('');
    const [enhancedLyrics, setEnhancedLyrics] = useState('');
    const [displayedEnhancedLyrics, setDisplayedEnhancedLyrics] = useState('');
    
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [processingTask, setProcessingTask] = useState<'transcribing' | 'enhancing' | null>(null);
    const [lastAction, setLastAction] = useState<'transcribe' | 'enhance' | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'success' && processingTask === 'enhancing' && enhancedLyrics) {
            setDisplayedEnhancedLyrics(''); 
            let i = 0;
            const typingInterval = 10;
            const typeCharacter = () => {
                if (i < enhancedLyrics.length) {
                    setDisplayedEnhancedLyrics(prev => prev + enhancedLyrics.charAt(i));
                    i++;
                    setTimeout(typeCharacter, typingInterval);
                }
            };
            const timeoutId = setTimeout(typeCharacter, typingInterval);
            return () => clearTimeout(timeoutId);
        } else if (status === 'success' && processingTask === 'transcribing') {
            setDisplayedEnhancedLyrics(originalLyrics);
        }
    }, [enhancedLyrics, originalLyrics, status, processingTask]);

    const handleEnhance = async () => {
        if (!originalLyrics.trim()) {
            setError('Please enter some lyrics to enhance.');
            return;
        }
        setStatus('processing');
        setProcessingTask('enhancing');
        setLastAction('enhance');
        setError(null);
        setEnhancedLyrics('');
        setDisplayedEnhancedLyrics('');
        try {
            const result = await enhanceLyrics(originalLyrics);
            setEnhancedLyrics(result);
            setStatus('success');
        } catch (err) {
            console.error('Lyrics enhancement failed:', err);
            setError('Failed to enhance lyrics. The AI model might be busy. Please try again.');
            setStatus('error');
        }
    };
    
    const handleTranscribe = async () => {
        if (!file) {
            setError('Please select an audio file to transcribe.');
            return;
        }
        setStatus('processing');
        setProcessingTask('transcribing');
        setLastAction('transcribe');
        setError(null);
        setOriginalLyrics('');
        setEnhancedLyrics('');
        setDisplayedEnhancedLyrics('');
        try {
            const result = await transcribeAudio(file);
            setOriginalLyrics(result);
            setStatus('success');
        } catch (err) {
             console.error('Transcription failed:', err);
            setError('Failed to transcribe audio. The AI model might be busy or the file format is not supported. Please try again.');
            setStatus('error');
        }
    };
    
    const handleFileSelect = (selectedFile: File | null) => {
        if (selectedFile) {
            const isValid = selectedFile.type.startsWith('audio/');
            if (!isValid) {
                setError('Please select a valid audio file.');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleReset = useCallback(() => {
        setFile(null);
        setOriginalLyrics('');
        setEnhancedLyrics('');
        setDisplayedEnhancedLyrics('');
        setStatus('idle');
        setProcessingTask(null);
        setError(null);
        setLastAction(null);
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
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length > 0) handleFileSelect(e.target.files[0]);
    };
    
    const handleRetry = () => {
        if(lastAction === 'enhance') handleEnhance();
        if(lastAction === 'transcribe') handleTranscribe();
    }

    const renderResults = () => {
        const isEnhancing = status === 'processing' && processingTask === 'enhancing';
        const isTypingFinished = enhancedLyrics.length > 0 && enhancedLyrics.length === displayedEnhancedLyrics.length;
        
        return (
            <div className="animate-fade-in">
                <div className="mt-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex-1 w-full flex flex-col">
                        <h3 className="text-xl font-bold text-gray-300 mb-3">{mode === 'paste' ? 'Original' : 'Transcribed'} Lyrics</h3>
                        <textarea
                            value={originalLyrics}
                            onChange={(e) => setOriginalLyrics(e.target.value)}
                            className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all resize-y flex-grow min-h-[300px] max-h-[60vh] font-sans text-gray-300"
                        />
                    </div>

                    <div className="hidden md:flex text-purple-500/80 transform rotate-90 md:rotate-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex-1 w-full flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold text-gray-300">Enhanced Lyrics</h3>
                            {(isTypingFinished || !isEnhancing) && enhancedLyrics && <CopyButton textToCopy={enhancedLyrics} />}
                        </div>
                        <div className="bg-gray-800/50 p-3 rounded-md min-h-[300px] max-h-[60vh] overflow-y-auto flex-grow">
                             {isEnhancing ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 pt-20">
                                    <LoadingSpinner />
                                    <p className="mt-4 animate-pulse">Enhancing lyrics...</p>
                                </div>
                            ) : (
                                <pre className="whitespace-pre-wrap font-sans text-gray-300 text-left leading-relaxed text-sm sm:text-base">
                                    {displayedEnhancedLyrics || <span className="text-gray-500">Enhanced lyrics will appear here...</span>}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                     <button
                        onClick={handleEnhance}
                        disabled={status === 'processing' || !originalLyrics.trim()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <EnhancerIcon />
                        {processingTask === 'enhancing' ? 'Re-Enhance' : 'Enhance Lyrics'}
                    </button>
                    <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white transition-all duration-300">
                        Start Over
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Vocal & Lyrics Tools
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Transcribe a vocal track or enhance existing lyrics with AI.
            </p>
            
            <div className="flex justify-center mb-6">
                <div className="flex items-center gap-1 rounded-lg bg-gray-900 p-1 border border-gray-700">
                    <button onClick={() => setMode('paste')} aria-pressed={mode === 'paste'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'paste' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                        Paste Lyrics
                    </button>
                    <button onClick={() => setMode('transcribe')} aria-pressed={mode === 'transcribe'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'transcribe' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                        Transcribe Vocals
                    </button>
                </div>
            </div>

            {error && <ErrorMessage message={error} onRetry={handleRetry} />}
            
            {status === 'processing' && (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">
                        {processingTask === 'transcribing' ? 'Transcribing audio...' : 'Enhancing lyrics...'}
                    </p>
                </div>
            )}
            
            {status === 'success' && renderResults()}

            {status === 'idle' && mode === 'paste' && (
                 <div className="space-y-4 animate-fade-in">
                    <div>
                        <label htmlFor="lyrics-input" className="block text-sm font-medium text-gray-400 mb-2">Your Lyrics</label>
                        <textarea id="lyrics-input" rows={12} value={originalLyrics} onChange={(e) => setOriginalLyrics(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all resize-y" placeholder="Paste or write your lyrics here..." />
                    </div>
                    <button onClick={handleEnhance} disabled={!originalLyrics.trim()} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                        <EnhancerIcon /> Enhance Lyrics
                    </button>
                </div>
            )}
            
            {status === 'idle' && mode === 'transcribe' && (
                <div className="space-y-4 animate-fade-in">
                    <div onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop} className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`} onClick={() => document.getElementById('vocal-file-input')?.click()}>
                        <input id="vocal-file-input" type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                        <div className="text-center">
                            <UploadIcon />
                             {file ? (
                                <p className="mt-2 text-lg font-semibold text-teal-400 truncate" title={file.name}>{file.name}</p>
                            ) : (
                                <>
                                    <p className="mt-2 text-lg font-semibold text-gray-300">Drag & Drop Vocal Track</p>
                                    <p className="mt-1 text-sm text-gray-400">or click to select a file</p>
                                </>
                            )}
                        </div>
                    </div>
                     <div className="p-3 bg-yellow-900/30 text-yellow-300/80 border border-yellow-500/30 rounded-lg text-sm text-center">
                        <strong>Tip:</strong> For best results, use a clean, dry, a cappella (vocals only) track.
                    </div>
                    <button onClick={handleTranscribe} disabled={!file} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" /></svg>
                        Transcribe Lyrics
                    </button>
                </div>
            )}

        </div>
    );
};