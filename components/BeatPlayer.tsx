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
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v2.586l-1.707-1.707a1 1 0 00-1.414 1.414L8.586 10l-2.707 2.707a1 1 0 101.414 1.414L10 11.414l2.707 2.707a1 1 0 001.414-1.414L11.414 10l2.707-2.707a1 1 0 00-1.414-1.414L10 8.586V5z" />
    </svg>
);


interface ParsedBeat {
    kick: number[];
    snare: number[];
    hihat: number[];
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
            if (parsedBeat.hihat.includes(step)) { synths.current.hihat.triggerAttackRelease("16n", time); }
            Tone.Draw.schedule(() => { setCurrentStep(step); }, time);
        }, steps, "16n").start(0);
        sequence.current.loop = true;

        if (isPlaying) {
            Tone.Transport.start();
        } else {
            Tone.Transport.pause();
        }

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
            { name: 'Hi-Hat', steps: parsedBeat.hihat, color: 'bg-teal-500' },
        ];

        return (
            <div className="grid gap-2 mt-6 flex-grow">
                {instruments.map(inst => (
                    <div key={inst.name} className="grid [grid-template-columns:repeat(16,minmax(0,1fr))] gap-1.5 items-center">
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
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-6 flex flex-col transition-all duration-300 h-full">
            <h3 className="text-2xl font-bold text-center mb-4 text-gray-200">Beat Machine</h3>
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