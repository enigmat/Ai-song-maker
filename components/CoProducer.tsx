import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { analyzeAudioForProfile, generateNewBeatPattern, generateMusicalLayer } from '../services/geminiService';
import { melodyToMp3, audioBufferToMp3 } from '../services/audioService';
import type { ArtistStyleProfile, MelodyAnalysis } from '../types';
import { WaveformVisualizer } from './WaveformVisualizer';

declare var Tone: any;
declare var saveAs: any;

type Status = 'prompt' | 'analyzing' | 'ready' | 'generating' | 'error';
type PartType = 'drums' | 'bassline' | 'melody' | 'chords';

interface GeneratedPart {
    type: PartType;
    data: MelodyAnalysis | { pattern: string }; // MelodyAnalysis for melodic parts, simple object for drums
    blob: Blob;
    url: string;
}

const UploadIcon = () => ( <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> );
const PlayIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg> );
const PauseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" /></svg> );

export const CoProducer: React.FC = () => {
    const [status, setStatus] = useState<Status>('prompt');
    const [error, setError] = useState<string | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const [analysis, setAnalysis] = useState<ArtistStyleProfile | null>(null);
    const [generatedParts, setGeneratedParts] = useState<Record<PartType, GeneratedPart | null>>({
        drums: null, bassline: null, melody: null, chords: null
    });
    const [generatingPart, setGeneratingPart] = useState<PartType | null>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [volumes, setVolumes] = useState<Record<string, number>>({ main: 0, drums: 0, bassline: 0, melody: 0, chords: 0 });

    const originalBuffer = useRef<AudioBuffer | null>(null);
    const players = useRef<Record<string, any>>({}); // Tone.Player or Tone.Sequence
    
    useEffect(() => {
        return () => { // Cleanup on unmount
            if (Tone.Transport.state !== 'stopped') Tone.Transport.stop();
            Object.values(players.current).forEach((p: any) => p?.dispose());
            Object.values(generatedParts).forEach((p: any) => p && URL.revokeObjectURL(p.url));
        };
    }, [generatedParts]);

    const handleFileSelect = (selectedFile: File | null) => {
        if (!selectedFile) return;
        if (!selectedFile.type.startsWith('audio/')) {
            setError('Please select a valid audio file.');
            return;
        }
        handleReset();
        setFile(selectedFile);
        setError(null);
    };
    
    const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragIn = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.items?.length > 0) setIsDragging(true); }, []);
    const handleDragOut = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) handleFileSelect(e.dataTransfer.files[0]);
    }, []);

    const handleAnalyze = async () => {
        if (!file) return;
        setStatus('analyzing');
        setError(null);
        try {
            const { artistNameSuggestion, ...profileData } = await analyzeAudioForProfile(file);
            setAnalysis(profileData);
            
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const buffer = await file.arrayBuffer();
            originalBuffer.current = await audioCtx.decodeAudioData(buffer);

            setStatus('ready');
        } catch (err: any) {
            setError(err.message || 'Failed to analyze audio.');
            setStatus('error');
        }
    };
    
    const handleGeneratePart = async (partType: PartType) => {
        if (!analysis) return;
        setGeneratingPart(partType);
        try {
            let part: GeneratedPart;
            if (partType === 'drums') {
                const prompt = `A ${analysis.mood} ${analysis.genre} drum beat with a ${analysis.rhythm} feel.`;
                const pattern = await generateNewBeatPattern(prompt);
                
                const duration = 16 * 4 * (60 / 120); // 4 measures at 120bpm default for preview
                const buffer = await Tone.Offline(async () => {
                    const tempSynths = {
                        kick: new Tone.MembraneSynth().toDestination(),
                        snare: new Tone.NoiseSynth().toDestination(),
                        hihat: new Tone.MetalSynth().toDestination(),
                    };
                    new Tone.Sequence((time: any, step: number) => {
                         const beat = JSON.parse(pattern);
                         if (beat.kick?.includes(step)) tempSynths.kick.triggerAttackRelease("C1", "8n", time);
                         if (beat.snare?.includes(step)) tempSynths.snare.triggerAttackRelease("16n", time);
                         if (beat.hihat?.includes(step)) tempSynths.hihat.triggerAttackRelease("16n", time, 0.6);
                    }, Array.from({length: 16}, (_, i) => i), "16n").start(0).loop = 3;
                }, duration);
                const blob = audioBufferToMp3(buffer.get());

                part = { type: 'drums', data: { pattern }, blob, url: URL.createObjectURL(blob) };
            } else {
                const melodyData = await generateMusicalLayer(analysis, partType);
                const instrument = partType === 'bassline' ? 'Bass' : partType === 'chords' ? 'Strings' : 'Synth Lead';
                const blob = await melodyToMp3(melodyData.notes, instrument, melodyData.bpm);
                part = { type: partType, data: melodyData, blob, url: URL.createObjectURL(blob) };
            }

            setGeneratedParts(prev => ({ ...prev, [partType]: part }));

        } catch (err: any) {
            setError(`Failed to generate ${partType}: ${err.message}`);
        } finally {
            setGeneratingPart(null);
        }
    };

    const setupPlayers = async () => {
        if (players.current['main']) return; // Already setup
        
        await Tone.start();
        
        const mainPlayer = await new Tone.Player(URL.createObjectURL(file!)).toDestination();
        mainPlayer.loop = true;
        players.current['main'] = mainPlayer;

        Object.entries(generatedParts).forEach(([key, part]) => {
            if (part) {
                const player = new Tone.Player((part as GeneratedPart).url).toDestination();
                player.loop = true;
                players.current[key] = player;
            }
        });
        
        // Sync all players
        Object.values(players.current).forEach((p: any) => p.sync().start(0));
    };

    const handlePlayToggle = async () => {
        if (Object.keys(players.current).length === 0) {
            await setupPlayers();
        }
        if (isPlaying) {
            Tone.Transport.stop();
        } else {
            Tone.Transport.start();
        }
        setIsPlaying(!isPlaying);
    };

    const handleVolumeChange = (part: string, value: number) => {
        setVolumes(prev => ({ ...prev, [part]: value }));
        if (players.current[part]) {
            players.current[part].volume.value = value;
        }
    };
    
    const handleReset = () => {
        if (isPlaying) Tone.Transport.stop();
        Object.values(players.current).forEach((p: any) => p?.dispose());
        players.current = {};
        Object.values(generatedParts).forEach((p: any) => p && URL.revokeObjectURL(p.url));
        
        setStatus('prompt');
        setError(null);
        setFile(null);
        setAnalysis(null);
        setGeneratedParts({ drums: null, bassline: null, melody: null, chords: null });
        setIsPlaying(false);
        setVolumes({ main: 0, drums: 0, bassline: 0, melody: 0, chords: 0 });
    };

    return (
        <div className="space-y-6">
            <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                    AI Co-Producer
                </h2>
                <p className="text-center text-gray-400 mt-2 mb-6">Upload a track, get an analysis, and generate new layers to build your song.</p>
                {error && <ErrorMessage message={error} />}

                {status === 'prompt' && (
                    <div className="max-w-xl mx-auto space-y-4">
                        <div onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop} className={`p-8 border-2 border-dashed rounded-lg cursor-pointer ${isDragging ? 'border-purple-500' : 'border-gray-600'}`}>
                            <input type="file" accept="audio/*" onChange={e => handleFileSelect(e.target.files?.[0] || null)} className="hidden" />
                            <div className="text-center">
                                <UploadIcon />
                                {file ? <p className="mt-2 text-teal-400">{file.name}</p> : <p className="mt-2 text-gray-300">Drop your track here</p>}
                            </div>
                        </div>
                        <button onClick={handleAnalyze} disabled={!file} className="w-full text-lg font-semibold p-3 bg-purple-600 rounded-lg disabled:opacity-50">Analyze Track</button>
                    </div>
                )}
                
                {status === 'analyzing' && <div className="text-center p-8"><LoadingSpinner size="lg" /><p className="mt-4 animate-pulse">Analyzing audio...</p></div>}
            </div>

            {(status === 'ready' || status === 'generating') && analysis && (
                 <div className="p-4 sm:p-6 bg-gray-800/50 rounded-xl border border-gray-700 space-y-4 animate-fade-in">
                    <h3 className="text-2xl font-bold text-center text-gray-200">Track Analysis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        <div className="bg-gray-900 p-2 rounded-md"><p className="text-xs text-purple-400">Genre</p><p className="font-semibold">{analysis.genre}</p></div>
                        <div className="bg-gray-900 p-2 rounded-md"><p className="text-xs text-purple-400">Mood</p><p className="font-semibold">{analysis.mood}</p></div>
                        <div className="bg-gray-900 p-2 rounded-md"><p className="text-xs text-purple-400">Tempo</p><p className="font-semibold">{analysis.tempo}</p></div>
                        <div className="bg-gray-900 p-2 rounded-md"><p className="text-xs text-purple-400">Rhythm</p><p className="font-semibold">{analysis.rhythm}</p></div>
                    </div>
                     <WaveformVisualizer audioBuffer={originalBuffer.current} color="#a855f7" />
                    
                    <h3 className="text-2xl font-bold text-center text-gray-200 pt-4">Generate Layers</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(['drums', 'bassline', 'melody', 'chords'] as PartType[]).map(part => (
                            <button key={part} onClick={() => handleGeneratePart(part)} disabled={!!generatingPart} className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-teal-500 disabled:opacity-50 disabled:cursor-wait">
                                {generatingPart === part ? <LoadingSpinner /> : (
                                    <>
                                        <p className="text-lg font-bold capitalize">{part}</p>
                                        {generatedParts[part] && <p className="text-xs text-green-400">✓ Generated</p>}
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                 </div>
            )}
            
            {Object.values(generatedParts).some(p => p) && (
                <div className="p-4 sm:p-6 bg-gray-800/50 rounded-xl border border-gray-700 space-y-4 animate-fade-in">
                    <h3 className="text-2xl font-bold text-center text-gray-200">Mixer</h3>
                    <div className="flex justify-center">
                        <button onClick={handlePlayToggle} className="p-4 bg-teal-600 rounded-full">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                    </div>
                    <div className="space-y-3">
                        {file && (
                             <div className="flex items-center gap-3"><label className="w-24 text-right">Main Track</label><input type="range" min="-40" max="6" step="0.5" value={volumes.main} onChange={e => handleVolumeChange('main', +e.target.value)} className="w-full" /></div>
                        )}
                        {Object.entries(generatedParts).map(([key, part]) => part && (
                            <div key={key} className="flex items-center gap-3"><label className="w-24 text-right capitalize">{key}</label><input type="range" min="-40" max="6" step="0.5" value={volumes[key]} onChange={e => handleVolumeChange(key, +e.target.value)} className="w-full" /></div>
                        ))}
                    </div>
                </div>
            )}

            {(status === 'ready' || status === 'generating') && (
                 <div className="text-center">
                     <button onClick={handleReset} className="px-6 py-2 border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700">Start Over</button>
                 </div>
            )}
        </div>
    );
};