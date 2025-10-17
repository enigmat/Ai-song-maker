import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { generateMerchMockups } from '../services/geminiService';
import type { MerchKit } from '../types';

const MerchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </svg>
);

const AssetCard: React.FC<{ label: string; imageUrl: string; onDownload: () => void; }> = ({ label, imageUrl, onDownload }) => {
    return (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-200 text-center mb-3">{label}</h3>
            <div className="aspect-square bg-gray-900/50 rounded-md flex items-center justify-center overflow-hidden">
                <img src={imageUrl} alt={`Generated asset for ${label}`} className="w-full h-full object-cover" />
            </div>
            <button onClick={onDownload} className="mt-4 w-full text-sm font-semibold px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">
                Download
            </button>
        </div>
    );
};

export const MerchMockupStudio: React.FC = () => {
    const [status, setStatus] = useState<'prompt' | 'generating' | 'success' | 'error'>('prompt');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<MerchKit | null>(null);
    const [loadingStates, setLoadingStates] = useState({ tshirt: true, hoodie: true, poster: true, hat: true });

    const [artistName, setArtistName] = useState('');
    const [visualPrompt, setVisualPrompt] = useState('');

    const handleGenerate = async () => {
        if (!artistName.trim() || !visualPrompt.trim()) {
            setError("Please fill out both Artist Name and the Visual Theme prompt.");
            return;
        }
        setStatus('generating');
        setError(null);
        setResult(null);
        setLoadingStates({ tshirt: true, hoodie: true, poster: true, hat: true });

        try {
            // This service function will handle the parallel requests
            const kit = await generateMerchMockups(artistName, visualPrompt);
            setResult(kit);
            setStatus('success');
        } catch (err) {
            console.error("Merch generation failed:", err);
            setError("Failed to generate one or more mockups. The AI model might be busy. Please try again.");
            setStatus('error');
        } finally {
            // In a real scenario with streaming or individual updates, you'd set these to false one by one.
            // For this Promise.all approach, they all resolve together.
            setLoadingStates({ tshirt: false, hoodie: false, poster: false, hat: false });
        }
    };

    const handleReset = () => {
        setStatus('prompt');
        setError(null);
        setResult(null);
    };
    
    const handleDownload = (imageUrl: string, label: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        const fileName = `${artistName.replace(/ /g, '_')}_${label.replace(/ /g, '_')}.jpeg`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderForm = () => (
        <div className="space-y-4 max-w-2xl mx-auto">
            <div>
                <label htmlFor="merch-artist-name" className="block text-sm font-medium text-gray-400 mb-2">Artist Name</label>
                <input id="merch-artist-name" type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Starlight Velocity'" />
            </div>
            <div>
                <label htmlFor="merch-visual-prompt" className="block text-sm font-medium text-gray-400 mb-2">Visual Theme Prompt</label>
                <textarea id="merch-visual-prompt" rows={4} value={visualPrompt} onChange={(e) => setVisualPrompt(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Describe the art style, colors, and subject matter. e.g., 'Minimalist and geometric, using triangles and muted neon colors. A feeling of retro-futurism and melancholy.'" />
            </div>
            <button onClick={handleGenerate} disabled={status === 'generating'} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">
                {status === 'generating' ? <><LoadingSpinner /> Generating...</> : <><MerchIcon /> Generate Mockups</>}
            </button>
        </div>
    );
    
    const renderResults = () => {
        const hasResult = status === 'success' && result;
        const items: { key: keyof MerchKit, label: string }[] = [
            { key: 'tshirt', label: 'T-Shirt Mockup' },
            { key: 'hoodie', label: 'Hoodie Mockup' },
            { key: 'poster', label: 'Poster Mockup' },
            { key: 'hat', label: 'Hat Mockup' },
        ];
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {items.map(item => (
                        <div key={item.key}>
                            {status === 'generating' || (hasResult && result[item.key]) ? (
                                <AssetCard
                                    label={item.label}
                                    imageUrl={hasResult ? result[item.key] : ''}
                                    onDownload={() => handleDownload(result![item.key], item.key)}
                                />
                            ) : (
                                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 h-full flex flex-col items-center justify-center">
                                    <p className="text-gray-500">Failed to generate {item.label}.</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="text-center">
                    <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white">
                        Start Over
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Merch Mockup Studio
            </h2>
            <p className="text-center text-gray-400 mt-2 mb-6">
                Instantly visualize your brand on t-shirts, hoodies, and more.
            </p>
            {error && <ErrorMessage message={error} onRetry={handleGenerate} />}
            {status === 'prompt' || status === 'error' ? renderForm() : renderResults()}
        </div>
    );
};