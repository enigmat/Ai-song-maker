import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { generateMelodyFromHum } from '../services/geminiService';
import { melodyToMidiBlob, melodyToMp3 } from '../services/audioService';
import type { MelodyAnalysis } from '../services/geminiService';

interface MelodyStudioProps {
  onClose: () => void;
  onMelodySelect: (blob: Blob, melody: MelodyAnalysis) => void;
}

type Status = 'idle' | 'permission' | 'recording' | 'recorded' | 'generating' | 'success' | 'error';
const instruments = ['Piano', 'Synth Lead', 'Bass', 'Strings'];

export const MelodyStudio: React.FC<MelodyStudioProps> = ({ onClose, onMelodySelect }) => {
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [instrument, setInstrument] = useState(instruments[0]);
    const [generationTask, setGenerationTask] = useState('');

    // Result state
    const [melodyData, setMelodyData] = useState<MelodyAnalysis | null>(null);
    const [generatedStemUrl, setGeneratedStemUrl] = useState<string | null>(null);
    const [generatedStemBlob, setGeneratedStemBlob] = useState<Blob | null>(null);
    const [generatedMidiUrl, setGeneratedMidiUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Cleanup object URLs on unmount
        return () => {
            if (generatedStemUrl) URL.revokeObjectURL(generatedStemUrl);
            if (generatedMidiUrl) URL.revokeObjectURL(generatedMidiUrl);
        };
    }, [generatedStemUrl, generatedMidiUrl]);
    
    const handleStartRecording = async () => {
        setError(null);
        setStatus('permission');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
                setRecordedBlob(audioBlob);
                setStatus('recorded');
                // Stop the microphone track
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setStatus('recording');
        } catch (err) {
            console.error("Microphone permission denied:", err);
            setError("Microphone permission is required to record a melody.");
            setStatus('error');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };
    
    const handleGenerate = async () => {
        if (!recordedBlob) return;
        setStatus('generating');
        setError(null);

        try {
            setGenerationTask('Transcribing melody with AI...');
            const analysis = await generateMelodyFromHum(recordedBlob);
            setMelodyData(analysis);

            setGenerationTask(`Synthesizing ${instrument} stem...`);
            const stemBlob = await melodyToMp3(analysis.notes, instrument, analysis.bpm);
            setGeneratedStemBlob(stemBlob);
            setGeneratedStemUrl(URL.createObjectURL(stemBlob));
            
            setGenerationTask('Generating MIDI file...');
            const midiBlob = melodyToMidiBlob(analysis.notes, analysis.bpm);
            setGeneratedMidiUrl(URL.createObjectURL(midiBlob));

            setStatus('success');

        } catch (err: any) {
            console.error("Melody generation failed:", err);
            setError(err.message || "Failed to generate melody from hum. The AI may have been unable to process the audio.");
            setStatus('error');
        }
    };
    
    const handleReset = () => {
        setStatus('idle');
        setError(null);
        setRecordedBlob(null);
        setMelodyData(null);
        if (generatedStemUrl) URL.revokeObjectURL(generatedStemUrl);
        if (generatedMidiUrl) URL.revokeObjectURL(generatedMidiUrl);
        setGeneratedStemUrl(null);
        setGeneratedMidiUrl(null);
        setGeneratedStemBlob(null);
    };

    const renderContent = () => {
        switch (status) {
            case 'permission':
                return <div className="text-center text-gray-400 p-8">Requesting microphone access...</div>;
            
            case 'recording':
                return (
                     <div className="text-center p-8 flex flex-col items-center">
                        <div className="relative h-20 w-20 flex items-center justify-center">
                            <div className="absolute h-full w-full bg-red-500 rounded-full animate-ping opacity-75"></div>
                            <div className="relative h-16 w-16 bg-red-600 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" /></svg>
                            </div>
                        </div>
                        <p className="mt-4 text-lg font-semibold text-gray-300">Recording...</p>
                        <button onClick={handleStopRecording} className="mt-4 px-6 py-2 text-lg font-semibold bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Stop</button>
                    </div>
                );
            
            case 'recorded':
            case 'generating':
                return (
                     <div className="text-center p-8">
                        {status === 'generating' ? (
                            <>
                                <LoadingSpinner size="lg" />
                                <p className="mt-4 text-lg font-semibold text-gray-300 animate-pulse">{generationTask}</p>
                            </>
                        ) : (
                             <>
                                <h3 className="text-xl font-bold text-gray-200">Melody Recorded!</h3>
                                <div className="my-4">
                                    <audio src={URL.createObjectURL(recordedBlob!)} controls className="w-full" />
                                </div>
                                <div>
                                    <label htmlFor="instrument" className="block text-sm font-medium text-gray-400 mb-2">Select Instrument</label>
                                    <select id="instrument" value={instrument} onChange={(e) => setInstrument(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                                        {instruments.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                                    </select>
                                </div>
                                <div className="mt-6 flex gap-4">
                                    <button onClick={handleReset} className="w-full px-5 py-2 text-gray-300 font-semibold rounded-lg border-2 border-gray-600 hover:bg-gray-700 transition-colors">Record Again</button>
                                    <button onClick={handleGenerate} className="w-full px-5 py-2 text-white font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all">Generate Melody</button>
                                </div>
                            </>
                        )}
                    </div>
                );

            case 'success':
                 return (
                    <div className="text-center p-8">
                         <h3 className="text-xl font-bold text-gray-200">Melody Generated!</h3>
                         <p className="text-sm text-gray-400">BPM: {melodyData?.bpm}</p>
                         <div className="my-4">
                            <audio src={generatedStemUrl!} controls className="w-full" />
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <a href={generatedMidiUrl!} download="melody.mid" className="w-full flex items-center justify-center gap-2 font-semibold px-4 py-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-500 transition-all">Download MIDI</a>
                            <button onClick={() => onMelodySelect(generatedStemBlob!, melodyData!)} className="w-full flex items-center justify-center gap-2 font-semibold px-4 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-500 transition-all">Use as Instrumental</button>
                         </div>
                         <button onClick={handleReset} className="mt-4 w-full px-5 py-2 text-gray-300 font-semibold rounded-lg border-2 border-gray-600 hover:bg-gray-700 transition-colors">Start Over</button>
                    </div>
                 );
            
            case 'error':
            case 'idle':
            default:
                return (
                    <div className="text-center p-8">
                        {error && <ErrorMessage message={error} />}
                        <h3 className="text-xl font-bold text-gray-200">Ready to Record</h3>
                        <p className="mt-2 text-gray-400">Click the button below to start humming your melody.</p>
                        <button onClick={handleStartRecording} className="mt-6 px-8 py-4 text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105">
                            Start Recording
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                 <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-200">Melody Studio</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="flex-grow overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};
