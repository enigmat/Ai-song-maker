import React, { useState, useEffect, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { SongStorylineGenerator } from './SongStorylineGenerator';
import type { SingerGender, ArtistType } from '../services/geminiService';
import {
    genres, singerGenders, artistTypes, moods, tempos,
    melodies, harmonies, rhythms, instrumentations, atmospheres, vocalStyles
} from '../constants/music';

interface SongPromptFormProps {
    onGenerate: (
        prompt: string,
        genre: string,
        singerGender: SingerGender,
        artistType: ArtistType,
        mood: string,
        tempo: string,
        melody: string,
        harmony: string,
        rhythm: string,
        instrumentation: string,
        atmosphere: string,
        vocalStyle: string
    ) => void;
    isLoading: boolean;
    onOpenMelodyStudio: () => void;
}

const GeneratorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const MicIcon = ({ isListening }: { isListening: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 group-hover:text-white'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" />
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


export const SongPromptForm: React.FC<SongPromptFormProps> = ({ onGenerate, isLoading, onOpenMelodyStudio }) => {
    // Core state
    const [prompt, setPrompt] = useState('');
    const [showStorylineGenerator, setShowStorylineGenerator] = useState(false);
    
    // Style parameters state
    const [genre, setGenre] = useState(genres[0]);
    const [singerGender, setSingerGender] = useState<SingerGender>('any');
    const [artistType, setArtistType] = useState<ArtistType>('any');
    const [mood, setMood] = useState(moods[0]);
    const [tempo, setTempo] = useState(tempos[2]); // Default to Medium
    const [melody, setMelody] = useState(melodies[0]);
    const [harmony, setHarmony] = useState(harmonies[0]);
    const [rhythm, setRhythm] = useState(rhythms[0]);
    const [instrumentation, setInstrumentation] = useState(instrumentations[0]);
    const [atmosphere, setAtmosphere] = useState(atmospheres[0]);
    const [vocalStyle, setVocalStyle] = useState(vocalStyles[0]);

    // Speech recognition state
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [speechSupported, setSpeechSupported] = useState(false);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSpeechSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setPrompt(prev => prev ? `${prev.trim()} ${transcript}` : transcript);
            };
            
            recognitionRef.current = recognition;
        } else {
            setSpeechSupported(false);
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        onGenerate(prompt, genre, singerGender, artistType, mood, tempo, melody, harmony, rhythm, instrumentation, atmosphere, vocalStyle);
    };

    const handleSelectStoryline = (storyline: string) => {
        setPrompt(storyline);
        setShowStorylineGenerator(false);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h1 className="text-4xl text-center font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Music Prompt Generator
            </h1>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Describe your song idea and select the style to generate a complete song package.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-400">Your Song Idea</label>
                         <div className="flex items-center gap-2">
                             <button
                                type="button"
                                onClick={onOpenMelodyStudio}
                                disabled={isLoading}
                                className="flex items-center gap-2 text-sm font-semibold px-3 py-1 bg-gray-700 text-gray-200 rounded-full shadow-md hover:bg-purple-600 hover:text-white transition-all duration-300 disabled:opacity-50"
                            >
                                🎤 Hum Melody
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowStorylineGenerator(!showStorylineGenerator)}
                                className="flex items-center gap-2 text-sm font-semibold px-3 py-1 bg-teal-600 rounded-full shadow-md hover:bg-teal-500 transition-all duration-300 disabled:opacity-50"
                                aria-expanded={showStorylineGenerator}
                            >
                                ✨ Get Ideas
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <textarea
                            id="prompt"
                            rows={5}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y pr-12"
                            placeholder="e.g., 'A synthwave song about a lonely robot watching the stars.'"
                            disabled={isLoading}
                        />
                         {speechSupported && (
                            <button
                                type="button"
                                onClick={toggleListening}
                                disabled={isLoading}
                                className="group absolute top-3 right-3 p-2 rounded-full hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                                aria-label={isListening ? 'Stop listening' : 'Start listening'}
                                title={isListening ? 'Stop listening' : 'Use microphone'}
                            >
                                <MicIcon isListening={isListening} />
                            </button>
                        )}
                    </div>
                </div>

                {showStorylineGenerator && (
                    <SongStorylineGenerator
                        onSelectStoryline={handleSelectStoryline}
                        onClose={() => setShowStorylineGenerator(false)}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    <SelectInput label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} options={genres} disabled={isLoading} />
                    <div>
                        <label htmlFor="singer-gender" className="block text-sm font-medium text-gray-400 mb-2">Singer</label>
                        <select
                            id="singer-gender"
                            value={singerGender}
                            onChange={(e) => setSingerGender(e.target.value as SingerGender)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
                            disabled={isLoading}
                        >
                            {singerGenders.map((sg) => <option key={sg.value} value={sg.value}>{sg.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="artist-type" className="block text-sm font-medium text-gray-400 mb-2">Artist Type</label>
                        <select
                            id="artist-type"
                            value={artistType}
                            onChange={(e) => setArtistType(e.target.value as ArtistType)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
                            disabled={isLoading}
                        >
                            {artistTypes.map((at) => <option key={at.value} value={at.value}>{at.label}</option>)}
                        </select>
                    </div>
                    <SelectInput label="Mood" value={mood} onChange={(e) => setMood(e.target.value)} options={moods} disabled={isLoading} />
                    <SelectInput label="Tempo" value={tempo} onChange={(e) => setTempo(e.target.value)} options={tempos} disabled={isLoading} />
                    <SelectInput label="Vocal Style" value={vocalStyle} onChange={(e) => setVocalStyle(e.target.value)} options={vocalStyles} disabled={isLoading} />
                    <SelectInput label="Melody" value={melody} onChange={(e) => setMelody(e.target.value)} options={melodies} disabled={isLoading} />
                    <SelectInput label="Harmony" value={harmony} onChange={(e) => setHarmony(e.target.value)} options={harmonies} disabled={isLoading} />
                    <SelectInput label="Rhythm" value={rhythm} onChange={(e) => setRhythm(e.target.value)} options={rhythms} disabled={isLoading} />
                    <SelectInput label="Instrumentation" value={instrumentation} onChange={(e) => setInstrumentation(e.target.value)} options={instrumentations} disabled={isLoading} />
                    <SelectInput label="Atmosphere/FX" value={atmosphere} onChange={(e) => setAtmosphere(e.target.value)} options={atmospheres} disabled={isLoading} />
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="mt-6 w-full flex items-center justify-center gap-3 text-xl font-semibold px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner />
                            Generating...
                        </>
                    ) : (
                        <>
                            <GeneratorIcon />
                            Generate with AI
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};