import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { generateNewBeatPattern, generateBeatFromAudio } from '../services/geminiService';
import { audioBufferToMp3, audioBufferToWav } from '../services/audioService';
import { genres, moods, tempos, beatStyles, beatRegions, instrumentOptions } from '../constants/music';


declare var Tone: any;
declare var saveAs: any;

interface ParsedBeat {
    kick?: number[];
    snare?: number[];
    hihat?: number[];
    clap?: number[];
}

const instruments: { name: keyof ParsedBeat; color: string }[] = [
    { name: 'kick', color: 'bg-purple-500' },
    { name: 'snare', color: 'bg-pink-500' },
    { name: 'clap', color: 'bg-yellow-500' },
    { name: 'hihat', color: 'bg-teal-500' },
];

const UploadIcon = () => (
  <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


export const BeatMaker: React.FC = () => {
    type Status = 'prompt' | 'generating' | 'display' | 'exporting' | 'error';
    
    const [status, setStatus] = useState<Status>('prompt');
    const [error, setError] = useState<string | null>(null);

    // Prompt state
    const [mode, setMode] = useState<'prompt' | 'audio'>('prompt');
    const [genre, setGenre] = useState(genres[0]);
    const [mood, setMood] = useState(moods[0]);
    const [tempo, setTempo] = useState(tempos[2]);
    const [style, setStyle] = useState(beatStyles[0]);
    const [region, setRegion] = useState(beatRegions[0]);
    const [instrumentSelections, setInstrumentSelections] = useState<Record<string, string>>(() => {
        const initialState: Record<string, string> = {};
        for (const key in instrumentOptions) {
            initialState[key] = instrumentOptions[key as keyof typeof instrumentOptions][0];
        }
        return initialState;
    });
    const [editablePrompt, setEditablePrompt] = useState('');
    const [fullPromptUsed, setFullPromptUsed] = useState('');
    
    // Audio upload state
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Beat & Playback state
    const [beatPattern, setBeatPattern] = useState<ParsedBeat | null>(null);
    const [bpm, setBpm] = useState(90);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    
    const [exportProgress, setExportProgress] = useState(0);

    const synths = useRef<any>({});
    const sequence = useRef<any>(null);
    const isAudioSetup = useRef(false);

    // Effect to auto-generate prompt from filters
    useEffect(() => {
        const instrumentText = Object.entries(instrumentSelections)
            .map(([instrument, style]) => `${style} ${instrument.toLowerCase()}`)
            .join(', ');

        const regionText = region !== 'None' ? ` with a ${region.toLowerCase()} influence` : '';
        const tempoText = tempo.toLowerCase();
        setEditablePrompt(`A ${mood.toLowerCase()}, ${style.toLowerCase()} ${genre.toLowerCase()} beat featuring the sound of ${instrumentText}${regionText}, in a ${tempoText}.`);
    }, [genre, mood, tempo, style, region, instrumentSelections]);
    
    // Cleanup Tone.js on unmount
    useEffect(() => {
        return () => {
            if (Tone.Transport.state !== 'stopped') Tone.Transport.stop();
            if(sequence.current) sequence.current.dispose();
            Object.values(synths.current).forEach((synth: any) => synth && synth.dispose());
            isAudioSetup.current = false;
        };
    }, []);

    const setupAudio = () => {
        if (isAudioSetup.current) return;
        synths.current = {
            kick: new Tone.MembraneSynth().toDestination(),
            snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0 } }).toDestination(),
            hihat: new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination(),
            clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.2 } }).toDestination(),
        };
        isAudioSetup.current = true;
    };

    const setupSequence = () => {
        if (sequence.current) sequence.current.dispose();
        if (!beatPattern) return;
        
        const steps = Array.from({ length: 16 }, (_, i) => i);
        sequence.current = new Tone.Sequence((time, step) => {
            Object.keys(beatPattern).forEach(instName => {
                const instrumentKey = instName as keyof ParsedBeat;
                if (beatPattern[instrumentKey]?.includes(step)) {
                    const synth = synths.current[instrumentKey];
                    if (synth) {
                        if (instrumentKey === 'kick') synth.triggerAttackRelease("C1", "8n", time);
                        else if (instrumentKey === 'hihat') synth.triggerAttackRelease("16n", time, 0.6);
                        else synth.triggerAttackRelease("16n", time);
                    }
                }
            });
            Tone.Draw.schedule(() => setCurrentStep(step), time);
        }, steps, "16n").start(0);

        sequence.current.loop = true;
        Tone.Transport.bpm.value = bpm;
    };
    
    const parseAndValidateBeat = (patternString: string): ParsedBeat => {
        const cleanedText = patternString.replace(/```json\n?|\n?```/g, '').trim();
        const parsedJson = JSON.parse(cleanedText);

        if (!parsedJson || typeof parsedJson !== 'object') {
            throw new Error("AI returned an invalid, non-object format.");
        }
        
        const validatedPattern: ParsedBeat = {};
        instruments.forEach(inst => {
            const key = inst.name;
            if (parsedJson[key] && Array.isArray(parsedJson[key])) {
                validatedPattern[key] = parsedJson[key].filter((v: any) => typeof v === 'number' && v >= 0 && v < 16);
            }
        });
        return validatedPattern;
    }

    const handleGenerate = async () => {
        setStatus('generating');
        setError(null);
        setFullPromptUsed(editablePrompt);
        
        if (isPlaying) {
             Tone.Transport.stop();
             setIsPlaying(false);
             setCurrentStep(-1);
        }

        try {
            const patternString = await generateNewBeatPattern(editablePrompt);
            const validatedPattern = parseAndValidateBeat(patternString);
            setBeatPattern(validatedPattern);
            setStatus('display');
        } catch (err: any) {
            console.error(err);
            setError(`Failed to generate a valid beat. The AI response may be malformed. Details: ${err.message}`);
            setStatus('error');
        }
    };
    
    const handleGenerateFromAudio = async () => {
        if (!audioFile) return;

        setStatus('generating');
        setError(null);
        setFullPromptUsed(`Generated from audio file: ${audioFile.name}`);
        
        if (isPlaying) {
             Tone.Transport.stop();
             setIsPlaying(false);
             setCurrentStep(-1);
        }

        try {
            const patternString = await generateBeatFromAudio(audioFile);
            const validatedPattern = parseAndValidateBeat(patternString);
            setBeatPattern(validatedPattern);
            setStatus('display');
        } catch (err: any) {
            console.error(err);
            setError(`Failed to generate a beat from the audio file. Details: ${err.message}`);
            setStatus('error');
        }
    };
    
    const handleTogglePlay = async () => {
        if (!beatPattern) return;
        if (Tone.context.state !== 'running') await Tone.start();
        
        setupAudio(); // Ensure audio is ready
        setupSequence(); // Re-setup sequence with current pattern/bpm

        if (isPlaying) {
            Tone.Transport.stop();
            setIsPlaying(false);
            setCurrentStep(-1);
        } else {
            Tone.Transport.start();
            setIsPlaying(true);
        }
    };
    
    const handleRandomize = () => {
        setGenre(genres[Math.floor(Math.random() * genres.length)]);
        setMood(moods[Math.floor(Math.random() * moods.length)]);
        setTempo(tempos[Math.floor(Math.random() * tempos.length)]);
        setStyle(beatStyles[Math.floor(Math.random() * beatStyles.length)]);
        setRegion(beatRegions[Math.floor(Math.random() * beatRegions.length)]);
        
        const newSelections: Record<string, string> = {};
        Object.keys(instrumentOptions).forEach(key => {
            const options = instrumentOptions[key as keyof typeof instrumentOptions];
            newSelections[key] = options[Math.floor(Math.random() * options.length)];
        });
        setInstrumentSelections(newSelections);
    };

    const handleExport = async (format: 'mp3' | 'wav' | 'json') => {
        if (!beatPattern) return;
        setStatus('exporting');
        setExportProgress(0);
        setError(null);

        try {
            if (format === 'json') {
                const jsonBlob = new Blob([JSON.stringify(beatPattern, null, 2)], { type: 'application/json' });
                saveAs(jsonBlob, 'beat.json');
            } else {
                const duration = 16 * 4 * (60 / bpm); // 4 measures
                const buffer = await Tone.Offline(async () => {
                    Tone.Transport.bpm.value = bpm;
                    const offlineSynths = {
                        kick: new Tone.MembraneSynth().toDestination(),
                        snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0 } }).toDestination(),
                        hihat: new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.01 } }).toDestination(),
                        clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0 } }).toDestination(),
                    };
                    const steps = Array.from({ length: 16 }, (_, i) => i);
                    new Tone.Sequence((time, step) => {
                         instruments.forEach(inst => {
                            if (beatPattern[inst.name]?.includes(step)) {
                                const synth = offlineSynths[inst.name];
                                if (inst.name === 'kick') synth.triggerAttackRelease("C1", "8n", time);
                                else if (inst.name === 'hihat') synth.triggerAttackRelease("16n", time, 0.6);
                                else synth.triggerAttackRelease("16n", time);
                            }
                        });
                    }, steps, "16n").start(0).loop = 3;
                }, duration);

                const blob = format === 'mp3' ? audioBufferToMp3(buffer.get(), setExportProgress) : audioBufferToWav(buffer.get());
                saveAs(blob, `beat.${format}`);
            }
        } catch (err) {
            setError("Failed to export the beat.");
        } finally {
            setStatus('display');
            setExportProgress(0);
        }
    };
    
    const handleInstrumentChange = (instrument: string, value: string) => {
        setInstrumentSelections(prev => ({ ...prev, [instrument]: value }));
    };

    const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragIn = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.items?.length > 0) setIsDragging(true); }, []);
    const handleDragOut = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) {
            setAudioFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, []);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length > 0) setAudioFile(e.target.files[0]);
    };
    
    if (status === 'prompt' || status === 'error') {
        return (
            <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">AI Beat Maker</h2>
                <p className="text-center text-gray-400 mt-2 mb-6">Describe the beat you want to create or generate one from an audio file.</p>
                {error && <ErrorMessage message={error} onRetry={() => {setError(null); setStatus('prompt');}} />}
                
                 <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-1 rounded-lg bg-gray-900 p-1 border border-gray-700">
                        <button onClick={() => setMode('prompt')} aria-pressed={mode === 'prompt'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'prompt' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                            From Prompt
                        </button>
                        <button onClick={() => setMode('audio')} aria-pressed={mode === 'audio'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'audio' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                            From Audio
                        </button>
                    </div>
                </div>

                {mode === 'prompt' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-300">High-Level Vibe</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Genre</label>
                                    <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-1 focus:ring-purple-500">
                                        {genres.map(g => <option key={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Mood</label>
                                    <select value={mood} onChange={e => setMood(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-1 focus:ring-purple-500">
                                        {moods.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Tempo / BPM</label>
                                    <select value={tempo} onChange={e => setTempo(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-1 focus:ring-purple-500">
                                        {tempos.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                         <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-300">Build Your Sound Palette</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(instrumentOptions).map(([instrumentType, options]) => (
                                    <div key={instrumentType}>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">{instrumentType}</label>
                                        <select 
                                            value={instrumentSelections[instrumentType]} 
                                            onChange={(e) => handleInstrumentChange(instrumentType, e.target.value)}
                                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-1 focus:ring-purple-500"
                                        >
                                            {options.map(opt => <option key={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end mb-4">
                            <button type="button" onClick={handleRandomize} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-teal-600 rounded-full shadow-md hover:bg-teal-500 transition-all duration-300 disabled:opacity-50">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v1.333a1 1 0 01-2 0V4a1 1 0 011-1zm6.04 2.153a1 1 0 01.636 1.29l-1.127 3.382a1 1 0 01-1.898-.636l1.127-3.382a1 1 0 011.262-.654zM4.113 6.04a1 1 0 011.262.654l1.127 3.382a1 1 0 01-1.898.636L3.476 7.33A1 1 0 014.113 6.04zM10 17a1 1 0 01-1-1v-1.333a1 1 0 112 0V16a1 1 0 01-1 1zM3.96 13.847a1 1 0 01-.636-1.29l1.127-3.382a1 1 0 011.898.636l-1.127 3.382a1 1 0 01-1.262.654zM15.887 13.96a1 1 0 01-1.262-.654l-1.127-3.382a1 1 0 011.898-.636l1.127 3.382a1 1 0 01-.636 1.29z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" /></svg>
                                Randomize Filters
                            </button>
                        </div>
                        <div>
                            <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-400 mb-2">Your Prompt</label>
                            <textarea id="prompt-input" rows={3} value={editablePrompt} onChange={e => setEditablePrompt(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y" />
                        </div>
                        <button onClick={handleGenerate} disabled={!editablePrompt.trim()} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">Generate Beat</button>
                    </div>
                )}
                
                {mode === 'audio' && (
                    <div className="space-y-4 animate-fade-in">
                        <div 
                            onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                            className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input ref={fileInputRef} type="file" accept=".mp3,audio/mpeg" onChange={handleFileChange} className="hidden" />
                            <div className="text-center">
                                <UploadIcon />
                                {audioFile ? (
                                    <p className="mt-2 text-lg font-semibold text-teal-400 truncate" title={audioFile.name}>{audioFile.name}</p>
                                ) : (
                                    <>
                                        <p className="mt-2 text-lg font-semibold text-gray-300">Drag & Drop MP3 file</p>
                                        <p className="mt-1 text-sm text-gray-400">or click to select a file</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <button onClick={handleGenerateFromAudio} disabled={!audioFile} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">Analyze & Generate</button>
                    </div>
                )}
            </div>
        )
    }

    if (status === 'generating') {
        return (
            <div className="text-center p-10 bg-gray-800/50 rounded-xl">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-400 text-lg animate-pulse">{mode === 'audio' ? 'Analyzing audio & generating beat...' : 'Generating your beat...'}</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">Your Generated Beat</h2>
            
            <div className="p-4 bg-gray-900/50 rounded-lg border border-teal-500/50">
                <p className="text-sm text-gray-400 mb-1 font-semibold">Source:</p>
                <p className="text-gray-300 italic">"{fullPromptUsed}"</p>
            </div>
            
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="space-y-2">
                    {instruments.map(inst => (
                        <div key={inst.name} className="flex items-center gap-2">
                            <div className={`w-16 text-center text-xs font-bold text-white rounded-md py-1 px-2 flex-shrink-0 capitalize ${inst.color}`}>
                                {inst.name}
                            </div>
                            <div className="grid [grid-template-columns:repeat(16,minmax(0,1fr))] gap-1 items-center flex-1">
                                {Array.from({ length: 16 }).map((_, i) => {
                                    const isActive = beatPattern?.[inst.name]?.includes(i);
                                    const isPlayingStep = isPlaying && currentStep === i;
                                    return (
                                        <div key={i} className={`w-full aspect-square rounded-sm transition-all duration-100 transform ${isActive ? inst.color : 'bg-gray-700/50'} ${isPlayingStep ? 'scale-110 shadow-[0_0_10px_2px_rgba(255,255,255,0.7)]'}`}/>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <button onClick={handleTogglePlay} className="px-6 py-3 text-lg font-semibold rounded-lg shadow-md w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 transition-all">
                    {isPlaying ? 'Stop' : 'Play'}
                </button>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="text-gray-400 font-semibold">BPM</label>
                    <input type="range" min="60" max="200" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full" />
                    <span className="font-mono text-lg text-white w-12 text-center">{bpm}</span>
                </div>
            </div>
            
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 text-center">
                 <h3 className="text-lg font-semibold text-gray-300 mb-3">Export</h3>
                 {status === 'exporting' ? (
                     <div>
                         <LoadingSpinner />
                         <p className="mt-2 text-sm text-gray-400">Exporting... {Math.round(exportProgress)}%</p>
                    </div>
                 ) : (
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => handleExport('mp3')} className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">Export MP3</button>
                        <button onClick={() => handleExport('wav')} className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">Export WAV</button>
                        <button onClick={() => handleExport('json')} className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">Export JSON</button>
                    </div>
                 )}
            </div>

            <div className="text-center">
                <button onClick={() => { setStatus('prompt'); setAudioFile(null); }} className="px-6 py-2 border-2 border-purple-500 text-purple-400 rounded-lg hover:bg-purple-500 hover:text-white transition-all">
                    Generate New Beat
                </button>
            </div>
        </div>
    );
};