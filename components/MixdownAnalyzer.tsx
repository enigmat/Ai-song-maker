import React, { useState, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { MixdownReportViewer } from './MixdownReportViewer';
import { analyzeMixdown } from '../services/geminiService';
import type { MixdownReport } from '../types';

const UploadIcon = () => (
    <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const MixdownAnalyzer: React.FC = () => {
    const [status, setStatus] = useState<'prompt' | 'analyzing' | 'success' | 'error'>('prompt');
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [report, setReport] = useState<MixdownReport | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (selectedFile: File | null) => {
        if (selectedFile) {
            const isValid = selectedFile.type.startsWith('audio/mpeg') || selectedFile.name.toLowerCase().endsWith('.mp3') || selectedFile.type.startsWith('audio/wav') || selectedFile.name.toLowerCase().endsWith('.wav');
            if (!isValid) {
                setError('Please select a valid MP3 or WAV audio file.');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError(null);
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
        if (e.target.files?.length > 0) handleFileSelect(e.target.files[0]);
    };
    
    const handleAnalyze = async () => {
        if (!file) {
            setError("Please select an audio file to analyze.");
            return;
        }
        setStatus('analyzing');
        setError(null);
        setReport(null);
        try {
            const analysis = await analyzeMixdown(file);
            setReport(analysis);
            setStatus('success');
        } catch (err: any) {
            console.error("Mixdown analysis failed:", err);
            setError(err.message || "Failed to analyze the mixdown. The AI model may be busy or the file format is not supported.");
            setStatus('error');
        }
    };

    const handleReset = () => {
        setStatus('prompt');
        setError(null);
        setFile(null);
        setReport(null);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                AI Mixdown Analyzer
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Get instant, expert feedback on your mix.
            </p>

            {error && <ErrorMessage message={error} />}

            {status === 'prompt' && (
                <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
                    <div
                        onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                        className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                        onClick={() => document.getElementById('mix-file-input')?.click()}
                    >
                        <input id="mix-file-input" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={handleFileChange} className="hidden" />
                        <div className="text-center">
                            <UploadIcon />
                            {file ? (
                                <p className="mt-2 text-lg font-semibold text-teal-400 truncate" title={file.name}>{file.name}</p>
                            ) : (
                                <>
                                <p className="mt-2 text-lg font-semibold text-gray-300">Drop your mix here (MP3/WAV)</p>
                                <p className="mt-1 text-sm text-gray-400">or click to select a file</p>
                                </>
                            )}
                        </div>
                    </div>
                    <button onClick={handleAnalyze} disabled={!file} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">
                        Analyze Mixdown
                    </button>
                </div>
            )}
            
            {status === 'analyzing' && (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">AI is listening to your mix...</p>
                </div>
            )}

            {status === 'success' && report && (
                <div className="animate-fade-in">
                    <MixdownReportViewer report={report} fileName={file?.name || 'your mix'} />
                    <div className="text-center mt-8">
                        <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white">
                            Analyze Another Mix
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};