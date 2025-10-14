import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { generatePressRelease } from '../services/geminiService';
import type { PressRelease } from '../types';
import { CopyButton } from './CopyButton';

declare var saveAs: any;

const PressReleaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6a1 1 0 010 2H5a1 1 0 010-2zm0 4h6a1 1 0 010 2H5a1 1 0 010-2zm0 4h6a1 1 0 010 2H5a1 1 0 010-2z" clipRule="evenodd" />
      <path d="M15 7h1a1 1 0 011 1v5.5a1.5 1.5 0 01-3 0V8a1 1 0 011-1z" />
    </svg>
);

export const PressReleaseGenerator: React.FC = () => {
    const [status, setStatus] = useState<'prompt' | 'generating' | 'success' | 'error'>('prompt');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PressRelease | null>(null);

    // Form state
    const [artistName, setArtistName] = useState('');
    const [releaseTitle, setReleaseTitle] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [story, setStory] = useState('');
    const [keywords, setKeywords] = useState('');
    const [links, setLinks] = useState('');
    
    const [fullPressReleaseText, setFullPressReleaseText] = useState('');


    const handleGenerate = async () => {
        if (!artistName.trim() || !releaseTitle.trim() || !story.trim()) {
            setError("Please fill out Artist Name, Release Title, and The Story fields.");
            return;
        }
        setStatus('generating');
        setError(null);
        setResult(null);
        try {
            const pressReleaseData = await generatePressRelease(
                artistName,
                releaseTitle,
                releaseDate,
                story,
                keywords,
                links
            );
            setResult(pressReleaseData);

            // Assemble the full text for copy/download
            const fullText = `FOR IMMEDIATE RELEASE\n\n${pressReleaseData.headline.toUpperCase()}\n\n${pressReleaseData.dateline} – ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} – ${pressReleaseData.introduction}\n\n${pressReleaseData.body.replace(/\\n\\n/g, '\n\n')}\n\n"${pressReleaseData.quote}" - ${artistName}\n\n${pressReleaseData.callToAction}\n\nAbout ${artistName}\n${pressReleaseData.aboutArtist}\n\n###`;
            setFullPressReleaseText(fullText);

            setStatus('success');
        } catch (err) {
            console.error("Press release generation failed:", err);
            setError("Failed to generate the press release. The AI model might be busy. Please try again.");
            setStatus('error');
        }
    };

    const handleReset = () => {
        setStatus('prompt');
        setError(null);
        setResult(null);
        setFullPressReleaseText('');
    };

    const handleDownload = () => {
        const blob = new Blob([fullPressReleaseText], { type: 'text/plain;charset=utf-8' });
        const fileName = `${artistName.replace(/ /g, '_')}-${releaseTitle.replace(/ /g, '_')}_press_release.txt`;
        saveAs(blob, fileName);
    };

    const renderForm = () => (
        <div className="space-y-4 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="pr-artist-name" className="block text-sm font-medium text-gray-400 mb-2">Artist Name*</label>
                    <input id="pr-artist-name" type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Starlight Velocity'" />
                </div>
                <div>
                    <label htmlFor="pr-release-title" className="block text-sm font-medium text-gray-400 mb-2">Song/Album Title*</label>
                    <input id="pr-release-title" type="text" value={releaseTitle} onChange={(e) => setReleaseTitle(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Neon Dreams'" />
                </div>
            </div>
            <div>
                <label htmlFor="pr-release-date" className="block text-sm font-medium text-gray-400 mb-2">Release Date</label>
                <input id="pr-release-date" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
                <label htmlFor="pr-story" className="block text-sm font-medium text-gray-400 mb-2">The Story Behind The Music*</label>
                <textarea id="pr-story" rows={4} value={story} onChange={(e) => setStory(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Describe the inspiration, meaning, or production process of your release..." />
            </div>
            <div>
                <label htmlFor="pr-keywords" className="block text-sm font-medium text-gray-400 mb-2">Keywords (Optional)</label>
                <input id="pr-keywords" type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., nostalgic, synth-heavy, cinematic" />
            </div>
            <div>
                <label htmlFor="pr-links" className="block text-sm font-medium text-gray-400 mb-2">Links (Optional)</label>
                <textarea id="pr-links" rows={2} value={links} onChange={(e) => setLinks(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="https://open.spotify.com/..." />
            </div>

            <button onClick={handleGenerate} disabled={status === 'generating'} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">
                {status === 'generating' ? <><LoadingSpinner /> Generating...</> : <><PressReleaseIcon /> Generate Press Release</>}
            </button>
        </div>
    );

    const renderSuccess = () => result && (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 relative">
                <div className="absolute top-4 right-4 flex gap-2">
                    <CopyButton textToCopy={fullPressReleaseText} />
                    <button onClick={handleDownload} title="Download .txt file" className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                </div>
                <div className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    <p>FOR IMMEDIATE RELEASE</p>
                    <p className="mt-4 font-bold text-lg text-white">{result.headline.toUpperCase()}</p>
                    <p className="mt-4"><span className="font-bold">{result.dateline} – {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} –</span> {result.introduction}</p>
                    <p className="mt-4">{result.body.replace(/\\n\\n/g, '\n\n')}</p>
                    <p className="mt-4 italic">"{result.quote}" - {artistName}</p>
                    <p className="mt-4">{result.callToAction}</p>
                    <p className="mt-4 font-bold">About {artistName}</p>
                    <p>{result.aboutArtist}</p>
                    <p className="mt-4 text-center">###</p>
                </div>
            </div>
             <div className="text-center">
                <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white">
                    Start Over
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Press Release Generator
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Create a professional press release to announce your music to the world.
            </p>

            {error && <ErrorMessage message={error} onRetry={handleGenerate} />}
            
            {status === 'success' ? renderSuccess() : renderForm()}
        </div>
    );
};