import React, { useEffect, useRef, useState, useMemo } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Declaration for Tone.js from CDN
declare const Tone: any;

interface BeatPlayerProps {
    beatPattern: string;
    isPlaying: boolean;
    onPlayToggle: () => void;
    onRemix: () => void;
    isRemixing: boolean;
}

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" />
  </svg>
);

const RemixIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 3a1 1 0 011 1v1.333a1 1 0 01-2 0V4a1 1 0 011-1zm6.04 2.153a1 1 0 01.636 1.29l-1.127 3.382a1 1 0 01-1.898-.636l1.127-3.382a1 1 0 011.262-.654zM4.113 6.04a1 1 0 011.262.654l1.127 3.382a1 1 0 01-1.898.636L3.476 7.33A1 1 0 014.113 6.04zM10 17a1 1 0 01-1-1v-1.333a1 1 0 112 0V16a1 1 0 01-1 1zM3.96 13.847a1 1 0 01-.636-1.29l1.127-3.382a1 1 0 011.898.636l-1.127 3.382a1 1 0 01-1.262.654zM15.887 13.96a1 1 0 01-1.262-.654l-1.127-3.382a1 1 0 011.898-.636l1.127 3.382a1 1 0 01-.636 1.29z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
    </svg>
);


interface ParsedBeat {
    kick: number[];
    snare: number[];
    hihat: number[];
    clap?: number[];
    tom?: number[];
    cymbal?: number[];
}

export const BeatPlayer: React.FC<BeatPlayerProps> = ({ beatPattern, isPlaying, onPlayToggle, onRemix, isRemixing }) => {
    const synths = useRef<any>(null);
    const sequence = useRef<any>(null);
    const [currentStep, setCurrentStep] = useState<number>(-1);

    const parsedBeat = useMemo<ParsedBeat>(() => {
        try {
            if (!beatPattern) return { kick: [], snare: [], hihat: [] };
            const pattern = JSON.parse(beatPattern);
            return {
                kick: pattern.kick || [],
                snare: pattern.snare || [],
                hihat: pattern.hihat || [],
                clap: pattern.clap || [],
                tom: pattern.tom || [],
                cymbal: pattern.cymbal || [],
            };
        } catch (e) {
            console.error("Failed to parse beat pattern:", e);
            return { kick: [], snare: [], hihat: [] };
        }
    }, [beatPattern]);

    useEffect(() => {
        if (typeof Tone === 'undefined') {
            console.warn("Tone.js not loaded");
            return;
        }

        synths.current = {
            kick: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 10, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: "exponential" } }).toDestination(),
            snare: new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.2, sustain: 0 } }).toDestination(),
            hihat: new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }).toDestination(),
            clap: new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 } }).toDestination(),
            tom: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.5 } }).toDestination(),
            cymbal: new Tone.MetalSynth({ frequency: 250, envelope: { attack: 0.001, decay: 0.5, release: 0.2 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination(),
        };
        
        Tone.Transport.bpm.value = 120;

        return () => {
            if (Tone.Transport.state !== 'stopped') {
                Tone.Transport.stop();
                Tone.Transport.cancel();
            }
            Object.values(synths.current || {}).forEach((synth: any) => synth.dispose());
        };
    }, []);
    
    useEffect(() => {
        if (!synths.current || typeof Tone === 'undefined') return;

        if (sequence.current) {
            sequence.current.dispose();
        }

        const steps = Array.from({ length: 16 }, (_, i) => i);
        sequence.current = new Tone.Sequence((time: any, step: number) => {
            if (parsedBeat.kick.includes(step)) { synths.current.kick.triggerAttackRelease("C1", "8n", time); }
            if (parsedBeat.snare.includes(step)) { synths.current.snare.triggerAttackRelease("16n", time); }
            if (parsedBeat.clap?.includes(step)) { synths.current.clap.triggerAttackRelease("16n", time); }
            if (parsedBeat.tom?.includes(step)) { synths.current.tom.triggerAttackRelease("G2", "8n", time); }
            if (parsedBeat.hihat.includes(step)) { synths.current.hihat.triggerAttackRelease("16n", time); }
            if (parsedBeat.cymbal?.includes(step)) { synths.current.cymbal.triggerAttackRelease("16n", time); }
            
            Tone.Draw.schedule(() => { setCurrentStep(step); }, time);
        }, steps, "16n").start(0);
        sequence.current.loop = true;

    }, [parsedBeat]); 

    useEffect(() => {
        if (typeof Tone === 'undefined') return;
        if (isPlaying) {
            Tone.Transport.start();
        } else {
            Tone.Transport.pause();
            setCurrentStep(-1);
        }
    }, [isPlaying]);
    
    const handlePlayToggle = async () => {
        if (typeof Tone === 'undefined') return;
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        onPlayToggle();
    };

    const renderGrid = () => {
        const instruments = [
            { name: 'Kick', steps: parsedBeat.kick, color: 'bg-purple-500' },
            { name: 'Snare', steps: parsedBeat.snare, color: 'bg-pink-500' },
            { name: 'Clap', steps: parsedBeat.clap || [], color: 'bg-yellow-500' },
            { name: 'Tom', steps: parsedBeat.tom || [], color: 'bg-orange-500' },
            { name: 'Hi-Hat', steps: parsedBeat.hihat, color: 'bg-teal-500' },
            { name: 'Cymbal', steps: parsedBeat.cymbal || [], color: 'bg-sky-500' },
        ];

        return (
            <div className="space-y-2 mt-4 flex-grow">
                {instruments.map(inst => (
                    <div key={inst.name} className="flex items-center gap-2">
                         <span className="w-14 text-right text-xs text-gray-400 font-mono flex-shrink-0">{inst.name}</span>
                        <div className="grid [grid-template-columns:repeat(16,minmax(0,1fr))] gap-1 items-center flex-1">
                            {Array.from({ length: 16 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-full aspect-square rounded-sm transition-all duration-100 ${
                                        inst.steps.includes(i) ? inst.color : 'bg-gray-700/50'
                                    } ${
                                        currentStep === i && isPlaying ? 'ring-2 ring-white scale-110 shadow-lg' : ''
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-4 flex flex-col transition-all duration-300 h-full">
            <h3 className="text-xl font-bold text-center mb-2 text-gray-200">Beat Machine</h3>
            <div className="flex justify-center items-center gap-4">
                <button
                    onClick={handlePlayToggle}
                    disabled={!beatPattern || isRemixing}
                    className="text-purple-400 hover:text-white transition-colors duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={isPlaying ? 'Pause beat' : 'Play beat'}
                >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button
                    onClick={onRemix}
                    disabled={isRemixing}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 bg-teal-600 text-white shadow-lg hover:bg-teal-500 disabled:opacity-50 disabled:cursor-wait"
                    aria-label="Remix beat"
                >
                    {isRemixing ? <LoadingSpinner size="sm" /> : <RemixIcon />}
                    Remix
                </button>
            </div>
            {(isRemixing || !beatPattern) ? (
                 <div className="text-center p-10 flex-grow flex flex-col justify-center items-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-400 text-sm animate-pulse">
                        {isRemixing ? 'Creating new beat...' : 'No beat generated yet.'}
                    </p>
                </div>
            ) : renderGrid()}
        </div>
    );
};