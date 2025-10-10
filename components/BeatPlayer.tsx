import React, { useMemo, useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface BeatPlayerProps {
    beatPattern: string;
    isPlaying: boolean;
    currentStep: number;
    onRandomize: () => void;
    isRandomizing: boolean;
    trackUrl: string | null;
    onBeatPatternChange: (newPattern: string) => void;
}

const RandomizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 3a1 1 0 011 1v1.333a1 1 0 01-2 0V4a1 1 0 011-1zm6.04 2.153a1 1 0 01.636 1.29l-1.127 3.382a1 1 0 01-1.898-.636l1.127-3.382a1 1 0 011.262-.654zM4.113 6.04a1 1 0 011.262.654l1.127 3.382a1 1 0 01-1.898.636L3.476 7.33A1 1 0 014.113 6.04zM10 17a1 1 0 01-1-1v-1.333a1 1 0 112 0V16a1 1 0 01-1 1zM3.96 13.847a1 1 0 01-.636-1.29l1.127-3.382a1 1 0 011.898.636l-1.127 3.382a1 1 0 01-1.262.654zM15.887 13.96a1 1 0 01-1.262-.654l-1.127-3.382a1 1 0 011.898-.636l1.127 3.382a1 1 0 01-.636 1.29z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
    </svg>
);


interface ParsedBeat {
    kick?: number[];
    snare?: number[];
    hihat?: number[];
    clap?: number[];
}

export const BeatPlayer: React.FC<BeatPlayerProps> = ({ beatPattern, isPlaying, currentStep, onRandomize, isRandomizing, trackUrl, onBeatPatternChange }) => {
    const [editableBeat, setEditableBeat] = useState<ParsedBeat>({});

    useEffect(() => {
        try {
            if (beatPattern) {
                const patternString = beatPattern.replace(/```json\n?|\n?```/g, '').trim();
                setEditableBeat(JSON.parse(patternString));
            } else {
                setEditableBeat({});
            }
        } catch (e) {
            console.error("Failed to parse beat pattern:", e);
            setEditableBeat({});
        }
    }, [beatPattern]);

    const handleStepClick = (instrument: keyof ParsedBeat, step: number) => {
        if (trackUrl) return;

        const newBeat = { ...editableBeat };
        const steps = newBeat[instrument] ? [...newBeat[instrument]] : [];
        const stepIndex = steps.indexOf(step);

        if (stepIndex > -1) {
            steps.splice(stepIndex, 1);
        } else {
            steps.push(step);
            steps.sort((a, b) => a - b);
        }

        newBeat[instrument] = steps;
        
        setEditableBeat(newBeat);
        onBeatPatternChange(JSON.stringify(newBeat));
    };

    const renderContent = () => {
        if (trackUrl) {
            return (
                <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-400 p-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-teal-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-1-1z" />
                    </svg>
                    <p className="mt-2 font-semibold">Instrumental Track Loaded</p>
                    <p className="text-xs text-gray-500">Sequencer is disabled.</p>
                </div>
            );
        }

        const instruments: { name: keyof ParsedBeat; color: string }[] = [
            { name: 'kick', color: 'bg-purple-500' },
            { name: 'snare', color: 'bg-pink-500' },
            { name: 'clap', color: 'bg-yellow-500' },
            { name: 'hihat', color: 'bg-teal-500' },
        ];

        return (
            <div className="space-y-2 mt-4 flex-grow">
                {instruments.map(inst => (
                     <div key={inst.name} className="flex items-center gap-2">
                        <div className={`w-16 text-center text-xs font-bold text-white rounded-md py-1 px-2 flex-shrink-0 capitalize ${inst.color}`}>
                            {inst.name}
                        </div>
                        <div className="grid [grid-template-columns:repeat(16,minmax(0,1fr))] gap-1 items-center flex-1">
                            {Array.from({ length: 16 }).map((_, i) => {
                                const isActive = editableBeat[inst.name]?.includes(i);
                                const isPlayingStep = currentStep === i && isPlaying;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleStepClick(inst.name, i)}
                                        aria-label={`${inst.name} step ${i + 1}`}
                                        aria-pressed={isActive}
                                        className={`w-full aspect-square rounded-sm transition-all duration-100 transform
                                            ${isActive ? inst.color : 'bg-gray-700/50 hover:bg-gray-600/50'}
                                            ${isPlayingStep ? 'scale-110 shadow-[0_0_10px_2px_rgba(255,255,255,0.7)]' : ''}
                                            ${trackUrl ? 'cursor-not-allowed' : ''}
                                        `}
                                        disabled={!!trackUrl}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-4 flex flex-col transition-all duration-300 h-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-gray-200">Beat Machine</h3>
                <button
                    onClick={onRandomize}
                    disabled={isRandomizing || !!trackUrl}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 bg-teal-600 text-white shadow-lg hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Randomize beat"
                >
                    {isRandomizing ? <LoadingSpinner size="sm" /> : <RandomizeIcon />}
                    Randomize Beat
                </button>
            </div>

            {(isRandomizing || (!beatPattern && !trackUrl)) ? (
                 <div className="text-center p-10 flex-grow flex flex-col justify-center items-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-400 text-sm animate-pulse">
                        {isRandomizing ? 'Creating new beat...' : 'No beat generated yet.'}
                    </p>
                </div>
            ) : renderContent()}
        </div>
    );
};
