import React, { useMemo } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface BeatPlayerProps {
    beatPattern: string;
    isPlaying: boolean;
    currentStep: number;
    onRemix: () => void;
    isRemixing: boolean;
}

const RemixIcon = () => (
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

export const BeatPlayer: React.FC<BeatPlayerProps> = ({ beatPattern, isPlaying, currentStep, onRemix, isRemixing }) => {

    const parsedBeat = useMemo<ParsedBeat>(() => {
        try {
            if (!beatPattern) return {};
            return JSON.parse(beatPattern);
        } catch (e) {
            console.error("Failed to parse beat pattern:", e);
            return {};
        }
    }, [beatPattern]);

    const renderGrid = () => {
        const instruments = [
            { name: 'Kick', steps: parsedBeat.kick || [], color: 'bg-purple-500' },
            { name: 'Snare', steps: parsedBeat.snare || [], color: 'bg-pink-500' },
            { name: 'Clap', steps: parsedBeat.clap || [], color: 'bg-yellow-500' },
            { name: 'Hi-Hat', steps: parsedBeat.hihat || [], color: 'bg-teal-500' },
        ];

        return (
            <div className="space-y-2 mt-4 flex-grow">
                {instruments.map(inst => (
                    inst.steps.length > 0 && (
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
                    )
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-4 flex flex-col transition-all duration-300 h-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-gray-200">Beat Machine</h3>
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
