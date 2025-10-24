import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { generateFeatureGuide } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const allToolNames = [
    'AI Mastering',
    'Album Generator',
    'Artist Analyzer',
    'Artist Generator',
    'Artist Profile Manager',
    'Audio Converter',
    'Beat Enhancer',
    'Bridge Builder',
    'Chord Progression Generator',
    'Co-Producer',
    'Jam Session',
    'Lyrics to Video Prompt',
    'Merch Mockup Studio',
    'Mixdown Analyzer',
    'Playlist Pitch Assistant',
    'Press Release Generator',
    'Release Toolkit',
    'Social Media Kit',
    'Song Comparator',
    'Song Explorer',
    'Song Generator',
    'Song Remixer',
    'Sound Pack Generator',
    'Studio Assistant',
    'Style Creator',
    'Vocal Synthesizer',
    'Vocal Tools',
    'YouTube Tools'
];

// Add the overview guide to the top, and sort the rest alphabetically.
const toolNames = ['MustBMusic Overview', 'MustBMusic Song Maker Overview', ...allToolNames.sort()];

const overviewGuidePrintContent = `
# MustBMusic Overview

An interactive guide is available in the application. You can view it at: https://gamma.app/embed/nvh1kahmg9pcxdm

## What is MustBMusic?

MustBMusic is more than just a songwriting tool; it's your personal co-producer, A&R executive, and marketing team, available 24/7. We leverage cutting-edge generative AI to help you create original music, refine your craft, explore and remix, and prepare for release.
`;


export const FeatureGuides: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [guides, setGuides] = useState<Record<string, string>>({});
    const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

    useEffect(() => {
        const fetchGuides = async () => {
            setStatus('loading');
            setError(null);
            try {
                const guidesToFetch = toolNames.filter(name => name !== 'MustBMusic Overview' && name !== 'MustBMusic Song Maker Overview');
                const guidePromises = guidesToFetch.map(name => generateFeatureGuide(name));
                const guideContents = await Promise.all(guidePromises);

                const guidesData: Record<string, string> = {};
                guidesToFetch.forEach((name, index) => {
                    guidesData[name] = guideContents[index];
                });

                setGuides(guidesData);
                setStatus('idle');
            } catch (err) {
                console.error("Failed to generate feature guides:", err);
                setError("Could not load the feature guides. The AI model may be busy. Please try again later.");
                setStatus('error');
            }
        };

        fetchGuides();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (status === 'loading') {
        return (
            <div className="text-center p-10 bg-gray-800/50 rounded-xl">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-400 text-lg animate-pulse">Generating feature guides...</p>
                <p className="text-sm text-gray-500">This may take a moment as the AI writes the documentation.</p>
            </div>
        );
    }
    
    if (status === 'error') {
        return <ErrorMessage message={error || 'An unknown error occurred.'} />;
    }

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            {/* Hidden printable area */}
            <div id="printable-guides-area" className="hidden print:block">
                <h1 className="text-4xl font-bold mb-4 text-center">MustBMusic Feature Guides</h1>
                <div className="guide-page-break">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{overviewGuidePrintContent}</ReactMarkdown>
                </div>
                {Object.entries(guides).sort(([a], [b]) => a.localeCompare(b)).map(([name, content]) => (
                    <div key={`print-${name}`} className="guide-page-break">
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                ))}
            </div>
            
            <style>{`
                @media print {
                    body > div > div, body > div > header, body > div > main > div > *:not(#printable-guides-area) {
                        display: none !important;
                    }
                    #root {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    #printable-guides-area {
                        display: block !important;
                        color: black;
                        background: white;
                    }
                    .guide-page-break {
                        page-break-before: always;
                    }
                    #printable-guides-area h1, #printable-guides-area h2 {
                        border-bottom: 2px solid #ccc;
                        padding-bottom: 8px;
                    }
                }
            `}</style>

            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Feature Guides
            </h2>

            {selectedGuide ? (
                <div className="mt-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => setSelectedGuide(null)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors">
                            &larr; Back to List
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">
                            Download All Guides (PDF)
                        </button>
                    </div>
                    <div className="prose prose-invert max-w-none bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                        {selectedGuide === 'MustBMusic Song Maker Overview' ? (
                             <>
                                <h1>MustBMusic Song Maker Overview</h1>
                                <h2>Video Tutorial</h2>
                                <iframe
                                    src="https://gamma.app/embed/sc3b9ejfpjarlm9"
                                    style={{ width: '700px', maxWidth: '100%', height: '450px', border: 'none', borderRadius: '8px' }}
                                    allow="fullscreen"
                                    title="MustBMusic Song Maker Overview">
                                </iframe>
                            </>
                        ) : selectedGuide === 'MustBMusic Overview' ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{overviewGuidePrintContent}</ReactMarkdown>
                        ) : selectedGuide === 'Song Generator' ? (
                            <>
                                <h1>Song Generator</h1>
                                <h2>Video Tutorial</h2>
                                <iframe
                                    src="https://gamma.app/embed/abtl5jcbpczen4m"
                                    style={{ width: '700px', maxWidth: '100%', height: '450px', border: 'none', borderRadius: '8px' }}
                                    allow="fullscreen"
                                    title="MustBMusic Song Generator">
                                </iframe>
                            </>
                        ) : selectedGuide === 'Artist Generator' ? (
                            <>
                                <h1>Artist Generator</h1>
                                <h2>Video Tutorial</h2>
                                <iframe
                                    src="https://gamma.app/embed/qhfhqoh7mpa48go"
                                    style={{ width: '700px', maxWidth: '100%', height: '450px', border: 'none', borderRadius: '8px' }}
                                    allow="fullscreen"
                                    title="Artist Generator">
                                </iframe>
                            </>
                        ) : selectedGuide === 'Album Generator' ? (
                            <>
                                <h1>Album Generator</h1>
                                <h2>Video Tutorial</h2>
                                <iframe
                                    src="https://gamma.app/embed/zgl63e509ete274"
                                    style={{ width: '700px', maxWidth: '100%', height: '450px', border: 'none', borderRadius: '8px' }}
                                    allow="fullscreen"
                                    title="Album Generator">
                                </iframe>
                            </>
                        ) : selectedGuide === 'Studio Assistant' ? (
                             <>
                                <h1>Studio Assistant</h1>
                                <h2>Video Tutorial</h2>
                                <iframe 
                                    src="https://gamma.app/embed/4lubqyef63c9wzi" 
                                    style={{ width: '700px', maxWidth: '100%', height: '450px', border: 'none', borderRadius: '8px' }} 
                                    allow="fullscreen" 
                                    title="Meet Your New Creative Partner: Studio Assistant">
                                </iframe>
                            </>
                        ) : selectedGuide === 'Song Remixer' ? (
                             <>
                                <h1>Song Remixer</h1>
                                <h2>Video Tutorial</h2>
                                <iframe 
                                    src="https://gamma.app/embed/eqhrsvuxbq5e29g" 
                                    style={{ width: '700px', maxWidth: '100%', height: '450px', border: 'none', borderRadius: '8px' }} 
                                    allow="fullscreen" 
                                    title="Song Remixer">
                                </iframe>
                            </>
                        ) : selectedGuide === 'Co-Producer' ? (
                             <>
                                <h1>Co-Producer</h1>
                                <h2>Video Tutorial</h2>
                                <iframe 
                                    src="https://gamma.app/embed/z4pkm6icievvarh" 
                                    style={{ width: '700px', maxWidth: '100%', height: '450px', border: 'none', borderRadius: '8px' }} 
                                    allow="fullscreen" 
                                    title="Meet Your Co-Producer">
                                </iframe>
                            </>
                        ) : (
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{guides[selectedGuide]}</ReactMarkdown>
                        )}
                    </div>
                </div>
            ) : (
                <div className="mt-6">
                    <div className="flex justify-end mb-4">
                         <button onClick={handlePrint} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">
                            Download All Guides (PDF)
                        </button>
                    </div>
                    <p className="text-center text-gray-400 mb-6">Select a feature below to learn more about how it works.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {toolNames.map(name => (
                            <button
                                key={name}
                                onClick={() => setSelectedGuide(name)}
                                className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg text-left font-semibold text-gray-200 hover:bg-purple-900/50 hover:border-purple-500 transition-all"
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};