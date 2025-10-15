import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { generateSocialMediaKit } from '../services/geminiService';
import type { SocialMediaKit } from '../types';

const SocialMediaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

const AssetCard: React.FC<{ label: string; imageUrl: string; artistName: string; releaseTitle: string }> = ({ label, imageUrl, artistName, releaseTitle }) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        const fileName = `${artistName.replace(/ /g, '_')}-${releaseTitle.replace(/ /g, '_')}-${label.replace(/ /g, '_')}.jpeg`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-200 text-center mb-3">{label}</h3>
            <div className="aspect-video bg-gray-900/50 rounded-md flex items-center justify-center overflow-hidden">
                <img src={imageUrl} alt={`Generated asset for ${label}`} className="w-full h-full object-contain" />
            </div>
            <button onClick={handleDownload} className="mt-4 w-full text-sm font-semibold px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">
                Download
            </button>
        </div>
    );
};

export const SocialMediaKitGenerator: React.FC = () => {
    const [status, setStatus] = useState<'prompt' | 'generating' | 'success' | 'error'>('prompt');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SocialMediaKit | null>(null);

    // Form state
    const [artistName, setArtistName] = useState('');
    const [releaseTitle, setReleaseTitle] = useState('');
    const [visualTheme, setVisualTheme] = useState('');

    const handleGenerate = async () => {
        if (!artistName.trim() || !releaseTitle.trim() || !visualTheme.trim()) {
            setError("Please fill out all fields to create your kit.");
            return;
        }
        setStatus('generating');
        setError(null);
        setResult(null);
        try {
            const kit = await generateSocialMediaKit(visualTheme, artistName, releaseTitle);
            setResult(kit);
            setStatus('success');
        } catch (err) {
            console.error("Social Media Kit generation failed:", err);
            setError("Failed to generate the social media kit. The AI model might be busy. Please try again.");
            setStatus('error');
        }
    };

    const handleReset = () => {
        setStatus('prompt');
        setError(null);
        setResult(null);
    };

    const renderForm = () => (
        <div className="space-y-4 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="sm-artist-name" className="block text-sm font-medium text-gray-400 mb-2">Artist Name*</label>
                    <input id="sm-artist-name" type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Starlight Velocity'" />
                </div>
                <div>
                    <label htmlFor="sm-release-title" className="block text-sm font-medium text-gray-400 mb-2">Song/Album Title*</label>
                    <input id="sm-release-title" type="text" value={releaseTitle} onChange={(e) => setReleaseTitle(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Neon Dreams'" />
                </div>
            </div>
            <div>
                <label htmlFor="sm-visual-theme" className="block text-sm font-medium text-gray-400 mb-2">Visual Theme Prompt*</label>
                <textarea id="sm-visual-theme" rows={4} value={visualTheme} onChange={(e) => setVisualTheme(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Describe the art style, colors, and subject matter for your campaign. e.g., 'Surrealist oil painting of a glowing guitar on a desolate moon, with Earth in the sky. Melancholic, dreamy, shades of deep blue and purple.'" />
            </div>
            <button onClick={handleGenerate} disabled={status === 'generating'} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">
                {status === 'generating' ? <><LoadingSpinner /> Generating...</> : <><SocialMediaIcon /> Generate Social Media Kit</>}
            </button>
        </div>
    );

    const renderSuccess = () => result && (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AssetCard label="Profile Picture (1:1)" imageUrl={result.profilePicture} artistName={artistName} releaseTitle={releaseTitle} />
                <AssetCard label="Post Image (1:1)" imageUrl={result.postImage} artistName={artistName} releaseTitle={releaseTitle} />
                <AssetCard label="Story Background (9:16)" imageUrl={result.storyImage} artistName={artistName} releaseTitle={releaseTitle} />
                <div>
                    <AssetCard label="Header/Banner (16:9)" imageUrl={result.headerImage} artistName={artistName} releaseTitle={releaseTitle} />
                    <p className="text-xs text-gray-500 text-center mt-2">Best for Twitter/X Header (may require cropping).</p>
                </div>
                <div className="md:col-span-2">
                    <AssetCard label="YouTube Thumbnail (16:9)" imageUrl={result.thumbnailImage} artistName={artistName} releaseTitle={releaseTitle} />
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
                Social Media Kit Generator
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Create a full set of branded visuals for your release campaign.
            </p>

            {error && <ErrorMessage message={error} onRetry={handleGenerate} />}
            
            {status === 'generating' ? (
                 <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">Generating your visual assets...</p>
                 </div>
            ) : status === 'success' ? renderSuccess() : renderForm()}
        </div>
    );
};