import React, { useState, useCallback, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { audioBufferToMp3, audioBufferToWav } from '../services/audioService';
import { WaveformVisualizer } from './WaveformVisualizer';

declare var Tone: any;

const UploadIcon = () => (
    <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const MasteringIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h1a1 1 0 011 1v1.5a1.5 1.5 0 010 3V12a1 1 0 00-1 1v1a1 1 0 01-1 1h-1.5a1.5 1.5 0 01-3 0H8a1 1 0 00-1-1v-1a1 1 0 01-1-1v-1.5a1.5 1.5 0 010-3V6a1 1 0 001-1h1a1 1 0 011-1v-.5z" />
    </svg>
);

const MasteringStyleRadio: React.FC<{ value: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; label: string; description: string; disabled: boolean; }> =
({ value, checked, onChange, label, description, disabled }) => (
    <label className={`relative flex p-3 border rounded-lg cursor-pointer transition-all ${checked ? 'bg-purple-900/50 border-purple-500 ring-2 ring-purple-500/50' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input type="radio" name="mastering-style" value={value} checked={checked} onChange={onChange} className="hidden" disabled={disabled} />
        <div className="flex flex-col">
            <span className="font-semibold text-gray-200 text-sm">{label}</span>
            <span className="text-xs text-gray-400">{description}</span>
        </div>
    </label>
);

export const AIMastering: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'mastering' | 'success' | 'error'>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [referenceFile, setReferenceFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isRefDragging, setIsRefDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generationProgress, setGenerationProgress] = useState('');
    const [masteringStyle, setMasteringStyle] = useState('punchy');

    const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
    const [masteredBuffer, setMasteredBuffer] = useState<AudioBuffer | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [masteredUrl, setMasteredUrl] = useState<string | null>(null);

    // Clean up Object URLs
    useEffect(() => {
        return () => {
            if (originalUrl) URL.revokeObjectURL(originalUrl);
            if (masteredUrl) URL.revokeObjectURL(masteredUrl);
        };
    }, [originalUrl, masteredUrl]);
    
    const handleFileSelect = (selectedFile: File | null, type: 'main' | 'reference') => {
        if (selectedFile) {
            const isValid = selectedFile.type.startsWith('audio/mpeg') || selectedFile.name.toLowerCase().endsWith('.mp3') || selectedFile.type.startsWith('audio/wav') || selectedFile.name.toLowerCase().endsWith('.wav');
            if (!isValid) {
                setError(`Please select a valid MP3 or WAV file for the ${type === 'main' ? 'main track' : 'reference track'}.`);
                return;
            }
             setError(null);

            if (type === 'main') {
                handleReset();
                setFile(selectedFile);
            } else {
                setReferenceFile(selectedFile);
            }
        }
    };

    const handleDrag = useCallback((e: React.DragEvent, type: 'main' | 'reference') => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragIn = useCallback((e: React.DragEvent, type: 'main' | 'reference') => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.items?.length > 0) { type === 'main' ? setIsDragging(true) : setIsRefDragging(true); } }, []);
    const handleDragOut = useCallback((e: React.DragEvent, type: 'main' | 'reference') => { e.preventDefault(); e.stopPropagation(); type === 'main' ? setIsDragging(false) : setIsRefDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent, type: 'main' | 'reference') => {
        e.preventDefault();
        e.stopPropagation();
        type === 'main' ? setIsDragging(false) : setIsRefDragging(false);
        if (e.dataTransfer.files?.length > 0) {
            handleFileSelect(e.dataTransfer.files[0], type);
            e.dataTransfer.clearData();
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'reference') => {
        if (e.target.files?.length > 0) {
            handleFileSelect(e.target.files[0], type);
        }
    };

    const analyzeBufferLoudness = async (buffer: AudioBuffer): Promise<number> => {
        return new Promise((resolve) => {
            const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
            const sourceNode = offlineCtx.createBufferSource();
            sourceNode.buffer = buffer;

            // ScriptProcessorNode is deprecated but simplest for this offline task
            const processor = offlineCtx.createScriptProcessor(4096, buffer.numberOfChannels, buffer.numberOfChannels);

            let sum = 0;
            processor.onaudioprocess = (e) => {
                const data = e.inputBuffer.getChannelData(0); // Analyze left channel
                for (let i = 0; i < data.length; i++) {
                    sum += data[i] * data[i];
                }
            };

            sourceNode.connect(processor);
            processor.connect(offlineCtx.destination);
            sourceNode.start(0);

            offlineCtx.startRendering().then(() => {
                const rms = Math.sqrt(sum / buffer.length);
                const db = 20 * Math.log10(rms);
                resolve(db);
            });
        });
    };

    const handleMaster = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }
        await Tone.start();
        setStatus('mastering');
        setError(null);
        setProgress(0);
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            setGenerationProgress('Decoding audio...');
            setProgress(5);
            const arrayBuffer = await file.arrayBuffer();
            setProgress(10);
            const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setOriginalBuffer(decodedBuffer);
            setOriginalUrl(URL.createObjectURL(file));
            setProgress(20);

            let volumeAdjustment = 0;
            if (referenceFile) {
                setGenerationProgress('Analyzing reference track...');
                setProgress(25);
                const refArrayBuffer = await referenceFile.arrayBuffer();
                const refDecodedBuffer = await audioContext.decodeAudioData(refArrayBuffer);
                
                const [originalDb, referenceDb] = await Promise.all([
                    analyzeBufferLoudness(decodedBuffer),
                    analyzeBufferLoudness(refDecodedBuffer)
                ]);
                
                volumeAdjustment = referenceDb - originalDb;
                if (volumeAdjustment > 6) volumeAdjustment = 6; // Cap boost to prevent extreme distortion
                if (volumeAdjustment < -12) volumeAdjustment = -12; // Cap reduction

                setGenerationProgress('Applying reference character...');
                setProgress(40);
            } else {
                setGenerationProgress('Applying mastering style...');
                setProgress(40);
            }

            const masteredBufferResult = await Tone.Offline(async () => {
                const source = new Tone.BufferSource(decodedBuffer);
                const limiter = new Tone.Limiter(-0.3).toDestination();

                if (referenceFile) {
                    const eq = new Tone.EQ3(0, -0.5, 0.5); // Gentle smile EQ
                    const compressor = new Tone.Compressor(-18, 4);
                    const volume = new Tone.Volume(volumeAdjustment);
                    source.chain(eq, compressor, volume, limiter);
                } else {
                    const compressor = new Tone.Compressor();
                    const eq = new Tone.EQ3();
                    source.chain(eq, compressor, limiter);

                    switch (masteringStyle) {
                        case 'warm': eq.low.value = 2; eq.high.value = -1.5; compressor.set({ threshold: -18, ratio: 3, attack: 0.05, release: 0.25 }); break;
                        case 'bright': eq.high.value = 2.5; eq.low.value = -1; compressor.set({ threshold: -22, ratio: 4, attack: 0.01, release: 0.2 }); break;
                        case 'open': eq.high.value = 1.5; eq.low.value = -0.5; compressor.set({ threshold: -16, ratio: 2.5, attack: 0.08, release: 0.5 }); break;
                        case 'bass_heavy': eq.low.value = 3; eq.high.value = -1; compressor.set({ threshold: -20, ratio: 4, attack: 0.01, release: 0.15 }); break;
                        case 'vocal_focus': eq.mid.value = 1.5; eq.low.value = -1; eq.high.value = 0.5; compressor.set({ threshold: -18, ratio: 3, attack: 0.02, release: 0.3 }); break;
                        case 'punchy': default: eq.low.value = 1.5; eq.mid.value = -2; eq.high.value = 1; compressor.set({ threshold: -25, ratio: 6, attack: 0.003, release: 0.1 }); break;
                    }
                }
                
                source.start(0);
            }, decodedBuffer.duration);
            
            setGenerationProgress('Rendering final audio...');
            setProgress(60);
            setMasteredBuffer(masteredBufferResult);
            const masteredMp3Blob = audioBufferToMp3(masteredBufferResult, (p) => {
                setProgress(60 + (p * 0.4));
            });
            
            setMasteredUrl(URL.createObjectURL(masteredMp3Blob));
            setStatus('success');

        } catch (err: any) {
            console.error('Mastering failed:', err);
            setError(err.message || 'Failed to process audio. The file might be corrupt or in an unsupported format.');
            setStatus('error');
        }
    };

    const handleDownload = (format: 'wav' | 'mp3') => {
        if (!masteredBuffer || !file) return;

        const blob = format === 'wav'
            ? audioBufferToWav(masteredBuffer)
            : audioBufferToMp3(masteredBuffer);
        
        const baseFileName = file.name.substring(0, file.name.lastIndexOf('.'));
        const styleName = referenceFile ? 'referenced' : masteringStyle;
        const fileName = `${baseFileName}_mastered_${styleName}.${format}`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    };

    const handleReset = useCallback(() => {
        setStatus('idle');
        setFile(null);
        setReferenceFile(null);
        setError(null);
        setProgress(0);
        setGenerationProgress('');
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        if (masteredUrl) URL.revokeObjectURL(masteredUrl);
        setOriginalUrl(null);
        setMasteredUrl(null);
        setOriginalBuffer(null);
        setMasteredBuffer(null);
    }, [originalUrl, masteredUrl]);
    
    if (status === 'success') {
        return (
            <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 animate-fade-in">
                <div className="text-center">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-500 text-transparent bg-clip-text">Mastering Complete!</h2>
                    <p className="mt-2 text-gray-400">A/B compare your mix and download the final master.</p>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-300 text-center mb-2">Original Mix</h3>
                        <WaveformVisualizer audioBuffer={originalBuffer} color="#ec4899" />
                        <audio src={originalUrl!} controls className="w-full mt-2" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-teal-400 text-center mb-2">
                            Mastered Version
                            {referenceFile && (
                                <span className="block text-xs font-normal text-gray-400 truncate" title={referenceFile.name}>
                                    (Referenced: {referenceFile.name})
                                </span>
                            )}
                        </h3>
                        <WaveformVisualizer audioBuffer={masteredBuffer} color="#2dd4bf" />
                        <audio src={masteredUrl!} controls className="w-full mt-2" />
                    </div>
                </div>
                 <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                     <button onClick={() => handleDownload('wav')} className="w-full sm:w-auto flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all transform hover:scale-105">Download WAV</button>
                     <button onClick={() => handleDownload('mp3')} className="w-full sm:w-auto flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all transform hover:scale-105">Download MP3</button>
                    <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all">Master Another</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                AI Mastering Suite
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Upload your final mix and let our AI polish it for release-ready quality.
            </p>
            
            {error && <ErrorMessage message={error} onRetry={status === 'error' ? handleMaster : undefined} />}

            {status === 'mastering' ? (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg">{generationProgress}</p>
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
                        onDragEnter={(e) => handleDragIn(e, 'main')} onDragLeave={(e) => handleDragOut(e, 'main')} onDragOver={(e) => handleDrag(e, 'main')} onDrop={(e) => handleDrop(e, 'main')}
                        className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                        onClick={() => document.getElementById('mastering-file-input')?.click()}
                    >
                        <input id="mastering-file-input" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={(e) => handleFileChange(e, 'main')} className="hidden" />
                        <div className="text-center">
                            <UploadIcon />
                            {file ? (
                                <p className="mt-2 text-lg font-semibold text-teal-400 truncate" title={file.name}>{file.name}</p>
                            ) : (
                                <p className="mt-2 text-lg font-semibold text-gray-300">Drag & Drop Final Mix (MP3/WAV)</p>
                            )}
                        </div>
                    </div>

                     <div
                        onDragEnter={(e) => handleDragIn(e, 'reference')} onDragLeave={(e) => handleDragOut(e, 'reference')} onDragOver={(e) => handleDrag(e, 'reference')} onDrop={(e) => handleDrop(e, 'reference')}
                        className={`p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isRefDragging ? 'border-teal-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                        onClick={() => document.getElementById('reference-file-input')?.click()}
                    >
                        <input id="reference-file-input" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={(e) => handleFileChange(e, 'reference')} className="hidden" />
                        <div className="text-center">
                             {referenceFile ? (
                                <>
                                    <p className="text-xs text-gray-400">Reference Track:</p>
                                    <p className="text-md font-semibold text-teal-400 truncate" title={referenceFile.name}>{referenceFile.name}</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-md font-semibold text-gray-300">Add Reference Track (Optional)</p>
                                    <p className="text-xs text-gray-500">Match the loudness of another track</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className={`space-y-3 transition-opacity ${referenceFile ? 'opacity-50' : 'opacity-100'}`}>
                        <h3 className="text-lg font-semibold text-center text-gray-300">Choose a Mastering Style</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                             <MasteringStyleRadio value="punchy" checked={masteringStyle === 'punchy'} onChange={(e) => setMasteringStyle(e.target.value)} label="Punchy & Loud" description="High-energy, maximized loudness." disabled={!!referenceFile} />
                             <MasteringStyleRadio value="bright" checked={masteringStyle === 'bright'} onChange={(e) => setMasteringStyle(e.target.value)} label="Bright & Modern" description="Clarity for pop and electronic." disabled={!!referenceFile} />
                             <MasteringStyleRadio value="warm" checked={masteringStyle === 'warm'} onChange={(e) => setMasteringStyle(e.target.value)} label="Warm & Vintage" description="Smooth, analog character." disabled={!!referenceFile} />
                             <MasteringStyleRadio value="open" checked={masteringStyle === 'open'} onChange={(e) => setMasteringStyle(e.target.value)} label="Open & Airy" description="Gentle, with high-end clarity." disabled={!!referenceFile} />
                             <MasteringStyleRadio value="bass_heavy" checked={masteringStyle === 'bass_heavy'} onChange={(e) => setMasteringStyle(e.target.value)} label="Bass Heavy" description="Low-end punch for hip-hop/EDM." disabled={!!referenceFile} />
                             <MasteringStyleRadio value="vocal_focus" checked={masteringStyle === 'vocal_focus'} onChange={(e) => setMasteringStyle(e.target.value)} label="Vocal Focus" description="Brings vocals to the forefront." disabled={!!referenceFile} />
                        </div>
                    </div>
                     {referenceFile && (
                        <p className="text-center text-sm text-purple-400 -mt-3">
                            Mastering style will be based on your reference track.
                        </p>
                    )}
                    
                    <button
                        onClick={handleMaster}
                        disabled={status === 'mastering' || !file}
                        className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <MasteringIcon />
                        Master with AI
                    </button>
                </div>
            )}
        </div>
    );
};
