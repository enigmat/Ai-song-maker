import React, { useState, useCallback, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { transcribeAudio, generateSpeechFromText, decode, decodeAudioData } from '../services/geminiService';
import { audioBufferToMp3 } from '../services/audioService';
import { CopyButton } from './CopyButton';

const UploadIcon = () => (
    <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SynthIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M15.5 14.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" />
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        <path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /><path d="M5 5.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /><path d="M10 5a.5.5 0 01.5.5v1.5a.5.5 0 01-1 0V5.5A.5.5 0 0110 5z" />
    </svg>
);

const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

export const VocalSynthesizer: React.FC = () => {
    const [status, setStatus] = useState<'prompt' | 'processing' | 'success' | 'error'>('prompt');
    const [processingMessage, setProcessingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [voice, setVoice] = useState(voices[0]);

    const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
    const [synthesizedAudioUrl, setSynthesizedAudioUrl] = useState<string | null>(null);
    const [synthesizedAudioBlob, setSynthesizedAudioBlob] = useState<Blob | null>(null);
    const [transcribedText, setTranscribedText] = useState('');

    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        return () => {
            if (originalAudioUrl) URL.revokeObjectURL(originalAudioUrl);
            if (synthesizedAudioUrl) URL.revokeObjectURL(synthesizedAudioUrl);
        };
    }, [originalAudioUrl, synthesizedAudioUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        if (selectedFile) {
            const isValid = selectedFile.type.startsWith('audio/');
            if (!isValid) {
                setError('Please select a valid audio file (e.g., MP3, WAV).');
                setFile(null);
                return;
            }
            setError(null);
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
        const droppedFile = e.dataTransfer.files?.[0] || null;
        if (droppedFile) {
            const isValid = droppedFile.type.startsWith('audio/');
            if (!isValid) {
                setError('Please select a valid audio file (e.g., MP3, WAV).');
                setFile(null);
                return;
            }
            setError(null);
            setFile(droppedFile);
            e.dataTransfer.clearData();
        }
    }, []);

    const handleSynthesize = async () => {
        if (!file) return;
        setStatus('processing');
        setError(null);

        try {
            setProcessingMessage('Transcribing original vocals...');
            const text = await transcribeAudio(file);
            if (!text.trim()) throw new Error("Could not detect any lyrics in the audio file.");
            
            setTranscribedText(text);
            setOriginalAudioUrl(URL.createObjectURL(file));

            setProcessingMessage('Synthesizing new voice...');
            const base64Audio = await generateSpeechFromText(text, voice);
            
            setProcessingMessage('Decoding new audio...');
            const decodedBytes = decode(base64Audio);
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);

            setProcessingMessage('Encoding final MP3...');
            const mp3Blob = audioBufferToMp3(audioBuffer);

            setSynthesizedAudioBlob(mp3Blob);
            setSynthesizedAudioUrl(URL.createObjectURL(mp3Blob));

            setStatus('success');

        } catch (err: any) {
            console.error('Vocal synthesis failed:', err);
            setError(err.message || 'An unexpected error occurred during synthesis.');
            setStatus('error');
        }
    };

    const handleReset = () => {
        setStatus('prompt');
        setError(null);
        setFile(null);
        setVoice(voices[0]);
        setTranscribedText('');
        if (originalAudioUrl) URL.revokeObjectURL(originalAudioUrl);
        if (synthesizedAudioUrl) URL.revokeObjectURL(synthesizedAudioUrl);
        setOriginalAudioUrl(null);
        setSynthesizedAudioUrl(null);
        setSynthesizedAudioBlob(null);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Vocal Synthesizer
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Change the voice of a vocal track using AI.
            </p>
            {error && <ErrorMessage message={error} />}

            {status === 'prompt' && (
                <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
                    <div
                        onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                        className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                        onClick={() => document.getElementById('vocal-file-input')?.click()}
                    >
                        <input id="vocal-file-input" type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                        <div className="text-center">
                            <UploadIcon />
                            {file ? (
                                <p className="mt-2 text-lg font-semibold text-teal-400 truncate" title={file.name}>{file.name}</p>
                            ) : (
                                <>
                                <p className="mt-2 text-lg font-semibold text-gray-300">Drop your vocal track (MP3/WAV)</p>
                                <p className="mt-1 text-sm text-gray-400">or click to select a file</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="voice-select" className="block text-sm font-medium text-gray-400 mb-2">Target AI Voice</label>
                        <select id="voice-select" value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                            {voices.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSynthesize} disabled={!file} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">
                        <SynthIcon /> Synthesize Voice
                    </button>
                </div>
            )}
            
            {status === 'processing' && (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">{processingMessage}</p>
                </div>
            )}

            {status === 'success' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">Original Audio</h3>
                            <audio src={originalAudioUrl!} controls className="w-full" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-teal-400 mb-2">Synthesized Vocals ({voice})</h3>
                            <audio src={synthesizedAudioUrl!} controls className="w-full" />
                        </div>
                    </div>
                    <div className="relative">
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">Transcribed Lyrics</h3>
                         <CopyButton textToCopy={transcribedText} className="absolute top-0 right-0" />
                        <div className="bg-gray-900/50 p-3 rounded-md max-h-48 overflow-y-auto border border-gray-700">
                             <p className="whitespace-pre-wrap font-sans text-gray-400 text-sm">{transcribedText}</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href={synthesizedAudioUrl!} download={`synthesized_vocal_${voice}.mp3`} className="w-full sm:w-auto flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600">Download Synthesized MP3</a>
                        <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white">
                            Start Over
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
