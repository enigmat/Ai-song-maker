import React, { useState, useEffect, useRef } from 'react';
import { evolveBeatPattern } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { CopyButton } from './CopyButton';

declare var Tone: any;

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

const SequencerDisplay: React.FC<{ title: string; patternString: string | null; isPlaying: boolean; currentStep: number; side: 'left' | 'right' }> = ({ title, patternString, isPlaying, currentStep, side }) => {
    const [pattern, setPattern] = useState<ParsedBeat | null>(null);

    useEffect(() => {
        if (!patternString) {
            setPattern(null);
            return;
        }
        try {
            const parsed = JSON.parse(patternString);
            setPattern(parsed);
        } catch {
            setPattern(null);
        }
    }, [patternString]);

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className={`text-xl font-bold text-center mb-4 ${side === 'left' ? 'text-gray-300' : 'text-teal-300'}`}>{title}</h3>
            <div className="space-y-2">
                {instruments.map(inst => (
                    <div key={inst.name} className="flex items-center gap-2">
                        <div className={`w-16 text-center text-xs font-bold text-white rounded-md py-1 px-2 flex-shrink-0 capitalize ${inst.color}`}>
                            {inst.name}
                        </div>
                        <div className="grid [grid-template-columns:repeat(16,minmax(0,1fr))] gap-1 items-center flex-1">
                            {Array.from({ length: 16 }).map((_, i) => {
                                const isActive = pattern?.[inst.name]?.includes(i);
                                const isPlayingStep = isPlaying && currentStep === i;
                                return (
                                    <div
                                        key={i}
                                        className={`w-full aspect-square rounded-sm transition-all duration-100 transform ${isActive ? inst.color : 'bg-gray-700/50'} ${isPlayingStep ? 'scale-110 shadow-[0_0_10px_2px_rgba(255,255,255,0.7)]' : ''}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const BeatEnhancer: React.FC = () => {
    const [originalPattern, setOriginalPattern] = useState('{"kick": [0, 8], "snare": [4, 12], "hihat": [0, 2, 4, 6, 8, 10, 12, 14]}');
    const [prompt, setPrompt] = useState('Make the hi-hats more complex and add a clap on the upbeat before the snare.');
    const [enhancedPattern, setEnhancedPattern] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'enhancing' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [bpm, setBpm] = useState(120);

    const synths = useRef<any>({});
    const sequence = useRef<any>(null);

    useEffect(() => {
        const originalPanner = new Tone.Panner(-0.8).toDestination();
        const enhancedPanner = new Tone.Panner(0.8).toDestination();

        const createSynthSet = (panner: any) => ({
            kick: new Tone.MembraneSynth().connect(panner),
            snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.1 } }).connect(panner),
            hihat: new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.05 } }).connect(panner),
            clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.1 } }).connect(panner),
        });

        synths.current = {
            original: createSynthSet(originalPanner),
            enhanced: createSynthSet(enhancedPanner),
        };

        return () => {
            if (Tone.Transport.state !== 'stopped') Tone.Transport.stop();
            if (sequence.current) sequence.current.dispose();
            Object.values(synths.current.original).forEach((s: any) => s.dispose());
            Object.values(synths.current.enhanced).forEach((s: any) => s.dispose());
            originalPanner.dispose();
            enhancedPanner.dispose();
        };
    }, []);

    const handleEnhance = async () => {
        try {
            JSON.parse(originalPattern);
        } catch {
            setError('The original beat pattern is not valid JSON.');
            return;
        }

        setStatus('enhancing');
        setError(null);

        try {
            const newPattern = await evolveBeatPattern(originalPattern, prompt);
            JSON.parse(newPattern); // Validate the response
            setEnhancedPattern(newPattern);
            setStatus('idle');
        } catch (err) {
            setError('Failed to enhance beat. The AI may have returned an invalid format.');
            setStatus('error');
        }
    };

    const handlePlayToggle = async () => {
        if (isPlaying) {
            Tone.Transport.stop();
            setIsPlaying(false);
            return;
        }

        await Tone.start();
        if (sequence.current) sequence.current.dispose();
        
        let originalBeat: ParsedBeat | null = null;
        let enhancedBeat: ParsedBeat | null = null;
        try { originalBeat = JSON.parse(originalPattern); } catch {}
        if (enhancedPattern) {
            try { enhancedBeat = JSON.parse(enhancedPattern); } catch {}
        }
        
        sequence.current = new Tone.Sequence((time: any, step: number) => {
            const trigger = (beat: ParsedBeat | null, synthSet: any) => {
                if (!beat) return;
                if (beat.kick?.includes(step)) synthSet.kick.triggerAttackRelease("C1", "8n", time);
                if (beat.snare?.includes(step)) synthSet.snare.triggerAttackRelease("16n", time);
                if (beat.hihat?.includes(step)) synthSet.hihat.triggerAttackRelease("16n", time, 0.6);
                if (beat.clap?.includes(step)) synthSet.clap.triggerAttackRelease("8n", time);
            };
            trigger(originalBeat, synths.current.original);
            trigger(enhancedBeat, synths.current.enhanced);
            Tone.Draw.schedule(() => setCurrentStep(step), time);
        }, Array.from({ length: 16 }, (_, i) => i), "16n").start(0);

        sequence.current.loop = true;
        Tone.Transport.bpm.value = bpm;
        Tone.Transport.start();
        setIsPlaying(true);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 space-y-6">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                AI Beat Enhancer
            </h2>
            <p className="text-center text-gray-400 -mt-4">
                Evolve your beats with simple text commands.
            </p>

            {error && <ErrorMessage message={error} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Original Beat Pattern (JSON)</label>
                    <textarea rows={6} value={originalPattern} onChange={e => setOriginalPattern(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg font-mono text-xs" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Enhancement Prompt</label>
                    <textarea rows={6} value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg" placeholder="e.g., 'Make it funkier and add a clap'" />
                </div>
            </div>

            <button onClick={handleEnhance} disabled={status === 'enhancing'} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50">
                {status === 'enhancing' ? <><LoadingSpinner /> Enhancing...</> : '✨ Enhance Beat'}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SequencerDisplay title="Original Beat (Left Channel)" patternString={originalPattern} isPlaying={isPlaying} currentStep={currentStep} side="left" />
                <SequencerDisplay title="Enhanced Beat (Right Channel)" patternString={enhancedPattern} isPlaying={isPlaying} currentStep={currentStep} side="right" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <button onClick={handlePlayToggle} className="px-6 py-3 text-lg font-semibold rounded-lg shadow-md w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
                    {isPlaying ? 'Stop' : 'Play'}
                </button>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="text-gray-400 font-semibold">BPM</label>
                    <input type="range" min="60" max="200" value={bpm} onChange={e => { setBpm(Number(e.target.value)); Tone.Transport.bpm.value = Number(e.target.value); }} className="w-full" />
                    <span className="font-mono text-lg text-white w-12 text-center">{bpm}</span>
                </div>
            </div>
        </div>
    );
};
