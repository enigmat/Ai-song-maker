import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateChordProgressions } from '../services/geminiService';
import type { ChordProgression } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { genres, moods, musicalKeys } from '../constants/music';
import { CopyButton } from './CopyButton';

declare var Tone: any;

const GeneratorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 00-1 1v1a1 1 0 001 1h4a1 1 0 001-1v-1a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
);

const SelectInput: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]; disabled: boolean; }> =
    ({ label, value, onChange, options, disabled }) => (
        <div>
            <label htmlFor={label} className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
            <select
                id={label}
                value={value}
                onChange={onChange}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
                disabled={disabled}
            >
                {options.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
        </div>
    );
    

export const ChordProgressionGenerator: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
    const [progressions, setProgressions] = useState<ChordProgression[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    // Form state
    const [key, setKey] = useState(musicalKeys[0]);
    const [genre, setGenre] = useState(genres[0]);
    const [mood, setMood] = useState(moods[0]);

    // Audio state
    const [playingIndex, setPlayingIndex] = useState<number | null>(null);
    const synth = useRef<any>(null);
    const part = useRef<any>(null);

    useEffect(() => {
        // Cleanup on unmount to prevent audio state from leaking to other components
        return () => {
            if (part.current) {
                part.current.dispose();
                part.current = null;
            }
            if (synth.current) {
                synth.current.dispose();
                synth.current = null;
            }
            if (Tone.Transport.state === 'started') {
                Tone.Transport.stop();
            }
            // Always cancel any leftover events to avoid conflicts
            Tone.Transport.cancel();
        };
    }, []);

    const handleGenerate = async () => {
        setStatus('generating');
        setError(null);
        setProgressions([]);
        try {
            const results = await generateChordProgressions(key, genre, mood);
            setProgressions(results);
            setStatus('success');
        } catch (err) {
            console.error('Chord progression generation failed:', err);
            setError('Failed to generate progressions. The AI model might be busy. Please try again.');
            setStatus('error');
        }
    };
    
    const handlePlay = async (progression: string, index: number) => {
        if (playingIndex === index) {
            if (part.current) part.current.stop();
            if (Tone.Transport.state === 'started') Tone.Transport.stop();
            Tone.Transport.cancel();
            setPlayingIndex(null);
            return;
        }

        await Tone.start();

        if (!synth.current) {
            synth.current = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'fatsawtooth' },
                envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 },
            }).toDestination();
        }
        
        if (part.current) {
            part.current.dispose();
        }
        if (Tone.Transport.state === 'started') {
            Tone.Transport.stop();
            Tone.Transport.cancel();
        }

        const chords = progression.split('-').map(chord => chord.trim());
        const sequence = chords.map((chord, i) => ({
            time: `0:0:${i * 2}`, // Play each chord for a half note
            note: [`${chord}3`, `${chord}4`],
            duration: '2n',
        }));

        part.current = new Tone.Part((time, value) => {
            synth.current.triggerAttackRelease(value.note, value.duration, time);
        }, sequence).start(0);

        part.current.loop = false;
        Tone.Transport.bpm.value = 90;
        
        // Stop playback when the part finishes
        Tone.Transport.scheduleOnce(() => {
            setPlayingIndex(null);
        }, `+${chords.length * 0.66}`);

        setPlayingIndex(index);
        Tone.Transport.start();
    };


    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Chord Progression Generator
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Find the perfect harmonic foundation for your next song.
            </p>

            {error && <ErrorMessage message={error} onRetry={handleGenerate} />}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectInput label="Key" value={key} onChange={(e) => setKey(e.target.value)} options={musicalKeys} disabled={status === 'generating'} />
                <SelectInput label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} options={genres} disabled={status === 'generating'} />
                <SelectInput label="Mood" value={mood} onChange={(e) => setMood(e.target.value)} options={moods} disabled={status === 'generating'} />
            </div>

            <div className="mt-6">
                 <button
                    onClick={handleGenerate}
                    disabled={status === 'generating'}
                    className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {status === 'generating' ? <LoadingSpinner /> : <GeneratorIcon />}
                    Generate Progressions
                </button>
            </div>

            {(status === 'generating' || progressions.length > 0) && (
                <div className="mt-8">
                    {status === 'generating' ? (
                        <div className="text-center">
                            <LoadingSpinner size="lg"/>
                            <p className="mt-2 text-gray-400 animate-pulse">Composing ideas...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                            {progressions.map((p, index) => (
                                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <button 
                                            onClick={() => handlePlay(p.progression, index)}
                                            className="p-2 rounded-full text-gray-300 hover:bg-purple-600 hover:text-white transition-colors"
                                            aria-label={playingIndex === index ? "Stop playback" : "Play progression"}
                                        >
                                            {playingIndex === index ? <StopIcon /> : <PlayIcon />}
                                        </button>
                                        <div className="flex-grow text-center">
                                            <p className="font-mono text-lg font-semibold tracking-wider text-teal-300">
                                                {p.progression.split('-').join('  ·  ')}
                                            </p>
                                        </div>
                                        <CopyButton textToCopy={p.progression} />
                                    </div>
                                    <p className="mt-2 text-center text-sm text-gray-400 italic flex-grow">{p.description}</p>
                                    {p.theoryExplanation && (
                                        <details className="mt-3 text-xs group">
                                            <summary className="cursor-pointer text-gray-500 hover:text-gray-300 list-none text-center font-semibold tracking-wide uppercase">
                                                <span className="group-open:hidden">Show Theory</span>
                                                <span className="hidden group-open:inline">Hide Theory</span>
                                            </summary>
                                            <p className="mt-2 text-gray-400 bg-gray-800/50 p-3 rounded-md border border-gray-600/50">
                                                {p.theoryExplanation}
                                            </p>
                                        </details>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
