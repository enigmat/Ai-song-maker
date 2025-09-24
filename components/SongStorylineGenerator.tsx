import React, { useState } from 'react';
import { generateStorylines } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface SongStorylineGeneratorProps {
  onSelectStoryline: (storyline: string) => void;
  onClose: () => void;
}

const IdeaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.333a1 1 0 01-2 0V3a1 1 0 011-1zm4.707 3.293a1 1 0 010 1.414l-1.06 1.06a1 1 0 01-1.414-1.414l1.06-1.06a1 1 0 011.414 0zM3.293 6.707a1 1 0 011.414 0l1.06 1.06a1 1 0 01-1.414 1.414l-1.06-1.06a1 1 0 010-1.414zM10 16a1 1 0 01-1-1v-1.333a1 1 0 112 0V15a1 1 0 01-1 1zm-6.707-3.293a1 1 0 010-1.414l1.06-1.06a1 1 0 111.414 1.414l-1.06 1.06a1 1 0 01-1.414 0zM16.707 11.293a1 1 0 011.414 0l1.06 1.06a1 1 0 01-1.414 1.414l-1.06-1.06a1 1 0 010-1.414zM4 10a1 1 0 01-1-1H1.667a1 1 0 110-2H3a1 1 0 011 1zm14 0a1 1 0 01-1-1h-1.333a1 1 0 110-2H17a1 1 0 011 1zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
    </svg>
);


export const SongStorylineGenerator: React.FC<SongStorylineGeneratorProps> = ({ onSelectStoryline, onClose }) => {
    const [topic, setTopic] = useState('');
    const [storylines, setStorylines] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setStorylines([]);
        try {
            const results = await generateStorylines(topic);
            setStorylines(results);
        } catch (err) {
            setError('Failed to generate ideas. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleGenerate();
        }
    };

    return (
        <div className="mt-4 p-4 bg-gray-900/70 backdrop-blur-sm rounded-lg border border-teal-500/30 animate-fade-in">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-teal-300 flex items-center gap-2">
                    <IdeaIcon/>
                    Song Idea Generator
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close idea generator">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a topic, e.g., 'haunted lighthouse'"
                    className="flex-grow p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                    disabled={isLoading}
                />
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 bg-teal-600 rounded-md shadow-md hover:bg-teal-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Get Ideas'}
                </button>
            </div>
            
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

            {isLoading && (
                <div className="mt-4 text-center">
                    <LoadingSpinner />
                    <p className="text-sm text-gray-400 mt-2">Generating song ideas...</p>
                </div>
            )}
            
            {storylines.length > 0 && (
                <div className="mt-4 space-y-3">
                    <h4 className="text-md font-semibold text-gray-300">Here are 5 ideas:</h4>
                    <ul className="space-y-3">
                        {storylines.map((story, index) => (
                            <li key={index} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 text-sm text-gray-300 flex justify-between items-start gap-3">
                                <span className="flex-grow">{index + 1}. {story}</span>
                                <button
                                    onClick={() => onSelectStoryline(story)}
                                    className="flex-shrink-0 text-xs font-semibold px-3 py-1 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-colors"
                                    title="Use this storyline for the song prompt"
                                >
                                    Use Idea
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
