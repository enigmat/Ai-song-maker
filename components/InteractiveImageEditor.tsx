import React, { useState } from 'react';
import { editImage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface InteractiveImageEditorProps {
  initialImageUrl: string;
  onSave: (newImageUrl: string) => void;
  onClose: () => void;
}

// Utility to parse data URL
const parseDataUrl = (dataUrl: string): { base64: string; mimeType: string } | null => {
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) return null;
    return { mimeType: match[1], base64: match[2] };
};

export const InteractiveImageEditor: React.FC<InteractiveImageEditorProps> = ({ initialImageUrl, onSave, onClose }) => {
    const [currentImageUrl, setCurrentImageUrl] = useState(initialImageUrl);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim() || !currentImageUrl) return;

        const imageData = parseDataUrl(currentImageUrl);
        if (!imageData) {
            setError("The current image is not in a valid format.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const newImageData = await editImage(imageData.base64, imageData.mimeType, prompt);
            setCurrentImageUrl(newImageData);
            setPrompt(''); // Clear prompt on success
        } catch (err) {
            console.error("Image editing failed:", err);
            setError("Failed to edit the image. The model may not have been able to fulfill the request. Please try a different prompt.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    const handleSave = () => {
        onSave(currentImageUrl);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
            <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.1s ease-out forwards;
                }
            `}</style>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-200">Interactive Album Cover Editor</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <main className="flex-grow p-4 overflow-y-auto">
                    {error && <ErrorMessage message={error} />}
                    <div className="relative w-full aspect-square max-w-md mx-auto bg-gray-900/50 rounded-lg flex items-center justify-center overflow-hidden">
                        <img src={currentImageUrl} alt="Album cover being edited" className="max-h-full max-w-full object-contain" />
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                                <LoadingSpinner size="lg" />
                                <p className="mt-4 animate-pulse">Applying your edit...</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 max-w-md mx-auto">
                        <div className="relative">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g., 'add a moon in the sky' or 'make it watercolor'"
                                disabled={isLoading}
                                className="w-full p-3 pr-20 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !prompt.trim()}
                                className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-2 text-sm font-semibold px-3 py-1.5 bg-purple-600 rounded-md shadow-md hover:bg-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ✨ Send
                            </button>
                        </div>
                    </div>
                </main>

                <footer className="p-4 border-t border-gray-700 flex justify-end gap-4 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2 text-gray-300 font-semibold rounded-lg border-2 border-gray-600 hover:bg-gray-700 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-5 py-2 text-white font-semibold rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 transition-all">Apply Changes</button>
                </footer>
            </div>
        </div>
    );
};
