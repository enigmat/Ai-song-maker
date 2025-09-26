import React, { useState, useEffect, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { SongStorylineGenerator } from './SongStorylineGenerator';
import type { SingerGender, ArtistType } from '../services/geminiService';
import { genres } from '../constants/music';

// Fix for TypeScript errors: Define interfaces for Web Speech API as they are not standard in all TS lib files.
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
}


interface SongPromptFormProps {
  onGenerate: (prompt: string, singerGender: SingerGender, artistType: ArtistType, genre: string) => void;
  isLoading: boolean;
}

const GeneratorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const MicrophoneIcon: React.FC<{ isListening: boolean }> = ({ isListening }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isListening ? 'text-red-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17a1 1 0 11-2 0v-2.07A5 5 0 015 10V8a1 1 0 012 0v2a3 3 0 006 0V8a1 1 0 012 0v2a5 5 0 01-4 4.93z" clipRule="evenodd" />
    </svg>
);


export const SongPromptForm: React.FC<SongPromptFormProps> = ({ onGenerate, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [singerGender, setSingerGender] = useState<SingerGender>('any');
    const [artistType, setArtistType] = useState<ArtistType>('any');
    const [genre, setGenre] = useState<string>('Pop');
    const [showStorylineGenerator, setShowStorylineGenerator] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const promptBeforeSpeechRef = useRef('');
    const finalTranscriptFromSessionRef = useRef('');

    useEffect(() => {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognitionAPI) {
            setIsSpeechSupported(true);
            const recognition: SpeechRecognition = new SpeechRecognitionAPI();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscriptFromSessionRef.current += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                setPrompt(promptBeforeSpeechRef.current + finalTranscriptFromSessionRef.current + interimTranscript);
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error(`Speech recognition error: ${event.error}`);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
        } else {
            promptBeforeSpeechRef.current = prompt ? prompt + ' ' : '';
            finalTranscriptFromSessionRef.current = '';
            recognition.start();
            setIsListening(true);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(prompt, singerGender, artistType, genre);
    };

    const handleSelectStoryline = (storyline: string) => {
        setPrompt(storyline);
        setShowStorylineGenerator(false);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-1 text-gray-200">Describe Your Song Idea</h2>
            <p className="text-center text-gray-400 mb-6">Enter a theme, story, or feeling to get started.</p>

            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A cyberpunk detective story about finding a lost digital consciousness in a sprawling metropolis."
                        className="w-full p-4 pr-48 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y text-lg"
                        rows={4}
                        disabled={isLoading}
                    />
                     <div className="absolute top-3 right-3 flex items-center gap-2">
                        {isSpeechSupported && (
                           <button
                             type="button"
                             onClick={toggleListening}
                             disabled={isLoading}
                             className={`p-2.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 
                             ${isListening ? 'bg-red-900/50 animate-pulse ring-red-500' : 'bg-gray-700/50 hover:bg-gray-600/50 focus:ring-purple-500'}`}
                             title={isListening ? "Stop listening" : "Start listening"}
                           >
                             <MicrophoneIcon isListening={isListening} />
                           </button>
                        )}
                        <button 
                            type="button"
                            onClick={() => setShowStorylineGenerator(s => !s)}
                            className="flex items-center gap-2 text-sm font-semibold px-3 py-2 bg-teal-600 rounded-md shadow-md hover:bg-teal-500 transition-all duration-300 disabled:opacity-50"
                            disabled={isLoading}
                            title="Get AI-powered song ideas"
                        >
                            ✨ Get Ideas
                        </button>
                    </div>
                </div>

                {showStorylineGenerator && (
                    <SongStorylineGenerator 
                        onSelectStoryline={handleSelectStoryline}
                        onClose={() => setShowStorylineGenerator(false)}
                    />
                )}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="singerGender" className="block text-sm font-medium text-gray-400 mb-2">Singer</label>
                        <select 
                            id="singerGender"
                            value={singerGender}
                            onChange={(e) => setSingerGender(e.target.value as SingerGender)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="any">Any Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="artistType" className="block text-sm font-medium text-gray-400 mb-2">Artist Type</label>
                        <select 
                            id="artistType"
                            value={artistType}
                            onChange={(e) => setArtistType(e.target.value as ArtistType)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="any">Any Type</option>
                            <option value="solo">Solo Artist</option>
                            <option value="duo">Duo</option>
                            <option value="band">Band</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="genre" className="block text-sm font-medium text-gray-400 mb-2">Genre</label>
                        <select
                            id="genre"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            {genres.map((g) => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !prompt}
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