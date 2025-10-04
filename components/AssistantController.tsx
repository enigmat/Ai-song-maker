import React, { useState, useEffect, useRef, useContext } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Modality, LiveServerMessage } from '@google/genai';
import { PlaybackContext } from '../contexts/PlaybackContext';
import { trackUsage } from '../services/usageService';
import { createPcmBlob } from '../services/geminiService';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const playTool: FunctionDeclaration = {
    name: 'playSong',
    description: 'Starts playing the song or beat.',
    parameters: { type: Type.OBJECT, properties: {} }
};
const stopTool: FunctionDeclaration = {
    name: 'stopSong',
    description: 'Stops or pauses the song or beat.',
    parameters: { type: Type.OBJECT, properties: {} }
};
const setBpmTool: FunctionDeclaration = {
    name: 'setBpm',
    description: 'Sets the tempo of the song.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            bpm: { type: Type.INTEGER, description: 'The new tempo in beats per minute, typically between 60 and 180.' }
        },
        required: ['bpm']
    }
};

export const AssistantController: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [lastCommand, setLastCommand] = useState('');
    const [lastResponse, setLastResponse] = useState('');

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const playbackControls = useContext(PlaybackContext);

    useEffect(() => {
        // Check for microphone support
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            setIsAvailable(true);
        }
        
        return () => {
             // Cleanup on unmount
             stopSession();
             if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
             }
        }
    }, []);

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
        setIsListening(false);
    };

    const startSession = async () => {
        if (isListening) {
            stopSession();
            return;
        }
        
        setIsListening(true);
        setLastCommand('');
        setLastResponse('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
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
                        if (message.serverContent?.inputTranscription?.text) {
                            setLastCommand(prev => prev + message.serverContent.inputTranscription.text);
                        }

                        if (message.toolCall?.functionCalls) {
                            for (const fc of message.toolCall.functionCalls) {
                                let result = 'Function executed.';
                                try {
                                    if (fc.name === 'playSong') {
                                        playbackControls.play();
                                        setLastResponse('Playing song...');
                                    } else if (fc.name === 'stopSong') {
                                        playbackControls.stop();
                                        setLastResponse('Stopping song...');
                                    } else if (fc.name === 'setBpm' && fc.args.bpm) {
                                        const bpm = Number(fc.args.bpm);
                                        playbackControls.setBpm(bpm);
                                        setLastResponse(`Tempo set to ${bpm} BPM.`);
                                    } else {
                                        result = `Unknown function: ${fc.name}`;
                                        setLastResponse(result);
                                    }
                                } catch (e) {
                                    result = `Error executing function: ${fc.name}`;
                                    setLastResponse(result);
                                }
                                
                                sessionPromiseRef.current?.then((session) => {
                                    session.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result: result } }
                                    });
                                });
                            }
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API Error:', e);
                        setLastResponse('An error occurred.');
                        stopSession();
                    },
                    onclose: (e: CloseEvent) => {
                        stopAudioProcessing();
                        setIsListening(false);
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO], // Required by API
                    tools: [{ functionDeclarations: [playTool, stopTool, setBpmTool] }],
                    inputAudioTranscription: {},
                    systemInstruction: 'You are a helpful studio assistant for a music creation app. Your goal is to execute user commands via function calls. Be concise. Only call functions when you are confident in the user\'s intent.'
                },
            });
        } catch (err) {
            console.error('Failed to get microphone access:', err);
            setLastResponse('Could not access microphone.');
            setIsListening(false);
        }
    };

    if (!isAvailable) return null;

    return (
        <>
            {isListening && (
                <div className="fixed bottom-24 right-4 sm:right-6 md:right-8 w-72 p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-40 animate-fade-in-fast">
                    <p className="text-xs text-gray-400">You said:</p>
                    <p className="text-sm text-gray-200 min-h-[20px]">{lastCommand || '...'}</p>
                    <p className="text-xs text-purple-400 mt-2">Response:</p>
                    <p className="text-sm text-teal-300 min-h-[20px]">{lastResponse || '...'}</p>
                </div>
            )}
            <button
                onClick={startSession}
                className={`fixed bottom-6 right-4 sm:right-6 md:right-8 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 z-50 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}
                title="Toggle Voice Assistant"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" />
                </svg>
            </button>
        </>
    );
};
