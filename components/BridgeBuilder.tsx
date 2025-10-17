import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { generateBridges } from '../services/geminiService';
import type { BridgeOption } from '../types';
import { CopyButton } from './CopyButton';

const GeneratorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

export const BridgeBuilder: React.FC = () => {
    const [status, setStatus] = useState<'prompt' | 'generating' | 'success' | 'error'>('prompt');
    const [error, setError] = useState<string | null>(null);
    const [verse, setVerse] = useState('');
    const [chorus, setChorus] = useState('');
    const [results, setResults] = useState<BridgeOption[]>([]);

    const handleGenerate = async () => {
        if (!verse.trim() || !chorus.trim()) {
            setError("Please provide both verse and chorus lyrics.");
            return;
        }
        setStatus('generating');
        setError(null);
        setResults([]);
        try {
            const bridgeOptions = await generateBridges(verse, chorus);
            setResults(bridgeOptions);
            setStatus('success');
        } catch (err) {
            console.error('Bridge generation failed:', err);
            setError('Failed to generate bridges. The AI model may be busy. Please try again.');
            setStatus('error');
        }
    };

    const handleReset = () => {
        setStatus('prompt');
        setError(null);
        setVerse('');
        setChorus('');
        setResults([]);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                The Bridge Builder
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Generate the perfect bridge to connect your song's sections.
            </p>

            {error && <ErrorMessage message={error} />}

            {status === 'prompt' && (
                <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
                    <div>
                        <label htmlFor="verse-lyrics" className="block text-sm font-medium text-gray-400 mb-2">Verse Lyrics</label>
                        <textarea id="verse-lyrics" rows={6} value={verse} onChange={(e) => setVerse(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Paste your verse lyrics here..."/>
                    </div>
                    <div>
                        <label htmlFor="chorus-lyrics" className="block text-sm font-medium text-gray-400 mb-2">Chorus Lyrics</label>
                        <textarea id="chorus-lyrics" rows={6} value={chorus} onChange={(e) => setChorus(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Paste your chorus lyrics here..."/>
                    </div>
                    <button onClick={handleGenerate} disabled={!verse.trim() || !chorus.trim()} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">
                        <GeneratorIcon /> Generate Bridges
                    </button>
                </div>
            )}

            {status === 'generating' && (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">Building bridges...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-bold text-gray-200 text-center">Your Bridge Options</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {results.map((option, index) => (
                            <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col">
                                <h4 className="text-xl font-bold text-purple-400 text-center">{option.type}</h4>
                                <div className="relative my-4 flex-grow">
                                     <CopyButton textToCopy={option.lyrics} className="absolute -top-2 right-0" />
                                    <pre className="whitespace-pre-wrap font-sans text-gray-300 text-left leading-relaxed text-sm sm:text-base bg-gray-800/50 p-3 rounded-md h-full">
                                        {option.lyrics}
                                    </pre>
                                </div>
                                <details className="text-xs group">
                                    <summary className="cursor-pointer text-gray-500 hover:text-gray-300 list-none text-center font-semibold tracking-wide uppercase">
                                        <span className="group-open:hidden">Show Explanation</span>
                                        <span className="hidden group-open:inline">Hide Explanation</span>
                                    </summary>
                                    <p className="mt-2 text-gray-400 bg-gray-800/50 p-3 rounded-md border border-gray-600/50">
                                        {option.explanation}
                                    </p>
                                </details>
                            </div>
                        ))}
                    </div>
                    <div className="text-center pt-4">
                        <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white">
                            Start Over
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};