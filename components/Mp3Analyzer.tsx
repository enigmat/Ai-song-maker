import React, { useState, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { analyzeSong } from '../services/geminiService';
import type { AnalysisReport } from '../types';
import { DownloadButton } from './DownloadButton';
import { ReportViewer } from './ReportViewer';
import { genres, moods } from '../constants/music';

declare var ID3Writer: any;

const UploadIcon = () => (
  <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" strokeWidth="1.5" stroke="currentColor" fill="none" />
  </svg>
);

const AnalyzerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
);

const AddArtIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
);

const ScoreCard: React.FC<{ label: string; score: number }> = ({ label, score }) => {
    const getScoreColor = (s: number) => {
        if (s >= 85) return 'text-green-400';
        if (s >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg text-center border border-gray-700">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`text-4xl font-bold mt-1 ${getScoreColor(score)}`}>{score}</p>
        </div>
    );
};


export const Mp3Analyzer: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'success' | 'error' | 'processing_art' | 'art_success'>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [coverArt, setCoverArt] = useState<File | null>(null);
    const [genre, setGenre] = useState(genres[0]);
    const [vibe, setVibe] = useState(moods[0]);
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [downloadableUrl, setDownloadableUrl] = useState<string | null>(null);
    const [downloadableFileName, setDownloadableFileName] = useState<string>('');
    const [lastAction, setLastAction] = useState<'analyze' | 'add_art' | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);


    const handleFileSelect = (selectedFile: File | null) => {
        if (selectedFile) {
            if (!selectedFile.type.startsWith('audio/mpeg') && !selectedFile.name.toLowerCase().endsWith('.mp3')) {
                setError('Please select a valid MP3 audio file.');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setCoverArt(null);
            setError(null);
            setStatus('idle');
        }
    };

    const handleCoverArtSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.type.startsWith('image/')) {
                setError('Please select a valid image file (e.g., JPEG, PNG).');
                setCoverArt(null);
                return;
            }
            setCoverArt(selectedFile);
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
        if (e.target.files?.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleAnalyze = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLastAction('analyze');

        if (!file) {
            setError('Please select a file first.');
            return;
        }
        
        setStatus('analyzing');
        setError(null);
        setReport(null);
        try {
            // FIX: Corrected the arguments passed to analyzeSong to match its signature.
            const analysisReport = await analyzeSong(file.name, 'Analyzed Artist', 'solo', `Listeners of ${genre} with a ${vibe} mood`);
            setReport(analysisReport);
            setStatus('success');
        } catch (err) {
            console.error('Analysis failed:', err);
            setError('Failed to analyze the song. The AI model may be overloaded. Please try again.');
            setStatus('error');
        }
    };
    
    const handleAddArt = async () => {
        setLastAction('add_art');
        if (!file || !coverArt) {
            setError('Please select an MP3 file and a cover image.');
            return;
        }
        setStatus('processing_art');
        setError(null);

        try {
            const mp3Buffer = await file.arrayBuffer();
            const coverArtBuffer = await coverArt.arrayBuffer();

            const writer = new ID3Writer(mp3Buffer);
            writer.setFrame('APIC', {
                type: 3, // Cover (front)
                data: coverArtBuffer,
                description: 'Cover',
            });
            writer.addTag();

            const taggedMp3Blob = writer.getBlob();
            const url = URL.createObjectURL(taggedMp3Blob);
            setDownloadableUrl(url);
            setDownloadableFileName(file.name);
            setStatus('art_success');

        } catch (err) {
            console.error('Adding art failed:', err);
            setError('Failed to add album art. The MP3 file might be corrupted.');
            setStatus('error');
        }
    };

    const handleReset = useCallback(() => {
        setStatus('idle');
        setFile(null);
        setGenre(genres[0]);
        setCoverArt(null);
        setVibe(moods[0]);
        setReport(null);
        setError(null);
        setLastAction(null);
        if (downloadableUrl) URL.revokeObjectURL(downloadableUrl);
        setDownloadableUrl(null);
        setDownloadableFileName('');
        setShowReportModal(false);
    }, [downloadableUrl]);

    if (status === 'success' && report) {
        return (
            <>
            {showReportModal && (
                <ReportViewer
                    report={report}
                    fileName={file?.name || 'Unknown File'}
                    onClose={() => setShowReportModal(false)}
                />
            )}
            <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 animate-fade-in text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-500 text-transparent bg-clip-text">
                    Analysis Summary
                </h2>
                <p className="text-center text-gray-400 mb-6 break-words">For: <span className="font-semibold text-gray-300">{file?.name}</span></p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    <ScoreCard label="Commercial Potential" score={report.ratings.commercialPotential.score} />
                    <ScoreCard label="Originality" score={report.ratings.originality.score} />
                    <ScoreCard label="Composition" score={report.ratings.composition.score} />
                    <ScoreCard label="Production Quality" score={report.ratings.productionQuality.score} />
                </div>
                
                <p className="mt-6 text-gray-400 max-w-xl mx-auto">{report.summary}</p>
                
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                     <button onClick={() => setShowReportModal(true)} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
                        View Full Report
                    </button>
                    <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white transition-all duration-300">
                        Analyze Another
                    </button>
                </div>
            </div>
            </>
        );
    }
    
    if (status === 'art_success' && downloadableUrl) {
        return (
            <div className="text-center p-8 bg-gray-800/50 rounded-xl animate-fade-in border border-gray-700">
                <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-green-900/50 border border-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-green-400">Success!</h2>
                <p className="mt-2 text-gray-300">Your MP3 with new album art is ready.</p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <DownloadButton blobUrl={downloadableUrl} fileName={downloadableFileName} />
                    <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all duration-300">
                        Process Another File
                    </button>
                </div>
            </div>
        );
    }

    const isProcessing = status === 'analyzing' || status === 'processing_art';

    const handleRetry = () => {
        if (lastAction === 'analyze') {
            handleAnalyze();
        }
        // No retry for 'add_art' for now, but could be added here.
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-1 text-gray-200">MP3 Analyzer & Editor</h2>
            <p className="text-center text-gray-400 mb-6">Get an AI critique or add album art to your MP3.</p>
            {error && (
                <ErrorMessage 
                    message={error} 
                    onRetry={status === 'error' && lastAction === 'analyze' ? handleRetry : undefined}
                />
            )}
            <form onSubmit={handleAnalyze} className="space-y-4">
                <div
                    onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                    className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                    onClick={() => document.getElementById('mp3-file-input')?.click()}
                >
                    <input id="mp3-file-input" type="file" accept=".mp3,audio/mpeg" onChange={handleFileChange} className="hidden" disabled={isProcessing} />
                    <div className="text-center">
                        <UploadIcon />
                        {file ? (
                             <p className="mt-2 text-lg font-semibold text-teal-400 truncate" title={file.name}>{file.name}</p>
                        ) : (
                            <>
                                <p className="mt-2 text-lg font-semibold text-gray-300">Drag & Drop your MP3 file here</p>
                                <p className="mt-1 text-sm text-gray-400">or click to select a file</p>
                            </>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="genre" className="block text-sm font-medium text-gray-400 mb-2">Genre</label>
                        <select
                          id="genre"
                          value={genre}
                          onChange={e => setGenre(e.target.value)}
                          disabled={isProcessing}
                          className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            {genres.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="vibe" className="block text-sm font-medium text-gray-400 mb-2">Vibe</label>
                         <select
                           id="vibe"
                           value={vibe}
                           onChange={e => setVibe(e.target.value)}
                           disabled={isProcessing}
                           className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                         >
                            {moods.map(v => <option key={v} value={v}>{v}</option>)}
                         </select>
                    </div>
                </div>
                
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <label htmlFor="mp3-cover-art-input" className="block text-lg font-medium text-gray-300 mb-2">Add/Change Album Art (Optional)</label>
                    <div className="flex items-center gap-4">
                        <input id="mp3-cover-art-input" type="file" accept="image/jpeg,image/png" onChange={handleCoverArtSelect} className="hidden" disabled={isProcessing} />
                        <button type="button" onClick={() => document.getElementById('mp3-cover-art-input')?.click()} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors" disabled={isProcessing || !file}>
                            Choose Image...
                        </button>
                        {coverArt && (
                            <div className="flex items-center gap-2 text-gray-300 text-sm">
                                <span className="font-semibold text-teal-400 truncate" title={coverArt.name}>{coverArt.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-2 pt-4 border-t border-gray-700 flex flex-col sm:flex-row gap-4">
                    <button type="submit" disabled={isProcessing || !file} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                        {status === 'analyzing' ? <><LoadingSpinner /> Analyzing...</> : <><AnalyzerIcon /> Analyze Song</>}
                    </button>
                    <button type="button" onClick={handleAddArt} disabled={isProcessing || !file || !coverArt} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                        {status === 'processing_art' ? <><LoadingSpinner /> Processing...</> : <><AddArtIcon /> Add Art & Download</>}
                    </button>
                </div>
            </form>
        </div>
    );
};