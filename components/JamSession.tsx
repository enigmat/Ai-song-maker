import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Modality, LiveServerMessage } from '@google/genai';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { createPcmBlob } from '../services/geminiService';
import { trackUsage } from '../services/usageService';

declare var Tone: any;

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const playChordProgressionTool: FunctionDeclaration = {
    name: 'playChordProgression',
    description: 'Plays a sequence of musical chords.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            chords: {
                type: Type.ARRAY,
                description: "An array of strings, where each string is a chord name (e.g., 'C4', 'Gmaj7', 'Am').",
                items: { type: Type.STRING }
            }
        },
        required: ['chords']
    }
};

const playDrumPatternTool: FunctionDeclaration = {
    name: 'playDrumPattern',
    description: 'Plays a 16-step drum pattern.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            pattern: {
                type: Type.STRING,
                description: "A JSON string representing the drum pattern. Keys can be 'kick', 'snare', 'hihat', 'clap'. Values are arrays of integers from 0 to 15."
            }
        },
        required: ['pattern']
    }
};

interface InteractionLog {
    type: 'user' | 'ai-music' | 'ai-thought' | 'status';
    content: string;
}

export const JamSession: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [log, setLog] = useState<InteractionLog[]>([]);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Tone.js refs
    const chordSynth = useRef<any>(null);
    const drumSynths = useRef<any>({});
    const drumSequence = useRef<any>(null);

    useEffect(() => {
        return () => {
            stopSession();
        };
    }, []);

    const addToLog = (entry: InteractionLog) => {
        setLog(prev => [...prev.slice(-20), entry]); // Keep log size manageable
    };

    const playChordProgression = (chords: string[]) => {
        if (!chordSynth.current) {
            chordSynth.current = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'fatsawtooth' },
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 },
            }).toDestination();
        }
        const sequence = chords.map((chord, i) => ({
            time: `0:${i}`, // Play each chord for a quarter note
            note: [`${chord}3`, `${chord}4`, `${chord}5`],
            duration: '2n',
        }));

        new Tone.Part((time, value) => {
            chordSynth.current.triggerAttackRelease(value.note, value.duration, time);
        }, sequence).start(0);

        Tone.Transport.start();
        setTimeout(() => Tone.Transport.stop(), chords.length * Tone.Time('4n').toSeconds() * 1000);
    };

    const playDrumPattern = (pattern: string) => {
        try {
            const parsedBeat = JSON.parse(pattern);
            if (!drumSynths.current.kick) {
                 drumSynths.current = {
                    kick: new Tone.MembraneSynth().toDestination(),
                    snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0 } }).toDestination(),
                    hihat: new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.01 } }).toDestination(),
                    clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0 } }).toDestination(),
                };
            }
            if (drumSequence.current) drumSequence.current.dispose();
            
            drumSequence.current = new Tone.Sequence((time, step) => {
                if (parsedBeat.kick?.includes(step)) drumSynths.current.kick.triggerAttackRelease("C1", "8n", time);
                if (parsedBeat.snare?.includes(step)) drumSynths.current.snare.triggerAttackRelease("16n", time);
                if (parsedBeat.hihat?.includes(step)) drumSynths.current.hihat.triggerAttackRelease("16n", time, 0.6);
                if (parsedBeat.clap?.includes(step)) drumSynths.current.clap.triggerAttackRelease("16n", time);
            }, Array.from({ length: 16 }, (_, i) => i), "16n").start(0);

            drumSequence.current.loop = 3; // Loop 4 times
            Tone.Transport.start();
            setTimeout(() => {
                Tone.Transport.stop();
                if (drumSequence.current) drumSequence.current.stop();
            }, 16 * Tone.Time('16n').toSeconds() * 4 * 1000);

        } catch (e) {
            console.error("Failed to parse or play drum pattern", e);
            addToLog({ type: 'status', content: 'Error playing drum pattern.' });
        }
    };
    
    const stopAudioProcessing = () => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current.onaudioprocess = null;
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };
    
    const stopSession = () => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        stopAudioProcessing();
        setStatus('idle');
        addToLog({ type: 'status', content: 'Session ended.' });
    };

    const startSession = async () => {
        if (status === 'listening' || status === 'connecting') {
            stopSession();
            return;
        }
        await Tone.start();
        setStatus('connecting');
        setError(null);
        setLog([{ type: 'status', content: 'Connecting to AI Jam Session...' }]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('listening');
                        addToLog({ type: 'status', content: 'Connected! Start humming, singing, or talking.' });

                        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        }
                        mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                             addToLog({ type: 'user', content: `User input: ${text}` });
                        }
                        if (message.toolCall?.functionCalls) {
                            for (const fc of message.toolCall.functionCalls) {
                                let result = 'Function executed.';
                                try {
                                    if (fc.name === 'playChordProgression' && fc.args.chords) {
                                        const chords = fc.args.chords as string[];
                                        addToLog({ type: 'ai-music', content: `Playing chords: ${chords.join(' - ')}` });
                                        playChordProgression(chords);
                                    } else if (fc.name === 'playDrumPattern' && fc.args.pattern) {
                                        addToLog({ type: 'ai-music', content: 'Playing a new drum pattern.' });
                                        playDrumPattern(fc.args.pattern as string);
                                    } else {
                                        result = `Unknown function: ${fc.name}`;
                                    }
                                } catch (e) {
                                    result = `Error executing function: ${fc.name}`;
                                }
                                
                                sessionPromiseRef.current?.then((session) => {
                                    session.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result } }
                                    });
                                });
                            }
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API Error:', e);
                        setError('A connection error occurred with the AI Jam Session.');
                        setStatus('error');
                        stopAudioProcessing();
                    },
                    onclose: (e: CloseEvent) => {
                        stopAudioProcessing();
                        if (status !== 'error') setStatus('idle');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    tools: [{ functionDeclarations: [playChordProgressionTool, playDrumPatternTool] }],
                    inputAudioTranscription: {},
                    systemInstruction: "You are a real-time musical collaborator. Listen to the user's musical ideas (humming, singing, or speaking) and respond with complementary chord progressions or drum patterns using the provided functions. Be creative and interactive."
                },
            });
            sessionPromiseRef.current.then(() => {
                trackUsage({ model: 'gemini-2.5-flash-native-audio-preview-09-2025', type: 'audio', seconds: 60, description: 'Jam Session (estimated 1 min)' });
            });
        } catch (err) {
            console.error('Failed to get microphone access:', err);
            setError('Could not access microphone. Please grant permission and try again.');
            setStatus('error');
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Live Jam Session
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Jam with an AI music partner in real-time. Start the session and make some noise!
            </p>
            {error && <ErrorMessage message={error} />}
            <div className="text-center mb-6">
                <button
                    onClick={startSession}
                    className={`px-8 py-4 text-xl font-semibold rounded-full shadow-lg transition-all transform hover:scale-105 w-64 ${status === 'listening' ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'}`}
                >
                    {status === 'connecting' && <LoadingSpinner />}
                    {status === 'idle' && 'Start Jamming'}
                    {status === 'error' && 'Start Jamming'}
                    {status === 'listening' && 'Stop Jamming'}
                    {status === 'connecting' && 'Connecting...'}
                </button>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 h-64 overflow-y-auto space-y-2">
                {log.map((item, index) => (
                    <p key={index} className={`text-sm ${
                        item.type === 'user' ? 'text-pink-400' : 
                        item.type === 'ai-music' ? 'text-teal-300 font-semibold' : 
                        item.type === 'status' ? 'text-gray-500 italic' : 'text-gray-300'
                    }`}>
                        {item.content}
                    </p>
                ))}
            </div>
        </div>
    );
};