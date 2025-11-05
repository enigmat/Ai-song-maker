import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { generateSamplePack, generateSpeechFromText, decode, decodeAudioData } from '../services/geminiService';
import { melodyToMp3, audioBufferToMp3 } from '../services/audioService';
import type { ArtistStyleProfile, StoredArtistProfile, SamplePack, Sample, Loop } from '../types';
import { genres, singerGenders, artistTypes, moods, tempos, melodies, harmonies, rhythms, instrumentations, atmospheres, vocalStyles } from '../constants/music';

declare var Tone: any;
declare var JSZip: any;
declare var saveAs: any;

const PROFILES_STORAGE_KEY = 'mustbmusic_artist_profiles';

const SamplePlayer: React.FC<{ sample: Sample }> = ({ sample }) => {
    const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const handleGenerateAndPlay = async () => {
        if (audioUrl) {
            new Audio(audioUrl).play();
            return;
        }
        setStatus('generating');
        try {
            const base64Audio = await generateSpeechFromText(sample.soundPrompt, 'Zephyr');
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
            const mp3Blob = audioBufferToMp3(audioBuffer);
            const url = URL.createObjectURL(mp3Blob);
            setAudioUrl(url);
            setAudioBlob(mp3Blob);
            new Audio(url).play();
            setStatus('ready');
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex items-center gap-3">
            <div className="flex-grow">
                <p className="font-semibold text-gray-200">{sample.name}</p>
                <p className="text-xs text-gray-400">{sample.description}</p>
            </div>
            <button onClick={handleGenerateAndPlay} disabled={status === 'generating'} className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50">
                {status === 'generating' ? <LoadingSpinner size="sm" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}
            </button>
            {audioBlob && <a href={audioUrl!} download={`${sample.name.replace(/ /g, '_')}.mp3`} className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>}
        </div>
    );
};

const LoopPlayer: React.FC<{ loop: Loop }> = ({ loop }) => {
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const instrument = loop.type === 'bass' ? 'Bass' : loop.type === 'chords' ? 'Strings' : 'Synth Lead';
        melodyToMp3(loop.notes, instrument, loop.bpm).then(blob => {
            setAudioUrl(URL.createObjectURL(blob));
        }).catch(console.error).finally(() => setIsLoading(false));
        return () => { if (audioUrl) URL.revokeObjectURL(audioUrl) };
    }, [loop]);

    return (
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
            <p className="font-semibold text-gray-200">{loop.name}</p>
            <p className="text-xs text-gray-400">{loop.description} ({loop.bpm} BPM)</p>
            {isLoading ? <div className="mt-2"><LoadingSpinner size="sm"/></div> : audioUrl && <audio src={audioUrl} controls loop className="w-full mt-2" />}
        </div>
    );
};


export const SamplePackGenerator: React.FC = () => {
    const [status, setStatus] = useState<'prompt' | 'generating' | 'success' | 'error'>('prompt');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SamplePack | null>(null);

    const [savedProfiles, setSavedProfiles] = useState<Record<string, StoredArtistProfile>>({});
    const [selectedProfileKey, setSelectedProfileKey] = useState<string>('custom');

    const [styleProfile, setStyleProfile] = useState<ArtistStyleProfile>({
        genre: genres[0], singerGender: 'any', artistType: 'any', mood: moods[0], tempo: tempos[2], melody: melodies[0],
        harmony: harmonies[0], rhythm: rhythms[0], instrumentation: instrumentations[0], atmosphere: atmospheres[0], vocalStyle: vocalStyles[0]
    });

    useEffect(() => {
        try {
            const rawData = localStorage.getItem(PROFILES_STORAGE_KEY);
            if (rawData) setSavedProfiles(JSON.parse(rawData));
        } catch (e) { console.error("Failed to load profiles:", e); }
    }, []);

    const handleProfileSelectionChange = (key: string) => {
        setSelectedProfileKey(key);
        if (key !== 'custom' && savedProfiles[key]) {
            setStyleProfile(savedProfiles[key].style);
        }
    };

    const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProfileKey('custom');
        const { name, value } = e.target;
        setStyleProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = async () => {
        setStatus('generating');
        setError(null);
        setResult(null);
        try {
            const pack = await generateSamplePack(styleProfile);
            setResult(pack);
            setStatus('success');
        } catch (err: any) {
            setError(err.message || "Failed to generate sample pack.");
            setStatus('error');
        }
    };
    
    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 space-y-6">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">AI Sample Pack Generator</h2>
            <p className="text-center text-gray-400 -mt-4">Generate custom-tailored samples and loops for any musical style.</p>

            {error && <ErrorMessage message={error} />}

            {status === 'generating' && <div className="text-center p-8"><LoadingSpinner size="lg" /><p className="mt-4 animate-pulse">Designing your sounds...</p></div>}
            
            {(status === 'prompt' || status === 'error') && (
                <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Select a Style</label>
                        <select value={selectedProfileKey} onChange={e => handleProfileSelectionChange(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg">
                            <option value="custom">-- Custom Style --</option>
                            {Object.keys(savedProfiles).map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(styleProfile).map(([key, value]) => (
                            <div key={key}>
                                <label className="block text-xs font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                <select name={key} value={value} onChange={handleStyleChange} className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-sm">
                                    {/* This is a simplification; assumes all options are simple strings */}
                                    {(key === 'singerGender' ? singerGenders.map(o => o.value) : key === 'artistType' ? artistTypes.map(o => o.value) : (eval(key) || [])).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleGenerate} className="w-full text-lg font-semibold p-3 bg-purple-600 rounded-lg">Generate Sample Pack</button>
                </div>
            )}
            
            {status === 'success' && result && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-bold text-center text-teal-300">{result.packName}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-xl font-semibold text-gray-300 mb-3">One-Shot Samples ({result.samples.length})</h4>
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {result.samples.map((sample, i) => <SamplePlayer key={i} sample={sample} />)}
                            </div>
                        </div>
                         <div>
                            <h4 className="text-xl font-semibold text-gray-300 mb-3">Loops ({result.loops.length})</h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {result.loops.map((loop, i) => <LoopPlayer key={i} loop={loop} />)}
                            </div>
                        </div>
                    </div>
                    <div className="text-center pt-4">
                        <button onClick={() => setStatus('prompt')} className="px-6 py-2 border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700">Generate Another Pack</button>
                    </div>
                </div>
            )}
        </div>
    );
};
